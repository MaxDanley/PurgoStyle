-- Create BlogPost table if it does not exist (e.g. Prisma schema not yet pushed), then add pipeline columns.
-- If your Prisma uses a different table name (e.g. blog_post), change "BlogPost" below to match.

-- Create table (skip if you already have BlogPost from prisma db push)
CREATE TABLE IF NOT EXISTS "BlogPost" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "metaDescription" TEXT NOT NULL,
  "featuredImage" TEXT,
  "articleImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "published" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- Add optional columns for automated blog pipeline (safe if columns already exist)
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "primaryKeyword" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "faqSchema" JSONB;

-- Unique constraint on slug (if not already present)
CREATE UNIQUE INDEX IF NOT EXISTS "BlogPost_slug_key" ON "BlogPost"("slug");
