"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/store";
import toast from "react-hot-toast";
import StockNotificationButton from "@/components/StockNotificationButton";
import Accordion from "@/components/Accordion";
import Tabs from "@/components/Tabs";
import StructuredData from "@/components/StructuredData";
import { trackPageView, trackViewItem, trackAddToCart } from "@/lib/analytics";
import { usePathname } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon, ExclamationTriangleIcon, StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { getFeaturedImage } from "@/lib/products";

const ALLOWED_SIZES = ["S", "M", "L", "SMALL", "MEDIUM", "LARGE"];

function normalizeSizeForDisplay(size: string): string {
  const u = size.toUpperCase();
  if (u === "SMALL") return "S";
  if (u === "MEDIUM") return "M";
  if (u === "LARGE") return "L";
  return u;
}

interface ProductDetailClientProps {
  product: any;
  slug: string;
}

export default function ProductDetailClient({ product, slug }: ProductDetailClientProps) {
  const router = useRouter();
  const { addItem, items: cartItems } = useCart();
  
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [shippingLocation, setShippingLocation] = useState<string | null>(null);
  const [reviews, setReviews] = useState<{ id: string; authorName: string; rating: number; body: string; sizePurchased?: string | null; verifiedBuyer: boolean; helpfulCount: number; notHelpfulCount: number; createdAt: string }[]>([]);
  const [reviewTotalCount, setReviewTotalCount] = useState(0);
  const [reviewAverageRating, setReviewAverageRating] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const pathname = usePathname();

  // Only show S, M, L variants
  const sizeFilter = (v: { size: string }) => ALLOWED_SIZES.includes(v.size.toUpperCase());
  const displayVariants = (product?.variants ?? []).filter(sizeFilter);
  const productVariants = displayVariants.length > 0 ? displayVariants : (product?.variants ?? []);

  // "Ships by Today" if before 4pm Arizona and not Sunday; else next business day
  const getShipsByLabel = () => {
    const arizonaNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Phoenix" }));
    const day = arizonaNow.getDay();
    const hour = arizonaNow.getHours();
    const isBefore4pm = hour < 16;
    const isSunday = day === 0;
    if (isBefore4pm && !isSunday) return { text: "Today", isToday: true };
    const d = new Date(arizonaNow);
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1); // Skip to Monday if tomorrow is Sunday
    const formatted = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    return { text: formatted, isToday: false };
  };
  const shipsBy = getShipsByLabel();

  useEffect(() => {
    fetch("/api/geo")
      .then((res) => res.json())
      .then((data) => {
        if (data.region) setShippingLocation(data.region);
      })
      .catch(() => {});
  }, []);

  // Helper function to find first available variant (not sold out)
  const findFirstAvailableVariant = (variants: any[]) => {
    const availableVariant = variants.find(variant => variant.stockCount > 0);
    return availableVariant || variants[0];
  };

  // Initialize selected variant on mount (use productVariants = S/M/L only)
  useEffect(() => {
    if (product && productVariants.length > 0) {
      const firstAvailable = findFirstAvailableVariant(productVariants);
      setSelectedVariant(firstAvailable);
    }
  }, [product?.id, productVariants.length]);

  // Fetch reviews for this product
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/products/${slug}/reviews`)
      .then((res) => (res.ok ? res.json() : { reviews: [], totalCount: 0, averageRating: 0 }))
      .then((data) => {
        setReviews(data.reviews ?? []);
        setReviewTotalCount(data.totalCount ?? 0);
        setReviewAverageRating(data.averageRating ?? 0);
      })
      .catch(() => {});
  }, [slug]);

  // Track page view and product view
  useEffect(() => {
    if (product && selectedVariant && pathname) {
      trackPageView(window.location.href, `${product.name} - Summer Steeze`, {
        page_type: 'product',
        product_id: product.id,
        product_name: product.name,
      });

      trackViewItem({
        itemId: product.id,
        itemName: product.name,
        itemCategory: product.category,
        price: selectedVariant.price,
        currency: 'USD',
      });
    }
  }, [product, selectedVariant, pathname]);

  /** Render product description with short paragraphs and bullet lists for readability (SEO). */
  function renderProductDescription(text: string) {
    if (!text) return null;
    const blocks = text.split(/\n\n+/).filter(B => B.trim());
    return (
      <div className="space-y-4">
        {blocks.map((block, i) => {
          const trimmed = block.trim();
          const bulletLines = trimmed.split(/\n/).filter(line => /^[•\-]\s/.test(line) || line.startsWith("• ") || line.startsWith("- "));
          if (bulletLines.length > 0) {
            const items = bulletLines.map(l => l.replace(/^[•\-]\s*/, "").trim()).filter(Boolean);
            return (
              <ul key={i} className="list-disc list-inside space-y-1.5 text-gray-700">
                {items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          }
          return (
            <p key={i} className="text-gray-700 leading-relaxed">
              {trimmed}
            </p>
          );
        })}
      </div>
    );
  }

  const handleAddToCart = (isBackorder: boolean = false) => {
    if (!selectedVariant) return;

    const existingCartItem = cartItems.find(
      (item) => item.productId === product.id && item.variantId === selectedVariant.id && !item.isBackorder
    );
    const currentCartQuantity = existingCartItem?.quantity || 0;
    const totalRequestedQuantity = currentCartQuantity + quantity;

    if (!isBackorder && selectedVariant.stockCount > 0) {
      if (totalRequestedQuantity > selectedVariant.stockCount) {
        const available = selectedVariant.stockCount - currentCartQuantity;
        if (available <= 0) {
          toast.error(`This item is already in your cart. Only ${selectedVariant.stockCount} available in stock.`);
        } else {
          toast.error(`Only ${available} more available in stock. You already have ${currentCartQuantity} in cart.`);
        }
        return;
      }
    }

    // Database price is what customer actually pays
    const databasePrice = selectedVariant.price;
    
    // Apply bulk discount if eligible (20% additional off database price)
    const isBulkEligible = (slug === "glp-3-rt" || slug === "glp-2-trz") && quantity >= 10;
    const finalPrice = isBulkEligible ? databasePrice * 0.8 : databasePrice;

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      productName: product.name,
      variantSize: selectedVariant.size,
      price: finalPrice,
      image: product.image,
      quantity,
      isBackorder,
    });

    trackAddToCart({
      itemId: product.id,
      itemName: product.name,
      itemCategory: product.category,
      price: finalPrice,
      quantity: quantity,
      currency: 'USD',
    });

    const backorderText = isBackorder ? " (Backorder - ~2 week delivery)" : "";
    const bulkText = isBulkEligible ? " (44% off with bulk discount!)" : " (30% off sale!)";
    toast.success(`Added ${quantity}x ${product.name} (${selectedVariant.size})${backorderText}${bulkText} to cart!`);
  };

  const handleBuyNow = (isBackorder: boolean = false) => {
    handleAddToCart(isBackorder);
    router.push("/cart");
  };

  const images = [product.image, product.secondImage, product.thirdImage].filter((img): img is string => Boolean(img));
  const hasMultipleImages = images.length > 1;

  return (
    <>
      <div className="py-12">
        <div className="container-custom">
          {/* Breadcrumb */}
          <div className="mb-8 text-sm">
            <Link href="/" className="text-gray-500 hover:text-primary-600">
              Home
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href="/products" className="text-gray-500 hover:text-primary-600">
              Products
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{product.name}</span>
          </div>

          {/* Product Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-12">
            {/* Image Carousel */}
            <div className="relative w-full">
              {images.length > 0 && (
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                  {/* Main Product Image - Priority Load */}
                  {images.map((imageSrc, index) => {
                    const isFirstImage = index === 0;
                    const altText = index === 0 
                      ? product.name 
                      : index === 1 
                        ? `${product.name} - Product Card` 
                        : `${product.name} - Product Image`;
                    
                    return (
                      <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-500 ${
                          index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                        } rounded-lg overflow-hidden`}
                      >
                        {isFirstImage ? (
                          <Image
                            src={imageSrc}
                            alt={altText}
                            fill
                            className="object-cover rounded-lg"
                            priority={true}
                            sizes="(max-width: 768px) 100vw, 50vw"
                            quality={90}
                          />
                        ) : index === 2 ? (
                          <Image
                            src={imageSrc}
                            alt={altText}
                            fill
                            className="object-cover rounded-lg"
                            priority={false}
                            sizes="(max-width: 768px) 100vw, 50vw"
                            quality={85}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-8">
                            <Image
                              src={imageSrc}
                              alt={altText}
                              fill
                              className="object-contain rounded-lg"
                              priority={false}
                              sizes="(max-width: 768px) 100vw, 50vw"
                              quality={85}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Navigation Arrows */}
                  {hasMultipleImages && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all hover:scale-110 z-10"
                        aria-label="Previous image"
                      >
                        <ChevronLeftIcon className="w-6 h-6 text-gray-800" />
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all hover:scale-110 z-10"
                        aria-label="Next image"
                      >
                        <ChevronRightIcon className="w-6 h-6 text-gray-800" />
                      </button>
                    </>
                  )}

                  {/* Image Indicators */}
                  {hasMultipleImages && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`h-2 rounded-full transition-all ${
                            index === currentImageIndex
                              ? 'w-8 bg-white'
                              : 'w-2 bg-white/50'
                          }`}
                          aria-label={`Go to image ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <div className="hidden lg:block text-sm text-primary-600 font-semibold mb-2 uppercase">
                {product.category}
              </div>
              {/* Title and price on one row (reference style) */}
              <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 lg:mt-0">
                  {product.name}
                </h1>
                {selectedVariant && (
                  <span className="text-2xl md:text-3xl font-bold text-gray-900">
                    ${selectedVariant.price.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Reviews: blank stars + count, click scrolls to #reviews */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-0.5 text-gray-300">
                  {[1, 2, 3, 4, 5].map((i) =>
                    reviewTotalCount > 0 && i <= Math.round(reviewAverageRating) ? (
                      <StarIconSolid key={i} className="w-5 h-5 text-gray-900" aria-hidden />
                    ) : (
                      <StarIcon key={i} className="w-5 h-5 text-gray-300" aria-hidden />
                    )
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-sm text-gray-600 hover:text-gray-900 underline underline-offset-2"
                >
                  {reviewTotalCount} {reviewTotalCount === 1 ? "Review" : "Reviews"}
                </button>
              </div>

              {/* Size: S, M, L only */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Select Size
                </label>
                <div className="flex flex-wrap gap-3">
                  {productVariants.map((variant: any) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`min-w-[3rem] px-6 py-3 border-2 rounded-lg font-semibold transition ${
                        selectedVariant?.id === variant.id
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-300 hover:border-gray-400 text-gray-900"
                      }`}
                    >
                      {normalizeSizeForDisplay(variant.size)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Quantity:
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold"
                  >
                    -
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => {
                      if (selectedVariant && selectedVariant.stockCount > 0) {
                        const existingCartItem = cartItems.find(
                          (item) => item.productId === product.id && item.variantId === selectedVariant.id && !item.isBackorder
                        );
                        const currentCartQuantity = existingCartItem?.quantity || 0;
                        const maxAllowed = selectedVariant.stockCount - currentCartQuantity;
                        if (quantity < maxAllowed) {
                          setQuantity(quantity + 1);
                        } else {
                          toast.error(`Only ${maxAllowed} available in stock${currentCartQuantity > 0 ? ` (you have ${currentCartQuantity} in cart)` : ''}.`);
                        }
                      } else {
                        setQuantity(quantity + 1);
                      }
                    }}
                    className="w-12 h-12 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Actions */}
              {selectedVariant && selectedVariant.stockCount > 0 ? (
                <div className="flex flex-row gap-4 mb-8">
                  <button
                    onClick={() => handleAddToCart(false)}
                    className="btn-primary flex-1"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => handleBuyNow(false)}
                    className="btn-secondary flex-1"
                  >
                    Buy Now
                  </button>
                </div>
              ) : selectedVariant && selectedVariant.stockCount === 0 ? (
                <div className="mb-8">
                  <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-center gap-2">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-700" />
                      <p className="text-red-700 font-bold text-lg">
                        OUT OF STOCK
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row gap-4 mb-4">
                    <button
                      onClick={() => handleAddToCart(true)}
                      className="btn-primary flex-1"
                    >
                      Add to Cart (Backorder)
                    </button>
                    <button
                      onClick={() => handleBuyNow(true)}
                      className="btn-secondary flex-1"
                    >
                      Buy Now (Backorder)
                    </button>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Backorder Information:</strong> This item is currently out of stock but can be ordered as a backorder. Expected delivery time is approximately 2 weeks from order confirmation.
                    </p>
                  </div>
                  <p className="text-gray-600 text-center italic text-sm">
                    Or use the notification button below to be alerted when it's available again.
                  </p>
                </div>
              ) : null}

              {/* Stock Info */}
              {selectedVariant && (
                <>
                  <div className="text-sm text-gray-600 mb-4 flex items-center gap-2 flex-wrap">
                    {selectedVariant.stockCount > 0 ? (
                      selectedVariant.stockCount <= 5 ? (
                        <span className="flex items-center gap-1.5 text-orange-600 font-semibold">
                          <ExclamationTriangleIcon className="h-4 w-4" />
                          Only {selectedVariant.stockCount} left in stock
                        </span>
                      ) : null
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-600 font-semibold">
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        Out of Stock
                      </span>
                    )}
                  </div>
                  
                  {selectedVariant.stockCount === 0 && (
                    <StockNotificationButton
                      variantId={selectedVariant.id}
                      variantName={`${product.name} (${selectedVariant.size})`}
                      isOutOfStock={true}
                    />
                  )}
                </>
              )}

              {/* Shipping: Ships by Today / date + Ships to [location] */}
              <div className="flex flex-wrap items-center justify-between gap-2 py-3 px-4 mt-4 rounded-lg bg-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  Ships by{" "}
                  {shipsBy.isToday ? (
                    <strong className="font-bold text-gray-900">Today</strong>
                  ) : (
                    <strong className="font-bold text-gray-900">{shipsBy.text}</strong>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="text-brand-400 font-semibold">FREE</span> shipping to {shippingLocation ?? "your state"}
                </div>
              </div>
            </div>
          </div>

          {/* Product Overview */}
          <div className="mt-16">
            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Overview</h2>
              {renderProductDescription(product.longDescription || product.description)}

              <p className="mt-4 text-gray-600">
                <Link href="/products" className="text-primary-600 hover:text-primary-700 font-medium">
                  Browse all products →
                </Link>
              </p>
            </div>
          </div>

          {/* Reviews section: scroll target from "X Reviews" link */}
          <section id="reviews" className="mt-16 pt-12 border-t border-gray-200 scroll-mt-24">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-gray-900">Community Reviews</h2>
              <button
                type="button"
                onClick={() => setShowReviewForm((v) => !v)}
                className="text-sm font-medium text-gray-900 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md"
              >
                {showReviewForm ? "Cancel" : "Write a review"}
              </button>
            </div>

            {showReviewForm && (
              <ProductReviewForm
                productName={product.name}
                slug={slug}
                sizeOptions={productVariants.map((v: any) => normalizeSizeForDisplay(v.size))}
                onSuccess={() => {
                  setShowReviewForm(false);
                  fetch(`/api/products/${slug}/reviews`)
                    .then((res) => (res.ok ? res.json() : { reviews: [], totalCount: 0, averageRating: 0 }))
                    .then((data: { reviews?: Array<{ id: string; authorName: string; rating: number; body: string; sizePurchased?: string | null; verifiedBuyer: boolean; helpfulCount: number; notHelpfulCount: number; createdAt: string }>; totalCount?: number; averageRating?: number }) => {
                      setReviews(data.reviews ?? []);
                      setReviewTotalCount(data.totalCount ?? 0);
                      setReviewAverageRating(data.averageRating ?? 0);
                    })
                    .catch(() => {});
                }}
              />
            )}

            {reviews.length === 0 && !showReviewForm && (
              <p className="text-gray-600 mb-2">No reviews yet. Be the first to leave a review.</p>
            )}

            {reviews.length > 0 && (
              <ul className="space-y-6 mt-6">
                {reviews.map((r) => (
                  <li key={r.id} className="border-b border-gray-100 pb-6 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{r.authorName}</span>
                      {r.verifiedBuyer && (
                        <span className="text-xs text-gray-500">Verified Buyer</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-500 mb-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <StarIconSolid
                          key={i}
                          className={`w-4 h-4 ${i <= r.rating ? "text-gray-900" : "text-gray-200"}`}
                          aria-hidden
                        />
                      ))}
                    </div>
                    {r.sizePurchased && (
                      <p className="text-sm text-gray-500 mb-1">Size: {r.sizePurchased}</p>
                    )}
                    <p className="text-gray-700 whitespace-pre-wrap">{r.body}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(r.createdAt).toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "2-digit",
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* You May Also Like - Full width, centered below product info */}
          <RelatedProductsList currentProductId={product.id} currentCategory={product.category} />

        </div>
      </div>

      {/* Structured Data: BreadcrumbList for crawlability and sitelinks */}
      {product && (
        <StructuredData
          data={{
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://www.summersteez.com/" },
              { "@type": "ListItem", position: 2, name: "Products", item: "https://www.summersteez.com/products" },
              { "@type": "ListItem", position: 3, name: product.name, item: `https://www.summersteez.com/products/${product.slug}` },
            ],
          }}
        />
      )}

      {/* Structured Data: Product (no fake ratings) */}
      {product && selectedVariant && (
        <>
          <StructuredData
            data={{
              "@context": "https://schema.org",
              "@type": "Product",
              name: product.name,
              description: product.description,
              image: `https://www.summersteez.com${product.image}`,
              brand: {
                "@type": "Brand",
                name: "Summer Steeze",
              },
              sku: selectedVariant.sku,
              mpn: selectedVariant.sku,
              offers: {
                "@type": "Offer",
                url: `https://www.summersteez.com/products/${product.slug}`,
                priceCurrency: "USD",
                price: selectedVariant.price.toFixed(2),
                priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Valid for 1 year
                availability: selectedVariant.stockCount > 0 
                  ? "https://schema.org/InStock" 
                  : "https://schema.org/OutOfStock",
                itemCondition: "https://schema.org/NewCondition",
                seller: {
                  "@type": "Organization",
                  name: "Summer Steeze",
                },
              },
            }}
          />
          <StructuredData
            data={{
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: `How should I care for ${product.name}?`,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: `Follow the care instructions on the product label. Generally, wash in cold water and tumble dry low or hang dry to maintain quality.`,
                  },
                },
              ],
            }}
          />
        </>
      )}
    </>
  );
}

function ProductReviewForm({
  productName,
  slug,
  sizeOptions,
  onSuccess,
}: {
  productName: string;
  slug: string;
  sizeOptions: string[];
  onSuccess: () => void;
}) {
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [sizePurchased, setSizePurchased] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!authorName.trim()) {
      setError("Name is required.");
      return;
    }
    if (!body.trim()) {
      setError("Review text is required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: authorName.trim(),
          authorEmail: authorEmail.trim() || undefined,
          rating,
          body: body.trim(),
          sizePurchased: sizePurchased || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to submit review.");
        setSubmitting(false);
        return;
      }
      toast.success("Thanks! Your review has been posted.");
      setAuthorName("");
      setAuthorEmail("");
      setRating(5);
      setBody("");
      setSizePurchased("");
      onSuccess();
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50 space-y-4 max-w-xl">
      <h3 className="font-semibold text-gray-900">Write a review</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
        <input
          type="email"
          value={authorEmail}
          onChange={(e) => setAuthorEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              className="p-1"
              aria-label={`${i} stars`}
            >
              <StarIconSolid className={`w-8 h-8 ${i <= rating ? "text-amber-500" : "text-gray-300"}`} />
            </button>
          ))}
        </div>
      </div>
      {sizeOptions.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Size purchased (optional)</label>
          <select
            value={sizePurchased}
            onChange={(e) => setSizePurchased(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Select size</option>
            {sizeOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your review *</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
          required
        />
      </div>
      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}

function RelatedProductsList({ currentProductId, currentCategory }: { currentProductId: string; currentCategory: string }) {
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          // First try to get products from same category
          let related = data.products.filter((p: any) => p.id !== currentProductId && p.category === currentCategory);
          
          // If we don't have at least 4 products from same category, add products from other categories
          if (related.length < 4) {
            const otherProducts = data.products.filter(
              (p: any) => p.id !== currentProductId && p.category !== currentCategory
            );
            // Add enough products to reach at least 4 total
            const needed = 4 - related.length;
            related = [...related, ...otherProducts.slice(0, needed)];
          }
          
          // Show up to 8 products for better variety
          setRelatedProducts(related.slice(0, Math.min(related.length, 8)));
        }
      } catch (error) {
        console.error("Error fetching related products:", error);
      }
    };
    
    fetchRelated();
  }, [currentProductId, currentCategory]);

  if (relatedProducts.length === 0) return null;

  // Calculate fake higher price for display (database price / 0.7)
  // This makes it look like 30% off when customer pays database price
  return (
    <div className="mt-8 w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">You May Also Like</h2>
      
      {/* Mobile Carousel */}
      <div className="md:hidden relative overflow-hidden w-full">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * (100 / 3)}%)` }}
        >
          {relatedProducts.map((relatedProduct) => {
            const minPrice = Math.min(...relatedProduct.variants.map((v: any) => v.price));
            return (
              <div 
                key={relatedProduct.id} 
                className="flex-shrink-0"
                style={{ width: `${100 / 3}%`, paddingLeft: '0.5rem', paddingRight: '0.5rem' }}
              >
                <Link
                  href={`/products/${relatedProduct.slug}`}
                  className="card overflow-hidden group block h-full"
                >
                  <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={relatedProduct.image || getFeaturedImage(relatedProduct.slug)}
                      alt={relatedProduct.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform rounded-lg"
                      priority={false}
                      sizes="(max-width: 768px) 33vw, 25vw"
                      quality={85}
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition text-sm line-clamp-2">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      ${minPrice.toFixed(2)}
                    </p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Carousel Navigation */}
        {relatedProducts.length > 3 && (
          <>
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
              aria-label="Previous products"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-800" />
            </button>
            <button
              onClick={() => setCurrentIndex(Math.min(relatedProducts.length - 3, currentIndex + 1))}
              disabled={currentIndex >= relatedProducts.length - 3}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
              aria-label="Next products"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-800" />
            </button>
          </>
        )}

        {/* Carousel Indicators */}
        {relatedProducts.length > 3 && (
          <div className="flex justify-center mt-4 gap-2">
            {Array.from({ length: Math.max(1, relatedProducts.length - 2) }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'w-8 bg-brand-600'
                    : 'w-2 bg-gray-300'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop Grid - Full width, centered, show at least 4 products */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl mx-auto">
        {relatedProducts.map((relatedProduct) => {
          const minPrice = Math.min(...relatedProduct.variants.map((v: any) => v.price));
          return (
            <Link
              key={relatedProduct.id}
              href={`/products/${relatedProduct.slug}`}
              className="card overflow-hidden group"
            >
              <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={relatedProduct.image || getFeaturedImage(relatedProduct.slug)}
                  alt={relatedProduct.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform rounded-lg"
                  priority={false}
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  quality={85}
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition">
                  {relatedProduct.name}
                </h3>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  ${minPrice.toFixed(2)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
