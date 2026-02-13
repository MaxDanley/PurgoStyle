import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePointsEarned } from "@/lib/rewards";
import { sendOrderNotificationToSupport, sendVenmoPaymentInstructions } from "@/lib/email";
import { validateGuestOrderInfo } from "@/lib/validation";
import { handleCheckoutSubscription } from "@/lib/subscriber-helpers";
import { cookies } from "next/headers";

/**
 * Create an order with Venmo payment
 * This creates the order in PENDING status and provides Venmo payment instructions
 */
export async function POST(req: Request) {
  try {
    const {
      items,
      shippingInfo,
      billingInfo,
      metadata,
    } = await req.json();

    console.log("🛒 Creating Venmo order:", { items: items.length, shippingInfo });

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
    
    // Apply 5% discount for Venmo payments (on subtotal + shipping + insurance) - Matching Zelle logic
    const baseAmount = subtotal + shippingInsurance + shippingCost;
    const paymentMethodDiscount = baseAmount * 0.05;
    
    const total = subtotal + shippingInsurance + shippingCost - (metadata.discountAmount || 0) - paymentMethodDiscount;

    // Generate order number
    const orderNumber = `PL-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Check if user has an existing address matching the shipping info
    let shippingAddress = await prisma.address.findFirst({
      where: {
        userId: metadata.userId || undefined,
        street: shippingInfo.street,
        zipCode: shippingInfo.zipCode,
      },
    });

    // If no existing address, create one
    if (!shippingAddress) {
      shippingAddress = await prisma.address.create({
        data: {
          userId: metadata.userId || undefined,
          name: shippingInfo.name || `${shippingInfo.firstName} ${shippingInfo.lastName}`,
          street: shippingInfo.street,
          apartment: shippingInfo.apartment || null,
          city: shippingInfo.city,
          state: shippingInfo.state,
          zipCode: shippingInfo.zipCode,
          country: shippingInfo.country || "US",
          phone: shippingInfo.phone || null,
        },
      });
    }

    // Handle affiliate tracking
    const affiliateId = metadata.affiliateRef ? metadata.affiliateRef : undefined;

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

    // Handle discount code usage
    if (metadata.discountCode) {
      const discountCode = await prisma.discountCode.findUnique({
        where: { code: metadata.discountCode },
      });

      if (discountCode) {
        await prisma.discountCode.update({
          where: { id: discountCode.id },
          data: { usageCount: { increment: 1 } },
        });
      }
    }

    // Create order with PENDING payment status
    const order = await prisma.order.create({
      data: {
        userId: metadata.userId || undefined,
        email: validatedInfo.email, // Save validated email for guest orders
        orderNumber,
        status: "PENDING",
        subtotal,
        shippingInsurance,
        shippingCost,
        pointsEarned,
        total,
        shippingAddressId: shippingAddress.id,
        paymentMethod: "VENMO",
        paymentStatus: "PENDING",
        shippingMethod: (metadata.shippingMethod as string) || "ground",
        affiliateId, // Track affiliate referral
        
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
            note: `Order created with Venmo payment. Awaiting payment confirmation. Payment should be sent to @purgolabs on Venmo with note "Online Goods".`,
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

    // Create order items (but don't decrease stock yet - wait for payment confirmation)
    for (const item of items) {
      try {
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
      } catch (error) {
        console.error(`❌ Failed to create order item for product ${item.productId}:`, error);
      }
    }

    // Fetch order with items and product info for email
    const orderWithItems = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        shippingAddress: true,
      },
    });

    // Handle subscription if user opted in
    if (metadata.subscribeToPromotions) {
      await handleCheckoutSubscription(validatedInfo.email, validatedInfo.firstName);
    }

    // Send order notifications
    if (orderWithItems) {
      // 1. Send Venmo payment instructions to customer
      try {
        await sendVenmoPaymentInstructions(
          validatedInfo.email,
          order.orderNumber,
          total,
          {
            items: orderWithItems.items.map(item => ({
              productName: item.product.name,
              variantSize: item.variant.size,
              quantity: item.quantity,
              price: item.price
            })),
            subtotal,
            shippingInsurance,
            shippingCost
          }
        );
      } catch (emailError) {
        console.error("Failed to send Venmo instructions email:", emailError);
      }

      // 2. Send notification to support
      const customerName = `${shippingInfo.firstName} ${shippingInfo.lastName}`;
      
      // Prepare detailed order info for support email
      const supportOrderDetails = {
        customerName,
        customerEmail: validatedInfo.email,
        customerPhone: shippingInfo.phone,
        paymentMethod: "VENMO",
        paymentStatus: "PENDING",
        subtotal,
        shippingInsurance,
        shippingCost,
        total,
        items: orderWithItems.items.map(item => ({
          productName: item.product.name,
          variantSize: item.variant.size,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: {
          name: shippingAddress.name,
          street: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zipCode: shippingAddress.zipCode,
          country: shippingAddress.country,
          phone: shippingAddress.phone || undefined
        },
        userId: metadata.userId || undefined,
        isGuest: metadata.isGuest
      };

      try {
        await sendOrderNotificationToSupport(order.orderNumber, supportOrderDetails);
      } catch (supportEmailError) {
        console.error("Failed to send support notification email:", supportEmailError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      order: {
        orderNumber: order.orderNumber,
        total: order.total
      } 
    });

  } catch (error: any) {
    console.error("Error creating Venmo order:", error);
    return NextResponse.json(
      { error: "Failed to create order. Please try again." },
      { status: 500 }
    );
  }
}
