import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Migration script to populate Subscriber table from existing data sources:
 * 1. Extract emails from DiscountCode.description field
 * 2. Create Subscriber records for all EmailPreferences entries
 * 3. Create Subscriber records for all users with accounts
 * 4. Create Subscriber records for guest orders (if email exists)
 * 5. Link existing discount codes to subscribers
 */
async function main() {
  console.log("🌱 Starting migration to Subscriber model...");

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  // 1. Extract emails from DiscountCode.description and create subscribers
  console.log("\n📧 Step 1: Processing discount code signups...");
  const discountCodes = await prisma.discountCode.findMany({
    where: {
      description: {
        contains: "Welcome discount for",
      },
    },
  });

  for (const code of discountCodes) {
    // Extract email from description (format: "Welcome discount for email@example.com")
    const emailMatch = code.description?.match(/Welcome discount for (.+)/);
    if (emailMatch && emailMatch[1]) {
      const email = emailMatch[1].trim();
      
      if (email.includes("@")) {
        try {
          const subscriber = await prisma.subscriber.upsert({
            where: { email },
            update: {
              discountCodeId: code.id,
              source: "DISCOUNT_SIGNUP",
            },
            create: {
              email,
              source: "DISCOUNT_SIGNUP",
              status: "ACTIVE",
              discountCodeId: code.id,
              promotions: true,
              newsletters: true,
              research: true,
            },
          });
          
          if (subscriber.createdAt.getTime() === subscriber.updatedAt.getTime()) {
            createdCount++;
          } else {
            updatedCount++;
          }
        } catch (error: any) {
          if (error.code !== "P2002") {
            // P2002 is unique constraint - expected if already exists
            console.error(`Error creating subscriber for ${email}:`, error);
          } else {
            skippedCount++;
          }
        }
      }
    }
  }

  // 2. Create Subscriber records for all EmailPreferences entries
  console.log("\n📧 Step 2: Processing EmailPreferences...");
  const emailPreferences = await prisma.emailPreferences.findMany();

  for (const pref of emailPreferences) {
    try {
      const subscriber = await prisma.subscriber.upsert({
        where: { email: pref.email },
        update: {
          promotions: pref.promotions,
          newsletters: pref.newsletters,
          research: pref.research,
          status: pref.promotions || pref.newsletters || pref.research ? "ACTIVE" : "UNSUBSCRIBED",
          unsubscribedAt: !pref.promotions && !pref.newsletters && !pref.research ? new Date() : null,
        },
        create: {
          email: pref.email,
          source: "USER_ACCOUNT", // Default - may be updated later
          status: pref.promotions || pref.newsletters || pref.research ? "ACTIVE" : "UNSUBSCRIBED",
          promotions: pref.promotions,
          newsletters: pref.newsletters,
          research: pref.research,
          unsubscribedAt: !pref.promotions && !pref.newsletters && !pref.research ? new Date() : null,
        },
      });

      if (subscriber.createdAt.getTime() === subscriber.updatedAt.getTime()) {
        createdCount++;
      } else {
        updatedCount++;
      }
    } catch (error: any) {
      if (error.code !== "P2002") {
        console.error(`Error creating subscriber for ${pref.email}:`, error);
      } else {
        skippedCount++;
      }
    }
  }

  // 3. Create Subscriber records for all users with accounts
  console.log("\n👤 Step 3: Processing User accounts...");
  const users = await prisma.user.findMany();

  for (const user of users) {
    try {
      // Check if subscriber already exists
      const existingSubscriber = await prisma.subscriber.findUnique({
        where: { email: user.email },
      });

      if (!existingSubscriber) {
        // Check if user has email preferences
        const pref = await prisma.emailPreferences.findUnique({
          where: { email: user.email },
        });

        await prisma.subscriber.create({
          data: {
            email: user.email,
            userId: user.id,
            source: "USER_ACCOUNT",
            status: "ACTIVE",
            firstName: user.name?.split(' ')[0] || undefined,
            lastName: user.name?.split(' ').slice(1).join(' ') || undefined,
            promotions: pref?.promotions ?? true,
            newsletters: pref?.newsletters ?? true,
            research: pref?.research ?? true,
          },
        });
        createdCount++;
      } else {
        // Update existing subscriber to link user
        await prisma.subscriber.update({
          where: { id: existingSubscriber.id },
          data: {
            userId: user.id,
            firstName: user.name?.split(' ')[0] || existingSubscriber.firstName,
            lastName: user.name?.split(' ').slice(1).join(' ') || existingSubscriber.lastName,
          },
        });
        updatedCount++;
      }
    } catch (error: any) {
      if (error.code !== "P2002") {
        console.error(`Error creating subscriber for user ${user.email}:`, error);
      } else {
        skippedCount++;
      }
    }
  }

  // 4. Create Subscriber records for guest orders (if email exists and not already a subscriber)
  console.log("\n🛒 Step 4: Processing guest orders...");
  const guestOrders = await prisma.order.findMany({
    where: {
      email: {
        not: null,
      },
      userId: null, // Guest orders only
    },
    select: {
      email: true,
    },
    distinct: ["email"],
  });

  for (const order of guestOrders) {
    if (order.email) {
      try {
        const existingSubscriber = await prisma.subscriber.findUnique({
          where: { email: order.email },
        });

        if (!existingSubscriber) {
          await prisma.subscriber.create({
            data: {
              email: order.email,
              source: "CHECKOUT_OPT_IN", // Assume they opted in if they made an order
              status: "ACTIVE",
              promotions: true,
              newsletters: true,
              research: true,
            },
          });
          createdCount++;
        }
      } catch (error: any) {
        if (error.code !== "P2002") {
          console.error(`Error creating subscriber for guest order ${order.email}:`, error);
        } else {
          skippedCount++;
        }
      }
    }
  }

  console.log("\n✅ Migration completed!");
  console.log(`   Created: ${createdCount} subscribers`);
  console.log(`   Updated: ${updatedCount} subscribers`);
  console.log(`   Skipped: ${skippedCount} (already existed)`);
  console.log(`   Total processed: ${createdCount + updatedCount + skippedCount}`);
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

