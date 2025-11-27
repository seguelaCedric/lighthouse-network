/**
 * Vincere Integration
 *
 * API client and data mapping for syncing with Vincere ATS.
 *
 * @example
 * ```ts
 * import { getVincereClient, searchByEmail, mapVincereToCandidate } from '@/lib/vincere';
 *
 * // Search for a candidate
 * const vincere = getVincereClient();
 * const candidate = await searchByEmail('john@example.com');
 *
 * // Get candidate with custom fields and map to our type
 * const { candidate: vc, customFields } = await getCandidateWithCustomFields(123);
 * const mapped = mapVincereToCandidate(vc, customFields);
 * ```
 */

// Client
export {
  VincereClient,
  VincereApiError,
  getVincereClient,
  createVincereClient,
} from './client';

// Constants
export {
  VINCERE_FIELD_KEYS,
  VINCERE_INDUSTRY_IDS,
  VINCERE_SYSTEM_IDS,
  VINCERE_YES_NO_VALUES,
  VINCERE_MARITAL_STATUS_VALUES,
  VINCERE_CONTRACT_TYPE_VALUES,
  VINCERE_YACHT_TYPE_VALUES,
  VINCERE_MARITAL_STATUS_MAP,
  VINCERE_CONTRACT_TYPE_MAP,
  VINCERE_YACHT_TYPE_MAP,
  VINCERE_NATIONALITY_MAP,
  NATIONALITY_TO_VINCERE_ID,
  POSITION_MAPPING,
  VINCERE_JOB_FIELD_KEYS,
} from './constants';

// Candidates API
export {
  searchByEmail,
  getById,
  getCustomFields,
  getUpdatedSince,
  getCandidateWithCustomFields,
  updateCustomFields,
  createCandidate,
  getFieldValue,
  getBooleanFieldValue,
} from './candidates';

export type {
  VincereCandidate,
  VincereCustomField,
  VincereSearchResult,
} from './candidates';

// Sync/Mapping
export {
  parseSalaryRange,
  parseYachtSizeRange,
  parseYachtTypes,
  parseContractTypes,
  standardizePosition,
  mapVincereToCandidate,
  mapCandidateToVincere,
  getInterviewNotes,
} from './sync';
