import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  paypalCaptureOrder,
  paypalGetOrder,
  paypalOrderToPaymentStatus,
} from "@/lib/paypal";
import { buildWebsiteAPaymentReturnUrl } from "@/lib/website-a-payment-return";

export const runtime = "nodejs";

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

    const redirectUrl = buildWebsiteAPaymentReturnUrl({
      sessionId: paypalOrderId,
      clientReferenceId: order.id,
      paymentStatus: "paid",
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

    await markOrderPaid(order.id, "Payment captured via PayPal (Website A checkout)");

    return NextResponse.json({ redirectUrl });
  } catch (e: unknown) {
    console.error("[paypal/capture]", e);
    const message = e instanceof Error ? e.message : "Capture failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
