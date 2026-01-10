#!/usr/bin/env npx tsx
/**
 * Link Vincere jobs to their clients based on company_id
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface RawJobData {
  job: {
    id: number;
    company_id?: number;
  };
}

async function linkJobsToClients() {
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

  // Get all Vincere jobs without client_id (with pagination)
  let allJobs: Array<{ id: string; external_id: string }> = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data: jobs, error: jobError } = await supabase
      .from('jobs')
      .select('id, external_id')
      .eq('external_source', 'vincere')
      .is('client_id', null)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (jobError) {
      console.error('Failed to fetch jobs:', jobError.message);
      return;
    }

    if (!jobs || jobs.length === 0) break;

    allJobs = allJobs.concat(jobs);
    page++;

    if (jobs.length < pageSize) break;
  }

  console.log(`Found ${allJobs.length} Vincere jobs without client_id`);

  // Link each job to its client
  let linked = 0;
  let notFound = 0;

  for (const job of allJobs) {
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

linkJobsToClients();
