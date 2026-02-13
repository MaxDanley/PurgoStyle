import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendAccountCreationNotification } from "@/lib/email";

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().min(7),
});

export async function POST(req: Request) {
  try {
    console.log("[register] incoming request");
    const body = await req.json();
    console.log("[register] body keys:", Object.keys(body || {}));
    const validatedFields = registerSchema.safeParse(body);

    if (!validatedFields.success) {
      console.warn("[register] validation failed:", validatedFields.error.flatten());
      return NextResponse.json(
        { error: "Invalid fields" },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password, phone } = validatedFields.data;
    const name = `${firstName} ${lastName}`.trim();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
      },
    });

    console.log("[register] user created:", user.id);

    // Send notification to support (non-blocking)
    try {
      await sendAccountCreationNotification(email, name, phone);
    } catch (supportEmailError) {
      // Log but don't fail - support notification is non-critical
      console.error("Failed to send support notification (non-critical):", supportEmailError);
    }

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error: any) {
    // Prisma duplicate email safety net
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }
    console.error("[register] error:", error?.message || error);
    return NextResponse.json(
      { error: "Server error while creating account" },
      { status: 500 }
    );
  }
}

