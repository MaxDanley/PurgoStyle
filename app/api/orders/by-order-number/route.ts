import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Get order by order number
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get("orderNumber");

    if (!orderNumber) {
      return NextResponse.json(
        { error: "Order number is required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        shippingAddress: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Include payment method and payment details
    const orderWithPayment = {
      ...order,
      paymentMethod: (order as any).paymentMethod || "OTHER",
      cryptoPaymentId: (order as any).cryptoPaymentId || null,
      cryptoPaymentAddress: (order as any).cryptoPaymentAddress || null,
      cryptoPaymentAmount: (order as any).cryptoPaymentAmount || null,
      cryptoCurrency: (order as any).cryptoCurrency || null,
      cryptoPaymentStatus: (order as any).cryptoPaymentStatus || null,
      greenPayorId: (order as any).greenPayorId || null,
      greenTransactionId: (order as any).greenTransactionId || null,
      greenCheckNumber: (order as any).greenCheckNumber || null,
      greenVerificationType: (order as any).greenVerificationType || null,
      paymentStatus: (order as any).paymentStatus || "PENDING",
    };

    return NextResponse.json({ order: orderWithPayment });
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

