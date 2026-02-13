"use client";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false);
  const [analyticsConsent] = useState(true);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookieConsent");
    
    if (!consent) {
      // Show popup after a short delay
      setTimeout(() => {
        setIsOpen(true);
      }, 1000);
    } else {
      // If already consented and analytics was accepted, load GA and Facebook Pixel
      const consentData = JSON.parse(consent);
      if (consentData.analytics) {
        loadGoogleAnalytics();
        loadFacebookPixel();
      }
    }
  }, []);

  const loadGoogleAnalytics = () => {
    // Dynamically load Google Analytics if consent given
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GA_ID) {
      // Add gtag script
      const script1 = document.createElement('script');
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`;
      script1.async = true;
      document.head.appendChild(script1);

      // Initialize gtag
      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
      `;
      document.head.appendChild(script2);
    }
  };

  const loadFacebookPixel = () => {
    // Dynamically load Facebook Pixel if consent given
    if (typeof window !== 'undefined') {
      // Facebook Pixel base code - loads library once
      const script1 = document.createElement('script');
      script1.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        ${process.env.NEXT_PUBLIC_FB_PIXEL_ID ? `fbq('init', '${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');` : ''}
        fbq('init', '723224700511807');
        fbq('init', '843554308516855');
        fbq('init', '1410639170465339');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(script1);

      // Add noscript fallbacks for all pixels
      if (process.env.NEXT_PUBLIC_FB_PIXEL_ID) {
        const noscript1 = document.createElement('noscript');
        noscript1.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FB_PIXEL_ID}&ev=PageView&noscript=1"/>`;
        document.body.appendChild(noscript1);
      }
      
      const noscript2 = document.createElement('noscript');
      noscript2.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=723224700511807&ev=PageView&noscript=1"/>`;
      document.body.appendChild(noscript2);
      
      const noscript3 = document.createElement('noscript');
      noscript3.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=843554308516855&ev=PageView&noscript=1"/>`;
      document.body.appendChild(noscript3);
      
      const noscript4 = document.createElement('noscript');
      noscript4.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=1410639170465339&ev=PageView&noscript=1"/>`;
      document.body.appendChild(noscript4);
    }
  };

  const handleAcceptAll = () => {
    saveConsent(true, true);
    setIsOpen(false);
  };

  const handleAcceptNecessary = () => {
    saveConsent(false, true);
    setIsOpen(false);
  };

  const handleCustomize = () => {
    saveConsent(analyticsConsent, true);
    setIsOpen(false);
  };

  const saveConsent = (analytics: boolean, necessary: boolean) => {
    const consentData = {
      analytics,
      necessary,
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem("cookieConsent", JSON.stringify(consentData));
    
    // If analytics consent given, load GA and Facebook Pixel
    if (analytics) {
      loadGoogleAnalytics();
      loadFacebookPixel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4 pointer-events-none">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg border border-gray-200 pointer-events-auto animate-slide-up">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <p className="text-sm text-gray-700 leading-relaxed">
                By clicking "Accept All Cookies", you agree to the storing of cookies on your device to enhance site navigation, analyze site usage, and assist in our{" "}
                <a href="/privacy" className="text-blue-600 hover:text-blue-700 underline">
                  Privacy policy
                </a>
                .
              </p>
            </div>
            <button
              onClick={() => handleAcceptNecessary()}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleAcceptAll}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
            >
              Accept All
            </button>
            <button
              onClick={handleCustomize}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 transition-colors"
            >
              Manage cookies
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
