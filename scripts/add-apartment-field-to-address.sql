-- Add apartment field to Address table
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "apartment" TEXT;

