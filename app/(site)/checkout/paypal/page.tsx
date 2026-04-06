import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ensureWebsiteAPayPalOrder } from "@/lib/paypal-website-a-order";
import { buildWebsiteAPaymentReturnUrl } from "@/lib/website-a-payment-return";
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
      <div className="min-h-[50vh] flex items-center justify-center p-8 text-center text-red-600">
        PayPal is not configured (NEXT_PUBLIC_PAYPAL_CLIENT_ID).
      </div>
    );
  }

  const currency = (order.paymentCurrency ?? "USD").toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Complete payment</h1>
        <p className="text-center text-gray-600 text-sm mb-8">
          Pay with PayPal, Venmo, Pay Later, or card. Order total:{" "}
          <strong>
            {currency} {order.total.toFixed(2)}
          </strong>
        </p>
        <PaypalWebsiteACheckout
          paypalClientId={clientId}
          paypalOrderId={paypalOrderId}
          internalOrderId={order.id}
          currency={currency}
        />
      </div>
    </div>
  );
}
