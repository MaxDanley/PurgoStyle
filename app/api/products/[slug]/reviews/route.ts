import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

function normalizeSize(size: string | null): string | null {
  if (!size) return null;
  const u = size.toUpperCase();
  if (u === "SMALL") return "S";
  if (u === "MEDIUM") return "M";
  if (u === "LARGE") return "L";
  if (["S", "M", "L"].includes(u)) return u;
  return null;
}

/** GET: List reviews for a product by slug */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const reviews = await prisma.productReview.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: "desc" },
    });

    const list = reviews.map((r) => ({
      id: r.id,
      authorName: r.authorName,
      rating: r.rating,
      title: r.title,
      body: r.body,
      sizePurchased: r.sizePurchased,
      verifiedBuyer: r.verifiedBuyer,
      helpfulCount: r.helpfulCount,
      notHelpfulCount: r.notHelpfulCount,
      createdAt: r.createdAt.toISOString(),
    }));

    const averageRating =
      list.length > 0
        ? list.reduce((sum, r) => sum + r.rating, 0) / list.length
        : 0;
    const totalCount = list.length;

    return NextResponse.json({
      reviews: list,
      averageRating: Math.round(averageRating * 10) / 10,
      totalCount,
    });
  } catch (e) {
    console.error("GET /api/products/[slug]/reviews:", e);
    return NextResponse.json(
      { error: "Failed to load reviews" },
      { status: 500 }
    );
  }
}

/** POST: Create a review (guest or logged-in) */
export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      authorName,
      authorEmail,
      rating,
      title,
      body: reviewBody,
      sizePurchased,
    } = body as {
      authorName?: string;
      authorEmail?: string;
      rating?: number;
      title?: string;
      body?: string;
      sizePurchased?: string;
    };

    if (!authorName || typeof authorName !== "string" || !authorName.trim()) {
      return NextResponse.json(
        { error: "Author name is required" },
        { status: 400 }
      );
    }
    if (
      typeof rating !== "number" ||
      rating < 1 ||
      rating > 5 ||
      !Number.isInteger(rating)
    ) {
      return NextResponse.json(
        { error: "Rating must be an integer from 1 to 5" },
        { status: 400 }
      );
    }
    const bodyText =
      typeof reviewBody === "string" ? reviewBody.trim() : "";
    if (!bodyText) {
      return NextResponse.json(
        { error: "Review text is required" },
        { status: 400 }
      );
    }

    const sizeNorm = sizePurchased ? normalizeSize(sizePurchased) : null;
    if (sizePurchased && !sizeNorm) {
      return NextResponse.json(
        { error: "Size must be one of: S, M, L (or Small, Medium, Large)" },
        { status: 400 }
      );
    }

    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
    const verifiedBuyer = false; // Can be set true later if we verify order history

    const review = await prisma.productReview.create({
      data: {
        productId: product.id,
        userId: userId ?? undefined,
        authorName: authorName.trim(),
        authorEmail:
          typeof authorEmail === "string" && authorEmail.trim()
            ? authorEmail.trim()
            : null,
        rating,
        title: typeof title === "string" && title.trim() ? title.trim() : null,
        body: bodyText,
        sizePurchased: sizeNorm,
        verifiedBuyer,
      },
    });

    return NextResponse.json({
      id: review.id,
      authorName: review.authorName,
      rating: review.rating,
      title: review.title,
      body: review.body,
      sizePurchased: review.sizePurchased,
      verifiedBuyer: review.verifiedBuyer,
      createdAt: review.createdAt.toISOString(),
    });
  } catch (e) {
    console.error("POST /api/products/[slug]/reviews:", e);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
