"use client";

import Link from "next/link";
import { FaTshirt } from "react-icons/fa";
import { HiOutlineSparkles } from "react-icons/hi";
import { SHIPPING_ESTIMATE_SNIPPET } from "@/lib/shipping";

export default function ProductsPageHeader() {
  return (
    <>
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-100 px-4 py-2 text-sm font-medium text-brand-700 mb-4">
          <FaTshirt className="w-4 h-4" />
          Shop & design your own
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Products
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Arizona activewear, premium tees, and apparel. Start with a ready-made style or design your own in our studio.
        </p>
        <p className="text-sm text-gray-600 max-w-2xl mx-auto mt-4 leading-relaxed">
          {SHIPPING_ESTIMATE_SNIPPET}{" "}
          <Link href="/shipping" className="text-brand-600 font-medium hover:underline underline-offset-2">
            Shipping details
          </Link>
        </p>
      </div>
      <div className="flex items-center justify-center gap-4 mb-8">
        <span className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-gray-300" />
        <HiOutlineSparkles className="w-5 h-5 text-brand-500" />
        <span className="h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-gray-300" />
      </div>
    </>
  );
}
