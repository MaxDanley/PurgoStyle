import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  paypalCaptureOrder,
  paypalGetOrder,
  paypalOrderToPaymentStatus,
} from "@/lib/paypal";
import { buildWebsiteAPaymentReturnUrl } from "@/lib/website-a-payment-return";

export const runtime = "nodejs";

const STORE_CHECKOUT_REF = "SS_STORE_CHECKOUT";

function redirectAfterPayPalCapture(order: {
  id: string;
  orderNumber: string;
  externalReference: string | null;
  paypalOrderId: string | null;
}): string {
  if (order.externalReference === STORE_CHECKOUT_REF) {
    const base = (process.env.NEXT_PUBLIC_BASE_URL || "https://summersteez.com").replace(/\/$/, "");
    return `${base}/order-confirmation?order=${encodeURIComponent(order.orderNumber)}`;
  }
  const sessionId = order.paypalOrderId ?? "";
  return buildWebsiteAPaymentReturnUrl({
    sessionId,
    clientReferenceId: order.id,
    paymentStatus: "paid",
  });
}

async function markOrderPaid(orderId: string, note: string) {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "PAID",
      status: "PROCESSING",
      statusHistory: {
        create: {
          status: "PROCESSING",
          note,
        },
      },
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      internalOrderId?: string;
      paypalOrderId?: string;
    };
    const { internalOrderId, paypalOrderId } = body;

    if (!internalOrderId || !paypalOrderId) {
      return NextResponse.json(
        { error: "internalOrderId and paypalOrderId required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: internalOrderId },
    });

    if (!order || order.paymentMethod !== "PAYPAL") {
      return NextResponse.json({ error: "Invalid order" }, { status: 400 });
    }

    if (order.paypalOrderId !== paypalOrderId) {
      return NextResponse.json({ error: "PayPal order mismatch" }, { status: 400 });
    }

    const redirectUrl = redirectAfterPayPalCapture({
      id: order.id,
      orderNumber: order.orderNumber,
      externalReference: order.externalReference,
      paypalOrderId,
    });

    if (order.paymentStatus === "PAID") {
      return NextResponse.json({ redirectUrl });
    }

    try {
      await paypalCaptureOrder(paypalOrderId);
    } catch (captureErr) {
      console.warn("[paypal/capture] capture call failed (may already be captured):", captureErr);
    }

    const verified = await paypalGetOrder(paypalOrderId);
    const payStatus = paypalOrderToPaymentStatus(verified);
    if (payStatus !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed. Please try again." },
        { status: 400 }
      );
    }

    const paidNote =
      order.externalReference === STORE_CHECKOUT_REF
        ? "Payment captured via PayPal (store checkout)"
        : "Payment captured via PayPal (Website A checkout)";
    await markOrderPaid(order.id, paidNote);

    return NextResponse.json({ redirectUrl });
  } catch (e: unknown) {
    console.error("[paypal/capture]", e);
    const message = e instanceof Error ? e.message : "Capture failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
