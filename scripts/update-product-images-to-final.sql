-- Update all product images to use the new _final_product.png versions
-- This script updates the database to match the new image files

UPDATE "Product" 
SET image = '/bpc_final_product.png', "updatedAt" = NOW()
WHERE slug IN ('bpc-157');

UPDATE "Product" 
SET image = '/glp2_final_product.png', "updatedAt" = NOW()
WHERE slug IN ('glp-2-trz', 'tirzepatide');

UPDATE "Product" 
SET image = '/glp3_final_product.png', "updatedAt" = NOW()
WHERE slug IN ('glp-3-rt', 'retatrutide');

UPDATE "Product" 
SET image = '/gluta_final_product.png', "updatedAt" = NOW()
WHERE slug = 'glutathione';

UPDATE "Product" 
SET image = '/glow_final_product.png', "updatedAt" = NOW()
WHERE slug = 'glow';

UPDATE "Product" 
SET image = '/tesa_final_product.png', "updatedAt" = NOW()
WHERE slug = 'tesamorelin';

UPDATE "Product" 
SET image = '/lgf_final_product.png', "updatedAt" = NOW()
WHERE slug = 'igf1lr3';

UPDATE "Product" 
SET image = '/motsc_final_product.png', "updatedAt" = NOW()
WHERE slug = 'mots-c';

UPDATE "Product" 
SET image = '/bac_final_product.png', "updatedAt" = NOW()
WHERE slug = 'bac-water';

UPDATE "Product" 
SET image = '/mela_final_product.png', "updatedAt" = NOW()
WHERE slug = 'melatonin';

