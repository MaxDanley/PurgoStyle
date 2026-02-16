-- Add Custom T-Shirt product for Design Studio orders.
-- Run in Supabase SQL Editor (or psql). Replace /placeholder.svg with your image path if needed.

-- 1. Insert product (skip if slug already exists)
INSERT INTO "Product" (id, name, slug, description, category, image, "active", "featured", "createdAt", "updatedAt")
SELECT
  'custom-tee-product-id',
  'Custom T-Shirt',
  'custom-tee',
  'Custom designed t-shirt from the Design Studio. Your design, your style.',
  'Custom',
  '/placeholder.svg',
  true,
  false,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Product" WHERE slug = 'custom-tee');

-- 2. Insert variants for the custom-tee product (skip if SKU exists)
INSERT INTO "ProductVariant" (id, "productId", size, price, "stockCount", sku, "active", "createdAt", "updatedAt")
SELECT
  'ctee-' || s.size || '-' || substr(md5(random()::text), 1, 8),
  p.id,
  s.size,
  29.99,
  999,
  'CUSTOM-TEE-' || s.size,
  true,
  NOW(),
  NOW()
FROM "Product" p
CROSS JOIN (VALUES ('S'), ('M'), ('L'), ('XL'), ('2XL')) AS s(size)
WHERE p.slug = 'custom-tee'
  AND NOT EXISTS (SELECT 1 FROM "ProductVariant" WHERE sku = 'CUSTOM-TEE-' || s.size);
