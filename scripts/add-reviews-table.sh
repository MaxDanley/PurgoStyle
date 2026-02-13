#!/usr/bin/env bash
# Adds the ProductReview table to the database using Prisma migrate.
# Run from project root: ./scripts/add-reviews-table.sh
# Or: npx prisma migrate dev --name add_product_reviews

set -e
cd "$(dirname "$0")/.."
echo "Running Prisma migration to add ProductReview table..."
npx prisma migrate dev --name add_product_reviews
echo "Done. ProductReview table is ready."
