import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custom T-Shirts & Design Studio | PurgoLabs SummerSteeze",
  description:
    "Create your own t-shirts, hoodies and more in our online design studio. No minimums. Custom clothing for teams, events, and brands.",
};

export default function CustomDesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
