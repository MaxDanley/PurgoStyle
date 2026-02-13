import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNOWPaymentsPayment } from "@/lib/nowpayments";
import { calculatePointsEarned } from "@/lib/rewards";
import { sendOrderNotificationToSupport, sendCryptoPaymentInstructions } from "@/lib/email";
import { validateGuestOrderInfo } from "@/lib/validation";
import { handleCheckoutSubscription } from "@/lib/subscriber-helpers";
import { cookies } from "next/headers";

/**
 * Create an order with crypto payment via NOWPayments
 * This creates the order in PENDING status and generates a crypto payment link
 */
export async function POST(req: Request) {
  try {
    const {
      items,
      shippingInfo,
      billingInfo,
      metadata,
      payCurrency,
    } = await req.json();

    console.log("🛒 Creating crypto order:", { items: items.length, shippingInfo });

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
    
    // Apply 5% discount for crypto payments (on subtotal + shipping + insurance)
    const baseAmount = subtotal + shippingInsurance + shippingCost;
    const paymentMethodDiscount = baseAmount * 0.05;
    
    const total = subtotal + shippingInsurance + shippingCost - (metadata.discountAmount || 0) - paymentMethodDiscount;

    // Generate order number
    const orderNumber = `PL-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Handle shipping address - check for existing or use provided addressId
    let shippingAddress;
    if (metadata.userId && shippingInfo.addressId) {
      // Use existing address if addressId is provided
      shippingAddress = await prisma.address.findUnique({
        where: { id: shippingInfo.addressId },
      });
      
      if (!shippingAddress) {
        // Address ID provided but not found, check if address exists or create new one
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
      }
    } else if (metadata.userId) {
      // Check if address already exists for this user
      const existingAddress = await prisma.address.findFirst({
        where: {
          userId: metadata.userId,
          street: shippingInfo.street,
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
          userId: null,
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
      : "http://localhost:3000";

    // Create payment with NOWPayments
    let cryptoPayment;
    try {
      cryptoPayment = await createNOWPaymentsPayment({
        price_amount: total,
        price_currency: "usd",
        pay_currency: payCurrency, // Optional: let user choose
        order_id: orderNumber,
        order_description: `Purgo Style Labs Order ${orderNumber}`,
        ipn_callback_url: `${baseUrl}/api/webhooks/nowpayments`,
        success_url: `${baseUrl}/order-confirmation?order=${orderNumber}`,
        cancel_url: `${baseUrl}/checkout?canceled=true`,
      });
    } catch (paymentError: any) {
      console.error("❌ Failed to create NOWPayments payment:", paymentError);
      return NextResponse.json(
        { error: `Failed to create crypto payment: ${paymentError.message}` },
        { status: 500 }
      );
    }

    // Calculate expiration time (typically 24 hours from NOWPayments)
    const expiresAt = cryptoPayment.expiration_estimate_date
      ? new Date(cryptoPayment.expiration_estimate_date)
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24 hours

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

    // Look up affiliate - first check QR/link ref, then check discount code used
    let affiliateId: string | undefined;
    let affiliateSource: "qr" | "discount_code" | undefined;
    
    if (metadata.affiliateRef) {
      // Affiliate from QR code or link click
      const affiliate = await prisma.affiliate.findFirst({
        where: {
          discountCode: metadata.affiliateRef.toUpperCase(),
          isActive: true,
        },
      });
      if (affiliate) {
        affiliateId = affiliate.id;
        affiliateSource = "qr";
        
        // Increment usage count for the affiliate code
        await prisma.affiliate.update({
          where: { id: affiliate.id },
          data: { usageCount: { increment: 1 } },
        });
      }
    }
    
    // If no affiliate from QR/link, check if the discount code itself is an affiliate code
    // BUT skip if discountCode is the same as affiliateRef (prevent double counting)
    const discountCodeUpper = metadata.discountCode?.toUpperCase();
    const affiliateRefUpper = metadata.affiliateRef?.toUpperCase();
    const isDifferentCode = discountCodeUpper && discountCodeUpper !== affiliateRefUpper;
    
    if (!affiliateId && isDifferentCode) {
      const affiliate = await prisma.affiliate.findFirst({
        where: {
          discountCode: discountCodeUpper,
          isActive: true,
        },
      });
      if (affiliate) {
        affiliateId = affiliate.id;
        affiliateSource = "discount_code";
        
        // Log this as a conversion from discount code usage (not a QR scan)
        await prisma.affiliateClick.create({
          data: {
            affiliateId: affiliate.id,
            source: "discount_code",
          },
        });
        
        // Increment usage count
        await prisma.affiliate.update({
          where: { id: affiliate.id },
          data: { usageCount: { increment: 1 } },
        });
      }
    }

    // Create order with PENDING payment status
    const order = await prisma.order.create({
      data: {
        userId: metadata.userId || null,
        email: validatedInfo.email, // Save validated email for guest orders
        orderNumber,
        status: "PENDING",
        subtotal,
        shippingInsurance,
        shippingCost,
        pointsEarned,
        total,
        shippingAddressId: shippingAddress.id,
        paymentMethod: "CRYPTO",
        paymentStatus: "PENDING",
        cryptoPaymentId: cryptoPayment.payment_id.toString(),
        cryptoPaymentAddress: cryptoPayment.pay_address,
        cryptoPaymentAmount: cryptoPayment.pay_amount,
        cryptoCurrency: cryptoPayment.pay_currency,
        cryptoPaymentExpiresAt: expiresAt,
        cryptoPaymentStatus: cryptoPayment.payment_status,
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
            note: `Order created with crypto payment. Payment ID: ${cryptoPayment.payment_id}. Awaiting payment confirmation.`,
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
      await handleCheckoutSubscription(
        validatedInfo.email,
        metadata.userId || null,
        shippingInfo.firstName || shippingInfo.name?.split(' ')[0],
        shippingInfo.lastName || shippingInfo.name?.split(' ').slice(1).join(' '),
        !metadata.userId // isGuest
      );
    }

    // Send emails with delay to avoid Resend rate limiting (2 emails/second)
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Send payment instructions email to customer
    if (orderWithItems && cryptoPayment) {
      try {
        await sendCryptoPaymentInstructions(
          validatedInfo.email,
          order.orderNumber,
          total,
          cryptoPayment.pay_address,
          cryptoPayment.pay_amount,
          cryptoPayment.pay_currency,
          {
            items: orderWithItems.items.map((item) => ({
              productName: item.product.name,
              variantSize: item.variant.size,
              quantity: item.quantity,
              price: item.price,
            })),
            subtotal,
            shippingInsurance,
            shippingCost,
          }
        );
        console.log("📧 Payment instructions email sent to customer for Crypto order");
      } catch (emailError) {
        console.error("❌ Failed to send payment instructions email to customer:", emailError);
        // Don't fail order creation if email fails
      }
    }

    // Wait 600ms before sending next email to stay under rate limit
    await delay(600);

    // Send notification email to support
    if (orderWithItems && orderWithItems.shippingAddress) {
      try {
        await sendOrderNotificationToSupport(order.orderNumber, {
          customerName: shippingInfo.name,
          customerEmail: validatedInfo.email,
          customerPhone: shippingInfo.phone,
          paymentMethod: "CRYPTO",
          paymentStatus: "PENDING",
          subtotal,
          shippingInsurance,
          shippingCost,
          total,
          items: orderWithItems.items.map((item) => ({
            productName: item.product.name,
            variantSize: item.variant.size,
            quantity: item.quantity,
            price: item.price,
          })),
          shippingAddress: {
            name: orderWithItems.shippingAddress.name,
            street: orderWithItems.shippingAddress.street,
            city: orderWithItems.shippingAddress.city,
            state: orderWithItems.shippingAddress.state,
            zipCode: orderWithItems.shippingAddress.zipCode,
            country: orderWithItems.shippingAddress.country || "US",
            phone: orderWithItems.shippingAddress.phone || undefined,
          },
          userId: metadata.userId || undefined,
          isGuest: !metadata.userId,
        });
        console.log("📧 Support notification email sent for Crypto order");
      } catch (emailError) {
        console.error("❌ Failed to send support notification email:", emailError);
        // Don't fail order creation if email fails
      }
    }

    console.log("✅ Crypto order created successfully:", order.orderNumber);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.total,
      },
      payment: {
        paymentId: cryptoPayment.payment_id,
        paymentStatus: cryptoPayment.payment_status,
        payAddress: cryptoPayment.pay_address,
        payAmount: cryptoPayment.pay_amount,
        payCurrency: cryptoPayment.pay_currency,
        priceAmount: cryptoPayment.price_amount,
        priceCurrency: cryptoPayment.price_currency,
        expirationDate: cryptoPayment.expiration_estimate_date,
        timeLimit: cryptoPayment.time_limit,
      },
    });
  } catch (error: any) {
    console.error("❌ Crypto order creation failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}

