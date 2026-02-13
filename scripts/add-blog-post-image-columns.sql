-- Migration: Add featuredImage and articleImages columns to BlogPost table
-- Run this migration on your database to add image support to blog posts

-- Add featuredImage column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BlogPost' AND column_name = 'featuredImage'
    ) THEN
        ALTER TABLE "BlogPost" ADD COLUMN "featuredImage" TEXT;
        RAISE NOTICE 'Added featuredImage column to BlogPost table';
    ELSE
        RAISE NOTICE 'featuredImage column already exists';
    END IF;
END $$;

-- Add articleImages column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BlogPost' AND column_name = 'articleImages'
    ) THEN
        ALTER TABLE "BlogPost" ADD COLUMN "articleImages" TEXT[];
        RAISE NOTICE 'Added articleImages column to BlogPost table';
    ELSE
        RAISE NOTICE 'articleImages column already exists';
    END IF;
END $$;

-- Verify columns were added
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'BlogPost' 
AND column_name IN ('featuredImage', 'articleImages')
ORDER BY column_name;

