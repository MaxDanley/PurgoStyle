import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ products: [] });
    }

    const searchQuery = query.toLowerCase().trim();

    const products = await prisma.product.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: searchQuery, mode: "insensitive" } },
          { description: { contains: searchQuery, mode: "insensitive" } },
          { category: { contains: searchQuery, mode: "insensitive" } },
        ],
      },
      include: {
        variants: {
          where: { active: true },
          orderBy: { price: "asc" },
        },
      },
      take: 8, // Limit to 8 results for dropdown
      orderBy: {
        featured: "desc",
      },
    });

    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      image: product.image,
      category: product.category,
      minPrice: Math.min(...product.variants.map((v) => v.price)),
      maxPrice: Math.max(...product.variants.map((v) => v.price)),
    }));

    return NextResponse.json({ products: formattedProducts });
  } catch (error) {
    console.error("Error searching products:", error);
    return NextResponse.json(
      { error: "Failed to search products" },
      { status: 500 }
    );
  }
}
