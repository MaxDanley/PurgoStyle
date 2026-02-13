import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SessionProvider from "@/components/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.purgostyle.com"),
  title: {
    default: "Purgo Style | Arizona Activewear & Premium Tees",
    template: "%s | Purgo Style"
  },
  description: "Purgo Style is an Arizona-based activewear and tee brand. Premium tees, sweatshirts, and apparel. Latin for purify—quality you can feel.",
  keywords: "Purgo Style, Arizona activewear, t-shirts, sweatshirts, apparel, Purgo",
  authors: [{ name: "Purgo Style" }],
  creator: "Purgo Style",
  publisher: "Purgo Style",
  robots: { index: true, follow: true },
  icons: { icon: '/logo-small-copy.png', apple: '/logo-small-copy.png' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.purgostyle.com',
    siteName: 'Purgo Style',
    title: "Purgo Style - Arizona Activewear & Tees",
    description: "Premium tees and activewear from Arizona.",
    images: [{ url: '/logo-small-copy.png', width: 1200, height: 630, alt: 'Purgo Style' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Purgo Style - Arizona Activewear & Tees',
    description: 'Premium tees and activewear from Arizona.',
    images: ['/logo-small-copy.png'],
  },
  alternates: { canonical: 'https://www.purgostyle.com' },
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
        <SessionProvider>
          <Toaster position="top-center" />
          <div id="page-content-wrapper" className="bg-white min-h-screen">
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

