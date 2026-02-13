import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const { sessionId, step, cartValue } = body;

    if (!sessionId || !step) {
      return NextResponse.json(
        { error: "sessionId and step are required" },
        { status: 400 }
      );
    }

    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || undefined;
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : undefined;

    const email = session?.user?.email || null;

    await prisma.checkoutEvent.create({
      data: {
        sessionId,
        email,
        step,
        cartValue: cartValue || null,
        userAgent,
        ipAddress,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking checkout event:", error);
    return NextResponse.json(
      { error: "Failed to track checkout event" },
      { status: 500 }
    );
  }
}