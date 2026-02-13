"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MdCardGiftcard } from "react-icons/md";
import { HiNewspaper } from "react-icons/hi";
import { MdScience } from "react-icons/md";

function UnsubscribeForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  
  const [subscriptions, setSubscriptions] = useState({
    promotions: true,
    newsletters: true,
    research: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Fetch existing preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!email) {
        setIsFetching(false);
        return;
      }

      try {
        const response = await fetch(`/api/newsletter/preferences?email=${encodeURIComponent(email)}`);
        if (response.ok) {
          const data = await response.json();
          setSubscriptions(data);
        }
      } catch (error) {
        console.error("Error fetching preferences:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchPreferences();
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/newsletter/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          preferences: subscriptions,
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        alert("Failed to update preferences. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof typeof subscriptions) => {
    setSubscriptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {isFetching ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            <p className="text-gray-600 mt-4">Loading preferences...</p>
          </div>
        ) : isSubmitted ? (
          <div className="text-center py-8">
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Preferences Updated!
            </h2>
            <p className="text-gray-600">
              Your email preferences have been successfully updated.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Email Preferences
              </h1>
              <p className="text-gray-600">
                {email ? `Manage preferences for ${email}` : "Manage your email preferences"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Promotions Toggle */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-brand-500 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MdCardGiftcard className="text-brand-600 text-xl" />
                    <h3 className="font-semibold text-gray-900">
                      Promotions & Discounts
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Receive special offers and discount codes
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("promotions")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                    subscriptions.promotions ? "bg-brand-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      subscriptions.promotions ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Newsletter Toggle */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-brand-500 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <HiNewspaper className="text-brand-600 text-xl" />
                    <h3 className="font-semibold text-gray-900">
                      Newsletter
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Get updates about new products and company news
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("newsletters")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                    subscriptions.newsletters ? "bg-brand-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      subscriptions.newsletters ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* New arrivals & updates toggle */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-brand-500 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MdScience className="text-brand-600 text-xl" />
                    <h3 className="font-semibold text-gray-900">
                      New arrivals &amp; updates
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    New products, restocks, and offers
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("research")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                    subscriptions.research ? "bg-brand-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      subscriptions.research ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Saving..." : "Save Preferences"}
              </button>

              <p className="text-xs text-gray-500 text-center">
                You can change these preferences at any time
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            <p className="text-gray-600 mt-4">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <UnsubscribeForm />
    </Suspense>
  );
}
