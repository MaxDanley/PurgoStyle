// Google Analytics 4 E-commerce Tracking
// This file provides utility functions for tracking user interactions and conversions

declare global {
  interface Window {
    dataLayer: any[];
    twq: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
    _tfa: Array<{notify: string; name: string; id?: number}>;
    uetq: any[];
  }
}

// Get or create session ID for analytics tracking
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  const key = 'summersteeze_session_id';
  let sessionId = localStorage.getItem(key);
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(key, sessionId);
  }
  
  return sessionId;
}

// Track page view to our analytics API (non-blocking)
async function trackPageViewToAPI(pagePath: string, referrer?: string) {
  if (typeof window === 'undefined') return;
  
  try {
    const sessionId = getSessionId();
    await fetch('/api/analytics/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        pagePath,
        referrer: referrer || document.referrer || undefined,
      }),
    });
  } catch (error) {
    // Silently fail - analytics shouldn't block user experience
    console.debug('Analytics tracking failed:', error);
  }
}

// Track cart event to our analytics API (non-blocking)
async function trackCartEventToAPI(
  eventType: string,
  productId?: string,
  variantId?: string,
  quantity?: number
) {
  if (typeof window === 'undefined') return;
  
  try {
    const sessionId = getSessionId();
    await fetch('/api/analytics/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        eventType,
        productId,
        variantId,
        quantity,
      }),
    });
  } catch (error) {
    // Silently fail - analytics shouldn't block user experience
    console.debug('Cart tracking failed:', error);
  }
}

// Track checkout event to our analytics API (non-blocking)
async function trackCheckoutEventToAPI(step: string, cartValue?: number) {
  if (typeof window === 'undefined') return;
  
  try {
    const sessionId = getSessionId();
    await fetch('/api/analytics/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        step,
        cartValue,
      }),
    });
  } catch (error) {
    // Silently fail - analytics shouldn't block user experience
    console.debug('Checkout tracking failed:', error);
  }
}

/**
 * Track a page view with enhanced metadata
 */
export const trackPageView = (url: string, _title?: string, _additionalParams?: Record<string, any>) => {
  // Track to our analytics API
  const urlObj = typeof url === 'string' ? new URL(url, window.location.origin) : url;
  const pagePath = typeof url === 'string' ? urlObj.pathname : window.location.pathname;
  trackPageViewToAPI(pagePath);
};

/**
 * Track when a product is viewed
 */
export const trackViewItem = (_product: {
  itemId: string;
  itemName: string;
  itemCategory: string;
  price: number;
  currency?: string;
}) => {};

/**
 * Track when an item is added to cart
 */
export const trackAddToCart = (product: {
  itemId: string;
  itemName: string;
  itemCategory: string;
  price: number;
  quantity: number;
  currency?: string;
}) => {
  // X (Twitter) Ads - Add to Cart tracking
  if (typeof window !== 'undefined' && window.twq) {
    window.twq('event', 'tw-qzdl7-qzdlb', {
      value: (product.price * product.quantity).toFixed(2),
      currency: product.currency || 'USD',
      num_items: product.quantity,
      contents: [{
        content_id: product.itemId,
        content_name: product.itemName,
        content_type: 'product',
        content_price: product.price,
        num_items: product.quantity,
      }],
    });
  }
  
  // Meta Pixel - AddToCart event (fires for both pixels)
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_name: product.itemName,
      content_ids: [product.itemId],
      content_type: 'product',
      value: product.price * product.quantity,
      currency: product.currency || 'USD',
    });
  }
  
  // Taboola Pixel - AddToCart event
  if (typeof window !== 'undefined' && window._tfa) {
    window._tfa.push({notify: 'event', name: 'add_to_cart', id: 1975537});
  }
  
  // Track to our analytics API
  trackCartEventToAPI('add_to_cart', product.itemId, undefined, product.quantity);
};

/**
 * Track when checkout begins
 */
export const trackBeginCheckout = (cart: {
  items: Array<{
    itemId: string;
    itemName: string;
    itemCategory: string;
    price: number;
    quantity: number;
  }>;
  value: number;
  currency?: string;
}) => {
  // Meta Pixel - InitiateCheckout event (fires for both pixels)
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      content_ids: cart.items.map(item => item.itemId),
      content_name: cart.items.map(item => item.itemName).join(', '),
      content_type: 'product',
      value: cart.value,
      currency: cart.currency || 'USD',
      num_items: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    });
  }
  
  // Taboola Pixel - start_checkout event
  if (typeof window !== 'undefined' && window._tfa) {
    window._tfa.push({notify: 'event', name: 'start_checkout', id: 1975537});
  }
  
  // Track to our analytics API
  trackCheckoutEventToAPI('cart', cart.value);
};

/**
 * Track a purchase (CONVERSION EVENT) with enhanced revenue data
 */
export const trackPurchase = (order: {
  transactionId: string;
  items: Array<{
    itemId: string;
    itemName: string;
    itemCategory: string;
    price: number;
    quantity: number;
  }>;
  value: number;
  shippingInsurance?: number;
  tax?: number; // Deprecated - kept for backward compatibility
  shipping?: number;
  discountAmount?: number;
  paymentMethod?: string;
  currency?: string;
  coupon?: string;
  isGuest?: boolean;
}) => {
  // X (Twitter) Ads purchase tracking
  if (typeof window !== 'undefined' && window.twq) {
    window.twq('event', 'tw-qzdl7-qzdl8', {
      value: order.value.toFixed(2),
      currency: order.currency || 'USD',
      conversion_id: order.transactionId,
      num_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
      contents: order.items.map(item => ({
        content_id: item.itemId,
        content_name: item.itemName,
        content_type: 'product',
        content_price: item.price,
        num_items: item.quantity,
      })),
    });
    console.log('[X Pixel] Purchase event tracked:', order.transactionId, order.value);
  }
  
  // Meta Pixel - Purchase event (fires for both pixels automatically)
  if (typeof window !== 'undefined' && window.fbq) {
    // Ensure value is a number and properly formatted
    const purchaseValue = typeof order.value === 'number' ? order.value : parseFloat(String(order.value)) || 0;
    
    // Validate that we have a valid purchase value
    if (purchaseValue <= 0) {
      console.error('[Meta Pixel] Invalid purchase value:', order.value, 'for order:', order.transactionId);
    }
    
    const purchaseData = {
      content_ids: order.items.map(item => item.itemId),
      content_name: order.items.map(item => item.itemName).join(', '),
      content_type: 'product',
      value: purchaseValue,
      currency: order.currency || 'USD',
      num_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
      contents: order.items.map(item => ({
        id: item.itemId,
        quantity: item.quantity,
        item_price: typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0,
      })),
    };
    
    window.fbq('track', 'Purchase', purchaseData);
    console.log('[Meta Pixel] Purchase event tracked:', {
      transactionId: order.transactionId,
      value: purchaseValue,
      currency: purchaseData.currency,
      num_items: purchaseData.num_items,
      items: order.items.length,
    });
  }
  
  // Taboola Pixel - make_purchase event
  if (typeof window !== 'undefined' && window._tfa) {
    window._tfa.push({notify: 'event', name: 'make_purchase', id: 1975537});
    console.log('[Taboola Pixel] make_purchase event tracked:', order.transactionId, order.value);
  }
  
  // Track to our analytics API - checkout completed
  trackCheckoutEventToAPI('completed', order.value);
};

/**
 * Track user sign-up (CONVERSION EVENT)
 */
export const trackSignUp = (method: 'email' | 'google' = 'email') => {
  // X (Twitter) Ads - Lead Generation tracking (account signup is a lead)
  if (typeof window !== 'undefined' && window.twq) {
    window.twq('event', 'tw-qzdl7-qzdl9', {
      conversion_id: `signup_${method}_${Date.now()}`,
    });
  }
};

/**
 * Track when user views cart
 */
export const trackViewCart = (_cart: {
  items: Array<{
    itemId: string;
    itemName: string;
    itemCategory: string;
    price: number;
    quantity: number;
  }>;
  value: number;
  currency?: string;
}) => {};

/**
 * Track when user removes item from cart
 */
export const trackRemoveFromCart = (product: {
  itemId: string;
  itemName: string;
  itemCategory: string;
  price: number;
  quantity: number;
  currency?: string;
}) => {
  trackCartEventToAPI('remove_from_cart', product.itemId, undefined, product.quantity);
};

/**
 * Track when user searches for products
 */
export const trackSearch = (_searchTerm: string) => {};

/**
 * Track when user starts subscription (newsletter, etc.)
 */
export const trackSubscribe = (_source: 'checkout' | 'footer' | 'newsletter' = 'newsletter') => {};

/**
 * Track custom events
 */
export const trackEvent = (_eventName: string, _parameters?: Record<string, any>) => {};

/**
 * Track file downloads
 */
export const trackDownload = (fileName: string, fileType: string = 'pdf') => {
  // X (Twitter) Ads - Download tracking
  if (typeof window !== 'undefined' && window.twq) {
    window.twq('event', 'tw-qzdl7-qzdla', {
      content_name: fileName,
      content_type: fileType,
    });
  }
};

/**
 * Track external link clicks
 */
export const trackOutboundClick = (_url: string, _linkText?: string) => {};

/**
 * Track when user adds shipping information (checkout step)
 */
export const trackAddShippingInfo = (_shippingMethod: string, value: number, _currency?: string) => {
  trackCheckoutEventToAPI('shipping', value);
};

/**
 * Track when user adds payment information (checkout step)
 */
export const trackAddPaymentInfo = (_paymentMethod: string, value: number, _currency?: string) => {
  // Taboola Pixel - add_payment_info event
  if (typeof window !== 'undefined' && window._tfa) {
    window._tfa.push({notify: 'event', name: 'add_payment_info', id: 1975537});
  }
  
  // Track to our analytics API
  trackCheckoutEventToAPI('payment', value);
};

/**
 * Track payment method selection
 * Event name: payment_method_selected
 * Parameters: payment_method, value, currency
 */
export const trackPaymentMethodSelected = (_paymentMethod: 'credit_card' | 'crypto' | 'zelle' | 'venmo' | 'barterpay' | 'edebit', _value: number) => {};

/**
 * Track discount code application
 */
export const trackDiscountCodeApplied = (_code: string, _discountAmount: number, _value: number) => {};

/**
 * Track when user starts payment process
 */
export const trackPaymentStarted = (_paymentMethod: string, _value: number, _orderId?: string) => {};

/**
 * Track when payment is completed successfully
 */
export const trackPaymentCompleted = (_paymentMethod: string, value: number, _orderId: string, _transactionId?: string) => {
  trackCheckoutEventToAPI('review', value);
};

/**
 * Track when payment fails
 */
export const trackPaymentFailed = (_paymentMethod: string, _value: number, _error?: string) => {};

/**
 * Track checkout abandonment (user leaves checkout page)
 */
export const trackCheckoutAbandonment = (_step: string, _value: number, _items: any[]) => {};

/**
 * Track newsletter signup
 */
export const trackNewsletterSignup = (source: 'homepage' | 'checkout' | 'footer' | 'popup' = 'popup') => {
  // X (Twitter) Ads - Lead Generation tracking
  if (typeof window !== 'undefined' && window.twq) {
    window.twq('event', 'tw-qzdl7-qzdl9', {
      conversion_id: `newsletter_${source}_${Date.now()}`,
    });
  }
};

/**
 * Track product list view
 */
export const trackViewItemList = (_items: Array<{
  itemId: string;
  itemName: string;
  itemCategory: string;
  price: number;
}>, _listName?: string) => {};

/**
 * Track user engagement (time on page, scroll depth, etc.)
 */
export const trackEngagement = (_engagementTime: number, _engagementName?: string) => {};

/**
 * Track when user views order confirmation
 */
export const trackOrderConfirmationView = (_orderNumber: string, _value: number, _paymentMethod?: string) => {};

/**
 * Track when user clicks on product from list
 */
export const trackSelectItem = (_product: {
  itemId: string;
  itemName: string;
  itemCategory: string;
  price: number;
  listName?: string;
}) => {};

/**
 * Track rewards points redemption
 */
export const trackRewardsRedeemed = (_points: number, _discountAmount: number) => {};

/**
 * Track when user views account page
 */
export const trackAccountView = (_hasOrders: boolean, _hasAddresses: boolean) => {};
