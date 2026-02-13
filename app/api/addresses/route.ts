import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { name, street, apartment, city, state, zipCode, country, phone } = await req.json();

    // Check if address already exists to prevent duplicates
    const existingAddress = await prisma.address.findFirst({
      where: {
        userId: session.user.id,
        name,
        street,
        apartment: apartment || null,
        city,
        state,
        zipCode,
      },
    });

    if (existingAddress) {
      return NextResponse.json(
        { error: "This address already exists in your saved addresses" },
        { status: 400 }
      );
    }

    const address = await prisma.address.create({
      data: {
        userId: session.user.id,
        name,
        street,
        apartment: apartment || null,
        city,
        state,
        zipCode,
        country: country || "US",
        phone,
      },
    });

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    console.error("Error creating address:", error);
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 }
    );
  }
}
