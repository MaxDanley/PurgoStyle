-- Create StockNotification table
CREATE TABLE IF NOT EXISTS "StockNotification" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "StockNotification_pkey" PRIMARY KEY ("id")
);

-- Create index on variantId
CREATE INDEX IF NOT EXISTS "StockNotification_variantId_idx" ON "StockNotification"("variantId");

-- Create index on userId
CREATE INDEX IF NOT EXISTS "StockNotification_userId_idx" ON "StockNotification"("userId");

-- Create index on email
CREATE INDEX IF NOT EXISTS "StockNotification_email_idx" ON "StockNotification"("email");

-- Add foreign key constraints
ALTER TABLE "StockNotification" 
ADD CONSTRAINT "StockNotification_variantId_fkey" 
FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StockNotification" 
ADD CONSTRAINT "StockNotification_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
