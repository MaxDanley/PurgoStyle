"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    slug: string;
  };
  variant: {
    size: string;
  } | null;
  isBackorder?: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  email: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  shippingInsurance: number;
  discountAmount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  trackingNumber: string | null;
  createdAt: string;
  shippedAt: string | null;
  items: OrderItem[];
  shippingAddress: {
    street: string;
    apartment: string | null;
    city: string;
    state: string;
    zip: string;
    country: string;
  } | null;
  statusHistory: Array<{
    status: string;
    createdAt: string;
    note: string | null;
  }>;
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOrder(null);

    if (!orderNumber.trim() || !email.trim()) {
      setError("Please enter both order number and email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderNumber: orderNumber.trim(), email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to lookup order");
        return;
      }

      setOrder(data.order);
      toast.success("Order found!");
    } catch (err) {
      console.error("Error looking up order:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "SHIPPED":
        return "bg-blue-100 text-blue-800";
      case "PROCESSING":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
      case "REFUNDED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Track Your Order</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Enter your order number and email address below to check the current status of your shipment.
          </p>
        </div>

        {/* Lookup Form */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-12 border border-gray-100">
          <div className="p-8 sm:p-10">
            <form onSubmit={handleLookup} className="space-y-6">
            <div>
                <label htmlFor="orderNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                  Order Number
              </label>
                <div className="relative">
              <input
                type="text"
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                    className="block w-full px-4 py-3.5 pl-11 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:bg-white transition-all duration-200 ease-in-out placeholder-gray-400"
                placeholder="e.g., PURGO-123456"
                required
              />
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                     <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                       <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                     </svg>
                  </div>
                </div>
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
              </label>
                <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-4 py-3.5 pl-11 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:bg-white transition-all duration-200 ease-in-out placeholder-gray-400"
                placeholder="email@example.com"
                required
              />
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r shadow-sm flex items-center animate-pulse">
                  <svg className="h-5 w-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
                className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-gradient-to-r from-brand-500 to-blue-600 hover:from-brand-600 hover:to-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </>
                ) : (
                  "Track Order"
                )}
            </button>
          </form>
          </div>
        </div>

        {/* Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="p-8 sm:p-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-gray-100">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Order {order.orderNumber}</h2>
                    <p className="text-gray-500">Placed on {formatDate(order.createdAt)}</p>
                </div>
                <div className="mt-4 md:mt-0">
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold tracking-wide uppercase ${getStatusColor(order.status)}`}>
                    {order.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Order Items */}
                <div className="mb-10">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Order Items</h3>
                  <div className="space-y-6">
                  {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                        <div className="flex-1 pr-4">
                          <p className="font-semibold text-lg text-gray-900 mb-1">
                          {item.product.name}
                          {item.variant && ` - ${item.variant.size}`}
                          {item.isBackorder && (
                              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              BACKORDER
                            </span>
                          )}
                        </p>
                          <p className="text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                          <p className="font-bold text-lg text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                          <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
              {/* Order Totals */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                        <span className="font-medium">${order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                          <span className="font-medium">-${order.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                      <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                        <span className="font-medium">${order.shippingCost.toFixed(2)}</span>
                  </div>
                  {order.shippingInsurance > 0 && (
                        <div className="flex justify-between text-gray-600">
                      <span>Shipping Insurance</span>
                          <span className="font-medium">${order.shippingInsurance.toFixed(2)}</span>
                    </div>
                  )}
                      <div className="flex justify-between text-xl font-bold text-gray-900 pt-4 border-t border-gray-200 mt-2">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

                  {/* Shipping & Payment */}
                  <div className="space-y-8">
              {/* Shipping Address */}
              {order.shippingAddress && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">Shipping Address</h3>
                        <p className="text-gray-600 leading-relaxed">
                    {order.shippingAddress.street}
                    {order.shippingAddress.apartment && `, ${order.shippingAddress.apartment}`}
                    <br />
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                    <br />
                    {order.shippingAddress.country}
                  </p>
                </div>
              )}

              {/* Payment Status */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3">Payment Information</h3>
                      <div className="space-y-2">
                        <p className="text-gray-600">
                          <span className="font-medium text-gray-900">Method:</span> {order.paymentMethod.replace("_", " ")}
                  </p>
                        <p className="text-gray-600">
                          <span className="font-medium text-gray-900">Status:</span>{" "}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.paymentStatus === "PAID" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {order.paymentStatus}
                    </span>
                  </p>
                </div>
              </div>
                  </div>
                </div>

                {/* Tracking */}
                {order.trackingNumber && (
                  <div className="mb-10 p-6 bg-blue-50 rounded-xl border border-blue-100">
                    <h3 className="text-lg font-bold text-blue-900 mb-3">Tracking Information</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <p className="text-blue-800 mb-1">
                          <span className="font-semibold">Tracking Number:</span> {order.trackingNumber}
                        </p>
                        {order.shippedAt && (
                          <p className="text-sm text-blue-600">Shipped on {formatDate(order.shippedAt)}</p>
                        )}
                      </div>
                      <a 
                        href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.trackingNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Track on USPS
                      </a>
                    </div>
                  </div>
                )}

              {/* Status History */}
              {order.statusHistory && order.statusHistory.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Order History</h3>
                    <div className="relative pl-4 border-l-2 border-gray-200 space-y-8">
                    {order.statusHistory.map((history, index) => (
                        <div key={index} className="relative">
                          <div className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white ring-2 ring-gray-200 ${
                            index === 0 ? "bg-brand-500 ring-brand-500" : "bg-gray-300"
                          }`}></div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">{formatDate(history.createdAt)}</p>
                            <h4 className={`text-base font-semibold ${index === 0 ? "text-gray-900" : "text-gray-600"}`}>
                          {history.status.replace("_", " ")}
                            </h4>
                          {history.note && (
                              <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-3 rounded-lg border border-gray-100 inline-block">
                                {history.note}
                              </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

