"use client";

import { useState } from "react";

interface COAImageViewerProps {
  coaUrl: string;
  productName?: string;
}

export default function COAImageViewer({ coaUrl, productName }: COAImageViewerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Convert PDF URL to image URL if it's a PDF
  // For now, we'll use an iframe approach or try to display as image
  // Note: PDFs won't work directly in img tags, so we'll use iframe for embedding
  
  return (
    <>
      <div className="cursor-pointer" onClick={() => setIsModalOpen(true)}>
        <div className="border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-500 transition-colors bg-white">
          <iframe
            src={`${coaUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-64 md:h-96"
            title={`COA for ${productName || "product"}`}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Click to view full size
        </p>
      </div>

      {/* Full Screen Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative w-full h-full p-4 md:p-8" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6 text-gray-900"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="h-full w-full flex items-center justify-center">
              <iframe
                src={coaUrl}
                className="w-full h-full max-w-6xl max-h-[90vh] border-4 border-white rounded-lg shadow-2xl"
                title={`COA for ${productName || "product"}`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

