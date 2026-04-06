import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paypalCreateOrder } from "@/lib/paypal";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://summersteez.com";

/** Validate shared internal secret for Website A → Website B requests */
function validateAuth(req: Request): boolean {
  const secret =
    (process.env.STRIPE_CREATE_SESSION_SECRET || process.env.WEBSITE_B_INTERNAL_SECRET)?.trim();
  if (!secret) return false;

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
  amount?: number;
  line_items?: Array<{ name: string; quantity: number; amount: number }>;
  customer_email?: string;
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
    const currency = (body.currency || "usd").toUpperCase();

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
        paymentMethod: "PAYPAL",
        paymentStatus: "PENDING",
        paymentCurrency: currency,
        email: customerEmail ?? undefined,
        statusHistory: {
          create: {
            status: "PENDING",
            note: "Order created via Website A dynamic checkout. Awaiting PayPal payment.",
          },
        },
      },
    });

    const paypalOrder = await paypalCreateOrder({
      value: totalDollars.toFixed(2),
      currencyCode: currency,
      customId: order.id,
      description: "Custom order",
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { paypalOrderId: paypalOrder.id },
    });

    const checkoutUrl = `${baseUrl}/checkout/paypal?orderId=${encodeURIComponent(order.id)}`;

    return NextResponse.json({
      checkoutUrl,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal server error";
    console.error("create-checkout-session error:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
