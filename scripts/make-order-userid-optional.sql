-- Make userId optional in Order table to support guest orders
-- This allows orders to be created without a user account

BEGIN;

-- Make userId nullable
ALTER TABLE "Order" 
ALTER COLUMN "userId" DROP NOT NULL;

-- Update foreign key constraint to allow null values
-- Note: PostgreSQL foreign keys can be nullable by default
-- We just need to ensure the constraint allows nulls

COMMIT;

