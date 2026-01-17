#!/usr/bin/env npx tsx
/**
 * Script to normalize existing highest_license values in the database
 *
 * The database has inconsistent license formats:
 * - "Power Boat 2" vs "powerboat_level_2"
 * - "Master  3000" (double space) vs "master_3000gt"
 * - "yacht_master_offshore" vs "yachtmaster_offshore"
 *
 * This script normalizes all to canonical snake_case format.
 *
 * Usage:
 *   npx tsx apps/web/scripts/normalize-licenses.ts --dry-run
 *   npx tsx apps/web/scripts/normalize-licenses.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';

// License normalization map (same as in cv-extraction)
const LICENSE_NORMALIZATION_MAP: Record<string, string> = {
  // Powerboat variations
  'power boat 2': 'powerboat_level_2',
  'powerboat level 2': 'powerboat_level_2',
  'powerboat_level_2': 'powerboat_level_2',
  'pb2': 'powerboat_level_2',
  'rya powerboat level 2': 'powerboat_level_2',
  'powerboat': 'powerboat_level_2',

  // Day skipper
  'day skipper': 'day_skipper',
  'day_skipper': 'day_skipper',
  'rya day skipper': 'day_skipper',

  // Coastal skipper
  'coastal skipper': 'coastal_skipper',
  'coastal_skipper': 'coastal_skipper',
  'rya coastal skipper': 'coastal_skipper',

  // Yachtmaster Coastal
  'yachtmaster coastal': 'yachtmaster_coastal',
  'yachtmaster_coastal': 'yachtmaster_coastal',
  'rya yachtmaster coastal': 'yachtmaster_coastal',
  'yacht master coastal': 'yachtmaster_coastal',

  // Yachtmaster Offshore
  'yachtmaster offshore': 'yachtmaster_offshore',
  'yachtmaster_offshore': 'yachtmaster_offshore',
  'yacht master offshore': 'yachtmaster_offshore',
  'yacht_master_offshore': 'yachtmaster_offshore',
  'rya yachtmaster offshore': 'yachtmaster_offshore',
  'rya yacht master offshore': 'yachtmaster_offshore',

  // Yachtmaster Ocean
  'yachtmaster ocean': 'yachtmaster_ocean',
  'yachtmaster_ocean': 'yachtmaster_ocean',
  'yacht master ocean': 'yachtmaster_ocean',
  'yacht_master_ocean': 'yachtmaster_ocean',
  'rya yachtmaster ocean': 'yachtmaster_ocean',

  // Yacht Rating (basic deck)
  'yacht rating': 'yacht_rating',
  'yacht_rating': 'yacht_rating',

  // OOW (Officer of the Watch)
  'oow': 'ow_3000gt',
  'oow 3000': 'ow_3000gt',
  'oow 3000gt': 'ow_3000gt',
  'ow_3000gt': 'ow_3000gt',
  'oow_3000gt': 'ow_3000gt',
  'oow unlimited': 'ow_unlimited',
  'ow_unlimited': 'ow_unlimited',
  'oow_unlimited': 'ow_unlimited',
  'mca oow': 'ow_3000gt',
  'mca_oow': 'ow_3000gt',
  'officer of the watch': 'ow_3000gt',
  'oow unlimited': 'ow_unlimited',

  // Chief Mate
  'chief mate': 'chief_mate_unlimited',
  'chief mate 3000': 'chief_mate_3000gt',
  'chief mate 3000gt': 'chief_mate_3000gt',
  'chief_mate_3000gt': 'chief_mate_3000gt',
  'chief mate unlimited': 'chief_mate_unlimited',
  'chief_mate_unlimited': 'chief_mate_unlimited',
  'chief officer': 'chief_mate_unlimited',
  'chief officer unlimited': 'chief_mate_unlimited',
  'mca chief mate': 'chief_mate_unlimited',
  'mca_chief_mate': 'chief_mate_unlimited',

  // Master 200GT
  'master 200': 'master_200gt',
  'master 200gt': 'master_200gt',
  'master_200gt': 'master_200gt',
  'master_200': 'master_200gt',
  'master of yachts 200gt': 'master_200gt',

  // Master 500GT
  'master 500': 'master_500gt',
  'master 500gt': 'master_500gt',
  'master_500gt': 'master_500gt',
  'master_500': 'master_500gt',
  'master of yachts 500gt': 'master_500gt',

  // Master 3000GT
  'master 3000': 'master_3000gt',
  'master  3000': 'master_3000gt', // Note: double space in data
  'master 3000gt': 'master_3000gt',
  'master_3000gt': 'master_3000gt',
  'master_3000': 'master_3000gt',

  // Master Unlimited
  'master unlimited': 'master_unlimited',
  'master_unlimited': 'master_unlimited',
  'unlimited master': 'master_unlimited',

  // Engineering - AEC
  'aec': 'aec',
  'approved engine course': 'aec',
  'approved_engine_course': 'aec',

  // Engineering - MEOL
  'meol': 'meol',
  'marine engine operator': 'meol',

  // Engineering - Y4/Y3/Y2/Y1
  'y4': 'y4',
  'y3': 'y3',
  'y2': 'y2',
  'y1': 'y1',

  // Engineering - EOOW
  'eoow': 'eoow',
  'eoow unlimited': 'eoow',

  // Engineering - Third Engineer
  'third engineer': 'third_engineer',
  'third_engineer': 'third_engineer',
  '3rd engineer': 'third_engineer',

  // Engineering - Second Engineer
  'second engineer': 'second_engineer_unlimited',
  'second_engineer': 'second_engineer_unlimited',
  '2nd engineer': 'second_engineer_unlimited',
  'second engineer unlimited': 'second_engineer_unlimited',
  'second_engineer_unlimited': 'second_engineer_unlimited',
  'sv 2nd engineer': 'second_engineer_3000kw',
  'second engineer 3000kw': 'second_engineer_3000kw',

  // Engineering - Chief Engineer
  'chief engineer': 'chief_engineer_unlimited',
  'chief_engineer': 'chief_engineer_unlimited',
  'chief engineer unlimited': 'chief_engineer_unlimited',
  'chief_engineer_unlimited': 'chief_engineer_unlimited',
  'chief engineer 3000kw': 'chief_engineer_3000kw',
  'sv chief engineer 3000kw': 'chief_engineer_3000kw',
  'sv chief engineer 9000kw': 'chief_engineer_9000kw',
  'chief engineer 9000kw': 'chief_engineer_9000kw',

  // Medical/Safety certs (often stored as licenses incorrectly)
  'eng1': 'eng1',
  'eng 1': 'eng1',
  'eng-1': 'eng1',
  'eng1 medical': 'eng1',
  'mca eng1': 'eng1',
  'stcw': 'stcw',
};

function normalizeLicense(license: string | null): string | null {
  if (!license) return null;

  const normalized = license.toLowerCase().trim();

  // Direct match
  if (LICENSE_NORMALIZATION_MAP[normalized]) {
    return LICENSE_NORMALIZATION_MAP[normalized];
  }

  // Partial matches for common patterns
  for (const [pattern, canonical] of Object.entries(LICENSE_NORMALIZATION_MAP)) {
    if (normalized.includes(pattern)) {
      return canonical;
    }
  }

  // Already normalized or unknown - convert to snake_case
  return license.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get all distinct license values
  console.log('📊 Fetching distinct highest_license values...\n');

  const { data: licenseData, error: licenseError } = await supabase
    .from('candidates')
    .select('highest_license')
    .not('highest_license', 'is', null)
    .is('deleted_at', null);

  if (licenseError) {
    console.error('❌ Error fetching licenses:', licenseError);
    process.exit(1);
  }

  // Count by license value
  const licenseCounts = new Map<string, number>();
  for (const row of licenseData) {
    const license = row.highest_license as string;
    licenseCounts.set(license, (licenseCounts.get(license) || 0) + 1);
  }

  // Build normalization plan
  const normalizationPlan: Array<{ from: string; to: string; count: number }> = [];

  for (const [license, count] of licenseCounts) {
    const normalized = normalizeLicense(license);
    if (normalized && normalized !== license) {
      normalizationPlan.push({ from: license, to: normalized, count });
    }
  }

  if (normalizationPlan.length === 0) {
    console.log('✅ All licenses are already normalized!');
    return;
  }

  console.log('📋 Normalization Plan:\n');
  console.log('| Current Value | Normalized Value | Count |');
  console.log('|---------------|------------------|-------|');
  for (const { from, to, count } of normalizationPlan.sort((a, b) => b.count - a.count)) {
    console.log(`| ${from.padEnd(30)} | ${to.padEnd(25)} | ${count.toString().padStart(5)} |`);
  }

  const totalRecords = normalizationPlan.reduce((sum, p) => sum + p.count, 0);
  console.log(`\nTotal records to update: ${totalRecords}\n`);

  if (dryRun) {
    console.log('🔍 DRY RUN complete. Run without --dry-run to apply changes.');
    return;
  }

  // Apply updates
  console.log('🔄 Applying normalizations...\n');

  let updated = 0;
  let errors = 0;

  for (const { from, to, count } of normalizationPlan) {
    const { error: updateError, count: updateCount } = await supabase
      .from('candidates')
      .update({ highest_license: to })
      .eq('highest_license', from)
      .is('deleted_at', null);

    if (updateError) {
      console.error(`❌ Error updating "${from}": ${updateError.message}`);
      errors++;
    } else {
      console.log(`✅ Updated "${from}" → "${to}" (${updateCount || count} records)`);
      updated += count;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${updated} records`);
  console.log(`   Errors: ${errors}`);

  // Also normalize second_license if it exists
  console.log('\n🔄 Checking second_license column...\n');

  const { data: secondLicenseData, error: secondError } = await supabase
    .from('candidates')
    .select('second_license')
    .not('second_license', 'is', null)
    .is('deleted_at', null);

  if (secondError) {
    console.error('❌ Error fetching second_license:', secondError);
  } else {
    const secondCounts = new Map<string, number>();
    for (const row of secondLicenseData) {
      const license = row.second_license as string;
      secondCounts.set(license, (secondCounts.get(license) || 0) + 1);
    }

    let secondUpdated = 0;
    for (const [license, count] of secondCounts) {
      const normalized = normalizeLicense(license);
      if (normalized && normalized !== license) {
        const { error: updateError } = await supabase
          .from('candidates')
          .update({ second_license: normalized })
          .eq('second_license', license)
          .is('deleted_at', null);

        if (updateError) {
          console.error(`❌ Error updating second_license "${license}": ${updateError.message}`);
        } else {
          console.log(`✅ Updated second_license "${license}" → "${normalized}" (${count} records)`);
          secondUpdated += count;
        }
      }
    }

    console.log(`\n   Updated second_license: ${secondUpdated} records`);
  }

  console.log('\n✅ License normalization complete!');
}

main().catch(console.error);
