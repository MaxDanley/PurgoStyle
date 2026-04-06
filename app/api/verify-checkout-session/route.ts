import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { paypalGetOrder, paypalOrderToPaymentStatus } from "@/lib/paypal";

export const runtime = "nodejs";

/** Website A compatibility: camelCase + explicit orderId / orderNumber for order resolution. */
async function verifyResponseBody(params: {
  payment_status: string;
  id: string;
  client_reference_id: string | null;
}) {
  const clientRef = params.client_reference_id;
  let orderNumber: string | null = null;
  if (clientRef) {
    const order = await prisma.order.findUnique({
      where: { id: clientRef },
      select: { orderNumber: true },
    });
    orderNumber = order?.orderNumber ?? null;
  }
  return {
    payment_status: params.payment_status,
    paymentStatus: params.payment_status,
    id: params.id,
    client_reference_id: clientRef,
    orderId: clientRef,
    orderNumber,
  };
}

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

function validateAuth(req: Request): boolean {
  const secret =
    (process.env.STRIPE_CREATE_SESSION_SECRET || process.env.WEBSITE_B_INTERNAL_SECRET)?.trim();
  if (!secret) return false;
  const authHeader = req.headers.get("Authorization");
  const xSecret = req.headers.get("X-Internal-Secret") || req.headers.get("X-Website-B-Secret");
  const token =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : (xSecret?.trim() ?? "");
  return !!token && secret === token;
}

/**
 * Verify payment for Website A (server-to-server).
 * - `session_id` starting with `cs_` → Stripe Checkout session.
 * - Otherwise → PayPal order ID (Orders v2).
 */
export async function GET(req: Request) {
  const ts = new Date().toISOString();
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");
  const ref = searchParams.get("ref");

  const log = (event: string, data: Record<string, unknown>) => {
    console.log(JSON.stringify({ route: "verify-checkout-session", event, ts, ...data }));
  };

  try {
    if (!validateAuth(req)) {
      const secret = process.env.STRIPE_CREATE_SESSION_SECRET || process.env.WEBSITE_B_INTERNAL_SECRET;
      log("auth_failed", {
        session_id: sessionId ?? null,
        ref: ref ?? null,
        hasSecret: !!secret,
        hasAuthHeader: !!req.headers.get("Authorization"),
        hasXSecret: !!(req.headers.get("X-Internal-Secret") || req.headers.get("X-Website-B-Secret")),
        httpStatus: 401,
        error: "Unauthorized",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!sessionId) {
      log("validation_failed", { session_id: null, ref: ref ?? null, httpStatus: 400, error: "session_id required" });
      return NextResponse.json({ error: "session_id required" }, { status: 400 });
    }

    if (sessionId.startsWith("cs_")) {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      log("success_stripe", {
        session_id: sessionId,
        ref: ref ?? null,
        payment_status: session.payment_status,
        client_reference_id: session.client_reference_id ?? null,
        httpStatus: 200,
      });

      const body = await verifyResponseBody({
        payment_status: session.payment_status,
        id: session.id,
        client_reference_id: session.client_reference_id,
      });
      return NextResponse.json(body);
    }

    const paypalOrder = await paypalGetOrder(sessionId);
    const payStatus = paypalOrderToPaymentStatus(paypalOrder);
    const stripeLikeStatus =
      payStatus === "paid" ? "paid" : payStatus === "pending" ? "unpaid" : "unpaid";
    const clientRef = paypalOrder.purchase_units?.[0]?.custom_id ?? null;

    log("success_paypal", {
      session_id: sessionId,
      ref: ref ?? null,
      payment_status: stripeLikeStatus,
      paypal_status: paypalOrder.status,
      client_reference_id: clientRef,
      httpStatus: 200,
    });

    const body = await verifyResponseBody({
      payment_status: stripeLikeStatus,
      id: sessionId,
      client_reference_id: clientRef,
    });
    return NextResponse.json(body);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to verify session";
    log("error", {
      session_id: sessionId ?? null,
      ref: ref ?? null,
      httpStatus: 500,
      error: message,
      errorType: e instanceof Error ? e.name : "Error",
    });
    console.error("verify-checkout-session error:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
