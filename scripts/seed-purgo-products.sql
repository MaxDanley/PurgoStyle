-- Summer Steeze: 10 products with S/M/L variants.
-- Prices: T-Shirts $100, Hoodies $250, Sweatpants $125, Shell Jacket $350.
-- Run after Prisma migrations. PostgreSQL.
-- Descriptions: plain-tee positioning, oversized / overfit sizing notes (no infinity/wordmark copy).

-- 1. Black Shell Jacket ($350) - featured
INSERT INTO "Product" (id, name, slug, description, category, image, "coaUrl", active, featured, "createdAt", "updatedAt")
VALUES (
  'psl-shell-black',
  'Black Shell Jacket',
  'black-shell-jacket',
  $d$A lightweight black shell layer built for wind and light weather. Clean, minimal face—no chest graphics or loud branding in the product story: it reads as a simple technical jacket. Full zip, stand collar, elasticated hem, and side pockets.

Silhouette is relaxed with extra room through the chest and body—closer to streetwear / overfit than a slim athletic cut. Size down if you want less volume.

Jacket body runs generous; sleeve and torso length are tuned for layering over hoodies or tees.

• Full zip / stand collar
• Elasticated hem, side pockets
• Composition: 100% nylon$d$,
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
  $d$Essential black sweatpants in heavyweight brushed fleece. Elastic waist with contrast drawcords, elastic cuffs, and a straight relaxed leg—plain construction focused on comfort and daily wear.

Fit is relaxed through the seat and thigh with a fuller leg and ankle stack—size down if you want a trimmer sweatpant.

Choose size for how much stack you want at the ankle and how relaxed you like the seat and thigh.

• Heavyweight fleece
• Elasticated waist & cuffs
• Composition: 100% cotton$d$,
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

-- 3. Black Oversized Hoodie ($250) - featured
INSERT INTO "Product" (id, name, slug, description, category, image, "coaUrl", active, featured, "createdAt", "updatedAt")
VALUES (
  'psl-hoodie-black',
  'Black Oversized Hoodie',
  'black-logo-hoodie',
  $d$Heavyweight black fleece hoodie with a cropped, boxy body and kangaroo pocket. Treated as a plain wardrobe hoodie in the catalog copy: emphasis is on fabric weight, silhouette, and everyday layering—not on graphics.

Silhouette is relaxed with extra room through the chest and body—closer to streetwear / overfit than a slim athletic cut. Size down if you want less volume.

Hoodie is intentionally voluminous; size down if you want less width through the body.

• Heavyweight fleece
• Kangaroo pocket
• Composition: 100% cotton$d$,
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

-- 4–10: tees, sweats, hoodies
INSERT INTO "Product" (id, name, slug, description, category, image, "coaUrl", active, featured, "createdAt", "updatedAt") VALUES
(
  'psl-tshirt-black-back',
  'Black Plain T-Shirt (Back)',
  'black-logo-tshirt-back',
  $d$Washed black plain tee in heavyweight cotton with a vintage wash. Catalog listing describes a clean, minimal shirt—no chest or back graphic story in the product copy. Ribbed crew neck, substantial hand feel.

Fit is intentionally oversized / overfit: dropped shoulder, wider body, and extra length compared to a classic retail tee. If you prefer a closer, standard tee silhouette, order one size down. S, M, and L are offered; when in doubt, compare to a tee you already own and size for the amount of drape you want.

• Vintage wash finish
• Ribbed crew neck
• Composition: 100% cotton$d$,
  'T-Shirts',
  '/PURGO STYLE LABS (1)/black_tshirt_logo_back.png',
  NULL,
  true,
  false,
  NOW(),
  NOW()
),
(
  'psl-tshirt-black-front',
  'Black Plain T-Shirt (Front)',
  'black-logo-tshirt-front',
  $d$Black plain tee cut from heavyweight cotton. Listing focuses on a simple, blank-forward tee: roomy through the chest and shoulder for an intentional overfit look.

Fit is intentionally oversized / overfit: dropped shoulder, wider body, and extra length compared to a classic retail tee. If you prefer a closer, standard tee silhouette, order one size down. S, M, and L are offered; when in doubt, compare to a tee you already own and size for the amount of drape you want.

• Ribbed crew neck
• Woven label at hem (can be removed if you want a fully blank look)
• Composition: 100% cotton$d$,
  'T-Shirts',
  '/PURGO STYLE LABS (1)/black_tshirt_logo_front.png',
  NULL,
  true,
  false,
  NOW(),
  NOW()
),
(
  'psl-tshirt-white-infinity',
  'White Plain T-Shirt',
  'white-tshirt-infinity-logo',
  $d$White heavyweight cotton tee with a ribbed crew neck. Sold and described as a plain essential—oversized block fit for an easy, relaxed drape.

Fit is intentionally oversized / overfit: dropped shoulder, wider body, and extra length compared to a classic retail tee. If you prefer a closer, standard tee silhouette, order one size down. S, M, and L are offered; when in doubt, compare to a tee you already own and size for the amount of drape you want.

• Plain essential—simple wardrobe tee
• Woven label at hem
• Composition: 100% cotton$d$,
  'T-Shirts',
  '/PURGO STYLE LABS (1)/Plain_white_tshirt_purgo_blue.png',
  NULL,
  true,
  true,
  NOW(),
  NOW()
),
(
  'psl-tshirt-tan-front',
  'Sand Plain T-Shirt (Front)',
  'tan-logo-tshirt-front',
  $d$Sand / tan plain tee in premium heavyweight cotton. Designed as an oversized everyday shirt with extra body width and a relaxed shoulder line.

Fit is intentionally oversized / overfit: dropped shoulder, wider body, and extra length compared to a classic retail tee. If you prefer a closer, standard tee silhouette, order one size down. S, M, and L are offered; when in doubt, compare to a tee you already own and size for the amount of drape you want.

• Ribbed crew neck
• Composition: 100% cotton$d$,
  'T-Shirts',
  '/PURGO STYLE LABS (1)/tan_tshirt_logo_front.png',
  NULL,
  true,
  false,
  NOW(),
  NOW()
),
(
  'psl-sweat-white',
  'White Sweatpants',
  'white-sweatpants',
  $d$Oatmeal marl sweatpants in brushed heavyweight fleece. Tonal drawcords, elastic waist and cuffs, and a wide relaxed leg—plain, staple sweatpants.

Fit is relaxed through the seat and thigh with a fuller leg and ankle stack—size down if you want a trimmer sweatpant.

• Heavyweight fleece
• Elasticated waist & cuffs
• Composition: 100% cotton$d$,
  'Sweatpants',
  '/PURGO STYLE LABS (1)/white_sweatpants_plain.png',
  NULL,
  true,
  false,
  NOW(),
  NOW()
),
(
  'psl-hoodie-white',
  'Oatmeal Oversized Hoodie',
  'white-logo-hoodie',
  $d$Oatmeal marl heavyweight fleece hoodie with a cropped, boxy silhouette and kangaroo pocket. Positioned in copy as a plain, tonal hoodie—priority on fleece hand-feel and oversized proportion.

Silhouette is relaxed with extra room through the chest and body—closer to streetwear / overfit than a slim athletic cut. Size down if you want less volume.

• Metal eyelets at hood
• Composition: 100% cotton$d$,
  'Hoodies',
  '/PURGO STYLE LABS (1)/white_sweatshirt_plain.png',
  NULL,
  true,
  false,
  NOW(),
  NOW()
),
(
  'psl-tshirt-white-back',
  'White Plain T-Shirt (Back)',
  'white-logo-tshirt-back',
  $d$White heavyweight cotton tee—plain catalog description with an oversized / overfit block. Ribbed crew neck; generous width and length for a relaxed streetwear proportion.

Fit is intentionally oversized / overfit: dropped shoulder, wider body, and extra length compared to a classic retail tee. If you prefer a closer, standard tee silhouette, order one size down. S, M, and L are offered; when in doubt, compare to a tee you already own and size for the amount of drape you want.

• Composition: 100% cotton$d$,
  'T-Shirts',
  '/PURGO STYLE LABS (1)/white_tshirt_logo_back.png',
  NULL,
  true,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, image = EXCLUDED.image, featured = EXCLUDED.featured, "updatedAt" = NOW();

INSERT INTO "ProductVariant" (id, "productId", size, price, "stockCount", sku, active, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, p.id, s, CASE p.slug
  WHEN 'white-sweatpants' THEN 125
  WHEN 'white-logo-hoodie' THEN 250
  ELSE 100
END, 99, 'PSL-' || p.slug || '-' || s, true, NOW(), NOW()
FROM "Product" p, (SELECT unnest(ARRAY['S','M','L']) AS s) sizes
WHERE p.slug IN ('black-logo-tshirt-back','black-logo-tshirt-front','white-tshirt-infinity-logo','tan-logo-tshirt-front','white-sweatpants','white-logo-hoodie','white-logo-tshirt-back')
  AND NOT EXISTS (SELECT 1 FROM "ProductVariant" pv WHERE pv."productId" = p.id AND pv.size = sizes.s);
