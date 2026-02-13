"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredAffiliateRef } from "@/components/AffiliateTracker";

interface VenmoPaymentFormProps {
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

export default function VenmoPaymentForm({
  total: _total,
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
}: VenmoPaymentFormProps) {
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [complianceChecked, setComplianceChecked] = useState(false);
  const [showComplianceError, setShowComplianceError] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!complianceChecked) {
      setShowComplianceError(true);
      return;
    }

    setShowComplianceError(false);
    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Get affiliate reference if present
      const affiliateRef = getStoredAffiliateRef();

      // Create Venmo order
      const response = await fetch("/api/orders/create-venmo", {
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
            affiliateRef,
          },
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Immediately redirect to order confirmation page
        router.push(`/order-confirmation?order=${data.order.orderNumber}`);
      } else {
        setPaymentError("Something went wrong. Please try again shortly or contact support");
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error("Venmo order creation error:", error);
      setPaymentError("Something went wrong. Please try again shortly or contact support");
      setIsProcessing(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {paymentError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{paymentError}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 mb-2">
            <strong>Venmo Payment Instructions:</strong> Place your order first then follow instructions to pay with Venmo.
          </p>
          <p className="text-sm text-blue-800">
            Your order will not be processed until funds have cleared in our Venmo account.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="venmo-research-confirmation" className="flex items-start gap-3 text-sm text-gray-700">
            <input
              id="venmo-research-confirmation"
              type="checkbox"
              checked={complianceChecked}
              onChange={(event) => {
                setComplianceChecked(event.target.checked);
                if (event.target.checked) {
                  setShowComplianceError(false);
                }
              }}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span>
              I confirm that I am 21 years of age or older and that all compounds in this order will be used strictly
              for laboratory and scientific research purposes only.
            </span>
          </label>
          {showComplianceError && (
            <p className="text-sm text-red-600">
              Please acknowledge the age and research-use confirmation before proceeding.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isProcessing || !complianceChecked}
          className="btn-primary w-full"
        >
          {isProcessing ? "Creating Order..." : "Place Order"}
        </button>
      </form>
    </>
  );
}
