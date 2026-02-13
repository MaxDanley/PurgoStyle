import { prisma } from "@/lib/prisma";
import { syncSubscriberToResend } from "@/lib/resend-contacts";

/**
 * Handle subscriber creation/update when a customer opts in during checkout
 */
export async function handleCheckoutSubscription(
  email: string,
  userId: string | null,
  firstName?: string,
  lastName?: string,
  isGuest: boolean = true
): Promise<void> {
  if (!email) {
    return;
  }

  try {
    // Check if user has any orders (to determine if they're a customer)
    const orderCount = await prisma.order.count({
      where: {
        OR: [
          { email },
          { userId: userId || undefined },
        ],
      },
    });

    const isCustomer = orderCount > 0;

    // Create or update Subscriber
    const subscriber = await prisma.subscriber.upsert({
      where: { email },
      update: {
        source: isGuest ? "CHECKOUT_OPT_IN" : "USER_ACCOUNT",
        status: "ACTIVE",
        userId: userId || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        promotions: true,
        newsletters: true,
        research: true,
        unsubscribedAt: null, // Re-subscribe if previously unsubscribed
      },
      create: {
        email,
        source: isGuest ? "CHECKOUT_OPT_IN" : "USER_ACCOUNT",
        status: "ACTIVE",
        userId: userId || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
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
      const resendContactId = await syncSubscriberToResend(
        email,
        firstName,
        lastName,
        {
          promotions: true,
          newsletters: true,
          research: true,
        },
        isGuest ? "checkout-opt-in" : "user-account",
        isCustomer
      );

      // Update subscriber with Resend contact ID if we got one
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
      // Log but don't fail - Resend sync is non-critical
      console.error("Failed to sync subscriber to Resend (non-critical):", resendError);
    }
  } catch (error) {
    // Log but don't fail order creation if subscriber creation fails
    console.error("Failed to create/update subscriber (non-critical):", error);
  }
}

