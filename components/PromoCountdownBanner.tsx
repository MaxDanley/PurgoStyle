"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const PHOENIX_TZ = "America/Phoenix";
const PROMO_CODE = "SAVE15";

/** Midnight Arizona time, 7 calendar days after "today" in Phoenix. */
function getPromotionEndMs(): number {
  const todayPhoenix = new Date().toLocaleDateString("en-CA", {
    timeZone: PHOENIX_TZ,
  });
  const [y, m, d] = todayPhoenix.split("-").map(Number);
  // Phoenix is always UTC-7 (no DST): local midnight = 07:00 UTC that calendar day
  return Date.UTC(y, m - 1, d + 7, 7, 0, 0, 0);
}

function formatRemaining(ms: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds };
}

export default function PromoCountdownBanner() {
  const endMs = useMemo(() => getPromotionEndMs(), []);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = endMs - now;
  if (remaining <= 0) return null;

  const { days, hours, minutes, seconds } = formatRemaining(remaining);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      toast.success("Code copied!");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div
      className="relative z-[100] w-full bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white shadow-md"
      role="region"
      aria-label="Limited time promotion"
    >
      <div className="container-custom flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 sm:gap-6 py-2.5 px-4 text-center text-sm sm:text-base font-medium">
        <p className="leading-snug">
          <span className="font-bold">15% off sitewide</span>
          <span className="mx-1.5 opacity-90">·</span>
          <span className="opacity-95">Ends midnight Arizona</span>
        </p>
        <div
          className="flex flex-wrap items-center justify-center gap-2 tabular-nums tracking-tight"
          aria-live="polite"
        >
          {days > 0 && (
            <span className="rounded bg-black/20 px-2 py-0.5">
              {days}d
            </span>
          )}
          <span className="rounded bg-black/20 px-2 py-0.5">
            {String(hours).padStart(2, "0")}h
          </span>
          <span className="rounded bg-black/20 px-2 py-0.5">
            {String(minutes).padStart(2, "0")}m
          </span>
          <span className="rounded bg-black/20 px-2 py-0.5">
            {String(seconds).padStart(2, "0")}s
          </span>
        </div>
        <button
          type="button"
          onClick={copyCode}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-1 text-sm font-bold text-orange-700 shadow hover:bg-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Code <span className="font-mono tracking-wide">{PROMO_CODE}</span>
          <span className="text-xs font-normal opacity-80">(tap to copy)</span>
        </button>
      </div>
    </div>
  );
}
