"use client";

import { useCart } from "@/lib/store";
import toast from "react-hot-toast";

interface BacWaterRecommendationProps {
  hasBacWater: boolean;
}

export default function BacWaterRecommendation({ hasBacWater }: BacWaterRecommendationProps) {
  const { addItem } = useCart();

  if (hasBacWater) return null;

  const handleAddBacWater = () => {
    addItem({
      productId: "8", // BAC Water
      variantId: "bac-10ml",
      productName: "BAC Water",
      variantSize: "10ml",
      price: 8.00,
      image: "/bac_final_product.png",
      quantity: 1,
    });
    toast.success("BAC Water added to cart!");
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-2">Don't forget BAC Water!</h4>
          <p className="text-sm text-gray-600 mb-3">
            Add BAC Water to your cart to ensure you can properly reconstitute your peptides.
          </p>
          <button
            type="button"
            onClick={handleAddBacWater}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add BAC Water ($8.00)
          </button>
        </div>
      </div>
    </div>
  );
}
