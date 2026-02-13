-- Summer Steeze: 10 products with S/M/L variants.
-- Prices: T-Shirts $100, Hoodies $250, Sweatpants $125, Shell Jacket $350.
-- Run after Prisma migrations. Uses fixed product IDs for reproducibility.
-- PostgreSQL: run with psql or your DB client. For SQLite, adjust syntax if needed.

-- 1. Black Shell Jacket ($350) - featured
INSERT INTO "Product" (id, name, slug, description, category, image, "coaUrl", active, featured, "createdAt", "updatedAt")
VALUES (
  'psl-shell-black',
  'Black Shell Jacket',
  'black-shell-jacket',
  'Introducing the Summer Steeze Shell Jacket in Black. Crafted from lightweight shell fabric, this jacket features a full zip closure with an elasticated hem for a clean, contemporary silhouette. The chest displays the Summer Steeze wordmark in a subtle tonal print, with additional branding to the left cuff. The jacket delivers a relaxed, oversized fit with a stand collar and side pockets.

Summer Steeze Shell Jacket
Black | Oversized Fit | Full Zip Closure | Elasticated Hem | Summer Steeze Chest Branding | Cuff Branding Detail
Composition: 100% Nylon',
  'Jackets',
  '/PURGO STYLE LABS (1)/black_shell_cover_longsleave.png',
  NULL,
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, image = EXCLUDED.image, featured = EXCLUDED.featured, "updatedAt" = NOW();

INSERT INTO "ProductVariant" (id, "productId", size, price, "stockCount", sku, active, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, p.id, s, 350, 99, 'PSL-black-shell-jacket-' || s, true, NOW(), NOW()
FROM "Product" p, (SELECT unnest(ARRAY['S','M','L']) AS s) sizes
WHERE p.slug = 'black-shell-jacket'
  AND NOT EXISTS (SELECT 1 FROM "ProductVariant" pv WHERE pv."productId" = p.id AND pv.size = sizes.s);

-- 2. Black Sweatpants ($125)
INSERT INTO "Product" (id, name, slug, description, category, image, "coaUrl", active, featured, "createdAt", "updatedAt")
VALUES (
  'psl-sweat-black',
  'Black Sweatpants',
  'black-sweatpants',
  'Introducing the Summer Steeze Essential Sweatpants in Black. Built from heavyweight brushed fleece, these sweatpants feature an elasticated waistband with contrast white drawcords and elasticated cuffs at the ankle. A small woven label sits at the left hip. Designed for everyday comfort with a wide, straight leg silhouette. Composition: 100% Cotton',
  'Sweatpants',
  '/PURGO STYLE LABS (1)/black_sweatpants_plain.png',
  NULL,
  true,
  false,
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, image = EXCLUDED.image, "updatedAt" = NOW();

INSERT INTO "ProductVariant" (id, "productId", size, price, "stockCount", sku, active, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, p.id, s, 125, 99, 'PSL-black-sweatpants-' || s, true, NOW(), NOW()
FROM "Product" p, (SELECT unnest(ARRAY['S','M','L']) AS s) sizes
WHERE p.slug = 'black-sweatpants'
  AND NOT EXISTS (SELECT 1 FROM "ProductVariant" pv WHERE pv."productId" = p.id AND pv.size = sizes.s);

-- 3. Black Logo Hoodie ($250) - featured
INSERT INTO "Product" (id, name, slug, description, category, image, "coaUrl", active, featured, "createdAt", "updatedAt")
VALUES (
  'psl-hoodie-black',
  'Black Logo Hoodie',
  'black-logo-hoodie',
  'Introducing the Summer Steeze Logo Hoodie in Black. Constructed from premium heavyweight fleece, this hoodie features a boxy, cropped oversized silhouette with a kangaroo pocket and the Summer Steeze wordmark printed across the chest. Additional branding sits on the hood and at the lower left cuff. Composition: 100% Cotton',
  'Hoodies',
  '/PURGO STYLE LABS (1)/black_sweatshirt_logo.png',
  NULL,
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, image = EXCLUDED.image, featured = EXCLUDED.featured, "updatedAt" = NOW();

INSERT INTO "ProductVariant" (id, "productId", size, price, "stockCount", sku, active, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, p.id, s, 250, 99, 'PSL-black-logo-hoodie-' || s, true, NOW(), NOW()
FROM "Product" p, (SELECT unnest(ARRAY['S','M','L']) AS s) sizes
WHERE p.slug = 'black-logo-hoodie'
  AND NOT EXISTS (SELECT 1 FROM "ProductVariant" pv WHERE pv."productId" = p.id AND pv.size = sizes.s);

-- 4–10: Remaining products (abbreviated descriptions in SQL for length)
INSERT INTO "Product" (id, name, slug, description, category, image, "coaUrl", active, featured, "createdAt", "updatedAt") VALUES
('psl-tshirt-black-back', 'Black Logo T-Shirt (Back)', 'black-logo-tshirt-back', 'Summer Steeze Logo T-Shirt in Washed Black — back view. Sky blue wordmark and infinity symbol on upper back. Oversized, boxy fit. Composition: 100% Cotton', 'T-Shirts', '/PURGO STYLE LABS (1)/black_tshirt_logo_back.png', NULL, true, false, NOW(), NOW()),
('psl-tshirt-black-front', 'Black Logo T-Shirt (Front)', 'black-logo-tshirt-front', 'Summer Steeze Logo T-Shirt in Black — front view. Wordmark and infinity symbol left chest in sky blue. Oversized, boxy fit. Composition: 100% Cotton', 'T-Shirts', '/PURGO STYLE LABS (1)/black_tshirt_logo_front.png', NULL, true, false, NOW(), NOW()),
('psl-tshirt-white-infinity', 'White T-Shirt — Infinity Logo', 'white-tshirt-infinity-logo', 'Summer Steeze Essentials T-Shirt in White. Infinity symbol in sky blue on right chest. Oversized boxy fit. Composition: 100% Cotton', 'T-Shirts', '/PURGO STYLE LABS (1)/Plain_white_tshirt_purgo_blue.png', NULL, true, true, NOW(), NOW()),
('psl-tshirt-tan-front', 'Tan Logo T-Shirt (Front)', 'tan-logo-tshirt-front', 'Summer Steeze Logo T-Shirt in Sand. Wordmark and infinity symbol centered on chest in sky blue. Composition: 100% Cotton', 'T-Shirts', '/PURGO STYLE LABS (1)/tan_tshirt_logo_front.png', NULL, true, false, NOW(), NOW()),
('psl-sweat-white', 'White Sweatpants', 'white-sweatpants', 'Summer Steeze Essential Sweatpants in Oatmeal Marl. Heavyweight brushed fleece, elasticated waist and cuffs. Composition: 100% Cotton', 'Sweatpants', '/PURGO STYLE LABS (1)/white_sweatpants_plain.png', NULL, true, false, NOW(), NOW()),
('psl-hoodie-white', 'White Logo Hoodie', 'white-logo-hoodie', 'Summer Steeze Logo Hoodie in Oatmeal Marl. Wordmark with infinity symbol in sky blue across chest. Composition: 100% Cotton', 'Hoodies', '/PURGO STYLE LABS (1)/white_sweatshirt_plain.png', NULL, true, false, NOW(), NOW()),
('psl-tshirt-white-back', 'White Logo T-Shirt (Back)', 'white-logo-tshirt-back', 'Summer Steeze Logo T-Shirt in White — back view. Wordmark and infinity symbol on upper back in sky blue. Composition: 100% Cotton', 'T-Shirts', '/PURGO STYLE LABS (1)/white_tshirt_logo_back.png', NULL, true, false, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, image = EXCLUDED.image, featured = EXCLUDED.featured, "updatedAt" = NOW();

-- Variants for products 4–10 (T-Shirts $100, Sweatpants $125, Hoodie $250)
INSERT INTO "ProductVariant" (id, "productId", size, price, "stockCount", sku, active, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, p.id, s, CASE p.slug
  WHEN 'white-sweatpants' THEN 125
  WHEN 'white-logo-hoodie' THEN 250
  ELSE 100
END, 99, 'PSL-' || p.slug || '-' || s, true, NOW(), NOW()
FROM "Product" p, (SELECT unnest(ARRAY['S','M','L']) AS s) sizes
WHERE p.slug IN ('black-logo-tshirt-back','black-logo-tshirt-front','white-tshirt-infinity-logo','tan-logo-tshirt-front','white-sweatpants','white-logo-hoodie','white-logo-tshirt-back')
  AND NOT EXISTS (SELECT 1 FROM "ProductVariant" pv WHERE pv."productId" = p.id AND pv.size = sizes.s);
