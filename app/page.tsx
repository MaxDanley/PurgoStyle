import { Metadata } from "next";
import HomeClient from "@/components/HomeClient";

// Ensure root is always server-rendered (avoids static/cache issues on Vercel)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Summer Steeze | Arizona Activewear & Premium Tees",
  description: "Summer Steeze – Arizona-based activewear and tees. Premium tees and hoodies. Shop now.",
  keywords: "Summer Steeze, Arizona activewear, t-shirts, hoodies, apparel",
  openGraph: {
    title: "Summer Steeze - Arizona Activewear & Tees",
    description: "Premium tees and activewear from Arizona.",
    type: "website",
    url: "https://www.summersteeze.com",
  },
  alternates: { canonical: "https://www.summersteeze.com" },
};

export default function Home() {
  return <HomeClient featuredProducts={[]} />;
}
