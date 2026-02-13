"use client";

import { useState } from "react";
import React from "react";
import { usePathname } from "next/navigation";
import { XMarkIcon } from "@heroicons/react/24/outline";
import EmailPopup from "./EmailPopup";

export default function DiscountFloatingButton() {
  const [showPopup, setShowPopup] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const pathname = usePathname();

  // Don't show on home page
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

  return (
    <>
      <div className="fixed bottom-6 left-6 z-40 flex items-center gap-2">
        <button
          onClick={() => setShowPopup(true)}
          className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
          aria-label="Claim 10% Off"
        >
          <span>Claim 10% Off</span>
        </button>
        <button
          onClick={handleClose}
          className="bg-white border border-gray-200 rounded-lg p-2 shadow-lg hover:shadow-xl transition-all text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          aria-label="Close"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {showPopup && (
        <EmailPopup onClose={() => setShowPopup(false)} />
      )}
    </>
  );
}
