// Google Analytics 4 E-commerce Tracking
// This file provides utility functions for tracking user interactions and conversions

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
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
  
  const key = 'purgolabs_session_id';
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
export const trackPageView = (url: string, title?: string, additionalParams?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_location: url,
      page_title: title || document.title,
      page_path: url,
      ...additionalParams,
    });
  }
  
  // Track to our analytics API
  const urlObj = typeof url === 'string' ? new URL(url, window.location.origin) : url;
  const pagePath = typeof url === 'string' ? urlObj.pathname : window.location.pathname;
  trackPageViewToAPI(pagePath);
};

/**
 * Track when a product is viewed
 */
export const trackViewItem = (product: {
  itemId: string;
  itemName: string;
  itemCategory: string;
  price: number;
  currency?: string;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'view_item', {
      currency: product.currency || 'USD',
      value: product.price,
      items: [
        {
          item_id: product.itemId,
          item_name: product.itemName,
          item_category: product.itemCategory,
          price: product.price,
        },
      ],
    });
  }
};

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
  // Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'add_to_cart', {
      currency: product.currency || 'USD',
      value: product.price * product.quantity,
      items: [
        {
          item_id: product.itemId,
          item_name: product.itemName,
          item_category: product.itemCategory,
          price: product.price,
          quantity: product.quantity,
        },
      ],
    });
  }
  
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
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: cart.currency || 'USD',
      value: cart.value,
      items: cart.items.map(item => ({
        item_id: item.itemId,
        item_name: item.itemName,
        item_category: item.itemCategory,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  }
  
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
  // Google Analytics 4 purchase tracking
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: order.transactionId,
      value: order.value,
      currency: order.currency || 'USD',
      tax: order.shippingInsurance || order.tax || 0, // Using shippingInsurance instead of tax
      shipping: order.shipping || 0,
      coupon: order.coupon || '',
      payment_type: order.paymentMethod || 'unknown',
      user_type: order.isGuest ? 'guest' : 'registered',
      items: order.items.map(item => ({
        item_id: item.itemId,
        item_name: item.itemName,
        item_category: item.itemCategory,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  }
  
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
  // Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'sign_up', {
      method: method,
    });
  }
  
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
export const trackViewCart = (cart: {
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
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'view_cart', {
      currency: cart.currency || 'USD',
      value: cart.value,
      items: cart.items.map(item => ({
        item_id: item.itemId,
        item_name: item.itemName,
        item_category: item.itemCategory,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  }
};

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
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'remove_from_cart', {
      currency: product.currency || 'USD',
      value: product.price * product.quantity,
      items: [
        {
          item_id: product.itemId,
          item_name: product.itemName,
          item_category: product.itemCategory,
          price: product.price,
          quantity: product.quantity,
        },
      ],
    });
  }
  
  // Track to our analytics API
  trackCartEventToAPI('remove_from_cart', product.itemId, undefined, product.quantity);
};

/**
 * Track when user searches for products
 */
export const trackSearch = (searchTerm: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'search', {
      search_term: searchTerm,
    });
  }
};

/**
 * Track when user starts subscription (newsletter, etc.)
 */
export const trackSubscribe = (source: 'checkout' | 'footer' | 'newsletter' = 'newsletter') => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'subscription', {
      method: 'email',
      source: source,
    });
  }
};

/**
 * Track custom events
 */
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

/**
 * Track file downloads
 */
export const trackDownload = (fileName: string, fileType: string = 'pdf') => {
  // Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'file_download', {
      file_name: fileName,
      file_extension: fileType,
    });
  }
  
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
export const trackOutboundClick = (url: string, linkText?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'click', {
      event_category: 'outbound',
      event_label: linkText || url,
      transport_type: 'beacon',
    });
  }
};

/**
 * Track when user adds shipping information (checkout step)
 */
export const trackAddShippingInfo = (shippingMethod: string, value: number, currency?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'add_shipping_info', {
      shipping_tier: shippingMethod,
      value: value,
      currency: currency || 'USD',
    });
  }
  
  // Track to our analytics API
  trackCheckoutEventToAPI('shipping', value);
};

/**
 * Track when user adds payment information (checkout step)
 */
export const trackAddPaymentInfo = (paymentMethod: string, value: number, currency?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'add_payment_info', {
      payment_type: paymentMethod,
      value: value,
      currency: currency || 'USD',
    });
  }
  
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
export const trackPaymentMethodSelected = (paymentMethod: 'credit_card' | 'crypto' | 'zelle' | 'venmo' | 'barterpay' | 'edebit', value: number) => {
  if (typeof window !== 'undefined') {
    if (window.gtag) {
      const eventParams = {
        payment_method: paymentMethod,
        value: value,
        currency: 'USD',
      };
      
      window.gtag('event', 'payment_method_selected', eventParams);
      
      // Log for debugging
      console.log('[GA4] Event: payment_method_selected', eventParams);
      
      // Also push to dataLayer for debugging
      if (window.dataLayer) {
        window.dataLayer.push({
          event: 'payment_method_selected',
          ...eventParams,
        });
      }
    } else {
      console.warn('[GA4] gtag not available - payment method selection not tracked. Make sure Google Analytics is loaded.');
    }
  }
};

/**
 * Track discount code application
 */
export const trackDiscountCodeApplied = (code: string, discountAmount: number, value: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'apply_promotion', {
      promotion_id: code,
      promotion_name: code,
      value: value,
      discount_amount: discountAmount,
      currency: 'USD',
    });
  }
};

/**
 * Track when user starts payment process
 */
export const trackPaymentStarted = (paymentMethod: string, value: number, orderId?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'payment_started', {
      payment_method: paymentMethod,
      value: value,
      currency: 'USD',
      order_id: orderId,
    });
  }
};

/**
 * Track when payment is completed successfully
 */
export const trackPaymentCompleted = (paymentMethod: string, value: number, orderId: string, transactionId?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'payment_completed', {
      payment_method: paymentMethod,
      value: value,
      currency: 'USD',
      order_id: orderId,
      transaction_id: transactionId,
    });
  }
  
  // Track to our analytics API (review step before completion)
  trackCheckoutEventToAPI('review', value);
};

/**
 * Track when payment fails
 */
export const trackPaymentFailed = (paymentMethod: string, value: number, error?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'payment_failed', {
      payment_method: paymentMethod,
      value: value,
      currency: 'USD',
      error_message: error,
    });
  }
};

/**
 * Track checkout abandonment (user leaves checkout page)
 */
export const trackCheckoutAbandonment = (step: string, value: number, items: any[]) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'checkout_abandonment', {
      checkout_step: step,
      value: value,
      currency: 'USD',
      items: items,
    });
  }
};

/**
 * Track newsletter signup
 */
export const trackNewsletterSignup = (source: 'homepage' | 'checkout' | 'footer' | 'popup' = 'popup') => {
  // Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'newsletter_signup', {
      source: source,
    });
  }
  
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
export const trackViewItemList = (items: Array<{
  itemId: string;
  itemName: string;
  itemCategory: string;
  price: number;
}>, listName?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'view_item_list', {
      item_list_name: listName || 'Products',
      item_list_id: listName || 'products',
      items: items.map(item => ({
        item_id: item.itemId,
        item_name: item.itemName,
        item_category: item.itemCategory,
        price: item.price,
      })),
    });
  }
};

/**
 * Track user engagement (time on page, scroll depth, etc.)
 */
export const trackEngagement = (engagementTime: number, engagementName?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'user_engagement', {
      engagement_time_msec: engagementTime,
      engagement_name: engagementName,
    });
  }
};

/**
 * Track when user views order confirmation
 */
export const trackOrderConfirmationView = (orderNumber: string, value: number, paymentMethod?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'order_confirmation_view', {
      order_number: orderNumber,
      value: value,
      currency: 'USD',
      payment_method: paymentMethod,
    });
  }
};

/**
 * Track when user clicks on product from list
 */
export const trackSelectItem = (product: {
  itemId: string;
  itemName: string;
  itemCategory: string;
  price: number;
  listName?: string;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'select_item', {
      item_list_name: product.listName || 'Products',
      items: [{
        item_id: product.itemId,
        item_name: product.itemName,
        item_category: product.itemCategory,
        price: product.price,
      }],
    });
  }
};

/**
 * Track rewards points redemption
 */
export const trackRewardsRedeemed = (points: number, discountAmount: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'rewards_redeemed', {
      points: points,
      discount_amount: discountAmount,
      currency: 'USD',
    });
  }
};

/**
 * Track when user views account page
 */
export const trackAccountView = (hasOrders: boolean, hasAddresses: boolean) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'account_view', {
      has_orders: hasOrders,
      has_addresses: hasAddresses,
    });
  }
};
