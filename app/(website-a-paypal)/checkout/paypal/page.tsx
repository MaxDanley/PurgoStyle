import Image from "next/image";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ensureWebsiteAPayPalOrder } from "@/lib/paypal-website-a-order";
import {
  buildWebsiteAPaymentReturnUrl,
  getWebsiteAPaymentCancelUrl,
} from "@/lib/website-a-payment-return";
import PaypalWebsiteACheckout from "./PaypalWebsiteACheckout";

export const dynamic = "force-dynamic";

export default async function WebsiteAPayPalCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  if (!orderId) {
    redirect("/checkout/cancel");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order || order.paymentMethod !== "PAYPAL") {
    notFound();
  }

  if (order.paymentStatus === "PAID" && order.paypalOrderId) {
    redirect(
      buildWebsiteAPaymentReturnUrl({
        sessionId: order.paypalOrderId,
        clientReferenceId: order.id,
        paymentStatus: "paid",
      })
    );
  }

  const { paypalOrderId } = await ensureWebsiteAPayPalOrder({
    id: order.id,
    total: order.total,
    paypalOrderId: order.paypalOrderId,
    paymentCurrency: order.paymentCurrency,
  });

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  if (!clientId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center text-red-600">
        PayPal is not configured (NEXT_PUBLIC_PAYPAL_CLIENT_ID).
      </div>
    );
  }

  const currency = (order.paymentCurrency ?? "USD").toUpperCase();
  const cancelUrl = getWebsiteAPaymentCancelUrl();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <a
            href={cancelUrl}
            rel="noopener noreferrer"
            className="absolute left-3 sm:left-4 top-1/2 z-10 -translate-y-1/2 inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors max-w-[42%] sm:max-w-none"
          >
            <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" aria-hidden />
            <span className="leading-tight hidden sm:inline">Back to Purgo Labs</span>
            <span className="leading-tight sm:hidden">Back</span>
          </a>
          <div className="flex flex-col items-center text-center px-10 sm:px-20">
            <p className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Purgo Labs</p>
            <Image
              src="/3A42A6FB.png"
              alt="Purgo Labs"
              width={360}
              height={144}
              className="mt-3 h-20 sm:h-28 md:h-32 w-auto max-w-[min(360px,78vw)] object-contain object-center"
              priority
            />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-12">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-center text-sm text-gray-500 mb-6">
            Total · {currency} {order.total.toFixed(2)}
          </p>
          <PaypalWebsiteACheckout
            paypalClientId={clientId}
            paypalOrderId={paypalOrderId}
            internalOrderId={order.id}
            currency={currency}
            websiteACancelUrl={cancelUrl}
          />
        </div>
      </main>
    </div>
  );
}
