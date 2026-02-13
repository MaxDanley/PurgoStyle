-- Add new VIP products to the database
-- Run this script to add the new products with their variants

-- VIP Product - $150 for 10 vials
INSERT INTO "Product" ("id", "name", "slug", "description", "category", "image", "active", "featured", "createdAt", "updatedAt")
VALUES 
  ('vip-product', 'VIP', 'vip', 'VIP product for research use', 'VIP Products', '/vip_product.png', true, false, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "slug" = EXCLUDED."slug",
  "description" = EXCLUDED."description",
  "category" = EXCLUDED."category",
  "image" = EXCLUDED."image",
  "updatedAt" = NOW();

INSERT INTO "ProductVariant" ("id", "productId", "size", "price", "stockCount", "sku", "active", "createdAt", "updatedAt")
VALUES 
  ('vip-10vials', 'vip-product', '10 vials', 150.00, 0, 'VIP-10V', true, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
  "size" = EXCLUDED."size",
  "price" = EXCLUDED."price",
  "stockCount" = EXCLUDED."stockCount",
  "sku" = EXCLUDED."sku",
  "updatedAt" = NOW();

-- Semax 10mg - $65 for 10 vials
INSERT INTO "Product" ("id", "name", "slug", "description", "category", "image", "active", "featured", "createdAt", "updatedAt")
VALUES 
  ('semax-10mg', 'Semax', 'semax', 'Semax 10mg for research use', 'Cognitive Research', '/semax_product.png', true, false, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "slug" = EXCLUDED."slug",
  "description" = EXCLUDED."description",
  "category" = EXCLUDED."category",
  "image" = EXCLUDED."image",
  "updatedAt" = NOW();

INSERT INTO "ProductVariant" ("id", "productId", "size", "price", "stockCount", "sku", "active", "createdAt", "updatedAt")
VALUES 
  ('semax-10mg-10v', 'semax-10mg', '10mg - 10 vials', 65.00, 0, 'SEMAX-10MG-10V', true, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
  "size" = EXCLUDED."size",
  "price" = EXCLUDED."price",
  "stockCount" = EXCLUDED."stockCount",
  "sku" = EXCLUDED."sku",
  "updatedAt" = NOW();

-- Selank 10mg - $65 for 10 vials
INSERT INTO "Product" ("id", "name", "slug", "description", "category", "image", "active", "featured", "createdAt", "updatedAt")
VALUES 
  ('selank-10mg', 'Selank', 'selank', 'Selank 10mg for research use', 'Cognitive Research', '/selank_product.png', true, false, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "slug" = EXCLUDED."slug",
  "description" = EXCLUDED."description",
  "category" = EXCLUDED."category",
  "image" = EXCLUDED."image",
  "updatedAt" = NOW();

INSERT INTO "ProductVariant" ("id", "productId", "size", "price", "stockCount", "sku", "active", "createdAt", "updatedAt")
VALUES 
  ('selank-10mg-10v', 'selank-10mg', '10mg - 10 vials', 65.00, 0, 'SELANK-10MG-10V', true, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
  "size" = EXCLUDED."size",
  "price" = EXCLUDED."price",
  "stockCount" = EXCLUDED."stockCount",
  "sku" = EXCLUDED."sku",
  "updatedAt" = NOW();

-- MT2 - $40 for 10 vials
INSERT INTO "Product" ("id", "name", "slug", "description", "category", "image", "active", "featured", "createdAt", "updatedAt")
VALUES 
  ('mt2', 'MT2', 'mt2', 'MT2 for research use', 'Hormone Research', '/mt2_product.png', true, false, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "slug" = EXCLUDED."slug",
  "description" = EXCLUDED."description",
  "category" = EXCLUDED."category",
  "image" = EXCLUDED."image",
  "updatedAt" = NOW();

INSERT INTO "ProductVariant" ("id", "productId", "size", "price", "stockCount", "sku", "active", "createdAt", "updatedAt")
VALUES 
  ('mt2-10v', 'mt2', '10 vials', 40.00, 0, 'MT2-10V', true, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
  "size" = EXCLUDED."size",
  "price" = EXCLUDED."price",
  "stockCount" = EXCLUDED."stockCount",
  "sku" = EXCLUDED."sku",
  "updatedAt" = NOW();

-- NAD+ 500mg - $65 for 10 vials
INSERT INTO "Product" ("id", "name", "slug", "description", "category", "image", "active", "featured", "createdAt", "updatedAt")
VALUES 
  ('nad-plus-500mg', 'NAD+', 'nad-plus', 'NAD+ 500mg for research use', 'Metabolic Research', '/nad_plus_product.png', true, false, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "slug" = EXCLUDED."slug",
  "description" = EXCLUDED."description",
  "category" = EXCLUDED."category",
  "image" = EXCLUDED."image",
  "updatedAt" = NOW();

INSERT INTO "ProductVariant" ("id", "productId", "size", "price", "stockCount", "sku", "active", "createdAt", "updatedAt")
VALUES 
  ('nad-plus-500mg-10v', 'nad-plus-500mg', '500mg - 10 vials', 65.00, 0, 'NAD-500MG-10V', true, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
  "size" = EXCLUDED."size",
  "price" = EXCLUDED."price",
  "stockCount" = EXCLUDED."stockCount",
  "sku" = EXCLUDED."sku",
  "updatedAt" = NOW();

-- Wolverine 10mg - $175 for 10 vials
INSERT INTO "Product" ("id", "name", "slug", "description", "category", "image", "active", "featured", "createdAt", "updatedAt")
VALUES 
  ('wolverine-10mg', 'Wolverine', 'wolverine', 'Wolverine 10mg for research use', 'Growth Factor Research', '/wolverine_product.png', true, false, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "slug" = EXCLUDED."slug",
  "description" = EXCLUDED."description",
  "category" = EXCLUDED."category",
  "image" = EXCLUDED."image",
  "updatedAt" = NOW();

INSERT INTO "ProductVariant" ("id", "productId", "size", "price", "stockCount", "sku", "active", "createdAt", "updatedAt")
VALUES 
  ('wolverine-10mg-10v', 'wolverine-10mg', '10mg - 10 vials', 175.00, 0, 'WOLVERINE-10MG-10V', true, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
  "size" = EXCLUDED."size",
  "price" = EXCLUDED."price",
  "stockCount" = EXCLUDED."stockCount",
  "sku" = EXCLUDED."sku",
  "updatedAt" = NOW();

-- Semaglutide 10mg - $50 for 10 vials
INSERT INTO "Product" ("id", "name", "slug", "description", "category", "image", "active", "featured", "createdAt", "updatedAt")
VALUES 
  ('semaglutide-10mg', 'Semaglutide', 'semaglutide', 'Semaglutide 10mg for research use', 'Metabolic Research', '/semaglutide_product.png', true, false, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "slug" = EXCLUDED."slug",
  "description" = EXCLUDED."description",
  "category" = EXCLUDED."category",
  "image" = EXCLUDED."image",
  "updatedAt" = NOW();

INSERT INTO "ProductVariant" ("id", "productId", "size", "price", "stockCount", "sku", "active", "createdAt", "updatedAt")
VALUES 
  ('semaglutide-10mg-10v', 'semaglutide-10mg', '10mg - 10 vials', 50.00, 0, 'SEMAGLUTIDE-10MG-10V', true, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
  "size" = EXCLUDED."size",
  "price" = EXCLUDED."price",
  "stockCount" = EXCLUDED."stockCount",
  "sku" = EXCLUDED."sku",
  "updatedAt" = NOW();

-- SS31 - $82 for 10 vials
INSERT INTO "Product" ("id", "name", "slug", "description", "category", "image", "active", "featured", "createdAt", "updatedAt")
VALUES 
  ('ss31', 'SS31', 'ss31', 'SS31 for research use', 'Mitochondrial Research', '/ss31_product.png', true, false, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "slug" = EXCLUDED."slug",
  "description" = EXCLUDED."description",
  "category" = EXCLUDED."category",
  "image" = EXCLUDED."image",
  "updatedAt" = NOW();

INSERT INTO "ProductVariant" ("id", "productId", "size", "price", "stockCount", "sku", "active", "createdAt", "updatedAt")
VALUES 
  ('ss31-10v', 'ss31', '10 vials', 82.00, 0, 'SS31-10V', true, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
  "size" = EXCLUDED."size",
  "price" = EXCLUDED."price",
  "stockCount" = EXCLUDED."stockCount",
  "sku" = EXCLUDED."sku",
  "updatedAt" = NOW();

-- KLOW - $192 for 10 vials
INSERT INTO "Product" ("id", "name", "slug", "description", "category", "image", "active", "featured", "createdAt", "updatedAt")
VALUES 
  ('klow', 'KLOW', 'klow', 'KLOW for research use', 'VIP Products', '/klow_product.png', true, false, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "slug" = EXCLUDED."slug",
  "description" = EXCLUDED."description",
  "category" = EXCLUDED."category",
  "image" = EXCLUDED."image",
  "updatedAt" = NOW();

INSERT INTO "ProductVariant" ("id", "productId", "size", "price", "stockCount", "sku", "active", "createdAt", "updatedAt")
VALUES 
  ('klow-10v', 'klow', '10 vials', 192.00, 0, 'KLOW-10V', true, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
  "size" = EXCLUDED."size",
  "price" = EXCLUDED."price",
  "stockCount" = EXCLUDED."stockCount",
  "sku" = EXCLUDED."sku",
  "updatedAt" = NOW();
