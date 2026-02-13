"use client";

import { useCart } from "@/lib/store";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import FreeShippingBar from "@/components/FreeShippingBar";
import RewardsPoints from "@/components/RewardsPoints";
import { trackViewCart, trackRemoveFromCart } from "@/lib/analytics";
import toast from "react-hot-toast";

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, updateItemPrice, getTotalPrice } = useCart();
  const [variantStocks, setVariantStocks] = useState<Record<string, number>>({});
  const [pricesSynced, setPricesSynced] = useState(false);
  const subtotal = getTotalPrice();
  const shippingInsurance = 3.50; // Required shipping insurance
  // Shipping is calculated at checkout based on address
  const [pointsDiscount, setPointsDiscount] = useState(0);
  // Total excludes shipping since it's TBD at checkout
  const total = subtotal + shippingInsurance - pointsDiscount;

  // Track cart abandonment
  const trackCartAbandonment = async () => {
    if (items.length === 0) return;
    
    try {
      await fetch('/api/cart/abandonment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: items,
          userAgent: navigator.userAgent,
        }),
      });
    } catch (error) {
      console.error('Error tracking cart abandonment:', error);
    }
  };

  // Fetch stock and sync prices for all variants in cart
  useEffect(() => {
    const fetchStocksAndPrices = async () => {
      const stockMap: Record<string, number> = {};
      
      // Get unique variant IDs (only for non-backordered items for stock)
      const variantIds = [...new Set(items.map(item => item.variantId))];
      
      if (variantIds.length === 0) {
        setVariantStocks({});
        setPricesSynced(true);
        return;
      }
      
      // Fetch all products to get variant stock and prices
      try {
        const response = await fetch(`/api/products`);
        if (response.ok) {
          const data = await response.json();
          const allVariants = data.products.flatMap((p: any) => (p.variants || []).map((v: any) => ({
            id: v.id,
            stockCount: v.stockCount || 0,
            price: v.price,
            productId: p.id,
            productSlug: p.slug
          })));
          
          variantIds.forEach(variantId => {
            const variant = allVariants.find((v: any) => v.id === variantId);
            if (variant) {
              // Update stock map
              stockMap[variantId] = variant.stockCount;
              
              // Find the cart item
              const cartItem = items.find(item => item.variantId === variantId);
              if (cartItem) {
                // Check if bulk discount applies (Reta or Trizep with 10+ quantity)
                const isBulkEligible = (variant.productSlug === "glp-3-rt" || variant.productSlug === "glp-2-trz") && cartItem.quantity >= 10;
                const finalPrice = isBulkEligible ? variant.price * 0.8 : variant.price;
                
                // Only update price if it's different (to avoid infinite loops)
                if (cartItem.price !== finalPrice) {
                  updateItemPrice(variantId, finalPrice);
                }
              }
            }
          });
        }
      } catch (error) {
        console.error('Error fetching stock and prices:', error);
      }
      
      setVariantStocks(stockMap);
      setPricesSynced(true);
    };
    
    if (items.length > 0) {
      fetchStocksAndPrices();
    } else {
      setVariantStocks({});
      setPricesSynced(true);
    }
  }, [items.length, updateItemPrice]);

  // Recalculate bulk discount prices when quantities change
  useEffect(() => {
    if (items.length === 0 || !pricesSynced) return;

    const recalculatePrices = async () => {
      try {
        const response = await fetch(`/api/products`);
        if (response.ok) {
          const data = await response.json();
          const allVariants = data.products.flatMap((p: any) => (p.variants || []).map((v: any) => ({
            id: v.id,
            price: v.price,
            productSlug: p.slug
          })));

          items.forEach(item => {
            const variant = allVariants.find((v: any) => v.id === item.variantId);
            if (variant) {
              // Check if bulk discount applies (Reta or Trizep with 10+ quantity)
              const isBulkEligible = (variant.productSlug === "glp-3-rt" || variant.productSlug === "glp-2-trz") && item.quantity >= 10;
              const finalPrice = isBulkEligible ? variant.price * 0.8 : variant.price;
              
              // Only update if price is different
              if (Math.abs(item.price - finalPrice) > 0.01) {
                updateItemPrice(item.variantId, finalPrice);
              }
            }
          });
        }
      } catch (error) {
        console.error('Error recalculating bulk discount prices:', error);
      }
    };

    recalculatePrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map(i => `${i.variantId}-${i.quantity}`).join(','), pricesSynced]);

  // Track cart view and abandonment
  useEffect(() => {
    if (items.length > 0) {
      trackViewCart({
        items: items.map(item => ({
          itemId: item.productId,
          itemName: item.productName,
          itemCategory: 'Peptides',
          price: item.price,
          quantity: item.quantity,
        })),
        value: subtotal,
        currency: 'USD',
      });
      
      // Track cart abandonment (user added items but hasn't checked out)
      trackCartAbandonment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, subtotal]);

  if (items.length === 0) {
    return (
      <div className="container-custom py-20">
        <div className="text-center">
          <div className="mb-6">
            <svg
              className="w-24 h-24 text-gray-300 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8">Add some research peptides to get started</p>
          <Link href="/products" className="btn-primary">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="container-custom">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900">Shopping Cart</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {/* Free Shipping Progress Bar - Hidden during site-wide free shipping promo */}
            {/* <FreeShippingBar subtotal={subtotal} className="mb-4" /> */}
            
            {/* Rewards Points */}
            <RewardsPoints 
              subtotal={subtotal} 
              onPointsRedeemed={(points, value) => setPointsDiscount(value)}
              className="mb-4" 
            />
            
            <div className="space-y-4">
              {items.map((item) => {
                console.log('Cart item:', item);
                return (
                <div key={`${item.productId}-${item.variantId}`} className="card p-4 md:p-6">
                  <div className="flex items-start space-x-4 md:space-x-6">
                    {/* Product Image */}
                    <div className="relative w-20 h-20 md:w-24 md:h-24 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image || '/vial-placeholder.svg'}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 80px, 96px"
                        onError={(e) => {
                          console.error('Image failed to load:', item.image, e);
                          // Set fallback image
                          const target = e.target as HTMLImageElement;
                          target.src = '/vial-placeholder.svg';
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', item.image);
                        }}
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-grow min-w-0">
                      <Link
                        href={`/products/${item.productId}`}
                        className="text-base md:text-lg font-bold text-gray-900 hover:text-primary-600 block mb-1"
                      >
                        {item.productName}
                      </Link>
                      <p className="text-sm text-gray-600 mb-2">Size: {item.variantSize}</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>

                    {/* Quantity Controls and Delete */}
                    <div className="flex flex-col items-end space-y-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.variantId, item.quantity - 1)
                          }
                          className="w-8 h-8 md:w-9 md:h-9 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="w-8 text-center font-semibold text-gray-900">{item.quantity}</span>
                        <button
                          onClick={async () => {
                            // Skip validation for backordered items
                            if (item.isBackorder) {
                              updateQuantity(item.productId, item.variantId, item.quantity + 1);
                              return;
                            }
                            
                            // Fetch current stock
                            const currentStock = variantStocks[item.variantId] ?? 0;
                            
                            if (currentStock === 0) {
                              toast.error("This item is out of stock. Please remove it or order as backorder.");
                              return;
                            }
                            
                            if (item.quantity + 1 > currentStock) {
                              toast.error(`Only ${currentStock} available in stock.`);
                              return;
                            }
                            
                            updateQuantity(item.productId, item.variantId, item.quantity + 1);
                          }}
                          className="w-8 h-8 md:w-9 md:h-9 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => {
                          trackRemoveFromCart({
                            itemId: item.productId,
                            itemName: item.productName,
                            itemCategory: 'Peptides',
                            price: item.price,
                            quantity: item.quantity,
                            currency: 'USD',
                          });
                          removeItem(item.productId, item.variantId);
                        }}
                        className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                        title="Remove item"
                      >
                        <svg
                          className="w-5 h-5 md:w-6 md:h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-4 md:p-6 sticky top-24">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Order Summary</h2>

              <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                <div className="flex justify-between text-gray-600">
                  <span className="text-sm md:text-base">Subtotal</span>
                  <span className="text-sm md:text-base">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="text-sm md:text-base">Shipping Insurance</span>
                  <span className="text-sm md:text-base">${shippingInsurance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="text-sm md:text-base">Shipping</span>
                  <span className="text-sm md:text-base">TBD at checkout</span>
                </div>
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="text-sm md:text-base">Points Discount</span>
                    <span className="text-sm md:text-base">-${pointsDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-3 md:pt-4">
                  <div className="flex justify-between text-lg md:text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push("/checkout")}
                className="btn-primary w-full mb-3 md:mb-4 text-sm md:text-base py-3 md:py-4"
              >
                Proceed to Checkout
              </button>

              <Link href="/products" className="block text-center text-primary-600 hover:text-primary-700 font-medium text-sm md:text-base">
                Continue Shopping
              </Link>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

