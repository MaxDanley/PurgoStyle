import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Validate a discount code and return the discount amount for the given subtotal.
 * Used at checkout. No auth required.
 */
export async function POST(req: Request) {
  try {
    const { code, subtotal } = await req.json();
    const sub = Number(subtotal) || 0;
    const rawCode = typeof code === "string" ? code.trim().toUpperCase() : "";

    if (!rawCode) {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    const discount = await prisma.discountCode.findUnique({
      where: { code: rawCode },
    });

    if (!discount) {
      return NextResponse.json(
        { error: "No discount code found" },
        { status: 404 }
      );
    }

    if (!discount.isActive) {
      return NextResponse.json(
        { error: "This code is no longer active" },
        { status: 400 }
      );
    }

    if (discount.expiresAt && discount.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This code has expired" },
        { status: 400 }
      );
    }

    if (discount.minOrderAmount != null && sub < discount.minOrderAmount) {
      return NextResponse.json(
        { error: `Minimum order amount is $${discount.minOrderAmount.toFixed(2)}` },
        { status: 400 }
      );
    }

    if (discount.usageLimit != null && discount.usageCount >= discount.usageLimit) {
      return NextResponse.json(
        { error: "This code has reached its usage limit" },
        { status: 400 }
      );
    }

    let discountAmount = 0;
    let discountPercentage: number | null = null;

    if (discount.discountType === "PERCENTAGE") {
      discountPercentage = discount.discountAmount;
      discountAmount = (sub * discount.discountAmount) / 100;
      if (discount.maxDiscount != null && discountAmount > discount.maxDiscount) {
        discountAmount = discount.maxDiscount;
      }
    } else {
      discountAmount = Math.min(discount.discountAmount, sub);
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    return NextResponse.json({
      discountAmount,
      freeShipping: discount.freeShipping,
      discountPercentage: discountPercentage ?? null,
      code: discount.code,
    });
  } catch (error) {
    console.error("Discount validate error:", error);
    return NextResponse.json(
      { error: "Failed to validate code" },
      { status: 500 }
    );
  }
}
