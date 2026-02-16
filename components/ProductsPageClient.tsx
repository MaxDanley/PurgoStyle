"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import CustomTeeCard from "@/components/CustomTeeCard";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  category: string;
  image: string;
  featured: boolean;
  variants: Array<{
    id: string;
    size: string;
    price: number;
    sku: string;
    stockCount: number;
  }>;
}

interface ProductsPageClientProps {
  products: Product[];
}

export default function ProductsPageClient({ products: initialProducts }: ProductsPageClientProps) {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");

  // Handle search query from URL
  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  // Hide DB custom-tee from grid; it's shown as CustomTeeCard with icon instead
  const CUSTOM_TEE_SLUGS = ["custom-tee", "custom-tshirt", "custom-t-shirt"];

  const filteredProducts = useMemo(() => {
    const withoutCustomTee = initialProducts.filter(
      (p) => !CUSTOM_TEE_SLUGS.includes(p.slug?.toLowerCase() ?? "")
    );
    if (!searchQuery.trim()) {
      return withoutCustomTee;
    }
    const query = searchQuery.toLowerCase().trim();
    return withoutCustomTee.filter((product) => {
      const nameMatch = product.name.toLowerCase().includes(query);
      const descriptionMatch = product.description.toLowerCase().includes(query);
      const categoryMatch = product.category.toLowerCase().includes(query);
      return nameMatch || descriptionMatch || categoryMatch;
    });
  }, [searchQuery, initialProducts]);

  return (
    <>
      {/* Search Bar */}
      <div className="mb-8">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name, description, or category..."
              className="w-full pl-12 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-gray-900 placeholder-gray-400 text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear search"
              >
                <svg
                  className="h-5 w-5"
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
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-600 text-center">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
      </div>

      {/* Product Grid: Custom T-Shirt card first, then products */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <CustomTeeCard />
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
        {filteredProducts.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 xl:col-span-3 flex items-center justify-center py-12 text-gray-600">
            {searchQuery ? "No other products match your search." : "No other products at the moment."}
          </div>
        )}
      </div>
    </>
  );
}

