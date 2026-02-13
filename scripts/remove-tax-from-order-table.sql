-- Migration script to remove tax column from Order table
-- This script removes the tax column since it has been replaced by shippingInsurance

-- Step 1: Check if tax column exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'tax'
    ) THEN
        -- Step 2: Make tax column nullable first (if it's NOT NULL)
        ALTER TABLE "Order" ALTER COLUMN "tax" DROP NOT NULL;
        
        -- Step 3: Set all NULL tax values to 0 (safety measure)
        UPDATE "Order" SET "tax" = 0 WHERE "tax" IS NULL;
        
        -- Step 4: Remove the tax column
        ALTER TABLE "Order" DROP COLUMN "tax";
        
        RAISE NOTICE 'Tax column removed from Order table';
    ELSE
        RAISE NOTICE 'Tax column does not exist in Order table - nothing to remove';
    END IF;
END $$;

-- Verify the migration
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'Order'
ORDER BY ordinal_position;

