import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Setting up admin access...');
  
  // List all users so you can see which email to use
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log('\n📋 Current users in database:');
  users.forEach((user, index) => {
    console.log(`${index + 1}. Email: ${user.email}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
    console.log('');
  });

  if (users.length === 0) {
    console.log('❌ No users found. Please create an account first at /auth/register');
    return;
  }

  // Update the first user to ADMIN (or you can specify an email)
  const userToUpdate = users[0]; // Change this to select a specific user
  
  console.log(`🔄 Updating user "${userToUpdate.email}" to ADMIN role...`);
  
  const updatedUser = await prisma.user.update({
    where: { id: userToUpdate.id },
    data: { role: UserRole.ADMIN },
  });

  console.log(`✅ Successfully updated ${updatedUser.email} to ADMIN role!`);
  console.log('\n🔑 Next steps:');
  console.log('1. Sign out of your account');
  console.log('2. Sign back in');
  console.log('3. Go to /admin to access the admin dashboard');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
