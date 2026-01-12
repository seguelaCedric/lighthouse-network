/**
 * Referral Service
 *
 * Handles the full referral lifecycle:
 * - Generating and managing referral codes
 * - Tracking referral link clicks
 * - Converting referrals when candidates sign up
 * - Tracking milestones (application, placement)
 * - Creating and managing rewards
 */

import { createClient } from '@/lib/supabase/server'
import type {
  ReferralStats,
  ReferralSettings,
  Referral,
  ReferralReward,
  ReferralSource,
} from '@lighthouse/database'

// ============================================================================
// REFERRAL CODE MANAGEMENT
// ============================================================================

/**
 * Get or create a referral code for a candidate
 * Uses the database function for atomic code generation
 */
export async function getOrCreateReferralCode(candidateId: string): Promise<string | null> {
  const supabase = await createClient()

  // First check if candidate already has a code
  const { data: candidate } = await supabase
    .from('candidates')
    .select('referral_code')
    .eq('id', candidateId)
    .single()

  if (candidate?.referral_code) {
    return candidate.referral_code
  }

  // Use database function to generate and assign code atomically
  const { data, error } = await supabase.rpc('assign_referral_code', {
    p_candidate_id: candidateId,
  })

  if (error) {
    console.error('Failed to generate referral code:', error)
    return null
  }

  return data as string
}

/**
 * Look up a candidate by their referral code
 */
export async function getCandidateByReferralCode(code: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('candidates')
    .select('id, first_name, last_name, photo_url, verification_tier')
    .eq('referral_code', code.toUpperCase())
    .single()

  if (error || !data) {
    return null
  }

  return data
}

// ============================================================================
// REFERRAL TRACKING
// ============================================================================

/**
 * Track when a referral link is clicked
 * Creates a pending referral record that can be converted later
 */
export async function trackReferralClick(
  code: string,
  options?: {
    source?: ReferralSource
    utm_campaign?: string
    utm_source?: string
    utm_medium?: string
  }
): Promise<string | null> {
  const supabase = await createClient()

  // Find the referrer by code
  const { data: referrer } = await supabase
    .from('candidates')
    .select('id')
    .eq('referral_code', code.toUpperCase())
    .single()

  if (!referrer) {
    console.error('Invalid referral code:', code)
    return null
  }

  // Check referral limits
  const settings = await getReferralSettings()
  if (settings) {
    const { data: monthlyCount } = await supabase
      .from('referrals')
      .select('id', { count: 'exact' })
      .eq('referrer_id', referrer.id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    if (monthlyCount && monthlyCount.length >= settings.max_referrals_per_month) {
      console.warn('Referrer has reached monthly limit')
      // Still allow the click to be tracked, but note it
    }
  }

  // Create the referral record
  const { data: referral, error } = await supabase
    .from('referrals')
    .insert({
      referrer_id: referrer.id,
      referrer_code: code.toUpperCase(),
      source: options?.source || 'link',
      utm_campaign: options?.utm_campaign,
      utm_source: options?.utm_source,
      utm_medium: options?.utm_medium,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to track referral click:', error)
    return null
  }

  return referral.id
}

/**
 * Convert a pending referral when the referred person signs up
 */
export async function convertReferralSignup(
  referralId: string,
  candidateId: string,
  email: string
): Promise<boolean> {
  const supabase = await createClient()

  // Get the referral
  const { data: referral } = await supabase
    .from('referrals')
    .select('id, referrer_id, status')
    .eq('id', referralId)
    .single()

  if (!referral || referral.status !== 'pending') {
    console.error('Invalid or already converted referral:', referralId)
    return false
  }

  // Update the referral
  const { error: updateError } = await supabase
    .from('referrals')
    .update({
      referred_id: candidateId,
      referred_email: email,
      status: 'signed_up',
      signed_up_at: new Date().toISOString(),
    })
    .eq('id', referralId)

  if (updateError) {
    console.error('Failed to convert referral:', updateError)
    return false
  }

  // Link the candidate to their referrer
  await supabase
    .from('candidates')
    .update({
      referred_by_candidate_id: referral.referrer_id,
      referred_at: new Date().toISOString(),
    })
    .eq('id', candidateId)

  // Create rewards using database function
  await supabase.rpc('track_referral_milestone', {
    p_referral_id: referralId,
    p_milestone: 'signup',
  })

  return true
}

/**
 * Track when a referred candidate submits their first application
 */
export async function trackReferralApplication(candidateId: string): Promise<boolean> {
  const supabase = await createClient()

  // Find the referral for this candidate
  const { data: referral } = await supabase
    .from('referrals')
    .select('id, first_application_at')
    .eq('referred_id', candidateId)
    .single()

  if (!referral) {
    // Not a referred candidate, nothing to track
    return false
  }

  if (referral.first_application_at) {
    // Already tracked this milestone
    return false
  }

  // Use database function to update and create rewards
  const { error } = await supabase.rpc('track_referral_milestone', {
    p_referral_id: referral.id,
    p_milestone: 'application',
  })

  if (error) {
    console.error('Failed to track referral application:', error)
    return false
  }

  return true
}

/**
 * Track when a referred candidate gets placed
 */
export async function trackReferralPlacement(candidateId: string): Promise<boolean> {
  const supabase = await createClient()

  // Find the referral for this candidate
  const { data: referral } = await supabase
    .from('referrals')
    .select('id, placed_at')
    .eq('referred_id', candidateId)
    .single()

  if (!referral) {
    // Not a referred candidate
    return false
  }

  if (referral.placed_at) {
    // Already tracked this milestone
    return false
  }

  // Use database function to update and create rewards
  const { error } = await supabase.rpc('track_referral_milestone', {
    p_referral_id: referral.id,
    p_milestone: 'placement',
  })

  if (error) {
    console.error('Failed to track referral placement:', error)
    return false
  }

  return true
}

// ============================================================================
// REFERRAL STATS & DATA
// ============================================================================

/**
 * Get referral statistics for a candidate
 */
export async function getReferralStats(candidateId: string): Promise<ReferralStats | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_referral_stats', {
    p_candidate_id: candidateId,
  })

  if (error) {
    console.error('Failed to get referral stats:', error)
    return null
  }

  // The RPC returns an array with one row
  const stats = Array.isArray(data) ? data[0] : data

  return stats as ReferralStats
}

/**
 * Get all referrals made by a candidate
 */
export async function getReferralsByReferrer(
  candidateId: string,
  options?: { limit?: number; offset?: number }
): Promise<Referral[]> {
  const supabase = await createClient()

  let query = supabase
    .from('referrals')
    .select(`
      *,
      referred:referred_id (
        id,
        first_name,
        last_name,
        photo_url,
        verification_tier
      )
    `)
    .eq('referrer_id', candidateId)
    .order('created_at', { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to get referrals:', error)
    return []
  }

  return data as Referral[]
}

/**
 * Get rewards for a candidate
 */
export async function getRewardsByCandidateId(
  candidateId: string,
  options?: { status?: string; limit?: number }
): Promise<ReferralReward[]> {
  const supabase = await createClient()

  let query = supabase
    .from('referral_rewards')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to get rewards:', error)
    return []
  }

  return data as ReferralReward[]
}

// ============================================================================
// SETTINGS
// ============================================================================

/**
 * Get current referral program settings
 */
export async function getReferralSettings(): Promise<ReferralSettings | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('referral_settings')
    .select('*')
    .single()

  if (error) {
    console.error('Failed to get referral settings:', error)
    return null
  }

  return data as ReferralSettings
}

/**
 * Check if referral program is active
 */
export async function isReferralProgramActive(): Promise<boolean> {
  const settings = await getReferralSettings()
  return settings?.program_active ?? false
}

/**
 * Check if a candidate is eligible to refer others
 */
export async function canCandidateRefer(candidateId: string): Promise<{
  eligible: boolean
  reason?: string
}> {
  const supabase = await createClient()

  // Get settings and candidate info
  const [settings, { data: candidate }] = await Promise.all([
    getReferralSettings(),
    supabase
      .from('candidates')
      .select('verification_tier, referral_code')
      .eq('id', candidateId)
      .single(),
  ])

  if (!settings?.program_active) {
    return { eligible: false, reason: 'Referral program is currently inactive' }
  }

  if (!candidate) {
    return { eligible: false, reason: 'Candidate not found' }
  }

  // Check verification tier
  const tierOrder = ['unverified', 'basic', 'identity', 'references', 'verified', 'premium']
  const candidateTierIndex = tierOrder.indexOf(candidate.verification_tier)
  const requiredTierIndex = tierOrder.indexOf(settings.referrer_min_tier)

  if (candidateTierIndex < requiredTierIndex) {
    return {
      eligible: false,
      reason: `You need to reach "${settings.referrer_min_tier}" verification tier to refer others`,
    }
  }

  // Check monthly limit
  const { count } = await supabase
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', candidateId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  if (count && count >= settings.max_referrals_per_month) {
    return {
      eligible: false,
      reason: `You've reached the monthly limit of ${settings.max_referrals_per_month} referrals`,
    }
  }

  return { eligible: true }
}

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

/**
 * Get referral leaderboard
 */
export async function getReferralLeaderboard(limit = 10) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('referral_leaderboard')
    .select('*')
    .limit(limit)

  if (error) {
    console.error('Failed to get leaderboard:', error)
    return []
  }

  return data
}

/**
 * Get pending payouts for admin review
 */
export async function getPendingPayouts() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pending_referral_payouts')
    .select('*')

  if (error) {
    console.error('Failed to get pending payouts:', error)
    return []
  }

  return data
}

/**
 * Approve a reward for payout
 */
export async function approveReward(
  rewardId: string,
  approvedBy: string
): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('referral_rewards')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
    })
    .eq('id', rewardId)
    .eq('status', 'pending')

  if (error) {
    console.error('Failed to approve reward:', error)
    return false
  }

  return true
}

/**
 * Mark a reward as paid
 */
export async function markRewardPaid(
  rewardId: string,
  paymentMethod: string,
  paymentReference?: string
): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('referral_rewards')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_method: paymentMethod,
      payment_reference: paymentReference,
    })
    .eq('id', rewardId)
    .eq('status', 'approved')

  if (error) {
    console.error('Failed to mark reward as paid:', error)
    return false
  }

  return true
}

/**
 * Cancel a reward
 */
export async function cancelReward(rewardId: string, reason?: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('referral_rewards')
    .update({
      status: 'cancelled',
      notes: reason,
    })
    .eq('id', rewardId)
    .in('status', ['pending', 'approved'])

  if (error) {
    console.error('Failed to cancel reward:', error)
    return false
  }

  return true
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a shareable referral URL
 */
export function generateReferralUrl(code: string, source?: ReferralSource): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lighthouse-careers.com'
  const url = new URL('/auth/register', baseUrl)
  url.searchParams.set('ref', code)
  if (source) {
    url.searchParams.set('src', source)
  }
  return url.toString()
}

/**
 * Format reward amount for display (cents to currency)
 */
export function formatRewardAmount(cents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency,
  }).format(cents / 100)
}
