import Image from "next/image";
import Link from "next/link";
import { Product, getFeaturedImage, getSecondaryImageUrl, sanitizeBrandText } from "@/lib/products";

interface ProductCardProps {
  product: Product;
  showSaleBadge?: boolean;
}

export default function ProductCard({ product, showSaleBadge = false }: ProductCardProps) {
  // Show actual database prices
  const minPrice = Math.min(...product.variants.map((v) => v.price));
  const maxPrice = Math.max(...product.variants.map((v) => v.price));

  const priceDisplay = minPrice === maxPrice 
    ? `$${minPrice.toFixed(2)}`
    : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;

  return (
    <Link href={`/products/${product.slug}`} className="group">
      <div className="card overflow-hidden h-full hover:scale-105 transition-all duration-300">
        {/* Product Image - primary; secondary on hover */}
        <div className="relative h-72 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden rounded-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg z-[1]" />
          <Image
            src={product.image || getFeaturedImage(product.slug)}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-all duration-500 rounded-lg group-hover:opacity-0"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            loading="lazy"
          />
          {getSecondaryImageUrl(product.slug) && (
            <Image
              src={getSecondaryImageUrl(product.slug)!}
              alt={`${product.name} - alternate view`}
              fill
              className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg absolute inset-0"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
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
              <p className="text-xs text-gray-500 mb-1">Starting at</p>
              <p className="text-2xl font-bold text-brand-400">{priceDisplay}</p>
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
  );
}
