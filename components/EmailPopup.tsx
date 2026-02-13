"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { XMarkIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { trackNewsletterSignup, trackEvent } from "@/lib/analytics";

interface EmailPopupProps {
  onClose?: () => void;
}

export default function EmailPopup({ onClose }: EmailPopupProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Don't show EmailPopup on products page - DiscountPopup handles that
    const isProductsPage = pathname?.startsWith("/products");
    
    // Check if user has already seen the popup
    const hasSeenPopup = localStorage.getItem("hasSeenEmailPopup");
    // If onClose is provided, it means it's being triggered manually (from button click)
    if (!onClose && !hasSeenPopup && !isProductsPage) {
      // Show popup after 2 seconds (only on non-products pages)
      setTimeout(() => {
        setIsOpen(true);
      }, 2000);
    } else if (onClose) {
      // If onClose is provided, show immediately (triggered by button)
      setIsOpen(true);
    }
  }, [onClose, pathname]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("hasSeenEmailPopup", "true");
    if (onClose) onClose();
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
        localStorage.setItem("hasSeenEmailPopup", "true");
        
        // Track newsletter signup
        const source = onClose ? 'homepage' : 'popup';
        trackNewsletterSignup(source);
        trackEvent('discount_code_requested', {
          source: source,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {isSubmitted ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
            <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              Thank You!
              <SparklesIcon className="h-6 w-6 text-yellow-500" />
            </h3>
            <p className="text-gray-600">
              Check your email for your <strong>10% discount code</strong>!
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Get 10% Off!
              </h2>
              <p className="text-gray-600">
                Enter your email for <strong>10% off</strong> any future order.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Processing..." : "Get My Discount Code"}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Unsubscribe anytime. We respect your privacy.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
