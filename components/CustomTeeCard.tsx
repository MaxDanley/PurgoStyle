"use client";

import Link from "next/link";
import { FaTshirt } from "react-icons/fa";
import { HiPencilAlt } from "react-icons/hi";

/**
 * Card displayed in product grids (products page, about page) that links to the
 * design studio. Uses a React icon instead of a product image.
 */
export default function CustomTeeCard() {
  return (
    <Link href="/custom-design/studio" className="group block">
      <div className="card overflow-hidden h-full hover:scale-[1.02] transition-all duration-300 border-2 border-dashed border-brand-200 hover:border-brand-400 bg-gradient-to-br from-brand-50 to-white">
        {/* Icon as "product image" */}
        <div className="relative h-72 flex items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50 overflow-hidden rounded-lg">
          <div className="absolute inset-0 flex items-center justify-center">
            <FaTshirt className="w-28 h-28 md:w-32 md:h-32 text-brand-500 group-hover:text-brand-600 group-hover:scale-110 transition-all duration-300" />
          </div>
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-1.5 text-sm font-medium text-brand-700 shadow-sm">
            <HiPencilAlt className="w-4 h-4" />
            Design your own
          </span>
        </div>

        {/* Card info */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors">
            Custom T-Shirt
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Create your own design in our studio. Add text, upload your logo, choose colors—no minimums.
          </p>
          <div className="flex items-center justify-between">
            <p className="text-sm text-brand-600 font-semibold">Design in Studio</p>
            <span className="inline-flex items-center gap-1 bg-brand-500 text-white px-4 py-2 rounded-full text-sm font-medium group-hover:bg-brand-600 transition-colors">
              Create
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
