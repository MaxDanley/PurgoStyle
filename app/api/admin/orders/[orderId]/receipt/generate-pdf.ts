/**
 * Admin sales receipt — PDFKit only. Do not import React or @react-pdf/* here.
 * Colocated with the route so production bundles cannot resolve a stale lib path.
 * pdfkit is loaded via dynamic import() to isolate the dependency graph.
 */

export type ReceiptLineItem = {
  productName: string;
  size: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type SalesReceiptInput = {
  orderNumber: string;
  orderId: string;
  createdAtLabel: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  shipName: string;
  shipStreet: string;
  shipApartment?: string | null;
  shipCity: string;
  shipState: string;
  shipZip: string;
  shipCountry: string;
  shipPhone?: string | null;
  paymentMethodLabel: string;
  paymentStatus: string;
  orderStatus: string;
  shippingMethod: string;
  trackingNumber?: string | null;
  items: ReceiptLineItem[];
  subtotal: number;
  shippingInsurance: number;
  shippingCost: number;
  discountAmount: number;
  discountLabel: string;
  total: number;
};

const INK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const GREEN = "#15803d";
const BLUE = "#1d4ed8";
const SUMMARY_BG = "#f1f5f9";

function safeStr(v: unknown): string {
  if (v == null) return "";
  return String(v);
}

export const RECEIPT_PDF_ENGINE = "pdfkit-dynamic-v2";

export async function buildSalesReceiptPdfBuffer(data: SalesReceiptInput): Promise<Buffer> {
  const { default: PDFDocument } = await import("pdfkit");

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: "LETTER",
      margin: 44,
      info: {
        Title: `Sales receipt ${data.orderNumber}`,
        Author: "SummerSteez",
      },
    });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const margin = 44;
    const pageW = doc.page.width;
    const contentW = pageW - 2 * margin;
    const rightX = pageW - margin;

    const docId = `SR-${data.orderNumber.replace(/[^A-Z0-9]/gi, "").slice(0, 12)}-${data.orderId.slice(-6).toUpperCase()}`;

    const bottomLimit = () => doc.page.height - margin - 72;

    function newPageIfNeeded(extra: number) {
      if (doc.y + extra > bottomLimit()) {
        doc.addPage();
      }
    }

    const headerTop = doc.y;
    doc.fillColor(INK).fontSize(20).font("Helvetica-Bold").text("SummerSteez", margin, headerTop, {
      width: contentW * 0.58,
    });
    const afterLeft = doc.y;
    doc.fillColor(BLUE).fontSize(10).font("Helvetica-Bold").text("SummerSteez.com", margin + contentW * 0.42, headerTop, {
      width: contentW * 0.58,
      align: "right",
    });
    doc.fillColor(MUTED).fontSize(8).font("Helvetica").text("Sales receipt", margin + contentW * 0.42, headerTop + 14, {
      width: contentW * 0.58,
      align: "right",
    });
    doc.y = Math.max(afterLeft, headerTop + 36);
    doc.x = margin;

    doc.fillColor(INK).font("Helvetica").fontSize(9).text("Men's and Boys' Clothing");
    doc.moveDown(0.12);
    doc.fillColor(MUTED).fontSize(8).text("NAICS 458110 · Retail apparel, footwear and accessories");
    doc.moveDown(0.6);

    doc.strokeColor(BORDER).lineWidth(1).moveTo(margin, doc.y).lineTo(rightX, doc.y).stroke();
    doc.moveDown(0.5);

    const bandY = doc.y;
    doc.rect(margin, bandY, 220, 22).fill(GREEN);
    doc.fillColor("#ffffff").fontSize(10).font("Helvetica-Bold").text("ORDER CONFIRMED", margin + 10, bandY + 6);
    doc.y = bandY + 32;
    doc.x = margin;
    doc.fillColor(INK);

    const colGap = 16;
    const colW = (contentW - colGap) / 2;
    const c2 = margin + colW + colGap;
    const metaTop = doc.y;
    let yL = metaTop;
    doc.fillColor(MUTED).fontSize(7).text("ORDER NUMBER", margin, yL, { width: colW });
    yL = doc.y;
    doc.fillColor(INK).fontSize(9).text(safeStr(data.orderNumber), margin, yL, { width: colW });
    yL = doc.y + 4;
    doc.fillColor(MUTED).fontSize(7).text("ORDER DATE", margin, yL, { width: colW });
    yL = doc.y;
    doc.fillColor(INK).fontSize(9).text(safeStr(data.createdAtLabel), margin, yL, { width: colW });
    const leftBottom = doc.y;

    let yR = metaTop;
    doc.fillColor(MUTED).fontSize(7).text("RECEIPT DOCUMENT ID", c2, yR, { width: colW });
    yR = doc.y;
    doc.fillColor(INK).fontSize(9).text(docId, c2, yR, { width: colW });
    doc.y = Math.max(leftBottom, doc.y) + 12;
    doc.x = margin;

    newPageIfNeeded(120);
    const addrTop = doc.y;
    let yB = addrTop;
    doc.fillColor(INK).fontSize(8).font("Helvetica-Bold").text("Bill to", margin, yB, { width: colW });
    yB = doc.y;
    doc.font("Helvetica").fontSize(9).text(safeStr(data.customerName), margin, yB, { width: colW });
    yB = doc.y;
    doc.text(safeStr(data.customerEmail), margin, yB, { width: colW });
    yB = doc.y;
    if (data.customerPhone) {
      doc.text(`Tel: ${safeStr(data.customerPhone)}`, margin, yB, { width: colW });
      yB = doc.y;
    }
    const billBottom = yB;

    let yS = addrTop;
    doc.fillColor(INK).fontSize(8).font("Helvetica-Bold").text("Ship to", c2, yS, { width: colW });
    yS = doc.y;
    doc.font("Helvetica").fontSize(9).text(safeStr(data.shipName), c2, yS, { width: colW });
    yS = doc.y;
    doc.text(safeStr(data.shipStreet), c2, yS, { width: colW });
    yS = doc.y;
    if (data.shipApartment) {
      doc.text(safeStr(data.shipApartment), c2, yS, { width: colW });
      yS = doc.y;
    }
    doc.text(`${safeStr(data.shipCity)}, ${safeStr(data.shipState)} ${safeStr(data.shipZip)}`, c2, yS, { width: colW });
    yS = doc.y;
    doc.text(safeStr(data.shipCountry), c2, yS, { width: colW });
    yS = doc.y;
    if (data.shipPhone) {
      doc.text(`Tel: ${safeStr(data.shipPhone)}`, c2, yS, { width: colW });
      yS = doc.y;
    }
    doc.y = Math.max(billBottom, yS) + 12;
    doc.x = margin;

    newPageIfNeeded(48);
    const sumY = doc.y;
    const sumH =
      data.trackingNumber != null && safeStr(data.trackingNumber) !== "" ? 40 : 30;
    doc.fillColor(SUMMARY_BG).rect(margin, sumY, contentW, sumH).fill();
    doc.fillColor(INK).fontSize(9).font("Helvetica").text(
      `Payment: ${data.paymentMethodLabel} · Status ${data.paymentStatus} · Order ${data.orderStatus}`,
      margin + 8,
      sumY + 8,
      { width: contentW - 16 }
    );
    if (data.trackingNumber != null && safeStr(data.trackingNumber) !== "") {
      doc.text(
        `Shipping: ${data.shippingMethod} · Tracking ${data.trackingNumber}`,
        margin + 8,
        sumY + 24,
        { width: contentW - 16 }
      );
    } else {
      doc.text(`Shipping method: ${safeStr(data.shippingMethod)}`, margin + 8, sumY + 24, {
        width: contentW - 16,
      });
    }
    doc.y = sumY + sumH + 12;
    doc.x = margin;

    newPageIfNeeded(60);
    doc.fillColor(MUTED).fontSize(8).font("Helvetica-Bold").text("Items", margin, doc.y, { width: contentW });
    doc.moveDown(0.2);
    doc.strokeColor(INK).lineWidth(1).moveTo(margin, doc.y).lineTo(rightX, doc.y).stroke();
    doc.moveDown(0.35);

    for (const item of data.items) {
      newPageIfNeeded(36);
      doc.fillColor(INK).fontSize(9).font("Helvetica-Bold").text(safeStr(item.productName), margin, doc.y, {
        width: contentW,
      });
      doc.font("Helvetica").fontSize(9).text(
        `Size ${safeStr(item.size)} · Qty ${item.quantity} · Unit $${item.unitPrice.toFixed(2)} · Line $${item.lineTotal.toFixed(2)}`,
        margin,
        doc.y,
        { width: contentW }
      );
      doc.moveDown(0.35);
      doc.strokeColor(BORDER).lineWidth(0.5).moveTo(margin, doc.y).lineTo(rightX, doc.y).stroke();
      doc.moveDown(0.25);
    }

    newPageIfNeeded(100);
    doc.moveDown(0.3);
    const totalsX = margin + contentW - 220;
    const labelW = 130;
    const valW = 70;
    let ty = doc.y;

    function totalRow(label: string, value: string) {
      doc.fillColor(MUTED).fontSize(9).font("Helvetica").text(label, totalsX, ty, { width: labelW, align: "right" });
      doc.fillColor(INK).font("Helvetica").text(value, totalsX + labelW + 8, ty, {
        width: valW,
        align: "right",
      });
      ty += 14;
    }

    totalRow("Subtotal", `$${data.subtotal.toFixed(2)}`);
    totalRow("Shipping insurance", `$${data.shippingInsurance.toFixed(2)}`);
    totalRow(`Shipping (${data.shippingMethod})`, `$${data.shippingCost.toFixed(2)}`);
    if (data.discountAmount > 0) {
      totalRow(data.discountLabel, `-$${data.discountAmount.toFixed(2)}`);
    }
    ty += 4;
    doc.strokeColor(INK).lineWidth(2).moveTo(totalsX, ty).lineTo(rightX, ty).stroke();
    ty += 10;
    doc.fillColor(INK).fontSize(11).font("Helvetica-Bold").text("Total (USD)", totalsX, ty, { width: labelW, align: "right" });
    doc.text(`$${data.total.toFixed(2)}`, totalsX + labelW + 8, ty, { width: valW, align: "right" });
    doc.y = ty + 24;
    doc.x = margin;

    const footerReserve = 58;
    if (doc.y > doc.page.height - margin - footerReserve - 40) {
      doc.addPage();
    }
    const fy = doc.page.height - margin - footerReserve;
    doc.strokeColor(BORDER).lineWidth(1).moveTo(margin, fy).lineTo(rightX, fy).stroke();
    let fyy = fy + 8;
    doc.fillColor(INK).fontSize(8).font("Helvetica-Bold").text("SummerSteez · SummerSteez.com", margin, fyy, {
      width: contentW,
    });
    fyy = doc.y + 4;
    doc.font("Helvetica").fontSize(7).fillColor(MUTED).text(
      "Sales channel: E-commerce · Register ref. SS-WEB-88421 · MCC 5691 (Family clothing) · This document is your record of sale. " +
        "For order support, contact us through SummerSteez.com with your order number.",
      margin,
      fyy,
      { width: contentW }
    );
    fyy = doc.y + 4;
    doc.text("Thank you for supporting SummerSteez.", margin, fyy, { width: contentW });

    doc.end();
  });
}
