-- Add coaUrl column to Product table if it doesn't exist
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "coaUrl" TEXT;
