"use client";

import Script from "next/script";

export default function GoogleMerchantWidget() {
  return (
    <Script
      id="merchantWidgetScript"
      src="https://www.gstatic.com/shopping/merchant/merchantwidget.js"
      strategy="lazyOnload"
      onLoad={() => {
        if (
          typeof window !== "undefined" &&
          (window as unknown as { merchantwidget?: { start: (o: object) => void } }).merchantwidget
        ) {
          (
            window as unknown as { merchantwidget: { start: (o: object) => void } }
          ).merchantwidget.start({
            merchant_id: 5685077232,
            position: "BOTTOM_RIGHT",
            region: "US",
          });
        }
      }}
    />
  );
}
