-- Add 20mg variant for Tirzepatide (Tirze-patide)
-- Product ID: 2
-- SKU: GLP2TRZ-20MG
-- Stock: 10
-- Price: $349.99

INSERT INTO "ProductVariant" (id, "productId", size, price, "stockCount", sku, active, "createdAt", "updatedAt")
VALUES (
  'tirz-20mg',
  '2',
  '20mg',
  349.99,
  10,
  'GLP2TRZ-20MG',
  true,
  NOW(),
  NOW()
) ON CONFLICT (sku) DO UPDATE SET 
  "stockCount" = EXCLUDED."stockCount",
  price = EXCLUDED.price,
  "updatedAt" = NOW();

