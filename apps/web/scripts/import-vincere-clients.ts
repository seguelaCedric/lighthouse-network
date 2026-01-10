#!/usr/bin/env npx tsx
/**
 * Import Vincere Clients Script
 *
 * Imports companies and contacts from Vincere to create client records.
 * Uses the raw jobs JSON to find unique (company_id, contact_id) pairs,
 * then fetches details from Vincere API and creates clients.
 *
 * Usage:
 *   npx tsx apps/web/scripts/import-vincere-clients.ts [options]
 *
 * Options:
 *   --dry-run     Preview what would be imported without making changes
 *   --limit=N     Only process first N companies
 *   --verbose     Show detailed progress
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: path.join(__dirname, '../.env.local') });

import {
  getVincereClient,
  VincereClient,
  getCompanyById,
  getContactById,
  getContactDisplayName,
  getContactPhone,
  getCompanyDisplayName,
  VincereCompany,
  VincereContact,
} from '../lib/vincere';

// Default organization ID for Lighthouse Careers
const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');
const limitArg = args.find((a) => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;

interface RawJobData {
  job: {
    id: number;
    job_title?: string;
    company_id?: number;
    contact_id?: number;
  };
  custom_fields: Record<string, unknown>;
}

interface CompanyContactPair {
  companyId: number;
  contactId: number | null;
  jobCount: number;
  sampleJobTitle: string;
}

/**
 * Load raw jobs JSON and extract unique company-contact pairs
 */
function loadCompanyContactPairs(): Map<number, CompanyContactPair> {
  const rawPath = path.join(__dirname, '../../../scripts/output/vincere-jobs-raw.json');

  if (!fs.existsSync(rawPath)) {
    console.error(`Raw jobs file not found: ${rawPath}`);
    console.error('Run pull-vincere-jobs.py first!');
    process.exit(1);
  }

  const rawJobs: RawJobData[] = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
  console.log(`Loaded ${rawJobs.length} jobs from raw JSON`);

  // Group by company_id and track primary contact
  const companyMap = new Map<number, CompanyContactPair>();

  for (const job of rawJobs) {
    const companyId = job.job.company_id;
    if (!companyId) continue;

    const existing = companyMap.get(companyId);
    if (existing) {
      existing.jobCount++;
      // Use the first contact we find as primary
      if (!existing.contactId && job.job.contact_id) {
        existing.contactId = job.job.contact_id;
      }
    } else {
      companyMap.set(companyId, {
        companyId,
        contactId: job.job.contact_id || null,
        jobCount: 1,
        sampleJobTitle: job.job.job_title || 'Unknown',
      });
    }
  }

  console.log(`Found ${companyMap.size} unique companies`);
  return companyMap;
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
 * Get existing clients with vincere_id
 */
async function getExistingClients(supabase: SupabaseClient): Promise<Set<number>> {
  const { data, error } = await supabase
    .from('clients')
    .select('vincere_id')
    .not('vincere_id', 'is', null);

  if (error) {
    throw new Error(`Failed to fetch existing clients: ${error.message}`);
  }

  const existingIds = new Set<number>();
  for (const client of data || []) {
    if (client.vincere_id) {
      existingIds.add(client.vincere_id);
    }
  }

  console.log(`Found ${existingIds.size} existing clients with vincere_id`);
  return existingIds;
}

/**
 * Map Vincere company and contact to client record
 */
function mapToClient(
  company: VincereCompany,
  contact: VincereContact | null
): Record<string, unknown> {
  return {
    agency_id: DEFAULT_ORG_ID,
    name: getCompanyDisplayName(company),
    vincere_id: company.id,
    vincere_contact_id: contact?.id || null,
    type: 'yacht', // Default type for yacht recruitment
    primary_contact_name: contact ? getContactDisplayName(contact) : null,
    primary_contact_email: contact?.email || null,
    primary_contact_phone: contact ? getContactPhone(contact) : null,
    primary_contact_role: contact?.job_title || null,
    status: 'active',
    source: null, // vincere_id indicates the source
  };
}

/**
 * Main import function
 */
async function importClients() {
  console.log('='.repeat(60));
  console.log('VINCERE CLIENT IMPORT');
  console.log('='.repeat(60));
  console.log();

  if (isDryRun) {
    console.log('DRY RUN MODE - No changes will be made');
    console.log();
  }

  // Load company-contact pairs from raw jobs
  const companyPairs = loadCompanyContactPairs();

  // Filter to the ones we want to process
  let companiesToProcess = Array.from(companyPairs.values());

  // Sort by job count (most jobs first) for better coverage
  companiesToProcess.sort((a, b) => b.jobCount - a.jobCount);

  if (limit) {
    companiesToProcess = companiesToProcess.slice(0, limit);
    console.log(`Limited to ${limit} companies`);
  }

  // Initialize clients
  const vincere = getVincereClient();
  const supabase = getSupabaseClient();

  // Get existing clients to skip
  const existingClients = await getExistingClients(supabase);

  // Filter out already imported
  const newCompanies = companiesToProcess.filter(
    (c) => !existingClients.has(c.companyId)
  );
  console.log(`${newCompanies.length} companies to import (${companiesToProcess.length - newCompanies.length} already exist)`);
  console.log();

  if (newCompanies.length === 0) {
    console.log('No new companies to import!');
    return;
  }

  // Stats
  let created = 0;
  let errors = 0;
  let contactsFetched = 0;
  let companiesFetched = 0;

  // Process each company
  for (let i = 0; i < newCompanies.length; i++) {
    const pair = newCompanies[i];

    if (isVerbose || (i + 1) % 50 === 0 || i === 0) {
      console.log(`[${i + 1}/${newCompanies.length}] Processing company ${pair.companyId}...`);
    }

    try {
      // Fetch company details
      const company = await getCompanyById(pair.companyId, vincere);
      if (!company) {
        console.log(`  Skipping: Company ${pair.companyId} not found in Vincere`);
        continue;
      }
      companiesFetched++;

      // Fetch contact details if available
      let contact: VincereContact | null = null;
      if (pair.contactId) {
        contact = await getContactById(pair.contactId, vincere);
        if (contact) {
          contactsFetched++;
        }
      }

      // Map to client record
      const clientData = mapToClient(company, contact);

      if (isDryRun) {
        if (isVerbose) {
          console.log(`  Would create: ${clientData.name}`);
          if (contact) {
            console.log(`    Contact: ${clientData.primary_contact_name} (${clientData.primary_contact_email})`);
          }
        }
        created++;
      } else {
        // Insert client
        const { error } = await supabase.from('clients').insert(clientData);

        if (error) {
          console.error(`  Error creating client: ${error.message}`);
          errors++;
        } else {
          created++;
          if (isVerbose) {
            console.log(`  Created: ${clientData.name}`);
          }
        }
      }

      // Rate limiting - small delay between API calls
      if (i < newCompanies.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.error(`  Error processing company ${pair.companyId}:`, error);
      errors++;
    }
  }

  // Summary
  console.log();
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Companies fetched from Vincere: ${companiesFetched}`);
  console.log(`Contacts fetched from Vincere: ${contactsFetched}`);
  console.log(`Clients ${isDryRun ? 'would be' : ''} created: ${created}`);
  if (errors > 0) {
    console.log(`Errors: ${errors}`);
  }
  console.log();

  if (!isDryRun && created > 0) {
    console.log('Now linking jobs to clients...');
    await linkJobsToClients(supabase);
  }
}

/**
 * Link jobs to their corresponding clients based on vincere company_id
 */
async function linkJobsToClients(supabase: SupabaseClient) {
  // Load raw jobs to get company_id mapping
  const rawPath = path.join(__dirname, '../../../scripts/output/vincere-jobs-raw.json');
  const rawJobs: RawJobData[] = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));

  // Create mapping of vincere job id to company id
  const jobToCompany = new Map<string, number>();
  for (const job of rawJobs) {
    if (job.job.company_id) {
      jobToCompany.set(String(job.job.id), job.job.company_id);
    }
  }

  // Get all clients with vincere_id
  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .select('id, vincere_id')
    .not('vincere_id', 'is', null);

  if (clientError) {
    console.error('Failed to fetch clients:', clientError.message);
    return;
  }

  // Create mapping of vincere company id to client id
  const companyToClient = new Map<number, string>();
  for (const client of clients || []) {
    if (client.vincere_id) {
      companyToClient.set(client.vincere_id, client.id);
    }
  }

  console.log(`Found ${companyToClient.size} clients with vincere_id`);

  // Get all Vincere jobs without client_id
  const { data: jobs, error: jobError } = await supabase
    .from('jobs')
    .select('id, external_id')
    .eq('external_source', 'vincere')
    .is('client_id', null);

  if (jobError) {
    console.error('Failed to fetch jobs:', jobError.message);
    return;
  }

  console.log(`Found ${jobs?.length || 0} Vincere jobs without client_id`);

  // Link each job to its client
  let linked = 0;
  let notFound = 0;

  for (const job of jobs || []) {
    const companyId = jobToCompany.get(job.external_id);
    if (!companyId) {
      notFound++;
      continue;
    }

    const clientId = companyToClient.get(companyId);
    if (!clientId) {
      notFound++;
      continue;
    }

    const { error: updateError } = await supabase
      .from('jobs')
      .update({ client_id: clientId })
      .eq('id', job.id);

    if (updateError) {
      console.error(`Failed to link job ${job.id}:`, updateError.message);
    } else {
      linked++;
    }
  }

  console.log(`Linked ${linked} jobs to clients`);
  if (notFound > 0) {
    console.log(`${notFound} jobs could not be linked (company not found or no client)`);
  }
}

// Run the import
importClients().catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});
