"use client";

import { useState, useEffect } from "react";

const AGE_VERIFICATION_KEY = "purgolabs_age_verified";

export default function AgeVerificationModal() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if user has already verified their age
    const verified = localStorage.getItem(AGE_VERIFICATION_KEY);
    if (!verified) {
      setShowModal(true);
    }
  }, []);

  const handleConfirm = (is21OrOlder: boolean) => {
    if (is21OrOlder) {
      // Store verification in localStorage
      localStorage.setItem(AGE_VERIFICATION_KEY, "true");
      setShowModal(false);
    } else {
      // If under 21, redirect away (or show message)
      alert("You must be 21 years or older to access this website.");
      // Optionally redirect to home or another page
      window.location.href = "/";
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 animate-in zoom-in duration-300">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
            <svg
              className="h-8 w-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Age Verification Required
          </h2>

          <p className="text-lg text-gray-600 mb-8">
            Are you 21 years of age or older?
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => handleConfirm(true)}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Yes, I am 21+
            </button>
            <button
              onClick={() => handleConfirm(false)}
              className="px-8 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              No
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            You must be 21 years or older to access this website. This verification
            is saved to your browser and will not appear again.
          </p>
        </div>
      </div>
    </div>
  );
}

