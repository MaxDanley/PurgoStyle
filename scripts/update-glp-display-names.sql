-- Update GLP Product Display Names
-- Change GLP-2 TRZ to Tirzepatide
-- Change GLP-3 RT to Retatrutide
-- Keep slugs the same to preserve URLs

-- ============================================
-- UPDATE GLP-2 TRZ -> Tirzepatide
-- ============================================
UPDATE "Product"
SET 
  name = 'Tirzepatide',
  "updatedAt" = NOW()
WHERE slug = 'glp-2-trz';

-- ============================================
-- UPDATE GLP-3 RT -> Retatrutide
-- ============================================
UPDATE "Product"
SET 
  name = 'Retatrutide',
  "updatedAt" = NOW()
WHERE slug = 'glp-3-rt';

