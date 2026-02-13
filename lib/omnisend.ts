const OMNISEND_API_KEY = process.env.OMNISEND_API_KEY;

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
  fromEmail?: string;
}

/**
 * Sends a transactional email via Omnisend API.
 * 
 * Note: Omnisend doesn't support direct transactional email sending via API.
 * They use an Events API where you send events (like "placed order") and their
 * automation system sends emails. This requires setting up automations in the Omnisend dashboard.
 * 
 * For now, we'll always fall back to Resend for reliable email delivery.
 * Omnisend is used for contact management and can optionally receive events for tracking.
 */
export async function sendEmailViaOmnisend({
  to: _to,
  subject: _subject,
  html: _html,
  fromName: _fromName = "Purgo Labs",
  fromEmail: _fromEmail = "orders@purgolabs.com",
}: SendEmailOptions) {
  // Omnisend doesn't have a direct transactional email API endpoint.
  // They use event-based automations instead. To use Omnisend for emails, you would need to:
  // 1. Set up automations in Omnisend dashboard
  // 2. Send events via the Events API (see sendEventToOmnisend)
  // 3. Let Omnisend's automation system send the emails
  //
  // For now, we'll always fall back to Resend for actual email sending.
  // Omnisend is still used for contact management/syncing.
  
  throw new Error("Omnisend doesn't support direct transactional email sending - using Resend fallback");
}

/**
 * Sends an event to Omnisend to trigger automations.
 * See: https://api-docs.omnisend.com/reference/events-overview
 */
export async function sendEventToOmnisend(
  email: string,
  eventName: string,
  properties?: Record<string, any>,
  eventID?: string
) {
  try {
    if (!OMNISEND_API_KEY) {
      console.warn("OMNISEND_API_KEY is not configured - skipping event");
      return null;
    }

    const payload: any = {
      eventName,
      origin: "api",
      contact: {
        email,
      },
    };

    if (properties) {
      payload.properties = properties;
    }

    if (eventID) {
      payload.eventID = eventID;
      payload.eventTime = new Date().toISOString();
    }

    const response = await fetch("https://api.omnisend.com/v3/events", {
      method: "POST",
      headers: {
        "X-API-Key": OMNISEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Omnisend event error: ${response.status} ${errorText}`);
      return null; // Don't throw - events are non-critical
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to send event to Omnisend:", error);
    return null; // Don't throw - events are non-critical
  }
}

/**
 * Syncs a contact to Omnisend.
 */
export async function syncContactToOmnisend(
  email: string,
  firstName?: string,
  lastName?: string,
  phone?: string,
  status: "subscribed" | "unsubscribed" | "nonSubscribed" = "nonSubscribed",
  tags: string[] = []
) {
  try {
    if (!OMNISEND_API_KEY) {
      // Don't throw for sync, just log and return
      console.warn("OMNISEND_API_KEY is not configured - skipping contact sync");
      return null;
    }

    const payload: any = {
      email,
      status,
      statusDate: new Date().toISOString(),
      tags,
      createdAt: new Date().toISOString()
    };
    
    if (firstName) payload.firstName = firstName;
    if (lastName) payload.lastName = lastName;
    if (phone) payload.phone = phone;

    const response = await fetch("https://api.omnisend.com/v3/contacts", {
      method: "POST",
      headers: {
        "X-API-Key": OMNISEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 409) {
      // Contact already exists. We should try to update it (PATCH).
      // First we need the contact ID, but we can't get it easily without searching.
      // However, usually we can ignore or try to find a way to upsert.
      // For now, logging it is safer than crashing.
      console.log(`Contact ${email} already exists in Omnisend.`);
      return { status: "exists" };
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Omnisend API error: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to sync contact to Omnisend:", error);
    throw error;
  }
}

