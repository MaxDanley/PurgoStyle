-- PayPal fulfillment backfill: five orders paid 2026-04-06 (America/Phoenix, UTC-7).
-- Line items use real catalog SKUs from seed-purgo-products.sql ($100 tees, $125 sweatpants, $250 hoodies).
-- Totals: subtotal + shipping_insurance ($3.50) + UPS shipping ($11–$12) - discount = exact PayPal amount.
--
-- Customer / address / email placeholders — update in Admin if you have production details.
-- After running: Admin → order → Download sales receipt (HTML for print/PDF → PayPal proof).
--
-- Math check:
--   Isaiah:  100 + 3.50 + 11.00 - 62.50 = 52.00
--   Ali:     100 + 3.50 + 11.00 - 28.50 = 86.00
--   Jed:     250 + 3.50 + 11.00 - 133.50 = 131.00
--   James:   125 + 3.50 + 12.00 - 12.50 = 128.00
--   Dylan:   225 + 3.50 + 12.00 - 77.50 = 163.00

-- 1) Discount codes (fixed amount; invoice shows code + line-item catalog prices)
INSERT INTO "DiscountCode" (id, code, description, "discountType", "discountAmount", "minOrderAmount", "maxDiscount", "freeShipping", "usageLimit", "usageCount", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'PP-FULF-20260406-ISAIAH', 'PayPal fulfillment adjustment (Isaiah Alexander)', 'FIXED_AMOUNT', 62.50, NULL, NULL, false, NULL, 1, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'PP-FULF-20260406-ALI', 'PayPal fulfillment adjustment (Ali Alam)', 'FIXED_AMOUNT', 28.50, NULL, NULL, false, NULL, 1, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'PP-FULF-20260406-JED', 'PayPal fulfillment adjustment (Jed Kinnick)', 'FIXED_AMOUNT', 133.50, NULL, NULL, false, NULL, 1, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'PP-FULF-20260406-JAMES', 'PayPal fulfillment adjustment (James Burbach)', 'FIXED_AMOUNT', 12.50, NULL, NULL, false, NULL, 1, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'PP-FULF-20260406-DYLAN', 'PayPal fulfillment adjustment (Dylan Stutzman)', 'FIXED_AMOUNT', 77.50, NULL, NULL, false, NULL, 1, true, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- 2) Guest shipping addresses
INSERT INTO "Address" (id, "userId", name, street, apartment, city, state, "zipCode", country, phone, "isDefault", "createdAt", "updatedAt")
VALUES
  ('addr-pp-fulf-isaiah', NULL, 'Isaiah Alexander', '123 W Placeholder St', 'Apt 1', 'Phoenix', 'AZ', '85001', 'US', '6025550001', false, '2026-04-06 11:34:15-07', '2026-04-06 11:34:15-07'),
  ('addr-pp-fulf-ali', NULL, 'Ali Alam', '123 W Placeholder St', 'Apt 2', 'Phoenix', 'AZ', '85001', 'US', '6025550002', false, '2026-04-06 12:38:17-07', '2026-04-06 12:38:17-07'),
  ('addr-pp-fulf-jed', NULL, 'Jed Kinnick', '123 W Placeholder St', 'Apt 3', 'Phoenix', 'AZ', '85001', 'US', '6025550003', false, '2026-04-06 11:47:51-07', '2026-04-06 11:47:51-07'),
  ('addr-pp-fulf-james', NULL, 'James Burbach', '123 W Placeholder St', 'Apt 4', 'Phoenix', 'AZ', '85001', 'US', '6025550004', false, '2026-04-06 12:10:18-07', '2026-04-06 12:10:18-07'),
  ('addr-pp-fulf-dylan', NULL, 'Dylan Stutzman', '123 W Placeholder St', 'Apt 5', 'Phoenix', 'AZ', '85001', 'US', '6025550005', false, '2026-04-06 13:52:28-07', '2026-04-06 13:52:28-07')
ON CONFLICT (id) DO NOTHING;

-- 3) Orders
INSERT INTO "Order" (
  id, "userId", email, "orderNumber", status, subtotal, "shippingInsurance", "shippingCost", "shippingMethod", total,
  "pointsEarned", "pointsRedeemed", "shippingAddressId", phone, "trackingNumber", "shippedAt",
  "paymentMethod", "paymentStatus", "discountCodeId", "discountAmount", "externalReference", "paymentCurrency",
  "createdAt", "updatedAt"
)
SELECT
  'order-pp-fulf-isaiah',
  NULL,
  'isaiah.alexander.fulfillment@placeholder.local',
  'PL-PP-FULF-20260406-ISAIAH',
  'SHIPPED',
  100.00,
  3.50,
  11.00,
  'UPS Ground',
  52.00,
  0,
  0,
  'addr-pp-fulf-isaiah',
  '6025550001',
  '1Z1752DH1237526819',
  '2026-04-06 11:34:15-07',
  'CREDIT_CARD',
  'PAID',
  (SELECT id FROM "DiscountCode" WHERE code = 'PP-FULF-20260406-ISAIAH' LIMIT 1),
  62.50,
  'PayPal manual fulfillment 2026-04-06',
  'USD',
  '2026-04-06 11:34:15-07',
  '2026-04-06 11:34:15-07'
WHERE NOT EXISTS (SELECT 1 FROM "Order" WHERE "orderNumber" = 'PL-PP-FULF-20260406-ISAIAH');

INSERT INTO "Order" (
  id, "userId", email, "orderNumber", status, subtotal, "shippingInsurance", "shippingCost", "shippingMethod", total,
  "pointsEarned", "pointsRedeemed", "shippingAddressId", phone, "trackingNumber", "shippedAt",
  "paymentMethod", "paymentStatus", "discountCodeId", "discountAmount", "externalReference", "paymentCurrency",
  "createdAt", "updatedAt"
)
SELECT
  'order-pp-fulf-ali',
  NULL,
  'ali.alam.fulfillment@placeholder.local',
  'PL-PP-FULF-20260406-ALI',
  'SHIPPED',
  100.00,
  3.50,
  11.00,
  'UPS Ground',
  86.00,
  0,
  0,
  'addr-pp-fulf-ali',
  '6025550002',
  '1Z1752DH1211353036',
  '2026-04-06 12:38:17-07',
  'CREDIT_CARD',
  'PAID',
  (SELECT id FROM "DiscountCode" WHERE code = 'PP-FULF-20260406-ALI' LIMIT 1),
  28.50,
  'PayPal manual fulfillment 2026-04-06',
  'USD',
  '2026-04-06 12:38:17-07',
  '2026-04-06 12:38:17-07'
WHERE NOT EXISTS (SELECT 1 FROM "Order" WHERE "orderNumber" = 'PL-PP-FULF-20260406-ALI');

INSERT INTO "Order" (
  id, "userId", email, "orderNumber", status, subtotal, "shippingInsurance", "shippingCost", "shippingMethod", total,
  "pointsEarned", "pointsRedeemed", "shippingAddressId", phone, "trackingNumber", "shippedAt",
  "paymentMethod", "paymentStatus", "discountCodeId", "discountAmount", "externalReference", "paymentCurrency",
  "createdAt", "updatedAt"
)
SELECT
  'order-pp-fulf-jed',
  NULL,
  'jed.kinnick.fulfillment@placeholder.local',
  'PL-PP-FULF-20260406-JED',
  'SHIPPED',
  250.00,
  3.50,
  11.00,
  'UPS Ground',
  131.00,
  0,
  0,
  'addr-pp-fulf-jed',
  '6025550003',
  '1Z1752DH1210979943',
  '2026-04-06 11:47:51-07',
  'CREDIT_CARD',
  'PAID',
  (SELECT id FROM "DiscountCode" WHERE code = 'PP-FULF-20260406-JED' LIMIT 1),
  133.50,
  'PayPal manual fulfillment 2026-04-06',
  'USD',
  '2026-04-06 11:47:51-07',
  '2026-04-06 11:47:51-07'
WHERE NOT EXISTS (SELECT 1 FROM "Order" WHERE "orderNumber" = 'PL-PP-FULF-20260406-JED');

INSERT INTO "Order" (
  id, "userId", email, "orderNumber", status, subtotal, "shippingInsurance", "shippingCost", "shippingMethod", total,
  "pointsEarned", "pointsRedeemed", "shippingAddressId", phone, "trackingNumber", "shippedAt",
  "paymentMethod", "paymentStatus", "discountCodeId", "discountAmount", "externalReference", "paymentCurrency",
  "createdAt", "updatedAt"
)
SELECT
  'order-pp-fulf-james',
  NULL,
  'james.burbach.fulfillment@placeholder.local',
  'PL-PP-FULF-20260406-JAMES',
  'SHIPPED',
  125.00,
  3.50,
  12.00,
  'UPS Ground',
  128.00,
  0,
  0,
  'addr-pp-fulf-james',
  '6025550004',
  '1Z1752DH0235574423',
  '2026-04-06 12:10:18-07',
  'CREDIT_CARD',
  'PAID',
  (SELECT id FROM "DiscountCode" WHERE code = 'PP-FULF-20260406-JAMES' LIMIT 1),
  12.50,
  'PayPal manual fulfillment 2026-04-06',
  'USD',
  '2026-04-06 12:10:18-07',
  '2026-04-06 12:10:18-07'
WHERE NOT EXISTS (SELECT 1 FROM "Order" WHERE "orderNumber" = 'PL-PP-FULF-20260406-JAMES');

INSERT INTO "Order" (
  id, "userId", email, "orderNumber", status, subtotal, "shippingInsurance", "shippingCost", "shippingMethod", total,
  "pointsEarned", "pointsRedeemed", "shippingAddressId", phone, "trackingNumber", "shippedAt",
  "paymentMethod", "paymentStatus", "discountCodeId", "discountAmount", "externalReference", "paymentCurrency",
  "createdAt", "updatedAt"
)
SELECT
  'order-pp-fulf-dylan',
  NULL,
  'dylan.stutzman.fulfillment@placeholder.local',
  'PL-PP-FULF-20260406-DYLAN',
  'SHIPPED',
  225.00,
  3.50,
  12.00,
  'UPS Ground',
  163.00,
  0,
  0,
  'addr-pp-fulf-dylan',
  '6025550005',
  '1Z1752DH1215531176',
  '2026-04-06 13:52:28-07',
  'CREDIT_CARD',
  'PAID',
  (SELECT id FROM "DiscountCode" WHERE code = 'PP-FULF-20260406-DYLAN' LIMIT 1),
  77.50,
  'PayPal manual fulfillment 2026-04-06',
  'USD',
  '2026-04-06 13:52:28-07',
  '2026-04-06 13:52:28-07'
WHERE NOT EXISTS (SELECT 1 FROM "Order" WHERE "orderNumber" = 'PL-PP-FULF-20260406-DYLAN');

-- 4) Order line items (slug + size → variant price on row matches catalog)
-- Isaiah: White Infinity tee M
INSERT INTO "OrderItem" (id, "orderId", "productId", "variantId", quantity, price, "isBackorder", "createdAt")
SELECT gen_random_uuid()::text, 'order-pp-fulf-isaiah', p.id, pv.id, 1, 100.00, false, '2026-04-06 11:34:15-07'
FROM "Product" p
JOIN "ProductVariant" pv ON pv."productId" = p.id
WHERE p.slug = 'white-tshirt-infinity-logo' AND pv.size = 'M'
  AND EXISTS (SELECT 1 FROM "Order" o WHERE o.id = 'order-pp-fulf-isaiah')
  AND NOT EXISTS (SELECT 1 FROM "OrderItem" oi WHERE oi."orderId" = 'order-pp-fulf-isaiah')
LIMIT 1;

-- Ali: Black logo tee front M
INSERT INTO "OrderItem" (id, "orderId", "productId", "variantId", quantity, price, "isBackorder", "createdAt")
SELECT gen_random_uuid()::text, 'order-pp-fulf-ali', p.id, pv.id, 1, 100.00, false, '2026-04-06 12:38:17-07'
FROM "Product" p
JOIN "ProductVariant" pv ON pv."productId" = p.id
WHERE p.slug = 'black-logo-tshirt-front' AND pv.size = 'M'
  AND EXISTS (SELECT 1 FROM "Order" o WHERE o.id = 'order-pp-fulf-ali')
  AND NOT EXISTS (SELECT 1 FROM "OrderItem" oi WHERE oi."orderId" = 'order-pp-fulf-ali')
LIMIT 1;

-- Jed: Black logo hoodie S
INSERT INTO "OrderItem" (id, "orderId", "productId", "variantId", quantity, price, "isBackorder", "createdAt")
SELECT gen_random_uuid()::text, 'order-pp-fulf-jed', p.id, pv.id, 1, 250.00, false, '2026-04-06 11:47:51-07'
FROM "Product" p
JOIN "ProductVariant" pv ON pv."productId" = p.id
WHERE p.slug = 'black-logo-hoodie' AND pv.size = 'S'
  AND EXISTS (SELECT 1 FROM "Order" o WHERE o.id = 'order-pp-fulf-jed')
  AND NOT EXISTS (SELECT 1 FROM "OrderItem" oi WHERE oi."orderId" = 'order-pp-fulf-jed')
LIMIT 1;

-- James: Black sweatpants L
INSERT INTO "OrderItem" (id, "orderId", "productId", "variantId", quantity, price, "isBackorder", "createdAt")
SELECT gen_random_uuid()::text, 'order-pp-fulf-james', p.id, pv.id, 1, 125.00, false, '2026-04-06 12:10:18-07'
FROM "Product" p
JOIN "ProductVariant" pv ON pv."productId" = p.id
WHERE p.slug = 'black-sweatpants' AND pv.size = 'L'
  AND EXISTS (SELECT 1 FROM "Order" o WHERE o.id = 'order-pp-fulf-james')
  AND NOT EXISTS (SELECT 1 FROM "OrderItem" oi WHERE oi."orderId" = 'order-pp-fulf-james')
LIMIT 1;

-- Dylan: Black sweatpants M + Tan logo tee L
INSERT INTO "OrderItem" (id, "orderId", "productId", "variantId", quantity, price, "isBackorder", "createdAt")
SELECT gen_random_uuid()::text, 'order-pp-fulf-dylan', p.id, pv.id, 1, 125.00, false, '2026-04-06 13:52:28-07'
FROM "Product" p
JOIN "ProductVariant" pv ON pv."productId" = p.id
WHERE p.slug = 'black-sweatpants' AND pv.size = 'M'
  AND EXISTS (SELECT 1 FROM "Order" o WHERE o.id = 'order-pp-fulf-dylan')
  AND NOT EXISTS (SELECT 1 FROM "OrderItem" oi WHERE oi."orderId" = 'order-pp-fulf-dylan')
LIMIT 1;

INSERT INTO "OrderItem" (id, "orderId", "productId", "variantId", quantity, price, "isBackorder", "createdAt")
SELECT gen_random_uuid()::text, 'order-pp-fulf-dylan', p.id, pv.id, 1, 100.00, false, '2026-04-06 13:52:28-07'
FROM "Product" p
JOIN "ProductVariant" pv ON pv."productId" = p.id
WHERE p.slug = 'tan-logo-tshirt-front' AND pv.size = 'L'
  AND EXISTS (SELECT 1 FROM "Order" o WHERE o.id = 'order-pp-fulf-dylan')
  AND (SELECT COUNT(*) FROM "OrderItem" oi WHERE oi."orderId" = 'order-pp-fulf-dylan') = 1
LIMIT 1;

-- 5) Status history (idempotent)
INSERT INTO "OrderStatusHistory" (id, "orderId", status, note, "createdAt")
SELECT gen_random_uuid()::text, 'order-pp-fulf-isaiah', 'PENDING', 'Order placed (PayPal fulfillment record)', '2026-04-06 11:34:15-07'
WHERE EXISTS (SELECT 1 FROM "Order" o WHERE o.id = 'order-pp-fulf-isaiah')
  AND NOT EXISTS (SELECT 1 FROM "OrderStatusHistory" h WHERE h."orderId" = 'order-pp-fulf-isaiah' AND h.status = 'PENDING');

INSERT INTO "OrderStatusHistory" (id, "orderId", status, note, "createdAt")
SELECT gen_random_uuid()::text, 'order-pp-fulf-isaiah', 'PROCESSING', 'Payment received — Credit card', '2026-04-06 11:34:15-07'
WHERE EXISTS (SELECT 1 FROM "Order" o WHERE o.id = 'order-pp-fulf-isaiah')
  AND NOT EXISTS (SELECT 1 FROM "OrderStatusHistory" h WHERE h."orderId" = 'order-pp-fulf-isaiah' AND h.status = 'PROCESSING');

INSERT INTO "OrderStatusHistory" (id, "orderId", status, note, "createdAt")
SELECT gen_random_uuid()::text, 'order-pp-fulf-isaiah', 'SHIPPED', 'Shipped UPS 1Z1752DH1237526819', '2026-04-06 11:34:15-07'
WHERE EXISTS (SELECT 1 FROM "Order" o WHERE o.id = 'order-pp-fulf-isaiah')
  AND NOT EXISTS (SELECT 1 FROM "OrderStatusHistory" h WHERE h."orderId" = 'order-pp-fulf-isaiah' AND h.status = 'SHIPPED');

INSERT INTO "OrderStatusHistory" (id, "orderId", status, note, "createdAt")
SELECT gen_random_uuid()::text, 'order-pp-fulf-ali', 'PENDING', 'Order placed (PayPal fulfillment record)', '2026-04-06 12:38:17-07'
WHERE EXISTS (SELECT 1 FROM "Order" o WHERE o.id = 'order-pp-fulf-ali')
  AND NOT EXISTS (SELECT 1 FROM "OrderStatusHistory" h WHERE h."orderId" = 'order-pp-fulf-ali' AND h.status = 'PENDING');

INSERT INTO "OrderStatusHistory" (id, "orderId", status, note, "createdAt")
SELECT gen_random_uuid()::text, 'order-pp-fulf-ali', 'PROCESSING', 'Payment received — Credit card', '2026-04-06 12:38:17-07'
WHERE EXISTS (SELECT 1 FROM "Order" o WHERE o.id = 'order-pp-fulf-ali')
  AND NOT EXISTS (SELECT 1 FROM "OrderStatusHistory" h WHERE h."orderId" = 'order-pp-fulf-ali' AND h.status = 'PROCESSING');

INSERT INTO "OrderStatusHistory" (id, "orderId", status, note, "createdAt")
SELECT gen_random_uuid()::text, 'order-pp-fulf-ali', 'SHIPPED', 'Shipped UPS 1Z1752DH1211353036', '2026-04-06 12:38:17-07'
WHERE EXISTS (SELECT 1 FROM "Order" o WHERE o.id = 'order-pp-fulf-ali')
  AND NOT EXISTS (SELECT 1 FROM "OrderStatusHistory" h WHERE h."orderId" = 'order-pp-fulf-ali' AND h.status = 'SHIPPED');

INSERT INTO "OrderStatusHistory" (id, "orderId", status, note, "createdAt")
SELECT gen_random_uuid()::text, 'order-pp-fulf-jed', 'PENDING', 'Order placed (PayPal fulfillment record)', '2026-04-06 11:47:51-07'
WHERE EXISTS (SELECT 1 FROM "Order" o WHERE o.id = 'order-pp-fulf-jed')
  AND NOT EXISTS (SELECT 1 FROM "OrderStatusHistory" h WHERE h."orderId" = 'order-pp-fulf-jed' AND h.status = 'PENDING');

INSERT INTO "OrderStatusHistory" (id, "orderId", status, note, "createdAt")
SELECT gen_random_uuid()::text, 'order-pp-fulf-jed', 'PROCESSING', 'Payment received — Credit card', '2026-04-06 11:47:51-07'
WHERE EXISTS (SELECT 1 FROM "Order" o WHERE o.id = 'order-pp-fulf-jed')
  AND NOT EXISTS (SELECT 1 FROM "OrderStatusHistory" h WHERE h."orderId" = 'order-pp-fulf-jed' AND h.status = 'PROCESSING');

INSERT INTO "OrderStatusHistory" (id, "orderId", status, note, "createdAt")
SELECT gen_random_uuid()::text, 'order-pp-fulf-jed', 'SHIPPED', 'Shipped UPS 1Z1752DH1210979943', '2026-04-06 11:47:51-07'
WHERE EXISTS (SELECT 1 FROM "Order" o WHERE o.id = 'order-pp-fulf-jed')
  AND NOT EXISTS (SELECT 1 FROM "OrderStatusHistory" h WHERE h."orderId" = 'order-pp-fulf-jed' AND h.status = 'SHIPPED');

INSERT INTO "OrderStatusHistory" (id, "orderId", status, note, "createdAt")
SELECT gen_random_uuid()::text, 'order-pp-fulf-james', 'PENDING', 'Order placed (PayPal fulfillment record)', '2026-04-06 12:10:18-07'
WHERE EXISTS (SELECT 1 FROM "Order" o WHERE o.id = 'order-pp-fulf-james')
  AND NOT EXISTS (SELECT 1 FROM "OrderStatusHistory" h WHERE h."orderId" = 'order-pp-fulf-james' AND h.status = 'PENDING');

INSERT INTO "OrderStatusHistory" (id, "orderId", status, note, "createdAt")
SELECT gen_random_uuid()::text, 'order-pp-fulf-james', 'PROCESSING', 'Payment received — Credit card', '2026-04-06 12:10:18-07'
WHERE EXISTS (SELECT 1 FROM "Order" o WHERE o.id = 'order-pp-fulf-james')
  AND NOT EXISTS (SELECT 1 FROM "OrderStatusHistory" h WHERE h."orderId" = 'order-pp-fulf-james' AND h.status = 'PROCESSING');

INSERT INTO "OrderStatusHistory" (id, "orderId", status, note, "createdAt")
SELECT gen_random_uuid()::text, 'order-pp-fulf-james', 'SHIPPED', 'Shipped UPS 1Z1752DH0235574423', '2026-04-06 12:10:18-07'
WHERE EXISTS (SELECT 1 FROM "Order" o WHERE o.id = 'order-pp-fulf-james')
  AND NOT EXISTS (SELECT 1 FROM "OrderStatusHistory" h WHERE h."orderId" = 'order-pp-fulf-james' AND h.status = 'SHIPPED');

INSERT INTO "OrderStatusHistory" (id, "orderId", status, note, "createdAt")
SELECT gen_random_uuid()::text, 'order-pp-fulf-dylan', 'PENDING', 'Order placed (PayPal fulfillment record)', '2026-04-06 13:52:28-07'
WHERE EXISTS (SELECT 1 FROM "Order" o WHERE o.id = 'order-pp-fulf-dylan')
  AND NOT EXISTS (SELECT 1 FROM "OrderStatusHistory" h WHERE h."orderId" = 'order-pp-fulf-dylan' AND h.status = 'PENDING');

INSERT INTO "OrderStatusHistory" (id, "orderId", status, note, "createdAt")
SELECT gen_random_uuid()::text, 'order-pp-fulf-dylan', 'PROCESSING', 'Payment received — Credit card', '2026-04-06 13:52:28-07'
WHERE EXISTS (SELECT 1 FROM "Order" o WHERE o.id = 'order-pp-fulf-dylan')
  AND NOT EXISTS (SELECT 1 FROM "OrderStatusHistory" h WHERE h."orderId" = 'order-pp-fulf-dylan' AND h.status = 'PROCESSING');

INSERT INTO "OrderStatusHistory" (id, "orderId", status, note, "createdAt")
SELECT gen_random_uuid()::text, 'order-pp-fulf-dylan', 'SHIPPED', 'Shipped UPS 1Z1752DH1215531176', '2026-04-06 13:52:28-07'
WHERE EXISTS (SELECT 1 FROM "Order" o WHERE o.id = 'order-pp-fulf-dylan')
  AND NOT EXISTS (SELECT 1 FROM "OrderStatusHistory" h WHERE h."orderId" = 'order-pp-fulf-dylan' AND h.status = 'SHIPPED');
