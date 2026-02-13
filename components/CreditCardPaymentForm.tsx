"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

const STRIPE_PAYMENT_URL = "https://buy.stripe.com/28E14nbKraiRd4G9440Fi00";

interface CreditCardPaymentFormProps {
  total: number;
  items: any[];
  shippingInfo: any;
  billingInfo: any;
  session: any;
  subscribeToPromotions: boolean;
  subscribeToSms?: boolean;
  discountCode: string;
  discountAmount: number;
  shippingCost: number;
  shippingMethod?: string;
  isCompletingOrder: boolean;
  setIsCompletingOrder: (value: boolean) => void;
}

export default function CreditCardPaymentForm({
  total,
  items,
  shippingInfo,
  billingInfo,
  session,
  subscribeToPromotions,
  subscribeToSms = false,
  discountCode,
  discountAmount,
  shippingCost,
  shippingMethod = "ground",
  isCompletingOrder: _isCompletingOrder,
  setIsCompletingOrder: _setIsCompletingOrder,
}: CreditCardPaymentFormProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const hasAutoCopiedRef = useRef(false);

  // Auto-copy order amount to clipboard when form is shown (once per mount/total)
  useEffect(() => {
    if (total <= 0 || hasAutoCopiedRef.current) return;
    hasAutoCopiedRef.current = true;
    const amount = total.toFixed(2);
    navigator.clipboard.writeText(amount).then(() => {
      toast.success("Order amount copied to clipboard");
    }).catch(() => {});
  }, [total]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentError(null);

    // Single new tab to payment page, opened directly from this click
    window.open(STRIPE_PAYMENT_URL, "_blank", "noopener,noreferrer");

    try {
      const response = await fetch("/api/orders/create-card", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          shippingInfo,
          billingInfo,
          metadata: {
            userId: session?.user?.id || null,
            userEmail: session?.user?.email || shippingInfo.email,
            isGuest: !session,
            subscribeToPromotions,
            smsOptIn: subscribeToSms,
            discountCode,
            discountAmount,
            shippingCost,
            shippingMethod,
            affiliateRef: null,
          },
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Copy amount again so they have it for the payment screen
        navigator.clipboard.writeText((data.order.total ?? total).toFixed(2)).then(() => {
          toast.success("Order amount copied to clipboard");
        }).catch(() => {});
        // Current tab goes to order confirmation (payment tab already opened on click)
        router.push(`/order-confirmation?order=${data.order.orderNumber}`);
        setIsProcessing(false);
      } else {
        setPaymentError("Something went wrong. Please try again shortly or contact support");
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error("Credit Card order creation error:", error);
      setPaymentError("Something went wrong. Please try again shortly or contact support");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {paymentError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{paymentError}</p>
        </div>
      )}

      {/* Payment instructions: amount to enter + auto-copy */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 mb-2">
          <strong>Payment instructions:</strong> Clicking Pay Now will open our secure payment page in a new tab. Enter the exact order amount when asked. Your order will not be processed until payment is received.
        </p>
        <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Order amount to enter on payment screen:</strong>
          </p>
          <p className="text-xl font-bold text-gray-900">
            ${total.toFixed(2)}
          </p>
        </div>
        <p className="text-xs text-blue-700 mt-1">
          (This amount has been copied to your clipboard)
        </p>
      </div>

      <button
        type="submit"
        disabled={isProcessing}
        className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
      >
        {isProcessing ? "Creating order…" : (
          <>
            Pay Now (${total.toFixed(2)})
            <ArrowRightIcon className="w-5 h-5" aria-hidden />
          </>
        )}
      </button>
    </form>
  );
}
