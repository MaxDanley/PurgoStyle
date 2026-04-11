-- Fix PayPal fulfillment order totals to match actual amounts paid (2026-04-06 batch).
-- Formula: total = subtotal + "shippingInsurance" + "shippingCost" - "discountAmount"
-- Dylan (PL-PP-FULF-20260406-DYLAN) unchanged at $163.00.
--
-- Isaiah  $52.89  (was $52.00)  → discount 62.79 → 61.90
-- Ali     $86.49  (was $86.00)  → discount 28.97 → 28.48
-- Jed     $131.50 (was $131.00) → discount 134.58 → 134.08
-- James   $128.09 (was $128.00) → discount 12.84 → 12.75

BEGIN;

UPDATE "Order"
SET
  total = 52.89,
  "discountAmount" = 61.90,
  "updatedAt" = NOW()
WHERE "orderNumber" = 'PL-PP-FULF-20260406-ISAIAH';

UPDATE "DiscountCode"
SET
  "discountAmount" = 61.90,
  "updatedAt" = NOW()
WHERE code = 'PP-FULF-20260406-ISAIAH';

UPDATE "Order"
SET
  total = 86.49,
  "discountAmount" = 28.48,
  "updatedAt" = NOW()
WHERE "orderNumber" = 'PL-PP-FULF-20260406-ALI';

UPDATE "DiscountCode"
SET
  "discountAmount" = 28.48,
  "updatedAt" = NOW()
WHERE code = 'PP-FULF-20260406-ALI';

UPDATE "Order"
SET
  total = 131.50,
  "discountAmount" = 134.08,
  "updatedAt" = NOW()
WHERE "orderNumber" = 'PL-PP-FULF-20260406-JED';

UPDATE "DiscountCode"
SET
  "discountAmount" = 134.08,
  "updatedAt" = NOW()
WHERE code = 'PP-FULF-20260406-JED';

UPDATE "Order"
SET
  total = 128.09,
  "discountAmount" = 12.75,
  "updatedAt" = NOW()
WHERE "orderNumber" = 'PL-PP-FULF-20260406-JAMES';

UPDATE "DiscountCode"
SET
  "discountAmount" = 12.75,
  "updatedAt" = NOW()
WHERE code = 'PP-FULF-20260406-JAMES';

COMMIT;

-- Verify (expect 4 rows with new totals; Dylan still 163.00):
-- SELECT "orderNumber", subtotal, "shippingInsurance", "shippingCost", "discountAmount", total
-- FROM "Order"
-- WHERE "orderNumber" LIKE 'PL-PP-FULF-20260406-%'
-- ORDER BY "orderNumber";
