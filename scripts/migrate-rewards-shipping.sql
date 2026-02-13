-- Migration script to add rewards points and shipping options
-- Run this script in your database to add the new fields

-- Add rewards points to User table
ALTER TABLE "User" ADD COLUMN "rewardsPoints" INTEGER NOT NULL DEFAULT 0;

-- Add points and shipping fields to Order table
ALTER TABLE "Order" ADD COLUMN "pointsEarned" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "pointsRedeemed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "shippingMethod" TEXT NOT NULL DEFAULT 'ground';

-- Create PointsHistory table
CREATE TABLE "PointsHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "points" INTEGER NOT NULL,
    "type" "PointsType" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PointsHistory_pkey" PRIMARY KEY ("id")
);

-- Create PointsType enum
CREATE TYPE "PointsType" AS ENUM ('EARNED', 'REDEEMED', 'EXPIRED');

-- Add indexes
CREATE INDEX "PointsHistory_userId_idx" ON "PointsHistory"("userId");

-- Add foreign key constraints
ALTER TABLE "PointsHistory" ADD CONSTRAINT "PointsHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PointsHistory" ADD CONSTRAINT "PointsHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add relation to Order table
ALTER TABLE "Order" ADD CONSTRAINT "Order_pointsHistory_fkey" FOREIGN KEY ("id") REFERENCES "PointsHistory"("orderId") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update existing users to have 0 points (already default, but explicit)
UPDATE "User" SET "rewardsPoints" = 0 WHERE "rewardsPoints" IS NULL;

-- Update existing orders to have default values
UPDATE "Order" SET "pointsEarned" = 0 WHERE "pointsEarned" IS NULL;
UPDATE "Order" SET "pointsRedeemed" = 0 WHERE "pointsRedeemed" IS NULL;
UPDATE "Order" SET "shippingMethod" = 'ground' WHERE "shippingMethod" IS NULL;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'rewardsPoints';

SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'Order' AND column_name IN ('pointsEarned', 'pointsRedeemed', 'shippingMethod');

SELECT table_name FROM information_schema.tables WHERE table_name = 'PointsHistory';
