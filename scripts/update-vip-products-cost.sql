-- Update acquired costs for VIP products
-- This is the cost you pay to purchase these products (wholesale cost)

-- VIP - $150 for 10 vials
UPDATE "ProductVariant" SET "acquiredCost" = 150.00 WHERE "sku" = 'VIP-10V';

-- Semax 10mg - $65 for 10 vials
UPDATE "ProductVariant" SET "acquiredCost" = 65.00 WHERE "sku" = 'SEMAX-10MG-10V';

-- Selank 10mg - $65 for 10 vials
UPDATE "ProductVariant" SET "acquiredCost" = 65.00 WHERE "sku" = 'SELANK-10MG-10V';

-- MT2 - $40 for 10 vials
UPDATE "ProductVariant" SET "acquiredCost" = 40.00 WHERE "sku" = 'MT2-10V';

-- NAD+ 500mg - $65 for 10 vials
UPDATE "ProductVariant" SET "acquiredCost" = 65.00 WHERE "sku" = 'NAD-500MG-10V';

-- Wolverine 10mg - $175 for 10 vials
UPDATE "ProductVariant" SET "acquiredCost" = 175.00 WHERE "sku" = 'WOLVERINE-10MG-10V';

-- Semaglutide 10mg - $50 for 10 vials
UPDATE "ProductVariant" SET "acquiredCost" = 50.00 WHERE "sku" = 'SEMAGLUTIDE-10MG-10V';

-- SS31 - $82 for 10 vials
UPDATE "ProductVariant" SET "acquiredCost" = 82.00 WHERE "sku" = 'SS31-10V';

-- KLOW - $192 for 10 vials
UPDATE "ProductVariant" SET "acquiredCost" = 192.00 WHERE "sku" = 'KLOW-10V';
