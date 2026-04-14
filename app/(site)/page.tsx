import { Metadata } from "next";
import HomeClient from "@/components/HomeClient";

// Ensure root is always server-rendered (avoids static/cache issues on Vercel)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PurgoLabs SummerSteeze | Arizona Activewear & Premium Tees",
  description: "PurgoLabs SummerSteeze – Arizona-based activewear and tees. Premium tees and hoodies. Shop now.",
  keywords: "PurgoLabs SummerSteeze, Arizona activewear, t-shirts, hoodies, apparel",
  openGraph: {
    title: "PurgoLabs SummerSteeze - Arizona Activewear & Tees",
    description: "Premium tees and activewear from Arizona.",
    type: "website",
    url: "https://www.summersteez.com",
  },
  alternates: { canonical: "https://www.summersteez.com" },
};

export default function Home() {
  return <HomeClient featuredProducts={[]} />;
}
