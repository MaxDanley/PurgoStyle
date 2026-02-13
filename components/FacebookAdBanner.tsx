"use client";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { getFacebookReferralStatus, clearFacebookReferral } from "@/lib/facebook-referral";

export default function FacebookAdBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has Facebook referral
    const hasReferral = getFacebookReferralStatus();
    
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem("fb_ad_banner_dismissed");
    
    if (hasReferral && !dismissed) {
      setShowBanner(true);
    }
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    setIsDismissed(true);
    localStorage.setItem("fb_ad_banner_dismissed", "true");
  };

  if (!showBanner || isDismissed) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 relative z-50">
      <div className="container-custom flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">
              🎉 Special Offer: 30% OFF + FREE Shipping for Facebook/Instagram visitors!
            </p>
            <p className="text-xs opacity-90 mt-0.5">
              Your discount will be automatically applied at checkout
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 ml-4 text-white/80 hover:text-white transition-colors"
          aria-label="Dismiss banner"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}


