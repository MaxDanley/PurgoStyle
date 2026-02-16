-- Add customDesign column to OrderItem for design studio payload (elements, elementsBack, shirtColor, previewImage, etc.)
-- Run this if you get: The column `OrderItem.customDesign` does not exist in the current database.
-- Prisma default table name is the model name (case-sensitive in PostgreSQL).

ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "customDesign" JSONB NULL;
