-- Add email column to Order table for guest orders
-- This allows guest orders to receive email notifications

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "email" TEXT;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS "Order_email_idx" ON "Order"("email");

-- Note: Existing orders will have NULL email values
-- For guest orders created before this migration, emails cannot be retroactively added
-- New guest orders will have their email saved from shippingInfo.email or metadata.userEmail

