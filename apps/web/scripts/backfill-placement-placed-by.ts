#!/usr/bin/env npx tsx
/**
 * Backfill Placement Placed By from Vincere
 *
 * Updates placements with vincere_placed_by_id and placed_by_name from Vincere API.
 *
 * IMPORTANT: The "placed_by" field on the placement itself is just the admin who
 * recorded the placement in the system. The actual consultant who made the placement
 * is stored as "application_user_id" on the associated application record.
 *
 * Usage:
 *   npx tsx apps/web/scripts/backfill-placement-placed-by.ts [options]
 *
 * Options:
 *   --dry-run     Preview what would be updated without making changes
 *   --verbose     Show detailed progress
 *   --limit=N     Process only N placements
 */

import * as path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: path.join(__dirname, '../.env.local') });

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');
const limitArg = args.find(a => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;

/**
 * Vincere user ID to name mapping
 */
const VINCERE_USER_NAMES: Record<number, string> = {
  28955: 'Milica Seguela',
  28957: 'Catherine Coulibaly',
  28959: 'Admin',
  28960: 'Kiera Cavanagh',
  28961: 'Francesca Zanfagna',
  28963: 'Kate Burns',
  28964: 'Debbie Blazy',
  28965: 'Ivana Novakovic',
  28966: 'Tracy Gueli',
  28967: 'Sonia Szostok',
  28968: 'Laura Cubie',
  28969: 'Kaoutar Zahouane',
  28970: 'Charles Cartledge',
  28971: 'Pamela Moyes',
  28973: 'Marc Stevens',
  28974: 'Shelley Viljoen',
  28975: 'Ornela Grmusa',
  28976: 'Phil Richards',
  28977: 'India Thomson-Virtue',
  28978: 'Joaneen Botha',
  29011: 'Laura Hayes',
  29044: 'Britt McBride',
  29077: 'Tiffany Hutton',
  29110: 'Waldi Coetzee',
  29143: 'Svetlana Blake',
  [-1]: 'Company Admin',
  [-10]: 'System Admin',
};

// Import Vincere client
import { getVincereClient } from '../lib/vincere/client';

/**
 * Create Supabase client
 */
function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(url, key);
}

/**
 * Sleep helper for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main backfill function
 */
async function backfillPlacementPlacedBy() {
  console.log('='.repeat(60));
  console.log('BACKFILL PLACEMENT PLACED_BY FROM VINCERE');
  console.log('='.repeat(60));
  console.log();

  if (isDryRun) {
    console.log('DRY RUN MODE - No changes will be made');
    console.log();
  }

  // Initialize clients
  const supabase = getSupabaseClient();
  const vincere = getVincereClient();

  // Get all placements - we need to re-run all to fix the data
  console.log('Fetching placements from database...');

  let query = supabase
    .from('placements')
    .select('id, vincere_id')
    .not('vincere_id', 'is', null);

  if (limit) {
    query = query.limit(limit);
  }

  const { data: placements, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch placements: ${error.message}`);
  }

  if (!placements || placements.length === 0) {
    console.log('No placements need updating');
    return;
  }

  console.log(`Found ${placements.length} placements to process`);

  // Process placements
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  const placedByStats = new Map<string, number>();

  for (let i = 0; i < placements.length; i++) {
    const placement = placements[i];
    const vincerePlacementId = placement.vincere_id;

    try {
      // Fetch placement from Vincere to get application_id
      const vincerePlacement = await vincere.get<any>(`/placement/${vincerePlacementId}`);

      if (!vincerePlacement) {
        if (isVerbose) console.log(`  Skipping ${vincerePlacementId}: Not found in Vincere`);
        skipped++;
        continue;
      }

      // The actual "placed by" person is on the application, not the placement
      // placement.placed_by is just the admin who recorded it
      const applicationId = vincerePlacement.application_id;
      if (!applicationId) {
        if (isVerbose) console.log(`  Skipping ${vincerePlacementId}: No application_id`);
        skipped++;
        continue;
      }

      // Fetch the application to get the actual consultant
      const application = await vincere.get<any>(`/application/${applicationId}`);
      if (!application) {
        if (isVerbose) console.log(`  Skipping ${vincerePlacementId}: Application ${applicationId} not found`);
        skipped++;
        continue;
      }

      // application_user_id is the consultant who worked the placement
      const placedById = application.application_user_id;
      if (!placedById) {
        if (isVerbose) console.log(`  Skipping ${vincerePlacementId}: No application_user_id`);
        skipped++;
        continue;
      }

      const placedByName = VINCERE_USER_NAMES[placedById] || `Unknown (${placedById})`;

      // Track stats
      placedByStats.set(placedByName, (placedByStats.get(placedByName) || 0) + 1);

      if (isVerbose) {
        console.log(`  Placement ${vincerePlacementId}: placed_by ${placedById} (${placedByName})`);
      }

      if (!isDryRun) {
        // Update the placement
        const { error: updateError } = await supabase
          .from('placements')
          .update({
            vincere_placed_by_id: placedById,
            placed_by_name: placedByName,
          })
          .eq('id', placement.id);

        if (updateError) {
          errors++;
          if (isVerbose) {
            console.error(`  Error updating placement ${placement.id}:`, updateError.message);
          }
        } else {
          updated++;
        }
      } else {
        updated++;
      }

      // Rate limit - 100ms between API calls
      await sleep(100);

    } catch (err) {
      errors++;
      if (isVerbose) {
        console.error(`  Error processing placement ${vincerePlacementId}:`, (err as Error).message);
      }
    }

    // Progress update every 50 placements
    if ((i + 1) % 50 === 0 || i === placements.length - 1) {
      console.log(`  Progress: ${i + 1}/${placements.length} (${updated} updated, ${skipped} skipped, ${errors} errors)`);
    }
  }

  // Summary
  console.log();
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Placements ${isDryRun ? 'would be' : ''} updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  if (errors > 0) {
    console.log(`Errors: ${errors}`);
  }

  // Print placed_by breakdown
  console.log('\nPlacements by team member:');
  const sortedStats = Array.from(placedByStats.entries()).sort((a, b) => b[1] - a[1]);

  for (const [name, count] of sortedStats) {
    console.log(`  ${name}: ${count} placements`);
  }
}

// Run the backfill
backfillPlacementPlacedBy().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
