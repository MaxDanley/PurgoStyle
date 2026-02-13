import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Look up a guest order by order number and email
 */
export async function POST(req: Request) {
  try {
    const { orderNumber, email } = await req.json();

    if (!orderNumber || !email) {
      return NextResponse.json(
        { error: "Order number and email are required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        shippingAddress: true,
        statusHistory: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found. Please verify your order number and email address." },
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
    console.error("Failed to lookup order:", error);
    return NextResponse.json(
      { error: "Failed to lookup order" },
      { status: 500 }
    );
  }
}

