-- Add payment method support to Order table
-- This script adds fields to track payment methods and crypto payment details

BEGIN;

-- Add payment method enum type
DO $$ BEGIN
    CREATE TYPE "PaymentMethod" AS ENUM ('STRIPE', 'CRYPTO', 'ZELLE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add payment method field to Order table
ALTER TABLE "Order" 
ADD COLUMN IF NOT EXISTS "paymentMethod" "PaymentMethod" DEFAULT 'STRIPE';

-- Add crypto payment tracking fields
ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "cryptoPaymentId" TEXT,
ADD COLUMN IF NOT EXISTS "cryptoPaymentAddress" TEXT,
ADD COLUMN IF NOT EXISTS "cryptoPaymentAmount" DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS "cryptoCurrency" TEXT,
ADD COLUMN IF NOT EXISTS "cryptoPaymentExpiresAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "cryptoPaymentStatus" TEXT DEFAULT 'waiting';

-- Add index for crypto payment lookups
CREATE INDEX IF NOT EXISTS "Order_cryptoPaymentId_idx" ON "Order"("cryptoPaymentId");
CREATE INDEX IF NOT EXISTS "Order_paymentStatus_paymentMethod_idx" ON "Order"("paymentStatus", "paymentMethod");
CREATE INDEX IF NOT EXISTS "Order_createdAt_paymentStatus_idx" ON "Order"("createdAt", "paymentStatus");

-- Add comment for documentation
COMMENT ON COLUMN "Order"."paymentMethod" IS 'Payment method used: STRIPE, CRYPTO, ZELLE, or OTHER';
COMMENT ON COLUMN "Order"."cryptoPaymentId" IS 'NOWPayments payment ID for crypto transactions';
COMMENT ON COLUMN "Order"."cryptoPaymentAddress" IS 'Crypto wallet address for payment';
COMMENT ON COLUMN "Order"."cryptoPaymentAmount" IS 'Amount to pay in cryptocurrency';
COMMENT ON COLUMN "Order"."cryptoCurrency" IS 'Cryptocurrency type (BTC, ETH, etc.)';
COMMENT ON COLUMN "Order"."cryptoPaymentExpiresAt" IS 'When the crypto payment expires if not paid';
COMMENT ON COLUMN "Order"."cryptoPaymentStatus" IS 'NOWPayments payment status: waiting, confirming, confirmed, sending, partially_paid, finished, failed, refunded, expired';

COMMIT;

