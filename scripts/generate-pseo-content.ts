import 'dotenv/config'; // Load environment variables
import { generatePSEOContent } from '../lib/pseo-generator';

/**
 * Manual script to generate PSEO content
 * Run with: npm run generate:pseo
 * Or set DRY_RUN=true to test without saving
 */
async function main() {
  const DRY_RUN = process.env.DRY_RUN === 'true';
  const BATCH_SIZE = process.env.PSEO_BATCH_SIZE ? parseInt(process.env.PSEO_BATCH_SIZE) : 5;

  console.log("🚀 Starting PSEO Content Generation (Manual Script)...");
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log(`Batch Size: ${BATCH_SIZE}`);

  const result = await generatePSEOContent({
    batchSize: BATCH_SIZE,
    dryRun: DRY_RUN
  });

  console.log(`\n✅ ${result.message}`);
  process.exit(result.success ? 0 : 1);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
