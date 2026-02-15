"use client";

import Link from "next/link";

export default function CancelPage() {
  return (
    <div className="max-w-md text-center p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Payment cancelled</h1>
        <p className="text-gray-600 mb-6">
          Your payment was cancelled. No charges were made. You can try again anytime.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
        >
          Return to home
        </Link>
    </div>
  );
}
