import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getReferralStats, getReferralSettings, canCandidateRefer } from '@/lib/referrals'

/**
 * GET /api/referrals/stats
 * Get referral statistics for the current candidate
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get candidate record for this user
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (candidateError || !candidate) {
      return NextResponse.json(
        { error: 'Candidate profile not found' },
        { status: 404 }
      )
    }

    // Get stats
    const stats = await getReferralStats(candidate.id)

    if (!stats) {
      return NextResponse.json(
        { error: 'Failed to get referral stats' },
        { status: 500 }
      )
    }

    // Get eligibility status
    const eligibility = await canCandidateRefer(candidate.id)

    // Get program settings for context
    const settings = await getReferralSettings()

    return NextResponse.json({
      stats,
      eligibility,
      program: settings
        ? {
            active: settings.program_active,
            application_reward: settings.application_reward_referrer,
            placement_reward: settings.placement_reward_referrer,
            min_payout: settings.min_payout_amount,
          }
        : null,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
