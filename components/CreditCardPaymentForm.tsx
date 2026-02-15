"use client";

import { useState } from "react";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentError(null);

    try {
      const response = await fetch("/api/checkout/create-website-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      if (response.ok && data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setPaymentError(data.error || "Something went wrong. Please try again shortly or contact support");
    } catch (error: any) {
      console.error("Checkout session error:", error);
      setPaymentError("Something went wrong. Please try again shortly or contact support");
    } finally {
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Click Pay Now to be redirected to our secure payment page. You will complete payment there and then return to your order confirmation on this site.
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
