"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { EnvelopeIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

interface StockNotificationButtonProps {
  variantId: string;
  variantName: string;
  isOutOfStock: boolean;
}

export default function StockNotificationButton({
  variantId,
  variantName,
  isOutOfStock,
}: StockNotificationButtonProps) {
  const { data: session } = useSession();
  const [showPopup, setShowPopup] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribeToPromotions, setSubscribeToPromotions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOutOfStock) {
    return null; // Don't show button if in stock
  }

  const handleClick = () => {
    if (session?.user) {
      // Logged in - auto-submit with user's email
      handleSubmit(session.user.email!);
    } else {
      // Not logged in - show popup
      setShowPopup(true);
    }
  };

  const handleSubmit = async (userEmail?: string) => {
    const emailToUse = userEmail || email;
    
    if (!emailToUse) {
      toast.error("Please enter your email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/stock-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId,
          email: emailToUse,
          subscribeToPromotions,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.inStock) {
          toast.success("Product is already in stock!");
        } else if (data.alreadyExists) {
          toast("You're already on the notification list", {
            icon: <InformationCircleIcon className="h-5 w-5 text-blue-500" />,
          });
        } else {
          toast.success(data.message);
        }
        setShowPopup(false);
        setEmail("");
        setSubscribeToPromotions(false);
      } else {
        toast.error(data.error || "Failed to subscribe to notifications");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        <EnvelopeIcon className="h-5 w-5" />
        Email me when this product is available
      </button>

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">
              Notify me when back in stock
            </h3>
            <p className="text-gray-600 mb-4">
              Enter your email to be notified when <strong>{variantName}</strong> is back in stock.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="subscribe"
                  checked={subscribeToPromotions}
                  onChange={(e) => setSubscribeToPromotions(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <label htmlFor="subscribe" className="ml-2 text-sm text-gray-600">
                  Also subscribe to future promotions and deals
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:bg-gray-400"
              >
                {isSubmitting ? "Subscribing..." : "Notify Me"}
              </button>
              <button
                onClick={() => {
                  setShowPopup(false);
                  setEmail("");
                  setSubscribeToPromotions(false);
                }}
                disabled={isSubmitting}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
