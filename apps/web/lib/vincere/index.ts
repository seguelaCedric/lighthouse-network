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
  VINCERE_FUNCTIONAL_EXPERTISE_IDS,
  getVincereFunctionalExpertiseId,
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
  // Additional endpoints
  getFunctionalExpertises,
  setFunctionalExpertises,
  getCurrentLocation,
  getCandidateStatus,
  getFullCandidateData,
} from './candidates';

export type {
  VincereCandidate,
  VincereCustomField,
  VincereSearchResult,
  // Additional types
  VincereFunctionalExpertise,
  VincereLocation,
  VincerecandidateStatus,
  VincereExtendedCandidateData,
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

export type { VincereExtendedData } from './sync';

// Jobs API
export {
  getJobById,
  getJobCustomFields,
  getJobWithCustomFields,
  getJobFieldValue,
  mapVincereToJob,
  searchJobs,
} from './jobs';

export type {
  VincereJob,
  VincereJobSearchResult,
} from './jobs';

// Files API
export {
  getCandidateFiles,
  getCandidateCVFile,
  getCandidatePhotoFile,
  downloadFile,
  downloadCandidateCV,
  downloadCandidatePhoto,
  getFileExtension,
  isPDF,
  isWordDocument,
  isImage,
  VINCERE_FILE_TYPES,
} from './files';

export type {
  VincereFile,
  VincereFileType,
} from './files';

// Document Classifier
export {
  classifyDocument,
  classifyDocuments,
  summarizeClassifications,
  getDocumentTypeLabel,
} from './document-classifier';

export type {
  DocumentType,
  ClassificationConfidence,
  ClassificationMethod,
  ClassificationResult,
  ClassificationSummary,
} from './document-classifier';

// Webhook Management
export {
  listWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
} from './client';

export type { VincereWebhook } from './client';

// Webhook Utilities
export {
  registerJobWebhook,
  registerCandidateWebhook,
  findWebhookByUrl,
  ensureJobWebhook,
  DEFAULT_JOB_WEBHOOK_EVENTS,
  JOB_WEBHOOK_EVENT,
  CANDIDATE_WEBHOOK_EVENT,
} from './webhooks';
