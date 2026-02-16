"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Custom orders are now added to the normal cart and purchased via Stripe checkout.
 * This page redirects to the design studio; users add their design to cart from there.
 */
export default function CustomDesignOrderPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/custom-design/studio");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="container-custom max-w-md text-center">
        <p className="text-gray-600 mb-4">Redirecting to Design Studio…</p>
        <p className="text-sm text-gray-500 mb-6">
          Custom designs are added to your cart and checked out like any other order.
        </p>
        <Link href="/custom-design/studio" className="text-brand-600 hover:text-brand-700 font-medium">
          Go to Design Studio →
        </Link>
      </div>
    </div>
  );
}
