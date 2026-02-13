import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const { sessionId, eventType, productId, variantId, quantity } = body;

    if (!sessionId || !eventType) {
      return NextResponse.json(
        { error: "sessionId and eventType are required" },
        { status: 400 }
      );
    }

    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || undefined;
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : undefined;

    const email = session?.user?.email || null;

    await prisma.cartEvent.create({
      data: {
        sessionId,
        email,
        eventType,
        productId: productId || null,
        variantId: variantId || null,
        quantity: quantity || null,
        userAgent,
        ipAddress,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking cart event:", error);
    return NextResponse.json(
      { error: "Failed to track cart event" },
      { status: 500 }
    );
  }
}