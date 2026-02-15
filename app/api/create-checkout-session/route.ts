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
  const secret =
    (process.env.STRIPE_CREATE_SESSION_SECRET || process.env.WEBSITE_B_INTERNAL_SECRET)?.trim();
  if (!secret) return false;

  // Accept Authorization: Bearer <token> or X-Internal-Secret / X-Website-B-Secret (fallback if proxy strips Authorization)
  const authHeader = req.headers.get("Authorization");
  const xSecret = req.headers.get("X-Internal-Secret") || req.headers.get("X-Website-B-Secret");

  const tokenFromAuth =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const token = tokenFromAuth || (xSecret?.trim() ?? "");

  const match = !!token && secret === token;
  if (!match) {
    console.warn("[create-checkout-session] Auth failed:", {
      hasSecret: !!secret,
      hasAuthHeader: !!authHeader,
      hasXSecret: !!xSecret,
      tokenLen: token.length,
      secretLen: secret.length,
    });
  }
  return match;
}

/** Request body - supports both formats */
interface CreateCheckoutBody {
  // Format A: line_items with amount in cents
  amount?: number;
  line_items?: Array<{ name: string; quantity: number; amount: number }>;
  customer_email?: string;
  // Format B: Website A payload (amount in dollars, products array)
  orderId?: string;
  orderNumber?: string;
  products?: Array<{ productId?: string; variantId?: string; quantity: number; unitPrice: number; name?: string }>;
  customer?: { email?: string; name?: string; phone?: string };
  currency?: string;
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
    const currency = (body.currency || "usd").toLowerCase();

    // Normalize to line_items (cents) and customerEmail
    let lineItems: Array<{ name: string; quantity: number; amount: number }>;
    let customerEmail: string | undefined;
    let totalCents: number;

    if (Array.isArray(body.line_items) && body.line_items.length > 0) {
      lineItems = body.line_items;
      totalCents = body.amount ?? lineItems.reduce((s, i) => s + i.quantity * i.amount, 0);
      customerEmail = body.customer_email ?? body.customer?.email;
    } else if (Array.isArray(body.products) && body.products.length > 0 && typeof body.amount === "number") {
      lineItems = body.products.map((p) => ({
        name: p.name ?? `Product ${p.productId ?? p.variantId ?? "Item"}`,
        quantity: p.quantity || 1,
        amount: Math.round((p.unitPrice ?? 0) * 100),
      }));
      totalCents = Math.round(body.amount * 100);
      customerEmail = body.customer?.email ?? body.customer_email;
    } else {
      return NextResponse.json(
        { error: "Invalid request: provide line_items or (products + amount in dollars)" },
        { status: 400 }
      );
    }

    if (totalCents < 50) {
      return NextResponse.json(
        { error: "Invalid request: amount must be at least 50 cents" },
        { status: 400 }
      );
    }

    const orderNumber =
      body.orderNumber ?? `PL-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const totalDollars = totalCents / 100;
    const shippingInsurance = 3.5;
    const subtotalDollars = Math.max(0, totalDollars - shippingInsurance);

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
      line_items: lineItems.map((item) => ({
        price_data: {
          currency,
          product_data: { name: item.name },
          unit_amount: item.amount,
        },
        quantity: item.quantity,
      })),
      client_reference_id: order.id,
      metadata: { source: "website_a" },
      success_url: `${baseUrl}/api/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
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
