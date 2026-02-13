-- Add 9 new products starting with 0 stock (backorder status)
-- All products will be available for backorder immediately

-- 11: Sema-glutide
INSERT INTO "Product" (id, name, slug, description, category, image, featured, active, "createdAt", "updatedAt")
VALUES (
  '11',
  'Sema-glutide',
  'sema-glutide',
  'Semaglutide-based peptide for metabolic research and receptor signaling studies',
  'Receptor Agonists',
  '/sema_final_product.png',
  false,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO "ProductVariant" (id, "productId", size, price, "stockCount", sku, active, "createdAt", "updatedAt")
VALUES (
  'sema-10mg',
  '11',
  '10mg',
  49.99,
  0,
  'SEMA-10MG',
  true,
  NOW(),
  NOW()
) ON CONFLICT (sku) DO UPDATE SET "stockCount" = 0, "updatedAt" = NOW();

-- 12: Melatonin II
INSERT INTO "Product" (id, name, slug, description, category, image, featured, active, "createdAt", "updatedAt")
VALUES (
  '12',
  'Melatonin II',
  'melatonin-ii',
  'Advanced melatonin formulation for circadian rhythm and sleep research',
  'Hormone Compounds',
  '/mela2_final_product.png',
  false,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO "ProductVariant" (id, "productId", size, price, "stockCount", sku, active, "createdAt", "updatedAt")
VALUES (
  'mela2-10mg',
  '12',
  '10mg',
  34.99,
  0,
  'MELA2-10MG',
  true,
  NOW(),
  NOW()
) ON CONFLICT (sku) DO UPDATE SET "stockCount" = 0, "updatedAt" = NOW();

-- 13: KLOW
INSERT INTO "Product" (id, name, slug, description, category, image, featured, active, "createdAt", "updatedAt")
VALUES (
  '13',
  'KLOW',
  'klow',
  'KLOW peptide (80mg) for advanced research applications',
  'Research Compounds',
  '/kglow_final_product.png',
  false,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO "ProductVariant" (id, "productId", size, price, "stockCount", sku, active, "createdAt", "updatedAt")
VALUES (
  'klow-80mg',
  '13',
  '80mg',
  159.99,
  0,
  'KLOW-80MG',
  true,
  NOW(),
  NOW()
) ON CONFLICT (sku) DO UPDATE SET "stockCount" = 0, "updatedAt" = NOW();

-- 14: Semax
INSERT INTO "Product" (id, name, slug, description, category, image, featured, active, "createdAt", "updatedAt")
VALUES (
  '14',
  'Semax',
  'semax',
  'Heptapeptide (Met-Glu-His-Phe-Pro-Gly-Pro) for cognitive and neuroprotective research',
  'Neuropeptides',
  '/semax_final_product.png',
  false,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO "ProductVariant" (id, "productId", size, price, "stockCount", sku, active, "createdAt", "updatedAt")
VALUES (
  'semax-10mg',
  '14',
  '10mg',
  34.99,
  0,
  'SEMAX-10MG',
  true,
  NOW(),
  NOW()
) ON CONFLICT (sku) DO UPDATE SET "stockCount" = 0, "updatedAt" = NOW();

-- 15: VIP
INSERT INTO "Product" (id, name, slug, description, category, image, featured, active, "createdAt", "updatedAt")
VALUES (
  '15',
  'VIP',
  'vip',
  'Vasoactive Intestinal Peptide (28-amino-acid) for neuroendocrine and vascular research',
  'Neuropeptides',
  '/vip_final_product.png',
  false,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO "ProductVariant" (id, "productId", size, price, "stockCount", sku, active, "createdAt", "updatedAt")
VALUES (
  'vip-10mg',
  '15',
  '10mg',
  59.99,
  0,
  'VIP-10MG',
  true,
  NOW(),
  NOW()
) ON CONFLICT (sku) DO UPDATE SET "stockCount" = 0, "updatedAt" = NOW();

-- 16: NAD+
INSERT INTO "Product" (id, name, slug, description, category, image, featured, active, "createdAt", "updatedAt")
VALUES (
  '16',
  'NAD+',
  'nad-plus',
  'Nicotinamide Adenine Dinucleotide (500mg) for cellular energy and metabolism research',
  'Metabolic Compounds',
  '/nad_final_product.png',
  false,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO "ProductVariant" (id, "productId", size, price, "stockCount", sku, active, "createdAt", "updatedAt")
VALUES (
  'nad-500mg',
  '16',
  '500mg',
  59.99,
  0,
  'NAD-500MG',
  true,
  NOW(),
  NOW()
) ON CONFLICT (sku) DO UPDATE SET "stockCount" = 0, "updatedAt" = NOW();

-- 17: SS-31
INSERT INTO "Product" (id, name, slug, description, category, image, featured, active, "createdAt", "updatedAt")
VALUES (
  '17',
  'SS-31',
  'ss-31',
  'Mitochondrial-targeted tetrapeptide (D-Arg-Dmt-Lys-Phe-NH2) for cellular protection research',
  'Mitochondrial Compounds',
  '/ss31_final_product.png',
  false,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO "ProductVariant" (id, "productId", size, price, "stockCount", sku, active, "createdAt", "updatedAt")
VALUES (
  'ss31-10mg',
  '17',
  '10mg',
  56.99,
  0,
  'SS31-10MG',
  true,
  NOW(),
  NOW()
) ON CONFLICT (sku) DO UPDATE SET "stockCount" = 0, "updatedAt" = NOW();

-- 18: Selank
INSERT INTO "Product" (id, name, slug, description, category, image, featured, active, "createdAt", "updatedAt")
VALUES (
  '18',
  'Selank',
  'selank',
  'Heptapeptide (Thr-Lys-Pro-Arg-Pro-Gly-Pro) for anxiolytic and cognitive research',
  'Neuropeptides',
  '/selank_final_product.png',
  false,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO "ProductVariant" (id, "productId", size, price, "stockCount", sku, active, "createdAt", "updatedAt")
VALUES (
  'selank-10mg',
  '18',
  '10mg',
  34.99,
  0,
  'SELANK-10MG',
  true,
  NOW(),
  NOW()
) ON CONFLICT (sku) DO UPDATE SET "stockCount" = 0, "updatedAt" = NOW();

-- 19: Wolverine
INSERT INTO "Product" (id, name, slug, description, category, image, featured, active, "createdAt", "updatedAt")
VALUES (
  '19',
  'Wolverine',
  'wolverine',
  'Dual peptide complex (TB-500 + BPC-157) for advanced tissue repair and recovery research',
  'Research Compounds',
  '/wolverine_final_product.png',
  false,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO "ProductVariant" (id, "productId", size, price, "stockCount", sku, active, "createdAt", "updatedAt")
VALUES (
  'wolverine-10mg',
  '19',
  '10mg, 10mg',
  109.99,
  0,
  'WOLVERINE-10MG',
  true,
  NOW(),
  NOW()
) ON CONFLICT (sku) DO UPDATE SET "stockCount" = 0, "updatedAt" = NOW();

