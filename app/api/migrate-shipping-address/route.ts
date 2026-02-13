import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Only allow admin users to run migrations
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    console.log('🔄 Starting migration: Make shippingAddressId optional');

    // Run the migration SQL
    await prisma.$executeRaw`
      ALTER TABLE "Order" 
      ALTER COLUMN "shippingAddressId" DROP NOT NULL;
    `;

    console.log('✅ Migration completed successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Migration completed: shippingAddressId is now optional' 
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json(
      { error: "Migration failed", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
