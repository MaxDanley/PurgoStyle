import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment",
  robots: "noindex, nofollow",
};

export default function PaymentRedirectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
