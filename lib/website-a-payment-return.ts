/**
 * Redirect target after Website A checkout completes on Summer Steeze (PayPal / legacy Stripe).
 */
const DEFAULT_RETURN = "https://www.purgolabs.com/payment-return";

export function getWebsiteAPaymentReturnBase(): string {
  return (process.env.WEBSITE_A_PAYMENT_RETURN_URL ?? DEFAULT_RETURN).replace(/\/$/, "");
}

export function buildWebsiteAPaymentReturnUrl(params: {
  sessionId: string;
  clientReferenceId: string;
  paymentStatus: string;
}): string {
  const base = getWebsiteAPaymentReturnBase();
  const u = new URLSearchParams({
    session_id: params.sessionId,
    payment_status: params.paymentStatus,
    client_reference_id: params.clientReferenceId,
  });
  return `${base}?${u.toString()}`;
}
