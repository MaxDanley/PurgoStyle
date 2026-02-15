"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const DESTINATION_BASE = "https://www.purgolabs.com/payment-stripe-success";

function PaymentRedirectContent() {
  const searchParams = useSearchParams();
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    const clientReferenceId = searchParams.get("client_reference_id");
    const params = new URLSearchParams();
    if (clientReferenceId) {
      params.set("client_reference_id", clientReferenceId);
    }
    const destination = params.toString()
      ? `${DESTINATION_BASE}?${params.toString()}`
      : DESTINATION_BASE;

    // Brief delay so loader is visible, then redirect
    const timer = setTimeout(() => {
      window.location.href = destination;
    }, 800);

    return () => clearTimeout(timer);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"
          aria-hidden
        />
        <p className="text-sm text-gray-500">
          {redirecting ? "Completing payment…" : "Redirecting…"}
        </p>
      </div>
    </div>
  );
}

export default function PaymentRedirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" aria-hidden />
      </div>
    }>
      <PaymentRedirectContent />
    </Suspense>
  );
}
