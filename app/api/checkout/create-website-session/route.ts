import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { calculatePointsEarned } from "@/lib/rewards";
import { sendOrderNotificationToSupport } from "@/lib/email";
import { validateGuestOrderInfo } from "@/lib/validation";
import { handleCheckoutSubscription } from "@/lib/subscriber-helpers";
import { cookies } from "next/headers";

const CANONICAL_SOURCE = "https://summersteez.com";
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://summersteez.com";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

function normalizeAttribution(attribution: any, initialReferrer: string | undefined) {
  const isOurDomain = (v: string | undefined) =>
    v && (v.includes("summersteez.com") || v.includes("localhost"));
  const out = { ...attribution };
  if (isOurDomain(attribution?.source)) out.source = "summersteez.com";
  if (isOurDomain(initialReferrer))
    return { ...out, initialReferrer: CANONICAL_SOURCE };
  return { ...out, initialReferrer: initialReferrer ?? null };
}

/**
 * Create order + Stripe Checkout Session for website checkout.
 * Success/cancel URLs point to our site only (no external redirects).
 * Does not send payment-link email; webhook handles payment confirmation.
 */
export async function POST(req: Request) {
  try {
    const {
      items,
      shippingInfo,
      billingInfo,
      metadata,
    } = await req.json();

    if (!items?.length) {
      return NextResponse.json(
        { error: "No items in order" },
        { status: 400 }
      );
    }

    let validatedInfo;
    try {
      validatedInfo = validateGuestOrderInfo(shippingInfo, metadata);
    } catch (validationError: any) {
      return NextResponse.json(
        { error: validationError.message || "Invalid order information. Please check your name and email." },
        { status: 400 }
      );
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    const shippingInsurance = 3.50;
    const shippingCost = metadata.shippingCost || 0;
    const pointsEarned = calculatePointsEarned(subtotal);
    const discountAmount = metadata.discountAmount || 0;
    const total = subtotal + shippingInsurance + shippingCost - discountAmount;

    const orderNumber = `PL-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    let shippingAddress;
    if (metadata.userId && shippingInfo.addressId) {
      shippingAddress = await prisma.address.findUnique({
        where: { id: shippingInfo.addressId },
      });
      if (!shippingAddress) {
        shippingAddress = await prisma.address.create({
          data: {
            userId: metadata.userId,
            name: shippingInfo.name,
            street: shippingInfo.street,
            apartment: shippingInfo.apartment || null,
            city: shippingInfo.city,
            state: shippingInfo.state,
            zipCode: shippingInfo.zipCode,
            country: shippingInfo.country || "US",
            phone: shippingInfo.phone,
            isDefault: false,
          },
        });
      }
    } else if (metadata.userId) {
      const existingAddress = await prisma.address.findFirst({
        where: {
          userId: metadata.userId,
          street: shippingInfo.street,
          apartment: shippingInfo.apartment || null,
          city: shippingInfo.city,
          state: shippingInfo.state,
          zipCode: shippingInfo.zipCode,
        },
      });
      shippingAddress = existingAddress ?? await prisma.address.create({
        data: {
          userId: metadata.userId,
          name: shippingInfo.name,
          street: shippingInfo.street,
          apartment: shippingInfo.apartment || null,
          city: shippingInfo.city,
          state: shippingInfo.state,
          zipCode: shippingInfo.zipCode,
          country: shippingInfo.country || "US",
          phone: shippingInfo.phone,
          isDefault: false,
        },
      });
    } else {
      shippingAddress = await prisma.address.create({
        data: {
          userId: undefined,
          name: shippingInfo.name,
          street: shippingInfo.street,
          apartment: shippingInfo.apartment || null,
          city: shippingInfo.city,
          state: shippingInfo.state,
          zipCode: shippingInfo.zipCode,
          country: shippingInfo.country || "US",
          phone: shippingInfo.phone,
          isDefault: false,
        },
      });
    }

    let affiliateId: string | undefined;
    if (metadata.affiliateRef) {
      const affiliate = await prisma.affiliate.findFirst({
        where: { discountCode: metadata.affiliateRef.toUpperCase(), isActive: true },
      });
      if (affiliate) {
        affiliateId = affiliate.id;
        await prisma.affiliate.update({
          where: { id: affiliate.id },
          data: { usageCount: { increment: 1 } },
        });
      }
    }
    const discountCodeUpper = metadata.discountCode?.toUpperCase();
    const affiliateRefUpper = metadata.affiliateRef?.toUpperCase();
    if (!affiliateId && discountCodeUpper && discountCodeUpper !== affiliateRefUpper) {
      const affiliate = await prisma.affiliate.findFirst({
        where: { discountCode: discountCodeUpper, isActive: true },
      });
      if (affiliate) {
        affiliateId = affiliate.id;
        await prisma.affiliateClick.create({
          data: { affiliateId: affiliate.id, source: "discount_code" },
        });
        await prisma.affiliate.update({
          where: { id: affiliate.id },
          data: { usageCount: { increment: 1 } },
        });
      }
    }

    const cookieStore = await cookies();
    const attributionCookie = cookieStore.get("summersteez_attribution");
    const initialReferrerCookie = cookieStore.get("summersteez_initial_referrer");
    let attributionData: any = {};
    if (attributionCookie) {
      try {
        attributionData = JSON.parse(attributionCookie.value);
      } catch {
        // ignore
      }
    }
    const normalized = normalizeAttribution(
      attributionData,
      initialReferrerCookie?.value
    );

    const order = await prisma.order.create({
      data: {
        userId: metadata.userId || undefined,
        email: validatedInfo.email,
        orderNumber,
        status: "PENDING",
        subtotal,
        shippingInsurance,
        shippingCost,
        pointsEarned,
        total,
        shippingAddressId: shippingAddress.id,
        phone: shippingInfo.phone?.trim() || shippingAddress.phone || undefined,
        paymentMethod: "CREDIT_CARD",
        paymentStatus: "PENDING",
        shippingMethod: (metadata.shippingMethod as string) || "ground",
        affiliateId,
        attributionSource: normalized.source ?? attributionData.source,
        attributionMedium: normalized.source === "summersteez.com" ? "direct" : attributionData.medium,
        attributionCampaign: attributionData.campaign,
        attributionContent: attributionData.content,
        attributionTerm: attributionData.term,
        initialReferrer: normalized.initialReferrer ?? undefined,
        smsOptIn: metadata.smsOptIn === true,
        statusHistory: {
          create: {
            status: "PENDING",
            note: "Order created via website Stripe Checkout. Awaiting payment.",
          },
        },
      },
    });

    if (metadata.userId && metadata.smsOptIn === true) {
      await prisma.user.update({
        where: { id: metadata.userId },
        data: { smsOptIn: true },
      });
    }

    for (const item of items) {
      try {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
            isBackorder: item.isBackorder || false,
          },
        });
      } catch (error) {
        console.error(`Failed to create order item for product ${item.productId}:`, error);
      }
    }

    const orderWithItems = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: { include: { product: true, variant: true } },
        shippingAddress: true,
      },
    });

    if (metadata.subscribeToPromotions) {
      await handleCheckoutSubscription(
        validatedInfo.email,
        metadata.userId || null,
        shippingInfo.firstName || shippingInfo.name?.split(" ")[0],
        shippingInfo.lastName || shippingInfo.name?.split(" ").slice(1).join(" "),
        !metadata.userId
      );
    }

    const currency = "usd";
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      ...items.map((item: any) => ({
        price_data: {
          currency,
          product_data: {
            name: item.productName || `Product ${item.productId}`,
            images: item.image ? [item.image.startsWith("http") ? item.image : `${baseUrl}${item.image.startsWith("/") ? "" : "/"}${item.image}`] : undefined,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      {
        price_data: {
          currency,
          product_data: { name: "Shipping & insurance" },
          unit_amount: Math.round((shippingInsurance + shippingCost) * 100),
        },
        quantity: 1,
      },
    ];
    if (discountAmount > 0) {
      lineItems.push({
        price_data: {
          currency,
          product_data: { name: "Discount" },
          unit_amount: -Math.round(discountAmount * 100),
        },
        quantity: 1,
      });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency,
      line_items: lineItems,
      client_reference_id: order.id,
      customer_email: validatedInfo.email || undefined,
      success_url: `${baseUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout`,
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

    if (orderWithItems && orderWithItems.shippingAddress) {
      try {
        await sendOrderNotificationToSupport(order.orderNumber, {
          customerName: shippingInfo.name,
          customerEmail: validatedInfo.email,
          customerPhone: shippingInfo.phone,
          paymentMethod: "CREDIT_CARD",
          paymentStatus: "PENDING",
          subtotal,
          shippingInsurance,
          shippingCost,
          total,
          items: orderWithItems.items.map((item) => ({
            productName: item.product.name,
            variantSize: item.variant.size,
            quantity: item.quantity,
            price: item.price,
          })),
          shippingAddress: {
            name: orderWithItems.shippingAddress.name,
            street: orderWithItems.shippingAddress.street,
            city: orderWithItems.shippingAddress.city,
            state: orderWithItems.shippingAddress.state,
            zipCode: orderWithItems.shippingAddress.zipCode,
            country: orderWithItems.shippingAddress.country || "US",
            phone: orderWithItems.shippingAddress.phone || undefined,
          },
          userId: metadata.userId || undefined,
          isGuest: !metadata.userId,
        });
      } catch (emailError) {
        console.error("Failed to send support notification:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      checkoutUrl,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
      },
    });
  } catch (error: any) {
    console.error("create-website-session error:", error);
    return NextResponse.json(
      { error: error?.message || "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
