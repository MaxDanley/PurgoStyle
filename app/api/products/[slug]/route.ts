import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProductBySlug, getSecondaryImageUrl } from "@/lib/products";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        variants: {
          orderBy: {
            price: "asc",
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Transform to match the expected format
    const fallbackProduct = getProductBySlug(slug);

    const formattedProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      longDescription: fallbackProduct?.longDescription ?? product.description,
      category: product.category,
      image: fallbackProduct?.image ?? product.image,
      secondImage: fallbackProduct?.secondImage ?? getSecondaryImageUrl(product.slug) ?? null,
      thirdImage: fallbackProduct?.thirdImage ?? null,
      coaUrl: product.coaUrl,
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

    return NextResponse.json({ product: formattedProduct });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
