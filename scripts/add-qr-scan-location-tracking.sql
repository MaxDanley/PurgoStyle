-- Add location and unique scan tracking to AffiliateClick table
-- This migration adds fields to track QR code scan location and uniqueness

ALTER TABLE "AffiliateClick" 
ADD COLUMN IF NOT EXISTS "city" TEXT,
ADD COLUMN IF NOT EXISTS "state" TEXT,
ADD COLUMN IF NOT EXISTS "country" TEXT,
ADD COLUMN IF NOT EXISTS "isUnique" BOOLEAN NOT NULL DEFAULT true;

-- Add index on ipAddress for faster unique scan lookups
CREATE INDEX IF NOT EXISTS "AffiliateClick_ipAddress_idx" ON "AffiliateClick"("ipAddress");

-- Update existing records to mark them as unique (they're all first scans)
UPDATE "AffiliateClick" SET "isUnique" = true WHERE "isUnique" IS NULL;
