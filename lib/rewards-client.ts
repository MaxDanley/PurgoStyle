// Client-safe rewards utilities (no Prisma imports)
// These functions can be used in client components

// Calculate points earned from order (1:1 ratio)
export function calculatePointsEarned(subtotal: number): number {
  return Math.floor(subtotal);
}

// Calculate points value in dollars (100 points = $1)
export function calculatePointsValue(points: number): number {
  return points / 100;
}

// Calculate maximum points that can be redeemed (50% of order value)
export function calculateMaxRedeemablePoints(
  userPoints: number,
  subtotal: number
): number {
  const maxOrderPoints = Math.floor(subtotal * 0.5);
  return Math.min(userPoints, maxOrderPoints);
}

// Validate points redemption
export function validatePointsRedemption(
  pointsToRedeem: number,
  userPoints: number,
  orderSubtotal: number
): { isValid: boolean; error?: string } {
  if (pointsToRedeem <= 0) {
    return { isValid: false, error: 'Points must be greater than 0' };
  }

  if (pointsToRedeem > userPoints) {
    return { isValid: false, error: 'Insufficient points' };
  }

  const maxRedeemable = calculateMaxRedeemablePoints(userPoints, orderSubtotal);
  if (pointsToRedeem > maxRedeemable) {
    return { 
      isValid: false, 
      error: `Maximum redeemable points: ${maxRedeemable} (50% of order value)` 
    };
  }

  return { isValid: true };
}

// Format points for display
export function formatPoints(points: number): string {
  return points.toLocaleString();
}

// Format points value for display
export function formatPointsValue(points: number): string {
  const value = calculatePointsValue(points);
  return `$${value.toFixed(2)}`;
}
