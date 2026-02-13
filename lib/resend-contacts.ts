/**
 * Contact/list sync is disabled: we do not add customers to any Resend audience or segment.
 * These functions are no-ops for compatibility with existing callers.
 */

export interface ContactData {
  email: string;
  firstName?: string;
  lastName?: string;
  unsubscribed?: boolean;
  tags?: string[];
}

/** No-op: we do not add contacts to any list. */
export async function createOrUpdateContact(_data: ContactData): Promise<string | null> {
  return null;
}

/** No-op: we do not add contacts to any list. */
export async function removeContact(_contactIdOrEmail: string): Promise<boolean> {
  return false;
}

/** No-op: we do not sync subscribers to any list. */
export async function syncSubscriberToResend(
  _email: string,
  _firstName?: string,
  _lastName?: string,
  _preferences?: { promotions: boolean; newsletters: boolean; research: boolean },
  _source?: string,
  _isCustomer?: boolean
): Promise<string | null> {
  return null;
}

/**
 * Check if email should receive promotional emails (reads from DB only).
 */
export async function canSendPromotionalEmail(email: string): Promise<boolean> {
  const { prisma } = await import("@/lib/prisma");

  try {
    const subscriber = await (prisma as any).subscriber.findUnique({
      where: { email },
    });

    if (subscriber) {
      if (subscriber.status === "UNSUBSCRIBED") return false;
      return subscriber.promotions;
    }

    const preferences = await prisma.emailPreferences.findUnique({
      where: { email },
    });

    if (preferences) return preferences.promotions;

    return true;
  } catch (error) {
    console.error(`Error checking promotional email permission: ${error}`);
    return false;
  }
}
