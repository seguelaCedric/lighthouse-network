/**
 * Yotspot Integration Types
 * Types for scraping and importing candidates from Yotspot job board
 */

// =============================================================================
// API Request/Response Types
// =============================================================================

/**
 * Request from n8n webhook when a new Yotspot email is detected
 */
export interface YotspotImportRequest {
  /** URL to view applicant on Yotspot */
  applicantUrl: string;
  /** Yotspot job reference number (e.g., "59309") */
  yotspotJobRef?: string;
  /** Yotspot job ID (e.g., "3858143") */
  yotspotJobId?: string;
  /** Position title from the job posting */
  positionTitle?: string;
  /** Match percentage from Yotspot (e.g., 100) */
  matchPercentage?: number;
}

/**
 * Response to n8n after queuing an import
 */
export interface YotspotImportResponse {
  success: boolean;
  queueId?: string;
  candidateId?: string;
  message: string;
  error?: string;
}

// =============================================================================
// Queue Types
// =============================================================================

export type YotspotImportStatus =
  | 'pending'
  | 'scraping'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'duplicate'
  | 'skipped';

/**
 * Database record for a queued Yotspot import
 */
export interface YotspotImportQueueItem {
  id: string;
  applicant_url: string;
  yotspot_job_ref: string | null;
  yotspot_job_id: string | null;
  position_title: string | null;
  match_percentage: number | null;
  status: YotspotImportStatus;
  scraped_at: string | null;
  candidate_name: string | null;
  candidate_email: string | null;
  candidate_phone: string | null;
  scraped_data: ScrapedCandidate | null;
  cv_url: string | null;
  photo_url: string | null;
  candidate_id: string | null;
  job_id: string | null;
  match_score: number | null;
  match_assessment: string | null;
  notified_at: string | null;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  next_retry_at: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

// =============================================================================
// Scraper Types
// =============================================================================

/**
 * Work experience entry from Yotspot profile
 */
export interface YotspotWorkExperience {
  yachtName: string;
  position: string;
  yachtSize: number | null;
  yachtType: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
}

/**
 * Certification/license from Yotspot profile
 */
export interface YotspotCertification {
  name: string;
  issueDate: string | null;
  expiryDate: string | null;
  issuingAuthority: string | null;
}

/**
 * Visa information from Yotspot profile
 */
export interface YotspotVisa {
  type: string;
  country: string | null;
  expiryDate: string | null;
}

/**
 * Full candidate data scraped from Yotspot
 */
export interface ScrapedCandidate {
  // Identity
  yotspotId: string | null;
  firstName: string;
  lastName: string;
  fullName: string;

  // Contact
  email: string | null;
  phone: string | null;
  whatsapp: string | null;

  // Personal
  nationality: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  currentLocation: string | null;

  // Professional
  primaryPosition: string | null;
  secondaryPositions: string[];
  yearsExperience: number | null;
  profileSummary: string | null;

  // Availability
  availabilityStatus: string | null;
  availableFrom: string | null;

  // Certifications & Licenses
  hasStcw: boolean;
  hasEng1: boolean;
  certifications: YotspotCertification[];
  licenses: string[];

  // Visas
  hasSchengen: boolean;
  hasB1B2: boolean;
  visas: YotspotVisa[];

  // Preferences
  preferredYachtSize: string | null;
  preferredYachtType: string | null;
  preferredContractType: string | null;
  salaryExpectation: string | null;

  // Personal attributes
  isSmoker: boolean | null;
  hasVisibleTattoos: boolean | null;
  languages: string[];

  // Documents
  cvDownloadUrl: string | null;
  photoUrl: string | null;

  // Work history
  workHistory: YotspotWorkExperience[];

  // Raw data for debugging
  rawHtml?: string;
  scrapedAt: string;
}

// =============================================================================
// Import Result Types
// =============================================================================

/**
 * Result of processing a single import
 */
export interface ImportResult {
  success: boolean;
  queueId: string;
  candidateId?: string;
  candidateName?: string;
  isDuplicate?: boolean;
  matchScore?: number;
  matchAssessment?: string;
  error?: string;
  errorCode?: ImportErrorCode;
}

export type ImportErrorCode =
  | 'SCRAPE_FAILED'
  | 'LOGIN_FAILED'
  | 'CANDIDATE_NOT_FOUND'
  | 'CV_DOWNLOAD_FAILED'
  | 'CV_EXTRACTION_FAILED'
  | 'CANDIDATE_CREATE_FAILED'
  | 'MATCH_SCORING_FAILED'
  | 'RATE_LIMITED'
  | 'SESSION_EXPIRED'
  | 'UNKNOWN_ERROR';

// =============================================================================
// Notification Types
// =============================================================================

/**
 * Data for the import notification email
 */
export interface YotspotImportNotificationData {
  candidateName: string;
  candidatePosition: string | null;
  candidateEmail: string | null;
  candidatePhone: string | null;
  jobTitle: string;
  jobRef: string | null;
  matchScore: number;
  matchAssessment: string | null;
  strengths: string[];
  concerns: string[];
  candidateProfileUrl: string;
  jobUrl: string;
  yotspotUrl: string;
}

// =============================================================================
// Job Mapping Types
// =============================================================================

/**
 * Database record for Yotspot to Lighthouse job mapping
 */
export interface YotspotJobMapping {
  id: string;
  yotspot_job_id: string;
  yotspot_job_ref: string | null;
  yotspot_position_title: string | null;
  job_id: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Config Types
// =============================================================================

/**
 * Yotspot scraper configuration
 */
export interface YotspotScraperConfig {
  email: string;
  password: string;
  headless: boolean;
  timeout: number;
  minDelayMs: number;
  maxDelayMs: number;
}
