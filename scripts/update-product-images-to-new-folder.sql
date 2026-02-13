-- Update existing product image paths from /PURGO STYLE LABS/ to /PURGO STYLE LABS (1)/
-- Run in Supabase SQL Editor (or your DB client) so the site uses the new product images.

UPDATE "Product"
SET image = REPLACE(image, '/PURGO STYLE LABS/', '/PURGO STYLE LABS (1)/')
WHERE image LIKE '/PURGO STYLE LABS/%';

-- Optional: verify (run separately if you want to check)
-- SELECT id, name, slug, image FROM "Product" WHERE image IS NOT NULL;
