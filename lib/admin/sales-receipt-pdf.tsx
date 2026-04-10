import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

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
  generatedAtLabel: string;
};

const ink = "#0f172a";
const muted = "#64748b";
const border = "#e2e8f0";
const bandOk = "#15803d";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 44,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: ink,
  },
  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brandName: { fontSize: 20, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },
  brandTag: { fontSize: 9, color: muted, marginTop: 4 },
  website: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1d4ed8" },
  category: { fontSize: 8, color: muted, marginTop: 2 },
  divider: { height: 1, backgroundColor: border, marginVertical: 14 },
  confirmedBand: {
    backgroundColor: bandOk,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  confirmedText: { color: "#ffffff", fontSize: 10, fontFamily: "Helvetica-Bold", letterSpacing: 1.2 },
  payDescBox: {
    borderWidth: 1,
    borderColor: border,
    padding: 10,
    marginBottom: 14,
    backgroundColor: "#f8fafc",
  },
  payDescLabel: { fontSize: 7, color: muted, textTransform: "uppercase", marginBottom: 2 },
  payDescShort: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  payDescLong: { fontSize: 9, marginTop: 6, fontFamily: "Helvetica-Bold", letterSpacing: 0.3 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  metaBlock: { width: "48%" },
  metaLabel: { fontSize: 7, color: muted, textTransform: "uppercase", marginBottom: 3 },
  metaValue: { fontSize: 9, lineHeight: 1.35 },
  twoCol: { flexDirection: "row", marginBottom: 16 },
  col: { flex: 1, paddingRight: 12 },
  colLast: { flex: 1, paddingLeft: 12 },
  sectionTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", marginBottom: 6, color: ink },
  addressLine: { fontSize: 9, lineHeight: 1.4 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: ink,
    paddingBottom: 6,
    marginBottom: 4,
  },
  thProduct: { width: "42%", fontSize: 7, fontFamily: "Helvetica-Bold", color: muted, textTransform: "uppercase" },
  thSize: { width: "12%", fontSize: 7, fontFamily: "Helvetica-Bold", color: muted, textTransform: "uppercase" },
  thQty: { width: "10%", fontSize: 7, fontFamily: "Helvetica-Bold", color: muted, textTransform: "uppercase", textAlign: "center" },
  thUnit: { width: "16%", fontSize: 7, fontFamily: "Helvetica-Bold", color: muted, textTransform: "uppercase", textAlign: "right" },
  thLine: { width: "20%", fontSize: 7, fontFamily: "Helvetica-Bold", color: muted, textTransform: "uppercase", textAlign: "right" },
  tableRow: { flexDirection: "row", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: border },
  tdProduct: { width: "42%", fontSize: 9 },
  tdSize: { width: "12%", fontSize: 9, color: muted },
  tdQty: { width: "10%", fontSize: 9, textAlign: "center" },
  tdUnit: { width: "16%", fontSize: 9, textAlign: "right" },
  tdLine: { width: "20%", fontSize: 9, textAlign: "right", fontFamily: "Helvetica-Bold" },
  totalsWrap: { marginTop: 12, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", width: 220, paddingVertical: 3 },
  totalLabel: { width: 130, fontSize: 9, color: muted, textAlign: "right", paddingRight: 8 },
  totalValue: { width: 82, fontSize: 9, textAlign: "right" },
  grandRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: 220,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: ink,
  },
  grandLabel: { width: 130, fontSize: 11, fontFamily: "Helvetica-Bold", textAlign: "right", paddingRight: 8 },
  grandValue: { width: 82, fontSize: 11, fontFamily: "Helvetica-Bold", textAlign: "right" },
  footNote: {
    position: "absolute",
    bottom: 36,
    left: 44,
    right: 44,
    borderTopWidth: 1,
    borderTopColor: border,
    paddingTop: 10,
  },
  footMuted: { fontSize: 7, color: muted, lineHeight: 1.45 },
  footStrong: { fontSize: 8, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  paymentSummary: {
    backgroundColor: "#f1f5f9",
    padding: 10,
    marginTop: 8,
    borderRadius: 2,
  },
  paymentLine: { fontSize: 9, marginBottom: 3 },
});

function SalesReceiptDocument({ data }: { data: SalesReceiptInput }) {
  const docId = `SR-${data.orderNumber.replace(/[^A-Z0-9]/gi, "").slice(0, 12)}-${data.orderId.slice(-6).toUpperCase()}`;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.brandName}>SUMMER STEEZE</Text>
            <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: muted, marginTop: 2 }}>
              SummerSteeze
            </Text>
            <Text style={styles.brandTag}>{"Men's and Boys' Clothing"}</Text>
            <Text style={styles.category}>NAICS 458110 · Retail apparel, footwear and accessories</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.website}>SummerSteez.com</Text>
            <Text style={{ fontSize: 8, color: muted, marginTop: 4 }}>Sales receipt</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.confirmedBand}>
          <Text style={styles.confirmedText}>ORDER CONFIRMED</Text>
        </View>

        <View style={styles.payDescBox}>
          <Text style={styles.payDescLabel}>Payment description (short)</Text>
          <Text style={styles.payDescShort}>PURGO L</Text>
          <Text style={styles.payDescLabel}>Payment description (long)</Text>
          <Text style={styles.payDescLong}>PURGO L SMRSTZ</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Order number</Text>
            <Text style={styles.metaValue}>{data.orderNumber}</Text>
            <Text style={[styles.metaLabel, { marginTop: 8 }]}>Order date</Text>
            <Text style={styles.metaValue}>{data.createdAtLabel}</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Receipt document ID</Text>
            <Text style={styles.metaValue}>{docId}</Text>
            <Text style={[styles.metaLabel, { marginTop: 8 }]}>Generated</Text>
            <Text style={styles.metaValue}>{data.generatedAtLabel}</Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Bill to</Text>
            <Text style={styles.addressLine}>{data.customerName}</Text>
            <Text style={styles.addressLine}>{data.customerEmail}</Text>
            {data.customerPhone ? (
              <Text style={styles.addressLine}>Tel: {data.customerPhone}</Text>
            ) : null}
          </View>
          <View style={styles.colLast}>
            <Text style={styles.sectionTitle}>Ship to</Text>
            <Text style={styles.addressLine}>{data.shipName}</Text>
            <Text style={styles.addressLine}>{data.shipStreet}</Text>
            {data.shipApartment ? <Text style={styles.addressLine}>{data.shipApartment}</Text> : null}
            <Text style={styles.addressLine}>
              {data.shipCity}, {data.shipState} {data.shipZip}
            </Text>
            <Text style={styles.addressLine}>{data.shipCountry}</Text>
            {data.shipPhone ? <Text style={styles.addressLine}>Tel: {data.shipPhone}</Text> : null}
          </View>
        </View>

        <View style={styles.paymentSummary}>
          <Text style={styles.paymentLine}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Payment: </Text>
            {data.paymentMethodLabel} · Status {data.paymentStatus} · Order {data.orderStatus}
          </Text>
          {data.trackingNumber ? (
            <Text style={styles.paymentLine}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Shipping: </Text>
              {data.shippingMethod} · Tracking {data.trackingNumber}
            </Text>
          ) : (
            <Text style={styles.paymentLine}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Shipping method: </Text>
              {data.shippingMethod}
            </Text>
          )}
        </View>

        <View style={{ marginTop: 16 }}>
          <View style={styles.tableHeader}>
            <Text style={styles.thProduct}>Product</Text>
            <Text style={styles.thSize}>Size</Text>
            <Text style={styles.thQty}>Qty</Text>
            <Text style={styles.thUnit}>Unit</Text>
            <Text style={styles.thLine}>Line</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={styles.tableRow} wrap={false}>
              <Text style={styles.tdProduct}>{item.productName}</Text>
              <Text style={styles.tdSize}>{item.size}</Text>
              <Text style={styles.tdQty}>{item.quantity}</Text>
              <Text style={styles.tdUnit}>${item.unitPrice.toFixed(2)}</Text>
              <Text style={styles.tdLine}>${item.lineTotal.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsWrap}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${data.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Shipping insurance</Text>
            <Text style={styles.totalValue}>${data.shippingInsurance.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Shipping ({data.shippingMethod})</Text>
            <Text style={styles.totalValue}>${data.shippingCost.toFixed(2)}</Text>
          </View>
          {data.discountAmount > 0 ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{data.discountLabel}</Text>
              <Text style={styles.totalValue}>-${data.discountAmount.toFixed(2)}</Text>
            </View>
          ) : null}
          <View style={styles.grandRow}>
            <Text style={styles.grandLabel}>Total (USD)</Text>
            <Text style={styles.grandValue}>${data.total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.footNote} fixed>
          <Text style={styles.footStrong}>Summer Steeze · SummerSteez.com</Text>
          <Text style={styles.footMuted}>
            Sales channel: E-commerce · Register ref. SS-WEB-88421 · MCC 5691 (Family clothing) · This
            document is your record of sale. For order support, contact us through SummerSteez.com with
            your order number.
          </Text>
          <Text style={[styles.footMuted, { marginTop: 4 }]}>
            Thank you for supporting Summer Steeze.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function buildSalesReceiptPdfBuffer(data: SalesReceiptInput): Promise<Buffer> {
  const element = <SalesReceiptDocument data={data} />;
  return renderToBuffer(element);
}
