import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import PageViewTracker from "@/components/PageViewTracker";
import DiscountPopup from "@/components/DiscountPopup";
import ProductsPageClient from "@/components/ProductsPageClient";
import ProductsPageSEO from "@/components/ProductsPageSEO";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products | Summer Steeze",
  description: "Shop Summer Steeze. Arizona activewear, premium tees, and apparel. Quality you can feel.",
  alternates: {
    canonical: "https://www.summersteeze.com/products",
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
      <PageViewTracker pageTitle="Products - Summer Steeze" pageType="products" />
      <DiscountPopup />
      <div className="py-12">
        <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Products
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Arizona activewear, premium tees, and apparel. Quality you can feel.
          </p>
        </div>

        {/* Product Search and Grid */}
        <Suspense fallback={<div className="text-center py-12">Loading products...</div>}>
          <ProductsPageClient products={products} />
        </Suspense>

        {/* SEO Content */}
        <div className="mt-16 bg-gray-50">
          <ProductsPageSEO />
        </div>
      </div>
    </div>
    </>
  );
}

