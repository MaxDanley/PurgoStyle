-- PayPal Website A checkout (Orders v2). Run after pulling schema changes if not using `prisma migrate`.

-- PostgreSQL: add PAYPAL to PaymentMethod enum
DO $$ BEGIN
  ALTER TYPE "PaymentMethod" ADD VALUE 'PAYPAL';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paypalOrderId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentCurrency" TEXT DEFAULT 'USD';

CREATE UNIQUE INDEX IF NOT EXISTS "Order_paypalOrderId_key" ON "Order"("paypalOrderId")
  WHERE "paypalOrderId" IS NOT NULL;
