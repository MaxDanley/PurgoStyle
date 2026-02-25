import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://summersteez.com";
const VALID_CURRENCIES = ["usd", "eur", "gbp", "cad", "aud"] as const;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

function sanitizeString(s: string | null | undefined, maxLen: number): string {
  if (s == null || typeof s !== "string") return "";
  return s.trim().slice(0, maxLen);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const amountRaw = searchParams.get("amount");
  const currencyRaw = (searchParams.get("currency") || "usd").toLowerCase().trim();
  const ref = sanitizeString(searchParams.get("ref"), 255);
  const email = sanitizeString(searchParams.get("email"), 254).toLowerCase();
  const name = sanitizeString(searchParams.get("name"), 200);

  const amount = amountRaw ? parseInt(amountRaw, 10) : NaN;
  if (!Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount. Must be a positive integer." }, { status: 400 });
  }

  if (!VALID_CURRENCIES.includes(currencyRaw as (typeof VALID_CURRENCIES)[number])) {
    return NextResponse.json({ error: "Invalid currency." }, { status: 400 });
  }

  if (!ref) {
    return NextResponse.json({ error: "Missing ref." }, { status: 400 });
  }

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  if (!name) {
    return NextResponse.json({ error: "Missing name." }, { status: 400 });
  }

  try {
    const totalDollars = amount / 100;
    const shippingInsurance = 3.5;
    const subtotalDollars = Math.max(0, totalDollars - shippingInsurance);
    const orderNumber = `PL-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        status: "PENDING",
        subtotal: subtotalDollars,
        shippingInsurance,
        shippingCost: 0,
        total: totalDollars,
        paymentMethod: "CREDIT_CARD",
        paymentStatus: "PENDING",
        email,
        externalReference: ref,
        statusHistory: {
          create: {
            status: "PENDING",
            note: "Order created via launch-checkout redirect.",
          },
        },
      },
    });

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: currencyRaw,
      line_items: [
        {
          price_data: {
            currency: currencyRaw,
            product_data: { name: name || "Order" },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      client_reference_id: order.id,
      customer_email: email,
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    const checkoutUrl = session.url;
    if (!checkoutUrl) {
      return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 });
    }

    return NextResponse.redirect(checkoutUrl, 303);
  } catch (e: any) {
    console.error("launch-checkout error:", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
