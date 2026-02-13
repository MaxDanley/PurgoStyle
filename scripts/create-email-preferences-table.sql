-- Create EmailPreferences table
CREATE TABLE IF NOT EXISTS "EmailPreferences" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "promotions" BOOLEAN NOT NULL DEFAULT true,
    "newsletters" BOOLEAN NOT NULL DEFAULT true,
    "research" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "EmailPreferences_pkey" PRIMARY KEY ("id")
);

-- Create unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS "EmailPreferences_email_key" ON "EmailPreferences"("email");

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS "EmailPreferences_email_idx" ON "EmailPreferences"("email");
