"use client";

import { useState } from "react";
import React from "react";
import { usePathname } from "next/navigation";
import { XMarkIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const PROMO_CODE = "SAVE15";

export default function DiscountFloatingButton() {
  const [isVisible, setIsVisible] = useState(true);
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  if (!isVisible) {
    return null;
  }

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
  };

  const copyCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      toast.success(`${PROMO_CODE} copied — 15% off EXTENDED sitewide`);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-40 flex items-center gap-2">
      <button
        type="button"
        onClick={copyCode}
        className="bg-white border border-orange-200 rounded-lg px-4 py-2 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
        aria-label="Copy SAVE15 — 15% off extended"
      >
        <span>15% off EXTENDED · {PROMO_CODE}</span>
      </button>
      <button
        type="button"
        onClick={handleClose}
        className="bg-white border border-gray-200 rounded-lg p-2 shadow-lg hover:shadow-xl transition-all text-gray-500 hover:text-gray-700 hover:bg-gray-50"
        aria-label="Close"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
