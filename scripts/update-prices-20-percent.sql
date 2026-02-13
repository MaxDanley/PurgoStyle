-- Update all product variant prices with 20% discount (multiply by 0.8)
-- This decreases all prices by 20% site-wide
-- The original higher prices will be shown crossed out in the UI

UPDATE "ProductVariant"
SET price = ROUND((price::numeric * 0.8)::numeric, 2)::double precision,
    "updatedAt" = NOW();

