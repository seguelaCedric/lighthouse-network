import { z } from 'zod'

// ============================================================================
// REFERRAL CODE
// ============================================================================

export const referralCodeSchema = z
  .string()
  .length(8, 'Referral code must be 8 characters')
  .regex(/^[A-Z0-9]+$/, 'Invalid referral code format')
  .transform((val) => val.toUpperCase())

// ============================================================================
// TRACK REFERRAL CLICK
// ============================================================================

export const trackReferralSchema = z.object({
  code: referralCodeSchema,
  source: z
    .enum(['link', 'qr_code', 'email_share', 'whatsapp_share', 'linkedin_share', 'copy_link'])
    .optional()
    .default('link'),
  utm_campaign: z.string().max(100).optional(),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
})

export type TrackReferralInput = z.infer<typeof trackReferralSchema>

// ============================================================================
// REFERRAL QUERY PARAMS
// ============================================================================

export const referralQuerySchema = z.object({
  status: z
    .enum(['pending', 'signed_up', 'applied', 'placed', 'expired', 'invalid'])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type ReferralQueryInput = z.infer<typeof referralQuerySchema>

// ============================================================================
// REWARDS QUERY PARAMS
// ============================================================================

export const rewardsQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'paid', 'cancelled']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
})

export type RewardsQueryInput = z.infer<typeof rewardsQuerySchema>

// ============================================================================
// PAYOUT REQUEST
// ============================================================================

export const payoutRequestSchema = z.object({
  method: z.enum(['bank_transfer', 'paypal', 'revolut', 'wise']),
  details: z.object({
    // Bank transfer details
    account_name: z.string().max(100).optional(),
    iban: z.string().max(50).optional(),
    bic: z.string().max(20).optional(),
    bank_name: z.string().max(100).optional(),
    // PayPal/Revolut/Wise
    email: z.string().email().optional(),
    phone: z.string().max(20).optional(),
    // Notes
    notes: z.string().max(500).optional(),
  }),
})

export type PayoutRequestInput = z.infer<typeof payoutRequestSchema>

// ============================================================================
// ADMIN: UPDATE REWARD
// ============================================================================

export const updateRewardSchema = z.object({
  status: z.enum(['approved', 'cancelled']),
  notes: z.string().max(500).optional(),
})

export type UpdateRewardInput = z.infer<typeof updateRewardSchema>

// ============================================================================
// ADMIN: MARK REWARD PAID
// ============================================================================

export const markRewardPaidSchema = z.object({
  payment_method: z.enum(['bank_transfer', 'paypal', 'revolut', 'wise', 'credit']),
  payment_reference: z.string().max(200).optional(),
})

export type MarkRewardPaidInput = z.infer<typeof markRewardPaidSchema>

// ============================================================================
// ADMIN: UPDATE SETTINGS
// ============================================================================

export const updateSettingsSchema = z.object({
  program_active: z.boolean().optional(),
  program_name: z.string().max(100).optional(),
  program_description: z.string().max(500).optional(),

  // Reward amounts (in cents)
  signup_reward_referrer: z.number().int().min(0).max(100000).optional(),
  signup_reward_referred: z.number().int().min(0).max(100000).optional(),
  application_reward_referrer: z.number().int().min(0).max(100000).optional(),
  application_reward_referred: z.number().int().min(0).max(100000).optional(),
  placement_reward_referrer: z.number().int().min(0).max(100000).optional(),
  placement_reward_referred: z.number().int().min(0).max(100000).optional(),

  // Limits
  max_referrals_per_month: z.number().int().min(1).max(1000).optional(),
  max_pending_referrals: z.number().int().min(1).max(1000).optional(),
  referral_expiry_days: z.number().int().min(1).max(365).optional(),
  min_payout_amount: z.number().int().min(0).max(100000).optional(),

  // Requirements
  referrer_min_tier: z
    .enum(['unverified', 'basic', 'identity', 'references', 'verified', 'premium'])
    .optional(),
  referrer_must_be_placed: z.boolean().optional(),
  referred_must_apply_days: z.number().int().min(1).max(365).optional(),

  // Anti-fraud
  require_different_email_domain: z.boolean().optional(),
  require_different_ip: z.boolean().optional(),
  cooldown_between_referrals_hours: z.number().int().min(0).max(168).optional(),
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>

// ============================================================================
// ADMIN: REFERRALS QUERY
// ============================================================================

export const adminReferralsQuerySchema = z.object({
  status: z
    .enum(['pending', 'signed_up', 'applied', 'placed', 'expired', 'invalid'])
    .optional(),
  referrer_id: z.string().uuid().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
})

export type AdminReferralsQueryInput = z.infer<typeof adminReferralsQuerySchema>

// ============================================================================
// UUID VALIDATION
// ============================================================================

export const uuidSchema = z.string().uuid('Invalid ID format')
