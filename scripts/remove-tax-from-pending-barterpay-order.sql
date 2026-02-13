-- Migration script to remove tax column from PendingBarterPayOrder table
-- This script:
-- 1. Adds shippingInsurance column if it doesn't exist
-- 2. Migrates existing tax values to shippingInsurance (if any)
-- 3. Removes tax column

BEGIN;

-- Step 1: Add shippingInsurance column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PendingBarterPayOrder' AND column_name = 'shippingInsurance'
    ) THEN
        ALTER TABLE "PendingBarterPayOrder" ADD COLUMN "shippingInsurance" DOUBLE PRECISION DEFAULT 3.50;
    END IF;
END $$;

-- Step 2: Migrate existing data (if tax column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PendingBarterPayOrder' AND column_name = 'tax'
    ) THEN
        -- Update shippingInsurance from tax values
        UPDATE "PendingBarterPayOrder"
        SET "shippingInsurance" = 3.50
        WHERE "shippingInsurance" IS NULL OR "shippingInsurance" = 0;
        
        -- Remove tax column
        ALTER TABLE "PendingBarterPayOrder" DROP COLUMN "tax";
    END IF;
END $$;

COMMIT;

-- Verify the migration
SELECT 
    COUNT(*) as total_pending_orders,
    COUNT("shippingInsurance") as orders_with_shipping_insurance,
    AVG("shippingInsurance") as avg_shipping_insurance
FROM "PendingBarterPayOrder";

