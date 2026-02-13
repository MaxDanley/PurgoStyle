/**
 * Shared logic for confirming orders (mark PAID, PROCESSING, decrease stock, points, email).
 * Used by: NOWPayments webhook (IPN), cron check-crypto-payments, GoDaddy payment email webhook.
 */

import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { addPointsToUser } from "@/lib/rewards";
import { creditAffiliateCommission } from "@/lib/affiliate-commission";

export type OrderWithRelations = Awaited<
  ReturnType<
    typeof prisma.order.findFirst<{
      include: {
        items: { include: { product: true; variant: true } };
        shippingAddress: true;
        user: true;
      };
    }>
  >
>;

type ConfirmPaymentMethod = "CRYPTO" | "CREDIT_CARD";

/**
 * Mark order as paid, set status to PROCESSING, decrease stock, award points, send confirmation email.
 * Idempotent: safe to call if order is already PAID (no-op).
 */
async function confirmOrderPaymentInternal(
  order: NonNullable<OrderWithRelations>,
  note: string,
  paymentMethod: ConfirmPaymentMethod
): Promise<void> {
  if (order.paymentStatus === "PAID") {
    return;
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "PAID",
      status: "PROCESSING",
      statusHistory: {
        create: {
          status: "PROCESSING",
          note,
        },
      },
    },
  });

  for (const item of order.items) {
    if (item.isBackorder) continue;
    try {
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data: { stockCount: { decrement: item.quantity } },
      });
    } catch (error) {
      console.error(`Failed to decrease stock for variant ${item.variantId}:`, error);
    }
  }

  if (order.userId && order.pointsEarned > 0) {
    try {
      await addPointsToUser(
        order.userId,
        order.pointsEarned,
        order.id,
        `Earned ${order.pointsEarned} points from order ${order.orderNumber}`
      );
    } catch (error) {
      console.error("Failed to award points:", error);
    }
  }

  const customerEmail = (order as any).email || order.user?.email;
  if (customerEmail && customerEmail.includes("@")) {
    try {
      await sendOrderConfirmationEmail(
        customerEmail,
        order.orderNumber,
        {
          items: order.items.map((item) => ({
            productName: item.product.name,
            variantSize: item.variant.size,
            quantity: item.quantity,
            price: item.price,
            isBackorder: item.isBackorder,
          })),
          subtotal: order.subtotal,
          shippingInsurance: (order as any).shippingInsurance ?? 3.5,
          shipping: order.shippingCost,
          total: order.total,
          shippingAddress: order.shippingAddress
            ? {
                name: order.shippingAddress.name,
                street: order.shippingAddress.street,
                city: order.shippingAddress.city,
                state: order.shippingAddress.state,
                zipCode: order.shippingAddress.zipCode,
                country: order.shippingAddress.country ?? "US",
              }
            : undefined,
        },
        paymentMethod
      );
    } catch (error) {
      console.error("Failed to send confirmation email:", error);
    }
  }

  if ((order as any).affiliateId) {
    try {
      await creditAffiliateCommission({
        id: order.id,
        orderNumber: order.orderNumber,
        affiliateId: (order as any).affiliateId,
        total: order.total,
        createdAt: order.createdAt,
      });
    } catch (error) {
      console.error("Failed to credit affiliate commission:", error);
    }
  }
}

export async function confirmCryptoOrderPayment(
  order: NonNullable<OrderWithRelations>,
  note: string
): Promise<void> {
  return confirmOrderPaymentInternal(order, note, "CRYPTO");
}

export async function confirmCreditCardOrderPayment(
  order: NonNullable<OrderWithRelations>,
  note: string
): Promise<void> {
  return confirmOrderPaymentInternal(order, note, "CREDIT_CARD");
}
