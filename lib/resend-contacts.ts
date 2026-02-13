import { Resend } from "resend";
import { syncContactToOmnisend } from "@/lib/omnisend";

// Lazy initialization to avoid build-time errors
let resendInstance: Resend | null = null;

const getResend = () => {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY is not set - Resend contacts will not be synced");
      return null;
    }
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
};

// Resend configuration
// Option 1: Use audienceId (if using Resend Audiences)
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || "";

// Option 2: Use segment IDs (if using Resend Segments)
// Format: comma-separated segment IDs (e.g., "segment-id-1,segment-id-2")
// Default: Purgo Main Mailing List segment (b71f8468-7bac-40e8-ad00-3856b4b36a16)
const RESEND_SEGMENT_IDS = process.env.RESEND_SEGMENT_IDS 
  ? process.env.RESEND_SEGMENT_IDS.split(',').map(id => id.trim()).filter(Boolean)
  : ["b71f8468-7bac-40e8-ad00-3856b4b36a16"]; // Purgo Main Mailing List

export interface ContactData {
  email: string;
  firstName?: string;
  lastName?: string;
  unsubscribed?: boolean;
  tags?: string[];
}

/**
 * Create or update a contact in Resend (and Omnisend)
 * Note: This is a simplified implementation. Resend's actual API structure may vary.
 * Adjust based on Resend's actual Contacts API documentation.
 * Returns the Resend contact ID if successful, null otherwise
 */
export async function createOrUpdateContact(
  data: ContactData
): Promise<string | null> {
  // Sync to Omnisend (Parallel, non-blocking for Resend flow)
  try {
    // Determine status based on unsubscribed flag
    // If unsubscribed is true -> "unsubscribed"
    // If unsubscribed is false -> "subscribed" (assuming they are opting in if we are creating/updating)
    // Or "nonSubscribed" if just a contact? 
    // Usually createOrUpdateContact is used for newsletter signup, so "subscribed" is appropriate if not unsubscribed.
    const status = data.unsubscribed ? "unsubscribed" : "subscribed";
    
    // We don't await this to avoid blocking the main flow if Omnisend is slow, 
    // but ideally we should track errors. For now, just log.
    syncContactToOmnisend(
      data.email,
      data.firstName,
      data.lastName,
      undefined,
      status,
      data.tags
    ).then(() => {
      console.log(`✅ Synced contact ${data.email} to Omnisend`);
    }).catch(err => {
      console.error(`⚠️ Failed to sync contact ${data.email} to Omnisend:`, err);
    });
  } catch (e) {
    console.error("Omnisend sync initialization failed", e);
  }

  // If Resend API key is not configured, skip silently
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured");
    return null;
  }

  const apiKey = process.env.RESEND_API_KEY;

  try {
    // When using segments (not audiences), use REST API directly
    // The SDK requires audienceId which causes /audiences/undefined/contacts errors
    if (RESEND_SEGMENT_IDS.length > 0 && !RESEND_AUDIENCE_ID) {
      // Use REST API directly for contact creation when using segments
      const contactPayload: any = {
        email: data.email,
        unsubscribed: data.unsubscribed || false,
      };

      if (data.firstName) contactPayload.firstName = data.firstName;
      if (data.lastName) contactPayload.lastName = data.lastName;

      const response = await fetch('https://api.resend.com/contacts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // If contact already exists (409), that's okay
        if (response.status === 409 || errorText.includes("already exists")) {
          console.log(`Contact ${data.email} already exists in Resend`);
          // Still return placeholder to indicate it exists
          return `email:${data.email}`;
        }
        throw new Error(`Resend API error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      const contactId = result.id || null;

      // Add contact to segments after creation
      if (contactId && !contactId.startsWith('email:')) {
        for (const segmentId of RESEND_SEGMENT_IDS) {
          try {
            // Add delay to respect rate limits (2 requests per second = 500ms between requests)
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const segmentResponse = await fetch(`https://api.resend.com/segments/${segmentId}/contacts`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: data.email, // API expects 'email' not 'emails'
              }),
            });
            
            if (!segmentResponse.ok) {
              const errorText = await segmentResponse.text();
              // If already in segment, that's fine
              if (!errorText.includes('already') && !errorText.includes('duplicate')) {
                console.error(`Failed to add contact to segment ${segmentId}: ${segmentResponse.status} ${errorText}`);
              }
            } else {
              console.log(`✅ Added ${data.email} to segment ${segmentId}`);
            }
          } catch (segmentError) {
            console.error(`Error adding contact to segment ${segmentId}:`, segmentError);
          }
        }
      } else if (contactId?.startsWith('email:')) {
        // Contact already exists, still try to add to segments
        for (const segmentId of RESEND_SEGMENT_IDS) {
          try {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const segmentResponse = await fetch(`https://api.resend.com/segments/${segmentId}/contacts`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: data.email, // API expects 'email' not 'emails'
              }),
            });
            
            if (!segmentResponse.ok) {
              const errorText = await segmentResponse.text();
              if (!errorText.includes('already') && !errorText.includes('duplicate')) {
                console.error(`Failed to add existing contact to segment ${segmentId}: ${segmentResponse.status} ${errorText}`);
              }
            }
          } catch (segmentError) {
            console.error(`Error adding existing contact to segment ${segmentId}:`, segmentError);
          }
        }
      }

      return contactId;
    } else {
      // Using audiences - use SDK
      const resend = getResend();
      if (!resend) {
        return null;
      }

      const contactData: any = {
        email: data.email,
        unsubscribed: data.unsubscribed || false,
      };

      if (data.firstName) contactData.firstName = data.firstName;
      if (data.lastName) contactData.lastName = data.lastName;

      if (RESEND_AUDIENCE_ID) {
        contactData.audienceId = RESEND_AUDIENCE_ID;
      }

      const response = await resend.contacts.create(contactData);
      return response.data?.id || null;
    }
  } catch (error: any) {
    // If contact already exists, that's okay - we still need to add them to segments
    if (error?.status === 409 || error?.message?.includes("already exists")) {
      console.warn(`Contact ${data.email} already exists in Resend, adding to segments...`);
      
      // Even if contact already exists, try to add them to segments
      if (RESEND_SEGMENT_IDS.length > 0 && !RESEND_AUDIENCE_ID) {
        for (const segmentId of RESEND_SEGMENT_IDS) {
          try {
            const apiKey = process.env.RESEND_API_KEY;
            if (apiKey) {
              const segmentResponse = await fetch(`https://api.resend.com/segments/${segmentId}/contacts`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                },
              body: JSON.stringify({
                email: data.email, // API expects 'email' not 'emails'
              }),
              });
              
              if (!segmentResponse.ok) {
                const errorText = await segmentResponse.text();
                // If already in segment, that's fine
                if (!errorText.includes('already') && !errorText.includes('duplicate')) {
                  console.error(`Failed to add existing contact to segment ${segmentId}: ${segmentResponse.status} ${errorText}`);
                }
              }
            }
          } catch (segmentError) {
            console.error(`Error adding existing contact to segment ${segmentId}: ${segmentError}`);
          }
        }
      }
      
      // Return a placeholder ID - we'll track by email in our DB
      return `email:${data.email}`;
    }

    // Log error but don't throw - we want the app to continue working
    // even if Resend sync fails
    console.error(`Failed to sync contact to Resend (non-critical): ${error?.message || error}`);
    return null;
  }
}

/**
 * Remove a contact from Resend (unsubscribe)
 * Note: This marks as unsubscribed rather than deleting for compliance
 * Resend handles unsubscribes automatically when users click unsubscribe links
 */
export async function removeContact(
  contactIdOrEmail: string
): Promise<boolean> {
  const resend = getResend();
  if (!resend || !process.env.RESEND_API_KEY) {
    return false;
  }

  try {
    // Mark as unsubscribed using REST API
    // Resend SDK requires audienceId which we may not have
    // Use REST API directly for more flexibility
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return false;
    }

    // Try to update by contact ID or email
    // Resend API: PATCH /contacts/{contact_id}
    const response = await fetch(`https://api.resend.com/contacts/${contactIdOrEmail}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        unsubscribed: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API error: ${response.status} ${errorText}`);
    }

    return true;
  } catch (error: any) {
    // Log but don't throw - non-critical operation
    // Note: Resend automatically handles unsubscribes via unsubscribe links
    console.error(`Failed to unsubscribe contact in Resend (non-critical): ${error?.message || error}`);
    return false;
  }
}

/**
 * Sync subscriber from database to Resend
 */
export async function syncSubscriberToResend(
  email: string,
  firstName?: string,
  lastName?: string,
  preferences?: {
    promotions: boolean;
    newsletters: boolean;
    research: boolean;
  },
  source?: string,
  isCustomer?: boolean
): Promise<string | null> {
  const tags: string[] = [];

  // Add source tag
  if (source) {
    tags.push(source.toLowerCase().replace(/_/g, "-"));
  }

  // Add preference tags
  if (preferences?.promotions) {
    tags.push("promotions");
  }
  if (preferences?.newsletters) {
    tags.push("newsletters");
  }
  if (preferences?.research) {
    tags.push("research");
  }

  // Add customer tag
  if (isCustomer) {
    tags.push("customer");
  }

  return await createOrUpdateContact({
    email,
    firstName,
    lastName,
    unsubscribed: false,
    tags: tags.length > 0 ? tags : undefined,
  });
}

/**
 * Check if email should receive promotional emails
 * This checks both Subscriber status and EmailPreferences
 */
export async function canSendPromotionalEmail(email: string): Promise<boolean> {
  const { prisma } = await import("@/lib/prisma");

  try {
    // Check Subscriber status
    const subscriber = await (prisma as any).subscriber.findUnique({
      where: { email },
    });

    if (subscriber) {
      // If unsubscribed, don't send
      if (subscriber.status === "UNSUBSCRIBED") {
        return false;
      }
      // Check if promotions are enabled
      return subscriber.promotions;
    }

    // Fallback to EmailPreferences
    const preferences = await prisma.emailPreferences.findUnique({
      where: { email },
    });

    if (preferences) {
      return preferences.promotions;
    }

    // Default: allow if no preferences set (opt-in model)
    return true;
  } catch (error) {
    console.error(`Error checking promotional email permission: ${error}`);
    // Default to false on error (fail-safe)
    return false;
  }
}

