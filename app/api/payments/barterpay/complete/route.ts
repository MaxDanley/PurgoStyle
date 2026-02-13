import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBarterPayTransactionStatus, mapBarterPayStatus } from "@/lib/barterpay";
import { sendOrderConfirmationEmail, sendOrderNotificationToSupport } from "@/lib/email";
import { addPointsToUser } from "@/lib/rewards";
import { creditAffiliateCommission } from "@/lib/affiliate-commission";

/**
 * Complete BarterPay Order - Fallback mechanism
 * This endpoint is called when user is redirected back from BarterPay
 * It checks if the order exists, and if not, verifies payment and creates the order
 * This is a fallback in case the webhook doesn't fire or is delayed
 */
export async function POST(req: Request) {
  try {
    const { transactionIndex, orderNumber } = await req.json();

    if (!transactionIndex && !orderNumber) {
      return NextResponse.json(
        { error: "Transaction index or order number is required" },
        { status: 400 }
      );
    }

    console.log("🔄 Completing BarterPay order:", { transactionIndex, orderNumber });

    // First, check if order already exists
    let existingOrder = null;
    if (orderNumber) {
      existingOrder = await prisma.order.findUnique({
        where: { orderNumber },
      });
    } else if (transactionIndex) {
      existingOrder = await prisma.order.findFirst({
        where: { barterPayTransactionIndex: transactionIndex },
      });
    }

    if (existingOrder) {
      console.log(`✅ Order ${existingOrder.orderNumber} already exists`);
      return NextResponse.json({
        success: true,
        order: {
          orderNumber: existingOrder.orderNumber,
          status: existingOrder.status,
        },
      });
    }

    // Order doesn't exist - find pending order data
    const pendingOrderData = await prisma.pendingBarterPayOrder.findFirst({
      where: {
        OR: [
          transactionIndex ? { transactionIndex } : undefined,
          orderNumber ? { orderNumber } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (!pendingOrderData) {
      console.error("❌ Pending order data not found");
      return NextResponse.json(
        { error: "Pending order not found" },
        { status: 404 }
      );
    }

    // Verify payment status with BarterPay API
    if (!pendingOrderData.transactionIndex) {
      console.error("❌ Transaction index not found in pending order");
      return NextResponse.json(
        { error: "Transaction index not found" },
        { status: 400 }
      );
    }

    console.log("🔍 Checking transaction status with BarterPay API...");
    const transactionStatus = await getBarterPayTransactionStatus(pendingOrderData.transactionIndex);
    const mappedStatus = mapBarterPayStatus(transactionStatus.transactionStatus);

    console.log("📊 Transaction status:", {
      status: transactionStatus.transactionStatus,
      mappedStatus,
      amount: transactionStatus.transactionAmount,
    });

    if (mappedStatus !== "PAID") {
      console.log(`⏳ Payment not yet confirmed. Status: ${transactionStatus.transactionStatus}`);
      return NextResponse.json({
        success: false,
        pending: true,
        message: "Payment is still being processed. Please wait a moment and refresh.",
      });
    }

    // Payment confirmed - create the order
    console.log(`✅ Payment confirmed, creating order ${pendingOrderData.orderNumber}...`);

    // Parse stored data
    const items = pendingOrderData.items as any[];
    const shippingInfo = pendingOrderData.shippingInfo as any;
    const metadata = pendingOrderData.metadata as any;

    // Get or create shipping address
    let shippingAddress;
    if (shippingInfo.addressId) {
      shippingAddress = await prisma.address.findUnique({
        where: { id: shippingInfo.addressId },
      });
    }

    if (!shippingAddress) {
      // Check if address already exists for logged-in users to prevent duplicates
      if (pendingOrderData.userId) {
        const existingAddress = await prisma.address.findFirst({
          where: {
            userId: pendingOrderData.userId,
            street: shippingInfo.street,
            city: shippingInfo.city,
            state: shippingInfo.state,
            zipCode: shippingInfo.zipCode,
          },
        });
        
        if (existingAddress) {
          shippingAddress = existingAddress;
        }
      }
      
      // Create address if it doesn't exist
      if (!shippingAddress) {
        shippingAddress = await prisma.address.create({
          data: {
            userId: pendingOrderData.userId || undefined,
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

    // Look up affiliate - first check QR/link ref, then check discount code used
    let affiliateId: string | undefined;
    let affiliateSource: "qr" | "discount_code" | undefined;
    
    if (metadata?.affiliateRef) {
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
    const discountCodeUpper = metadata?.discountCode?.toUpperCase();
    const affiliateRefUpper = metadata?.affiliateRef?.toUpperCase();
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

    // Create the actual order
    const order = await prisma.order.create({
      data: {
        userId: pendingOrderData.userId || undefined,
        orderNumber: pendingOrderData.orderNumber,
        status: "PROCESSING",
        subtotal: pendingOrderData.subtotal,
        shippingInsurance: pendingOrderData.shippingInsurance || 3.50,
        shippingCost: pendingOrderData.shippingCost,
        pointsEarned: pendingOrderData.pointsEarned,
        total: pendingOrderData.total,
        shippingAddressId: shippingAddress.id,
        paymentMethod: "BARTERPAY",
        paymentStatus: "PAID",
        barterPayTransactionIndex: pendingOrderData.transactionIndex,
        affiliateId, // Track affiliate referral
        statusHistory: {
          create: {
            status: "PROCESSING",
            note: `BarterPay payment confirmed via fallback mechanism. Transaction Index: ${pendingOrderData.transactionIndex}. Amount: $${transactionStatus.transactionAmount}. Order created from pending order data.`,
          },
        },
      },
    });

    // Create order items
    for (const item of items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        },
      });
    }

    // Delete pending order data (no longer needed)
    await prisma.pendingBarterPayOrder.delete({
      where: { id: pendingOrderData.id },
    });

    console.log(`✅ Order created successfully: ${order.orderNumber}`);

    // Fetch order with relations for email sending
    const orderWithRelations = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        shippingAddress: true,
        user: true,
      },
    });

    if (!orderWithRelations) {
      throw new Error("Failed to fetch created order");
    }

    // Decrease stock for all items
    for (const item of orderWithRelations.items) {
      try {
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: {
            stockCount: {
              decrement: item.quantity,
            },
          },
        });
        console.log(`✅ Decreased stock for variant ${item.variantId} by ${item.quantity}`);
      } catch (error) {
        console.error(`❌ Failed to decrease stock for variant ${item.variantId}:`, error);
      }
    }

    // Award points to user if logged in
    if (orderWithRelations.userId && orderWithRelations.pointsEarned > 0) {
      try {
        await addPointsToUser(
          orderWithRelations.userId,
          orderWithRelations.pointsEarned,
          orderWithRelations.id,
          `Earned ${orderWithRelations.pointsEarned} points from order ${orderWithRelations.orderNumber}`
        );
        console.log(`🎯 Awarded ${orderWithRelations.pointsEarned} points to user ${orderWithRelations.userId}`);
      } catch (pointsError) {
        console.error("❌ Failed to award points:", pointsError);
      }
    }

    // Send emails with delays to avoid Resend rate limiting (2 emails/second)
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    try {
      // Get customer email - prefer order.email (for guests), fallback to user.email (for logged-in users)
      const customerEmail = (orderWithRelations as any).email || orderWithRelations.user?.email;
      
      if (!customerEmail || !customerEmail.includes('@')) {
        console.error(`❌ Cannot send email - invalid or missing email for order ${orderWithRelations.orderNumber}`);
        // Skip email sending but don't fail order creation
      } else {
        // Send order confirmation email with BarterPay payment method
        await sendOrderConfirmationEmail(
          customerEmail,
          orderWithRelations.orderNumber,
          {
            items: orderWithRelations.items.map((item) => ({
              productName: item.product.name,
              variantSize: item.variant.size,
              quantity: item.quantity,
              price: item.price,
            })),
            subtotal: orderWithRelations.subtotal,
            shippingInsurance: (orderWithRelations as any).shippingInsurance || 3.50,
            shipping: orderWithRelations.shippingCost,
            total: orderWithRelations.total,
            shippingAddress: orderWithRelations.shippingAddress
              ? {
                  name: orderWithRelations.shippingAddress.name,
                  street: orderWithRelations.shippingAddress.street,
                  city: orderWithRelations.shippingAddress.city,
                  state: orderWithRelations.shippingAddress.state,
                  zipCode: orderWithRelations.shippingAddress.zipCode,
                  country: orderWithRelations.shippingAddress.country || "US",
                }
              : undefined,
          },
          "BARTERPAY" // Pass payment method to include BarterPay message
        );
        console.log("📧 Order confirmation email sent");
      }

      // Wait 600ms before sending next email to stay under rate limit
      await delay(600);

      // Send notification email to support
      if (orderWithRelations.shippingAddress) {
        try {
          console.log(`📧 Attempting to send support notification email for BarterPay order ${orderWithRelations.orderNumber} (via complete)`);
          await sendOrderNotificationToSupport(orderWithRelations.orderNumber, {
            customerName: orderWithRelations.shippingAddress.name,
            customerEmail: (orderWithRelations as any).email || orderWithRelations.user?.email || shippingInfo?.email || metadata?.userEmail || "",
            customerPhone: orderWithRelations.shippingAddress.phone || shippingInfo?.phone,
            paymentMethod: "BARTERPAY",
            paymentStatus: "PAID",
            subtotal: orderWithRelations.subtotal,
            shippingInsurance: (orderWithRelations as any).shippingInsurance || 3.50,
            shippingCost: orderWithRelations.shippingCost,
            total: orderWithRelations.total,
            items: orderWithRelations.items.map((item) => ({
              productName: item.product.name,
              variantSize: item.variant.size,
              quantity: item.quantity,
              price: item.price,
            })),
            shippingAddress: {
              name: orderWithRelations.shippingAddress.name,
              street: orderWithRelations.shippingAddress.street,
              city: orderWithRelations.shippingAddress.city,
              state: orderWithRelations.shippingAddress.state,
              zipCode: orderWithRelations.shippingAddress.zipCode,
              country: orderWithRelations.shippingAddress.country || "US",
              phone: orderWithRelations.shippingAddress.phone || undefined,
            },
            userId: orderWithRelations.userId || undefined,
            isGuest: !orderWithRelations.userId,
          });
          console.log("📧 Support notification email sent for BarterPay order");
        } catch (supportEmailError) {
          console.error("❌ Failed to send support notification email:", supportEmailError);
          // Don't fail order creation if email fails
        }
      } else {
        console.error(`❌ Cannot send support email - shipping address missing for order ${orderWithRelations.orderNumber}`);
      }

      if (order.affiliateId) {
        try {
          await creditAffiliateCommission({
            id: order.id,
            orderNumber: order.orderNumber,
            affiliateId: order.affiliateId,
            total: order.total,
            createdAt: order.createdAt,
          });
        } catch (commissionError) {
          console.error("❌ Failed to credit affiliate commission:", commissionError);
        }
      }
    } catch (emailError) {
      console.error("❌ Failed to send confirmation email:", emailError);
      // Don't fail order creation if email fails
    }

    return NextResponse.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
      },
    });
  } catch (error: any) {
    console.error("❌ BarterPay order completion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to complete order" },
      { status: 500 }
    );
  }
}

