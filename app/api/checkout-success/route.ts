import { NextResponse } from "next/server";
import Stripe from "stripe";

const WEBSITE_A_RETURN = "https://www.purgolabs.com/payment-return";
const ERROR_PAGE = "/success-error";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

/**
 * Server-side handler: verify Stripe session, then redirect to Website A.
 * Called when user returns from Stripe Checkout. Verification happens BEFORE redirect.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      const errorUrl = new URL(ERROR_PAGE, req.url);
      errorUrl.searchParams.set("reason", "no_session");
      return NextResponse.redirect(errorUrl);
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const status = session.payment_status;

    if (status !== "paid" && status !== "unpaid") {
      const errorUrl = new URL(ERROR_PAGE, req.url);
      errorUrl.searchParams.set("reason", "invalid_status");
      return NextResponse.redirect(errorUrl);
    }

    const params = new URLSearchParams({
      session_id: sessionId,
      payment_status: status,
    });
    if (session.client_reference_id) {
      params.set("client_reference_id", session.client_reference_id);
    }

    return NextResponse.redirect(`${WEBSITE_A_RETURN}?${params.toString()}`);
  } catch (e: any) {
    console.error("checkout-success error:", e);
    const errorUrl = new URL(ERROR_PAGE, req.url);
    errorUrl.searchParams.set("reason", "error");
    return NextResponse.redirect(errorUrl);
  }
}
