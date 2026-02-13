-- Add BARTERPAY payment method support
-- Run this SQL script to update your database schema

BEGIN;

-- Add BARTERPAY to PaymentMethod enum
DO $$ BEGIN
    ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'BARTERPAY';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add BarterPay transaction tracking fields to Order table
ALTER TABLE "Order" 
ADD COLUMN IF NOT EXISTS "barterPayTransactionIndex" TEXT;

-- Add index for BarterPay transaction lookups
CREATE INDEX IF NOT EXISTS "Order_barterPayTransactionIndex_idx" ON "Order"("barterPayTransactionIndex");

-- Add comment for documentation
COMMENT ON COLUMN "Order"."barterPayTransactionIndex" IS 'BarterPay transaction index for payment tracking';

COMMIT;

