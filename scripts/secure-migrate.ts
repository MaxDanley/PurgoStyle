#!/usr/bin/env tsx

/**
 * SECURE DATABASE MIGRATION SCRIPT
 * 
 * ⚠️  SECURITY WARNING: This script should ONLY be run locally or in secure environments
 * 
 * This script creates the missing database schema elements safely.
 * It should NEVER be exposed as an API endpoint.
 * 
 * Usage:
 * 1. Run locally: npx tsx scripts/secure-migrate.ts
 * 2. Or compile and run: npm run migrate:secure
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function secureMigration() {
  console.log('🔒 Starting SECURE database migration...');
  console.log('⚠️  This should only be run in secure environments!');
  
  try {
    // Check environment
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_PRODUCTION_MIGRATION) {
      throw new Error('Production migration blocked. Set ALLOW_PRODUCTION_MIGRATION=true to override');
    }

    console.log('📋 Checking current database schema...');

    // Create DiscountType enum if it doesn't exist
    try {
      await prisma.$executeRaw`
        CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT')
      `;
      console.log('✅ Created DiscountType enum');
    } catch (error: any) {
      if (error.code === '42710') {
        console.log('✅ DiscountType enum already exists');
      } else {
        console.error('❌ Failed to create DiscountType enum:', error.message);
        throw error;
      }
    }

    // Create DiscountCode table if it doesn't exist
    try {
      await prisma.$executeRaw`
        CREATE TABLE "DiscountCode" (
          "id" TEXT NOT NULL,
          "code" TEXT NOT NULL,
          "description" TEXT,
          "discountType" "DiscountType" NOT NULL DEFAULT 'PERCENTAGE',
          "discountAmount" DOUBLE PRECISION NOT NULL,
          "minOrderAmount" DOUBLE PRECISION,
          "maxDiscount" DOUBLE PRECISION,
          "usageLimit" INTEGER,
          "usageCount" INTEGER NOT NULL DEFAULT 0,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "expiresAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "DiscountCode_pkey" PRIMARY KEY ("id")
        )
      `;
      console.log('✅ Created DiscountCode table');
    } catch (error: any) {
      if (error.code === '42P07') {
        console.log('✅ DiscountCode table already exists');
      } else {
        console.error('❌ Failed to create DiscountCode table:', error.message);
        throw error;
      }
    }

    // Add unique constraint on DiscountCode.code
    try {
      await prisma.$executeRaw`
        ALTER TABLE "DiscountCode" ADD CONSTRAINT "DiscountCode_code_key" UNIQUE ("code")
      `;
      console.log('✅ Added unique constraint to DiscountCode.code');
    } catch (error: any) {
      if (error.code === '42710') {
        console.log('✅ Unique constraint already exists');
      } else {
        console.error('❌ Failed to add unique constraint:', error.message);
        throw error;
      }
    }

    // Check if discountCodeId column exists in Order table
    const discountCodeIdExists = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Order' 
      AND column_name = 'discountCodeId'
    `;

    if (Array.isArray(discountCodeIdExists) && discountCodeIdExists.length === 0) {
      await prisma.$executeRaw`
        ALTER TABLE "Order" ADD COLUMN "discountCodeId" TEXT
      `;
      console.log('✅ Added discountCodeId column to Order table');
    } else {
      console.log('✅ discountCodeId column already exists');
    }

    // Check if discountAmount column exists in Order table
    const discountAmountExists = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Order' 
      AND column_name = 'discountAmount'
    `;

    if (Array.isArray(discountAmountExists) && discountAmountExists.length === 0) {
      await prisma.$executeRaw`
        ALTER TABLE "Order" ADD COLUMN "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0
      `;
      console.log('✅ Added discountAmount column to Order table');
    } else {
      console.log('✅ discountAmount column already exists');
    }

    // Add foreign key constraint
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Order" 
        ADD CONSTRAINT "Order_discountCodeId_fkey" 
        FOREIGN KEY ("discountCodeId") 
        REFERENCES "DiscountCode"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE
      `;
      console.log('✅ Added foreign key constraint');
    } catch (error: any) {
      if (error.code === '42710') {
        console.log('✅ Foreign key constraint already exists');
      } else {
        console.error('❌ Failed to add foreign key constraint:', error.message);
        throw error;
      }
    }

    console.log('🎉 SECURE migration completed successfully!');
    console.log('🔒 Database schema is now secure and up-to-date');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
secureMigration();
