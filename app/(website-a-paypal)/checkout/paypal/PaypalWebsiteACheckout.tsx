"use client";

import { capturePayPalCheckoutOrder } from "@/lib/paypal-checkout-client";
import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";

type PayPalButtons = {
  Buttons: (opts: {
    style?: Record<string, string>;
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onError?: (err: unknown) => void;
    onCancel?: () => void;
  }) => { render: (el: HTMLElement) => void };
};

type PayPalApplePay = {
  config: () => Promise<{
    isEligible: boolean;
    countryCode: string;
    currencyCode?: string;
    merchantCapabilities: string[];
    supportedNetworks: string[];
  }>;
  validateMerchant: (opts: {
    validationUrl: string;
    displayName?: string;
  }) => Promise<{ merchantSession: unknown }>;
  confirmOrder: (opts: {
    orderId: string;
    token: unknown;
    billingContact?: unknown;
    shippingContact?: unknown;
  }) => Promise<unknown>;
};

type PayPalGooglePay = {
  config: () => Promise<{
    allowedPaymentMethods: unknown[];
    merchantInfo: unknown;
    apiVersion: number;
    apiVersionMinor: number;
    countryCode: string;
  }>;
  confirmOrder: (opts: {
    orderId: string;
    paymentMethodData: unknown;
  }) => Promise<{ status: string }>;
  initiatePayerAction: (opts: { orderId: string }) => Promise<unknown>;
};

type PayPalNamespace = PayPalButtons & {
  Applepay?: () => PayPalApplePay;
  Googlepay?: () => PayPalGooglePay;
};

declare global {
  interface Window {
    paypal?: PayPalNamespace;
    ApplePaySession?: {
      new (version: number, request: unknown): ApplePaySessionInstance;
      supportsVersion: (version: number) => boolean;
      canMakePayments: () => boolean;
      STATUS_SUCCESS: number;
      STATUS_FAILURE: number;
    };
    google?: {
      payments: {
        api: {
          PaymentsClient: new (opts: {
            environment: "TEST" | "PRODUCTION";
            paymentDataCallbacks: {
              onPaymentAuthorized: (paymentData: GooglePaymentData) => Promise<{
                transactionState: "SUCCESS" | "ERROR";
                error?: { message: string };
              }>;
            };
          }) => GooglePaymentsClient;
        };
      };
    };
  }
}

interface ApplePaySessionInstance {
  onvalidatemerchant: ((event: { validationURL: string }) => void) | null;
  onpaymentmethodselected: (() => void) | null;
  onpaymentauthorized: ((event: { payment: { token: unknown; billingContact?: unknown; shippingContact?: unknown } }) => void) | null;
  oncancel: (() => void) | null;
  completeMerchantValidation: (merchantSession: unknown) => void;
  completePaymentMethodSelection: (update: { newTotal: unknown }) => void;
  completePayment: (result: { status: number }) => void;
  abort: () => void;
  begin: () => void;
}

interface GooglePaymentData {
  paymentMethodData: unknown;
}

interface GooglePaymentsClient {
  isReadyToPay: (request: {
    allowedPaymentMethods: unknown[];
    apiVersion: number;
    apiVersionMinor: number;
  }) => Promise<{ result: boolean }>;
  createButton: (opts: { onClick: () => void }) => HTMLElement;
  loadPaymentData: (request: unknown) => Promise<GooglePaymentData>;
}

interface Props {
  paypalClientId: string;
  paypalOrderId: string;
  internalOrderId: string;
  currency: string;
  /** Decimal string, e.g. "49.99" */
  amount: string;
  /** Google Pay PaymentsClient environment */
  googlePayEnvironment: "TEST" | "PRODUCTION";
  websiteACancelUrl: string;
}

export default function PaypalWebsiteACheckout({
  paypalClientId,
  paypalOrderId,
  internalOrderId,
  currency,
  amount,
  googlePayEnvironment,
  websiteACancelUrl,
}: Props) {
  const buttonsRef = useRef<HTMLDivElement>(null);
  const appleRef = useRef<HTMLDivElement>(null);
  const googleRef = useRef<HTMLDivElement>(null);
  const buttonsRenderedRef = useRef(false);
  const [paypalSdkReady, setPaypalSdkReady] = useState(false);
  const [appleSdkReady, setAppleSdkReady] = useState(false);
  const [googleSdkReady, setGoogleSdkReady] = useState(false);

  const paypalOrderIdRef = useRef(paypalOrderId);
  const internalOrderIdRef = useRef(internalOrderId);
  paypalOrderIdRef.current = paypalOrderId;
  internalOrderIdRef.current = internalOrderId;

  const sdkSrc = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
    paypalClientId
  )}&currency=${encodeURIComponent(
    currency
  )}&intent=capture&components=buttons,applepay,googlepay&disable-funding=venmo,paylater,credit`;

  const finishCheckout = useCallback(async () => {
    const { redirectUrl } = await capturePayPalCheckoutOrder({
      internalOrderId: internalOrderIdRef.current,
      paypalOrderId: paypalOrderIdRef.current,
    });
    window.location.href = redirectUrl;
  }, []);

  const handleCheckoutError = useCallback((err: unknown) => {
    console.error(err);
    alert("Payment could not be completed. Please try again.");
  }, []);

  const clearWalletContainers = useCallback(() => {
    buttonsRenderedRef.current = false;
    if (buttonsRef.current) buttonsRef.current.innerHTML = "";
    if (appleRef.current) appleRef.current.innerHTML = "";
    if (googleRef.current) googleRef.current.innerHTML = "";
  }, []);

  useEffect(() => {
    clearWalletContainers();
  }, [paypalOrderId, clearWalletContainers]);

  // PayPal Smart Buttons
  useEffect(() => {
    if (!paypalSdkReady || !buttonsRef.current || buttonsRenderedRef.current || !window.paypal?.Buttons) {
      return;
    }
    buttonsRenderedRef.current = true;

    window.paypal
      .Buttons({
        style: {
          layout: "vertical",
          shape: "rect",
          label: "paypal",
          color: "gold",
        },
        createOrder: async () => paypalOrderIdRef.current,
        onApprove: async () => {
          try {
            await finishCheckout();
          } catch (err) {
            handleCheckoutError(err);
          }
        },
        onError: handleCheckoutError,
        onCancel: () => {
          window.location.href = websiteACancelUrl;
        },
      })
      .render(buttonsRef.current);
  }, [paypalSdkReady, paypalOrderId, finishCheckout, handleCheckoutError, websiteACancelUrl]);

  // Apple Pay
  useEffect(() => {
    if (!paypalSdkReady || !appleSdkReady || !appleRef.current || !window.paypal?.Applepay) {
      return;
    }

    const ApplePaySession = window.ApplePaySession;
    if (!ApplePaySession?.supportsVersion(4) || !ApplePaySession.canMakePayments()) {
      return;
    }

    let cancelled = false;
    const container = appleRef.current;

    async function setupApplePay() {
      const applepay = window.paypal!.Applepay!();
      const config = await applepay.config();
      if (cancelled || !config.isEligible) return;

      container.innerHTML =
        '<apple-pay-button id="paypal-applepay-btn" buttonstyle="black" type="buy" locale="en"></apple-pay-button>';

      const btn = document.getElementById("paypal-applepay-btn");
      if (!btn || cancelled) return;

      const onClick = () => {
        const paymentRequest = {
          countryCode: config.countryCode,
          currencyCode: currency,
          merchantCapabilities: config.merchantCapabilities,
          supportedNetworks: config.supportedNetworks,
          requiredBillingContactFields: ["name", "email", "postalAddress"],
          requiredShippingContactFields: [] as string[],
          total: {
            label: "Total",
            amount,
            type: "final",
          },
        };

        const session = new ApplePaySession!(4, paymentRequest);

        session.onvalidatemerchant = (event) => {
          applepay
            .validateMerchant({
              validationUrl: event.validationURL,
              displayName: "Purgo Labs",
            })
            .then((payload) => {
              session.completeMerchantValidation(payload.merchantSession);
            })
            .catch((err) => {
              console.error(err);
              session.abort();
            });
        };

        session.onpaymentmethodselected = () => {
          session.completePaymentMethodSelection({ newTotal: paymentRequest.total });
        };

        session.onpaymentauthorized = async (event) => {
          try {
            await applepay.confirmOrder({
              orderId: paypalOrderIdRef.current,
              token: event.payment.token,
              billingContact: event.payment.billingContact,
              shippingContact: event.payment.shippingContact,
            });
            session.completePayment({ status: ApplePaySession!.STATUS_SUCCESS });
            await finishCheckout();
          } catch (err) {
            console.error(err);
            session.completePayment({ status: ApplePaySession!.STATUS_FAILURE });
            handleCheckoutError(err);
          }
        };

        session.oncancel = () => {
          /* buyer closed sheet */
        };

        session.begin();
      };

      btn.addEventListener("click", onClick);
    }

    setupApplePay().catch((err) => {
      console.error("[apple pay setup]", err);
    });

    return () => {
      cancelled = true;
      container.innerHTML = "";
    };
  }, [
    paypalSdkReady,
    appleSdkReady,
    paypalOrderId,
    currency,
    amount,
    finishCheckout,
    handleCheckoutError,
  ]);

  // Google Pay
  useEffect(() => {
    if (!paypalSdkReady || !googleSdkReady || !googleRef.current || !window.paypal?.Googlepay) {
      return;
    }
    if (!window.google?.payments?.api) return;

    let cancelled = false;
    const container = googleRef.current;

    async function processGooglePayment(paymentData: GooglePaymentData) {
      const googlepay = window.paypal!.Googlepay!();
      const orderId = paypalOrderIdRef.current;

      const { status } = await googlepay.confirmOrder({
        orderId,
        paymentMethodData: paymentData.paymentMethodData,
      });

      if (status === "PAYER_ACTION_REQUIRED") {
        await googlepay.initiatePayerAction({ orderId });
      }

      await finishCheckout();
      return { transactionState: "SUCCESS" as const };
    }

    async function setupGooglePay() {
      const googlepay = window.paypal!.Googlepay!();
      const googlePayConfig = await googlepay.config();
      if (cancelled) return;

      const paymentsClient = new window.google!.payments.api.PaymentsClient({
        environment: googlePayEnvironment,
        paymentDataCallbacks: {
          onPaymentAuthorized: (paymentData) =>
            processGooglePayment(paymentData)
              .then(() => ({ transactionState: "SUCCESS" as const }))
              .catch((err: unknown) => {
                handleCheckoutError(err);
                return {
                  transactionState: "ERROR" as const,
                  error: {
                    message: err instanceof Error ? err.message : "Payment failed",
                  },
                };
              }),
        },
      });

      const ready = await paymentsClient.isReadyToPay({
        allowedPaymentMethods: googlePayConfig.allowedPaymentMethods,
        apiVersion: googlePayConfig.apiVersion,
        apiVersionMinor: googlePayConfig.apiVersionMinor,
      });

      if (cancelled || !ready.result) return;

      const button = paymentsClient.createButton({
        onClick: async () => {
          try {
            const paymentDataRequest = {
              apiVersion: googlePayConfig.apiVersion,
              apiVersionMinor: googlePayConfig.apiVersionMinor,
              allowedPaymentMethods: googlePayConfig.allowedPaymentMethods,
              merchantInfo: googlePayConfig.merchantInfo,
              transactionInfo: {
                countryCode: googlePayConfig.countryCode,
                currencyCode: currency,
                totalPriceStatus: "FINAL",
                totalPrice: amount,
                totalPriceLabel: "Total",
              },
              callbackIntents: ["PAYMENT_AUTHORIZATION"],
            };
            await paymentsClient.loadPaymentData(paymentDataRequest);
          } catch (err) {
            if (err && typeof err === "object" && "statusCode" in err && (err as { statusCode: string }).statusCode === "CANCELED") {
              return;
            }
            handleCheckoutError(err);
          }
        },
      });

      if (!cancelled) {
        container.appendChild(button);
      }
    }

    setupGooglePay().catch((err) => {
      console.error("[google pay setup]", err);
    });

    return () => {
      cancelled = true;
      container.innerHTML = "";
    };
  }, [
    paypalSdkReady,
    googleSdkReady,
    paypalOrderId,
    currency,
    amount,
    googlePayEnvironment,
    finishCheckout,
    handleCheckoutError,
  ]);

  const scriptsLoading = !paypalSdkReady || !appleSdkReady || !googleSdkReady;

  return (
    <>
      <Script
        src={sdkSrc}
        strategy="afterInteractive"
        onLoad={() => setPaypalSdkReady(true)}
      />
      <Script
        src="https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js"
        strategy="afterInteractive"
        onLoad={() => setAppleSdkReady(true)}
      />
      <Script
        src="https://pay.google.com/gp/p/js/pay.js"
        strategy="afterInteractive"
        onLoad={() => setGoogleSdkReady(true)}
      />

      <div className="flex flex-col gap-3 w-full">
        <div ref={appleRef} className="min-h-0 flex justify-center [&:empty]:hidden" />
        <div ref={googleRef} className="min-h-0 flex justify-center [&:empty]:hidden" />
        <div ref={buttonsRef} className="min-h-[120px] flex flex-col items-center justify-center" />
      </div>

      {scriptsLoading && (
        <p className="text-center text-sm text-gray-400 mt-4">Loading payment options…</p>
      )}
    </>
  );
}
