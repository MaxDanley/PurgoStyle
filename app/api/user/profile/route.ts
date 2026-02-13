import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: (user as any).phone ?? null,
      },
    });
  } catch (error) {
    console.error("[user/profile] GET error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const rawPhone = (body?.phone || "").toString();
    const cleanedPhone = rawPhone.replace(/[^0-9()\-+ ]/g, "").trim();

    if (!cleanedPhone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { phone: cleanedPhone } as any,
    });

    return NextResponse.json({ success: true, phone: cleanedPhone });
  } catch (error) {
    console.error("[user/profile] POST error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}