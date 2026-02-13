-- Migration script to replace tax with shippingInsurance in Order table
-- This script:
-- 1. Adds shippingInsurance column (if it doesn't exist)
-- 2. Migrates existing tax values to shippingInsurance (if tax > 0, set to 3.50, otherwise 3.50)
-- 3. Removes tax column (optional - commented out for safety)

-- Step 1: Add shippingInsurance column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'shippingInsurance'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "shippingInsurance" DOUBLE PRECISION DEFAULT 3.50;
    END IF;
END $$;

-- Step 2: Migrate existing data
-- For orders with tax > 0, set shippingInsurance to 3.50 (standard shipping insurance)
-- For orders with tax = 0 or NULL, set shippingInsurance to 3.50
UPDATE "Order"
SET "shippingInsurance" = 3.50
WHERE "shippingInsurance" IS NULL OR "shippingInsurance" = 0;

-- Step 3: Create index on shippingInsurance for faster queries
CREATE INDEX IF NOT EXISTS "Order_shippingInsurance_idx" ON "Order" ("shippingInsurance");

-- Step 4: Remove tax column (UNCOMMENT WHEN READY TO REMOVE TAX COLUMN)
-- ALTER TABLE "Order" DROP COLUMN IF EXISTS "tax";

-- Verify the migration
SELECT 
    COUNT(*) as total_orders,
    COUNT("shippingInsurance") as orders_with_shipping_insurance,
    AVG("shippingInsurance") as avg_shipping_insurance,
    MIN("shippingInsurance") as min_shipping_insurance,
    MAX("shippingInsurance") as max_shipping_insurance
FROM "Order";

