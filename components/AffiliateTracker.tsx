"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const AFFILIATE_STORAGE_KEY = "purgo_affiliate_ref";
const AFFILIATE_EXPIRY_KEY = "purgo_affiliate_ref_expiry";
const AFFILIATE_EXPIRY_DAYS = 30;

export function getStoredAffiliateRef(): string | null {
  if (typeof window === "undefined") return null;

  const expiry = localStorage.getItem(AFFILIATE_EXPIRY_KEY);
  if (expiry && new Date(expiry) < new Date()) {
    // Expired, clear it
    localStorage.removeItem(AFFILIATE_STORAGE_KEY);
    localStorage.removeItem(AFFILIATE_EXPIRY_KEY);
    return null;
  }

  return localStorage.getItem(AFFILIATE_STORAGE_KEY);
}

export function setStoredAffiliateRef(code: string): void {
  if (typeof window === "undefined") return;

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + AFFILIATE_EXPIRY_DAYS);

  localStorage.setItem(AFFILIATE_STORAGE_KEY, code);
  localStorage.setItem(AFFILIATE_EXPIRY_KEY, expiryDate.toISOString());
}

export default function AffiliateTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get("ref");
    
    if (refCode) {
      // Validate the affiliate code
      validateAndStoreAffiliate(refCode);
    }
  }, [searchParams]);

  const validateAndStoreAffiliate = async (code: string) => {
    try {
      // Determine source - if coming from QR code scan it's typically direct URL access
      // We pass "qr" as the default since QR codes lead to the main page with ?ref=CODE
      const response = await fetch("/api/affiliate/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, source: "qr" }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          setStoredAffiliateRef(data.discountCode);
          console.log("Affiliate tracking set:", data.discountCode);
        }
      }
    } catch (error) {
      console.error("Failed to validate affiliate code:", error);
    }
  };

  return null; // This component doesn't render anything
}

