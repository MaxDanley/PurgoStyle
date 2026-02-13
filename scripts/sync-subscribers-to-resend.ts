import { PrismaClient, SubscriberSource } from "@prisma/client";
import { syncSubscriberToResend } from "@/lib/resend-contacts";

const prisma = new PrismaClient();

/**
 * Migration script to sync existing Subscriber records to Resend
 * This adds all existing subscribers to the Resend segment
 */
async function main() {
  console.log("🔄 Starting sync of subscribers to Resend...");

  // Get all active subscribers
  const subscribers = await prisma.subscriber.findMany({
    where: {
      status: "ACTIVE",
    },
  });

  console.log(`📧 Found ${subscribers.length} active subscribers to sync`);

  let syncedCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const subscriber of subscribers) {
    try {
      // Skip if already synced recently (within last hour)
      if (subscriber.lastSyncedAt) {
        const hoursSinceSync = (Date.now() - subscriber.lastSyncedAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceSync < 1) {
          console.log(`⏭️  Skipping ${subscriber.email} - synced ${hoursSinceSync.toFixed(1)} hours ago`);
          skippedCount++;
          continue;
        }
      }

      console.log(`📤 Syncing ${subscriber.email}...`);

      // Sync to Resend
      const resendContactId = await syncSubscriberToResend(
        subscriber.email,
        subscriber.firstName || undefined,
        subscriber.lastName || undefined,
        {
          promotions: subscriber.promotions,
          newsletters: subscriber.newsletters,
          research: subscriber.research,
        },
        subscriber.source.toLowerCase().replace(/_/g, "-") as any,
        !!subscriber.userId // isCustomer if they have a userId
      );

      // Update subscriber with Resend contact ID and sync timestamp
      await prisma.subscriber.update({
        where: { id: subscriber.id },
        data: {
          resendContactId: resendContactId || subscriber.resendContactId, // Keep existing if sync failed
          lastSyncedAt: new Date(),
        },
      });

      syncedCount++;
      console.log(`✅ Synced ${subscriber.email}${resendContactId ? ` (ID: ${resendContactId})` : ""}`);
    } catch (error: any) {
      errorCount++;
      console.error(`❌ Failed to sync ${subscriber.email}:`, error?.message || error);
    }
  }

  console.log("\n✅ Sync completed!");
  console.log(`   Synced: ${syncedCount} subscribers`);
  console.log(`   Skipped: ${skippedCount} (already synced recently)`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Total processed: ${subscribers.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Sync failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

