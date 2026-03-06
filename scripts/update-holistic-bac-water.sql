-- Update Holistic BAC water product (stock, price, etc.)
-- Run in Supabase SQL Editor (or psql).

-- Update stock (example: set to 50)
-- UPDATE "ProductVariant" SET "stockCount" = 50, "updatedAt" = NOW() WHERE sku = 'HOLISTIC-BAC-30ML';

-- Update price (example: set to 34.99)
-- UPDATE "ProductVariant" SET price = 34.99, "updatedAt" = NOW() WHERE sku = 'HOLISTIC-BAC-30ML';

-- Update product name or image
-- UPDATE "Product" SET name = 'Holistic BAC water 0.9% benzyl alcohol', image = '/holistic_water.jpg', "updatedAt" = NOW() WHERE slug = 'holistic-bac-water';

-- Deactivate product (hide from store)
-- UPDATE "Product" SET "active" = false, "updatedAt" = NOW() WHERE slug = 'holistic-bac-water';

-- Set stock to a specific value (uncomment and change 0 to desired quantity):
-- UPDATE "ProductVariant" SET "stockCount" = 0, "updatedAt" = NOW() WHERE sku = 'HOLISTIC-BAC-30ML';
