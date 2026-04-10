-- Update customer + shipping for PayPal fulfillment orders.
-- Targets orders by orderNumber (works even if Address ids are not the seed placeholders).

-- Isaiah Alexander — PL-PP-FULF-20260406-ISAIAH
UPDATE "Address" a
SET
  name = 'Isaiah Alexander',
  street = '237 Pendleton Ave',
  apartment = NULL,
  city = 'Springfield',
  state = 'MA',
  "zipCode" = '01109',
  country = 'US',
  phone = '4136862238',
  "updatedAt" = NOW()
FROM "Order" o
WHERE o."orderNumber" = 'PL-PP-FULF-20260406-ISAIAH'
  AND o."shippingAddressId" IS NOT NULL
  AND a.id = o."shippingAddressId";

UPDATE "Order"
SET
  email = 'alexanderzay00@gmail.com',
  phone = '4136862238',
  "updatedAt" = NOW()
WHERE "orderNumber" = 'PL-PP-FULF-20260406-ISAIAH';

-- Ali Alam — PL-PP-FULF-20260406-ALI
UPDATE "Address" a
SET
  name = 'Ali Alam',
  street = '4267 Steele Creek Ct',
  apartment = NULL,
  city = 'Millcreek',
  state = 'UT',
  "zipCode" = '84107',
  country = 'US',
  phone = '8016688742',
  "updatedAt" = NOW()
FROM "Order" o
WHERE o."orderNumber" = 'PL-PP-FULF-20260406-ALI'
  AND o."shippingAddressId" IS NOT NULL
  AND a.id = o."shippingAddressId";

UPDATE "Order"
SET
  email = 'ali.alam0307@gmail.com',
  phone = '8016688742',
  "updatedAt" = NOW()
WHERE "orderNumber" = 'PL-PP-FULF-20260406-ALI';

-- Jed Kinnick — PL-PP-FULF-20260406-JED
UPDATE "Address" a
SET
  name = 'Jed Kinnick',
  street = '99 Clervaux Dr',
  apartment = NULL,
  city = 'Little Rock',
  state = 'AR',
  "zipCode" = '72223',
  country = 'US',
  phone = '4798830385',
  "updatedAt" = NOW()
FROM "Order" o
WHERE o."orderNumber" = 'PL-PP-FULF-20260406-JED'
  AND o."shippingAddressId" IS NOT NULL
  AND a.id = o."shippingAddressId";

UPDATE "Order"
SET
  email = 'jedkinnick@gmail.com',
  phone = '4798830385',
  "updatedAt" = NOW()
WHERE "orderNumber" = 'PL-PP-FULF-20260406-JED';

-- James Burbach — PL-PP-FULF-20260406-JAMES
UPDATE "Address" a
SET
  name = 'James Burbach',
  street = '3810 Loveland Dr',
  apartment = NULL,
  city = 'Lincoln',
  state = 'NE',
  "zipCode" = '68506-3842',
  country = 'US',
  phone = '4029261275',
  "updatedAt" = NOW()
FROM "Order" o
WHERE o."orderNumber" = 'PL-PP-FULF-20260406-JAMES'
  AND o."shippingAddressId" IS NOT NULL
  AND a.id = o."shippingAddressId";

UPDATE "Order"
SET
  email = 'jamesmburbach@gmail.com',
  phone = '4029261275',
  "updatedAt" = NOW()
WHERE "orderNumber" = 'PL-PP-FULF-20260406-JAMES';

-- Dylan Stutzman — PL-PP-FULF-20260406-DYLAN
UPDATE "Address" a
SET
  name = 'Dylan Stutzman',
  street = '433 Shadow Oak Dr',
  apartment = NULL,
  city = 'Baton Rouge',
  state = 'LA',
  "zipCode" = '70810',
  country = 'US',
  phone = '2254563810',
  "updatedAt" = NOW()
FROM "Order" o
WHERE o."orderNumber" = 'PL-PP-FULF-20260406-DYLAN'
  AND o."shippingAddressId" IS NOT NULL
  AND a.id = o."shippingAddressId";

UPDATE "Order"
SET
  email = 'djs9135@gmail.com',
  phone = '2254563810',
  "updatedAt" = NOW()
WHERE "orderNumber" = 'PL-PP-FULF-20260406-DYLAN';
