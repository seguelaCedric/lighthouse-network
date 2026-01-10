/**
 * Import missing Vincere jobs from the JSON export
 *
 * This script reads the vincere-jobs-raw.json file (from pull-vincere-jobs.py)
 * and imports any jobs that are missing from the database.
 *
 * Run: npx tsx scripts/import-missing-vincere-jobs.ts
 *
 * Options:
 *   --dry-run     Show what would be imported without actually importing
 *   --limit=N     Limit the number of jobs to import (default: all)
 *   --batch=N     Batch size for database operations (default: 50)
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Load environment variables
function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

// Load env from apps/web
const envPath = resolve(__dirname, '../.env.local');
loadEnvFile(envPath);

// Known custom field keys (from apps/web/lib/vincere/constants.ts)
const VINCERE_JOB_FIELD_KEYS = {
  yacht: 'f8b2c1ddc995fb699973598e449193c3',
  requirements: '3c580f529de2e205114090aa08e10f7a',
  startDate: '9a214be2a25d61d1add26dca93aef45a',
  itinerary: 'b8a75c8b68fb5c85fb083aac4bbbed94',
  salary: '035ca080627c6bac4e59e6fc6750a5b6',
  program: '24a44070b5d77ce92fb018745ddbe374',
  holidayPackage: 'ecac1d20eb2b26a248837610935d9b92',
  contractType: 'c980a4f92992081ead936fb8a358fb79',
};

// Contract type mapping
const JOB_CONTRACT_TYPE_MAP: Record<number, string> = {
  1: 'permanent',
  2: 'rotational',
  3: 'seasonal',
  4: 'freelance',
  5: 'temporary',
};

interface VincereCustomField {
  key: string;
  name?: string;
  type?: string;
  field_value?: string;
  field_values?: number[];
  date_value?: string;
}

interface VincereJobData {
  job: {
    id: number;
    job_title: string;
    company_id?: number;
    company_name?: string;
    contact_id?: number;
    status?: string;
    job_status?: string;
    salary_from?: number;
    salary_to?: number;
    start_date?: string;
    description?: string;
    created_date: string;
    updated_date?: string;
    internal_description?: string;
    external_description?: string;
    public_description?: string;
    open_date?: string;
    close_date?: string;
    closed_job?: boolean;
    location?: string;
    head_count?: number;
    private_job?: boolean;
  };
  custom_fields: Record<string, VincereCustomField>;
  custom_fields_list?: VincereCustomField[];
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitArg = args.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;
const batchArg = args.find((arg) => arg.startsWith('--batch='));
const batchSize = batchArg ? parseInt(batchArg.split('=')[1], 10) : 50;

// Supabase client
let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabase) return supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return supabase;
}

// Helper functions (copied from jobs.ts to avoid import issues)
function parseVesselInfo(yachtName: string | null): {
  vessel_size_meters: number | null;
  vessel_type: string | null;
  vessel_name: string | null;
} {
  if (!yachtName) return { vessel_size_meters: null, vessel_type: null, vessel_name: null };

  const text = yachtName.trim();
  let vesselSize: number | null = null;
  let vesselType: string | null = null;

  // Match decimal vessel sizes like "45.5m"
  const sizeMatch = text.match(/(\d+(?:\.\d+)?)\s*m(?:eters?)?/i);
  if (sizeMatch) {
    vesselSize = Math.round(parseFloat(sizeMatch[1]));
  }

  if (/\bm\/?y\b|motor\s*yacht/i.test(text)) {
    vesselType = 'motor';
  } else if (/\bs\/?y\b|sailing\s*yacht/i.test(text)) {
    vesselType = 'sail';
  } else if (/explorer|expedition/i.test(text)) {
    vesselType = 'explorer';
  } else if (/catamaran|cat\b/i.test(text)) {
    vesselType = 'catamaran';
  } else if (/classic|vintage/i.test(text)) {
    vesselType = 'classic';
  }

  let vesselName = text
    .replace(/\d+\s*m(?:eters?)?\s*/gi, '')
    .replace(/\b(?:m\/?y|s\/?y|motor\s*yacht|sailing\s*yacht)\b/gi, '')
    .trim();

  if (!vesselName) vesselName = text;

  return { vessel_size_meters: vesselSize, vessel_type: vesselType, vessel_name: vesselName };
}

function isRotationSchedule(text: string | null): boolean {
  if (!text) return false;
  return /\d+\s*[:/]\s*\d+|equal\s*time|\d+\s*(?:on|months?)\s*\d+\s*(?:off|months?)/i.test(text);
}

function parseRotationSchedule(text: string | null): string | null {
  if (!text || !isRotationSchedule(text)) return null;

  const ratioMatch = text.match(/(\d+)\s*[:/]\s*(\d+)/);
  if (ratioMatch) {
    return `${ratioMatch[1]}:${ratioMatch[2]}`;
  }

  const onOffMatch = text.match(/(\d+)\s*(?:months?)?\s*on\s*(\d+)\s*(?:months?)?\s*off/i);
  if (onOffMatch) {
    return `${onOffMatch[1]}:${onOffMatch[2]}`;
  }

  if (/equal\s*time/i.test(text)) {
    return '1:1';
  }

  return text.trim();
}

function parseHolidayDays(holidayPackage: string | null): number | null {
  if (!holidayPackage) return null;

  const text = holidayPackage.toLowerCase();

  // Handle decimal days like "7.5 days" - round to nearest integer
  const daysMatch = text.match(/(\d+(?:\.\d+)?)\s*days?/i);
  if (daysMatch) {
    return Math.round(parseFloat(daysMatch[1]));
  }

  // Handle decimal weeks like "6.5 weeks"
  const weeksMatch = text.match(/(\d+(?:\.\d+)?)\s*weeks?/i);
  if (weeksMatch) {
    return Math.round(parseFloat(weeksMatch[1]) * 7);
  }

  // Handle decimal months
  const monthsMatch = text.match(/(\d+(?:\.\d+)?)\s*months?/i);
  if (monthsMatch) {
    return Math.round(parseFloat(monthsMatch[1]) * 30);
  }

  return null;
}

function detectSalaryPeriodFromText(salaryText: string | null): 'yearly' | 'monthly' | null {
  if (!salaryText) return null;

  const text = salaryText.toLowerCase();

  if (
    text.includes('p/a') ||
    text.includes('p.a') ||
    text.includes('/year') ||
    text.includes('per year') ||
    text.includes('per annum') ||
    text.includes('annual') ||
    text.includes('yearly')
  ) {
    return 'yearly';
  }

  if (
    text.includes('p/m') ||
    text.includes('p.m') ||
    text.includes('/month') ||
    text.includes('per month') ||
    text.includes('monthly')
  ) {
    return 'monthly';
  }

  return null;
}

function inferSalaryPeriod(salaryMin: number | null, salaryMax: number | null): 'yearly' | 'monthly' {
  const salary = salaryMax || salaryMin;
  if (!salary) return 'monthly';
  return salary > 35000 ? 'yearly' : 'monthly';
}

function parseSalaryFromText(salaryText: string | null): { min: number | null; max: number | null } {
  if (!salaryText) return { min: null, max: null };

  // Normalize European number format: "6.500€" -> "6500€" (dot as thousand separator)
  // But preserve "6.5k" format (dot as decimal for thousands)
  let text = salaryText.toLowerCase().replace(/\s+/g, '');

  // European format: "6.500" or "6.500€" where dot is thousand separator
  // Detect: number followed by dot and exactly 3 digits (not followed by k)
  text = text.replace(/(\d)\.(\d{3})(?![0-9k])/g, '$1$2');

  // Also handle comma as thousand separator
  text = text.replace(/,/g, '');

  const rangeMatch = text.match(/[€$£]?(\d+(?:\.\d+)?)\s*k?\s*[-–to]+\s*[€$£]?(\d+(?:\.\d+)?)\s*k?/i);
  if (rangeMatch) {
    let min = parseFloat(rangeMatch[1]);
    let max = parseFloat(rangeMatch[2]);
    if (text.includes('k')) {
      if (min < 100) min *= 1000;
      if (max < 100) max *= 1000;
    }
    // Round to integers for database
    return { min: Math.round(min), max: Math.round(max) };
  }

  const singleMatch = text.match(/[€$£]?(\d+(?:\.\d+)?)\s*k?[€$£]?/);
  if (singleMatch) {
    let value = parseFloat(singleMatch[1]);
    if (text.includes('k') && value < 100) value *= 1000;
    // Round to integer for database
    const rounded = Math.round(value);
    return { min: rounded, max: rounded };
  }

  return { min: null, max: null };
}

function getJobFieldValue(
  customFields: Record<string, VincereCustomField>,
  fieldName: keyof typeof VINCERE_JOB_FIELD_KEYS
): string | number | number[] | null {
  const key = VINCERE_JOB_FIELD_KEYS[fieldName];
  const field = customFields[key];

  if (!field) return null;

  if (field.date_value) return field.date_value;
  if (field.field_values && field.field_values.length > 0) {
    return field.field_values.length === 1 ? field.field_values[0] : field.field_values;
  }
  if (field.field_value) return field.field_value;

  return null;
}

function mapVincereToJob(jobData: VincereJobData) {
  const { job: vincereData, custom_fields: customFields } = jobData;

  const getField = (key: keyof typeof VINCERE_JOB_FIELD_KEYS) => getJobFieldValue(customFields, key);

  const vincereStatus = vincereData.job_status || vincereData.status || '';
  const hasOpenDate = !!vincereData.open_date;
  const closeDate = vincereData.close_date ? new Date(vincereData.close_date) : null;
  const isPastCloseDate = closeDate && closeDate < new Date();
  const isClosedJob = vincereData.closed_job === true;

  const isOpen = hasOpenDate && !isClosedJob && !isPastCloseDate;

  let status: string;
  if (vincereStatus === 'FILLED') {
    status = 'filled';
  } else if (isClosedJob || isPastCloseDate) {
    status = 'cancelled';
  } else if (!hasOpenDate) {
    status = 'draft';
  } else if (vincereStatus === 'ON_HOLD') {
    status = 'on_hold';
  } else {
    status = 'open';
  }

  const isPublic = isOpen;

  const yachtName = getField('yacht') as string | null;
  const requirements = getField('requirements') as string | null;
  const itinerary = getField('itinerary') as string | null;
  const salary = getField('salary') as string | null;
  const holidayPackage = getField('holidayPackage') as string | null;
  const contractType = getField('contractType') as string | null;
  const program = getField('program') as string | null;
  const startDate = getField('startDate') as string | null;

  const vesselInfo = parseVesselInfo(yachtName);

  let rotationSchedule: string | null = null;
  let holidayDays: number | null = null;

  if (holidayPackage) {
    if (isRotationSchedule(holidayPackage)) {
      rotationSchedule = parseRotationSchedule(holidayPackage);
    } else {
      holidayDays = parseHolidayDays(holidayPackage);
    }
  }

  // Ensure salary values are integers (round if needed)
  let salaryMin = vincereData.salary_from ? Math.round(vincereData.salary_from) : null;
  let salaryMax = vincereData.salary_to ? Math.round(vincereData.salary_to) : null;

  if ((!salaryMin || !salaryMax) && salary) {
    const parsed = parseSalaryFromText(salary);
    if (parsed.min !== null) salaryMin = parsed.min;
    if (parsed.max !== null) salaryMax = parsed.max;
  }

  let mappedContractType: string | null = null;
  if (contractType) {
    const contractTypeId = parseInt(contractType as string, 10);
    if (!isNaN(contractTypeId)) {
      mappedContractType = JOB_CONTRACT_TYPE_MAP[contractTypeId] || null;
    }
  }

  let primaryRegion = vincereData.location || null;
  if (!primaryRegion && itinerary) {
    const itineraryClean = itinerary.split(/[,/]/)[0]?.trim();
    if (itineraryClean) {
      primaryRegion = itineraryClean;
    }
  }

  const detectedPeriod = detectSalaryPeriodFromText(salary) || inferSalaryPeriod(salaryMin, salaryMax);

  return {
    external_id: vincereData.id.toString(),
    external_source: 'vincere',
    title: vincereData.job_title,
    vessel_name: vesselInfo.vessel_name || vincereData.company_name || null,
    vessel_type: vesselInfo.vessel_type,
    vessel_size_meters: vesselInfo.vessel_size_meters,
    salary_min: salaryMin,
    salary_max: salaryMax,
    salary_currency: 'EUR',
    salary_period: detectedPeriod,
    start_date: startDate || vincereData.start_date || null,
    primary_region: primaryRegion,
    requirements_text: requirements || vincereData.internal_description || vincereData.external_description || null,
    status: status,
    visibility: isPublic ? 'public' : 'private',
    is_public: isPublic,
    is_urgent: false,
    fee_type: 'percentage',
    requirements: {},
    published_at: isPublic ? (vincereData.open_date || vincereData.created_date) : null,
    holiday_days: holidayDays,
    itinerary: itinerary,
    holiday_package: holidayPackage,
    rotation_schedule: rotationSchedule,
    contract_type: mappedContractType,
    program: program,
    public_description: vincereData.public_description || vincereData.external_description || null,
    submissions_count: 0,
    views_count: 0,
    applications_count: 0,
    // Store Vincere company_id for client lookup (will be resolved to client_id)
    _vincere_company_id: vincereData.company_id || null,
  };
}

async function main() {
  console.log('='.repeat(60));
  console.log('Import Missing Vincere Jobs');
  console.log('='.repeat(60));

  if (dryRun) {
    console.log('\n⚠️  DRY RUN MODE - No changes will be made\n');
  }

  // Load Vincere jobs from JSON
  const jsonPath = resolve(__dirname, '../../../scripts/output/vincere-jobs-raw.json');
  if (!existsSync(jsonPath)) {
    console.error(`\n❌ File not found: ${jsonPath}`);
    console.error('   Run pull-vincere-jobs.py first to export jobs from Vincere.');
    process.exit(1);
  }

  console.log(`\nLoading jobs from ${jsonPath}...`);
  const vincereJobs: VincereJobData[] = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  console.log(`✓ Loaded ${vincereJobs.length} jobs from JSON file`);

  // Get existing job IDs from database
  const db = getSupabaseClient();

  console.log('\nFetching existing jobs from database...');
  const { data: existingJobs, error: fetchError } = await db
    .from('jobs')
    .select('external_id')
    .eq('external_source', 'vincere')
    .is('deleted_at', null);

  if (fetchError) {
    console.error(`\n❌ Error fetching existing jobs: ${fetchError.message}`);
    process.exit(1);
  }

  const existingIds = new Set(existingJobs?.map((j) => j.external_id) ?? []);
  console.log(`✓ Found ${existingIds.size} existing Vincere jobs in database`);

  // Find missing jobs
  const missingJobs = vincereJobs.filter((j) => j && j.job && !existingIds.has(j.job.id.toString()));
  console.log(`\n📊 Jobs to import: ${missingJobs.length}`);

  if (missingJobs.length === 0) {
    console.log('\n✓ All jobs are already in the database!');
    return;
  }

  // Apply limit
  const jobsToImport = missingJobs.slice(0, limit);
  if (limit < missingJobs.length) {
    console.log(`   (limited to ${limit} jobs)`);
  }

  // Count by status
  const statusCounts: Record<string, number> = {};
  const mappedJobsRaw = jobsToImport.map((jobData) => {
    const mapped = mapVincereToJob(jobData);
    statusCounts[mapped.status] = (statusCounts[mapped.status] || 0) + 1;
    return mapped;
  });

  console.log('\nJob status breakdown:');
  for (const [status, count] of Object.entries(statusCounts).sort((a, b) => b[1] - a[1])) {
    const publicCount = mappedJobsRaw.filter((j) => j.status === status && j.is_public).length;
    console.log(`  ${status}: ${count}${publicCount > 0 ? ` (${publicCount} public)` : ''}`);
  }

  // Collect unique Vincere company IDs for client lookup
  const vincereCompanyIds = [...new Set(
    mappedJobsRaw
      .map((j) => (j as ReturnType<typeof mapVincereToJob> & { _vincere_company_id?: number })._vincere_company_id)
      .filter((id): id is number => id !== null && id !== undefined)
  )];

  console.log(`\nLooking up ${vincereCompanyIds.length} unique clients from Vincere...`);

  // Fetch organizations that have vincere_id in their settings
  const { data: orgs } = await db
    .from('organizations')
    .select('id, settings')
    .not('settings', 'is', null);

  // Build a map of vincere_company_id -> organization UUID
  const companyIdToClientId = new Map<number, string>();
  let matchedClients = 0;
  for (const org of orgs || []) {
    const vincereId = org.settings?.vincere_id;
    if (vincereId) {
      const numId = typeof vincereId === 'string' ? parseInt(vincereId, 10) : vincereId;
      if (!isNaN(numId)) {
        companyIdToClientId.set(numId, org.id);
        if (vincereCompanyIds.includes(numId)) {
          matchedClients++;
        }
      }
    }
  }

  console.log(`✓ Found ${matchedClients} matching clients in database`);

  // Map jobs with client_id resolved
  const mappedJobs = mappedJobsRaw.map((job) => {
    const { _vincere_company_id, ...jobData } = job as ReturnType<typeof mapVincereToJob> & { _vincere_company_id?: number };
    const client_id = _vincere_company_id ? companyIdToClientId.get(_vincere_company_id) || null : null;
    return { ...jobData, client_id };
  });

  if (dryRun) {
    const withClient = mappedJobs.filter((j) => j.client_id).length;
    console.log(`\n⚠️  DRY RUN - Would have imported the above jobs`);
    console.log(`   ${withClient} jobs would have a linked client`);
    console.log('   Run without --dry-run to actually import.');
    return;
  }

  // Import in batches
  console.log(`\nImporting ${jobsToImport.length} jobs in batches of ${batchSize}...`);

  let importedCount = 0;
  let errorCount = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (let i = 0; i < mappedJobs.length; i += batchSize) {
    const batch = mappedJobs.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(mappedJobs.length / batchSize);

    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${batch.length} jobs)... `);

    const { data, error } = await db.from('jobs').insert(batch).select('id, external_id');

    if (error) {
      console.log(`❌ Error: ${error.message}`);
      errorCount += batch.length;
      for (const job of batch) {
        errors.push({ id: job.external_id, error: error.message });
      }
    } else {
      console.log(`✓ Inserted ${data?.length || 0} jobs`);
      importedCount += data?.length || 0;
    }

    // Small delay to avoid overwhelming the database
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('IMPORT COMPLETE');
  console.log('='.repeat(60));
  console.log(`✓ Successfully imported: ${importedCount} jobs`);
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount} jobs`);
  }

  // Save error log if there were errors
  if (errors.length > 0) {
    const errorLogPath = resolve(__dirname, '../../../scripts/output/import-errors.json');
    writeFileSync(errorLogPath, JSON.stringify(errors, null, 2));
    console.log(`\n📝 Error log saved to: ${errorLogPath}`);
  }

  // Verify final count
  const { count } = await db
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('external_source', 'vincere')
    .is('deleted_at', null);

  console.log(`\n📊 Total Vincere jobs in database: ${count}`);
}

main().catch(console.error);
