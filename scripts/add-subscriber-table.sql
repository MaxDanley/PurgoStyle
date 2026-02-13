-- Migration script to add Subscriber table and related enums
-- Run this script on your PostgreSQL database before running the TypeScript migration

BEGIN;

-- Create enums
DO $$ BEGIN
    CREATE TYPE "SubscriberSource" AS ENUM (
        'DISCOUNT_SIGNUP',
        'CHECKOUT_OPT_IN',
        'USER_ACCOUNT',
        'STOCK_NOTIFICATION',
        'MANUAL_IMPORT',
        'OTHER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SubscriberStatus" AS ENUM (
        'ACTIVE',
        'UNSUBSCRIBED',
        'BOUNCED',
        'COMPLAINED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Subscriber table
CREATE TABLE IF NOT EXISTS "Subscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "source" "SubscriberSource" NOT NULL,
    "status" "SubscriberStatus" NOT NULL DEFAULT 'ACTIVE',
    "resendContactId" TEXT,
    "resendAudienceId" TEXT,
    "promotions" BOOLEAN NOT NULL DEFAULT true,
    "newsletters" BOOLEAN NOT NULL DEFAULT true,
    "research" BOOLEAN NOT NULL DEFAULT true,
    "firstName" TEXT,
    "lastName" TEXT,
    "userId" TEXT,
    "discountCodeId" TEXT,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on email
CREATE UNIQUE INDEX IF NOT EXISTS "Subscriber_email_key" ON "Subscriber"("email");

-- Create indexes
CREATE INDEX IF NOT EXISTS "Subscriber_email_idx" ON "Subscriber"("email");
CREATE INDEX IF NOT EXISTS "Subscriber_status_idx" ON "Subscriber"("status");
CREATE INDEX IF NOT EXISTS "Subscriber_source_idx" ON "Subscriber"("source");
CREATE INDEX IF NOT EXISTS "Subscriber_resendContactId_idx" ON "Subscriber"("resendContactId");
CREATE INDEX IF NOT EXISTS "Subscriber_userId_idx" ON "Subscriber"("userId");

-- Add foreign key constraints
DO $$ BEGIN
    ALTER TABLE "Subscriber" ADD CONSTRAINT "Subscriber_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Subscriber" ADD CONSTRAINT "Subscriber_discountCodeId_fkey" 
        FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

COMMIT;

