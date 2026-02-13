// Shipping calculation utilities
export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
  isFree: boolean;
}

export interface ShippingCalculation {
  options: ShippingOption[];
  freeShippingThreshold: number;
  currentSubtotal: number;
  remainingForFreeShipping: number;
}

// Free shipping threshold
export const FREE_SHIPPING_THRESHOLD = 200;

export function calculateShipping(
  address: ShippingAddress,
  subtotal: number
): ShippingCalculation {
  const groundOption: ShippingOption = {
    id: 'ground',
    name: 'Standard Ground Shipping',
    description: 'USPS Priority Mail',
    price: 0, // Free shipping site-wide
    estimatedDays: '5 business days',
    isFree: true
  };

  const priorityOption: ShippingOption = {
    id: 'priority',
    name: 'Priority Shipping',
    description: 'USPS Priority Mail',
    price: 15,
    estimatedDays: '2-3 business days',
    isFree: false
  };

  const expeditedOption: ShippingOption = {
    id: 'expedited',
    name: 'USPS Overnight Shipping',
    description: 'USPS Priority Mail Express Overnight',
    price: 50,
    estimatedDays: '1-2 business days',
    isFree: false
  };

  return {
    options: [groundOption, priorityOption, expeditedOption],
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    currentSubtotal: subtotal,
    remainingForFreeShipping: Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  };
}

// Calculate points earned from order
export function calculatePointsEarned(subtotal: number): number {
  // 1:1 ratio - $1 = 1 point
  return Math.floor(subtotal);
}

// Calculate points value in dollars
export function calculatePointsValue(points: number): number {
  // 100 points = $1
  return points / 100;
}

// Calculate maximum points that can be redeemed
export function calculateMaxRedeemablePoints(
  userPoints: number,
  subtotal: number
): number {
  // Can redeem up to 50% of order value or available points, whichever is less
  const maxOrderPoints = Math.floor(subtotal * 0.5);
  return Math.min(userPoints, maxOrderPoints);
}

// Validate shipping address for calculation
export function validateShippingAddress(address: ShippingAddress): boolean {
  return !!(
    address.street &&
    address.city &&
    address.state &&
    address.zipCode &&
    address.country
  );
}

// Get shipping method display name
export function getShippingMethodName(method: string): string {
  const methods = {
    ground: 'Standard Ground Shipping',
    priority: 'Priority Shipping (2-3 day)',
    expedited: 'USPS Overnight Shipping'
  };
  return methods[method as keyof typeof methods] || method;
}

// Format shipping cost for display
export function formatShippingCost(cost: number): string {
  if (cost === 0) {
    return 'FREE';
  }
  return `$${cost.toFixed(2)}`;
}
