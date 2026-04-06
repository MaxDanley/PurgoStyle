"use client";

import { usePathname } from "next/navigation";
import GoogleMerchantWidget from "@/components/GoogleMerchantWidget";
import PromoCountdownBanner from "@/components/PromoCountdownBanner";

/** Website A PayPal landing: no promo banner, no merchant widget bubble. */
const MINIMAL_CHECKOUT_PATHS = ["/checkout/paypal"];

function isMinimalCheckoutPath(pathname: string): boolean {
  return MINIMAL_CHECKOUT_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export default function ConditionalRootOverlays() {
  const pathname = usePathname() ?? "";
  const minimal = isMinimalCheckoutPath(pathname);

  return (
    <>
      {!minimal && <GoogleMerchantWidget />}
      {!minimal && <PromoCountdownBanner />}
    </>
  );
}
