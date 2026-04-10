import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SHIPPING_ESTIMATE_SNIPPET } from "@/lib/shipping";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div id="page-content-wrapper" className="bg-white min-h-screen">
      <div className="bg-gray-900 text-gray-200 text-center py-2.5 px-4 text-xs leading-relaxed">
        <span className="font-medium text-white">Shipping: </span>
        {SHIPPING_ESTIMATE_SNIPPET}{" "}
        <Link href="/shipping" className="text-brand-400 hover:text-brand-300 underline underline-offset-2">
          Full details
        </Link>
      </div>
      <Navbar />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </div>
  );
}
