-- Add GREEN/EDEBIT payment method support
-- Run this SQL script to update your database schema

BEGIN;

-- Add EDEBIT to PaymentMethod enum
DO $$ BEGIN
    ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'EDEBIT';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add Green payment tracking fields to Order table
ALTER TABLE "Order" 
ADD COLUMN IF NOT EXISTS "greenPayorId" TEXT,
ADD COLUMN IF NOT EXISTS "greenTransactionId" TEXT,
ADD COLUMN IF NOT EXISTS "greenCheckNumber" TEXT,
ADD COLUMN IF NOT EXISTS "greenVerificationType" TEXT; -- RTV or BV

-- Add index for Green transaction lookups
CREATE INDEX IF NOT EXISTS "Order_greenPayorId_idx" ON "Order"("greenPayorId");
CREATE INDEX IF NOT EXISTS "Order_greenTransactionId_idx" ON "Order"("greenTransactionId");

-- Add comment for documentation
COMMENT ON COLUMN "Order"."greenPayorId" IS 'Green by Phone customer Payor_ID';
COMMENT ON COLUMN "Order"."greenTransactionId" IS 'Green transaction ID for payment tracking';
COMMENT ON COLUMN "Order"."greenCheckNumber" IS 'Green check/debit number';
COMMENT ON COLUMN "Order"."greenVerificationType" IS 'Verification type: RTV (Real-Time) or BV (Batch)';

COMMIT;

