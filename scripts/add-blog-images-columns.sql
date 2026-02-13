-- Migration script to add image columns to BlogPost table
-- Run this to add featuredImage and articleImages support

-- Add featuredImage column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BlogPost' AND column_name = 'featuredImage'
    ) THEN
        ALTER TABLE "BlogPost" ADD COLUMN "featuredImage" TEXT;
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
    END IF;
END $$;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'BlogPost' 
AND column_name IN ('featuredImage', 'articleImages');

