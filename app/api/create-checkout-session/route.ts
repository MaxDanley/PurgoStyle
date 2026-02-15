import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://summersteez.com";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

/** Validate shared internal secret for Website A → Website B requests */
function validateAuth(req: Request): boolean {
  const secret = process.env.STRIPE_CREATE_SESSION_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  const token = auth.slice(7).trim();
  return token === secret;
}

/** Request body from Website A */
interface CreateCheckoutBody {
  amount: number; // total in cents
  currency?: string;
  line_items: Array<{ name: string; quantity: number; amount: number }>; // amount per unit in cents
  customer_email?: string;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { Allow: "POST, OPTIONS" } });
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST with Authorization: Bearer <secret>." },
    { status: 405, headers: { Allow: "POST, OPTIONS" } }
  );
}

export async function POST(req: Request) {
  try {
    if (!validateAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateCheckoutBody = await req.json();

    if (
      typeof body.amount !== "number" ||
      body.amount < 50 ||
      !Array.isArray(body.line_items) ||
      body.line_items.length === 0
    ) {
      return NextResponse.json(
        { error: "Invalid request: amount (min 50 cents) and line_items required" },
        { status: 400 }
      );
    }

    const currency = body.currency || "usd";
    const customerEmail = typeof body.customer_email === "string" ? body.customer_email : undefined;

    // Recompute amount from line items for validation
    const computedTotal = body.line_items.reduce(
      (sum: number, item: { quantity: number; amount: number }) =>
        sum + (item.quantity || 0) * (item.amount || 0),
      0
    );
    if (Math.abs(computedTotal - body.amount) > 1) {
      return NextResponse.json(
        { error: "Invalid request: amount must match sum of line items" },
        { status: 400 }
      );
    }

    const orderNumber = `PL-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const totalDollars = body.amount / 100;
    const shippingInsurance = 3.5;
    const subtotalDollars = totalDollars - shippingInsurance;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        status: "PENDING",
        subtotal: Math.max(0, subtotalDollars),
        shippingInsurance,
        shippingCost: 0,
        total: totalDollars,
        paymentMethod: "CREDIT_CARD",
        paymentStatus: "PENDING",
        email: customerEmail ?? undefined,
        statusHistory: {
          create: {
            status: "PENDING",
            note: "Order created via Website A dynamic checkout. Awaiting Stripe payment.",
          },
        },
      },
    });

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency,
      line_items: body.line_items.map((item) => ({
        price_data: {
          currency,
          product_data: { name: item.name },
          unit_amount: item.amount,
        },
        quantity: item.quantity,
      })),
      client_reference_id: order.id,
      metadata: { source: "website_a" },
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel`,
      customer_email: customerEmail || undefined,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    const checkoutUrl = session.url;
    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      checkoutUrl,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
      },
    });
  } catch (e: any) {
    console.error("create-checkout-session error:", e);
    return NextResponse.json(
      { error: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
