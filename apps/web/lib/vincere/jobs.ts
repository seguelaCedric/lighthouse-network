/**
 * Vincere Jobs API
 *
 * Functions for interacting with Vincere job/position data and custom fields.
 */

import { getVincereClient, VincereClient } from './client';
import { VINCERE_JOB_FIELD_KEYS, VINCERE_INDUSTRY_IDS, VINCERE_CONTRACT_TYPE_MAP } from './constants';
import type { VincereCustomField } from './candidates';

/**
 * Map Vincere job contract type ID to our contract_type enum value
 * Vincere job custom field uses IDs: 1=permanent, 2=rotational, 3=seasonal, 4=freelance, 5=temporary
 */
const JOB_CONTRACT_TYPE_MAP: Record<number, string> = {
  ...VINCERE_CONTRACT_TYPE_MAP,
  5: 'temporary', // Land-based/villa positions often use ID 5 for permanent/long-term
};

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
  public_description?: string;
  open_date?: string;
  close_date?: string;
  closed_job?: boolean;
  location?: string;
  head_count?: number;
  private_job?: boolean;
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
 * Parse vessel info from yacht name field
 * Handles formats like "80m MY", "65m S/Y", "45m Motor Yacht", "Sailing Yacht 55m"
 * Returns vessel_size_meters and vessel_type
 */
function parseVesselInfo(yachtName: string | null): {
  vessel_size_meters: number | null;
  vessel_type: string | null;
  vessel_name: string | null;
} {
  if (!yachtName) return { vessel_size_meters: null, vessel_type: null, vessel_name: null };

  const text = yachtName.trim();
  let vesselSize: number | null = null;
  let vesselType: string | null = null;

  // Extract size: "80m", "45 m", "55 meters"
  const sizeMatch = text.match(/(\d+)\s*m(?:eters?)?/i);
  if (sizeMatch) {
    vesselSize = parseInt(sizeMatch[1], 10);
  }

  // Extract vessel type from common patterns
  const lowerText = text.toLowerCase();

  // Motor yacht patterns: "MY", "M/Y", "Motor Yacht"
  if (/\bm\/?y\b|motor\s*yacht/i.test(text)) {
    vesselType = 'motor';
  }
  // Sailing yacht patterns: "SY", "S/Y", "Sailing Yacht"
  else if (/\bs\/?y\b|sailing\s*yacht/i.test(text)) {
    vesselType = 'sail';
  }
  // Explorer/expedition
  else if (/explorer|expedition/i.test(text)) {
    vesselType = 'explorer';
  }
  // Catamaran
  else if (/catamaran|cat\b/i.test(text)) {
    vesselType = 'catamaran';
  }
  // Classic/vintage
  else if (/classic|vintage/i.test(text)) {
    vesselType = 'classic';
  }

  // Clean the vessel name by removing the size/type indicators for display
  let vesselName = text
    .replace(/\d+\s*m(?:eters?)?\s*/gi, '') // Remove size
    .replace(/\b(?:m\/?y|s\/?y|motor\s*yacht|sailing\s*yacht)\b/gi, '') // Remove type abbreviations
    .trim();

  // If name is empty after cleaning, use original
  if (!vesselName) vesselName = text;

  return { vessel_size_meters: vesselSize, vessel_type: vesselType, vessel_name: vesselName };
}

/**
 * Check if holiday package string is actually a rotation schedule
 * Rotation patterns: "2:1", "2/1", "2 on 1 off", "equal time"
 */
function isRotationSchedule(text: string | null): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return /\d+\s*[:/]\s*\d+|equal\s*time|\d+\s*(?:on|months?)\s*\d+\s*(?:off|months?)/i.test(lowerText);
}

/**
 * Parse rotation schedule from text
 * Normalizes formats like "2:1", "2/1 Rotation", "2 on 1 off" to "2:1"
 */
function parseRotationSchedule(text: string | null): string | null {
  if (!text || !isRotationSchedule(text)) return null;

  // Already in ratio format: "2:1" or "2/1"
  const ratioMatch = text.match(/(\d+)\s*[:/]\s*(\d+)/);
  if (ratioMatch) {
    return `${ratioMatch[1]}:${ratioMatch[2]}`;
  }

  // "2 on 1 off" or "2 months on 1 month off"
  const onOffMatch = text.match(/(\d+)\s*(?:months?)?\s*on\s*(\d+)\s*(?:months?)?\s*off/i);
  if (onOffMatch) {
    return `${onOffMatch[1]}:${onOffMatch[2]}`;
  }

  // "equal time"
  if (/equal\s*time/i.test(text)) {
    return '1:1';
  }

  return text.trim();
}

/**
 * Parse holiday days from holiday package string
 * Handles formats like "6 weeks", "42 days", "8 weeks annual leave", etc.
 */
function parseHolidayDays(holidayPackage: string | null): number | null {
  if (!holidayPackage) return null;

  const text = holidayPackage.toLowerCase();

  // Try to extract days directly: "42 days", "30 days leave"
  const daysMatch = text.match(/(\d+)\s*days?/i);
  if (daysMatch) {
    return parseInt(daysMatch[1], 10);
  }

  // Try to extract weeks: "6 weeks", "8 weeks annual leave"
  const weeksMatch = text.match(/(\d+)\s*weeks?/i);
  if (weeksMatch) {
    return parseInt(weeksMatch[1], 10) * 7;
  }

  // Try to extract months: "2 months"
  const monthsMatch = text.match(/(\d+)\s*months?/i);
  if (monthsMatch) {
    return parseInt(monthsMatch[1], 10) * 30;
  }

  return null;
}

/**
 * Detect salary period from text indicators
 * Returns 'yearly', 'monthly', or null if not detected
 */
function detectSalaryPeriodFromText(salaryText: string | null): 'yearly' | 'monthly' | null {
  if (!salaryText) return null;

  const text = salaryText.toLowerCase();

  // Check for yearly indicators
  if (
    text.includes('p/a') ||
    text.includes('p.a') ||
    text.includes('pa') ||
    text.includes('/year') ||
    text.includes('/yr') ||
    text.includes('per year') ||
    text.includes('per annum') ||
    text.includes('annual') ||
    text.includes('yearly')
  ) {
    return 'yearly';
  }

  // Check for monthly indicators
  if (
    text.includes('p/m') ||
    text.includes('p.m') ||
    text.includes('pm') ||
    text.includes('/month') ||
    text.includes('/mo') ||
    text.includes('per month') ||
    text.includes('monthly')
  ) {
    return 'monthly';
  }

  return null;
}

/**
 * Infer salary period from value using industry heuristics
 *
 * IMPORTANT: This is a FALLBACK only - text detection should be preferred.
 *
 * Yacht crew salaries vary widely:
 * - Junior crew: €2,000-5,000/month
 * - Senior crew (Chief Stew, Bosun): €5,000-10,000/month
 * - Department heads (Captain, Chief Engineer): €10,000-25,000/month on superyachts
 *
 * Given the high end of monthly salaries in yachting, we use a conservative
 * threshold of €35,000. Only values clearly above this are assumed annual.
 * When in doubt, default to monthly as it's the industry standard for yacht crew.
 */
function inferSalaryPeriod(salaryMin: number | null, salaryMax: number | null): 'yearly' | 'monthly' {
  const salary = salaryMax || salaryMin;

  if (!salary) return 'monthly';

  // Conservative threshold - only values clearly above typical monthly ranges
  // Top Captains on 100m+ superyachts can earn €20k-25k/month
  // €35k+ is almost certainly an annual figure
  const MONTHLY_THRESHOLD = 35000;

  if (salary > MONTHLY_THRESHOLD) {
    return 'yearly';
  }

  return 'monthly';
}

/**
 * Parse salary from custom field text
 * Handles formats like "€5000-€7000", "5k-7k", "€6,500 net", "7000€", etc.
 */
function parseSalaryFromText(salaryText: string | null): { min: number | null; max: number | null } {
  if (!salaryText) return { min: null, max: null };

  const text = salaryText.toLowerCase().replace(/,/g, '').replace(/\s+/g, '');

  // Try to extract range: "€5000-€7000", "5000-7000", "5k-7k"
  const rangeMatch = text.match(/[€$£]?(\d+(?:\.\d+)?)\s*k?\s*[-–to]+\s*[€$£]?(\d+(?:\.\d+)?)\s*k?/i);
  if (rangeMatch) {
    let min = parseFloat(rangeMatch[1]);
    let max = parseFloat(rangeMatch[2]);
    // Handle "k" format (5k = 5000)
    if (text.includes('k')) {
      if (min < 100) min *= 1000;
      if (max < 100) max *= 1000;
    }
    return { min, max };
  }

  // Try to extract single value: "€6500", "6500€", "6.5k"
  const singleMatch = text.match(/[€$£]?(\d+(?:\.\d+)?)\s*k?[€$£]?/);
  if (singleMatch) {
    let value = parseFloat(singleMatch[1]);
    if (text.includes('k') && value < 100) value *= 1000;
    return { min: value, max: value };
  }

  return { min: null, max: null };
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
  vessel_type: string | null;
  vessel_size_meters: number | null;
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
  published_at: string | null;
  holiday_days: number | null;
  itinerary: string | null;
  holiday_package: string | null;
  rotation_schedule: string | null;
  contract_type: string | null;
  program: string | null;
  public_description: string | null;
} {
  // Helper to get job custom field values
  const getField = (key: keyof typeof VINCERE_JOB_FIELD_KEYS) =>
    getJobFieldValue(customFields, key);

  // Determine job status based on Vincere fields:
  // 1. closed_job field being true means explicitly closed
  // 2. close_date in the past means expired
  // 3. open_date must exist for job to be considered open
  // 4. job_status field for explicit status
  const vincereStatus = vincereData.job_status || vincereData.status || '';
  const hasOpenDate = !!vincereData.open_date;
  const closeDate = vincereData.close_date ? new Date(vincereData.close_date) : null;
  const isPastCloseDate = closeDate && closeDate < new Date();
  const isClosedJob = vincereData.closed_job === true;

  // Determine if job is actually open
  const isOpen = hasOpenDate && !isClosedJob && !isPastCloseDate;

  // Map to our status enum
  // Valid values: draft, open, shortlisting, interviewing, offer, filled, cancelled, on_hold
  let status: string;
  if (vincereStatus === 'FILLED') {
    status = 'filled';
  } else if (isClosedJob || isPastCloseDate) {
    status = 'cancelled'; // Closed jobs use 'cancelled' status in our DB enum
  } else if (!hasOpenDate) {
    status = 'draft'; // Never opened
  } else if (vincereStatus === 'ON_HOLD') {
    status = 'on_hold';
  } else {
    status = 'open';
  }

  // Determine if job should be public
  // Only OPEN jobs are public on the job board
  const isPublic = isOpen;

  // Get custom field values
  const yachtName = getField('yacht') as string | null;
  const requirements = getField('requirements') as string | null;
  const itinerary = getField('itinerary') as string | null;
  const salary = getField('salary') as string | null;
  const holidayPackage = getField('holidayPackage') as string | null;
  const contractType = getField('contractType') as string | null;
  const program = getField('program') as string | null;
  const startDate = getField('startDate') as string | null;

  // Parse vessel info from yacht name (e.g., "80m MY" → size: 80, type: "motor")
  const vesselInfo = parseVesselInfo(yachtName);

  // Check if holiday package is actually a rotation schedule (e.g., "2:1 Rotation")
  let rotationSchedule: string | null = null;
  let holidayDays: number | null = null;

  if (holidayPackage) {
    if (isRotationSchedule(holidayPackage)) {
      rotationSchedule = parseRotationSchedule(holidayPackage);
    } else {
      holidayDays = parseHolidayDays(holidayPackage);
    }
  }

  // Parse salary - prefer custom field, fall back to base data
  let salaryMin = vincereData.salary_from || null;
  let salaryMax = vincereData.salary_to || null;

  // If base data doesn't have salary, try to parse from custom field
  if ((!salaryMin || !salaryMax) && salary) {
    const parsed = parseSalaryFromText(salary);
    if (parsed.min !== null) salaryMin = parsed.min;
    if (parsed.max !== null) salaryMax = parsed.max;
  }

  // Map contract type ID to enum value
  let mappedContractType: string | null = null;
  if (contractType) {
    const contractTypeId = parseInt(contractType as string, 10);
    if (!isNaN(contractTypeId)) {
      mappedContractType = JOB_CONTRACT_TYPE_MAP[contractTypeId] || null;
    }
  }

  // Determine primary region: prefer location, fall back to itinerary
  let primaryRegion = vincereData.location || null;
  if (!primaryRegion && itinerary) {
    // Extract first meaningful region from itinerary
    // Common formats: "Mediterranean", "Caribbean / USA", "Worldwide"
    const itineraryClean = itinerary.split(/[,/]/)[0]?.trim();
    if (itineraryClean) {
      primaryRegion = itineraryClean;
    }
  }

  // Detect salary period: first check text indicators, then use heuristics
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

// ============================================================================
// JOB APPLICATION / SHORTLIST FUNCTIONS
// ============================================================================

/**
 * Vincere application/shortlist stages
 * These map to recruitment pipeline stages in Vincere
 */
export const VINCERE_APPLICATION_STAGES = {
  APPLIED: 1,        // New application
  SHORTLIST: 2,      // Shortlisted for review
  INTERVIEW: 3,      // Interview stage
  OFFER: 4,          // Offer stage
  PLACED: 5,         // Successfully placed
  REJECTED: 6,       // Rejected
} as const;

export type VincereApplicationStage = typeof VINCERE_APPLICATION_STAGES[keyof typeof VINCERE_APPLICATION_STAGES];

/**
 * Response from adding a candidate to a job
 */
export interface VincereApplicationResponse {
  id?: number;
  candidate_id?: number;
  job_id?: number;
  stage_id?: number;
}

/**
 * Add a candidate to a job shortlist in Vincere
 *
 * This creates an "application" in Vincere which adds the candidate
 * to the job's recruitment pipeline.
 *
 * @param jobVincereId - The job's Vincere ID
 * @param candidateVincereId - The candidate's Vincere ID
 * @param stage - The pipeline stage (defaults to APPLIED)
 * @param client - Optional VincereClient instance
 */
export async function addCandidateToJob(
  jobVincereId: number,
  candidateVincereId: number,
  stage: VincereApplicationStage = VINCERE_APPLICATION_STAGES.APPLIED,
  client?: VincereClient
): Promise<VincereApplicationResponse> {
  const vincere = client ?? getVincereClient();

  const result = await vincere.post<VincereApplicationResponse>(
    `/position/${jobVincereId}/applications`,
    {
      candidate_id: candidateVincereId,
      stage_id: stage,
    }
  );

  return result;
}

/**
 * Update a candidate's stage on a job application
 *
 * @param jobVincereId - The job's Vincere ID
 * @param candidateVincereId - The candidate's Vincere ID
 * @param stage - The new pipeline stage
 * @param client - Optional VincereClient instance
 */
export async function updateApplicationStage(
  jobVincereId: number,
  candidateVincereId: number,
  stage: VincereApplicationStage,
  client?: VincereClient
): Promise<void> {
  const vincere = client ?? getVincereClient();

  await vincere.put(`/position/${jobVincereId}/applications/${candidateVincereId}`, {
    stage_id: stage,
  });
}

/**
 * Remove a candidate from a job application
 *
 * @param jobVincereId - The job's Vincere ID
 * @param candidateVincereId - The candidate's Vincere ID
 * @param client - Optional VincereClient instance
 */
export async function removeCandidateFromJob(
  jobVincereId: number,
  candidateVincereId: number,
  client?: VincereClient
): Promise<void> {
  const vincere = client ?? getVincereClient();

  await vincere.delete(`/position/${jobVincereId}/applications/${candidateVincereId}`);
}
