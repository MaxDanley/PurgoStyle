import { NextResponse } from "next/server";
import { createNOWPaymentsPayment } from "@/lib/nowpayments";

export async function POST(req: Request) {
  try {
    const {
      amount,
      orderId,
      orderDescription,
      successUrl,
      cancelUrl,
      payCurrency,
    } = await req.json();

    if (!amount || !orderId) {
      return NextResponse.json(
        { error: "Something went wrong. Please try again shortly or contact support" },
        { status: 400 }
      );
    }

    // Get base URL for callbacks
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : "http://localhost:3000";

    // Create payment with NOWPayments
    const payment = await createNOWPaymentsPayment({
      price_amount: amount,
      price_currency: "usd",
      pay_currency: payCurrency, // Optional: let user choose or auto-select
      order_id: orderId,
      order_description: orderDescription || `Order ${orderId}`,
      ipn_callback_url: `${baseUrl}/api/webhooks/nowpayments`,
      success_url: successUrl || `${baseUrl}/order-confirmation?payment_id=${orderId}`,
      cancel_url: cancelUrl || `${baseUrl}/checkout?canceled=true`,
    });

    return NextResponse.json({
      success: true,
      payment: {
        paymentId: payment.payment_id,
        paymentStatus: payment.payment_status,
        payAddress: payment.pay_address,
        payAmount: payment.pay_amount,
        payCurrency: payment.pay_currency,
        priceAmount: payment.price_amount,
        priceCurrency: payment.price_currency,
        expirationDate: payment.expiration_estimate_date,
        timeLimit: payment.time_limit,
      },
    });
  } catch (error: any) {
    console.error("NOWPayments payment creation error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again shortly or contact support" },
      { status: 500 }
    );
  }
}

