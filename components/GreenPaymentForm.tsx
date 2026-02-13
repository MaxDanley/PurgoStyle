"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getStoredAffiliateRef } from "@/components/AffiliateTracker";

interface GreenPaymentFormProps {
  total: number;
  items: any[];
  shippingInfo: any;
  billingInfo: any;
  session: any;
  subscribeToPromotions: boolean;
  subscribeToSms?: boolean;
  discountCode: string;
  discountAmount: number;
  shippingCost: number;
  isCompletingOrder: boolean;
  setIsCompletingOrder: (value: boolean) => void;
}

export default function GreenPaymentForm({
  total,
  items,
  shippingInfo,
  billingInfo,
  session,
  subscribeToPromotions,
  subscribeToSms = false,
  discountCode,
  discountAmount,
  shippingCost,
  isCompletingOrder,
  setIsCompletingOrder,
}: GreenPaymentFormProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [complianceChecked, setComplianceChecked] = useState(false);
  const [showComplianceError, setShowComplianceError] = useState(false);
  const [payorId, setPayorId] = useState<string | null>(null);
  const [plaidIframeUrl, setPlaidIframeUrl] = useState<string | null>(null);
  const [showPlaidIframe, setShowPlaidIframe] = useState(false);
  const [bankAccountVerified, setBankAccountVerified] = useState(false);
  const [bankAccountInfo, setBankAccountInfo] = useState<{ routingNumber?: string; accountNumber?: string } | null>(null);
  const [checkingExistingCustomer, setCheckingExistingCustomer] = useState(true);
  // Detect mobile immediately (don't wait for useEffect)
  const isMobile = typeof window !== "undefined" && (
    window.innerWidth < 768 || 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const plaidWindowRef = useRef<Window | null>(null);

  // Check for existing customer on mount (only for authenticated users)
  useEffect(() => {
    const checkExistingCustomer = async () => {
      // SECURITY: Only check for existing customers if user is authenticated
      // Guest users will always create a new customer
      if (!session?.user?.id) {
        setCheckingExistingCustomer(false);
        return;
      }

      try {
        const response = await fetch("/api/green/check-existing-customer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.id, // Only send userId for authenticated users
          }),
        });

        const data = await response.json();

        if (response.ok && data.success && data.hasExistingCustomer) {
          // Validate payorId before setting it
          if (data.payorId && typeof data.payorId === 'string' && data.payorId !== 'string' && data.payorId.trim() !== '') {
            setPayorId(data.payorId);
          } else {
            setPayorId(null);
          }
          
          if (data.hasBankAccount && data.customer) {
            // Customer exists and has bank account registered
            setBankAccountInfo({
              routingNumber: data.customer.RoutingNumber,
              accountNumber: data.customer.AccountNumber,
            });
            setBankAccountVerified(true);
          } else {
            // Customer exists but no bank account - need Plaid verification
            const setupResponse = await fetch("/api/green/setup-customer", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                billingInfo,
                shippingInfo,
                userEmail: session.user.email || shippingInfo.email,
                payorId: data.payorId,
              }),
            });
            
            const setupData = await setupResponse.json();
            if (setupResponse.ok && setupData.success) {
              setPlaidIframeUrl(setupData.plaidIframeUrl);
            }
          }
        }
      } catch (error) {
        // Silently handle error
      } finally {
        setCheckingExistingCustomer(false);
      }
    };

    checkExistingCustomer();
  }, [session, shippingInfo, billingInfo]);

  const fetchCustomerInfo = useCallback(async () => {
    if (!payorId) return;

    try {
      const response = await fetch("/api/green/get-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payorId }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.customer) {
        // Only set bank account info if we actually got routing/account numbers
        if (data.customer.RoutingNumber && data.customer.AccountNumber) {
          setBankAccountInfo({
            routingNumber: data.customer.RoutingNumber,
            accountNumber: data.customer.AccountNumber,
          });
        }
        // Bank account is verified if Plaid success event fired
        // Even if we can't fetch details yet, the verification is complete
        setBankAccountVerified(true);
      } else {
        // If GetCustomerInformation fails (e.g., Green backend still processing),
        // we still mark as verified since Plaid success event fired
        // The bank account info will be available when we process the payment
        console.log("Could not fetch customer details yet, but Plaid verification succeeded");
        setBankAccountVerified(true);
      }
    } catch (error) {
      // If there's an error (like Green's backend still processing),
      // we still mark as verified since Plaid success event fired
      // The error "sp_PlaidBankBlock_Save has too many arguments" happens on Green's side
      // but doesn't affect the fact that Plaid successfully authenticated
      console.log("Error fetching customer info after Plaid success, but verification is complete:", error);
      setBankAccountVerified(true);
    }
  }, [payorId]);

  // Set up Plaid (popup) event listeners
  useEffect(() => {
    if (!showPlaidIframe || typeof window === "undefined") return;

    const handleMessage = (e: MessageEvent) => {
      // Verify origin for security - Green uses greenbyphone.com
      if (!e.origin.includes("greenbyphone.com") && !e.origin.includes("plaid.com")) {
        return;
      }

      // Handle both string and object message formats, and tolerate non-JSON strings
      let messageData: any = e.data;
      if (typeof e.data === "string") {
        try {
          messageData = JSON.parse(e.data);
        } catch {
          messageData = { event: e.data };
        }
      }

      switch (messageData.event) {
        case "GreenPlaidOnExit":
          // Close popup and reset
          if (plaidWindowRef.current && !plaidWindowRef.current.closed) {
            plaidWindowRef.current.close();
            plaidWindowRef.current = null;
          }
          setShowPlaidIframe(false);
          setIsProcessing(false);
          setIsCompletingOrder(false);
          toast.error("Bank verification was cancelled. You can try again.");
          break;

        case "GreenPlaidOnSuccess":
          // Plaid has successfully authenticated and saved bank account
          // The error "sp_PlaidBankBlock_Save has too many arguments" happens on Green's backend
          // This is likely because we're calling GetCustomerInformation too quickly
          // Wait longer for Green's backend to finish processing the Plaid save
          setBankAccountVerified(true);
          if (plaidWindowRef.current && !plaidWindowRef.current.closed) {
            plaidWindowRef.current.close();
            plaidWindowRef.current = null;
          }
          setShowPlaidIframe(false);
          setIsProcessing(false);
          setIsCompletingOrder(false);
          
          // Wait 3-5 seconds before fetching customer info to avoid backend conflicts
          // The error occurs on Green's side when sp_PlaidBankBlock_Save is called
          // We need to give their backend time to complete the save operation
          setTimeout(() => {
            fetchCustomerInfo();
          }, 3000); // Wait 3 seconds for Green to finish saving bank account
          
          toast.success("Bank account verified successfully!");
          break;

        case "GreenPlaidOnError":
          toast.error("Bank account verification failed. Please try again.");
          if (plaidWindowRef.current && !plaidWindowRef.current.closed) {
            plaidWindowRef.current.close();
            plaidWindowRef.current = null;
          }
          setShowPlaidIframe(false);
          setPaymentError("Bank account verification failed");
          setIsProcessing(false);
          setIsCompletingOrder(false);
          break;

        default:
          // Unhandled event
          break;
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [showPlaidIframe, fetchCustomerInfo]);
  // Use inline iframe on mobile, popup on desktop (but prefer inline for reliability)
  useEffect(() => {
    if (!showPlaidIframe || !plaidIframeUrl || typeof window === "undefined") return;

    // Check if mobile - always use inline iframe on mobile
    const isMobileDevice = typeof window !== "undefined" && (
      window.innerWidth < 768 || 
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );

    if (isMobileDevice) {
      // Mobile: iframe is rendered inline in the component
      // Do NOT attempt to open popup on mobile - exit immediately
      console.log("[Plaid] Mobile device detected - using inline iframe");
      return;
    }

    // Desktop: Try popup, but fallback to inline if blocked
    // If popup already open and not closed, reuse it
    if (plaidWindowRef.current && !plaidWindowRef.current.closed) {
      plaidWindowRef.current.focus();
      return;
    }

    // Open a reasonably sized popup window around the Plaid UI itself
    const width = 480;
    const height = 720;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;
    const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no`;

    try {
      plaidWindowRef.current = window.open(plaidIframeUrl, "GreenPlaid", features);

      if (!plaidWindowRef.current) {
        // Popup was blocked - this is fine, we'll use inline iframe instead
        console.log("[Plaid] Popup blocked - will use inline iframe instead");
        // Don't show error or hide iframe - let it render inline
      }
    } catch (error) {
      // Popup failed - use inline iframe instead
      console.log("[Plaid] Popup failed - will use inline iframe instead", error);
    }

    // Poll for manual window close (user clicks browser close without Plaid events)
    const interval = window.setInterval(() => {
      if (plaidWindowRef.current && plaidWindowRef.current.closed) {
        window.clearInterval(interval);
        plaidWindowRef.current = null;
        setShowPlaidIframe(false);
        setIsProcessing(false);
        setIsCompletingOrder(false);
        if (!bankAccountVerified) {
          toast.error("Bank verification window was closed. You can click Verify Bank Account to try again.");
        }
      }
    }, 500);

    return () => {
      window.clearInterval(interval);
      if (plaidWindowRef.current && !plaidWindowRef.current.closed) {
        plaidWindowRef.current.close();
        plaidWindowRef.current = null;
      }
    };
  }, [showPlaidIframe, plaidIframeUrl, bankAccountVerified]);

  const handleSetupCustomer = async () => {
    if (!complianceChecked) {
      setShowComplianceError(true);
      return;
    }

    setShowComplianceError(false);
    setIsProcessing(true);
    setPaymentError(null);

    // Validate payorId before sending - don't send if it's invalid
    const validPayorId = payorId && 
                         typeof payorId === 'string' && 
                         payorId.trim() !== '' && 
                         payorId !== 'string' 
                         ? payorId 
                         : undefined;

    if (payorId && payorId === 'string') {
      setPayorId(null); // Clear invalid payorId
    }

    try {
      const requestBody: any = {
        billingInfo,
        shippingInfo,
        userEmail: session?.user?.email || shippingInfo.email,
      };

      // Only include payorId if it's valid
      if (validPayorId) {
        requestBody.payorId = validPayorId;
      }

      const response = await fetch("/api/green/setup-customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Validate payorId is a valid string (not empty, not the word "string")
        if (!data.payorId || typeof data.payorId !== 'string' || data.payorId.trim() === '' || data.payorId === 'string') {
          setPaymentError("Sorry, something went wrong. please contact support or try again later");
          toast.error("Sorry, something went wrong. please contact support or try again later");
          setIsProcessing(false);
          setIsCompletingOrder(false);
          return;
        }

        if (!data.plaidIframeUrl || typeof data.plaidIframeUrl !== 'string' || !data.plaidIframeUrl.includes('customer_id=')) {
          setPaymentError("Sorry, something went wrong. please contact support or try again later");
          toast.error("Sorry, something went wrong. please contact support or try again later");
          setIsProcessing(false);
          setIsCompletingOrder(false);
          return;
        }
        
        // Set state in correct order
        setPayorId(data.payorId);
        setPlaidIframeUrl(data.plaidIframeUrl);
        
        // Use setTimeout to ensure state updates are applied before showing iframe
        setTimeout(() => {
          setShowPlaidIframe(true);
          setIsCompletingOrder(true);
        }, 100);
        
        toast.success("Please verify your bank account.");
      } else {
        setPaymentError("Sorry, something went wrong. please contact support or try again later");
        toast.error("Sorry, something went wrong. please contact support or try again later");
        setIsProcessing(false);
        setIsCompletingOrder(false);
      }
    } catch (error: any) {
      setPaymentError("Sorry, something went wrong. please contact support or try again later");
      toast.error("Sorry, something went wrong. please contact support or try again later");
      setIsProcessing(false);
      setIsCompletingOrder(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!payorId) {
      toast.error("Customer information missing");
      return;
    }

    if (!bankAccountVerified) {
      toast.error("Please complete bank account verification first");
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Get affiliate reference if present
      const affiliateRef = getStoredAffiliateRef();

      // Create order and process payment in one call
      const response = await fetch("/api/orders/process-green-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payorId,
          items,
          shippingInfo,
          billingInfo,
          metadata: {
            userId: session?.user?.id || null,
            userEmail: session?.user?.email || shippingInfo.email,
            isGuest: !session,
            subscribeToPromotions,
            smsOptIn: subscribeToSms,
            discountCode,
            discountAmount,
            shippingCost,
            affiliateRef,
          },
          total,
          verificationType: "RTV", // Real-Time Verification
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Redirect to order confirmation page
        router.push(`/order-confirmation?order=${data.order.orderNumber}`);
      } else {
        setPaymentError("Sorry, something went wrong. please contact support or try again later");
        toast.error("Sorry, something went wrong. please contact support or try again later");
        setIsProcessing(false);
      }
    } catch (error: any) {
      setPaymentError("Sorry, something went wrong. please contact support or try again later");
      toast.error("Sorry, something went wrong. please contact support or try again later");
      setIsProcessing(false);
    }
  };

  if (checkingExistingCustomer) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Checking for existing account...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          Pay securely with your bank account using Plaid. Your bank credentials are never shared with us.
        </p>
      </div>

      {/* Bank Account Already Verified */}
      {bankAccountVerified && bankAccountInfo && !showPlaidIframe && (
        <>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              ✓ Bank Account Verified
            </h3>
            <div className="space-y-2 text-sm">
              <p className="text-green-800">
                <strong>Routing Number:</strong> {bankAccountInfo.routingNumber}
              </p>
              <p className="text-green-800">
                <strong>Account Number:</strong> {bankAccountInfo.accountNumber}
              </p>
              <p className="text-green-700 mt-3">
                Your bank account is already verified. Click "Complete Payment" to process your order.
              </p>
            </div>
            {/* Option to use a different account */}
            {payorId && (
              <button
                type="button"
                onClick={async () => {
                  // Re-authenticate with Plaid to choose a different account
                  // According to Green API docs, we can show Plaid iframe multiple times
                  try {
                    const setupResponse = await fetch("/api/green/setup-customer", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        billingInfo,
                        shippingInfo,
                        userEmail: session?.user?.email || shippingInfo.email,
                        payorId, // Use existing Payor_ID
                      }),
                    });
                    
                    const setupData = await setupResponse.json();
                    if (setupResponse.ok && setupData.success) {
                      setPlaidIframeUrl(setupData.plaidIframeUrl);
                      setShowPlaidIframe(true);
                      setBankAccountVerified(false); // Reset verification status
                      setBankAccountInfo(null); // Clear old bank info
                      toast.success("Please select your bank account");
                    }
                  } catch (error) {
                    toast.error("Sorry, something went wrong. please contact support or try again later");
                  }
                }}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Use a different bank account
              </button>
            )}
          </div>

          {/* Compliance Checkbox */}
          <div className="space-y-2">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={complianceChecked}
                onChange={(e) => {
                  setComplianceChecked(e.target.checked);
                  setShowComplianceError(false);
                }}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                I confirm that I am 21 years of age or older and that all compounds in this order will be used strictly
                for laboratory and scientific research purposes only.
              </span>
            </label>
            {showComplianceError && (
              <p className="text-sm text-red-600">Please confirm your authorization to proceed.</p>
            )}
          </div>

          {/* Complete Payment Button */}
          <button
            type="button"
            onClick={handleProcessPayment}
            disabled={isProcessing || !complianceChecked}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing Payment..." : "Complete Payment"}
          </button>
        </>
      )}

      {/* Need Bank Verification */}
      {!bankAccountVerified && (
        <>
          {/* Compliance Checkbox */}
          <div className="space-y-2">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={complianceChecked}
                onChange={(e) => {
                  setComplianceChecked(e.target.checked);
                  setShowComplianceError(false);
                }}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                I confirm that I am 21 years of age or older and that all compounds in this order will be used strictly
                for laboratory and scientific research purposes only.
              </span>
            </label>
            {showComplianceError && (
              <p className="text-sm text-red-600">Please confirm your authorization to proceed.</p>
            )}
          </div>

          {/* Setup Customer & Show Plaid Button */}
          {!showPlaidIframe && (
            <button
              type="button"
              onClick={handleSetupCustomer}
              disabled={isProcessing || isCompletingOrder || !complianceChecked}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Setting up..." : "Verify Bank Account"}
            </button>
          )}

          {/* Plaid iframe - inline on mobile, or if popup blocked on desktop */}
          {showPlaidIframe && plaidIframeUrl && (() => {
            // Detect mobile at render time
            const isMobileDevice = typeof window !== "undefined" && (
              window.innerWidth < 768 || 
              /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            );
            
            // Show inline iframe if mobile OR if popup was blocked/failed (popup will be null)
            const shouldShowInline = isMobileDevice || !plaidWindowRef.current || plaidWindowRef.current.closed;

            return (
              <div className="border-2 border-blue-300 rounded-lg p-4 bg-white">
                {shouldShowInline ? (
                  // Show inline iframe (mobile or popup blocked)
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Verify Your Bank Account
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Please complete the bank verification below to continue.
                    </p>
                    <div className="w-full" style={{ minHeight: '600px' }}>
                      <iframe
                        ref={iframeRef}
                        src={plaidIframeUrl}
                        title="Bank Login"
                        className="w-full border-0 rounded-lg"
                        style={{ 
                          width: '100%', 
                          minHeight: '600px',
                          height: '600px',
                          maxHeight: '80vh'
                        }}
                        allow="payment"
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                      />
                    </div>
                  </>
                ) : (
                  // Desktop: Show helper text for popup
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Verify Your Bank Account
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      A secure bank login window has been opened. Please complete the verification in the popup to continue.
                    </p>
                    <p className="text-xs text-gray-500">
                      If you don&apos;t see the popup, check your browser&apos;s popup blocker and allow popups for this site, then click
                      &quot;Verify Bank Account&quot; again.
                    </p>
                  </>
                )}
              </div>
            );
          })()}

          {/* Bank Account Confirmation After Plaid Success */}
          {bankAccountVerified && bankAccountInfo && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                ✓ Bank Account Verified
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-green-800">
                  <strong>Routing Number:</strong> {bankAccountInfo.routingNumber}
                </p>
                <p className="text-green-800">
                  <strong>Account Number:</strong> {bankAccountInfo.accountNumber}
                </p>
                <p className="text-green-700 mt-3">
                  Please review the account information above and click "Complete Payment" to process your order.
                </p>
              </div>
            </div>
          )}

          {/* Complete Payment Button (after verification) */}
          {bankAccountVerified && (
            <button
              type="button"
              onClick={handleProcessPayment}
              disabled={isProcessing}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing Payment..." : "Complete Payment"}
            </button>
          )}
        </>
      )}

      {paymentError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{paymentError}</p>
        </div>
      )}
    </form>
  );
}
