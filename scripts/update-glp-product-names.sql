-- Update GLP product display names in the database
-- GLP-2 TRZ -> Tirze-patide
-- GLP-3 RT -> Reta-trutide

UPDATE "Product" 
SET name = 'Tirze-patide', "updatedAt" = NOW()
WHERE slug IN ('glp-2-trz', 'tirzepatide');

UPDATE "Product" 
SET name = 'Reta-trutide', "updatedAt" = NOW()
WHERE slug IN ('glp-3-rt', 'retatrutide');
