"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import { getStoredAffiliateRef } from "@/components/AffiliateTracker";

interface CryptoPaymentFormProps {
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

export default function CryptoPaymentForm({
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
}: CryptoPaymentFormProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [complianceChecked, setComplianceChecked] = useState(false);
  const [showComplianceError, setShowComplianceError] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("btc");
  const [availableCurrencies] = useState<string[]>(["btc", "eth", "xrp", "usdc", "usdt"]);
  const [estimatedAmount, setEstimatedAmount] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Currency icons mapping
  const getCurrencyIcon = (currency: string) => {
    const icons: { [key: string]: JSX.Element } = {
      btc: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.243 15.525.36 9.105 1.96 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.113 8.738 14.546z" fill="#F7931A"/>
          <path d="M17.27 9.535c.24-1.597-1.002-2.46-2.707-3.034l.553-2.22-1.35-.336-.538 2.16c-.355-.088-.72-.17-1.083-.252l.54-2.166-1.35-.337-.554 2.22c-.295-.067-.585-.133-.866-.197l.001-.007-1.862-.465-.36 1.445s1.002.23.98.244c.547.137.646.5.63.787l-.633 2.54c.038.01.087.024.142.047l-.145-.036-.897 3.6c-.068.17-.24.425-.63.328.014.02-.98-.244-.98-.244l-.67 1.51 1.755.438c.327.082.647.168.96.247l-.56 2.25 1.349.336.554-2.223c.37.1.726.192 1.07.278l-.552 2.216 1.35.337.56-2.247c2.3.435 4.03.26 4.757-1.82.59-1.68.03-2.65-1.245-3.28.886-.204 1.555-.785 1.735-1.985zm-3.01 4.22c-.418 1.68-3.245.772-4.16.545l.743-2.98c.914.228 3.84.68 3.417 2.435zm.422-4.24c-.382 1.534-2.74.755-3.505.563l.672-2.697c.765.19 3.23.49 2.833 2.134z" fill="#FFF"/>
        </svg>
      ),
      eth: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003z" fill="#627EEA"/>
          <path d="M11.944 0L4.58 12.223l7.364 4.353 7.365-4.35L11.944 0z" fill="#627EEA"/>
          <path d="M4.58 14.628l7.364 4.354 7.365-4.35-7.365 4.345L4.58 14.628z" fill="#C8B2F5"/>
        </svg>
      ),
      xrp: (
        <Image 
          src="/xrp-xrp-logo.png" 
          alt="XRP" 
          width={20} 
          height={20} 
          className="w-5 h-5 object-contain"
        />
      ),
      usdc: (
        <Image 
          src="/usd-coin-usdc-logo.png" 
          alt="USDC" 
          width={20} 
          height={20} 
          className="w-5 h-5 object-contain"
        />
      ),
      usdt: (
        <Image 
          src="/tether-usdt-logo.png" 
          alt="USDT" 
          width={20} 
          height={20} 
          className="w-5 h-5 object-contain"
        />
      ),
    };
    return icons[currency.toLowerCase()] || <div className="w-5 h-5 rounded-full bg-gray-300"></div>;
  };

  const getCurrencyName = (currency: string) => {
    const names: { [key: string]: string } = {
      btc: "Bitcoin",
      eth: "Ethereum",
      xrp: "Ripple",
      usdc: "USD Coin",
      usdt: "Tether",
    };
    return names[currency.toLowerCase()] || currency.toUpperCase();
  };

  // Fetch estimated price when currency changes
  useEffect(() => {
    const totalNum = typeof total === 'number' ? total : parseFloat(String(total)) || 0;
    if (selectedCurrency && totalNum > 0) {
      fetch(`/api/payments/nowpayments/estimate?amount=${totalNum}&currency_to=${selectedCurrency}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.estimatedAmount) {
            const amount = typeof data.estimatedAmount === 'number' ? data.estimatedAmount : parseFloat(String(data.estimatedAmount)) || 0;
            setEstimatedAmount(amount);
          }
        })
        .catch((error) => {
          console.error("Failed to get estimated price:", error);
        });
    }
  }, [selectedCurrency, total]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!complianceChecked) {
      setShowComplianceError(true);
      return;
    }

    if (!selectedCurrency) {
      toast.error("Please select a cryptocurrency");
      return;
    }

    setShowComplianceError(false);
    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Get affiliate reference if present
      const affiliateRef = getStoredAffiliateRef();

      // Create crypto order
      const response = await fetch("/api/orders/create-crypto", {
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
          payCurrency: selectedCurrency,
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
      console.error("Crypto payment error:", error);
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

      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Cryptocurrency
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg bg-white text-left hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <div className="flex items-center space-x-3">
              {getCurrencyIcon(selectedCurrency)}
              <span className="font-medium text-gray-900">
                {getCurrencyName(selectedCurrency)} ({selectedCurrency.toUpperCase()})
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              ></div>
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                {availableCurrencies.map((currency) => (
                  <button
                    key={currency}
                    type="button"
                    onClick={() => {
                      setSelectedCurrency(currency);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                      selectedCurrency === currency ? 'bg-blue-50' : ''
                    }`}
                  >
                    {getCurrencyIcon(currency)}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{getCurrencyName(currency)}</p>
                      <p className="text-sm text-gray-500">{currency.toUpperCase()}</p>
                    </div>
                    {selectedCurrency === currency && (
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        {estimatedAmount && selectedCurrency && (
          <p className="mt-2 text-sm text-gray-600">
            Estimated amount: <strong>{typeof estimatedAmount === 'number' ? estimatedAmount.toFixed(8) : estimatedAmount} {selectedCurrency.toUpperCase()}</strong>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="crypto-research-confirmation" className="flex items-start gap-3 text-sm text-gray-700">
          <input
            id="crypto-research-confirmation"
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
        disabled={isProcessing || !complianceChecked || !selectedCurrency}
        className="btn-primary w-full"
      >
        {isProcessing ? "Creating Order..." : "Place Order"}
      </button>
    </form>
    </>
  );
}

