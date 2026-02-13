-- Add freeShipping column to DiscountCode table
ALTER TABLE "DiscountCode" 
ADD COLUMN IF NOT EXISTS "freeShipping" BOOLEAN NOT NULL DEFAULT false;

-- Create a 90% off discount code with free shipping
-- Code: MEGA90
-- 90% discount, free shipping, 5 uses, expires in 1 year
INSERT INTO "DiscountCode" (
  "id",
  "code",
  "description",
  "discountType",
  "discountAmount",
  "freeShipping",
  "usageLimit",
  "usageCount",
  "isActive",
  "expiresAt",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'MEGA90',
  '90% off with free shipping - Limited time offer',
  'PERCENTAGE',
  90.0,
  true,
  5,
  0,
  true,
  NOW() + INTERVAL '1 year',
  NOW(),
  NOW()
)
ON CONFLICT ("code") DO NOTHING;

-- Verify the discount code was created
SELECT 
  "code",
  "discountAmount",
  "freeShipping",
  "usageLimit",
  "usageCount",
  "isActive",
  "expiresAt"
FROM "DiscountCode"
WHERE "code" = 'MEGA90';

