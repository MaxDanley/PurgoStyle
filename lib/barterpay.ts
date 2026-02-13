/**
 * BarterPay API Integration
 * Documentation: https://docs.getbarterpay.com/api/transaction-endpoints
 */

import crypto from "crypto";

const BARTERPAY_API_KEY = process.env.BARTERPAY_API_KEY || "";
const BARTERPAY_API_URL = process.env.BARTERPAY_API_URL || "https://test-api.getbarterpay.com";

export interface BarterPayTransactionRequest {
  TransactionId: string;
  Currency: string;
  Amount: number;
}

export interface BarterPayTransactionResponse {
  transactionIndex: string;
  redirectUrl: string;
  statusCode: number;
  message: string[];
}

export interface BarterPayTransactionStatusResponse {
  externalTransactionInd: string;
  transactionIndex: string;
  transactionAmount: number;
  transactionStatus: string;
  statusCode: number;
  message: string[];
}

export interface BarterPayCallbackData {
  data: {
    ExternalTransactionId: string;
    TransactionIndex: string;
    TransactionAmount: number;
    TransactionStatus: string;
  };
  signature: string;
}

async function barterPayApiCall(endpoint: string, options: RequestInit = {}) {
  // Validate API key is set
  if (!BARTERPAY_API_KEY || BARTERPAY_API_KEY.trim() === "") {
    throw new Error("BARTERPAY_API_KEY environment variable is not set or is empty");
  }

  const headers: Record<string, string> = {
    "X-SAO-Token": BARTERPAY_API_KEY,
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  console.log("🔑 BarterPay API Call:", {
    url: `${BARTERPAY_API_URL}${endpoint}`,
    method: options.method || "GET",
    hasApiKey: !!BARTERPAY_API_KEY,
    apiKeyLength: BARTERPAY_API_KEY.length,
    apiKeyPrefix: BARTERPAY_API_KEY.substring(0, 4) + "...",
  });

  const response = await fetch(`${BARTERPAY_API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: [errorText] };
    }
    
    console.error("❌ BarterPay API Error:", {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
    });
    
    throw new Error(
      errorData.message?.join?.(", ") || 
      errorData.message || 
      `BarterPay API error: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
}

/**
 * Create a BarterPay transaction
 */
export async function createBarterPayTransaction(
  transactionRequest: BarterPayTransactionRequest
): Promise<BarterPayTransactionResponse> {
  return barterPayApiCall("/api/pay/m-api/add-in-deposit-queue", {
    method: "POST",
    body: JSON.stringify(transactionRequest),
  });
}

/**
 * Check BarterPay transaction status
 */
export async function getBarterPayTransactionStatus(
  transactionIndex: string
): Promise<BarterPayTransactionStatusResponse> {
  return barterPayApiCall(`/api/pay/m-api/check-transaction-status?TransactionIndex=${transactionIndex}`);
}

/**
 * Cancel/Delete a BarterPay transaction
 */
export async function cancelBarterPayTransaction(
  transactionIndex: string
): Promise<{ statusCode: number; message: string[] }> {
  return barterPayApiCall("/api/pay/m-api/cancel-transaction-queue", {
    method: "POST",
    body: JSON.stringify({ TransactionIndex: transactionIndex }),
  });
}

/**
 * Verify BarterPay callback signature
 * Signature is SHA512 hash of (data object + API key)
 * Can be either hex or base64 encoded
 */
export function verifyBarterPaySignature(
  data: BarterPayCallbackData["data"],
  signature: string
): boolean {
  if (!BARTERPAY_API_KEY) {
    console.warn("BARTERPAY_API_KEY not set - skipping signature verification");
    return true; // Allow in development
  }
  
  // Sort data object keys and stringify
  // Include all fields from the data object (including TransactionDetails if present)
  const sortedData = Object.keys(data)
    .sort()
    .reduce((acc: Record<string, any>, key: string) => {
      acc[key] = (data as Record<string, any>)[key];
      return acc;
    }, {} as Record<string, any>);
  
  const dataString = JSON.stringify(sortedData);
  const dataWithKey = dataString + BARTERPAY_API_KEY;
  
  // Try both hex and base64 encodings (need separate hash objects)
  const computedSignatureHex = crypto
    .createHash("sha512")
    .update(dataWithKey)
    .digest("hex");
  const computedSignatureBase64 = crypto
    .createHash("sha512")
    .update(dataWithKey)
    .digest("base64");
  
  // Log for debugging
  console.log("🔐 Signature verification:", {
    received: signature.substring(0, 20) + "...",
    computedHex: computedSignatureHex.substring(0, 20) + "...",
    computedBase64: computedSignatureBase64.substring(0, 20) + "...",
    dataString: dataString.substring(0, 100) + "...",
  });
  
  // Check both formats
  return computedSignatureHex === signature || computedSignatureBase64 === signature;
}

/**
 * Map BarterPay transaction status to our PaymentStatus
 */
export function mapBarterPayStatus(status: string): "PENDING" | "PAID" | "FAILED" {
  switch (status.toLowerCase()) {
    case "success":
    case "completed":
      return "PAID";
    case "failed":
    case "cancelled":
    case "expired":
      return "FAILED";
    case "init":
    case "pending":
    case "processing":
    default:
      return "PENDING";
  }
}

