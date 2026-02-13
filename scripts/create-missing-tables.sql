-- Create PointsHistory table if it doesn't exist
CREATE TABLE IF NOT EXISTS "PointsHistory" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orderId" TEXT,
  "points" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "PointsHistory_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "PointsHistory_userId_idx" ON "PointsHistory"("userId");

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'PointsHistory_userId_fkey'
  ) THEN
    ALTER TABLE "PointsHistory" ADD CONSTRAINT "PointsHistory_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'PointsHistory_orderId_fkey'
  ) THEN
    ALTER TABLE "PointsHistory" ADD CONSTRAINT "PointsHistory_orderId_fkey" 
      FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL;
  END IF;
END $$;

-- Create PointsType enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PointsType') THEN
    CREATE TYPE "PointsType" AS ENUM ('EARNED', 'REDEEMED', 'EXPIRED');
  END IF;
END $$;

-- Update the table to use the enum
DO $$
BEGIN
  ALTER TABLE "PointsHistory" ALTER COLUMN "type" TYPE "PointsType" USING "type"::"PointsType";
EXCEPTION
  WHEN OTHERS THEN
    -- If conversion fails, column might already be the right type
    NULL;
END $$;
