import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    const sig = (await headers()).get("stripe-signature");
    if (!sig) {
      return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    }
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (e: any) {
    console.error("Stripe webhook signature verification failed:", e.message);
    return NextResponse.json({ error: `Webhook Error: ${e.message}` }, { status: 400 });
  }

  try {
    const session = event.data.object as Stripe.Checkout.Session;

    const isPaymentComplete =
      event.type === "checkout.session.async_payment_succeeded" ||
      (event.type === "checkout.session.completed" && session.payment_status === "paid");

    if (isPaymentComplete) {
      const orderId = session.client_reference_id as string | null;
      if (!orderId) {
        console.warn("Stripe webhook: no client_reference_id, skipping");
        return NextResponse.json({ received: true });
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, paymentStatus: true, status: true },
      });

      if (!order) {
        console.warn("Stripe webhook: order not found:", orderId);
        return NextResponse.json({ received: true });
      }

      if (order.paymentStatus === "PAID") {
        return NextResponse.json({ received: true });
      }

      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          status: "PROCESSING",
          statusHistory: {
            create: {
              status: "PROCESSING",
              note: `Payment confirmed via Stripe (${event.type})`,
            },
          },
        },
      });

      console.log(`Stripe webhook: order ${orderId} marked PAID`);
    } else if (event.type === "checkout.session.async_payment_failed") {
      const orderId = session.client_reference_id as string | null;
      if (!orderId) {
        return NextResponse.json({ received: true });
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, paymentStatus: true },
      });

      if (!order || order.paymentStatus === "PAID") {
        return NextResponse.json({ received: true });
      }

      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "FAILED" },
      });

      console.log(`Stripe webhook: order ${orderId} marked FAILED (async payment failed)`);
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error("Stripe webhook handler error:", e);
    return NextResponse.json(
      { error: e?.message || "Webhook handler failed" },
      { status: 500 }
    );
  }
}
