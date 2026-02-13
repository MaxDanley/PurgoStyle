import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { 
  createCustomer, 
  getCustomerInformation, 
  customerOneTimeDraftRTV,
  getPlaidIframeUrl 
} from "@/lib/green";
import { calculatePointsEarned } from "@/lib/rewards";
import { sendOrderConfirmationEmail, sendOrderNotificationToSupport } from "@/lib/email";
import { validateGuestOrderInfo } from "@/lib/validation";
import { cookies } from "next/headers";

/**
 * Create an order with Green eDebit payment
 * This creates the order AFTER bank account verification is complete
 * Called from process-green-payment after Plaid success
 */
export async function POST(req: Request) {
  try {
    const {
      items,
      shippingInfo,
      billingInfo,
      metadata,
      total,
      payorId, // Required: customer Payor_ID after Plaid verification
    } = await req.json();

    if (!payorId) {
      return NextResponse.json(
        { error: "Payor_ID is required. Bank account must be verified first." },
        { status: 400 }
      );
    }

    console.log("🛒 Creating Green eDebit order:", { items: items.length, shippingInfo, payorId });

    // Validate guest order information (name and email)
    let validatedInfo;
    try {
      validatedInfo = validateGuestOrderInfo(shippingInfo, metadata);
    } catch (validationError: any) {
      return NextResponse.json(
        { error: validationError.message || "Invalid order information. Please check your name and email." },
        { status: 400 }
      );
    }

    // Calculate totals (matching checkout page logic)
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const shippingInsurance = 3.50; // Required shipping insurance
    // Standard shipping is free, overnight is $50
    const shippingCost = metadata.shippingCost || 0;
    const pointsEarned = calculatePointsEarned(subtotal);
    
    // No discount for Green payments (only crypto and zelle get 5% discount)
    const calculatedTotal = subtotal + shippingInsurance + shippingCost - (metadata.discountAmount || 0);

    // Generate order number
    const orderNumber = `PL-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Handle shipping address (prevent duplicates for logged-in users)
    let shippingAddress;
    if (metadata.userId && shippingInfo.addressId) {
      shippingAddress = await prisma.address.findUnique({
        where: { id: shippingInfo.addressId },
      });
    }

    if (!shippingAddress) {
      if (metadata.userId) {
        const existingAddress = await prisma.address.findFirst({
          where: {
            userId: metadata.userId,
            street: shippingInfo.street,
            apartment: shippingInfo.apartment || null,
            city: shippingInfo.city,
            state: shippingInfo.state,
            zipCode: shippingInfo.zipCode,
          },
        });
        
        if (existingAddress) {
          shippingAddress = existingAddress;
        } else {
          shippingAddress = await prisma.address.create({
            data: {
              userId: metadata.userId,
              name: shippingInfo.name,
              street: shippingInfo.street,
              city: shippingInfo.city,
              state: shippingInfo.state,
              zipCode: shippingInfo.zipCode,
              country: shippingInfo.country || "US",
              phone: shippingInfo.phone,
              isDefault: false,
            },
          });
        }
      } else {
        shippingAddress = await prisma.address.create({
          data: {
            userId: undefined,
            name: shippingInfo.name,
            street: shippingInfo.street,
            apartment: shippingInfo.apartment || null,
            city: shippingInfo.city,
            state: shippingInfo.state,
            zipCode: shippingInfo.zipCode,
            country: shippingInfo.country || "US",
            phone: shippingInfo.phone,
            isDefault: false,
          },
        });
      }
    }

    // Payor_ID should already exist (created before Plaid verification)
    const customerPayorId = payorId;
    
    // Verify customer exists and has bank account registered
    const customerInfo = await getCustomerInformation(customerPayorId);
    if (!customerInfo.RoutingNumber || !customerInfo.AccountNumber) {
      throw new Error("Bank account not verified. Please complete Plaid verification first.");
    }
    
    console.log(`✅ Using existing Green customer: ${customerPayorId}`);

    // Retrieve attribution data from cookies
    const cookieStore = await cookies();
    const attributionCookie = cookieStore.get("purgo_attribution");
    const initialReferrerCookie = cookieStore.get("purgo_initial_referrer");
    
    let attributionData: any = {};
    if (attributionCookie) {
      try {
        attributionData = JSON.parse(attributionCookie.value);
      } catch {
        // Ignore parsing errors
      }
    }

    // Create order in PENDING status (will be updated after payment)
    const order = await prisma.order.create({
      data: {
        userId: metadata.userId || undefined,
        email: validatedInfo.email, // Save validated email for guest orders
        orderNumber,
        status: "PENDING",
        subtotal,
        shippingInsurance,
        shippingCost,
        shippingMethod: metadata.shippingMethod,
        pointsEarned,
        total: calculatedTotal,
        shippingAddressId: shippingAddress.id,
        paymentMethod: "EDEBIT",
        paymentStatus: "PENDING",
        greenPayorId: customerPayorId,
        discountAmount: metadata.discountAmount || 0,
        
        // Add attribution
        attributionSource: attributionData.source,
        attributionMedium: attributionData.medium,
        attributionCampaign: attributionData.campaign,
        attributionContent: attributionData.content,
        attributionTerm: attributionData.term,
        initialReferrer: initialReferrerCookie?.value,

        smsOptIn: metadata.smsOptIn === true,
        statusHistory: {
          create: {
            status: "PENDING",
            note: `Green eDebit order created. Payor_ID: ${customerPayorId}. Awaiting bank account verification via Plaid.`,
          },
        },
      },
    });
    if (metadata.userId && metadata.smsOptIn === true) {
      await prisma.user.update({
        where: { id: metadata.userId },
        data: { smsOptIn: true },
      });
    }

    // Create order items
    for (const item of items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
          isBackorder: item.isBackorder || false,
        },
      });
    }

    console.log(`✅ Green eDebit order created: ${order.orderNumber}`);

    return NextResponse.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        id: order.id,
      },
      payorId: customerPayorId,
    });
  } catch (error: any) {
    console.error("❌ Green eDebit order creation failed:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong. Please try again shortly or contact support" },
      { status: 500 }
    );
  }
}

