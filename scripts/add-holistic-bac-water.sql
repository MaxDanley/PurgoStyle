-- Add product: Holistic BAC water 0.9% benzyl alcohol
-- Image: /holistic_water.jpg | Price: $29.99 | Stock: 0
-- Run in Supabase SQL Editor (or psql).

-- 1. Insert product (skip if slug already exists)
INSERT INTO "Product" (id, name, slug, description, category, image, "active", "featured", "createdAt", "updatedAt")
SELECT
  'holistic-bac-water-product',
  'Holistic BAC water 0.9% benzyl alcohol',
  'holistic-bac-water',
  'Bacteriostatic water for injection, USP. 0.9% benzyl alcohol. Suitable for reconstitution.',
  'Research',
  '/holistic_water.jpg',
  true,
  false,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Product" WHERE slug = 'holistic-bac-water');

-- 2. Insert single variant: 30 mL, $29.99, 0 stock (skip if SKU exists)
INSERT INTO "ProductVariant" (id, "productId", size, price, "stockCount", sku, "active", "createdAt", "updatedAt")
SELECT
  'holistic-bac-water-variant',
  p.id,
  '30 mL',
  29.99,
  0,
  'HOLISTIC-BAC-30ML',
  true,
  NOW(),
  NOW()
FROM "Product" p
WHERE p.slug = 'holistic-bac-water'
  AND NOT EXISTS (SELECT 1 FROM "ProductVariant" WHERE sku = 'HOLISTIC-BAC-30ML');
