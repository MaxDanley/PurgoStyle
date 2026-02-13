"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/store";
import toast from "react-hot-toast";
import Image from "next/image";
import { getStoredAffiliateRef } from "@/components/AffiliateTracker";

interface BarterPayPaymentFormProps {
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
  isCompletingOrder: boolean;
  setIsCompletingOrder: (value: boolean) => void;
}

export default function BarterPayPaymentForm({
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
  isCompletingOrder,
  setIsCompletingOrder,
}: BarterPayPaymentFormProps) {
  const router = useRouter();
  const { clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [complianceChecked, setComplianceChecked] = useState(false);
  const [showComplianceError, setShowComplianceError] = useState(false);

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
      setIsCompletingOrder(true);

      // Get affiliate reference if present
      const affiliateRef = getStoredAffiliateRef();

      // Create BarterPay order
      const response = await fetch("/api/orders/create-barterpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items,
          shippingInfo: shippingInfo,
          billingInfo: billingInfo,
          metadata: {
            userId: session?.user?.id || null,
            userEmail: session?.user?.email || shippingInfo.email,
            isGuest: !session,
            subscribeToPromotions: subscribeToPromotions,
            smsOptIn: subscribeToSms,
            discountCode: discountCode,
            discountAmount: discountAmount,
            shippingCost: shippingCost,
            affiliateRef: affiliateRef,
          },
          total: total,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.redirectUrl) {
        // Store cart and order data in sessionStorage before redirecting
        // This allows us to restore the cart if user clicks back without completing payment
        // Store full item data including all required fields for cart restoration
        const cartData = {
          items: items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName || item.name || "Product",
            variantSize: item.variantSize || item.size || "",
            price: item.price,
            image: item.image || "",
            quantity: item.quantity,
          })),
          shippingInfo: shippingInfo,
          billingInfo: billingInfo,
          orderNumber: data.orderNumber,
          transactionIndex: data.transactionIndex,
          timestamp: Date.now(),
        };
        sessionStorage.setItem('barterpay_pending_order', JSON.stringify(cartData));
        
        // Redirect to BarterPay payment page (don't clear cart yet - wait for payment confirmation)
        window.location.href = data.redirectUrl;
      } else {
        setPaymentError("Something went wrong. Please try again shortly or contact support");
        setIsProcessing(false);
        setIsCompletingOrder(false);
      }
    } catch (error: any) {
      console.error("BarterPay order creation error:", error);
      setPaymentError("Something went wrong. Please try again shortly or contact support");
      setIsProcessing(false);
      setIsCompletingOrder(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {paymentError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{paymentError}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Image 
            src="/barter-logo.svg" 
            alt="BarterPay" 
            width={120} 
            height={30} 
            className="h-6 w-auto object-contain"
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm text-blue-800 font-semibold">
            Security verification required: Phone & Email.
          </p>
          <p className="text-xs text-blue-700 mt-2">
            <strong>About BarterPay:</strong> We use BarterPay as a payment system to take payment for our products. BarterPay is an anti-fraud system that protects both you the consumer and us the merchant. Your credit card statement will show BarterPay in the description. With BarterPay, your transaction is safe!
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="barterpay-research-confirmation" className="flex items-start gap-3 text-sm text-gray-700">
          <input
            id="barterpay-research-confirmation"
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
        {isProcessing ? "Processing..." : "Continue to BarterPay Payment"}
      </button>
    </form>
  );
}

