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
  // Job application functions
  shortlistCandidateOnJob,
  addCandidateToJob,
  updateApplicationStage,
  removeCandidateFromJob,
  VINCERE_APPLICATION_STAGES,
  VINCERE_STAGE_NAMES,
  VINCERE_DEFAULT_CREATOR_ID,
} from './jobs';

export type {
  VincereJob,
  VincereJobSearchResult,
  VincereApplicationResponse,
  VincereApplicationStage,
  VincereStageName,
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
  shouldExcludeDocument,
} from './document-classifier';

export type {
  DocumentType,
  ClassificationConfidence,
  ClassificationMethod,
  ClassificationResult,
  ClassificationSummary,
  ExclusionResult,
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
  registerPlacementWebhook,
  findWebhookByUrl,
  ensureJobWebhook,
  DEFAULT_JOB_WEBHOOK_EVENTS,
  JOB_WEBHOOK_EVENT,
  CANDIDATE_WEBHOOK_EVENT,
  PLACEMENT_WEBHOOK_EVENT,
} from './webhooks';

// Contacts API
export {
  getContactById,
  getContactsByIds,
  getContactDisplayName,
  getContactPhone,
} from './contacts';

export type { VincereContact } from './contacts';

// Companies API
export {
  getCompanyById,
  getCompaniesByIds,
  getCompanyDisplayName,
} from './companies';

export type { VincereCompany } from './companies';

// Placements API
export {
  getPlacementById,
  getPlacementsForJob,
  getPlacementWithContext,
  mapPlacementStatus,
  getPlacementFee,
} from './placements';

export type {
  VincerePlacement,
  VincerePlacementRef,
  VincerePlacementWithContext,
} from './placements';

// On-Login Hydration Service
export {
  hydrateFromVincere,
  needsVincereHydration,
  triggerHydrationIfNeeded,
} from './on-login-hydration';

export type { HydrationResult } from './on-login-hydration';

// Activities API
export {
  getAllVincereUsers,
  getActivitiesInRange,
  countActivitiesByUser,
  syncAllUserActivities,
  getPreviousDayRange,
} from './activities';

export type {
  VincereActivity,
  VincereUserSummary,
  UserActivityCounts,
} from './activities';
