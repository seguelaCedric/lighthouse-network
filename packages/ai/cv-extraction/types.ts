// ============================================================================
// CV EXTRACTION TYPES
// ============================================================================
// Structured data extraction from CV text using AI
// ============================================================================

import { z } from 'zod';

// ----------------------------------------------------------------------------
// POSITION CATEGORIES
// ----------------------------------------------------------------------------

export const positionCategorySchema = z.enum([
  'deck',
  'interior',
  'engineering',
  'galley',
  'medical',
  'childcare',
  'security',
  'management',
  'villa',
  'other',
]);

export type PositionCategory = z.infer<typeof positionCategorySchema>;

// ----------------------------------------------------------------------------
// EXTRACTED POSITION (raw + normalized)
// ----------------------------------------------------------------------------

export const positionExtractedSchema = z.object({
  raw_title: z.string().describe('Exact text from CV, e.g., "Head Stew / Purser"'),
  normalized: z.string().describe('Standardized position, e.g., "Chief Stewardess"'),
  category: positionCategorySchema,
  is_primary: z.boolean().describe('Was this their most recent/main role?'),
});

export type PositionExtracted = z.infer<typeof positionExtractedSchema>;

// ----------------------------------------------------------------------------
// CERTIFICATION DETAILS
// ----------------------------------------------------------------------------

export const certificationCategorySchema = z.enum([
  'stcw',
  'eng1',
  'food_safety',
  'medical',
  'yachtmaster',
  'powerboat',
  'diving',
  'wine',
  'hospitality',
  'security',
  'childcare',
  'maritime',  // General maritime certs (AEC, radio, etc.)
  'engineering', // Engineering certificates
  'other',
]);

export type CertificationCategory = z.infer<typeof certificationCategorySchema>;

export const certificationDetailSchema = z.object({
  name: z.string().describe('Full certificate name, e.g., "STCW 2010 Basic Safety"'),
  category: certificationCategorySchema,
  expiry_date: z.string().nullish().describe('ISO date if mentioned'),
  license_number: z.string().nullish(),
});

export type CertificationDetail = z.infer<typeof certificationDetailSchema>;

// ----------------------------------------------------------------------------
// LICENSE DETAILS (Maritime/Yacht-specific)
// ----------------------------------------------------------------------------

export const licenseTypeSchema = z.enum([
  // Deck licenses
  'master_unlimited',
  'master_3000gt',
  'master_500gt',
  'chief_mate_unlimited',
  'chief_mate_3000gt',
  'ow_unlimited',
  'ow_3000gt',
  'yachtmaster_ocean',
  'yachtmaster_offshore',
  'yachtmaster_coastal',
  // Engineering licenses
  'chief_engineer_unlimited',
  'chief_engineer_3000kw',
  'second_engineer_unlimited',
  'second_engineer_3000kw',
  'y4',
  'y3',
  'y2',
  'y1',
  'eoow',
  'aec',
  // Medical certificates (treated as licenses)
  'eng1',
  'ems1',
  'ml5',
  // STCW modules
  'stcw', // General STCW (when specific module not known)
  'stcw_bst',
  'stcw_pscrb',
  'stcw_afa',
  'stcw_pssr',
  'stcw_sdsd',
  // Watersports
  'powerboat', // General powerboat license
  'powerboat_level_2',
  'jet_ski',
  'padi_divemaster',
  'padi_instructor',
  'ssi_divemaster',
  'gmdss', // GMDSS radio license
  'src', // Short Range Certificate
  // Other
  'other',
]);

export type LicenseType = z.infer<typeof licenseTypeSchema>;

export const licenseDetailSchema = z.object({
  name: z.string().describe('Full license name, e.g., "Master Yacht 3000GT"'),
  license_type: licenseTypeSchema.nullish(),
  issuing_authority: z.string().nullish().describe('e.g., MCA, USCG, RYA'),
  license_number: z.string().nullish(),
  issue_date: z.string().nullish().describe('ISO date'),
  expiry_date: z.string().nullish().describe('ISO date'),
  limitations: z.string().nullish().describe('Any restrictions or endorsements'),
});

export type LicenseDetail = z.infer<typeof licenseDetailSchema>;

// ----------------------------------------------------------------------------
// REFERENCE CONTACT DETAILS
// ----------------------------------------------------------------------------

export const referenceDetailSchema = z.object({
  name: z.string().describe('Reference name'),
  position: z.string().nullish().describe('Their position, e.g., "Captain" or "Chief Stewardess"'),
  company_or_vessel: z.string().nullish().describe('Company or yacht name'),
  relationship: z.string().nullish().describe('e.g., "Former Captain", "Previous employer"'),
  phone: z.string().nullish().describe('Phone number if provided'),
  email: z.string().nullish().describe('Email if provided'),
  notes: z.string().nullish().describe('Any additional context'),
});

export type ReferenceDetail = z.infer<typeof referenceDetailSchema>;

// ----------------------------------------------------------------------------
// LANGUAGE DETAILS
// ----------------------------------------------------------------------------

const validLanguageProficiencies = [
  'basic',
  'elementary',
  'intermediate',
  'conversational',
  'fluent',
  'proficient',
  'native',
] as const;

// Map CEFR levels (A1, A2, B1, B2, C1, C2) to our proficiency scale
const mapCEFRtoProficiency = (value: string): typeof validLanguageProficiencies[number] => {
  const upper = value.toUpperCase();
  if (upper === 'A1' || upper === 'A2') return 'basic';
  if (upper === 'B1') return 'intermediate';
  if (upper === 'B2') return 'conversational';
  if (upper === 'C1') return 'fluent';
  if (upper === 'C2') return 'proficient';
  return 'intermediate'; // default for unknown values
};

export const languageProficiencySchema = z.enum(validLanguageProficiencies)
  .or(z.string().transform(mapCEFRtoProficiency));

export type LanguageProficiency = z.infer<typeof languageProficiencySchema>;

export const languageDetailSchema = z.object({
  language: z.string(),
  proficiency: languageProficiencySchema,
});

export type LanguageDetail = z.infer<typeof languageDetailSchema>;

// ----------------------------------------------------------------------------
// YACHT EXPERIENCE
// ----------------------------------------------------------------------------

const validYachtTypes = ['motor', 'sail', 'catamaran', 'explorer', 'classic', 'superyacht', 'cargo', 'charter', 'cruise', 'expedition', 'commercial', 'private', 'other'] as const;
export const yachtTypeSchema = z.enum(validYachtTypes).or(z.string().transform(() => 'other' as const));

export type YachtType = z.infer<typeof yachtTypeSchema>;

export const yachtExperienceSchema = z.object({
  yacht_name: z.string().nullish(),
  yacht_size_meters: z.number().nullish().describe('Size in meters'),
  position: z.string().describe('Position held on this yacht'),
  duration_months: z.number().nullish().describe('Duration in months'),
  yacht_type: yachtTypeSchema.nullish(),
  start_date: z.string().nullish().describe('ISO date'),
  end_date: z.string().nullish().describe('ISO date or "present"'),
});

export type YachtExperience = z.infer<typeof yachtExperienceSchema>;

// ----------------------------------------------------------------------------
// VILLA/ESTATE EXPERIENCE
// ----------------------------------------------------------------------------

export const propertyTypeSchema = z.enum([
  'villa',
  'estate',
  'private_residence',
  'chalet',
  'penthouse',
  'palace',
  'castle',
  'other',
]);

export type PropertyType = z.infer<typeof propertyTypeSchema>;

export const villaExperienceSchema = z.object({
  property_name: z.string().nullish(),
  location: z.string().nullish().describe('City/region/country'),
  position: z.string().describe('Position held'),
  duration_months: z.number().nullish().describe('Duration in months'),
  property_type: propertyTypeSchema.nullish(),
  start_date: z.string().nullish(),
  end_date: z.string().nullish(),
});

export type VillaExperience = z.infer<typeof villaExperienceSchema>;

// ----------------------------------------------------------------------------
// EDUCATION
// ----------------------------------------------------------------------------

export const educationDetailSchema = z.object({
  institution: z.string().nullish(),
  qualification: z.string().describe('Degree/diploma name'),
  field_of_study: z.string().nullish(),
  year_completed: z.number().nullish(),
});

export type EducationDetail = z.infer<typeof educationDetailSchema>;

// ----------------------------------------------------------------------------
// FULL CV EXTRACTION RESULT
// ----------------------------------------------------------------------------

export const cvExtractionResultSchema = z.object({
  // Calculated total years of experience
  years_experience: z.number().nullable().describe('Total years of relevant experience'),

  // Positions with both raw and normalized forms
  positions_held: z.array(positionExtractedSchema).describe('All positions held'),

  // Primary position (most recent/main role)
  primary_position: z.string().nullable().describe('Normalized primary position'),
  primary_position_raw: z.string().nullable().describe('Raw primary position from CV'),
  position_category: positionCategorySchema.nullable(),

  // Certifications with details
  certifications: z.array(certificationDetailSchema),

  // Maritime licenses (detailed)
  licenses: z.array(licenseDetailSchema).describe('All maritime/yacht licenses'),

  // Highest license for quick filtering
  highest_license: z.string().nullable().describe('Highest maritime license held'),

  // Languages with proficiency
  languages: z.array(languageDetailSchema),

  // Skills/keywords extracted
  skills: z.array(z.string()).describe('Searchable skills and keywords'),

  // Work experience
  yacht_experience: z.array(yachtExperienceSchema),
  villa_experience: z.array(villaExperienceSchema),

  // Education
  education: z.array(educationDetailSchema),

  // References with contact details
  references: z.array(referenceDetailSchema).describe('Reference contacts from CV'),

  // Derived boolean flags (for backwards compatibility with existing filters)
  has_stcw: z.boolean(),
  has_eng1: z.boolean(),
  has_yachtmaster: z.boolean(),
  has_powerboat: z.boolean(),

  // Confidence score for the extraction
  extraction_confidence: z.number().min(0).max(1).describe('0-1 confidence in extraction quality'),

  // Any extraction notes/warnings
  extraction_notes: z.array(z.string()).optional().describe('Warnings or notes about extraction'),
});

export type CVExtractionResult = z.infer<typeof cvExtractionResultSchema>;

// ----------------------------------------------------------------------------
// EXTRACTION REQUEST/RESPONSE
// ----------------------------------------------------------------------------

export interface CVExtractionRequest {
  cv_text: string;
  candidate_id?: string;
  document_id?: string;
}

export interface CVExtractionResponse {
  success: boolean;
  extraction: CVExtractionResult | null;
  error?: string;
  processing_time_ms: number;
}

// ----------------------------------------------------------------------------
// EXTRACTION QUEUE ITEM
// ----------------------------------------------------------------------------

export interface CVExtractionQueueItem {
  id: string;
  candidate_id: string;
  document_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  error_message?: string;
  created_at: string;
  processed_at?: string;
}
