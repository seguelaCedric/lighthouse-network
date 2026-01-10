#!/usr/bin/env npx tsx
/**
 * Import Vincere Placements
 *
 * Imports placements from the Vincere raw JSON export into the placements table.
 * Maps vincere IDs to our internal UUIDs for jobs, candidates, and clients.
 *
 * Usage:
 *   npx tsx apps/web/scripts/import-vincere-placements.ts [options]
 *
 * Options:
 *   --dry-run     Preview what would be imported without making changes
 *   --verbose     Show detailed progress
 *   --limit N     Limit to N placements for testing
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: path.join(__dirname, '../.env.local') });

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');
const limitIndex = args.indexOf('--limit');
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : undefined;

interface VincerePlacement {
  id: number;
  position_id: number;
  application_source_id: number;
  application_id: number;
  _candidate_id: number; // Actual vincere candidate ID from placement reference
  start_date: string | null;
  end_date: string | null;
  currency: string;
  annual_salary: number | null;
  salary_rate_per_month: number | null;
  profit: number | null;
  fee_model_fixed_fee_amount: number | null;
  job_type: string;
  employment_type: string;
  placement_status: number;
  insert_timestamp: string;
  _job_id: number;
  _job_title: string;
  _company_id: number;
  _company_name: string | null;
  _contact_id: number | null;
}

interface IdMapping {
  jobMap: Map<string, string>; // vincere job id (string) -> our job uuid
  candidateMap: Map<string, string>; // vincere candidate id (string) -> our candidate uuid
  clientMap: Map<number, string>; // vincere company id -> our client uuid
}

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
 * Build ID mappings from database
 */
async function buildIdMappings(supabase: SupabaseClient): Promise<IdMapping> {
  console.log('Building ID mappings...');

  // Get job mappings (external_id -> id)
  const jobMap = new Map<string, string>();
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, external_id')
      .eq('external_source', 'vincere')
      .not('external_id', 'is', null)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw new Error(`Failed to fetch jobs: ${error.message}`);
    if (!jobs || jobs.length === 0) break;

    for (const job of jobs) {
      if (job.external_id) {
        jobMap.set(job.external_id, job.id);
      }
    }

    page++;
    if (jobs.length < pageSize) break;
  }
  console.log(`  Jobs: ${jobMap.size} mappings`);

  // Get candidate mappings (vincere_id as string -> id)
  const candidateMap = new Map<string, string>();
  page = 0;

  while (true) {
    const { data: candidates, error } = await supabase
      .from('candidates')
      .select('id, vincere_id')
      .not('vincere_id', 'is', null)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw new Error(`Failed to fetch candidates: ${error.message}`);
    if (!candidates || candidates.length === 0) break;

    for (const candidate of candidates) {
      if (candidate.vincere_id) {
        // vincere_id is stored as text in DB
        candidateMap.set(String(candidate.vincere_id), candidate.id);
      }
    }

    page++;
    if (candidates.length < pageSize) break;
  }
  console.log(`  Candidates: ${candidateMap.size} mappings`);

  // Get client mappings (vincere_id -> id)
  const clientMap = new Map<number, string>();
  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .select('id, vincere_id')
    .not('vincere_id', 'is', null);

  if (clientError) throw new Error(`Failed to fetch clients: ${clientError.message}`);

  for (const client of clients || []) {
    if (client.vincere_id) {
      clientMap.set(client.vincere_id, client.id);
    }
  }
  console.log(`  Clients: ${clientMap.size} mappings`);

  return { jobMap, candidateMap, clientMap };
}

/**
 * Get existing placement vincere_ids to avoid duplicates
 */
async function getExistingPlacements(supabase: SupabaseClient): Promise<Set<number>> {
  const { data, error } = await supabase
    .from('placements')
    .select('vincere_id')
    .not('vincere_id', 'is', null);

  if (error) throw new Error(`Failed to fetch existing placements: ${error.message}`);

  return new Set((data || []).map((p) => p.vincere_id));
}

/**
 * Get agency ID from organizations table (type = 'agency')
 */
async function getAgencyId(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('type', 'agency')
    .limit(1)
    .single();

  if (error || !data) {
    console.log('  No agency found in organizations table - placements will have null placing_agency_id');
    return null;
  }

  return data.id;
}

/**
 * Map placement status
 */
function mapStatus(placementStatus: number): string {
  // placement_status: 1 = active, others = various states
  switch (placementStatus) {
    case 1:
      return 'active';
    case 2:
      return 'completed';
    case 3:
      return 'cancelled';
    default:
      return 'active';
  }
}

/**
 * Main import function
 */
async function importPlacements() {
  console.log('='.repeat(60));
  console.log('IMPORT VINCERE PLACEMENTS');
  console.log('='.repeat(60));
  console.log();

  if (isDryRun) {
    console.log('DRY RUN MODE - No changes will be made');
    console.log();
  }

  // Load raw placements
  const rawPath = path.join(__dirname, '../../../scripts/output/vincere-placements-raw.json');

  if (!fs.existsSync(rawPath)) {
    console.error(`Placements file not found: ${rawPath}`);
    process.exit(1);
  }

  const placements: VincerePlacement[] = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
  console.log(`Loaded ${placements.length} placements from JSON`);

  if (limit) {
    console.log(`Limiting to ${limit} placements`);
  }

  // Initialize Supabase
  const supabase = getSupabaseClient();

  // Get agency ID (optional for Vincere imports)
  const agencyId = await getAgencyId(supabase);
  console.log(`Agency ID: ${agencyId || '(none)'}`);

  // Build ID mappings
  const { jobMap, candidateMap, clientMap } = await buildIdMappings(supabase);

  // Get existing placements
  const existingPlacements = await getExistingPlacements(supabase);
  console.log(`Existing placements in DB: ${existingPlacements.size}`);

  // Process placements
  let imported = 0;
  let skipped = 0;
  let missingJob = 0;
  let missingCandidate = 0;
  let missingClient = 0;
  let errors = 0;

  const placementsToProcess = limit ? placements.slice(0, limit) : placements;

  console.log(`\nProcessing ${placementsToProcess.length} placements...`);

  for (let i = 0; i < placementsToProcess.length; i++) {
    const placement = placementsToProcess[i];

    // Skip if already imported
    if (existingPlacements.has(placement.id)) {
      skipped++;
      continue;
    }

    // Get mapped IDs
    const jobId = jobMap.get(String(placement._job_id || placement.position_id));
    // Use _candidate_id which is the actual vincere candidate ID from placement reference
    // Convert to string since vincere_id is stored as text in DB
    const candidateId = candidateMap.get(String(placement._candidate_id));
    const clientId = clientMap.get(placement._company_id);

    if (!jobId) {
      missingJob++;
      if (isVerbose) {
        console.log(`  Skipping placement ${placement.id}: job ${placement._job_id} not found`);
      }
      continue;
    }

    if (!candidateId) {
      missingCandidate++;
      if (isVerbose) {
        console.log(
          `  Skipping placement ${placement.id}: candidate ${placement._candidate_id} not found`
        );
      }
      continue;
    }

    if (!clientId) {
      missingClient++;
      if (isVerbose) {
        console.log(`  Skipping placement ${placement.id}: client ${placement._company_id} not found`);
      }
      continue;
    }

    // Calculate fee - prefer profit, then fee_model_fixed_fee_amount
    const totalFee = placement.profit || placement.fee_model_fixed_fee_amount || null;

    // Build placement record
    const placementRecord: Record<string, unknown> = {
      vincere_id: placement.id,
      job_id: jobId,
      candidate_id: candidateId,
      client_id: clientId,
      start_date: placement.start_date ? placement.start_date.split('T')[0] : null,
      end_date: placement.end_date ? placement.end_date.split('T')[0] : null,
      salary_agreed: placement.annual_salary ? Math.round(placement.annual_salary) : null,
      salary_currency: placement.currency?.toUpperCase() || 'EUR',
      total_fee: totalFee,
      fee_currency: placement.currency?.toUpperCase() || 'EUR',
      placing_agency_fee: totalFee, // Agency gets full fee for direct placements
      status: mapStatus(placement.placement_status),
      created_at: placement.insert_timestamp || new Date().toISOString(),
    };

    // Add agency ID if available
    if (agencyId) {
      placementRecord.placing_agency_id = agencyId;
    }

    if (isVerbose || (i + 1) % 200 === 0) {
      console.log(
        `  [${i + 1}/${placementsToProcess.length}] Placement ${placement.id}: ${placement._job_title} - EUR ${totalFee || 0}`
      );
    }

    if (isDryRun) {
      imported++;
      continue;
    }

    // Insert placement
    const { error } = await supabase.from('placements').insert(placementRecord);

    if (error) {
      errors++;
      if (isVerbose) {
        console.error(`  Error inserting placement ${placement.id}:`, error.message);
      }
    } else {
      imported++;
    }
  }

  // Summary
  console.log();
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Placements ${isDryRun ? 'would be' : ''} imported: ${imported}`);
  console.log(`Skipped (already exists): ${skipped}`);
  console.log(`Missing job mapping: ${missingJob}`);
  console.log(`Missing candidate mapping: ${missingCandidate}`);
  console.log(`Missing client mapping: ${missingClient}`);
  if (errors > 0) {
    console.log(`Errors: ${errors}`);
  }

  // Update client totals if not dry run
  if (!isDryRun && imported > 0) {
    console.log('\nUpdating client totals...');
    await updateClientTotals(supabase);
  }
}

/**
 * Update client total_revenue and total_placements from placements
 */
async function updateClientTotals(supabase: SupabaseClient) {
  // Get placement stats by client
  const { data: stats, error } = await supabase.rpc('get_client_placement_stats');

  if (error) {
    // RPC might not exist, use raw SQL approach
    const { data: rawStats, error: rawError } = await supabase.from('placements').select(`
        client_id,
        total_fee
      `);

    if (rawError) {
      console.error('Failed to get placement stats:', rawError.message);
      return;
    }

    // Aggregate manually
    const clientStats = new Map<string, { count: number; revenue: number }>();
    for (const p of rawStats || []) {
      const existing = clientStats.get(p.client_id) || { count: 0, revenue: 0 };
      existing.count++;
      existing.revenue += parseFloat(p.total_fee) || 0;
      clientStats.set(p.client_id, existing);
    }

    // Update each client
    let updated = 0;
    for (const [clientId, stat] of clientStats) {
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          total_placements: stat.count,
          total_revenue: stat.revenue,
        })
        .eq('id', clientId);

      if (!updateError) updated++;
    }

    console.log(`  Updated ${updated} clients`);
    return;
  }

  // Use RPC result if available
  console.log(`  Updated client stats via RPC`);
}

// Run the import
importPlacements().catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});
