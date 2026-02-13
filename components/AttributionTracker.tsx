"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function Tracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Helper to set cookie
    const setCookie = (name: string, value: string, days: number) => {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      const expires = "; expires=" + date.toUTCString();
      document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
    };

    // Helper to get cookie
    const getCookie = (name: string) => {
      const nameEQ = name + "=";
      const ca = document.cookie.split(';');
      for(let i=0;i < ca.length;i++) {
        let c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
      }
      return null;
    };

    // Check for UTM parameters
    const source = searchParams.get("utm_source") || searchParams.get("source");
    const medium = searchParams.get("utm_medium");
    const campaign = searchParams.get("utm_campaign");
    const content = searchParams.get("utm_content");
    const term = searchParams.get("utm_term");
    
    // Check for specific ad platform IDs
    const gclid = searchParams.get("gclid");
    const fbclid = searchParams.get("fbclid");
    const msclkid = searchParams.get("msclkid");
    const ttclid = searchParams.get("ttclid");

    let detectedSource = source;
    let detectedMedium = medium;

    if (gclid && !detectedSource) {
      detectedSource = "google";
      detectedMedium = "cpc";
    } else if (fbclid && !detectedSource) {
      detectedSource = "facebook";
      detectedMedium = "cpc";
    } else if (msclkid && !detectedSource) {
      detectedSource = "bing";
      detectedMedium = "cpc";
    } else if (ttclid && !detectedSource) {
      detectedSource = "tiktok";
      detectedMedium = "cpc";
    }

    // Capture explicit source from URL if present (e.g. from QR code ?source=qr)
    if (detectedSource || detectedMedium || campaign) {
      const attributionData = {
        source: detectedSource,
        medium: detectedMedium,
        campaign: campaign,
        content: content,
        term: term,
        timestamp: new Date().toISOString()
      };

      // Set cookie for 30 days
      setCookie("summersteeze_attribution", JSON.stringify(attributionData), 30);
    }

    // Capture initial referrer (if not internal)
    if (typeof document !== 'undefined' && document.referrer && !document.referrer.includes(window.location.hostname)) {
      const existingReferrer = getCookie("summersteeze_initial_referrer");
      if (!existingReferrer) {
         setCookie("summersteeze_initial_referrer", document.referrer, 30);
      }
    }

  }, [searchParams]);

  return null;
}

export default function AttributionTracker() {
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  );
}
