/**
 * Black Friday Sale Configuration
 * Sale duration: 1 week from start date
 */

// Set the sale start date (adjust as needed)
const SALE_START_DATE = new Date('2025-11-22T00:00:00Z'); // Adjust to your start date
const SALE_DURATION_DAYS = 8; // Extended to end on 2025-11-30

export const BLACK_FRIDAY_DISCOUNT = 0.20; // 20% off

/**
 * Check if Black Friday sale is currently active
 */
export function isBlackFridaySaleActive(): boolean {
  const now = new Date();
  const saleEndDate = new Date(SALE_START_DATE);
  saleEndDate.setDate(saleEndDate.getDate() + SALE_DURATION_DAYS);
  
  return now >= SALE_START_DATE && now <= saleEndDate;
}

/**
 * Apply Black Friday discount to a price
 * Returns the discounted price if sale is active, otherwise returns original price
 */
export function applyBlackFridayDiscount(price: number): number {
  if (isBlackFridaySaleActive()) {
    return price * (1 - BLACK_FRIDAY_DISCOUNT);
  }
  return price;
}

/**
 * Get the original price (before discount)
 * Useful for showing "was $X, now $Y" pricing
 */
export function getOriginalPrice(discountedPrice: number): number {
  if (isBlackFridaySaleActive()) {
    return discountedPrice / (1 - BLACK_FRIDAY_DISCOUNT);
  }
  return discountedPrice;
}

