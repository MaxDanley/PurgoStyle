-- Add isBackorder field to OrderItem table
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "isBackorder" BOOLEAN DEFAULT false;

