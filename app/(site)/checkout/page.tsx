"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/store";
import toast from "react-hot-toast";
import { LightBulbIcon } from "@heroicons/react/24/outline";
import { calculateShipping, ShippingOption } from "@/lib/shipping";
import RewardsPoints from "@/components/RewardsPoints";
import CreditCardPaymentForm from "@/components/CreditCardPaymentForm";
import { 
  trackPageView, 
  trackBeginCheckout, 
  trackAddShippingInfo, 
  trackAddPaymentInfo,
  trackPaymentMethodSelected,
  trackDiscountCodeApplied,
  trackRewardsRedeemed,
  trackCheckoutAbandonment
} from "@/lib/analytics";
import { usePathname } from "next/navigation";
const CHECKOUT_DRAFT_KEY = "summersteeze_checkout_v1";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, getTotalPrice, addItem, clearCart, updateItemPrice } = useCart();
  const pathname = usePathname();
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    firstName: "",
    lastName: "",
    name: "",
    email: "",
    phone: "",
    street: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    addressId: "", // Track if using existing address
  });
  const [isGuest, setIsGuest] = useState(!session); // Default to guest if not logged in
  const [subscribeToPromotions, setSubscribeToPromotions] = useState(false);
  const [subscribeToSms, setSubscribeToSms] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [saveAddress, setSaveAddress] = useState(false);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountError, setDiscountError] = useState("");
  const [freeShipping, setFreeShipping] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState<number | null>(null);
  const [isCompletingOrder, setIsCompletingOrder] = useState(false);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState("ground");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [pointsDiscount, setPointsDiscount] = useState(0);
  const [useSameAsShipping, setUseSameAsShipping] = useState(true);
  const [selectedPaymentMethod] = useState<"credit_card">("credit_card");
  const [billingInfo, setBillingInfo] = useState({
    name: "",
    street: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
  });
  const [addressValidationStatus, setAddressValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [addressValidationError, setAddressValidationError] = useState<string | null>(null);

  const subtotal = getTotalPrice();
  const shippingInsurance = 3.50; // Required shipping insurance
  const selectedShipping = shippingOptions.find(opt => opt.id === selectedShippingMethod);
  // Standard shipping is free, priority is $15, overnight is $50
  const shipping = selectedShippingMethod === 'expedited' ? 50 : selectedShippingMethod === 'priority' ? 15 : 0;
  
  const calculatedTotal = subtotal + shippingInsurance + shipping - discountAmount - pointsDiscount;
  const total = Math.max(0, calculatedTotal);

  // Validate shipping address with USPS when all fields are filled
  useEffect(() => {
    const { street, city, state, zipCode } = shippingInfo;
    
    // Only validate if all required address fields are filled
    if (!street || !city || !state || !zipCode || state.length < 2 || zipCode.length < 5) {
      setAddressValidationStatus('idle');
      setAddressValidationError(null);
      return;
    }

    // Debounce the validation
    const timeoutId = setTimeout(async () => {
      setAddressValidationStatus('validating');
      setAddressValidationError(null);

      try {
        const response = await fetch('/api/addresses/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            streetAddress: street,
            secondaryAddress: shippingInfo.apartment,
            city,
            state,
            zipCode,
          }),
        });

        const result = await response.json();

        if (result.isValid) {
          setAddressValidationStatus('valid');
          setAddressValidationError(null);
        } else {
          setAddressValidationStatus('invalid');
          setAddressValidationError(result.error || 'Address could not be validated');
        }
      } catch (error) {
        // On error, don't show warning - just set to idle
        setAddressValidationStatus('idle');
        setAddressValidationError(null);
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [shippingInfo.street, shippingInfo.apartment, shippingInfo.city, shippingInfo.state, shippingInfo.zipCode]);

  // Load saved checkout draft (guest or logged-in) on first mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(CHECKOUT_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (!draft || typeof draft !== "object") return;

      if (draft.shippingInfo) {
        setShippingInfo(prev => ({
          ...prev,
          ...draft.shippingInfo,
        }));
      }
      if (draft.billingInfo) {
        setBillingInfo(prev => ({
          ...prev,
          ...draft.billingInfo,
        }));
      }
      if (typeof draft.isGuest === "boolean") {
        setIsGuest(draft.isGuest);
      }
      if (typeof draft.useSameAsShipping === "boolean") {
        setUseSameAsShipping(draft.useSameAsShipping);
      }
      if (typeof draft.selectedShippingMethod === "string") {
        setSelectedShippingMethod(draft.selectedShippingMethod);
      }
      if (typeof draft.discountCode === "string") {
        setDiscountCode(draft.discountCode);
      }
    } catch {
      // If parsing fails, ignore and continue with empty state
    }
  }, []);

  // Persist checkout draft locally whenever key fields change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const draft = {
        shippingInfo,
        billingInfo,
        isGuest,
        useSameAsShipping,
        selectedShippingMethod,
        discountCode,
      };
      window.localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // If storage fails (e.g., quota), fail silently
    }
  }, [shippingInfo, billingInfo, isGuest, useSameAsShipping, selectedShippingMethod, discountCode]);

  // Track page view and begin checkout
  useEffect(() => {
    if (pathname && items.length > 0) {
      trackPageView(window.location.href, 'Checkout - Summer Steeze', {
        page_type: 'checkout',
      });

      trackBeginCheckout({
        items: items.map(item => ({
          itemId: item.productId,
          itemName: item.productName,
          itemCategory: 'Apparel',
          price: item.price,
          quantity: item.quantity,
        })),
        value: subtotal,
        currency: 'USD',
      });
    }
  }, [pathname, items, subtotal]);

  useEffect(() => {
    if (items.length === 0 && !isCompletingOrder) {
      router.push("/cart");
    }
  }, [items, router, isCompletingOrder]);

  // Sync cart prices with database prices
  useEffect(() => {
    const syncPrices = async () => {
      if (items.length === 0) return;
      
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          const allVariants = data.products.flatMap((p: any) => 
            (p.variants || []).map((v: any) => ({ id: v.id, price: v.price }))
          );
          
          items.forEach(item => {
            const variant = allVariants.find((v: any) => v.id === item.variantId);
            if (variant && item.price !== variant.price) {
              updateItemPrice(item.variantId, variant.price);
            }
          });
        }
      } catch (error) {
        console.error('Error syncing prices:', error);
      }
    };
    
    syncPrices();
  }, [items.length, updateItemPrice]);

  // Calculate shipping when address changes
  useEffect(() => {
    if (shippingInfo.street && shippingInfo.city && shippingInfo.state && shippingInfo.zipCode) {
      const shippingCalculation = calculateShipping(shippingInfo, subtotal);
      setShippingOptions(shippingCalculation.options);
      
      // Track add shipping info
      const selectedShipping = shippingCalculation.options.find(opt => opt.id === selectedShippingMethod);
      if (selectedShipping) {
        trackAddShippingInfo(selectedShippingMethod, selectedShipping.price, 'USD');
      }
    }
  }, [shippingInfo, subtotal, selectedShippingMethod]);

  // Reset billing info when "same as shipping" is checked
  useEffect(() => {
    if (useSameAsShipping) {
      setBillingInfo({
        name: "",
        street: "",
        apartment: "",
        city: "",
        state: "",
        zipCode: "",
        country: "US",
      });
    }
  }, [useSameAsShipping]);
  useEffect(() => {
    if (session?.user?.email && (!shippingInfo.email || !shippingInfo.phone)) {
      setShippingInfo(prev => ({
        ...prev,
        email: prev.email || session.user?.email || '',
        phone: prev.phone || ((session.user as any).phone as string) || "",
      }));
      setIsGuest(false); // User is logged in, not a guest
    } else if (!session) {
      setIsGuest(true); // No session, user is a guest
    }
  }, [session, shippingInfo.email]);

  // Load saved addresses for logged-in users
  useEffect(() => {
    if (session && !isGuest) {
      setAddressesLoading(true);
      fetch("/api/addresses")
        .then(res => res.json())
        .then(data => {
          const addresses = data.addresses || [];
          setSavedAddresses(addresses);
          
          // Auto-select first address if available
          if (addresses.length > 0) {
            const firstAddress = addresses[0];
            setSelectedAddressId(firstAddress.id);
            const [firstName = "", ...restName] = (firstAddress.name || "").split(" ");
            const lastName = restName.join(" ");
            setShippingInfo({
              firstName,
              lastName,
              name: firstAddress.name,
              email: session.user?.email || '',
              phone: firstAddress.phone || '',
              street: firstAddress.street,
              apartment: firstAddress.apartment || '',
              city: firstAddress.city,
              state: firstAddress.state,
              zipCode: firstAddress.zipCode,
              country: firstAddress.country || 'US',
              addressId: firstAddress.id, // Include addressId so we can reuse existing address
            });
          }
        })
        .catch(err => console.error("Failed to load addresses:", err))
        .finally(() => setAddressesLoading(false));
    }
  }, [session, isGuest]);

  const validateDiscountCode = async (code: string) => {
    if (!code.trim()) {
      setDiscountAmount(0);
      setDiscountError("");
      return;
    }

    try {
      const response = await fetch("/api/discount/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          code: code.trim(),
          subtotal: subtotal // Only pass subtotal, not shipping or insurance
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setDiscountAmount(data.discountAmount);
        setFreeShipping(data.freeShipping || false);
        setDiscountPercentage(data.discountPercentage);
        setDiscountError("");
        const savings = data.discountAmount + (data.freeShipping ? shipping : 0);
        toast.success(`Discount applied! You saved $${savings.toFixed(2)}${data.freeShipping ? ' (includes free shipping)' : ''}`);
        
        // Track discount code application
        if (data.discountAmount > 0) {
          const currentTotal = subtotal + shippingInsurance + shipping - data.discountAmount - pointsDiscount;
          trackDiscountCodeApplied(code.trim(), data.discountAmount, currentTotal);
        }
      } else {
        setDiscountAmount(0);
        setFreeShipping(false);
        setDiscountPercentage(null);
        // Check if it's an invalid/expired code error
        const errorMessage = data?.error || "No discount code found";
        const displayError = errorMessage.toLowerCase().includes("invalid") || 
                           errorMessage.toLowerCase().includes("expired") || 
                           errorMessage.toLowerCase().includes("not found")
          ? "No discount code found"
          : errorMessage;
        setDiscountError(displayError);
        toast.error(displayError);
      }
    } catch {
      setDiscountAmount(0);
      setFreeShipping(false);
      setDiscountPercentage(null);
      setDiscountError("No discount code found");
      toast.error("No discount code found");
    }
  };

  const handleDiscountCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.toUpperCase();
    setDiscountCode(code);
    // Clear discount and free shipping when user types
    if (code === "") {
      setDiscountAmount(0);
      setFreeShipping(false);
      setDiscountPercentage(null);
    }
    // Clear any existing error when user types
    if (discountError) {
      setDiscountError("");
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountAmount(0);
      setFreeShipping(false);
      setDiscountPercentage(null);
      setDiscountError("");
      return;
    }
    await validateDiscountCode(discountCode);
  };

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email for guest orders
    if (isGuest && !shippingInfo.email) {
      toast.error("Email is required for guest orders. Please enter your email address.");
      return;
    }

    // Validate email format if provided
    if (isGuest && shippingInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingInfo.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    
    // Validate US-only shipping
    // Normalize country value - check for various formats (US, USA, United States, etc.)
    const countryValue = (shippingInfo.country || "US").toString().toUpperCase();
    const isUSCountry = countryValue === "US" || countryValue === "USA" || countryValue === "UNITED STATES" || countryValue === "UNITED STATES OF AMERICA";
    
    if (!isUSCountry) {
      toast.error("We currently only ship within the United States. Please select United States as your country.");
      return;
    }

    // Validate billing address if not using same as shipping
    if (!useSameAsShipping) {
      if (!billingInfo.name || !billingInfo.street || !billingInfo.city || !billingInfo.state || !billingInfo.zipCode) {
        toast.error("Please fill in all required billing address fields");
        return;
      }
    }
    
    setIsLoading(true);

    try {
      // Determine billing address to use
      const finalBillingInfo = useSameAsShipping ? shippingInfo : billingInfo;

      // Save shipping address if user requested and is logged in
      if (saveAddress && session && session.user?.id && (selectedAddressId === "" || savedAddresses.length === 0)) {
        try {
          const shippingAddressResponse = await fetch("/api/addresses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: shippingInfo.name,
              street: shippingInfo.street,
              apartment: shippingInfo.apartment || undefined,
              city: shippingInfo.city,
              state: shippingInfo.state,
              zipCode: shippingInfo.zipCode,
              country: shippingInfo.country || "US",
              phone: shippingInfo.phone,
            }),
          });

          if (shippingAddressResponse.ok) {
            console.log("✅ Shipping address saved to profile");
          } else {
            const errorData = await shippingAddressResponse.json();
            // If address already exists, that's fine - continue with order
            if (errorData.error?.includes("already exists")) {
              console.log("ℹ️ Shipping address already exists in profile");
            } else {
              console.error("Failed to save shipping address, but continuing with order:", errorData);
            }
          }
        } catch (error) {
          console.error("Error saving shipping address:", error);
          // Continue with order even if saving fails
        }
      }

      // Save billing address if different from shipping and user is logged in
      if (!useSameAsShipping && session && session.user?.id) {
        try {
          const billingAddressResponse = await fetch("/api/addresses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: billingInfo.name,
              street: billingInfo.street,
              apartment: billingInfo.apartment || undefined,
              city: billingInfo.city,
              state: billingInfo.state,
              zipCode: billingInfo.zipCode,
              country: billingInfo.country || "US",
            }),
          });

          if (billingAddressResponse.ok) {
            console.log("✅ Billing address saved to profile");
          } else {
            const errorData = await billingAddressResponse.json();
            // If address already exists, that's fine - continue with order
            if (errorData.error?.includes("already exists")) {
              console.log("ℹ️ Billing address already exists in profile");
            } else {
              console.error("Failed to save billing address, but continuing with order:", errorData);
            }
          }
        } catch (error) {
          console.error("Error saving billing address:", error);
          // Continue with order even if saving fails
        }
      }

      // Payment intent creation is disabled for cards (coming soon)
      // Set clientSecret to a truthy value to show payment forms (crypto/zelle)
      // We use "ready" as a flag to indicate we're ready to show payment forms
      setClientSecret("ready");
    } catch {
      toast.error("Something went wrong. Please try again shortly or contact support");
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="py-12">
      <div className="container-custom">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="card p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Information</h2>
              
              {!clientSecret ? (
                <form onSubmit={handleShippingSubmit} className="space-y-4">
                  {/* Guest Checkout Option */}
                  {!session && (
                    <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-brand-50 border border-brand-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="guest-checkout"
                          checked={isGuest}
                          onChange={(e) => setIsGuest(e.target.checked)}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                        />
                        <div className="flex-1">
                          <label htmlFor="guest-checkout" className="text-base font-semibold text-gray-900">
                            Continue as guest (no account required)
                          </label>
                          <p className="mt-1 text-sm text-gray-600">
                            You can complete your purchase without creating an account. We'll only need your email for order updates.
                          </p>
                          {!isGuest && (
                            <div className="mt-3 p-3 bg-white rounded border border-brand-200">
                              <p className="text-sm text-gray-700">
                                <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium">
                                  Sign in to your account
                                </Link>{" "}
                                for faster checkout, order tracking, and saved addresses
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Loading State for Addresses */}
                  {session && !isGuest && addressesLoading && (
                    <div className="mb-6 flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Loading your addresses...</span>
                    </div>
                  )}

                  {/* Saved Addresses for Logged-in Users */}
                  {session && !isGuest && !addressesLoading && savedAddresses.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Choose a saved address
                      </label>
                      <div className="space-y-2">
                        {savedAddresses.map((address) => (
                          <div key={address.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                            <input
                              type="radio"
                              id={`address-${address.id}`}
                              name="savedAddress"
                              value={address.id}
                              checked={selectedAddressId === address.id}
                              onChange={(e) => {
                                setSelectedAddressId(e.target.value);
                                const [firstName = "", ...restName] = (address.name || "").split(" ");
                                const lastName = restName.join(" ");
                                setShippingInfo({
                                  firstName,
                                  lastName,
                                  name: address.name,
                                  email: session.user?.email || '',
                                  phone: address.phone || '',
                                  street: address.street,
                                  apartment: address.apartment || '',
                                  city: address.city,
                                  state: address.state,
                                  zipCode: address.zipCode,
                                  country: address.country || 'US',
                                  addressId: address.id, // Include addressId so we can reuse existing address
                                });
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <label htmlFor={`address-${address.id}`} className="flex-1 text-sm">
                              <div className="font-medium">{address.name}</div>
                              <div className="text-gray-600">
                                {address.street}{address.apartment ? `, ${address.apartment}` : ""}, {address.city}, {address.state} {address.zipCode}
                              </div>
                            </label>
                          </div>
                        ))}
                        <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                          <input
                            type="radio"
                            id="new-address"
                            name="savedAddress"
                            value=""
                            checked={selectedAddressId === ""}
                            onChange={() => setSelectedAddressId("")}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <label htmlFor="new-address" className="text-sm font-medium text-gray-700">
                            Use a new address
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Manual Address Entry - Only show if no saved address selected or "new address" selected */}
                  {(!session || isGuest || (!addressesLoading && (selectedAddressId === "" || savedAddresses.length === 0))) && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingInfo.firstName}
                            onChange={(e) => {
                              const firstName = e.target.value;
                              setShippingInfo({
                                ...shippingInfo,
                                firstName,
                                name: `${firstName} ${shippingInfo.lastName || ""}`.trim(),
                              });
                            }}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingInfo.lastName}
                            onChange={(e) => {
                              const lastName = e.target.value;
                              setShippingInfo({
                                ...shippingInfo,
                                lastName,
                                name: `${shippingInfo.firstName || ""} ${lastName}`.trim(),
                              });
                            }}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                          </label>
                          <input
                            type="email"
                            required={isGuest}
                            value={shippingInfo.email}
                            onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                            className="input-field"
                            placeholder={isGuest ? "your.email@example.com" : ""}
                          />
                          {isGuest && !shippingInfo.email && (
                            <p className="mt-1 text-xs text-red-600">
                              Email is required to receive order updates and confirmations
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={shippingInfo.phone}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9()\- ]/g, '');
                            setShippingInfo({ ...shippingInfo, phone: value });
                          }}
                          className="input-field"
                          placeholder="(555) 123-4567"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingInfo.street}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, street: e.target.value })}
                          className="input-field"
                          placeholder="123 Main Street"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Apartment, Suite, Unit, etc. (Optional)
                        </label>
                        <input
                          type="text"
                          value={shippingInfo.apartment}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, apartment: e.target.value })}
                          className="input-field"
                          placeholder="Apt 4B, Suite 100, Unit 5, etc."
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City *
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingInfo.city}
                            onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={2}
                            value={shippingInfo.state}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase();
                              setShippingInfo({ ...shippingInfo, state: value });
                            }}
                            className="input-field"
                            placeholder="CA"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ZIP Code *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={10}
                            pattern="[0-9]{5}(-[0-9]{4})?"
                            value={shippingInfo.zipCode}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9-]/g, '');
                              setShippingInfo({ ...shippingInfo, zipCode: value });
                            }}
                            className="input-field"
                            placeholder="12345 or 12345-6789"
                          />
                        </div>
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country *
                          </label>
                          <div className="relative">
                            <select
                              required
                              value={shippingInfo.country}
                              onChange={(e) => setShippingInfo({ ...shippingInfo, country: e.target.value })}
                              className="input-field appearance-none pr-10 bg-white cursor-pointer"
                            >
                              <option value="US">United States</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            We currently only ship within the United States
                          </p>
                        </div>
                      </div>

                    </>
                  )}

                  {/* Shipping Options */}
                  {shippingOptions.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Shipping Method
                      </label>
                      <div className="space-y-3">
                        {shippingOptions.map((option) => (
                          <div key={option.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                            <input
                              type="radio"
                              id={`shipping-${option.id}`}
                              name="shippingMethod"
                              value={option.id}
                              checked={selectedShippingMethod === option.id}
                              onChange={(e) => setSelectedShippingMethod(e.target.value)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <label htmlFor={`shipping-${option.id}`} className="flex-1">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-gray-900">{option.name}</div>
                                  <div className="text-sm text-gray-600">{option.description}</div>
                                  <div className="text-xs text-gray-500">{option.estimatedDays}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-gray-900">
                                    {option.isFree ? "FREE" : `$${option.price.toFixed(2)}`}
                                  </div>
                                </div>
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rewards Points */}
                  <RewardsPoints 
                    subtotal={subtotal} 
                    onPointsRedeemed={(points, value) => {
                      setPointsDiscount(value);
                      trackRewardsRedeemed(points, value);
                    }}
                  />

                  {/* Discount Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Code (Optional)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={discountCode}
                        onChange={handleDiscountCodeChange}
                        placeholder="Enter code"
                        className="input-field w-32"
                        maxLength={10}
                      />
                      <button
                        type="button"
                        onClick={handleApplyDiscount}
                        disabled={!discountCode.trim()}
                        className={`px-3 py-2 text-white text-sm font-medium rounded transition-colors ${
                          !discountCode.trim() 
                            ? "bg-gray-400 cursor-not-allowed" 
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        Apply
                      </button>
                    </div>
                    {discountAmount > 0 && (
                      <div className="mt-2 flex items-center text-green-600 text-sm font-medium">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Discount applied: -${discountAmount.toFixed(2)}
                      </div>
                    )}
                    {discountError && (
                      <div className="mt-2 flex items-center text-red-600 text-sm">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {discountError}
                      </div>
                    )}
                  </div>

                  {/* Promotions Checkbox - Only for Guest Users */}
                  {isGuest && (
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="subscribe-promotions"
                        checked={subscribeToPromotions}
                        onChange={(e) => setSubscribeToPromotions(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="subscribe-promotions" className="text-sm text-gray-700">
                        Send me promotional emails and updates about new products (optional)
                      </label>
                    </div>
                  )}

                  {/* SMS marketing opt-in - small, for everyone with phone */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="subscribe-sms"
                      checked={subscribeToSms}
                      onChange={(e) => setSubscribeToSms(e.target.checked)}
                      className="h-3.5 w-3.5 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                    />
                    <label htmlFor="subscribe-sms" className="text-xs text-gray-500">
                      Text me offers and sales from Summer Steeze (optional)
                    </label>
                  </div>

                  {/* Save Address Checkbox - Only for Logged-in Users entering new address */}
                  {session && !isGuest && !addressesLoading && (selectedAddressId === "" || savedAddresses.length === 0) && (
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="save-address"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="save-address" className="text-sm text-gray-700">
                        Save this address for future orders
                      </label>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full"
                  >
                    {isLoading ? "Processing..." : "Continue to Payment"}
                  </button>
                  
                  {/* Account Benefits Note */}
                  {!session && (
                    <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <LightBulbIcon className="h-4 w-4 text-yellow-500" />
                        Create an account for faster checkout next time
                      </h3>
                      <p className="text-xs text-gray-600 mb-3">
                        Save your addresses, track orders, and enjoy faster checkout on future purchases.
                      </p>
                      <Link 
                        href="/auth/register" 
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Create account →
                      </Link>
                    </div>
                  )}
                </form>
              ) : (
                <div>
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Shipping To:</h3>
                    <p>{shippingInfo.name}</p>
                    <p>{shippingInfo.street}{shippingInfo.apartment ? `, ${shippingInfo.apartment}` : ""}</p>
                    <p>{shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}</p>
                    <button
                      onClick={() => setClientSecret("")}
                      className="text-primary-600 text-sm mt-2 hover:text-primary-700"
                    >
                      Edit Shipping Information
                    </button>
                  </div>

                  {/* Billing Address Section */}
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Billing Address</h2>
                    
                    <div className="mb-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={useSameAsShipping}
                          onChange={(e) => setUseSameAsShipping(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Same as shipping address</span>
                      </label>
                    </div>

                    {!useSameAsShipping && (
                      <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-white">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required={!useSameAsShipping}
                            value={billingInfo.name}
                            onChange={(e) => setBillingInfo({ ...billingInfo, name: e.target.value })}
                            className="input-field"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Street Address *
                          </label>
                          <input
                            type="text"
                            required={!useSameAsShipping}
                            value={billingInfo.street}
                            onChange={(e) => setBillingInfo({ ...billingInfo, street: e.target.value })}
                            className="input-field"
                            placeholder="123 Main Street"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Apartment, Suite, Unit, etc. (Optional)
                          </label>
                          <input
                            type="text"
                            value={billingInfo.apartment}
                            onChange={(e) => setBillingInfo({ ...billingInfo, apartment: e.target.value })}
                            className="input-field"
                            placeholder="Apt 4B, Suite 100, Unit 5, etc."
                          />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              City *
                            </label>
                            <input
                              type="text"
                              required={!useSameAsShipping}
                              value={billingInfo.city}
                              onChange={(e) => setBillingInfo({ ...billingInfo, city: e.target.value })}
                              className="input-field"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              State *
                            </label>
                            <input
                              type="text"
                              required={!useSameAsShipping}
                              maxLength={2}
                              value={billingInfo.state}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase();
                                setBillingInfo({ ...billingInfo, state: value });
                              }}
                              className="input-field"
                              placeholder="CA"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ZIP Code *
                            </label>
                            <input
                              type="text"
                              required={!useSameAsShipping}
                              maxLength={10}
                              value={billingInfo.zipCode}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9-]/g, '');
                                setBillingInfo({ ...billingInfo, zipCode: value });
                              }}
                              className="input-field"
                              placeholder="12345 or 12345-6789"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment</h2>
                  <p className="text-sm text-gray-600 mb-4">Pay securely with credit or debit card.</p>

                  <div className="mt-6">
                    <CreditCardPaymentForm
                        total={typeof total === 'number' ? total : parseFloat(String(total)) || 0}
                        items={items}
                        shippingInfo={shippingInfo}
                        billingInfo={useSameAsShipping ? shippingInfo : billingInfo}
                        session={session}
                        subscribeToPromotions={subscribeToPromotions}
                        subscribeToSms={subscribeToSms}
                        discountCode={discountCode}
                        discountAmount={discountAmount}
                        shippingCost={shipping}
                        shippingMethod={selectedShippingMethod}
                        isCompletingOrder={isCompletingOrder}
                        setIsCompletingOrder={setIsCompletingOrder}
                      />
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24 z-30">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-gray-600">
                        {item.variantSize} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping Insurance</span>
                  <span>${shippingInsurance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-semibold">FREE</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      Discount {discountPercentage ? `(${discountPercentage}% OFF)` : `(${discountCode})`}
                    </span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Points Discount</span>
                    <span>-${pointsDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

