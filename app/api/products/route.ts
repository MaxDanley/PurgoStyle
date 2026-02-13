import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProductBySlug } from "@/lib/products";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
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

    // Transform to match the expected format with all fields
    const formattedProducts = products.map((product) => {
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
        benefits: [], // Add benefits later if needed
        researchAreas: fallbackProduct?.researchAreas ?? [], // Add research areas later if needed
        chemicalProperties: fallbackProduct?.chemicalProperties ?? null,
      };
    });

    return NextResponse.json({ products: formattedProducts });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
