import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custom T-Shirts & Design Studio | Summer Steeze",
  description:
    "Create your own t-shirts, hoodies and more in our online design studio. No minimums, free shipping over $100. Custom clothing for teams, events, and brands.",
};

export default function CustomDesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
