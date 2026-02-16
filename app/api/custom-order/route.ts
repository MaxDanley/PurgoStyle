import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const CUSTOM_PRODUCT_SLUGS = ["custom-tee", "custom-tshirt", "custom-t-shirt"];
const FALLBACK_PRICE = 29.99;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://summersteez.com";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

/**
 * Create a custom design order in the backend and a Stripe Checkout session.
 * Line item name in Stripe is "Custom Order". Does NOT touch Website A API.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shippingInfo, design } = body;

    if (!shippingInfo?.name?.trim() || !shippingInfo?.email?.trim() || !shippingInfo?.street?.trim() || !shippingInfo?.city?.trim() || !shippingInfo?.state?.trim() || !shippingInfo?.zipCode?.trim()) {
      return NextResponse.json(
        { error: "Please fill in all required shipping fields." },
        { status: 400 }
      );
    }

    if (!design?.quantity || design.quantity < 1) {
      return NextResponse.json(
        { error: "Invalid quantity." },
        { status: 400 }
      );
    }

    const quantity = Math.min(99, Math.max(1, Number(design.quantity)));
    const size = design.size || "M";

    const productWithVariants = await (async () => {
      if (design.productId) {
        const p = await prisma.product.findFirst({
          where: { id: design.productId, active: true },
          include: { variants: { where: { active: true }, orderBy: { price: "asc" }, take: 1 } },
        });
        if (p?.variants?.length) return p;
      }
      if (design.productSlug) {
        const p = await prisma.product.findFirst({
          where: { slug: design.productSlug, active: true },
          include: { variants: { where: { active: true }, orderBy: { price: "asc" }, take: 1 } },
        });
        if (p?.variants?.length) return p;
      }
      const p = await prisma.product.findFirst({
        where: { slug: { in: CUSTOM_PRODUCT_SLUGS }, active: true },
        include: { variants: { where: { active: true }, orderBy: { price: "asc" }, take: 1 } },
      });
      if (p?.variants?.length) return p;
      return await prisma.product.findFirst({
        where: { active: true },
        include: { variants: { where: { active: true }, orderBy: { price: "asc" }, take: 1 } },
      });
    })();

    if (!productWithVariants || productWithVariants.variants.length === 0) {
      return NextResponse.json(
        { error: "No product available for custom orders. Please add a product (e.g. slug custom-tee) with at least one variant." },
        { status: 503 }
      );
    }

    const product = productWithVariants;
    const variant = product.variants[0];
    const unitPrice = variant.price ?? FALLBACK_PRICE;
    const subtotal = unitPrice * quantity;
    const shippingInsurance = 3.5;
    const total = subtotal + shippingInsurance;

    const address = await prisma.address.create({
      data: {
        userId: undefined,
        name: shippingInfo.name.trim(),
        street: shippingInfo.street.trim(),
        apartment: shippingInfo.apartment?.trim() || null,
        city: shippingInfo.city.trim(),
        state: shippingInfo.state.trim(),
        zipCode: shippingInfo.zipCode.trim(),
        country: shippingInfo.country?.trim() || "US",
        phone: shippingInfo.phone?.trim() || null,
        isDefault: false,
      },
    });

    const orderNumber = `PL-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        userId: undefined,
        email: shippingInfo.email.trim(),
        orderNumber,
        status: "PENDING",
        subtotal,
        shippingInsurance,
        shippingCost: 0,
        total,
        shippingAddressId: address.id,
        phone: shippingInfo.phone?.trim() || null,
        paymentMethod: "CREDIT_CARD",
        paymentStatus: "PENDING",
        shippingMethod: "ground",
        statusHistory: {
          create: {
            status: "PENDING",
            note: `Custom Design Studio. Design: ${JSON.stringify(design)}`,
          },
        },
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        variantId: variant.id,
        quantity,
        price: unitPrice,
      },
    });

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "usd",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Custom Order" },
            unit_amount: Math.round(total * 100),
          },
          quantity: 1,
        },
      ],
      client_reference_id: order.id,
      customer_email: shippingInfo.email.trim() || undefined,
      success_url: `${baseUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/custom-design/order`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    const checkoutUrl = session.url;
    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Failed to create checkout session." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      redirectUrl: checkoutUrl,
    });
  } catch (e) {
    console.error("Custom order error:", e);
    return NextResponse.json(
      { error: "Failed to create order. Please try again or contact support." },
      { status: 500 }
    );
  }
}
