"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { clearFacebookReferral } from "@/lib/facebook-referral";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { TruckIcon, EnvelopeIcon, CalendarIcon, ClipboardIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useCart } from "@/lib/store";
import { trackPurchase, trackOrderConfirmationView, trackPageView } from "@/lib/analytics";
import { sanitizeBrandText } from "@/lib/products";
import { usePathname } from "next/navigation";

interface OrderDetails {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingInsurance?: number;
  tax?: number; // Deprecated - kept for backward compatibility
  shippingCost: number;
  total: number;
  discountAmount: number;
  createdAt: string;
  paymentMethod?: string;
  cryptoPaymentId?: string | null;
  cryptoPaymentAddress?: string | null;
  cryptoPaymentAmount?: number | null;
  cryptoCurrency?: string | null;
  cryptoPaymentStatus?: string | null;
  paymentStatus?: string;
  stripeSessionId?: string | null;
  email?: string | null;
  items: Array<{
    id: string;
    product: {
      name: string;
      image: string;
    };
    variant: {
      size: string;
    };
    quantity: number;
    price: number;
    customDesign?: {
      elements?: unknown[];
      elementsBack?: unknown[];
      shirtColor?: string;
      size?: string;
      previewImage?: string;
    } | null;
  }>;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const pathname = usePathname();
  const [hasTrackedPurchase, setHasTrackedPurchase] = useState(false);

  const paymentIntentId = searchParams.get('payment_intent');
  const orderNumber = searchParams.get('order');

  // Track page view
  useEffect(() => {
    if (pathname) {
      trackPageView(window.location.href, 'Order Confirmation - Summer Steeze', {
        page_type: 'order_confirmation',
      });
    }
  }, [pathname]);

  useEffect(() => {
    // Clear any saved checkout draft once an order is confirmed
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("summersteeze_checkout_v1");
      } catch {
        // ignore
      }
    }

    if (orderNumber) {
      fetchOrderByNumber(orderNumber);
      
      // Mark abandoned cart as converted
      const markCartAsConverted = async () => {
        try {
          await fetch('/api/cart/abandonment', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('Error marking cart as converted:', error);
        }
      };
      
      markCartAsConverted();
    } else if (paymentIntentId) {
      fetchOrderDetails(paymentIntentId);
      
      // Mark abandoned cart as converted
      const markCartAsConverted = async () => {
        try {
          await fetch('/api/cart/abandonment', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('Error marking cart as converted:', error);
        }
      };
      
      markCartAsConverted();
    } else {
      setError("No order information found");
      setLoading(false);
    }
  }, [paymentIntentId, orderNumber]);

  useEffect(() => {
    // Auto-copy order total to clipboard only for legacy payment-link Credit Card orders
    if (order && order.paymentMethod === "CREDIT_CARD" && !order.stripeSessionId && order.total > 0) {
      // Small delay to ensure interaction/focus
      const timer = setTimeout(() => {
        try {
          navigator.clipboard.writeText(order.total.toFixed(2)).then(() => {
            toast.success("Order total copied to clipboard!");
          }).catch(() => {
            // Silently fail if not allowed (browsers require user interaction often)
            console.log("Could not auto-copy to clipboard");
          });
        } catch (e) {
          console.log("Clipboard API not available");
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [order]);

  const fetchOrderByNumber = async (orderNum: string) => {
    try {
      console.log('🔍 Fetching order details for order number:', orderNum);
      
      const response = await fetch(`/api/orders/by-order-number?orderNumber=${orderNum}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.error('❌ Order not found for order number:', orderNum);
          
          // Wait a moment and try again (in case order creation is still processing)
          console.log('⏳ Waiting 2 seconds and retrying...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const retryResponse = await fetch(`/api/orders/by-order-number?orderNumber=${orderNum}`);
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            console.log('✅ Order details fetched on retry:', data);
            formatAndSetOrder(data.order);
            return;
          }
          
          setError('Order not found. The order may still be processing. Please wait a moment and refresh this page, or contact support if the issue persists.');
          return;
        }
        throw new Error('Failed to fetch order details');
      }
      
      const data = await response.json();
      console.log('✅ Order details fetched:', data);
      formatAndSetOrder(data.order);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Failed to load order details. Please contact support if you were charged.');
    } finally {
      setLoading(false);
    }
  };

  const formatAndSetOrder = (orderData: any) => {
    const formattedOrder: OrderDetails = {
      id: orderData.id,
      orderNumber: orderData.orderNumber,
      status: orderData.status,
      subtotal: orderData.subtotal,
      shippingInsurance: orderData.shippingInsurance,
      tax: orderData.tax, // Deprecated - kept for backward compatibility
      shippingCost: orderData.shippingCost,
      total: orderData.total,
      discountAmount: orderData.discountAmount || 0,
      createdAt: orderData.createdAt.toISOString ? orderData.createdAt.toISOString() : orderData.createdAt,
      items: orderData.items.map((item: any) => ({
        id: item.id,
        product: {
          name: sanitizeBrandText(item.product?.name || ""),
          image: item.product.image,
        },
        variant: {
          size: item.variant.size,
        },
        quantity: item.quantity,
        price: item.price,
      })),
      shippingAddress: orderData.shippingAddress ? {
        name: orderData.shippingAddress.name,
        street: orderData.shippingAddress.street,
        city: orderData.shippingAddress.city,
        state: orderData.shippingAddress.state,
        zipCode: orderData.shippingAddress.zipCode,
        country: orderData.shippingAddress.country,
      } : {
        name: "",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
      paymentMethod: orderData.paymentMethod || "OTHER",
      stripeSessionId: orderData.stripeSessionId ?? null,
      cryptoPaymentId: orderData.cryptoPaymentId || null,
      cryptoPaymentAddress: orderData.cryptoPaymentAddress || null,
      cryptoPaymentAmount: orderData.cryptoPaymentAmount || null,
      cryptoCurrency: orderData.cryptoCurrency || null,
      cryptoPaymentStatus: orderData.cryptoPaymentStatus || null,
      paymentStatus: orderData.paymentStatus || "PENDING",
    };
    setOrder(formattedOrder);
    
    // Track purchase event (only once per order)
    if (!hasTrackedPurchase && formattedOrder.orderNumber) {
      // Ensure total is a number and is the final order total
      const finalTotal = typeof formattedOrder.total === 'number' 
        ? formattedOrder.total 
        : parseFloat(String(formattedOrder.total)) || 0;
      
      // Log order details for debugging
      console.log('[Purchase Tracking] Order details:', {
        orderNumber: formattedOrder.orderNumber,
        subtotal: formattedOrder.subtotal,
        shippingInsurance: formattedOrder.shippingInsurance,
        shippingCost: formattedOrder.shippingCost,
        discountAmount: formattedOrder.discountAmount,
        total: finalTotal,
        items: formattedOrder.items.length,
      });
      
      trackPurchase({
        transactionId: formattedOrder.orderNumber,
        items: formattedOrder.items.map(item => ({
          itemId: item.product?.name ?? item.id, // Using product name as ID since we don't have product ID here
          itemName: sanitizeBrandText(item.product?.name || ""),
          itemCategory: 'Apparel',
          price: typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0,
          quantity: item.quantity,
        })),
        value: finalTotal, // Final order total including all fees, discounts, etc.
        shippingInsurance: formattedOrder.shippingInsurance,
        shipping: formattedOrder.shippingCost,
        discountAmount: formattedOrder.discountAmount,
        paymentMethod: formattedOrder.paymentMethod,
        currency: 'USD',
        coupon: '', // Could extract from order if available
        isGuest: !session,
      });
      
      trackOrderConfirmationView(
        formattedOrder.orderNumber,
        formattedOrder.total,
        formattedOrder.paymentMethod
      );
      
      setHasTrackedPurchase(true);
    }
    
    // Clear cart when order is successfully loaded
    clearCart();
    
    // Clear Facebook referral cookie after successful order
    clearFacebookReferral();
  };

  const fetchOrderDetails = async (paymentIntentId: string) => {
    try {
      console.log('🔍 Fetching order details for payment intent:', paymentIntentId);
      
      // Try to fetch order details
      const response = await fetch(`/api/orders/payment-intent/${paymentIntentId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.error('❌ Order not found for payment intent:', paymentIntentId);
          
          // Wait a moment and try again (in case order creation is still processing)
          console.log('⏳ Waiting 2 seconds and retrying...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const retryResponse = await fetch(`/api/orders/payment-intent/${paymentIntentId}`);
          if (retryResponse.ok) {
            const orderData = await retryResponse.json();
            console.log('✅ Order details fetched on retry:', orderData);
            setOrder(orderData);
            return;
          }
          
          setError('Order not found. The payment succeeded but the order may still be processing. Please wait a moment and refresh this page, or contact support if the issue persists.');
          return;
        }
        throw new Error('Failed to fetch order details');
      }
      
      const orderData = await response.json();
      console.log('✅ Order details fetched:', orderData);
      setOrder(orderData);
      
      // Clear cart when order is successfully loaded
      clearCart();
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Failed to load order details. Please contact support if you were charged.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-red-800 mb-2">Order Processing Issue</h1>
            <p className="text-red-600 mb-4">{error || "We couldn't find your order details."}</p>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                If you were charged, please contact our support team with your payment information.
              </p>
              <div className="flex flex-col space-y-2">
                <Link href="/contact" className="btn-primary">
                  Contact Support
                </Link>
                <Link href="/" className="btn-secondary">
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Payment Instructions - Credit Card (appears first if Credit Card payment) */}
        {order.paymentMethod === "CREDIT_CARD" && order.paymentStatus !== "PAID" && !order.stripeSessionId && (
          <div className="mb-8 relative">
            {/* Glowing outline effect */}
            <div className="absolute -inset-2 rounded-lg blur-md opacity-60" style={{ backgroundColor: '#3b82f6', boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}></div>
            <div className="relative bg-white rounded-lg shadow-lg border-2 p-6" style={{ borderColor: '#3b82f6' }}>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">
                  If you completed your payment, your order is confirmed and you can exit this page. Otherwise, proceed with instructions to pay below.
                </p>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Your Payment</h3>
              <p className="text-sm text-gray-600 mb-4">
                We've sent payment instructions to {order.email ? <strong>{order.email}</strong> : "your email"}. Follow the steps below or use the link in that email to pay with your card.
              </p>
              
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-800 font-medium mb-2 flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                    <span>IMPORTANT: You must enter the EXACT order amount below or your order will be cancelled.</span>
                  </p>
                </div>

                <div className="text-center py-4 mb-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Exact Payment Amount Required</p>
                  <div className="flex items-center justify-center gap-3">
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(order.total)}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(order.total.toFixed(2));
                        toast.success("Order total copied to clipboard!");
                      }}
                      className="p-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-600"
                      title="Copy amount"
                    >
                      <ClipboardIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    (This amount has been copied to your clipboard)
                  </p>
                </div>

                <div className="text-center">
                  <a 
                    href="https://buy.stripe.com/28E14nbKraiRd4G9440Fi00"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-brand-500 text-white px-12 py-6 rounded-xl font-bold text-xl hover:bg-brand-600 transition-colors shadow-lg w-full sm:w-auto"
                  >
                    Make Payment Now
                  </a>
                  <p className="text-xs text-gray-500 mt-3 max-w-md mx-auto">
                    Clicking this button will open our secure payment page. Please enter the exact amount shown above.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-semibold text-gray-900">{order.orderNumber}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="text-gray-900">{formatDate(order.createdAt)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Status:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {order.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Items Ordered</h3>
              <div className="space-y-4">
                {order.items.map((item) => {
                  const itemImage = (item.customDesign as { previewImage?: string } | undefined)?.previewImage ?? item.product.image;
                  const isDataUrl = itemImage?.startsWith("data:");
                  return (
                  <div key={item.id} className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                      {isDataUrl ? (
                        <img
                          src={itemImage}
                          alt={sanitizeBrandText(item.product?.name || "")}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image
                          src={itemImage}
                          alt={sanitizeBrandText(item.product?.name || "")}
                          width={64}
                          height={64}
                          className="h-16 w-16 object-cover rounded-lg"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {sanitizeBrandText(item.product?.name || "")}
                      </h4>
                      <p className="text-sm text-gray-500">Size: {item.variant.size}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      {item.customDesign && (
                        <div className="mt-2 text-xs text-brand-600 bg-brand-50 rounded px-2 py-1">
                          <span className="font-medium">Your custom design:</span>{" "}
                          {[
                            item.customDesign.elements?.length ? `${(item.customDesign.elements as unknown[]).length} element(s) on front` : null,
                            item.customDesign.elementsBack?.length ? `${(item.customDesign.elementsBack as unknown[]).length} on back` : null,
                          ].filter(Boolean).join(" • ") || "Front & back artwork"}
                          {item.customDesign.shirtColor && " • Color tee"}
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                );})}
              </div>
            </div>

          </div>

          {/* Order Summary & Next Steps */}
          <div className="space-y-6">
            {/* Order Total */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="text-green-600">-{formatCurrency(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping Insurance:</span>
                  <span className="text-gray-900">{formatCurrency(order.shippingInsurance || 3.50)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="text-gray-900">{formatCurrency(order.shippingCost)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900">{order.shippingAddress.name}</p>
                  <p>{order.shippingAddress.street}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Next Steps - Full Width Section */}
        <div className="mt-8">
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-6">What's Next?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start space-x-4">
                <EnvelopeIcon className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-base font-medium text-blue-900">Email Confirmation</p>
                  <p className="text-sm text-blue-700 mt-1">You'll receive an order confirmation email shortly</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <TruckIcon className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-base font-medium text-blue-900">Shipping Updates</p>
                  <p className="text-sm text-blue-700 mt-1">We'll email you tracking information once your order ships</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <CalendarIcon className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-base font-medium text-blue-900">Processing Time</p>
                  <p className="text-sm text-blue-700 mt-1">Orders typically ship within 1-2 business days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Full Width Section */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            {session ? (
              <Link href="/account" className="btn-secondary text-center text-sm py-2 px-6 flex-1">
                View All Orders
              </Link>
            ) : (
              <Link href="/auth/register" className="btn-secondary text-center text-sm py-2 px-6 flex-1">
                Create Account
              </Link>
            )}
            
            <Link href="/" className="btn-primary text-center text-sm py-2 px-6 flex-1">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your order details...</p>
        </div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}