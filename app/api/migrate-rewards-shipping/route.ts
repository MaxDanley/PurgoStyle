import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Run database migration for rewards and shipping features
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    console.log("🔄 Starting rewards and shipping migration...");

    // Add rewards points to User table
    await prisma.$executeRaw`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "rewardsPoints" INTEGER NOT NULL DEFAULT 0;
    `;

    // Add points and shipping fields to Order table
    await prisma.$executeRaw`
      ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "pointsEarned" INTEGER NOT NULL DEFAULT 0;
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "pointsRedeemed" INTEGER NOT NULL DEFAULT 0;
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingMethod" TEXT NOT NULL DEFAULT 'ground';
    `;

    // Create PointsType enum if it doesn't exist
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "PointsType" AS ENUM ('EARNED', 'REDEEMED', 'EXPIRED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // Create PointsHistory table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "PointsHistory" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "orderId" TEXT,
        "points" INTEGER NOT NULL,
        "type" "PointsType" NOT NULL,
        "description" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PointsHistory_pkey" PRIMARY KEY ("id")
      );
    `;

    // Add indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "PointsHistory_userId_idx" ON "PointsHistory"("userId");
    `;

    // Add foreign key constraints
    await prisma.$executeRaw`
      ALTER TABLE "PointsHistory" 
      ADD CONSTRAINT IF NOT EXISTS "PointsHistory_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `;

    await prisma.$executeRaw`
      ALTER TABLE "PointsHistory" 
      ADD CONSTRAINT IF NOT EXISTS "PointsHistory_orderId_fkey" 
      FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    `;

    // Update existing users to have 0 points
    await prisma.$executeRaw`
      UPDATE "User" SET "rewardsPoints" = 0 WHERE "rewardsPoints" IS NULL;
    `;

    // Update existing orders to have default values
    await prisma.$executeRaw`
      UPDATE "Order" SET "pointsEarned" = 0 WHERE "pointsEarned" IS NULL;
    `;
    
    await prisma.$executeRaw`
      UPDATE "Order" SET "pointsRedeemed" = 0 WHERE "pointsRedeemed" IS NULL;
    `;
    
    await prisma.$executeRaw`
      UPDATE "Order" SET "shippingMethod" = 'ground' WHERE "shippingMethod" IS NULL;
    `;

    console.log("✅ Rewards and shipping migration completed successfully");

    return NextResponse.json({
      success: true,
      message: "Rewards and shipping migration completed successfully",
      changes: [
        "Added rewardsPoints to User table",
        "Added pointsEarned, pointsRedeemed, shippingMethod to Order table",
        "Created PointsHistory table with PointsType enum",
        "Added indexes and foreign key constraints",
        "Updated existing records with default values"
      ]
    });

  } catch (error) {
    console.error("❌ Migration failed:", error);
    return NextResponse.json(
      { 
        error: "Migration failed", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
