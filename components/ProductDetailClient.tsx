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
import COAImageViewer from "@/components/COAImageViewer";
import { trackPageView, trackViewItem, trackAddToCart } from "@/lib/analytics";
import { usePathname } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { getFeaturedImage } from "@/lib/products";

function getProductSocialProof(slug: string) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash = hash & hash;
  }
  const seed = Math.abs(hash);
  const orders = 3000 + (seed % 2001);
  const rating = (4.6 + ((seed % 4) * 0.1)).toFixed(1);
  return { orders, rating };
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
  const [activeTab, setActiveTab] = useState<"general" | "chemical" | "coa">("general");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [shippingLocation, setShippingLocation] = useState<string | null>(null);
  const pathname = usePathname();

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

  // Initialize selected variant on mount
  useEffect(() => {
    if (product && product.variants) {
      const firstAvailable = findFirstAvailableVariant(product.variants);
      setSelectedVariant(firstAvailable);
    }
  }, [product]);

  // Track page view and product view
  useEffect(() => {
    if (product && selectedVariant && pathname) {
      trackPageView(window.location.href, `${product.name} - Purgo Labs`, {
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

  const tabButtonClasses = (tab: "general" | "chemical" | "coa") =>
    `pb-4 border-b-2 font-semibold transition-colors ${
      activeTab === tab
        ? "border-primary-500 text-primary-600"
        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
    }`;

  const chemicalProperties = (product as any).chemicalProperties;
  const coaUrl = (product as any).coaUrl;

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
              Buy Peptides
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
                  {/* SALE Badge */}
                  <div className="absolute top-2 left-2 z-20 bg-cyan-500 text-white px-3 py-1 rounded-md font-bold text-xs shadow-md">
                    SALE!
                  </div>
                  
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
              {/* Social proof: stars + rating + orders */}
              {(() => {
                const { orders, rating } = getProductSocialProof(slug);
                return (
                  <div className="mt-3 flex items-center gap-1.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <StarIcon key={i} className="w-5 h-5" aria-hidden />
                    ))}
                    <span className="text-gray-600 text-sm ml-0.5">
                      Rated {rating} | {orders.toLocaleString()}+ Orders
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Product Info */}
            <div>
              <div className="hidden lg:block text-sm text-primary-600 font-semibold mb-2 uppercase">
                {product.category}
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 lg:mb-4 mt-2 lg:mt-0">
                {product.name}
              </h1>

              {/* Price */}
              <div className="mb-6">
                {selectedVariant && (
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Calculate pricing: database price is what customer pays, fake higher price is crossed out */}
                    {(() => {
                      const databasePrice = selectedVariant.price; // What customer actually pays
                      const fakeHigherPrice = databasePrice / 0.7; // Fake price that when 30% off = database price
                      const isBulkDiscount = (slug === "glp-3-rt" || slug === "glp-2-trz") && quantity >= 10;
                      
                      if (isBulkDiscount) {
                        // Bulk discount: 20% additional off database price
                        const bulkPrice = databasePrice * 0.8; // Customer pays 80% of database price
                        const fakeBulkPrice = bulkPrice / 0.56; // Fake price for 44% off display
                        return (
                          <>
                            <span className="text-3xl font-bold text-green-600">
                              ${bulkPrice.toFixed(2)}
                            </span>
                            <span className="text-xl text-gray-400 line-through">
                              ${fakeBulkPrice.toFixed(2)}
                            </span>
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-semibold">
                              44% OFF
                            </span>
                          </>
                        );
                      } else {
                        // Regular 30% off sale: customer pays database price, show fake higher price crossed out
                        return (
                          <>
                            <span className="text-3xl font-bold text-gray-900">
                              ${databasePrice.toFixed(2)}
                            </span>
                            <span className="text-xl text-gray-400 line-through">
                              ${fakeHigherPrice.toFixed(2)}
                            </span>
                            <span className="bg-cyan-100 text-cyan-700 px-2 py-1 rounded text-sm font-semibold">
                              30% OFF
                            </span>
                          </>
                        );
                      }
                    })()}
                  </div>
                )}
                {selectedVariant && (
                  <div className="mt-2 text-sm text-gray-600">
                    {(() => {
                      const databasePrice = selectedVariant.price;
                      const fakeHigherPrice = databasePrice / 0.7;
                      const isBulkDiscount = (slug === "glp-3-rt" || slug === "glp-2-trz") && quantity >= 10;
                      
                      if (isBulkDiscount) {
                        const bulkPrice = databasePrice * 0.8;
                        const fakeBulkPrice = bulkPrice / 0.56;
                        return (
                          <>
                            Total for {quantity} vials: <span className="font-bold text-green-600">${(bulkPrice * quantity).toFixed(2)}</span>
                            <span className="text-gray-400 line-through ml-2">${(fakeBulkPrice * quantity).toFixed(2)}</span>
                          </>
                        );
                      } else {
                        return (
                          <>
                            Total for {quantity} vials: <span className="font-bold text-gray-900">${(databasePrice * quantity).toFixed(2)}</span>
                            <span className="text-gray-400 line-through ml-2">${(fakeHigherPrice * quantity).toFixed(2)}</span>
                          </>
                        );
                      }
                    })()}
                  </div>
                )}
              </div>

              {/* Reviews Section - Trustpilot & Google buttons only */}
              <div className="flex items-center justify-between mb-6">
                <span className="font-medium text-gray-900 text-sm">Reviews</span>
                <div className="flex items-center gap-3">
                  <a 
                    href="https://www.trustpilot.com/review/purgolabs.com?_gl=1*1k1z474*_gcl_au*Mzc5MTg1MDI3LjE3NjgzNjcyMDQ.*_ga*NzU2NDk1NTYuMTc2ODM2NzIxNg..*_ga_11HBWMC274*czE3NjgzNjcyMTUkbzEkZzEkdDE3NjgzNjcyNzAkajUkbDAkaDA" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Image 
                      src="/trustpilotfinal.png" 
                      alt="Trustpilot" 
                      width={60} 
                      height={16} 
                      className="h-4 w-auto object-contain"
                      priority={false}
                      quality={90}
                    />
                  </a>
                  <a 
                    href="https://share.google/kCQYHyMGyamt5M1yj" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Image 
                      src="/google_g_icon_download.png" 
                      alt="Google" 
                      width={16} 
                      height={16} 
                      className="w-4 h-4 object-contain"
                      priority={false}
                      quality={90}
                    />
                    Google Reviews
                  </a>
                </div>
              </div>

              {/* Variant Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Select Size:
                </label>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((variant: any) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-6 py-3 border-2 rounded-lg font-semibold transition ${
                        selectedVariant?.id === variant.id
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {variant.size}
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
                  <span className="text-cyan-400 font-semibold">FREE</span> shipping to {shippingLocation ?? "your state"}
                </div>
              </div>

              {/* Payment method icons - Visa, Mastercard, Apple Pay, Google Pay, Venmo, Zelle, Crypto */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <Image src="/visa.png" alt="Visa" width={40} height={26} className="h-6 w-auto object-contain" />
                <Image src="/mastercard.png" alt="Mastercard" width={40} height={26} className="h-6 w-auto object-contain" />
                <Image src="/Apple_Pay-Logo.png" alt="Apple Pay" width={40} height={26} className="h-6 w-auto object-contain" />
                <Image src="/Google_Pay_Logo.svg.png" alt="Google Pay" width={40} height={26} className="h-6 w-auto object-contain" />
                <Image src="/venmologo.png" alt="Venmo" width={40} height={26} className="h-6 w-auto object-contain" />
                <Image src="/zellelogo.png" alt="Zelle" width={40} height={26} className="h-6 w-auto object-contain" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Crypto</span>
              </div>
            </div>
          </div>

          {/* You May Also Like - Full width, centered below product info */}
          <RelatedProductsList currentProductId={product.id} currentCategory={product.category} />

          {/* Details Tabs */}
          <div className="mt-16">
            <div className="border-b border-gray-200">
              <div className="flex flex-wrap gap-8">
                <button
                  type="button"
                  onClick={() => setActiveTab("general")}
                  className={tabButtonClasses("general")}
                >
                  General
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("chemical")}
                  className={tabButtonClasses("chemical")}
                >
                  Chemical Properties
                </button>
                {coaUrl && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("coa")}
                    className={tabButtonClasses("coa")}
                  >
                    COA
                  </button>
                )}
              </div>
            </div>
            <div className="py-8">
              {activeTab === "general" && (
                <div className="prose max-w-none">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Overview</h2>
                  {renderProductDescription(product.longDescription || product.description)}

                  <div className="mb-6 p-4">
                    <p className="text-black font-bold text-base mb-2">
                      Research Use Only Notice
                    </p>
                    <p className="text-black text-sm">
                      This product is supplied solely for laboratory research. It is not intended for human or
                      veterinary use, ingestion, or diagnostic applications. No dosing or administration support is
                      provided, and Purgo Labs does not promote or endorse any off-label utilization.
                    </p>
                  </div>

                  {product.researchAreas && product.researchAreas.length > 0 && (
                    <>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Research Applications</h3>
                      <div className="flex flex-wrap gap-2">
                        {product.researchAreas.map((area: string, index: number) => (
                          <span
                            key={index}
                            className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                  <p className="mt-4 text-gray-600">
                    <Link href="/products" className="text-primary-600 hover:text-primary-700 font-medium">
                      Browse all research peptides →
                    </Link>
                  </p>
                </div>
              )}

              {activeTab === "chemical" && (
                <div className="space-y-6">
                  {chemicalProperties ? (
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <tbody className="bg-white divide-y divide-gray-200">
                          {[
                            { label: "CAS Number", value: chemicalProperties.casNumber },
                            { label: "PubChem CID", value: chemicalProperties.pubChemCid },
                            { label: "Molecular Weight", value: chemicalProperties.molecularWeight },
                            { label: "Molecular Formula", value: chemicalProperties.molecularFormula },
                            {
                              label: "Synonyms",
                              value: chemicalProperties.synonyms?.length
                                ? chemicalProperties.synonyms.join(", ")
                                : undefined,
                            },
                          ]
                            .filter((row) => row.value)
                            .map((row) => (
                              <tr key={row.label}>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 w-48">
                                  {row.label}
                                </th>
                                <td className="px-6 py-4 text-sm text-gray-900">{row.value}</td>
                              </tr>
                            ))}
                          {chemicalProperties.storage && chemicalProperties.storage.length > 0 && (
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 align-top">
                                Storage (Lyophilized)
                              </th>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                <ul className="list-disc list-inside space-y-1">
                                  {chemicalProperties.storage.map((entry: string, index: number) => (
                                    <li key={index}>{entry}</li>
                                  ))}
                                </ul>
                              </td>
                            </tr>
                          )}
                          {chemicalProperties.notes && (
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                                Notes
                              </th>
                              <td className="px-6 py-4 text-sm text-gray-900">{chemicalProperties.notes}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-600">
                      Detailed chemical property data for this product is currently being compiled. Please check back
                      soon or contact support@purgolabs.com for assistance.
                    </p>
                  )}
                </div>
              )}

              {activeTab === "coa" && (
                <div className="space-y-4">
                  {coaUrl ? (
                    <>
                      <p className="text-gray-700">
                        View the latest Certificate of Analysis for laboratory documentation.
                      </p>
                      <COAImageViewer coaUrl={coaUrl} productName={product?.name} />
                      <p className="text-xs text-gray-500">
                        Click on the certificate to view it in full size. This document can be used as part of your internal quality and compliance records.
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-600">
                      A certificate of analysis is not currently published for this item. Please contact support if you
                      require specific batch documentation.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Structured Data: BreadcrumbList for crawlability and sitelinks */}
      {product && (
        <StructuredData
          data={{
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://www.purgolabs.com/" },
              { "@type": "ListItem", position: 2, name: "Buy Peptides", item: "https://www.purgolabs.com/products" },
              { "@type": "ListItem", position: 3, name: product.name, item: `https://www.purgolabs.com/products/${product.slug}` },
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
              image: `https://www.purgolabs.com${product.image}`,
              brand: {
                "@type": "Brand",
                name: "Purgo Labs",
              },
              sku: selectedVariant.sku,
              mpn: selectedVariant.sku,
              offers: {
                "@type": "Offer",
                url: `https://www.purgolabs.com/products/${product.slug}`,
                priceCurrency: "USD",
                price: selectedVariant.price.toFixed(2),
                priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Valid for 1 year
                availability: selectedVariant.stockCount > 0 
                  ? "https://schema.org/InStock" 
                  : "https://schema.org/OutOfStock",
                itemCondition: "https://schema.org/NewCondition",
                seller: {
                  "@type": "Organization",
                  name: "Purgo Labs",
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
                  name: `What is ${product.name} used for in research?`,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: `${product.name} is used in laboratory research to investigate ${product.researchAreas?.join(", ") || "various biological processes"}. Researchers employ this compound in controlled experimental systems to study cellular mechanisms and biological pathways.`,
                  },
                },
                {
                  "@type": "Question",
                  name: `How should I store ${product.name}?`,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: `Store unreconstituted lyophilized ${product.name} at 2-8°C for short-term storage or -20°C for long-term preservation. Once reconstituted, aliquot and store at -20°C to maintain stability.`,
                  },
                },
                {
                  "@type": "Question",
                  name: `What is the purity of ${product.name}?`,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: `${product.name} is verified to have a purity of 99% or greater as determined by HPLC analysis. The exact purity percentage for each batch is documented in the Certificate of Analysis.`,
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
  const getFakeHigherPrice = (databasePrice: number) => databasePrice / 0.7;

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
            const databasePrice = Math.min(...relatedProduct.variants.map((v: any) => v.price));
            const fakeHigherPrice = getFakeHigherPrice(databasePrice);
            
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
                    {/* SALE Badge */}
                    <div className="absolute top-2 left-2 z-10 bg-cyan-500 text-white px-2 py-1 rounded-md font-bold text-xs shadow-md">
                      SALE!
                    </div>
                    <Image
                      src={getFeaturedImage(relatedProduct.slug) || relatedProduct.image}
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
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-gray-900">
                        ${databasePrice.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-400 line-through">
                        ${fakeHigherPrice.toFixed(2)}
                      </span>
                    </div>
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
                    ? 'w-8 bg-cyan-600'
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
          const databasePrice = Math.min(...relatedProduct.variants.map((v: any) => v.price));
          const fakeHigherPrice = getFakeHigherPrice(databasePrice);
          
          return (
            <Link
              key={relatedProduct.id}
              href={`/products/${relatedProduct.slug}`}
              className="card overflow-hidden group"
            >
              <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden">
                {/* SALE Badge */}
                <div className="absolute top-2 left-2 z-10 bg-cyan-500 text-white px-3 py-1 rounded-md font-bold text-xs shadow-md">
                  SALE!
                </div>
                <Image
                  src={getFeaturedImage(relatedProduct.slug) || relatedProduct.image}
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
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-gray-900">
                    ${databasePrice.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-400 line-through">
                    ${fakeHigherPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
