import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rewardsQuerySchema } from '@/lib/validations/referral'
import { formatRewardAmount } from '@/lib/referrals'

/**
 * GET /api/referrals/rewards
 * Get all rewards for the current candidate, grouped by status
 */
export async function GET(request: NextRequest) {
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

    // Get user record (auth_id -> user_id mapping)
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle()

    let candidate = null

    // Try to find candidate by user_id if user record exists
    if (userData) {
      const { data: candidateByUserId } = await supabase
        .from('candidates')
        .select('id')
        .eq('user_id', userData.id)
        .maybeSingle()

      if (candidateByUserId) {
        candidate = candidateByUserId
      }
    }

    // Fallback: Try to find candidate by email (for Vincere-imported candidates)
    if (!candidate && user.email) {
      const { data: candidateByEmail } = await supabase
        .from('candidates')
        .select('id')
        .eq('email', user.email)
        .maybeSingle()

      if (candidateByEmail) {
        candidate = candidateByEmail
      }
    }

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate profile not found' },
        { status: 404 }
      )
    }

    // Parse query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const parseResult = rewardsQuerySchema.safeParse(searchParams)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const { status, limit } = parseResult.data

    // Build query
    let query = supabase
      .from('referral_rewards')
      .select(
        `
        id,
        reward_type,
        reward_trigger,
        amount,
        currency,
        status,
        created_at,
        approved_at,
        paid_at,
        payment_method,
        referral:referral_id (
          referred:referred_id (
            first_name,
            last_name
          )
        )
      `
      )
      .eq('candidate_id', candidate.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: rewards, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch rewards' },
        { status: 500 }
      )
    }

    // Group by status and calculate totals
    const grouped = {
      pending: [] as typeof rewards,
      approved: [] as typeof rewards,
      paid: [] as typeof rewards,
      cancelled: [] as typeof rewards,
    }

    let totalPending = 0
    let totalApproved = 0
    let totalPaid = 0

    rewards?.forEach((reward) => {
      if (reward.status === 'pending') {
        grouped.pending.push(reward)
        totalPending += reward.amount
      } else if (reward.status === 'approved') {
        grouped.approved.push(reward)
        totalApproved += reward.amount
      } else if (reward.status === 'paid') {
        grouped.paid.push(reward)
        totalPaid += reward.amount
      } else if (reward.status === 'cancelled') {
        grouped.cancelled.push(reward)
      }
    })

    // Format rewards with readable descriptions
    const formatReward = (reward: (typeof rewards)[0]) => {
      const referral = reward.referral as unknown as { referred: { first_name: string; last_name: string } | null } | null
      const referredName = referral?.referred
        ? `${referral.referred.first_name} ${referral.referred.last_name?.charAt(0) || ''}.`
        : 'Unknown'

      let description = ''
      switch (reward.reward_type) {
        case 'signup_bonus':
          description = `${referredName} signed up`
          break
        case 'application_bonus':
          description = `${referredName} submitted an application`
          break
        case 'placement_bonus':
          description = `${referredName} was placed`
          break
        case 'referred_bonus':
          description = 'Welcome bonus for signing up'
          break
        default:
          description = 'Referral reward'
      }

      return {
        id: reward.id,
        type: reward.reward_type,
        trigger: reward.reward_trigger,
        amount: reward.amount,
        amount_formatted: formatRewardAmount(reward.amount, reward.currency),
        currency: reward.currency,
        status: reward.status,
        description,
        referred_name: referredName,
        created_at: reward.created_at,
        approved_at: reward.approved_at,
        paid_at: reward.paid_at,
        payment_method: reward.payment_method,
      }
    }

    return NextResponse.json({
      pending: grouped.pending.map(formatReward),
      approved: grouped.approved.map(formatReward),
      paid: grouped.paid.map(formatReward),
      cancelled: grouped.cancelled.map(formatReward),
      totals: {
        pending: totalPending,
        pending_formatted: formatRewardAmount(totalPending),
        approved: totalApproved,
        approved_formatted: formatRewardAmount(totalApproved),
        paid: totalPaid,
        paid_formatted: formatRewardAmount(totalPaid),
        available: totalApproved, // available for payout
        available_formatted: formatRewardAmount(totalApproved),
      },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
