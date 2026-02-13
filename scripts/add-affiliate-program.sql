-- Add Affiliate Program Tables
-- Run this in Supabase SQL Editor

-- Create Affiliate table
CREATE TABLE IF NOT EXISTS "Affiliate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "discountCode" TEXT NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalSales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Affiliate_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Affiliate_userId_key" UNIQUE ("userId"),
    CONSTRAINT "Affiliate_discountCode_key" UNIQUE ("discountCode"),
    CONSTRAINT "Affiliate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for Affiliate
CREATE INDEX IF NOT EXISTS "Affiliate_discountCode_idx" ON "Affiliate"("discountCode");
CREATE INDEX IF NOT EXISTS "Affiliate_userId_idx" ON "Affiliate"("userId");

-- Create AffiliateInvite table
CREATE TABLE IF NOT EXISTS "AffiliateInvite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "AffiliateInvite_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AffiliateInvite_token_key" UNIQUE ("token")
);

-- Create indexes for AffiliateInvite
CREATE INDEX IF NOT EXISTS "AffiliateInvite_token_idx" ON "AffiliateInvite"("token");
CREATE INDEX IF NOT EXISTS "AffiliateInvite_email_idx" ON "AffiliateInvite"("email");

-- Create AffiliateClick table for tracking QR scans and link visits
CREATE TABLE IF NOT EXISTS "AffiliateClick" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'qr',
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "AffiliateClick_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AffiliateClick_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for AffiliateClick
CREATE INDEX IF NOT EXISTS "AffiliateClick_affiliateId_idx" ON "AffiliateClick"("affiliateId");
CREATE INDEX IF NOT EXISTS "AffiliateClick_createdAt_idx" ON "AffiliateClick"("createdAt");

-- Add affiliateId column to Order table
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "affiliateId" TEXT;

-- Create index for affiliateId on Order
CREATE INDEX IF NOT EXISTS "Order_affiliateId_idx" ON "Order"("affiliateId");

-- Add foreign key constraint for affiliateId
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Order_affiliateId_fkey'
    ) THEN
        ALTER TABLE "Order" 
        ADD CONSTRAINT "Order_affiliateId_fkey" 
        FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Update timestamp trigger for Affiliate
CREATE OR REPLACE FUNCTION update_affiliate_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_affiliate_timestamp ON "Affiliate";
CREATE TRIGGER update_affiliate_timestamp
    BEFORE UPDATE ON "Affiliate"
    FOR EACH ROW
    EXECUTE PROCEDURE update_affiliate_timestamp();

SELECT 'Affiliate program tables created successfully!' as result;

