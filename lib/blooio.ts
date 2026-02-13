/**
 * Blooio API client for iMessage/SMS.
 * Docs: https://docs.blooio.com/
 * Base URL: https://backend.blooio.com/v2/api
 */

const BLOOIO_BASE = "https://backend.blooio.com/v2/api";

function getAuthHeader(): string | null {
  const key = process.env.BLOOIO_API_KEY || process.env.BLOOIO_KEY;
  return key ? `Bearer ${key}` : null;
}

async function blooioFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number }> {
  const auth = getAuthHeader();
  if (!auth) {
    return { error: "BLOOIO_API_KEY not set", status: 401 };
  }
  const url = path.startsWith("http") ? path : `${BLOOIO_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const text = await res.text();
  let data: T | undefined;
  try {
    if (text) data = JSON.parse(text) as T;
  } catch {
    // ignore
  }
  if (!res.ok) {
    const err = (data as { error?: string })?.error || res.statusText || text;
    return { error: err, status: res.status, data };
  }
  return { data: data as T, status: res.status };
}

/**
 * Normalize US phone to E.164 (+1XXXXXXXXXX). Returns null if not valid.
 */
export function normalizePhoneToE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

/**
 * Check if a contact supports iMessage and/or SMS.
 * GET /contacts/:contactId/capabilities
 * contactId: E.164 phone or email (URL-encoded).
 */
export async function getContactCapabilities(
  contactId: string
): Promise<{ imessage: boolean; sms: boolean } | null> {
  const encoded = encodeURIComponent(contactId);
  const { data, error } = await blooioFetch<{
    capabilities?: { imessage?: boolean; sms?: boolean };
  }>(`/contacts/${encoded}/capabilities`);
  if (error || !data?.capabilities) return null;
  return {
    imessage: data.capabilities.imessage ?? false,
    sms: data.capabilities.sms ?? false,
  };
}

/**
 * Create a contact (phone E.164 or email). Idempotent - 409 means already exists.
 * POST /contacts
 */
export async function createBlooioContact(
  identifier: string,
  name?: string
): Promise<{ id: string } | null> {
  const body: { identifier: string; name?: string } = { identifier };
  if (name) body.name = name;
  const { data, error, status } = await blooioFetch<{ id?: string }>(
    "/contacts",
    { method: "POST", body: JSON.stringify(body) }
  );
  if (status === 409) return { id: identifier }; // already exists
  if (error || !data) return null;
  return { id: (data as { id?: string }).id || identifier };
}

/**
 * Send a message to a chat (phone E.164 or email).
 * POST /chats/:chatId/messages
 * Account sends from the number linked to the API key (e.g. BLOOIO_FROM_NUMBER / +14245135800 in Blooio dashboard).
 */
export async function sendBlooioMessage(
  chatId: string,
  text: string
): Promise<{ message_id: string } | null> {
  const res = await sendBlooioMessageWithResponse(chatId, text);
  return res.ok && res.message_id ? { message_id: res.message_id } : null;
}

/**
 * Send a message and return full response (for admin test: surface 503, error message, etc.).
 */
export async function sendBlooioMessageWithResponse(
  chatId: string,
  text: string
): Promise<{ ok: boolean; message_id?: string; error?: string; status?: number }> {
  const encoded = encodeURIComponent(chatId);
  const { data, error, status } = await blooioFetch<{ message_id?: string }>(
    `/chats/${encoded}/messages`,
    { method: "POST", body: JSON.stringify({ text }) }
  );
  if (error || !data) {
    return { ok: false, error: error ?? "No response", status };
  }
  const mid = (data as { message_id?: string }).message_id;
  return { ok: true, message_id: mid, status };
}
