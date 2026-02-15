"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product, getFeaturedImage, getSecondaryImageUrl, sanitizeBrandText } from "@/lib/products";

interface FeaturedProductsCarouselProps {
  products: Product[];
}

export default function FeaturedProductsCarousel({ products }: FeaturedProductsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [products.length]);

  // Show actual database prices
  const minPrice = (variants: typeof products[0]['variants']) => {
    return Math.min(...variants.map((v) => v.price));
  };

  const maxPrice = (variants: typeof products[0]['variants']) => {
    return Math.max(...variants.map((v) => v.price));
  };

  return (
    <div className="w-full">
      {/* Mobile Carousel - Auto-rotating with partial visibility */}
      <div className="md:hidden relative overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {products.map((product, index) => (
            <div 
              key={product.id} 
              className="flex-shrink-0 w-full px-4"
            >
              <Link href={`/products/${product.slug}`} className="group block">
                <div className="card overflow-hidden h-full hover:scale-105 transition-all duration-300">
                  {/* Product Image */}
                  <div className="relative h-72 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden rounded-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg z-[1]" />
                    <Image
                      src={product.image || getFeaturedImage(product.slug)}
                      alt={sanitizeBrandText(product.name)}
                      fill
                      className="object-cover group-hover:scale-110 transition-all duration-500 rounded-lg group-hover:opacity-0"
                      sizes="100vw"
                      priority={index === 0}
                      quality={90}
                    />
                    {getSecondaryImageUrl(product.slug) && (
                      <Image
                        src={getSecondaryImageUrl(product.slug)!}
                        alt={`${sanitizeBrandText(product.name)} - alternate view`}
                        fill
                        className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg absolute inset-0"
                        sizes="100vw"
                        loading="lazy"
                      />
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors">
                      {sanitizeBrandText(product.name)}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {sanitizeBrandText(product.description)}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          ${minPrice(product.variants) === maxPrice(product.variants) 
                            ? minPrice(product.variants).toFixed(2) 
                            : `${minPrice(product.variants).toFixed(2)} - ${maxPrice(product.variants).toFixed(2)}`}
                        </p>
                      </div>
                      <button className="bg-brand-500 hover:bg-brand-400 text-white px-6 py-2 rounded-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-brand-500/50">
                        View
                      </button>
                    </div>

                    {/* Variants indicator */}
                    {product.variants.length > 1 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-600">
                          {product.variants.length} sizes available
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Carousel Indicators */}
        <div className="flex justify-center mt-6 gap-2">
          {products.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-8 bg-brand-600' : 'w-2 bg-gray-300'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Desktop Grid - All 3 products visible */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-8">
        {products.map((product, index) => (
          <Link key={product.id} href={`/products/${product.slug}`} className="group">
            <div className="card overflow-hidden h-full hover:scale-105 transition-all duration-300">
              {/* Product Image - secondary on hover */}
              <div className="relative h-72 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden rounded-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg z-[1]" />
                <Image
                  src={product.image || getFeaturedImage(product.slug)}
                  alt={sanitizeBrandText(product.name)}
                  fill
                  className="object-cover group-hover:scale-110 transition-all duration-500 rounded-lg group-hover:opacity-0"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority={index < 3}
                  quality={90}
                />
                {getSecondaryImageUrl(product.slug) && (
                  <Image
                    src={getSecondaryImageUrl(product.slug)!}
                    alt={`${sanitizeBrandText(product.name)} - alternate view`}
                    fill
                    className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg absolute inset-0"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    loading="lazy"
                  />
                )}
              </div>

              {/* Product Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors">
                  {sanitizeBrandText(product.name)}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {sanitizeBrandText(product.description)}
                </p>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      ${minPrice(product.variants) === maxPrice(product.variants) 
                        ? minPrice(product.variants).toFixed(2) 
                        : `${minPrice(product.variants).toFixed(2)} - ${maxPrice(product.variants).toFixed(2)}`}
                    </p>
                  </div>
                  <button className="bg-brand-500 hover:bg-brand-400 text-white px-6 py-2 rounded-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-brand-500/50">
                    View
                  </button>
                </div>

                {/* Variants indicator */}
                {product.variants.length > 1 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      {product.variants.length} sizes available
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
