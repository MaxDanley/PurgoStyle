import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleCheckoutSubscription } from "@/lib/subscriber-helpers";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const { variantId, email, subscribeToPromotions } = await request.json();

    if (!variantId || !email) {
      return NextResponse.json(
        { error: "Variant ID and email are required" },
        { status: 400 }
      );
    }

    // Check if variant exists
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant) {
      return NextResponse.json(
        { error: "Product variant not found" },
        { status: 404 }
      );
    }

    // If stock is available, return early
    if (variant.stockCount > 0) {
      return NextResponse.json({
        message: "Product is currently in stock",
        inStock: true,
      });
    }

    const userId = session?.user?.id || null;

    // Check if notification already exists
    const existingNotification = await prisma.stockNotification.findFirst({
      where: {
        variantId,
        email,
        notified: false,
      },
    });

    if (existingNotification) {
      return NextResponse.json({
        message: "You're already on the notification list",
        alreadyExists: true,
      });
    }

    // Create notification request
    await prisma.stockNotification.create({
      data: {
        variantId,
        userId,
        email,
        notified: false,
      },
    });

    // If user opted in for promotions, create subscriber
    if (subscribeToPromotions) {
      // Use handleCheckoutSubscription but with STOCK_NOTIFICATION source
      try {
        const subscriber = await prisma.subscriber.upsert({
          where: { email },
          update: {
            source: "STOCK_NOTIFICATION",
            status: "ACTIVE",
            userId: userId || undefined,
            promotions: true,
            newsletters: true,
            research: true,
            unsubscribedAt: null,
          },
          create: {
            email,
            source: "STOCK_NOTIFICATION",
            status: "ACTIVE",
            userId: userId || undefined,
            promotions: true,
            newsletters: true,
            research: true,
          },
        });

        // Also update EmailPreferences for backward compatibility
        await prisma.emailPreferences.upsert({
          where: { email },
          update: {
            promotions: true,
            newsletters: true,
            research: true,
          },
          create: {
            email,
            promotions: true,
            newsletters: true,
            research: true,
          },
        });

        // Sync to Resend (non-blocking)
        try {
          const { syncSubscriberToResend } = await import("@/lib/resend-contacts");
          const resendContactId = await syncSubscriberToResend(
            email,
            undefined, // firstName
            undefined, // lastName
            {
              promotions: true,
              newsletters: true,
              research: true,
            },
            "stock-notification",
            false // isCustomer
          );

          if (resendContactId) {
            await prisma.subscriber.update({
              where: { id: subscriber.id },
              data: {
                resendContactId,
                lastSyncedAt: new Date(),
              },
            });
          }
        } catch (resendError) {
          console.error("Failed to sync subscriber to Resend (non-critical):", resendError);
        }
      } catch (subscriberError) {
        console.error("Failed to create subscriber (non-critical):", subscriberError);
      }
    }

    return NextResponse.json({
      message: "You'll be notified when this product is back in stock",
      success: true,
    });
  } catch (error) {
    console.error("Error creating stock notification:", error);
    return NextResponse.json(
      { error: "Failed to create stock notification" },
      { status: 500 }
    );
  }
}
