-- Add stripeSessionId and externalReference to Order table
-- Run this against your production database (e.g. via Supabase SQL Editor or psql)

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "stripeSessionId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Order_stripeSessionId_key" ON "Order"("stripeSessionId");
CREATE INDEX IF NOT EXISTS "Order_stripeSessionId_idx" ON "Order"("stripeSessionId");

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "externalReference" TEXT;
