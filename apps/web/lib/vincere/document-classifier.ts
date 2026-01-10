/**
 * Document Classifier
 *
 * Classifies Vincere files into document types using filename pattern matching.
 * Uses a tiered approach: Vincere flags → file extension → filename patterns → default
 *
 * Yacht industry-specific patterns for STCW, GUEST, MCA, RYA, ENG1, etc.
 *
 * IMPORTANT: Also filters out dangerous documents that should NOT be imported:
 * - Verbal references (contain unverified claims)
 * - Rebuilt/logo CVs (contain Lighthouse branding, not original documents)
 */

import { VincereFile, getFileExtension } from './files';

/**
 * Document types matching the documents table schema
 */
export type DocumentType =
  | 'cv'
  | 'certification'
  | 'passport'
  | 'visa'
  | 'medical'
  | 'reference'
  | 'contract'
  | 'photo'
  | 'other';

/**
 * Classification confidence levels
 */
export type ClassificationConfidence = 'high' | 'medium' | 'low';

/**
 * Classification method used
 */
export type ClassificationMethod =
  | 'vincere_flag'
  | 'extension'
  | 'filename'
  | 'default';

/**
 * Result of document classification
 */
export interface ClassificationResult {
  type: DocumentType;
  confidence: ClassificationConfidence;
  matchedPattern?: string;
  method: ClassificationMethod;
}

/**
 * Photo file extensions
 */
const PHOTO_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'heic',
  'heif',
  'tiff',
  'tif',
];

/**
 * Exclusion patterns for documents that should NEVER be imported
 *
 * These document types are dangerous to import:
 * 1. Verbal references - contain unverified/informal claims about candidates
 * 2. Rebuilt/Logo CVs - agency-branded documents, not original candidate CVs
 */
const EXCLUSION_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  // Verbal references - informal notes, not verified references
  { pattern: /\bverbal\b/i, reason: 'verbal_reference' },

  // Rebuilt/Logo CVs - agency-branded, not original documents
  { pattern: /\blogo\b/i, reason: 'logo_cv' },
  { pattern: /\blighthouse[_\-\s]?careers/i, reason: 'lighthouse_branded' },
  { pattern: /\bformatted[_\-\s]?cv/i, reason: 'formatted_cv' },
  { pattern: /_Formatted_CV/i, reason: 'formatted_cv' },
  { pattern: /\brebuilt\b/i, reason: 'rebuilt_cv' },
];

/**
 * Result of checking if a document should be excluded
 */
export interface ExclusionResult {
  excluded: boolean;
  reason?: string;
  matchedPattern?: string;
}

/**
 * Filename patterns for each document type
 * Order matters - first match wins within each type
 * Types are checked in priority order in classifyDocument()
 */
const CLASSIFICATION_PATTERNS: Record<
  Exclude<DocumentType, 'photo' | 'other'>,
  RegExp[]
> = {
  // CV patterns (backup for when original_cv flag is false)
  cv: [
    /\bcv\b/i,
    /\bresume\b/i,
    /\bcurriculum[\s._-]?vitae/i,
    /\blebenslauf\b/i, // German
  ],

  // STCW & Maritime Certifications (yacht industry specific)
  certification: [
    /\bstcw/i, // STCW certificates
    /\bguest\b/i, // G.U.E.S.T program
    /\biami\b/i, // IAMI certifications
    /\bpya\b/i, // Professional Yachting Association
    /\bmca\b/i, // Maritime & Coastguard Agency
    /\brya\b/i, // Royal Yachting Association
    /\byachtmaster/i,
    /\bpowerboat/i,
    /\bjetski/i,
    /\bpwc\b/i, // Personal Watercraft
    /\bpadi\b/i, // Diving cert
    /\bssi\b/i, // Scuba Schools International
    /\bdive[\s._-]?master/i,
    /\bfood[\s._-]?(?:safety|hygiene|handling)/i,
    /\bhaccp\b/i,
    /\bship[\s._-]?security/i,
    /\bisps\b/i, // International Ship and Port Facility Security
    /\bgmdss\b/i, // Global Maritime Distress and Safety System
    /\bradar\b/i,
    /\becdis\b/i, // Electronic Chart Display
    /\bbtm\b/i, // Bridge Team Management
    /\berm\b/i, // Engine Room Management
    /\bvhf\b/i, // VHF Radio
    /\bsrc\b/i, // Short Range Certificate
    /\blrc\b/i, // Long Range Certificate
    /\bcertificat/i, // certificate/certification
    /\blicen[cs]e\b/i,
    /\btraining[\s._-]?cert/i,
    /\bdiploma\b/i,
    /\bqualification/i,
    /\bcompetenc/i, // competency/competence
  ],

  // ENG1 & Medical certificates
  medical: [
    /\beng[\s._-]?1\b/i, // ENG1 medical
    /\beng1\b/i,
    /\bmedical[\s._-]?(?:cert|exam|fitness|clearance)/i,
    /\bfitness[\s._-]?(?:cert|to[\s._-]?work)/i,
    /\bhealth[\s._-]?cert/i,
    /\bdrug[\s._-]?(?:test|screen)/i,
    /\balcohol[\s._-]?test/i,
    /\bvaccin/i,
    /\bimmunization/i,
    /\bmedical/i, // Generic medical fallback (lower priority)
  ],

  // Passport & ID documents
  passport: [
    /\bpassport/i,
    /\bseaman[\s._-]?(?:book|discharge)/i,
    /\bsid\b/i, // Seafarer Identity Document
    /\bsbc\b/i, // Seaman's Book Certificate
    /\bnational[\s._-]?id/i,
    /\bidentity[\s._-]?(?:card|doc)/i,
    /\bid[\s._-]?card/i,
    /\bdrivers?[\s._-]?licen[cs]e/i,
    /\bdriving[\s._-]?licen[cs]e/i,
  ],

  // Visa & Work Permits
  visa: [
    /\bvisa\b/i,
    /\bb1[\s._-]?b2/i, // US tourist/business
    /\bc1[\s._-]?d\b/i, // US crewmember transit
    /\bschengen/i,
    /\bwork[\s._-]?permit/i,
    /\bentry[\s._-]?permit/i,
    /\bgreen[\s._-]?card/i,
    /\bresidenc/i, // residency/residence permit
    /\bimmigration/i,
  ],

  // References & Recommendations
  reference: [
    /\breference/i,
    /\brecommend/i,
    /\btestimonial/i,
    /\bletter[\s._-]?of[\s._-]?rec/i,
  ],

  // Contracts & Sea Service
  contract: [
    /\bcontract\b/i,
    /\bagreement\b/i,
    /\bsea[\s._-]?service/i,
    /\bdischarge[\s._-]?book/i,
    /\bemployment/i,
    /\boffer[\s._-]?letter/i,
  ],
};

/**
 * Normalize filename for pattern matching
 * Removes path, converts to lowercase, replaces separators with spaces
 */
function normalizeFilename(filename: string): string {
  // Get just the filename without path
  const name = filename.split('/').pop() || filename;

  // Convert to lowercase and replace common separators with spaces
  return name.toLowerCase().replace(/[_\-\.]/g, ' ');
}

/**
 * Check if a file should be excluded from import
 * Returns exclusion status and reason if excluded
 *
 * IMPORTANT: Call this BEFORE classifyDocument to filter out dangerous files
 */
export function shouldExcludeDocument(file: VincereFile): ExclusionResult {
  const filename = file.file_name || '';
  const normalized = normalizeFilename(filename);

  for (const { pattern, reason } of EXCLUSION_PATTERNS) {
    if (pattern.test(normalized) || pattern.test(filename)) {
      return {
        excluded: true,
        reason,
        matchedPattern: pattern.source,
      };
    }
  }

  return { excluded: false };
}

/**
 * Check if a filename matches CV-like patterns (for photo exclusion)
 */
function looksLikeCV(filename: string): boolean {
  const normalized = normalizeFilename(filename);
  return CLASSIFICATION_PATTERNS.cv.some((pattern) => pattern.test(normalized));
}

/**
 * Check if a photo-extension file looks like a document scan (certificate, visa, etc.)
 * These are often uploaded as JPG/PNG scans of physical documents
 */
function looksLikeDocumentScan(filename: string): DocumentType | null {
  const normalized = normalizeFilename(filename);

  // Check document types in priority order (same as main classification)
  const checkOrder: Array<Exclude<DocumentType, 'photo' | 'other'>> = [
    'medical',        // ENG1 scans
    'certification',  // STCW scans
    'passport',       // Passport scans
    'visa',           // Visa scans
  ];

  for (const docType of checkOrder) {
    const patterns = CLASSIFICATION_PATTERNS[docType];
    for (const pattern of patterns) {
      if (pattern.test(normalized)) {
        return docType;
      }
    }
  }

  return null;
}

/**
 * Classify a Vincere file into a document type
 *
 * Classification priority:
 * 1. Vincere original_cv flag → 'cv' (highest confidence)
 * 2. Photo extension (unless filename suggests CV) → 'photo'
 * 3. Filename pattern matching → various types
 * 4. Default → 'other' (lowest confidence)
 */
export function classifyDocument(file: VincereFile): ClassificationResult {
  const filename = file.file_name || '';
  const normalized = normalizeFilename(filename);

  // Step 1: Vincere CV flag (highest priority, highest confidence)
  if (file.original_cv === true) {
    return {
      type: 'cv',
      confidence: 'high',
      method: 'vincere_flag',
    };
  }

  // Step 2: Photo by extension (but check if it's a document scan first)
  const ext = getFileExtension(file);
  if (PHOTO_EXTENSIONS.includes(ext)) {
    // First check if it's a CV saved as image
    if (looksLikeCV(filename)) {
      // Continue to pattern matching below
    } else {
      // Check if it looks like a scanned document (STCW, ENG1, passport, visa)
      const docType = looksLikeDocumentScan(filename);
      if (docType) {
        return {
          type: docType,
          confidence: 'medium',
          method: 'filename',
        };
      }

      // Otherwise it's a regular photo
      return {
        type: 'photo',
        confidence: 'high',
        method: 'extension',
      };
    }
  }

  // Step 3: Pattern matching in priority order
  // Order matters for accuracy - check more specific types first
  const typeOrder: Array<Exclude<DocumentType, 'photo' | 'other'>> = [
    'cv', // Check CV first (backup for when flag is false)
    'medical', // ENG1 before generic certification
    'passport', // ID documents
    'visa', // Visa documents
    'certification', // Broad certification category
    'reference', // References
    'contract', // Contracts
  ];

  for (const docType of typeOrder) {
    const patterns = CLASSIFICATION_PATTERNS[docType];
    for (const pattern of patterns) {
      if (pattern.test(normalized)) {
        return {
          type: docType,
          confidence: 'medium',
          matchedPattern: pattern.source,
          method: 'filename',
        };
      }
    }
  }

  // Step 4: Default fallback
  return {
    type: 'other',
    confidence: 'low',
    method: 'default',
  };
}

/**
 * Batch classify multiple files
 * Returns a map of file ID to classification result
 */
export function classifyDocuments(
  files: VincereFile[]
): Map<number, ClassificationResult> {
  const results = new Map<number, ClassificationResult>();

  for (const file of files) {
    results.set(file.id, classifyDocument(file));
  }

  return results;
}

/**
 * Get summary statistics for a batch of classifications
 */
export interface ClassificationSummary {
  total: number;
  byType: Partial<Record<DocumentType, number>>;
  byConfidence: Partial<Record<ClassificationConfidence, number>>;
  byMethod: Partial<Record<ClassificationMethod, number>>;
}

export function summarizeClassifications(
  results: Map<number, ClassificationResult> | ClassificationResult[]
): ClassificationSummary {
  const classifications = Array.isArray(results)
    ? results
    : Array.from(results.values());

  const summary: ClassificationSummary = {
    total: classifications.length,
    byType: {},
    byConfidence: {},
    byMethod: {},
  };

  for (const result of classifications) {
    // Count by type
    summary.byType[result.type] = (summary.byType[result.type] || 0) + 1;

    // Count by confidence
    summary.byConfidence[result.confidence] =
      (summary.byConfidence[result.confidence] || 0) + 1;

    // Count by method
    summary.byMethod[result.method] =
      (summary.byMethod[result.method] || 0) + 1;
  }

  return summary;
}

/**
 * Human-readable label for document type
 */
export function getDocumentTypeLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    cv: 'CV/Resume',
    certification: 'Certification',
    passport: 'Passport/ID',
    visa: 'Visa/Work Permit',
    medical: 'Medical Certificate',
    reference: 'Reference',
    contract: 'Contract',
    photo: 'Photo',
    other: 'Other Document',
  };
  return labels[type];
}
