import { redirect } from "next/navigation";
import Link from "next/link";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const PAYMENT_RETURN_URL = "https://www.purgolabs.com/payment-return";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

/**
 * GET /success
 * Retrieve Checkout Session from Stripe, do NOT finalize payment (webhook is authority).
 * Redirect to Website A with session_id and ref (external reference).
 */
export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    return (
      <div className="max-w-md text-center p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Missing session</h1>
          <p className="text-gray-600 mb-6">No session was provided. Please complete checkout from the beginning.</p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
          >
            Return to home
          </Link>
      </div>
    );
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid" && session.payment_status !== "unpaid") {
      return (
        <div className="max-w-md text-center p-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Payment verification</h1>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t confirm your payment status. If you were charged, we&apos;ll process your order shortly.
            </p>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
            >
              Return to home
            </Link>
        </div>
      );
    }

    let externalRef = "";
    if (session.client_reference_id) {
      const order = await prisma.order.findUnique({
        where: { id: session.client_reference_id },
        select: { externalReference: true },
      });
      if (order?.externalReference) {
        externalRef = order.externalReference;
      }
    }

    const params = new URLSearchParams({ session_id: sessionId });
    if (externalRef) params.set("ref", externalRef);

    redirect(`${PAYMENT_RETURN_URL}?${params.toString()}`);
  } catch (e: any) {
    if (e?.digest?.startsWith?.("NEXT_REDIRECT")) {
      throw e;
    }
    console.error("success page error:", e);
    return (
      <div className="max-w-md text-center p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Verification issue</h1>
          <p className="text-gray-600 mb-6">
            Something went wrong. If you were charged, we&apos;ll process your order shortly.
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
          >
            Return to home
          </Link>
      </div>
    );
  }
}
