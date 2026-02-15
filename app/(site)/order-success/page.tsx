import { redirect } from "next/navigation";
import Link from "next/link";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

/**
 * Website checkout return: verify session then redirect to order-confirmation.
 * No redirect to any external site.
 */
export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    return (
      <div className="max-w-md mx-auto text-center p-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Missing session</h1>
        <p className="text-gray-600 mb-6">
          No session was provided. If you just completed payment, your order is being processed.
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

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const orderId = session.client_reference_id as string | null;
    if (!orderId) {
      return (
        <div className="max-w-md mx-auto text-center p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Order not found</h1>
          <p className="text-gray-600 mb-6">We couldn’t link this payment to an order. Contact support if you were charged.</p>
          <Link href="/contact" className="inline-block px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600">
            Contact support
          </Link>
        </div>
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true },
    });

    if (!order) {
      return (
        <div className="max-w-md mx-auto text-center p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Order not found</h1>
          <p className="text-gray-600 mb-6">If you were charged, we’ll process your order shortly.</p>
          <Link href="/" className="inline-block px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600">
            Return to home
          </Link>
        </div>
      );
    }

    redirect(`/order-confirmation?order=${order.orderNumber}`);
  } catch (e: any) {
    if (e?.digest?.startsWith?.("NEXT_REDIRECT")) {
      throw e;
    }
    console.error("order-success error:", e);
    return (
      <div className="max-w-md mx-auto text-center p-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-600 mb-6">If you were charged, your order is being processed. You can check your email or contact support.</p>
        <Link href="/" className="inline-block px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600">
          Return to home
        </Link>
      </div>
    );
  }
}
