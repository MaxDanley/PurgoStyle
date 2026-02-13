/**
 * Purgo Style Labs affiliate tier system (from program graphic).
 * Monthly sales determine tier; commission rate and benefits follow.
 */

export const AFFILIATE_TIERS = [
  {
    tier: 1,
    minSales: 0,
    maxSales: 499.99,
    commissionRate: 15,
    benefits: ["Early access to new product", "$100 in free product monthly"],
  },
  {
    tier: 2,
    minSales: 500,
    maxSales: 1999.99,
    commissionRate: 17,
    benefits: ["1 free $50 gift card to give your following", "$200 in free product monthly"],
  },
  {
    tier: 3,
    minSales: 2000,
    maxSales: 2999.99,
    commissionRate: 20,
    benefits: ["1 free $100 gift card to give your following", "$300 in free product monthly"],
  },
  {
    tier: 4,
    minSales: 3000,
    maxSales: null, // no cap
    commissionRate: 25,
    benefits: ["3 free $100 gift cards to give your following", "$400 in free product monthly", "Quarterly bonuses"],
  },
] as const;

export type AffiliateTier = (typeof AFFILIATE_TIERS)[number];

/** Get tier (1-4) from monthly sales amount. */
export function getTierFromMonthlySales(monthlySales: number): AffiliateTier {
  for (let i = AFFILIATE_TIERS.length - 1; i >= 0; i--) {
    const t = AFFILIATE_TIERS[i];
    if (monthlySales >= t.minSales && (t.maxSales == null || monthlySales <= t.maxSales)) {
      return t;
    }
  }
  return AFFILIATE_TIERS[0];
}

/** Commission rate (e.g. 15) for a given tier. */
export function getCommissionRateForTier(tier: number): number {
  const t = AFFILIATE_TIERS.find((x) => x.tier === tier);
  return t ? t.commissionRate : 15;
}
