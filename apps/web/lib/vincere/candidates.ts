/**
 * Vincere Candidates API
 *
 * Functions for interacting with Vincere candidate data.
 */

import { getVincereClient, VincereClient } from './client';
import { VINCERE_FIELD_KEYS, VINCERE_INDUSTRY_IDS } from './constants';

/**
 * Vincere candidate from API
 */
export interface VincereCandidate {
  id: number;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  primary_email?: string;
  phone?: string;
  mobile?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  current_location?: string;
  job_title?: string;
  summary?: string;
  created_date: string;
  updated_date?: string;
  registration_date?: string;
}

/**
 * Vincere custom field from API
 */
export interface VincereCustomField {
  key: string;
  name: string;
  field_value?: string;
  field_values?: number[];
  date_value?: string;
  element_value_groups?: unknown;
}

/**
 * Vincere search result
 */
export interface VincereSearchResult {
  result: {
    items: Array<{
      id: number;
      name?: string;
      first_name?: string;
      last_name?: string;
      primary_email?: string;
    }>;
    total: number;
  };
}

/**
 * Search for candidates by email
 */
export async function searchByEmail(
  email: string,
  client?: VincereClient
): Promise<VincereCandidate | null> {
  const vincere = client ?? getVincereClient();

  const query = `primary_email:${email}#`;
  const encodedQuery = encodeURIComponent(query);

  const result = await vincere.get<VincereSearchResult>(
    `/candidate/search/fl=id,name,first_name,last_name,primary_email?q=${encodedQuery}`
  );

  const items = result?.result?.items ?? [];

  if (items.length === 0) {
    return null;
  }

  // Get full candidate details
  return getById(items[0].id, client);
}

/**
 * Get candidate by Vincere ID
 */
export async function getById(
  vincereId: number,
  client?: VincereClient
): Promise<VincereCandidate | null> {
  const vincere = client ?? getVincereClient();

  try {
    const candidate = await vincere.get<VincereCandidate>(`/candidate/${vincereId}`);
    return candidate;
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

/**
 * Get custom fields for a candidate
 */
export async function getCustomFields(
  vincereId: number,
  client?: VincereClient
): Promise<Record<string, VincereCustomField>> {
  const vincere = client ?? getVincereClient();

  try {
    // Note: Vincere API uses plural "customfields" for GET
    const fields = await vincere.get<VincereCustomField[]>(
      `/candidate/${vincereId}/customfields`
    );

    // Index by field key for easy lookup
    const indexed: Record<string, VincereCustomField> = {};
    for (const field of fields ?? []) {
      indexed[field.key] = field;
    }

    return indexed;
  } catch (error) {
    // Return empty object if candidate has no custom fields (404)
    if (error instanceof Error && error.message.includes('404')) {
      return {};
    }
    throw error;
  }
}

/**
 * Get candidates updated since a given date
 */
export async function getUpdatedSince(
  since: Date,
  limit: number = 100,
  client?: VincereClient
): Promise<VincereCandidate[]> {
  const vincere = client ?? getVincereClient();

  const sinceISO = since.toISOString();
  const { yacht, villa } = VINCERE_INDUSTRY_IDS;

  // Search for candidates in yacht/villa industries updated since date
  const query = `(industry_id:${yacht}# OR industry_id:${villa}#) AND last_update:[${sinceISO} TO NOW]#`;
  const encodedQuery = encodeURIComponent(query);

  const result = await vincere.get<VincereSearchResult>(
    `/candidate/search/fl=id,name,first_name,last_name,primary_email,last_update?q=${encodedQuery}&start=0&limit=${limit}`
  );

  const items = result?.result?.items ?? [];

  // Fetch full details for each candidate
  const candidates: VincereCandidate[] = [];
  for (const item of items) {
    const candidate = await getById(item.id, client);
    if (candidate) {
      candidates.push(candidate);
    }
  }

  return candidates;
}

/**
 * Get a candidate with their custom fields
 */
export async function getCandidateWithCustomFields(
  vincereId: number,
  client?: VincereClient
): Promise<{ candidate: VincereCandidate; customFields: Record<string, VincereCustomField> } | null> {
  const vincere = client ?? getVincereClient();

  const candidate = await getById(vincereId, vincere);
  if (!candidate) {
    return null;
  }

  const customFields = await getCustomFields(vincereId, vincere);

  return { candidate, customFields };
}

/**
 * Update candidate custom fields
 */
export async function updateCustomFields(
  vincereId: number,
  fields: Array<{
    fieldKey: string;
    fieldValue?: string;
    fieldValues?: number[];
    dateValue?: string;
  }>,
  client?: VincereClient
): Promise<void> {
  const vincere = client ?? getVincereClient();

  const data = fields.map(({ fieldKey, fieldValue, fieldValues, dateValue }) => ({
    element_value_groups: null,
    field_key: fieldKey,
    ...(fieldValue !== undefined && { field_value: fieldValue }),
    ...(fieldValues !== undefined && { field_values: fieldValues }),
    ...(dateValue !== undefined && { date_value: dateValue }),
  }));

  await vincere.patch(`/candidate/${vincereId}/customfields`, { data });
}

/**
 * Create a new candidate in Vincere
 */
export async function createCandidate(
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    mobile?: string;
    dateOfBirth?: string;
    gender?: string;
    nationality?: string;
    currentLocation?: string;
    jobTitle?: string;
    summary?: string;
  },
  client?: VincereClient
): Promise<{ id: number }> {
  const vincere = client ?? getVincereClient();

  const result = await vincere.post<{ id: number }>('/candidate', {
    first_name: data.firstName,
    last_name: data.lastName,
    primary_email: data.email,
    phone: data.phone,
    mobile: data.mobile,
    date_of_birth: data.dateOfBirth,
    gender: data.gender,
    nationality: data.nationality,
    current_location: data.currentLocation,
    job_title: data.jobTitle,
    summary: data.summary,
  });

  return result;
}

/**
 * Update an existing candidate in Vincere
 */
export async function updateCandidate(
  vincereId: number,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    dateOfBirth?: string;
    gender?: string;
    nationality?: string;
    currentLocation?: string;
    jobTitle?: string;
    summary?: string;
  },
  client?: VincereClient
): Promise<void> {
  const vincere = client ?? getVincereClient();

  // Build update payload with only provided fields
  const payload: Record<string, unknown> = {};
  if (data.firstName !== undefined) payload.first_name = data.firstName;
  if (data.lastName !== undefined) payload.last_name = data.lastName;
  if (data.email !== undefined) payload.primary_email = data.email;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.mobile !== undefined) payload.mobile = data.mobile;
  if (data.dateOfBirth !== undefined) payload.date_of_birth = data.dateOfBirth;
  if (data.gender !== undefined) payload.gender = data.gender;
  if (data.nationality !== undefined) payload.nationality = data.nationality;
  if (data.currentLocation !== undefined) payload.current_location = data.currentLocation;
  if (data.jobTitle !== undefined) payload.job_title = data.jobTitle;
  if (data.summary !== undefined) payload.summary = data.summary;

  // Only make request if there are fields to update
  if (Object.keys(payload).length > 0) {
    await vincere.put(`/candidate/${vincereId}`, payload);
  }
}

/**
 * Helper to get a specific custom field value
 */
export function getFieldValue(
  customFields: Record<string, VincereCustomField>,
  fieldKey: keyof typeof VINCERE_FIELD_KEYS
): string | number | number[] | null {
  const key = VINCERE_FIELD_KEYS[fieldKey];
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
 * Helper to get boolean custom field (1=Yes, 2=No)
 */
export function getBooleanFieldValue(
  customFields: Record<string, VincereCustomField>,
  fieldKey: keyof typeof VINCERE_FIELD_KEYS
): boolean | null {
  const value = getFieldValue(customFields, fieldKey);
  if (value === null) return null;
  if (value === 1) return true;
  if (value === 2) return false;
  return null;
}

// ============================================================================
// ADDITIONAL CANDIDATE ENDPOINTS
// ============================================================================

/**
 * Vincere functional expertise (skills/specializations)
 */
export interface VincereFunctionalExpertise {
  id: number;
  name: string;
  parent_id?: number;
  description?: string;
}

/**
 * Vincere location
 */
export interface VincereLocation {
  id: number;
  name: string;
  city?: string;
  country?: string;
  country_code?: string;
  region?: string;
}

/**
 * Vincere candidate status
 */
export interface VincerecandidateStatus {
  id: number;
  name: string;
  status_type?: string;
  is_active?: boolean;
}

/**
 * Get functional expertises for a candidate
 * Endpoint: GET /candidate/{id}/functionalexpertises
 */
export async function getFunctionalExpertises(
  vincereId: number,
  client?: VincereClient
): Promise<VincereFunctionalExpertise[]> {
  const vincere = client ?? getVincereClient();

  try {
    const expertises = await vincere.get<VincereFunctionalExpertise[]>(
      `/candidate/${vincereId}/functionalexpertises`
    );
    return expertises ?? [];
  } catch (error) {
    // Return empty array if candidate has no functional expertises (404)
    if (error instanceof Error && error.message.includes('404')) {
      return [];
    }
    throw error;
  }
}

/**
 * Get current location for a candidate
 * Endpoint: GET /candidate/{id}/currentlocation
 */
export async function getCurrentLocation(
  vincereId: number,
  client?: VincereClient
): Promise<VincereLocation | null> {
  const vincere = client ?? getVincereClient();

  try {
    const location = await vincere.get<VincereLocation>(
      `/candidate/${vincereId}/currentlocation`
    );
    return location ?? null;
  } catch (error) {
    // Return null if candidate has no current location (404)
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

/**
 * Get candidate status
 * Endpoint: GET /candidate/{id}/candidatestatus
 */
export async function getCandidateStatus(
  vincereId: number,
  client?: VincereClient
): Promise<VincerecandidateStatus | null> {
  const vincere = client ?? getVincereClient();

  try {
    const status = await vincere.get<VincerecandidateStatus>(
      `/candidate/${vincereId}/candidatestatus`
    );
    return status ?? null;
  } catch (error) {
    // Return null if candidate has no status (404)
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

/**
 * Extended candidate data including all additional endpoints
 */
export interface VincereExtendedCandidateData {
  candidate: VincereCandidate;
  customFields: Record<string, VincereCustomField>;
  functionalExpertises: VincereFunctionalExpertise[];
  currentLocation: VincereLocation | null;
  candidateStatus: VincerecandidateStatus | null;
}

/**
 * Get full candidate data including all related endpoints
 */
export async function getFullCandidateData(
  vincereId: number,
  client?: VincereClient
): Promise<VincereExtendedCandidateData | null> {
  const vincere = client ?? getVincereClient();

  const candidate = await getById(vincereId, vincere);
  if (!candidate) {
    return null;
  }

  // Fetch all additional data in parallel
  const [customFields, functionalExpertises, currentLocation, candidateStatus] =
    await Promise.all([
      getCustomFields(vincereId, vincere),
      getFunctionalExpertises(vincereId, vincere),
      getCurrentLocation(vincereId, vincere),
      getCandidateStatus(vincereId, vincere),
    ]);

  return {
    candidate,
    customFields,
    functionalExpertises,
    currentLocation,
    candidateStatus,
  };
}
