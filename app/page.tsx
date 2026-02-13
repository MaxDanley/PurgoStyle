import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getProductBySlug } from "@/lib/products";
import HomeClient from "@/components/HomeClient";

// Force dynamic rendering to get fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

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

export default async function Home() {
  let featuredProducts: any[] = [];
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
    const formattedProducts = dbProducts.map((product) => {
      const fallbackProduct = getProductBySlug(product.slug);
      
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        longDescription: fallbackProduct?.longDescription ?? product.description,
        category: product.category,
        image: fallbackProduct?.image ?? product.image,
        secondImage: fallbackProduct?.secondImage ?? null,
        thirdImage: fallbackProduct?.thirdImage ?? null,
        featured: product.featured,
        variants: product.variants.map((variant) => ({
          id: variant.id,
          size: variant.size,
          price: variant.price,
          sku: variant.sku,
          stockCount: variant.stockCount,
        })),
        benefits: [],
        researchAreas: fallbackProduct?.researchAreas ?? [],
        chemicalProperties: fallbackProduct?.chemicalProperties ?? null,
      };
    });

    featuredProducts = formattedProducts.filter((p: any) => p.featured).slice(0, 6);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    // Fall back to empty array
  }

  return <HomeClient featuredProducts={featuredProducts} />;
}
