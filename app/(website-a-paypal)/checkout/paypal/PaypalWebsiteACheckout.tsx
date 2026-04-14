"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type PayPalNamespace = {
  Buttons: (opts: {
    style?: Record<string, string>;
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onError?: (err: unknown) => void;
    onCancel?: () => void;
  }) => { render: (el: HTMLElement) => void };
};

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

interface Props {
  paypalClientId: string;
  paypalOrderId: string;
  internalOrderId: string;
  currency: string;
  /** Website A URL when user cancels PayPal (matches WEBSITE_A_PAYMENT_CANCEL_URL). */
  websiteACancelUrl: string;
}

export default function PaypalWebsiteACheckout({
  paypalClientId,
  paypalOrderId,
  internalOrderId,
  currency,
  websiteACancelUrl,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);
  const [sdkReady, setSdkReady] = useState(false);

  // No enable-funding: PayPal picks eligible methods. disable-funding hides Venmo, Pay Later, and PayPal Credit.
  // Buyers still see PayPal wallet + "Debit or Credit Card" when offered for your account/region (PayPal controls this).
  // Card-only (hide PayPal wallet too) needs a different product path (e.g. standalone CARD button / card fields) — ask PayPal support.
  const sdkSrc = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
    paypalClientId
  )}&currency=${encodeURIComponent(
    currency
  )}&intent=capture&components=buttons&disable-funding=venmo,paylater,credit`;

  useEffect(() => {
    renderedRef.current = false;
    if (containerRef.current) containerRef.current.innerHTML = "";
  }, [paypalOrderId]);

  useEffect(() => {
    if (!sdkReady || !containerRef.current || renderedRef.current || !window.paypal) return;
    renderedRef.current = true;

    window.paypal
      .Buttons({
        style: {
          layout: "vertical",
          shape: "rect",
          label: "paypal",
          color: "gold",
        },
        createOrder: async () => paypalOrderId,
        onApprove: async (data) => {
          const res = await fetch("/api/paypal/capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              internalOrderId,
              paypalOrderId: data.orderID,
            }),
          });
          const json = (await res.json()) as { redirectUrl?: string; error?: string };
          if (json.redirectUrl) {
            window.location.href = json.redirectUrl;
            return;
          }
          alert(json.error || "Payment could not be completed.");
        },
        onError: (err) => {
          console.error(err);
          alert("Payment could not be completed. Please try again.");
        },
        onCancel: () => {
          window.location.href = websiteACancelUrl;
        },
      })
      .render(containerRef.current);
  }, [sdkReady, paypalOrderId, internalOrderId, websiteACancelUrl]);

  return (
    <>
      <Script src={sdkSrc} strategy="afterInteractive" onLoad={() => setSdkReady(true)} />
      <div
        ref={containerRef}
        className="min-h-[120px] flex flex-col items-center justify-center"
      />
      {!sdkReady && (
        <p className="text-center text-sm text-gray-400 mt-4">Loading…</p>
      )}
    </>
  );
}
