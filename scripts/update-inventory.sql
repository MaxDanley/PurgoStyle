-- Update stock counts for existing products/variants based on inventory codes
-- This preserves all existing data (COAs, prices, etc.) and only updates stock counts

-- BPC-157 Variants
UPDATE "ProductVariant" 
SET "stockCount" = 10, "updatedAt" = NOW() 
WHERE sku = 'BPC157-5MG' AND "productId" = '1';

UPDATE "ProductVariant" 
SET "stockCount" = 10, "updatedAt" = NOW() 
WHERE sku = 'BPC157-10MG' AND "productId" = '1';

-- Tirzepatide Variants
UPDATE "ProductVariant" 
SET "stockCount" = 20, "updatedAt" = NOW() 
WHERE sku = 'TIRZ-10MG' AND "productId" = '2';

UPDATE "ProductVariant" 
SET "stockCount" = 20, "updatedAt" = NOW() 
WHERE sku = 'TIRZ-15MG' AND "productId" = '2';

-- Retatrutide Variants
UPDATE "ProductVariant" 
SET "stockCount" = 20, "updatedAt" = NOW() 
WHERE sku = 'RETA-10MG' AND "productId" = '3';

UPDATE "ProductVariant" 
SET "stockCount" = 20, "updatedAt" = NOW() 
WHERE sku = 'RETA-15MG' AND "productId" = '3';

UPDATE "ProductVariant" 
SET "stockCount" = 10, "updatedAt" = NOW() 
WHERE sku = 'RETA-20MG' AND "productId" = '3';

-- Glutathione Variants (mapping to 600mg and 1500mg)
-- Note: Existing variants are 200mg and 500mg, but inventory shows 600mg and 1500mg
-- We'll update the 200mg to 600mg and 500mg to 1500mg
UPDATE "ProductVariant" 
SET "stockCount" = 20, "size" = '600mg', sku = 'GLUT-600MG', "updatedAt" = NOW() 
WHERE sku = 'GLUT-200MG' AND "productId" = '4';

UPDATE "ProductVariant" 
SET "stockCount" = 10, "size" = '1500mg', sku = 'GLUT-1500MG', "updatedAt" = NOW() 
WHERE sku = 'GLUT-500MG' AND "productId" = '4';

-- Glow Complex (BB670/BBG70)
UPDATE "ProductVariant" 
SET "stockCount" = 10, "updatedAt" = NOW() 
WHERE sku = 'GLOW-COMPLEX' AND "productId" = '5';

-- Tesamorelin
UPDATE "ProductVariant" 
SET "stockCount" = 10, "updatedAt" = NOW() 
WHERE sku = 'TESAM-5MG' AND "productId" = '6';

-- IGF-1 LR3
UPDATE "ProductVariant" 
SET "stockCount" = 10, "updatedAt" = NOW() 
WHERE sku = 'IGF1LR3-0.1MG' AND "productId" = '7';

-- BAC Water - Update to 10ml (remove old 30ml variant)
UPDATE "ProductVariant" 
SET "stockCount" = 150, "size" = '10ml', sku = 'BAC-10ML', price = 8.00, "updatedAt" = NOW() 
WHERE sku = 'BAC-30ML' AND "productId" = '8';

-- If 30ml doesn't exist and we need to insert 10ml as new
INSERT INTO "ProductVariant" (id, "productId", size, price, "stockCount", sku, active, "createdAt", "updatedAt")
VALUES (
  'bac-10ml',
  '8',
  '10ml',
  8.00,
  150,
  'BAC-10ML',
  true,
  NOW(),
  NOW()
) ON CONFLICT (sku) DO UPDATE SET "stockCount" = 150, size = '10ml', "updatedAt" = NOW();

-- ============================================
-- NEW PRODUCTS TO ADD
-- ============================================

-- 10: MOTS-c
INSERT INTO "Product" (id, name, slug, description, category, image, featured, active, "createdAt", "updatedAt")
VALUES (
  '10',
  'MOTS-c',
  'mots-c',
  'MOTS-c (Mitochondrial Open Reading Frame of 12S rRNA-c) is a small mitochondrial peptide that has been studied for its role in metabolic regulation and cellular signaling. Research suggests potential applications in metabolic health, aging, and cellular function studies.',
  'Metabolic Research',
  '/motsc_final_product.png',
  false,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add MOTS-c variants (10mg and 40mg)
INSERT INTO "ProductVariant" (id, "productId", size, price, "stockCount", sku, active, "createdAt", "updatedAt")
VALUES 
  ('mots-10mg', '10', '10mg', 55.00, 10, 'MOTS-10MG', true, NOW(), NOW()),
  ('mots-40mg', '10', '40mg', 95.00, 10, 'MOTS-40MG', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET "stockCount" = EXCLUDED."stockCount", "updatedAt" = NOW();

-- 9: Melatonin
INSERT INTO "Product" (id, name, slug, description, category, image, featured, active, "createdAt", "updatedAt")
VALUES (
  '9',
  'Melatonin',
  'melatonin',
  'Melatonin is a hormone produced by the pineal gland that regulates circadian rhythm and sleep-wake cycles. Extensively studied in sleep research, chronobiology, and circadian rhythm studies. High purity formulation suitable for laboratory research.',
  'Hormone Research',
  '/mela_final_product.png',
  false,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add Melatonin variant
INSERT INTO "ProductVariant" (id, "productId", size, price, "stockCount", sku, active, "createdAt", "updatedAt")
VALUES (
  'mela-10mg',
  '9',
  '10mg',
  24.99,
  20,
  'MELA-10MG',
  true,
  NOW(),
  NOW()
) ON CONFLICT (sku) DO UPDATE SET "stockCount" = 20, "updatedAt" = NOW();

-- Update prices to competitive list
UPDATE "ProductVariant" SET price = 38.00, "updatedAt" = NOW() WHERE sku = 'BPC157-5MG' AND "productId" = '1';
UPDATE "ProductVariant" SET price = 50.00, "updatedAt" = NOW() WHERE sku = 'BPC157-10MG' AND "productId" = '1';

UPDATE "ProductVariant" SET price = 130.00, "updatedAt" = NOW() WHERE sku = 'TIRZ-10MG' AND "productId" = '2';
UPDATE "ProductVariant" SET price = 175.00, "updatedAt" = NOW() WHERE sku = 'TIRZ-15MG' AND "productId" = '2';

UPDATE "ProductVariant" SET price = 140.00, "updatedAt" = NOW() WHERE sku = 'RETA-10MG' AND "productId" = '3';
UPDATE "ProductVariant" SET price = 155.00, "updatedAt" = NOW() WHERE sku = 'RETA-15MG' AND "productId" = '3';
UPDATE "ProductVariant" SET price = 210.00, "updatedAt" = NOW() WHERE sku = 'RETA-20MG' AND "productId" = '3';

UPDATE "ProductVariant" SET price = 60.00, "updatedAt" = NOW() WHERE sku = 'GLUT-600MG' AND "productId" = '4';
UPDATE "ProductVariant" SET price = 70.00, "updatedAt" = NOW() WHERE sku = 'GLUT-1500MG' AND "productId" = '4';

UPDATE "ProductVariant" SET price = 40.00, "updatedAt" = NOW() WHERE sku = 'TESAM-5MG' AND "productId" = '6';

UPDATE "ProductVariant" SET price = 45.00, "updatedAt" = NOW() WHERE sku = 'IGF1LR3-0.1MG' AND "productId" = '7';

UPDATE "ProductVariant" SET price = 90.00, "updatedAt" = NOW() WHERE sku = 'GLOW-COMPLEX' AND "productId" = '5';


