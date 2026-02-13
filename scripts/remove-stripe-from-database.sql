-- Migration script to remove Stripe-related fields from database
-- This script:
-- 1. Removes stripePaymentId column from Order table
-- 2. Updates existing orders with STRIPE payment method to OTHER

-- Step 1: Update existing orders with STRIPE payment method to OTHER
UPDATE "Order"
SET "paymentMethod" = 'OTHER'
WHERE "paymentMethod" = 'STRIPE';

-- Step 2: Remove stripePaymentId column (if it exists)
-- Note: This will fail if column doesn't exist, which is fine
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'stripePaymentId'
    ) THEN
        ALTER TABLE "Order" DROP COLUMN "stripePaymentId";
    END IF;
END $$;

-- Step 3: Verify the migration
SELECT 
    COUNT(*) as total_orders,
    COUNT(CASE WHEN "paymentMethod" = 'STRIPE' THEN 1 END) as stripe_orders_remaining,
    COUNT(CASE WHEN "paymentMethod" = 'OTHER' THEN 1 END) as other_orders
FROM "Order";

-- Expected: stripe_orders_remaining should be 0

