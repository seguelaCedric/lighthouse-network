#!/usr/bin/env npx tsx
/**
 * Import Additional Vincere Contacts Script
 *
 * Imports contacts from Vincere jobs that aren't already in client_contacts.
 * Each job has a contact_id - many contacts may exist per company (client).
 *
 * Usage:
 *   npx tsx apps/web/scripts/import-vincere-contacts.ts [options]
 *
 * Options:
 *   --dry-run     Preview what would be imported without making changes
 *   --limit=N     Only process first N contacts
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
  getContactById,
  getContactDisplayName,
  getContactPhone,
  VincereContact,
} from '../lib/vincere';

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
 * Load raw jobs and extract unique contact IDs per company
 */
function loadContactsPerCompany(): Map<number, Set<number>> {
  const rawPath = path.join(__dirname, '../../../scripts/output/vincere-jobs-raw.json');

  if (!fs.existsSync(rawPath)) {
    console.error(`Raw jobs file not found: ${rawPath}`);
    console.error('Run pull-vincere-jobs.py first!');
    process.exit(1);
  }

  const rawJobs: RawJobData[] = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
  console.log(`Loaded ${rawJobs.length} jobs from raw JSON`);

  // Group contacts by company_id
  const companyContacts = new Map<number, Set<number>>();

  for (const job of rawJobs) {
    const companyId = job.job.company_id;
    const contactId = job.job.contact_id;

    if (!companyId || !contactId) continue;

    if (!companyContacts.has(companyId)) {
      companyContacts.set(companyId, new Set());
    }
    companyContacts.get(companyId)!.add(contactId);
  }

  // Count total unique contacts
  let totalContacts = 0;
  for (const contacts of companyContacts.values()) {
    totalContacts += contacts.size;
  }

  console.log(`Found ${totalContacts} unique contacts across ${companyContacts.size} companies`);
  return companyContacts;
}

/**
 * Main import function
 */
async function importContacts() {
  console.log('='.repeat(60));
  console.log('VINCERE CONTACTS IMPORT');
  console.log('='.repeat(60));
  console.log();

  if (isDryRun) {
    console.log('DRY RUN MODE - No changes will be made');
    console.log();
  }

  // Initialize clients
  const vincere = getVincereClient();
  const supabase = getSupabaseClient();

  // Load contacts from raw jobs
  const companyContacts = loadContactsPerCompany();

  // Get clients with vincere_id to map company -> client
  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .select('id, vincere_id')
    .not('vincere_id', 'is', null);

  if (clientError) {
    console.error('Failed to fetch clients:', clientError.message);
    return;
  }

  const companyToClient = new Map<number, string>();
  for (const client of clients || []) {
    if (client.vincere_id) {
      companyToClient.set(client.vincere_id, client.id);
    }
  }
  console.log(`Found ${companyToClient.size} clients with vincere_id`);

  // Get existing contacts (vincere_id)
  const { data: existingContacts, error: contactError } = await supabase
    .from('client_contacts')
    .select('vincere_id')
    .not('vincere_id', 'is', null);

  if (contactError) {
    console.error('Failed to fetch existing contacts:', contactError.message);
    return;
  }

  const existingVincereIds = new Set<number>();
  for (const contact of existingContacts || []) {
    if (contact.vincere_id) {
      existingVincereIds.add(contact.vincere_id);
    }
  }
  console.log(`Found ${existingVincereIds.size} existing contacts with vincere_id`);

  // Build list of contacts to import
  const contactsToImport: Array<{ contactId: number; clientId: string }> = [];

  for (const [companyId, contactIds] of companyContacts) {
    const clientId = companyToClient.get(companyId);
    if (!clientId) continue;

    for (const contactId of contactIds) {
      if (!existingVincereIds.has(contactId)) {
        contactsToImport.push({ contactId, clientId });
      }
    }
  }

  console.log(`${contactsToImport.length} new contacts to import`);
  console.log();

  if (contactsToImport.length === 0) {
    console.log('No new contacts to import!');
    return;
  }

  // Apply limit if specified
  const toProcess = limit ? contactsToImport.slice(0, limit) : contactsToImport;
  if (limit) {
    console.log(`Limited to ${limit} contacts`);
  }

  // Stats
  let created = 0;
  let errors = 0;
  let notFound = 0;

  // Process each contact
  for (let i = 0; i < toProcess.length; i++) {
    const { contactId, clientId } = toProcess[i];

    if (isVerbose || (i + 1) % 100 === 0 || i === 0) {
      console.log(`[${i + 1}/${toProcess.length}] Fetching contact ${contactId}...`);
    }

    try {
      // Fetch contact from Vincere
      const contact = await getContactById(contactId, vincere);
      if (!contact) {
        if (isVerbose) {
          console.log(`  Skipping: Contact ${contactId} not found in Vincere`);
        }
        notFound++;
        continue;
      }

      // Map to client_contacts record
      const contactData = {
        client_id: clientId,
        name: getContactDisplayName(contact),
        email: contact.email || null,
        phone: getContactPhone(contact),
        role: contact.job_title || null,
        vincere_id: contact.id,
        is_primary: false,
        is_active: true,
      };

      if (isDryRun) {
        if (isVerbose) {
          console.log(`  Would create: ${contactData.name} (${contactData.role || 'no role'})`);
        }
        created++;
      } else {
        // Insert contact
        const { error } = await supabase.from('client_contacts').insert(contactData);

        if (error) {
          if (error.code === '23505') {
            // Duplicate vincere_id - already exists
            if (isVerbose) {
              console.log(`  Skipping duplicate: ${contactData.name}`);
            }
          } else {
            console.error(`  Error creating contact: ${error.message}`);
            errors++;
          }
        } else {
          created++;
          if (isVerbose) {
            console.log(`  Created: ${contactData.name}`);
          }
        }
      }

      // Rate limiting
      if (i < toProcess.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.error(`  Error processing contact ${contactId}:`, error);
      errors++;
    }
  }

  // Summary
  console.log();
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Contacts ${isDryRun ? 'would be' : ''} created: ${created}`);
  if (notFound > 0) {
    console.log(`Not found in Vincere: ${notFound}`);
  }
  if (errors > 0) {
    console.log(`Errors: ${errors}`);
  }
}

// Run the import
importContacts().catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});
