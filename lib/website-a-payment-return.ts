/**
 * Redirect target after Website A checkout completes on PurgoLabs SummerSteeze (PayPal / legacy Stripe).
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

/** Where "Back to Purgo Labs" sends users (Website A / Purgo Labs). */
export function getWebsiteACheckoutBackUrl(): string {
  const explicit = process.env.WEBSITE_A_CHECKOUT_BACK_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  try {
    return new URL(getWebsiteAPaymentReturnBase()).origin;
  } catch {
    return "https://www.purgolabs.com";
  }
}
