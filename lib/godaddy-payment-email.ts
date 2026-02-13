/**
 * Parse GoDaddy "You received a payment!" email to extract total, payer email, and payer name.
 * Used to match incoming payment notifications to PENDING credit card orders.
 */

export interface ParsedGoDaddyPayment {
  total: number;
  payerEmail: string | null;
  payerName: string | null;
}

/**
 * Detect if email looks like a GoDaddy payment notification (subject or from).
 */
export function isGoDaddyPaymentEmail(subject: string, from: string): boolean {
  const sub = (subject || "").toLowerCase();
  const fr = (from || "").toLowerCase();
  return (
    sub.includes("received a payment") ||
    sub.includes("you received a payment") ||
    fr.includes("godaddy") ||
    fr.includes("payments.godaddy")
  );
}

/**
 * Parse HTML or plain text body for Total amount, Payer email, and Payer name.
 * GoDaddy email shows: "Total:** $91.69", "Payer Information" with Name and Email.
 */
export function parseGoDaddyPaymentEmail(html: string | null, text: string | null): ParsedGoDaddyPayment | null {
  const body = [html || "", text || ""].join(" ");
  if (!body.trim()) return null;

  // Total: look for $XX.XX (e.g. "Total:** $91.69" or "Total</td><td>$91.69")
  const totalMatch =
    body.match(/(?:Total|total)\s*[:\*<>\/\w]*\s*\$?\s*([\d,]+\.?\d*)/i) ||
    body.match(/\$\s*([\d,]+\.?\d*)\s*(?:<\/td>|<\/div>|$)/);
  const totalStr = totalMatch ? totalMatch[1].replace(/,/g, "") : null;
  const total = totalStr ? parseFloat(totalStr) : NaN;
  if (isNaN(total) || total <= 0) return null;

  // Payer email: "Payer Email" or any email in body (prefer one near "Payer" / "email")
  let payerEmail: string | null = null;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = body.match(emailRegex) || [];
  const payerEmailMatch = body.match(/(?:Payer\s*Email|Email)\s*[:\*<>\/\w]*\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (payerEmailMatch) payerEmail = payerEmailMatch[1].trim();
  else if (emails.length > 0) payerEmail = emails[emails.length - 1].trim(); // often last email is payer

  // Payer name: "Name:" followed by text (before Card/Visa/Debit)
  let payerName: string | null = null;
  const nameMatch = body.match(/(?:Name|Payer\s*Name)\s*[:\*<>\/\w]*\s*([A-Za-z\s'-]+?)(?:\s*Card|\s*Visa|\s*Debit|<\/td|<\/div|$)/i)
    || body.match(/(?:Name|Payer)\s*[:\*]*\s*([^<\n@]+?)(?:\s*Card|$|\n)/i);
  if (nameMatch) payerName = nameMatch[1].trim().replace(/\s+/g, " ").replace(/^[\s:]+|[\s:]+$/g, "") || null;

  return {
    total: Math.round(total * 100) / 100,
    payerEmail: payerEmail || null,
    payerName: payerName || null,
  };
}
