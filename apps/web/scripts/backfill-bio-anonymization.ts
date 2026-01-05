#!/usr/bin/env npx tsx
// ============================================================================
// BACKFILL BIO ANONYMIZATION SCRIPT
// ============================================================================
// Generates bio_anonymized for existing candidates that have bio_full but
// don't have bio_anonymized yet (migration from old regex-based system).
//
// Usage:
//   npx tsx scripts/backfill-bio-anonymization.ts --check-only
//   npx tsx scripts/backfill-bio-anonymization.ts --dry-run --limit=5
//   npx tsx scripts/backfill-bio-anonymization.ts --limit=100 --concurrency=5
//   npx tsx scripts/backfill-bio-anonymization.ts --force --limit=50
//
// Environment variables required:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   ANTHROPIC_API_KEY
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import {
  aiAnonymizeBiosBatch,
  validateAnonymizedBio,
  bioNeedsAnonymization,
} from '@lighthouse/ai';

// ----------------------------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------------------------

const args = process.argv.slice(2);
const getArg = (name: string): string | undefined => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg?.split('=')[1];
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const CONFIG = {
  checkOnly: hasFlag('check-only'), // Just count, don't process
  dryRun: hasFlag('dry-run'), // Test logic, don't write to DB
  limit: parseInt(getArg('limit') || '100', 10),
  concurrency: parseInt(getArg('concurrency') || '5', 10),
  force: hasFlag('force'), // Re-anonymize even if bio_anonymized exists
  verbose: hasFlag('verbose'),
};

// ----------------------------------------------------------------------------
// SUPABASE CLIENT
// ----------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ Missing ANTHROPIC_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ----------------------------------------------------------------------------
// MAIN LOGIC
// ----------------------------------------------------------------------------

interface CandidateToAnonymize {
  id: string;
  first_name: string;
  last_name: string;
  bio_full: string;
  bio_anonymized: string | null;
}

async function main() {
  console.log('\n🔒 Bio Anonymization Backfill');
  console.log('================================\n');
  console.log('Config:', {
    ...CONFIG,
    mode: CONFIG.checkOnly ? 'CHECK ONLY' : CONFIG.dryRun ? 'DRY RUN' : 'LIVE',
  });
  console.log('');

  // Fetch candidates needing anonymization
  let query = supabase
    .from('candidates')
    .select('id, first_name, last_name, bio_full, bio_anonymized')
    .is('deleted_at', null)
    .not('bio_full', 'is', null);

  if (!CONFIG.force) {
    // Only process candidates missing bio_anonymized
    query = query.is('bio_anonymized', null);
  }

  query = query.limit(CONFIG.limit);

  const { data: candidates, error: fetchError } = await query;

  if (fetchError) {
    console.error('❌ Failed to fetch candidates:', fetchError);
    process.exit(1);
  }

  if (!candidates || candidates.length === 0) {
    console.log('✅ No candidates need anonymization!');
    process.exit(0);
  }

  console.log(`📊 Found ${candidates.length} candidates to process\n`);

  // CHECK ONLY mode
  if (CONFIG.checkOnly) {
    console.log('CHECK ONLY MODE - Scanning for PII patterns...\n');

    let needsAnonymization = 0;
    for (const candidate of candidates) {
      if (bioNeedsAnonymization(candidate.bio_full, candidate.first_name, candidate.last_name)) {
        needsAnonymization++;
        if (CONFIG.verbose) {
          console.log(`  ⚠️  ${candidate.first_name} ${candidate.last_name} - Contains PII patterns`);
        }
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`  Total candidates checked: ${candidates.length}`);
    console.log(`  Candidates with PII patterns: ${needsAnonymization}`);
    console.log(`  Already clean: ${candidates.length - needsAnonymization}`);

    process.exit(0);
  }

  // Process candidates
  console.log('🚀 Starting anonymization...\n');

  const stats = {
    total: candidates.length,
    success: 0,
    failed: 0,
    validated: 0,
    warnings: 0,
  };

  // Process in batches
  for (let i = 0; i < candidates.length; i += CONFIG.concurrency) {
    const batch = candidates.slice(i, i + CONFIG.concurrency);

    console.log(`📦 Processing batch ${Math.floor(i / CONFIG.concurrency) + 1}/${Math.ceil(candidates.length / CONFIG.concurrency)}...`);

    // Anonymize batch using AI
    const batchInput = batch.map(c => ({
      id: c.id,
      bioFull: c.bio_full,
      firstName: c.first_name,
      lastName: c.last_name,
    }));

    const results = await aiAnonymizeBiosBatch(batchInput, CONFIG.concurrency);

    // Process results
    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const candidate = batch[j];

      if (result.error) {
        stats.failed++;
        console.error(`  ❌ ${candidate.first_name} ${candidate.last_name}: ${result.error}`);
        continue;
      }

      // Validate the anonymized bio
      const validationWarnings = validateAnonymizedBio(
        result.bioAnonymized,
        candidate.first_name,
        candidate.last_name,
        null, // We don't have yacht/property names in this query, validation will be basic
        null
      );

      if (validationWarnings.length > 0) {
        stats.warnings++;
        console.warn(`  ⚠️  ${candidate.first_name} ${candidate.last_name}: Validation warnings:`);
        validationWarnings.forEach(w => console.warn(`      - ${w}`));
      } else {
        stats.validated++;
      }

      if (CONFIG.verbose) {
        console.log(`  ℹ️  ${candidate.first_name} ${candidate.last_name}:`);
        console.log(`      Original: ${candidate.bio_full.substring(0, 100)}...`);
        console.log(`      Anonymized: ${result.bioAnonymized.substring(0, 100)}...`);
      }

      // DRY RUN mode - don't write to database
      if (CONFIG.dryRun) {
        console.log(`  🔍 [DRY RUN] Would update ${candidate.first_name} ${candidate.last_name}`);
        stats.success++;
        continue;
      }

      // LIVE mode - write to database
      const { error: updateError } = await supabase
        .from('candidates')
        .update({
          bio_anonymized: result.bioAnonymized,
        })
        .eq('id', candidate.id);

      if (updateError) {
        stats.failed++;
        console.error(`  ❌ ${candidate.first_name} ${candidate.last_name}: Failed to update DB - ${updateError.message}`);
      } else {
        stats.success++;
        console.log(`  ✅ ${candidate.first_name} ${candidate.last_name}`);
      }
    }
  }

  // Final report
  console.log('\n📊 FINAL REPORT');
  console.log('================');
  console.log(`Total processed: ${stats.total}`);
  console.log(`✅ Successful: ${stats.success}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`🛡️  Passed validation: ${stats.validated}`);
  console.log(`⚠️  Validation warnings: ${stats.warnings}`);

  if (CONFIG.dryRun) {
    console.log('\n💡 This was a DRY RUN - no changes were made to the database.');
    console.log('   Remove --dry-run flag to apply changes.');
  }

  if (stats.warnings > 0) {
    console.log('\n⚠️  WARNING: Some anonymized bios still contain PII patterns.');
    console.log('   Review the warnings above and consider manual review.');
  }

  if (stats.failed > 0) {
    console.log('\n⚠️  Some candidates failed to process. Check errors above.');
    process.exit(1);
  }

  console.log('\n✅ Backfill complete!');
}

// Run main
main().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
