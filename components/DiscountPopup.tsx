"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { trackNewsletterSignup, trackEvent } from "@/lib/analytics";

const DISCOUNT_POPUP_KEY = "summersteeze_discount_popup_seen";

interface DiscountPopupProps {
  showAfterAgeVerification?: boolean;
}

export default function DiscountPopup({ showAfterAgeVerification = false }: DiscountPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    // Check if user has already seen the popup
    const hasSeenPopup = localStorage.getItem(DISCOUNT_POPUP_KEY);
    
    if (!hasSeenPopup) {
      if (showAfterAgeVerification) {
        // Wait for age verification to complete, then show after 5 seconds
        const checkAgeVerification = setInterval(() => {
          const ageVerified = localStorage.getItem("summersteeze_age_verified");
          if (ageVerified === "true") {
            clearInterval(checkAgeVerification);
            // Show popup 5 seconds after age verification
            setTimeout(() => {
              setIsOpen(true);
            }, 5000);
          }
        }, 100);

        // Cleanup interval after 5 minutes if age verification never happens
        setTimeout(() => {
          clearInterval(checkAgeVerification);
        }, 300000);

        return () => clearInterval(checkAgeVerification);
      } else {
        // Show after 15 seconds if not waiting for age verification
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/newsletter/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        localStorage.setItem(DISCOUNT_POPUP_KEY, "true");
        
        // Track newsletter signup
        trackNewsletterSignup('popup');
        trackEvent('discount_code_requested', {
          source: 'products_page_popup',
          discount_type: '10_percent_off',
        });
        
        // Close popup after 3 seconds
        setTimeout(() => {
          setIsOpen(false);
        }, 3000);
      } else {
        alert("Failed to subscribe. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 right-4 z-[70] w-full max-w-sm animate-in slide-in-from-right duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-500 p-6">
        {/* Close Button */}
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

        {!isSubmitted ? (
          <>
            <div className="text-center mb-4">
              <div className="inline-block bg-blue-100 rounded-full p-3 mb-3">
                <svg
                  className="w-8 h-8 text-blue-600"
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
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Get 10% Off a Future Order!
              </h3>
              <p className="text-sm text-gray-600">
                Enter your email to receive your discount code
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Submitting..." : "Get 10% Off Code"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="inline-block bg-green-100 rounded-full p-3 mb-3">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Check Your Email!</h3>
            <p className="text-sm text-gray-600">
              Your 15% discount code has been sent to your inbox.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

