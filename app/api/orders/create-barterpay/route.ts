import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBarterPayTransaction } from "@/lib/barterpay";
import { calculatePointsEarned } from "@/lib/rewards";
import { validateGuestOrderInfo } from "@/lib/validation";
import { cookies } from "next/headers";

/**
 * Create an order with BarterPay payment
 * This creates the order in PENDING status and generates a BarterPay redirect URL
 */
export async function POST(req: Request) {
  try {
    const {
      items,
      shippingInfo,
      billingInfo,
      metadata,
      total,
    } = await req.json();

    console.log("🛒 Creating BarterPay order:", { items: items.length, shippingInfo });

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
    
    // No discount for BarterPay payments (only crypto and zelle get 5% discount)
    const calculatedTotal = subtotal + shippingInsurance + shippingCost - (metadata.discountAmount || 0);

    // Generate order number
    const orderNumber = `PL-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Check if user has an existing address matching the shipping info
    // Only create a new address if no matching address exists
    let shippingAddress;
    if (metadata.userId && shippingInfo.addressId) {
      // Use existing address if addressId is provided
      shippingAddress = await prisma.address.findUnique({
        where: { id: shippingInfo.addressId },
      });
      
      if (!shippingAddress) {
        // Address ID provided but not found, create new one
        shippingAddress = await prisma.address.create({
          data: {
            userId: metadata.userId,
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
    } else if (metadata.userId) {
      // Check if address already exists for this user
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
        // Create new address only if it doesn't exist
        shippingAddress = await prisma.address.create({
          data: {
            userId: metadata.userId,
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
    } else {
      // Guest user - always create new address
      shippingAddress = await prisma.address.create({
        data: {
          userId: undefined, // Guest users don't have a userId
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

    // Get base URL for callbacks
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://www.purgolabs.com";

    // Create transaction with BarterPay
    let barterPayTransaction;
    try {
      // Ensure amount is a number with 2 decimal places
      const amount = parseFloat(calculatedTotal.toFixed(2));
      
      console.log("🛒 Creating BarterPay transaction:", {
        TransactionId: orderNumber,
        Currency: "USD",
        Amount: amount,
        calculatedTotal,
      });
      
      barterPayTransaction = await createBarterPayTransaction({
        TransactionId: orderNumber,
        Currency: "USD",
        Amount: amount,
      });
    } catch (paymentError: any) {
      console.error("❌ Failed to create BarterPay transaction:", paymentError);
      return NextResponse.json(
        { error: "Something went wrong. Please try again shortly or contact support" },
        { status: 500 }
      );
    }

    // DON'T create the order yet - wait for payment confirmation via webhook
    // Store order data temporarily in PendingBarterPayOrder table
    // This prevents orders from being created if user clicks back without completing payment
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    
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

    await prisma.pendingBarterPayOrder.create({
      data: {
        orderNumber,
        transactionIndex: barterPayTransaction.transactionIndex,
        userId: metadata.userId || undefined,
        items: items as any, // Store items as JSON
        shippingInfo: {
          ...shippingInfo,
          addressId: shippingAddress.id, // Store address ID for later use
          firstName: validatedInfo.firstName, // Store validated first name
          lastName: validatedInfo.lastName, // Store validated last name
          email: validatedInfo.email, // Store validated email
        } as any,
        billingInfo: billingInfo as any,
        metadata: {
          ...metadata,
          affiliateRef: metadata.affiliateRef, // Store affiliate reference
          attribution: {
             ...attributionData,
             initialReferrer: initialReferrerCookie?.value
          }
        } as any,
        subtotal,
        shippingInsurance,
        shippingCost,
        pointsEarned,
        total: calculatedTotal,
        discountAmount: metadata.discountAmount || 0,
        expiresAt,
      },
    });

    console.log('✅ BarterPay pending order data stored (awaiting payment confirmation):', orderNumber);

    return NextResponse.json({
      success: true,
      orderNumber: orderNumber,
      redirectUrl: barterPayTransaction.redirectUrl,
      transactionIndex: barterPayTransaction.transactionIndex,
    });
  } catch (error) {
    console.error("❌ BarterPay order creation failed:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again shortly or contact support" },
      { status: 500 }
    );
  }
}

