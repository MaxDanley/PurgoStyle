/**
 * NOWPayments API Integration
 * Documentation: https://documenter.getpostman.com/view/7907941/2s93JusNJt
 */

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || "XM631CN-ACF4CYB-JME80YQ-ZPTE4RB";
const NOWPAYMENTS_API_URL = "https://api.nowpayments.io/v1";

export interface NOWPaymentsPaymentRequest {
  price_amount: number;
  price_currency: string;
  pay_currency?: string; // Optional: specific crypto currency
  order_id?: string;
  order_description?: string;
  ipn_callback_url?: string;
  success_url?: string;
  cancel_url?: string;
}

export interface NOWPaymentsPaymentResponse {
  payment_id: number;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid?: number;
  pay_currency: string;
  order_id?: string;
  order_description?: string;
  purchase_id?: string;
  outcome_amount?: number;
  outcome_currency?: string;
  payin_extra_id?: string;
  smart_contract?: string;
  network?: string;
  network_precision?: number;
  time_limit?: number;
  burning_percent?: string;
  expiration_estimate_date?: string;
  payment_extra_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NOWPaymentsPaymentStatus {
  payment_id: number;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  outcome_amount: number;
  outcome_currency: string;
  payin_extra_id?: string;
  smart_contract?: string;
  network?: string;
  order_id?: string;
  order_description?: string;
  purchase_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create a payment request with NOWPayments
 */
export async function createNOWPaymentsPayment(
  request: NOWPaymentsPaymentRequest
): Promise<NOWPaymentsPaymentResponse> {
  const response = await fetch(`${NOWPAYMENTS_API_URL}/payment`, {
    method: "POST",
    headers: {
      "x-api-key": NOWPAYMENTS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(`NOWPayments API error: ${error.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Get payment status from NOWPayments
 */
export async function getNOWPaymentsPaymentStatus(
  paymentId: number
): Promise<NOWPaymentsPaymentStatus> {
  const response = await fetch(`${NOWPAYMENTS_API_URL}/payment/${paymentId}`, {
    method: "GET",
    headers: {
      "x-api-key": NOWPAYMENTS_API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(`NOWPayments API error: ${error.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Get available cryptocurrencies
 */
export async function getAvailableCurrencies(): Promise<string[]> {
  const response = await fetch(`${NOWPAYMENTS_API_URL}/currencies`, {
    method: "GET",
    headers: {
      "x-api-key": NOWPAYMENTS_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch currencies: ${response.statusText}`);
  }

  const data = await response.json();
  return data.currencies || [];
}

/**
 * Get estimated price in cryptocurrency
 */
export async function getEstimatedPrice(
  amount: number,
  currencyFrom: string = "usd",
  currencyTo: string
): Promise<number> {
  const response = await fetch(
    `${NOWPAYMENTS_API_URL}/estimate?amount=${amount}&currency_from=${currencyFrom}&currency_to=${currencyTo}`,
    {
      method: "GET",
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get estimated price: ${response.statusText}`);
  }

  const data = await response.json();
  return data.estimated_amount || 0;
}

/**
 * Map NOWPayments payment status to our PaymentStatus enum
 */
export function mapPaymentStatus(npStatus: string): "PENDING" | "PAID" | "FAILED" {
  switch (npStatus.toLowerCase()) {
    case "finished":
    case "confirmed":
      return "PAID";
    case "failed":
    case "expired":
    case "refunded":
      return "FAILED";
    default:
      return "PENDING";
  }
}

