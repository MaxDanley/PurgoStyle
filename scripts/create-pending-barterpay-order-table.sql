-- Create PendingBarterPayOrder table to store order data temporarily
-- This allows us to create orders only after payment is confirmed

BEGIN;

CREATE TABLE IF NOT EXISTS "PendingBarterPayOrder" (
  "id" TEXT NOT NULL,
  "orderNumber" TEXT NOT NULL,
  "transactionIndex" TEXT NOT NULL,
  "userId" TEXT,
  "items" JSONB NOT NULL,
  "shippingInfo" JSONB NOT NULL,
  "billingInfo" JSONB,
  "metadata" JSONB NOT NULL,
  "subtotal" DOUBLE PRECISION NOT NULL,
  "tax" DOUBLE PRECISION NOT NULL,
  "shippingCost" DOUBLE PRECISION NOT NULL,
  "shippingInsurance" DOUBLE PRECISION NOT NULL,
  "pointsEarned" INTEGER NOT NULL,
  "total" DOUBLE PRECISION NOT NULL,
  "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PendingBarterPayOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PendingBarterPayOrder_orderNumber_key" ON "PendingBarterPayOrder"("orderNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "PendingBarterPayOrder_transactionIndex_key" ON "PendingBarterPayOrder"("transactionIndex");
CREATE INDEX IF NOT EXISTS "PendingBarterPayOrder_transactionIndex_idx" ON "PendingBarterPayOrder"("transactionIndex");
CREATE INDEX IF NOT EXISTS "PendingBarterPayOrder_orderNumber_idx" ON "PendingBarterPayOrder"("orderNumber");
CREATE INDEX IF NOT EXISTS "PendingBarterPayOrder_createdAt_idx" ON "PendingBarterPayOrder"("createdAt");
CREATE INDEX IF NOT EXISTS "PendingBarterPayOrder_expiresAt_idx" ON "PendingBarterPayOrder"("expiresAt");

COMMENT ON TABLE "PendingBarterPayOrder" IS 'Temporary storage for BarterPay order data before payment confirmation';
COMMENT ON COLUMN "PendingBarterPayOrder"."expiresAt" IS 'Clean up pending orders after this time';

COMMIT;

