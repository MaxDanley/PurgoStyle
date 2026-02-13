import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = await prisma.$queryRaw`select now()`;
    return NextResponse.json({ ok: true, db: true, now }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, db: false }, { status: 500 });
  }
}


