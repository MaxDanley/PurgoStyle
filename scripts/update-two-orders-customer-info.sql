-- Update existing orders with customer info (run in Supabase SQL Editor).
-- Order #PL-1770921562644-O55C: Saima Ali, $247.36
-- Order #PL-1770915257055-S9KB: Teresa Chamberlain, $205.97

-- 1) Update Order table: email, phone, total (by order number)
UPDATE "Order"
SET
  email = 'saima027@ymail.com',
  phone = '3237367423',
  total = 247.36,
  "updatedAt" = NOW()
WHERE "orderNumber" = 'PL-1770921562644-O55C';

UPDATE "Order"
SET
  email = 'teresachamberlain0@gmail.com',
  phone = '7276451279',
  total = 205.97,
  "updatedAt" = NOW()
WHERE "orderNumber" = 'PL-1770915257055-S9KB';

-- 2) Update shipping address for order PL-1770921562644-O55C (Saima Ali)
--    If the order already has a shipping address, update it in place.
UPDATE "Address"
SET
  name = 'Saima Ali',
  street = '3056 Leeward Ave',
  apartment = 'Apt 112',
  city = 'Los Angeles',
  state = 'CA',
  "zipCode" = '90005',
  country = 'US',
  phone = '3237367423',
  "updatedAt" = NOW()
WHERE id = (
  SELECT "shippingAddressId" FROM "Order"
  WHERE "orderNumber" = 'PL-1770921562644-O55C'
  LIMIT 1
);

-- 3) Update shipping address for order PL-1770915257055-S9KB (Teresa Chamberlain)
UPDATE "Address"
SET
  name = 'Teresa Chamberlain',
  street = '12816 Vassar Ct',
  apartment = NULL,
  city = 'Hudson',
  state = 'FL',
  "zipCode" = '34667',
  country = 'US',
  phone = '7276451279',
  "updatedAt" = NOW()
WHERE id = (
  SELECT "shippingAddressId" FROM "Order"
  WHERE "orderNumber" = 'PL-1770915257055-S9KB'
  LIMIT 1
);

-- 4) If either order has no shipping address yet, create one and link it.
-- Order 1 (Saima)
INSERT INTO "Address" (id, "userId", name, street, apartment, city, state, "zipCode", country, phone, "isDefault", "createdAt", "updatedAt")
SELECT 'addr-order-24736', NULL, 'Saima Ali', '3056 Leeward Ave', 'Apt 112', 'Los Angeles', 'CA', '90005', 'US', '3237367423', false, NOW(), NOW()
WHERE EXISTS (
  SELECT 1 FROM "Order" o WHERE o."orderNumber" = 'PL-1770921562644-O55C' AND o."shippingAddressId" IS NULL
)
ON CONFLICT (id) DO NOTHING;

UPDATE "Order"
SET "shippingAddressId" = 'addr-order-24736', "updatedAt" = NOW()
WHERE "orderNumber" = 'PL-1770921562644-O55C' AND "shippingAddressId" IS NULL;

-- Order 2 (Teresa)
INSERT INTO "Address" (id, "userId", name, street, apartment, city, state, "zipCode", country, phone, "isDefault", "createdAt", "updatedAt")
SELECT 'addr-order-20597', NULL, 'Teresa Chamberlain', '12816 Vassar Ct', NULL, 'Hudson', 'FL', '34667', 'US', '7276451279', false, NOW(), NOW()
WHERE EXISTS (
  SELECT 1 FROM "Order" o WHERE o."orderNumber" = 'PL-1770915257055-S9KB' AND o."shippingAddressId" IS NULL
)
ON CONFLICT (id) DO NOTHING;

UPDATE "Order"
SET "shippingAddressId" = 'addr-order-20597', "updatedAt" = NOW()
WHERE "orderNumber" = 'PL-1770915257055-S9KB' AND "shippingAddressId" IS NULL;
