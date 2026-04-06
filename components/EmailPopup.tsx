"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { XMarkIcon, SparklesIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const PROMO_CODE = "SAVE15";

interface EmailPopupProps {
  onClose?: () => void;
}

/** Sitewide extended sale — copy SAVE15 (no email signup). */
export default function EmailPopup({ onClose }: EmailPopupProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const isProductsPage = pathname?.startsWith("/products");
    const hasSeenPopup = localStorage.getItem("hasSeenEmailPopup");
    if (!onClose && !hasSeenPopup && !isProductsPage) {
      setTimeout(() => {
        setIsOpen(true);
      }, 2000);
    } else if (onClose) {
      setIsOpen(true);
    }
  }, [onClose, pathname]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("hasSeenEmailPopup", "true");
    if (onClose) onClose();
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      toast.success(`${PROMO_CODE} copied — 15% off EXTENDED`);
      handleClose();
    } catch {
      toast.error("Could not copy");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in duration-300">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            15% off EXTENDED
            <SparklesIcon className="h-8 w-8 text-orange-500" />
          </h2>
          <p className="text-gray-600">
            Sale extended one more week. Use <strong>{PROMO_CODE}</strong> at checkout for 15% off sitewide.
          </p>
        </div>

        <button
          type="button"
          onClick={copyCode}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          Copy {PROMO_CODE}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Same code as the top banner — tap to copy anytime.
        </p>
      </div>
    </div>
  );
}
