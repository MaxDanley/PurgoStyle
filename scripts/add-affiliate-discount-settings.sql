-- Add discount settings columns to Affiliate table
-- Run this in Supabase SQL Editor

-- Add discount percentage column
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "discountPercentage" DOUBLE PRECISION NOT NULL DEFAULT 30;

-- Add free shipping column
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "freeShipping" BOOLEAN NOT NULL DEFAULT true;

-- Add usage limit column (nullable for unlimited)
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "usageLimit" INTEGER;

-- Add usage count column
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "usageCount" INTEGER NOT NULL DEFAULT 0;

-- Add expiration date column (nullable for no expiration)
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

-- Add minimum order amount column (nullable for no minimum)
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "minOrderAmount" DOUBLE PRECISION;

SELECT 'Affiliate discount settings columns added successfully!' as result;

