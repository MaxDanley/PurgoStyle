import { PrismaClient, DiscountType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample discount codes
  const discountCodes = [
    {
      code: 'WELCOME20',
      description: 'Welcome discount - 20% off your first order',
      discountType: DiscountType.PERCENTAGE,
      discountAmount: 20,
      minOrderAmount: 50,
      maxDiscount: 25,
      usageLimit: 100,
      isActive: true,
    },
    {
      code: 'SAVE10',
      description: 'Save $10 on orders over $75',
      discountType: DiscountType.FIXED_AMOUNT,
      discountAmount: 10,
      minOrderAmount: 75,
      usageLimit: 50,
      isActive: true,
    },
    {
      code: 'FIRSTORDER',
      description: 'First order special - 15% off',
      discountType: DiscountType.PERCENTAGE,
      discountAmount: 15,
      minOrderAmount: 25,
      maxDiscount: 20,
      usageLimit: 200,
      isActive: true,
    },
  ];

  for (const discountData of discountCodes) {
    const existingCode = await prisma.discountCode.findUnique({
      where: { code: discountData.code },
    });

    if (!existingCode) {
      await prisma.discountCode.create({
        data: discountData,
      });
      console.log(`✅ Created discount code: ${discountData.code}`);
    } else {
      console.log(`⏭️  Discount code already exists: ${discountData.code}`);
    }
  }

  // Update your user to ADMIN role (replace with your email)
  const adminEmail = 'your-email@example.com'; // ⚠️ CHANGE THIS TO YOUR ACTUAL EMAIL
  
  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (adminUser) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'ADMIN' },
    });
    console.log(`✅ Updated user ${adminEmail} to ADMIN role`);
  } else {
    console.log(`⚠️  User with email ${adminEmail} not found. Please create an account first.`);
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
