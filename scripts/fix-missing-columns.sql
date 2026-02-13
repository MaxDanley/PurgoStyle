-- Simple migration to add missing columns to Order table
-- Run this directly in your database

-- Add shippingMethod column
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingMethod" TEXT NOT NULL DEFAULT 'ground';

-- Add pointsEarned column  
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "pointsEarned" INTEGER NOT NULL DEFAULT 0;

-- Add pointsRedeemed column
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "pointsRedeemed" INTEGER NOT NULL DEFAULT 0;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'Order' 
AND column_name IN ('shippingMethod', 'pointsEarned', 'pointsRedeemed');
