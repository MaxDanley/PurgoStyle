import { prisma } from "@/lib/prisma";
import {
  paypalCreateOrder,
  paypalGetOrder,
  type PayPalOrderResponse,
} from "@/lib/paypal";

/**
 * Ensure the internal order has a usable PayPal order in CREATED/APPROVED state.
 * Recreates the PayPal order if it is voided, completed, or missing.
 */
export async function ensureWebsiteAPayPalOrder(order: {
  id: string;
  total: number;
  paypalOrderId: string | null;
  paymentCurrency: string | null;
}): Promise<{ paypalOrderId: string; payPalStatus: PayPalOrderResponse["status"] }> {
  const currency = (order.paymentCurrency ?? "USD").toUpperCase();
  const value = order.total.toFixed(2);

  if (order.paypalOrderId) {
    try {
      const po = await paypalGetOrder(order.paypalOrderId);
      if (po.status === "CREATED" || po.status === "APPROVED" || po.status === "PAYER_ACTION_REQUIRED") {
        return { paypalOrderId: order.paypalOrderId, payPalStatus: po.status };
      }
    } catch {
      /* create fresh order below */
    }
  }

  const created = await paypalCreateOrder({
    value,
    currencyCode: currency,
    customId: order.id,
    description: "Order payment",
    guestCheckoutPreferred: true,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { paypalOrderId: created.id },
  });

  return { paypalOrderId: created.id, payPalStatus: "CREATED" };
}
