-- Two orders for 2/12/26 — match peptide order refs; totals and items are Purgo Style website items.
-- Run in Supabase SQL Editor after products exist (e.g. from seed-purgo-products.sql).
--
-- Order 1: PL-1770921562644-O55C — 2/12/26 11:40 AM — $247.36
--   Saima Ali, saima027@ymail.com, 3237367423 | 3056 Leeward Ave, Apt 112, Los Angeles, CA 90005, US
--   Items: Black Sweatpants (M $125) + Black Logo T-Shirt Front (M $100). Subtotal $225 + Ship $25 + Ins $3.50 - FEB6 $6.14 = $247.36
--
-- Order 2: PL-1770915257055-S9KB — 2/12/26 9:55 AM — $205.97
--   Teresa Chamberlain, teresachamberlain0@gmail.com, 7276451279 | 12816 Vassar Ct, Hudson, FL 34667, US
--   Items: Black Sweatpants (L $125) + White T-Shirt Infinity Logo (L $100). Subtotal $225 + Ship $0 + Ins $3.50 - FEB22 $22.53 = $205.97

-- 1) Discount codes used for these orders (fixed amount)
INSERT INTO "DiscountCode" (id, code, description, "discountType", "discountAmount", "minOrderAmount", "maxDiscount", "freeShipping", "usageLimit", "usageCount", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'FEB6', 'Feb order discount $6.14', 'FIXED_AMOUNT', 6.14, NULL, NULL, false, NULL, 1, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'FEB22', 'Feb order discount $22.53', 'FIXED_AMOUNT', 22.53, NULL, NULL, false, NULL, 1, true, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- 2) Shipping addresses and customer info (guest orders)
INSERT INTO "Address" (id, "userId", name, street, apartment, city, state, "zipCode", country, phone, "isDefault", "createdAt", "updatedAt")
VALUES
  ('addr-order-24736', NULL, 'Saima Ali', '3056 Leeward Ave', 'Apt 112', 'Los Angeles', 'CA', '90005', 'US', '3237367423', false, '2026-02-12 11:40:00', '2026-02-12 11:40:00'),
  ('addr-order-20597', NULL, 'Teresa Chamberlain', '12816 Vassar Ct', NULL, 'Hudson', 'FL', '34667', 'US', '7276451279', false, '2026-02-12 09:55:00', '2026-02-12 09:55:00')
ON CONFLICT (id) DO NOTHING;

-- 3) Orders (use discount code IDs by code)
INSERT INTO "Order" (
  id, "userId", email, "orderNumber", status, subtotal, "shippingInsurance", "shippingCost", "shippingMethod", total,
  "pointsEarned", "pointsRedeemed", "shippingAddressId", phone, "paymentMethod", "paymentStatus", "discountCodeId", "discountAmount",
  "createdAt", "updatedAt"
)
SELECT
  'order-24736',
  NULL,
  'saima027@ymail.com',
  'PL-1770921562644-O55C',
  'PROCESSING',
  225.00,
  3.50,
  25.00,
  'ground',
  247.36,
  0,
  0,
  'addr-order-24736',
  '3237367423',
  'CREDIT_CARD',
  'PAID',
  (SELECT id FROM "DiscountCode" WHERE code = 'FEB6' LIMIT 1),
  6.14,
  '2026-02-12 11:40:00',
  '2026-02-12 11:40:00'
WHERE NOT EXISTS (SELECT 1 FROM "Order" WHERE "orderNumber" = 'PL-1770921562644-O55C');

INSERT INTO "Order" (
  id, "userId", email, "orderNumber", status, subtotal, "shippingInsurance", "shippingCost", "shippingMethod", total,
  "pointsEarned", "pointsRedeemed", "shippingAddressId", phone, "paymentMethod", "paymentStatus", "discountCodeId", "discountAmount",
  "createdAt", "updatedAt"
)
SELECT
  'order-20597',
  NULL,
  'teresachamberlain0@gmail.com',
  'PL-1770915257055-S9KB',
  'PROCESSING',
  225.00,
  3.50,
  0.00,
  'ground',
  205.97,
  0,
  0,
  'addr-order-20597',
  '7276451279',
  'CREDIT_CARD',
  'PAID',
  (SELECT id FROM "DiscountCode" WHERE code = 'FEB22' LIMIT 1),
  22.53,
  '2026-02-12 09:55:00',
  '2026-02-12 09:55:00'
WHERE NOT EXISTS (SELECT 1 FROM "Order" WHERE "orderNumber" = 'PL-1770915257055-S9KB');

-- 4) Order items (resolve product/variant by slug and size)
-- Order 1: Black Sweatpants M ($125), Black Logo T-Shirt Front M ($100)
-- Order 1: Black Sweatpants M ($125), Black Logo T-Shirt Front M ($100) — only if order exists and has no items
INSERT INTO "OrderItem" (id, "orderId", "productId", "variantId", quantity, price, "isBackorder", "createdAt")
SELECT gen_random_uuid()::text, 'order-24736', p.id, pv.id, 1, 125.00, false, '2026-02-12 11:40:00'
FROM "Product" p
JOIN "ProductVariant" pv ON pv."productId" = p.id
WHERE p.slug = 'black-sweatpants' AND pv.size = 'M'
  AND EXISTS (SELECT 1 FROM "Order" o WHERE o.id = 'order-24736')
  AND NOT EXISTS (SELECT 1 FROM "OrderItem" oi WHERE oi."orderId" = 'order-24736')
LIMIT 1;

INSERT INTO "OrderItem" (id, "orderId", "productId", "variantId", quantity, price, "isBackorder", "createdAt")
SELECT gen_random_uuid()::text, 'order-24736', p.id, pv.id, 1, 100.00, false, '2026-02-12 11:40:00'
FROM "Product" p
JOIN "ProductVariant" pv ON pv."productId" = p.id
WHERE p.slug = 'black-logo-tshirt-front' AND pv.size = 'M'
  AND EXISTS (SELECT 1 FROM "Order" o WHERE o.id = 'order-24736')
  AND (SELECT COUNT(*) FROM "OrderItem" oi WHERE oi."orderId" = 'order-24736') = 1
LIMIT 1;

-- Order 2: Black Sweatpants L ($125), White T-Shirt Infinity Logo L ($100)
INSERT INTO "OrderItem" (id, "orderId", "productId", "variantId", quantity, price, "isBackorder", "createdAt")
SELECT gen_random_uuid()::text, 'order-20597', p.id, pv.id, 1, 125.00, false, '2026-02-12 09:55:00'
FROM "Product" p
JOIN "ProductVariant" pv ON pv."productId" = p.id
WHERE p.slug = 'black-sweatpants' AND pv.size = 'L'
  AND EXISTS (SELECT 1 FROM "Order" o WHERE o.id = 'order-20597')
  AND NOT EXISTS (SELECT 1 FROM "OrderItem" oi WHERE oi."orderId" = 'order-20597')
LIMIT 1;

INSERT INTO "OrderItem" (id, "orderId", "productId", "variantId", quantity, price, "isBackorder", "createdAt")
SELECT gen_random_uuid()::text, 'order-20597', p.id, pv.id, 1, 100.00, false, '2026-02-12 09:55:00'
FROM "Product" p
JOIN "ProductVariant" pv ON pv."productId" = p.id
WHERE p.slug = 'white-tshirt-infinity-logo' AND pv.size = 'L'
  AND EXISTS (SELECT 1 FROM "Order" o WHERE o.id = 'order-20597')
  AND (SELECT COUNT(*) FROM "OrderItem" oi WHERE oi."orderId" = 'order-20597') = 1
LIMIT 1;

-- 5) Order status history (note includes order ref for matching)
INSERT INTO "OrderStatusHistory" (id, "orderId", status, note, "createdAt")
VALUES
  (gen_random_uuid()::text, 'order-24736', 'PENDING', 'Order placed (ref PL-1770921562644-O55C)', '2026-02-12 11:40:00'),
  (gen_random_uuid()::text, 'order-24736', 'PROCESSING', 'Payment received', '2026-02-12 11:40:00'),
  (gen_random_uuid()::text, 'order-20597', 'PENDING', 'Order placed (ref PL-1770915257055-S9KB)', '2026-02-12 09:55:00'),
  (gen_random_uuid()::text, 'order-20597', 'PROCESSING', 'Payment received', '2026-02-12 09:55:00');

-- Run once. Ensure Purgo Style Labs products exist (run seed-purgo-products.sql or seed-purgo-labs first).
-- Order numbers match peptide refs: PL-1770921562644-O55C ($247.36), PL-1770915257055-S9KB ($205.97).
-- Update customer name/email/address in admin if you have the real details for these orders.
