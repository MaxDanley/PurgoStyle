/**
 * PayPal REST API (Orders v2) — see https://developer.paypal.com/api/rest/
 */

export function getPayPalApiBase(): string {
  const mode = (process.env.PAYPAL_MODE ?? "").trim().toLowerCase();
  return mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

/** True when calling PayPal production API (live credentials required). */
export function isPayPalLiveMode(): boolean {
  return (process.env.PAYPAL_MODE ?? "").trim().toLowerCase() === "live";
}

export async function paypalAccessToken(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID?.trim();
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!id || !secret) {
    throw new Error("PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are required");
  }
  const base = getPayPalApiBase();
  const live = isPayPalLiveMode();
  const auth = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const body = await res.text();
    const hint =
      res.status === 401
        ? ` If using Live app credentials, set PAYPAL_MODE=live in env. If using Sandbox credentials, set PAYPAL_MODE=sandbox (or omit). Mismatch causes invalid_client. Also confirm Client ID + Secret are from the same PayPal REST app and have no extra spaces.`
        : "";
    throw new Error(`PayPal OAuth failed: ${res.status} ${body}${hint}`);
  }
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

export type PayPalOrderStatus =
  | "CREATED"
  | "SAVED"
  | "APPROVED"
  | "VOIDED"
  | "COMPLETED"
  | "PAYER_ACTION_REQUIRED";

export interface PayPalOrderResponse {
  id: string;
  status: PayPalOrderStatus;
  purchase_units?: Array<{
    custom_id?: string;
    payments?: {
      captures?: Array<{ id?: string; status?: string }>;
    };
  }>;
}

export async function paypalCreateOrder(params: {
  value: string;
  currencyCode: string;
  customId: string;
  description?: string;
  /**
   * Website A / PayPal JS: prefer guest (pay with card without PayPal login) when the
   * merchant has PayPal Account Optional enabled. Maps to Orders v2
   * `payment_source.paypal.experience_context.landing_page` = GUEST_CHECKOUT (REST successor
   * to legacy SetExpressCheckout SOLUTIONTYPE=Sole + billing landing).
   */
  guestCheckoutPreferred?: boolean;
}): Promise<{ id: string }> {
  const token = await paypalAccessToken();
  const base = getPayPalApiBase();

  const purchaseUnits = [
    {
      amount: {
        currency_code: params.currencyCode.toUpperCase(),
        value: params.value,
      },
      custom_id: params.customId,
      description: params.description ?? "Order payment",
    },
  ];

  const body: Record<string, unknown> = {
    intent: "CAPTURE",
    purchase_units: purchaseUnits,
  };

  if (params.guestCheckoutPreferred) {
    body.payment_source = {
      paypal: {
        experience_context: {
          landing_page: "GUEST_CHECKOUT",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
        },
      },
    };
  } else {
    body.application_context = {
      shipping_preference: "NO_SHIPPING",
      user_action: "PAY_NOW",
    };
  }
  const res = await fetch(`${base}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`PayPal create order failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as { id: string };
}

export async function paypalGetOrder(orderId: string): Promise<PayPalOrderResponse> {
  const token = await paypalAccessToken();
  const base = getPayPalApiBase();
  const res = await fetch(`${base}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`PayPal get order failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as PayPalOrderResponse;
}

export async function paypalCaptureOrder(orderId: string): Promise<PayPalOrderResponse> {
  const token = await paypalAccessToken();
  const base = getPayPalApiBase();
  const res = await fetch(`${base}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`PayPal capture failed: ${res.status} ${text}`);
  }
  return JSON.parse(text) as PayPalOrderResponse;
}

/** Map PayPal order to a Stripe-like payment_status for Website A. */
export function paypalOrderToPaymentStatus(order: PayPalOrderResponse): "paid" | "pending" | "failed" | "unknown" {
  if (order.status === "COMPLETED") {
    const cap = order.purchase_units?.[0]?.payments?.captures?.[0];
    if (cap?.status === "COMPLETED" || cap?.status === "PENDING") {
      return cap.status === "COMPLETED" ? "paid" : "pending";
    }
    return "paid";
  }
  if (order.status === "VOIDED") return "failed";
  if (order.status === "APPROVED" || order.status === "CREATED") return "pending";
  return "unknown";
}
