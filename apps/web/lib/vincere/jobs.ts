/**
 * Vincere Jobs API
 *
 * Functions for interacting with Vincere job/position data and custom fields.
 */

import { getVincereClient, VincereClient } from './client';
import { VINCERE_JOB_FIELD_KEYS, VINCERE_INDUSTRY_IDS } from './constants';
import type { VincereCustomField } from './candidates';

/**
 * Vincere job/position from API
 */
export interface VincereJob {
  id: number;
  job_title: string;
  company_id?: number;
  company_name?: string;
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
  open_date?: string;
  close_date?: string;
  location?: string;
  head_count?: number;
}

/**
 * Vincere search result for jobs
 */
export interface VincereJobSearchResult {
  result: {
    items: Array<{
      id: number;
      job_title?: string;
      company_name?: string;
      created_date?: string;
      last_update?: string;
      job_status?: string;
    }>;
    total: number;
  };
}

/**
 * Get job by Vincere ID
 */
export async function getJobById(
  vincereId: number,
  client?: VincereClient
): Promise<VincereJob | null> {
  const vincere = client ?? getVincereClient();

  try {
    const job = await vincere.get<VincereJob>(`/position/${vincereId}`);
    return job;
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

/**
 * Get custom fields for a job/position
 */
export async function getJobCustomFields(
  vincereId: number,
  client?: VincereClient
): Promise<Record<string, VincereCustomField>> {
  const vincere = client ?? getVincereClient();

  try {
    // Note: Vincere API uses plural "customfields" for GET
    const fields = await vincere.get<VincereCustomField[]>(
      `/position/${vincereId}/customfields`
    );

    // Index by field key for easy lookup
    const indexed: Record<string, VincereCustomField> = {};
    for (const field of fields ?? []) {
      indexed[field.key] = field;
    }

    return indexed;
  } catch (error) {
    // Return empty object if job has no custom fields (404)
    if (error instanceof Error && error.message.includes('404')) {
      return {};
    }
    throw error;
  }
}

/**
 * Get a job with its custom fields
 */
export async function getJobWithCustomFields(
  vincereId: number,
  client?: VincereClient
): Promise<{ job: VincereJob; customFields: Record<string, VincereCustomField> } | null> {
  const vincere = client ?? getVincereClient();

  const job = await getJobById(vincereId, vincere);
  if (!job) {
    return null;
  }

  const customFields = await getJobCustomFields(vincereId, vincere);

  return { job, customFields };
}

/**
 * Helper to get a specific job custom field value
 */
export function getJobFieldValue(
  customFields: Record<string, VincereCustomField>,
  fieldKey: keyof typeof VINCERE_JOB_FIELD_KEYS
): string | number | number[] | null {
  const key = VINCERE_JOB_FIELD_KEYS[fieldKey];
  const field = customFields[key];

  if (!field) return null;

  // Return the appropriate value type
  if (field.date_value) return field.date_value;
  if (field.field_values && field.field_values.length > 0) {
    return field.field_values.length === 1 ? field.field_values[0] : field.field_values;
  }
  if (field.field_value) return field.field_value;

  return null;
}

/**
 * Map Vincere job data to our Job type
 */
export function mapVincereToJob(
  vincereData: VincereJob,
  customFields: Record<string, VincereCustomField>
): {
  external_id: string;
  external_source: string;
  title: string;
  vessel_name: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  salary_period: string;
  start_date: string | null;
  primary_region: string | null;
  requirements_text: string | null;
  status: string;
  visibility: 'private' | 'network' | 'public';
  is_public: boolean;
  is_urgent: boolean;
  fee_type: string;
  requirements: Record<string, unknown>;
  // Custom fields
  yacht_name: string | null;
  itinerary: string | null;
  holiday_package: string | null;
  contract_type: string | null;
  program: string | null;
} {
  // Helper to get job custom field values
  const getField = (key: keyof typeof VINCERE_JOB_FIELD_KEYS) =>
    getJobFieldValue(customFields, key);

  // Map Vincere status to our status
  const statusMap: Record<string, string> = {
    OPEN: 'open',
    FILLED: 'filled',
    CLOSED: 'closed',
    ON_HOLD: 'draft',
  };
  const status = statusMap[vincereData.job_status || vincereData.status || ''] || 'open';

  // Get custom field values
  const yachtName = getField('yacht') as string | null;
  const requirements = getField('requirements') as string | null;
  const itinerary = getField('itinerary') as string | null;
  const salary = getField('salary') as string | null;
  const holidayPackage = getField('holidayPackage') as string | null;
  const contractType = getField('contractType') as string | null;
  const program = getField('program') as string | null;
  const startDate = getField('startDate') as string | null;

  // Parse salary from custom field if available
  let salaryMin = vincereData.salary_from || null;
  let salaryMax = vincereData.salary_to || null;
  if (salary && !salaryMin && !salaryMax) {
    // Try to parse salary string like "€5000-€7000" or "5k-7k"
    const match = salary.match(/(\d+(?:\.\d+)?)\s*k?\s*[-–to]+\s*(\d+(?:\.\d+)?)\s*k?/i);
    if (match) {
      salaryMin = parseFloat(match[1]);
      salaryMax = parseFloat(match[2]);
      // Handle "k" format
      if (salary.toLowerCase().includes('k')) {
        if (salaryMin < 100) salaryMin *= 1000;
        if (salaryMax < 100) salaryMax *= 1000;
      }
    }
  }

  return {
    external_id: vincereData.id.toString(),
    external_source: 'vincere',
    title: vincereData.job_title,
    vessel_name: yachtName || vincereData.company_name || null,
    salary_min: salaryMin,
    salary_max: salaryMax,
    salary_currency: 'EUR',
    salary_period: 'monthly',
    start_date: startDate || vincereData.start_date || null,
    primary_region: vincereData.location || null,
    requirements_text: requirements || vincereData.internal_description || vincereData.external_description || null,
    status: status,
    visibility: 'private',
    is_public: false,
    is_urgent: false,
    fee_type: 'percentage',
    requirements: {},
    // Custom fields
    yacht_name: yachtName,
    itinerary: itinerary,
    holiday_package: holidayPackage,
    contract_type: contractType,
    program: program,
  };
}

/**
 * Search for jobs in yacht/villa industries
 */
export async function searchJobs(
  limit: number = 100,
  client?: VincereClient
): Promise<VincereJobSearchResult['result']['items']> {
  const vincere = client ?? getVincereClient();

  const { yacht, villa } = VINCERE_INDUSTRY_IDS;
  const query = `(industry_id:${yacht}# OR industry_id:${villa}#)`;
  const encodedQuery = encodeURIComponent(query);

  const result = await vincere.get<VincereJobSearchResult>(
    `/position/search/fl=id,job_title,company_name,created_date,last_update,job_status?q=${encodedQuery}&start=0&limit=${limit}`
  );

  return result?.result?.items ?? [];
}
