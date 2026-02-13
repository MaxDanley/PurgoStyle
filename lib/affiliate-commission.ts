/**
 * Credit affiliate commission when an order is paid. Uses tier based on affiliate's
 * monthly sales (calendar month of the order).
 */

import { prisma } from "@/lib/prisma";
import { getTierFromMonthlySales } from "@/lib/affiliate-tiers";

/**
 * Credit commission for an order that was just marked PAID.
 * Idempotent: if AffiliateCommission already exists for this orderId, skip.
 */
export async function creditAffiliateCommission(order: {
  id: string;
  orderNumber: string;
  affiliateId: string | null;
  total: number;
  createdAt: Date;
}): Promise<void> {
  if (!order.affiliateId || order.total <= 0) return;

  const existing = await prisma.affiliateCommission.findFirst({
    where: { orderId: order.id },
  });
  if (existing) return;

  const orderDate = new Date(order.createdAt);
  const monthStart = new Date(orderDate.getFullYear(), orderDate.getMonth(), 1);
  const monthEnd = new Date(orderDate.getFullYear(), orderDate.getMonth() + 1, 0, 23, 59, 59);

  const ordersInMonth = await prisma.order.findMany({
    where: {
      affiliateId: order.affiliateId,
      paymentStatus: "PAID",
      createdAt: { gte: monthStart, lte: monthEnd },
    },
    select: { total: true },
  });

  const monthlySales = ordersInMonth.reduce((sum, o) => sum + o.total, 0);
  const tier = getTierFromMonthlySales(monthlySales);
  const amount = Math.round((order.total * (tier.commissionRate / 100)) * 100) / 100;

  await prisma.affiliateCommission.create({
    data: {
      affiliateId: order.affiliateId,
      orderId: order.id,
      amount,
      tier: tier.tier,
      commissionRate: tier.commissionRate,
    },
  });

  await prisma.affiliate.update({
    where: { id: order.affiliateId },
    data: {
      totalSales: { increment: order.total },
      totalOrders: { increment: 1 },
      totalCommission: { increment: amount },
      pendingCommission: { increment: amount },
    },
  });
}
