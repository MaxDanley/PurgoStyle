import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SessionProvider from "@/components/SessionProvider";
import GoogleMerchantWidget from "@/components/GoogleMerchantWidget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.summersteez.com"),
  title: {
    default: "Summer Steeze | Arizona Activewear & Premium Tees",
    template: "%s | Summer Steeze"
  },
  description: "Summer Steeze is an Arizona-based activewear and tee brand. Premium tees, sweatshirts, and apparel. Quality you can feel.",
  keywords: "Summer Steeze, Arizona activewear, t-shirts, sweatshirts, apparel",
  authors: [{ name: "Summer Steeze" }],
  creator: "Summer Steeze",
  publisher: "Summer Steeze",
  robots: { index: true, follow: true },
  verification: {
    google: "rZpt5wvHCgLFnHfK_DW3fo5_wo7OOSkZjn8rc9v3XcE",
  },
  icons: { icon: '/STEEZ.png', apple: '/STEEZ.png' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.summersteez.com',
    siteName: 'Summer Steeze',
    title: "Summer Steeze - Arizona Activewear & Tees",
    description: "Premium tees and activewear from Arizona.",
    images: [{ url: '/STEEZ.png', width: 1200, height: 630, alt: 'Summer Steeze' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Summer Steeze - Arizona Activewear & Tees',
    description: 'Premium tees and activewear from Arizona.',
    images: ['/STEEZ.png'],
  },
  alternates: { canonical: 'https://www.summersteez.com' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body className={inter.className}>
        <GoogleMerchantWidget />
        <SessionProvider>
          <Toaster position="top-center" />
          <div id="page-content-wrapper" className="bg-white min-h-screen">
            <div className="bg-black text-white text-center py-2.5 px-4 text-xs font-medium uppercase tracking-widest">
              Free shipping on orders over $50
            </div>
            <Navbar />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}

