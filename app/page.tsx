import { Metadata } from "next";
import HomeClient from "@/components/HomeClient";

export const metadata: Metadata = {
  title: "Purgo Style | Arizona Activewear & Premium Tees",
  description: "Purgo Style – Arizona-based activewear and tees. Latin for purify. Premium tees and hoodies. Shop now.",
  keywords: "Purgo Style, Arizona activewear, t-shirts, hoodies, apparel, Purgo",
  openGraph: {
    title: "Purgo Style - Arizona Activewear & Tees",
    description: "Premium tees and activewear from Arizona.",
    type: "website",
    url: "https://www.purgostyle.com",
  },
  alternates: { canonical: "https://www.purgostyle.com" },
};

export default function Home() {
  return <HomeClient featuredProducts={[]} />;
}
