import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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
  );
}
