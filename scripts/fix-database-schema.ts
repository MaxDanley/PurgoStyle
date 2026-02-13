import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDatabaseSchema() {
  try {
    console.log('🔧 Checking database schema...');
    
    // Check if discountCodeId column exists in Order table
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Order' 
      AND column_name = 'discountCodeId'
    `;
    
    if (Array.isArray(result) && result.length === 0) {
      console.log('❌ discountCodeId column missing, adding it...');
      
      // Add the missing column
      await prisma.$executeRaw`
        ALTER TABLE "Order" 
        ADD COLUMN "discountCodeId" TEXT
      `;
      
      // Add foreign key constraint
      await prisma.$executeRaw`
        ALTER TABLE "Order" 
        ADD CONSTRAINT "Order_discountCodeId_fkey" 
        FOREIGN KEY ("discountCodeId") 
        REFERENCES "DiscountCode"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE
      `;
      
      console.log('✅ discountCodeId column added successfully');
    } else {
      console.log('✅ discountCodeId column already exists');
    }
    
    // Check if discountAmount column exists
    const discountAmountResult = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Order' 
      AND column_name = 'discountAmount'
    `;
    
    if (Array.isArray(discountAmountResult) && discountAmountResult.length === 0) {
      console.log('❌ discountAmount column missing, adding it...');
      
      await prisma.$executeRaw`
        ALTER TABLE "Order" 
        ADD COLUMN "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0
      `;
      
      console.log('✅ discountAmount column added successfully');
    } else {
      console.log('✅ discountAmount column already exists');
    }
    
    console.log('🎉 Database schema check complete!');
    
  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixDatabaseSchema()
  .then(() => {
    console.log('✅ Database schema fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database schema fix failed:', error);
    process.exit(1);
  });
