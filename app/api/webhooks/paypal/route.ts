import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getPayPalApiBase, paypalAccessToken } from "@/lib/paypal";

export const runtime = "nodejs";

/**
 * PayPal webhooks — configure in PayPal Developer Dashboard → Webhooks.
 *
 * URL: https://www.summersteez.com/api/webhooks/paypal  (or your NEXT_PUBLIC_BASE_URL)
 *
 * Subscribe at minimum:
 * - PAYMENT.CAPTURE.COMPLETED  (marks order PAID if capture succeeds async)
 *
 * Optional:
 * - PAYMENT.CAPTURE.DENIED
 *
 * Set PAYPAL_WEBHOOK_ID to the webhook’s ID from the dashboard for signature verification.
 * Docs: https://developer.paypal.com/api/rest/webhooks/rest/v1/notifications/verify-webhook-signature/
 */

interface PayPalWebhookEvent {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string;
    custom_id?: string;
    supplementary_data?: { related_ids?: { order_id?: string } };
  };
}

async function verifyWebhookSignature(
  body: string,
  event: PayPalWebhookEvent
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
  if (!webhookId) {
    console.warn("[paypal webhook] PAYPAL_WEBHOOK_ID not set — skipping signature verification");
    return true;
  }

  const h = await headers();
  const transmissionId = h.get("paypal-transmission-id");
  const transmissionTime = h.get("paypal-transmission-time");
  const certUrl = h.get("paypal-cert-url");
  const authAlgo = h.get("paypal-auth-algo");
  const transmissionSig = h.get("paypal-transmission-sig");

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return false;
  }

  const token = await paypalAccessToken();
  const base = getPayPalApiBase();
  const verifyRes = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      cert_url: certUrl,
      auth_algo: authAlgo,
      transmission_sig: transmissionSig,
      webhook_id: webhookId,
      webhook_event: event,
    }),
  });

  const verifyJson = (await verifyRes.json()) as { verification_status?: string };
  return verifyJson.verification_status === "SUCCESS";
}

async function resolveInternalOrderId(event: PayPalWebhookEvent): Promise<string | null> {
  const r = event.resource;
  if (!r) return null;
  if (r.custom_id) return r.custom_id;
  const paypalOrderId = r.supplementary_data?.related_ids?.order_id;
  if (paypalOrderId) {
    const o = await prisma.order.findFirst({
      where: { paypalOrderId },
      select: { id: true },
    });
    return o?.id ?? null;
  }
  return null;
}

export async function POST(req: Request) {
  let raw: string;
  let event: PayPalWebhookEvent;
  try {
    raw = await req.text();
    event = JSON.parse(raw) as PayPalWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ok = await verifyWebhookSignature(raw, event);
  if (!ok) {
    console.error("[paypal webhook] Signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const internalId = await resolveInternalOrderId(event);
      if (!internalId) {
        console.warn("[paypal webhook] No custom_id on capture resource, skipping");
        return NextResponse.json({ received: true });
      }

      const order = await prisma.order.findUnique({
        where: { id: internalId },
        select: { id: true, paymentStatus: true },
      });

      if (!order) {
        console.warn("[paypal webhook] Order not found:", internalId);
        return NextResponse.json({ received: true });
      }

      if (order.paymentStatus === "PAID") {
        return NextResponse.json({ received: true });
      }

      await prisma.order.update({
        where: { id: internalId },
        data: {
          paymentStatus: "PAID",
          status: "PROCESSING",
          statusHistory: {
            create: {
              status: "PROCESSING",
              note: `Payment confirmed via PayPal webhook (${event.event_type})`,
            },
          },
        },
      });

      console.log(`[paypal webhook] Order ${internalId} marked PAID`);
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[paypal webhook] Handler error:", e);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }
}
