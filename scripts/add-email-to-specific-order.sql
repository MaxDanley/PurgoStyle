-- Add email to a specific order
-- Order ID: cmi1tdip60003lb04n3blrck8
-- Email: esgarber12@gmail.com

UPDATE "Order"
SET email = 'esgarber12@gmail.com'
WHERE id = 'cmi1tdip60003lb04n3blrck8';

-- Verify the update
SELECT id, "orderNumber", email, "userId", status, total, "createdAt"
FROM "Order"
WHERE id = 'cmi1tdip60003lb04n3blrck8';

