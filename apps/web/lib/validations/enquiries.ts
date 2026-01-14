import { z } from 'zod'

// ============================================================================
// ENQUIRY TYPES
// ============================================================================

export const enquiryTypeSchema = z.enum([
  'contact',
  'brief_match',
  'match_funnel',
  'salary_guide',
  'employer_referral',
])

export type EnquiryType = z.infer<typeof enquiryTypeSchema>

// ============================================================================
// TABLE REFERENCE (for routing updates to correct table)
// ============================================================================

export const enquiryTableSchema = z.enum([
  'seo_inquiries',
  'salary_guide_leads',
  'employer_enquiries',
])

export type EnquiryTable = z.infer<typeof enquiryTableSchema>

// ============================================================================
// STATUS VALUES BY TABLE
// ============================================================================

export const seoInquiryStatusSchema = z.enum([
  'new',
  'contacted',
  'qualified',
  'converted',
  'closed',
])

export const employerEnquiryStatusSchema = z.enum([
  'submitted',
  'under_review',
  'verified',
  'invalid',
  'duplicate',
])

// Salary guide leads don't have explicit status - derived from sent_at
export const salaryGuideStatusSchema = z.enum(['pending', 'sent'])

// ============================================================================
// ENQUIRIES LIST QUERY
// ============================================================================

export const enquiriesQuerySchema = z.object({
  type: enquiryTypeSchema.optional(),
  status: z.string().optional(),
  search: z.string().max(200).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  sort_by: z.enum(['created_at', 'updated_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
})

export type EnquiriesQueryInput = z.infer<typeof enquiriesQuerySchema>

// ============================================================================
// UPDATE ENQUIRY
// ============================================================================

export const updateEnquirySchema = z.object({
  _table: enquiryTableSchema,
  status: z.string().optional(),
  notes: z.string().max(5000).optional(),
  review_notes: z.string().max(2000).optional(), // employer_enquiries only
})

export type UpdateEnquiryInput = z.infer<typeof updateEnquirySchema>

// ============================================================================
// DELETE ENQUIRY
// ============================================================================

export const deleteEnquirySchema = z.object({
  _table: enquiryTableSchema,
})

export type DeleteEnquiryInput = z.infer<typeof deleteEnquirySchema>

// ============================================================================
// UNIFIED ENQUIRY TYPE (for frontend)
// ============================================================================

export interface UnifiedEnquiry {
  id: string
  type: EnquiryType

  // Contact info (normalized)
  name: string | null
  email: string
  phone: string | null
  company: string | null
  message: string | null

  // Status
  status: string
  notes: string | null

  // Timestamps
  created_at: string
  updated_at: string | null

  // Source tracking
  source_url: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null

  // Type-specific metadata
  metadata: {
    // For seo_inquiries
    position_needed?: string | null
    location?: string | null
    landing_page_id?: string | null

    // For salary_guide_leads
    sent_at?: string | null
    email_id?: string | null

    // For employer_enquiries
    company_name?: string | null
    contact_name?: string | null
    referrer_id?: string | null
    referrer_name?: string | null
    reviewed_at?: string | null
    reviewed_by?: string | null
    review_notes?: string | null
    client_id?: string | null
  }

  // For routing updates/deletes to correct table
  _table: EnquiryTable
}

// ============================================================================
// STATS RESPONSE TYPE
// ============================================================================

export interface EnquiryStats {
  total: number
  new_count: number
  this_week: number
  by_type: {
    contact: number
    brief_match: number
    match_funnel: number
    salary_guide: number
    employer_referral: number
  }
  by_status: Record<string, number>
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface EnquiriesListResponse {
  enquiries: UnifiedEnquiry[]
  total: number
  stats: EnquiryStats
  limit: number
  offset: number
}

export interface EnquiryDetailResponse {
  enquiry: UnifiedEnquiry
}

// ============================================================================
// STATUS DISPLAY CONFIG
// ============================================================================

export const statusDisplayConfig: Record<
  string,
  { label: string; color: string }
> = {
  // seo_inquiries statuses
  new: { label: 'New', color: 'blue' },
  contacted: { label: 'Contacted', color: 'gold' },
  qualified: { label: 'Qualified', color: 'purple' },
  converted: { label: 'Converted', color: 'success' },
  closed: { label: 'Closed', color: 'gray' },

  // salary_guide_leads (derived)
  pending: { label: 'Pending', color: 'gold' },
  sent: { label: 'Sent', color: 'success' },

  // employer_enquiries statuses
  submitted: { label: 'Submitted', color: 'blue' },
  under_review: { label: 'Under Review', color: 'gold' },
  verified: { label: 'Verified', color: 'success' },
  invalid: { label: 'Invalid', color: 'error' },
  duplicate: { label: 'Duplicate', color: 'gray' },
}

// ============================================================================
// TYPE DISPLAY CONFIG
// ============================================================================

export const typeDisplayConfig: Record<
  EnquiryType,
  { label: string; color: string }
> = {
  contact: { label: 'Contact', color: 'navy' },
  brief_match: { label: 'Brief Match', color: 'burgundy' },
  match_funnel: { label: 'Match Funnel', color: 'purple' },
  salary_guide: { label: 'Salary Guide', color: 'gold' },
  employer_referral: { label: 'Employer Referral', color: 'success' },
}
