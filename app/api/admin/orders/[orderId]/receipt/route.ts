import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildSalesReceiptPdfBuffer, RECEIPT_PDF_ENGINE } from "./generate-pdf";

export const runtime = "nodejs";

function formatPaymentMethod(method: string): string {
  const map: Record<string, string> = {
    CREDIT_CARD: "Credit card",
    PAYPAL: "PayPal",
    CRYPTO: "Cryptocurrency",
    ZELLE: "Zelle",
    VENMO: "Venmo",
    BARTERPAY: "BarterPay",
    EDEBIT: "eDebit",
    OTHER: "Other",
  };
  return map[method] ?? method.replace(/_/g, " ");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shippingAddress: true,
        discountCode: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        user: { select: { name: true, email: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const customerName =
      order.user?.name || order.shippingAddress?.name || "Guest";
    const customerEmail = order.user?.email || order.email || "—";
    const placedAt = new Date(order.createdAt).toLocaleString("en-US", {
      timeZone: "America/Phoenix",
      dateStyle: "medium",
      timeStyle: "short",
    });
    const addr = order.shippingAddress;

    const discountLabel = order.discountCode
      ? `Discount (${order.discountCode.code})`
      : "Discount";

    const buffer = await buildSalesReceiptPdfBuffer({
      orderNumber: order.orderNumber,
      orderId: order.id,
      createdAtLabel: `${placedAt} (Arizona)`,
      customerName,
      customerEmail,
      customerPhone: order.phone,
      shipName: addr?.name ?? "—",
      shipStreet: addr?.street ?? "—",
      shipApartment: addr?.apartment,
      shipCity: addr?.city ?? "",
      shipState: addr?.state ?? "",
      shipZip: addr?.zipCode ?? "",
      shipCountry: addr?.country ?? "US",
      shipPhone: addr?.phone,
      paymentMethodLabel: formatPaymentMethod(order.paymentMethod),
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      shippingMethod: order.shippingMethod || "Standard",
      trackingNumber: order.trackingNumber,
      items: order.items.map((item) => {
        const qty = Number(item.quantity) || 0;
        const unit = Number(item.price) || 0;
        return {
          productName: item.product?.name?.trim() || "Item",
          size: item.variant?.size?.trim() || "—",
          quantity: qty,
          unitPrice: unit,
          lineTotal: unit * qty,
        };
      }),
      subtotal: Number(order.subtotal) || 0,
      shippingInsurance: Number(order.shippingInsurance) || 0,
      shippingCost: Number(order.shippingCost) || 0,
      discountAmount: Number(order.discountAmount) || 0,
      discountLabel,
      total: Number(order.total) || 0,
    });

    const safeFile = order.orderNumber.replace(/[^a-zA-Z0-9-_]/g, "_");
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="sales-receipt-${safeFile}.pdf"`,
        "Cache-Control": "no-store",
        "X-Receipt-Generator": RECEIPT_PDF_ENGINE,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : undefined;
    console.error("[admin receipt]", msg, stack ?? e);
    return NextResponse.json(
      {
        error: "Failed to build receipt",
        ...(process.env.NODE_ENV === "development" ? { details: msg } : {}),
      },
      { status: 500 }
    );
  }
}
