/** Browser-side capture after PayPal / Apple Pay / Google Pay approval. */
export async function capturePayPalCheckoutOrder(params: {
  internalOrderId: string;
  paypalOrderId: string;
}): Promise<{ redirectUrl: string }> {
  const res = await fetch("/api/paypal/capture", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      internalOrderId: params.internalOrderId,
      paypalOrderId: params.paypalOrderId,
    }),
  });
  const json = (await res.json()) as { redirectUrl?: string; error?: string };
  if (!res.ok || !json.redirectUrl) {
    throw new Error(json.error || "Payment could not be completed.");
  }
  return { redirectUrl: json.redirectUrl };
}
