-- Add rewardsPoints column to User table if it doesn't exist
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "rewardsPoints" INTEGER NOT NULL DEFAULT 0;
