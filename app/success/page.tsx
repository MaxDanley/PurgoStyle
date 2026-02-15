"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const WEBSITE_A_RETURN = "https://www.purgolabs.com/payment-return";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`);
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          setStatus("error");
          return;
        }

        if (data.payment_status === "paid" || data.payment_status === "unpaid") {
          setStatus("ok");
          setRedirecting(true);
          window.location.href = `${WEBSITE_A_RETURN}?session_id=${encodeURIComponent(sessionId)}`;
        } else {
          setStatus("error");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (status === "loading" || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"
            aria-hidden
          />
          <p className="text-sm text-gray-500">
            {redirecting ? "Redirecting to complete your order…" : "Verifying payment…"}
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Payment verification issue</h1>
          <p className="text-gray-600 mb-4">
            We couldn&apos;t confirm your payment. If you were charged, we&apos;ll process your order shortly.
            Contact us at{" "}
            <a href="mailto:help@summersteez.com" className="text-brand-600 hover:underline">
              help@summersteez.com
            </a>
            .
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
          >
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" aria-hidden />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
