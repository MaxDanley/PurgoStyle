import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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
    const addrBlock = addr
      ? `${escapeHtml(addr.name)}<br>${escapeHtml(addr.street)}${
          addr.apartment ? `<br>${escapeHtml(addr.apartment)}` : ""
        }<br>${escapeHtml(addr.city)}, ${escapeHtml(addr.state)} ${escapeHtml(addr.zipCode)}<br>${escapeHtml(addr.country)}${
          addr.phone ? `<br>Tel: ${escapeHtml(addr.phone)}` : ""
        }`
      : "—";

    const rows = order.items
      .map((item) => {
        const line = item.price * item.quantity;
        return `<tr>
          <td>${escapeHtml(item.product.name)}</td>
          <td>${escapeHtml(item.variant.size)}</td>
          <td style="text-align:center">${item.quantity}</td>
          <td style="text-align:right">$${item.price.toFixed(2)}</td>
          <td style="text-align:right">$${line.toFixed(2)}</td>
        </tr>`;
      })
      .join("");

    const discountLabel = order.discountCode
      ? `Discount (${escapeHtml(order.discountCode.code)})`
      : "Discount";

    const upsUrl = order.trackingNumber
      ? `https://www.ups.com/track?loc=en_US&tracknum=${encodeURIComponent(order.trackingNumber)}`
      : null;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sales receipt — ${escapeHtml(order.orderNumber)}</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 2rem; color: #111; line-height: 1.45; }
    h1 { font-size: 1.35rem; margin: 0 0 0.25rem; }
    .muted { color: #555; font-size: 0.9rem; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin: 1.5rem 0; }
    @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.95rem; }
    th, td { border: 1px solid #ddd; padding: 0.5rem 0.6rem; text-align: left; }
    th { background: #f5f5f5; }
    .totals { max-width: 22rem; margin-left: auto; margin-top: 1rem; }
    .totals div { display: flex; justify-content: space-between; padding: 0.25rem 0; }
    .totals .grand { font-weight: 700; border-top: 2px solid #111; margin-top: 0.35rem; padding-top: 0.5rem; }
    @media print { body { margin: 0.5in; } a { color: inherit; text-decoration: none; } }
  </style>
</head>
<body>
  <h1>Summer Steeze — Sales receipt</h1>
  <p class="muted">Order <strong>#${escapeHtml(order.orderNumber)}</strong> · Placed ${escapeHtml(placedAt)} (Arizona)</p>

  <div class="grid">
    <div>
      <strong>Bill to / Customer</strong><br>
      ${escapeHtml(customerName)}<br>
      ${escapeHtml(customerEmail)}
      ${order.phone ? `<br>Tel: ${escapeHtml(order.phone)}` : ""}
    </div>
    <div>
      <strong>Ship to</strong><br>
      ${addrBlock}
    </div>
  </div>

  <p><strong>Payment</strong> ${escapeHtml(formatPaymentMethod(order.paymentMethod))} ·
    <strong>Status</strong> ${escapeHtml(order.paymentStatus)} ·
    <strong>Order status</strong> ${escapeHtml(order.status)}</p>

  ${
    order.trackingNumber
      ? `<p><strong>Shipping service</strong> ${escapeHtml(order.shippingMethod || "UPS")} · <strong>Tracking (UPS)</strong> ${escapeHtml(order.trackingNumber)}${
          upsUrl ? ` · <a href="${upsUrl}">Track on UPS</a>` : ""
        }</p>`
      : order.shippingMethod
        ? `<p><strong>Shipping service</strong> ${escapeHtml(order.shippingMethod)}</p>`
        : ""
  }

  <table>
    <thead>
      <tr><th>Product</th><th>Size</th><th>Qty</th><th>Unit</th><th>Line</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal</span><span>$${order.subtotal.toFixed(2)}</span></div>
    <div><span>Shipping insurance</span><span>$${order.shippingInsurance.toFixed(2)}</span></div>
    <div><span>Shipping (${escapeHtml(order.shippingMethod)})</span><span>$${order.shippingCost.toFixed(2)}</span></div>
    ${
      order.discountAmount > 0
        ? `<div><span>${discountLabel}</span><span>−$${order.discountAmount.toFixed(2)}</span></div>`
        : ""
    }
    <div class="grand"><span>Total (USD)</span><span>$${order.total.toFixed(2)}</span></div>
  </div>

  ${
    order.externalReference
      ? `<p class="muted" style="margin-top:2rem;">Reference: ${escapeHtml(order.externalReference)}</p>`
      : ""
  }

  <p class="muted" style="margin-top:2rem;">Print this page or save as PDF for your records / PayPal proof of fulfillment.</p>
</body>
</html>`;

    const safeFile = order.orderNumber.replace(/[^a-zA-Z0-9-_]/g, "_");
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="sales-receipt-${safeFile}.html"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[admin receipt]", e);
    return NextResponse.json({ error: "Failed to build receipt" }, { status: 500 });
  }
}
