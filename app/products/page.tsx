import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import PageViewTracker from "@/components/PageViewTracker";
import ProductsPageSEO from "@/components/ProductsPageSEO";
import DiscountPopup from "@/components/DiscountPopup";
import ProductsPageClient from "@/components/ProductsPageClient";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products | Purgo Style Labs",
  description: "Shop Purgo Style Labs. Arizona activewear, premium tees, and apparel. Quality you can feel.",
  alternates: {
    canonical: "https://www.purgostyle.com/products",
  },
};

// Force dynamic rendering to get fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

export default async function ProductsPage() {
  // Fetch products from database
  let products: any[] = [];
  try {
    const dbProducts = await prisma.product.findMany({
      include: {
        variants: {
          orderBy: {
            price: "asc",
          },
        },
      },
      where: {
        active: true,
      },
      orderBy: {
        featured: "desc",
      },
    });

    // Transform to match expected format
    products = dbProducts.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      longDescription: product.description,
      category: product.category,
      image: product.image,
      featured: product.featured,
      variants: product.variants.map((variant) => ({
        id: variant.id,
        size: variant.size,
        price: variant.price,
        sku: variant.sku,
        stockCount: variant.stockCount,
      })),
      benefits: [],
      researchAreas: [],
    }));
  } catch (error) {
    console.error("Error fetching products:", error);
    // Fall back to empty array
  }

  return (
    <>
      <PageViewTracker pageTitle="Products - Purgo Style Labs" pageType="products" />
      <DiscountPopup />
      <div className="py-12">
        <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Research Peptides
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our comprehensive selection of high-purity research peptides for laboratory use
          </p>
        </div>

        {/* Product Search and Grid */}
        <Suspense fallback={<div className="text-center py-12">Loading products...</div>}>
          <ProductsPageClient products={products} />
        </Suspense>

        {/* Info Section */}
        <div className="mt-16 bg-gray-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Quality Assurance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">99%+ Purity</h3>
              <p className="text-sm text-gray-600">
                All peptides are tested via HPLC and mass spectrometry to ensure highest purity standards
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Proper Storage</h3>
              <p className="text-sm text-gray-600">
                Shipped in temperature-controlled packaging and stored at optimal conditions
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">COA Available</h3>
              <p className="text-sm text-gray-600">
                Certificate of Analysis provided with each batch for verification and documentation
              </p>
            </div>
          </div>
        </div>

        {/* SEO Content Sections */}
        <div className="mt-16 bg-gray-50">
          <ProductsPageSEO />
        </div>
      </div>
    </div>
    </>
  );
}

