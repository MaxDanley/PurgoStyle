import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custom Design Services",
  description:
    "Custom clothing and apparel design for sports teams, events, brands, and organizations. Team uniforms, event merchandise, branded workwear, and more.",
};

export default function CustomDesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
