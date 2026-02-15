"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getFeaturedImage } from "@/lib/products";

interface Product {
  id: string;
  name: string;
  slug: string;
  image: string;
  category: string;
  minPrice: number;
  maxPrice: number;
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen) {
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      
      if (inputRef.current) {
        // Small delay to ensure render
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    } else {
      document.body.style.overflow = '';
      // Reset search when closed
      setSearchQuery("");
      setProducts([]);
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Search products when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error("Error searching products:", error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Handle Enter key to redirect
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      onClose();
    }
  };

  const priceDisplay = (product: Product) => {
    return product.minPrice === product.maxPrice
      ? `$${product.minPrice.toFixed(2)}`
      : `$${product.minPrice.toFixed(2)} - $${product.maxPrice.toFixed(2)}`;
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col font-sans">
      {/* White Search Area */}
      <div className="bg-white relative z-[10000] w-full shadow-xl">
        <div className="container-custom pt-6 pb-8">
          {/* Search Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4 px-4 md:px-8">
              <div className="flex-1 relative max-w-4xl mx-auto px-4 md:px-6">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="SEARCH PRODUCT HERE"
                  className="w-full text-2xl md:text-3xl font-medium text-gray-900 border-none outline-none focus:outline-none placeholder-gray-400 border-b-2 border-black pb-2 bg-transparent"
                />
              </div>
              <button
                onClick={onClose}
                className="ml-4 mr-4 md:mr-8 text-gray-700 hover:text-gray-900 transition-colors"
                aria-label="Close search"
              >
                <svg
                  className="w-8 h-8"
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
            </div>
            <p className="text-sm text-gray-500 md:block hidden px-4 md:px-14">
              Hit enter to search or ESC to close
            </p>
          </div>

          {/* Search Results */}
          {searchQuery.trim() && (
            <div className="px-4 md:px-8">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      onClick={onClose}
                      className="group"
                    >
                      <div className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                        <div className="relative h-48 bg-gray-100 overflow-hidden">
                          <div className="absolute top-2 left-2 z-10 bg-brand-500 text-white px-3 py-1 rounded-md font-bold text-xs shadow-md">
                            SALE!
                          </div>
                          
                          <Image
                            src={product.image || getFeaturedImage(product.slug)}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            sizes="(max-width: 640px) 100vw, 25vw"
                          />
                        </div>

                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-brand-600 transition-colors line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                          <p className="text-xl font-bold text-brand-600">
                            {priceDisplay(product)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No products found</p>
                  <p className="text-sm mt-2">Try a different search term</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dark Overlay - Fills remaining space below white area */}
      <div 
        className="flex-1 bg-black/60 backdrop-blur-sm z-[9999]" 
        onClick={onClose}
      />
    </div>,
    document.body
  );
}
