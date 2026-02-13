import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { 
  getCustomerInformation, 
  customerOneTimeDraftRTV,
  customerOneTimeDraftBV 
} from "@/lib/green";
import { sendOrderConfirmationEmail, sendOrderNotificationToSupport } from "@/lib/email";
import { addPointsToUser, calculatePointsEarned } from "@/lib/rewards";
import { creditAffiliateCommission } from "@/lib/affiliate-commission";
import { validateGuestOrderInfo } from "@/lib/validation";
import { handleCheckoutSubscription } from "@/lib/subscriber-helpers";
import { cookies } from "next/headers";

/**
 * Process Green eDebit payment after Plaid bank account verification
 * Creates order first, then processes payment
 * POST /api/orders/process-green-payment
 */
export async function POST(req: Request) {
  try {
    const {
      payorId,
      items,
      shippingInfo,
      billingInfo,
      metadata,
      total,
      verificationType = "RTV", // RTV (Real-Time) or BV (Batch)
    } = await req.json();

    if (!payorId) {
      return NextResponse.json(
        { error: "Payor_ID is required" },
        { status: 400 }
      );
    }

    // Verify customer has bank account registered
    const customerInfo = await getCustomerInformation(payorId);
    
    if (!customerInfo.RoutingNumber || !customerInfo.AccountNumber) {
      return NextResponse.json(
        { error: "Bank account not registered. Please complete Plaid verification first." },
        { status: 400 }
      );
    }

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

    // Create order first
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
        total: calculatedTotal,
        shippingAddressId: shippingAddress.id,
        paymentMethod: "EDEBIT",
        paymentStatus: "PENDING",
        greenPayorId: payorId,
        discountAmount: metadata.discountAmount || 0,
        affiliateId, // Track affiliate referral
        
        // Add attribution
        attributionSource: attributionData.source,
        attributionMedium: attributionData.medium,
        attributionCampaign: attributionData.campaign,
        attributionContent: attributionData.content,
        attributionTerm: attributionData.term,
        initialReferrer: initialReferrerCookie?.value,

        statusHistory: {
          create: {
            status: "PENDING",
            note: `Green eDebit order created. Payor_ID: ${payorId}. Processing payment...`,
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
          isBackorder: item.isBackorder || false,
        },
      });
    }

    console.log(`✅ Green eDebit order created: ${order.orderNumber}`);

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

    // Get order with relations for payment processing
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
      throw new Error("Failed to retrieve created order");
    }

    // Format check date (today)
    const checkDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Process payment draft
    const draftData = {
      Payor_ID: payorId,
      CheckAmount: orderWithRelations.total.toFixed(2),
      CheckDate: checkDate,
      CheckMemo: `Order ${orderWithRelations.orderNumber}`,
    };

    let draftResult;
    if (verificationType === "RTV") {
      draftResult = await customerOneTimeDraftRTV(draftData);
    } else {
      draftResult = await customerOneTimeDraftBV(draftData);
    }

    // Check if Result indicates success
    // Green API uses: 0 (numeric) or "0" (string) for success, or "success"/"approved" (strings)
    const result = draftResult.Result;
    const resultNum = result !== undefined && result !== null ? parseInt(String(result), 10) : null;
    const resultStr = result !== undefined && result !== null ? String(result).toLowerCase() : '';
    
    // Success if: numeric 0, string "0", "success", or "approved"
    const isSuccess = resultNum === 0 || resultStr === '0' || resultStr === 'success' || resultStr === 'approved';
    
    if (!isSuccess) {
      console.error(`❌ Green payment failed for order ${order.orderNumber}. Result: ${result}, Description: ${draftResult.ResultDescription}`);
      
      // Payment failed - delete the order we just created so it doesn't stay in pending
      try {
        await prisma.order.delete({
          where: { id: order.id }
        });
        console.log(`🗑️ Deleted failed order ${order.orderNumber}`);
      } catch (deleteError) {
        console.error(`❌ Failed to delete failed order ${order.orderNumber}:`, deleteError);
      }

      return NextResponse.json(
        { error: draftResult.ResultDescription || "Payment processing failed" },
        { status: 400 }
      );
    }
    
    // Log VerifyResult if present (informational - payment was still accepted if Result is 0)
    if (draftResult.VerifyResult !== undefined && draftResult.VerifyResult !== null) {
      const verifyResultNum = parseInt(String(draftResult.VerifyResult), 10);
      if (verifyResultNum !== 0) {
        console.log(`[Green API] Payment accepted (Result: ${result}) but VerifyResult: ${draftResult.VerifyResult} - ${draftResult.VerifyResultDescription || 'N/A'}`);
      }
    }

    // Update order with payment information
    const updatedOrder = await prisma.order.update({
      where: { id: orderWithRelations.id },
      data: {
        paymentStatus: verificationType === "RTV" ? "PAID" : "PENDING", // BV is pending until batch processes
        status: verificationType === "RTV" ? "PROCESSING" : "PENDING",
        greenTransactionId: draftResult.Transaction_ID || draftResult.Check_ID,
        greenCheckNumber: draftResult.CheckNumber,
        greenVerificationType: verificationType,
        statusHistory: {
          create: {
            status: verificationType === "RTV" ? "PROCESSING" : "PENDING",
            note: `Green eDebit payment processed via ${verificationType}. Transaction ID: ${draftResult.Transaction_ID || draftResult.Check_ID || 'N/A'}. Check Number: ${draftResult.CheckNumber || 'N/A'}.${draftResult.VerifyResultDescription ? ` Verify Note: ${draftResult.VerifyResultDescription}` : ''}`,
          },
        },
      },
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

    // Decrease stock for all items (skip backordered items)
    for (const item of updatedOrder.items) {
      // Skip stock decrement for backordered items
      if (item.isBackorder) {
        console.log(`⏳ Skipping stock decrement for backordered item ${item.variantId}`);
        continue;
      }
      
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
    if (updatedOrder.userId && updatedOrder.pointsEarned > 0) {
      try {
        await addPointsToUser(
          updatedOrder.userId,
          updatedOrder.pointsEarned,
          updatedOrder.id,
          `Earned ${updatedOrder.pointsEarned} points from order ${updatedOrder.orderNumber}`
        );
        console.log(`🎯 Awarded ${updatedOrder.pointsEarned} points to user ${updatedOrder.userId}`);
      } catch (pointsError) {
        console.error("❌ Failed to award points:", pointsError);
      }
    }

    // Send confirmation emails with delays to avoid Resend rate limiting (2 emails/second)
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    try {
      // Get customer email - prefer order.email (for guests), fallback to user.email (for logged-in users)
      const customerEmail = (updatedOrder as any).email || updatedOrder.user?.email;
      
      if (!customerEmail || !customerEmail.includes('@')) {
        console.error(`❌ Cannot send email - invalid or missing email for order ${updatedOrder.orderNumber}`);
        // Skip email sending but don't fail order processing
      } else {
        await sendOrderConfirmationEmail(
          customerEmail,
          updatedOrder.orderNumber,
          {
            items: updatedOrder.items.map((item) => ({
              productName: item.product.name,
              variantSize: item.variant.size,
              quantity: item.quantity,
              price: item.price,
              isBackorder: item.isBackorder,
            })),
            subtotal: updatedOrder.subtotal,
            shippingInsurance: (updatedOrder as any).shippingInsurance || 3.50,
            shipping: updatedOrder.shippingCost,
            total: updatedOrder.total,
            shippingAddress: updatedOrder.shippingAddress
              ? {
                  name: updatedOrder.shippingAddress.name,
                  street: updatedOrder.shippingAddress.street,
                  city: updatedOrder.shippingAddress.city,
                  state: updatedOrder.shippingAddress.state,
                  zipCode: updatedOrder.shippingAddress.zipCode,
                  country: updatedOrder.shippingAddress.country || "US",
                }
              : undefined,
          },
          "EDEBIT"
        );
        console.log("📧 Order confirmation email sent");
      }

      // Wait 600ms before sending next email to stay under rate limit
      await delay(600);

      // Send notification email to support
      if (updatedOrder.shippingAddress) {
        await sendOrderNotificationToSupport(updatedOrder.orderNumber, {
          customerName: updatedOrder.shippingAddress.name,
          customerEmail: (updatedOrder as any).email || updatedOrder.user?.email || validatedInfo.email || "",
          customerPhone: updatedOrder.shippingAddress.phone || undefined,
          paymentMethod: "EDEBIT",
          paymentStatus: verificationType === "RTV" ? "PAID" : "PENDING",
          subtotal: updatedOrder.subtotal,
          shippingInsurance: (updatedOrder as any).shippingInsurance || 3.50,
          shippingCost: updatedOrder.shippingCost,
          total: updatedOrder.total,
          items: updatedOrder.items.map((item) => ({
            productName: item.product.name,
            variantSize: item.variant.size,
            quantity: item.quantity,
            price: item.price,
            isBackorder: item.isBackorder,
          })),
          shippingAddress: {
            name: updatedOrder.shippingAddress.name,
            street: updatedOrder.shippingAddress.street,
            city: updatedOrder.shippingAddress.city,
            state: updatedOrder.shippingAddress.state,
            zipCode: updatedOrder.shippingAddress.zipCode,
            country: updatedOrder.shippingAddress.country || "US",
            phone: updatedOrder.shippingAddress.phone || undefined,
          },
          userId: updatedOrder.userId || undefined,
          isGuest: !updatedOrder.userId,
        });
        console.log("📧 Support notification email sent for Green eDebit order");
      }

      if (verificationType === "RTV" && (updatedOrder as any).affiliateId) {
        try {
          await creditAffiliateCommission({
            id: updatedOrder.id,
            orderNumber: updatedOrder.orderNumber,
            affiliateId: (updatedOrder as any).affiliateId,
            total: updatedOrder.total,
            createdAt: updatedOrder.createdAt,
          });
        } catch (commissionError) {
          console.error("❌ Failed to credit affiliate commission:", commissionError);
        }
      }
    } catch (emailError) {
      console.error("❌ Failed to send confirmation email:", emailError);
      // Don't fail payment processing if email fails
    }

    return NextResponse.json({
      success: true,
      order: {
        orderNumber: updatedOrder.orderNumber,
        id: updatedOrder.id,
        paymentStatus: updatedOrder.paymentStatus,
        status: updatedOrder.status,
        transactionId: draftResult.Transaction_ID,
        checkNumber: draftResult.CheckNumber,
      },
    });
  } catch (error: any) {
    console.error("❌ Green payment processing failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process payment" },
      { status: 500 }
    );
  }
}

