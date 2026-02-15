import { NextResponse } from "next/server";
import Stripe from "stripe";

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
 * Verify a Stripe Checkout session (server-to-server, for Website A proxy).
 * Requires Bearer token. Does NOT update DB.
 */
export async function GET(req: Request) {
  try {
    if (!validateAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "session_id required" }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      payment_status: session.payment_status,
      id: session.id,
      client_reference_id: session.client_reference_id,
    });
  } catch (e: any) {
    console.error("verify-checkout-session error:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to verify session" },
      { status: 500 }
    );
  }
}
