"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { trackEvent } from "@/lib/analytics";

const DISCOUNT_POPUP_KEY = "summersteeze_discount_popup_seen";
const PROMO_CODE = "SAVE15";

interface DiscountPopupProps {
  showAfterAgeVerification?: boolean;
}

export default function DiscountPopup({ showAfterAgeVerification = false }: DiscountPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem(DISCOUNT_POPUP_KEY);

    if (!hasSeenPopup) {
      if (showAfterAgeVerification) {
        const checkAgeVerification = setInterval(() => {
          const ageVerified = localStorage.getItem("summersteeze_age_verified");
          if (ageVerified === "true") {
            clearInterval(checkAgeVerification);
            setTimeout(() => {
              setIsOpen(true);
            }, 5000);
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkAgeVerification);
        }, 300000);

        return () => clearInterval(checkAgeVerification);
      } else {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 15000);
        return () => clearTimeout(timer);
      }
    }
  }, [showAfterAgeVerification]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(DISCOUNT_POPUP_KEY, "true");
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      trackEvent("discount_code_copied", {
        source: "products_page_popup",
        discount_type: "save15_extended",
      });
      toast.success(`${PROMO_CODE} copied — 15% off at checkout`);
      handleClose();
    } catch {
      toast.error("Could not copy");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 right-4 z-[70] w-full max-w-sm animate-in slide-in-from-right duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-orange-500 p-6">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="text-center mb-4">
          <div className="inline-block bg-orange-100 rounded-full p-3 mb-3">
            <svg
              className="w-8 h-8 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">15% off EXTENDED</h3>
          <p className="text-sm text-gray-600">
            We extended the sale one more week. Use code <strong className="text-gray-900">{PROMO_CODE}</strong> at checkout for 15% off sitewide.
          </p>
        </div>

        <button
          type="button"
          onClick={copyCode}
          className="w-full bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors"
        >
          Copy {PROMO_CODE}
        </button>
      </div>
    </div>
  );
}
