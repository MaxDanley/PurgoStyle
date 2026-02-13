-- Clean up and seed products with correct IDs
-- This script will:
-- 1. Delete all existing products and variants (CASCADE will handle order items)
-- 2. Insert products with the correct IDs from lib/products.ts
-- 3. Insert all product variants

-- Step 1: Delete all existing data (in correct order to respect foreign keys)
DELETE FROM "OrderItem";
DELETE FROM "ProductVariant";
DELETE FROM "Product";

-- Step 2: Insert all products with correct IDs
INSERT INTO "Product" ("id", "name", "slug", "description", "category", "image", "active", "featured", "createdAt", "updatedAt")
VALUES
  ('1', 'BPC-157', 'bpc-157', 'Body Protection Compound - Research peptide for tissue repair studies', 'Healing & Recovery', '/bpc_final_product.png', true, true, NOW(), NOW()),
  ('2', 'Tirzepatide', 'tirzepatide', 'Dual GIP/GLP-1 receptor agonist for metabolic research', 'Metabolic Research', '/glp2_final_product.png', true, true, NOW(), NOW()),
  ('3', 'Retatrutide', 'retatrutide', 'Triple agonist for advanced metabolic research', 'Metabolic Research', '/glp3_final_product.png', true, true, NOW(), NOW()),
  ('4', 'Glutathione', 'glutathione', 'Master antioxidant for cellular research', 'Antioxidant Research', '/gluta_final_product.png', true, false, NOW(), NOW()),
  ('5', 'Glow Complex', 'glow', 'Skin health research complex with Glutathione, Vitamin C & Biotin', 'Cosmetic Research', '/glow_final_product.png', true, false, NOW(), NOW()),
  ('6', 'Tesamorelin', 'tesamorelin', 'Growth hormone-releasing hormone analog for metabolic research', 'Hormone Research', '/tesa_final_product.png', true, false, NOW(), NOW()),
  ('7', 'IGF-1 LR3', 'igf1lr3', 'Long-acting insulin-like growth factor for cellular research', 'Growth Factor Research', '/lgf_final_product.png', true, true, NOW(), NOW()),
  ('8', 'BAC Water', 'bac-water', 'Bacteriostatic water for peptide reconstitution', 'Accessories', '/bac_final_product.png', true, false, NOW(), NOW());

-- Step 3: Insert all product variants
INSERT INTO "ProductVariant" ("id", "productId", "size", "price", "stockCount", "sku", "active", "createdAt", "updatedAt")
VALUES
  -- BPC-157 variants
  ('bpc-5mg', '1', '5mg', 49.99, 100, 'BPC157-5MG', true, NOW(), NOW()),
  ('bpc-10mg', '1', '10mg', 89.99, 100, 'BPC157-10MG', true, NOW(), NOW()),
  -- Tirzepatide variants
  ('tirz-10mg', '2', '10mg', 199.99, 50, 'TIRZ-10MG', true, NOW(), NOW()),
  ('tirz-15mg', '2', '15mg', 279.99, 50, 'TIRZ-15MG', true, NOW(), NOW()),
  -- Retatrutide variants
  ('reta-10mg', '3', '10mg', 249.99, 30, 'RETA-10MG', true, NOW(), NOW()),
  ('reta-15mg', '3', '15mg', 349.99, 30, 'RETA-15MG', true, NOW(), NOW()),
  ('reta-20mg', '3', '20mg', 449.99, 20, 'RETA-20MG', true, NOW(), NOW()),
  -- Glutathione variants
  ('glut-200mg', '4', '200mg', 39.99, 100, 'GLUT-200MG', true, NOW(), NOW()),
  ('glut-500mg', '4', '500mg', 79.99, 75, 'GLUT-500MG', true, NOW(), NOW()),
  -- Glow Complex variant
  ('glow-combo', '5', 'Complex', 89.99, 50, 'GLOW-COMPLEX', true, NOW(), NOW()),
  -- Tesamorelin variant
  ('tesam-5mg', '6', '5mg', 159.99, 40, 'TESAM-5MG', true, NOW(), NOW()),
  -- IGF-1 LR3 variant
  ('igf-0.1mg', '7', '0.1mg', 79.99, 60, 'IGF1LR3-0.1MG', true, NOW(), NOW()),
  -- BAC Water variant
  ('bac-30ml', '8', '30ml', 10.00, 500, 'BAC-30ML', true, NOW(), NOW());
