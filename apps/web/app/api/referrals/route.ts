import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { referralQuerySchema } from '@/lib/validations/referral'

/**
 * GET /api/referrals
 * Get list of referrals made by the current candidate
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
    const parseResult = referralQuerySchema.safeParse(searchParams)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const { status, page, limit } = parseResult.data

    // Build query
    let query = supabase
      .from('referrals')
      .select(
        `
        id,
        status,
        clicked_at,
        signed_up_at,
        first_application_at,
        placed_at,
        source,
        expires_at,
        referred:referred_id (
          id,
          first_name,
          last_name,
          photo_url
        )
      `,
        { count: 'exact' }
      )
      .eq('referrer_id', candidate.id)
      .order('created_at', { ascending: false })

    // Apply status filter
    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: referrals, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch referrals' },
        { status: 500 }
      )
    }

    // Get rewards earned per referral
    const { data: rewards } = await supabase
      .from('referral_rewards')
      .select('referral_id, amount, status')
      .eq('candidate_id', candidate.id)

    // Map rewards to referrals
    const rewardsByReferral = rewards?.reduce(
      (acc, reward) => {
        if (!acc[reward.referral_id]) {
          acc[reward.referral_id] = { pending: 0, paid: 0 }
        }
        if (reward.status === 'paid') {
          acc[reward.referral_id].paid += reward.amount
        } else if (reward.status === 'pending' || reward.status === 'approved') {
          acc[reward.referral_id].pending += reward.amount
        }
        return acc
      },
      {} as Record<string, { pending: number; paid: number }>
    )

    // Format response
    const formattedReferrals = referrals?.map((r) => {
      const referred = r.referred as unknown as { first_name: string; last_name: string; photo_url: string | null } | null
      return {
        id: r.id,
        referred_name: referred
          ? `${referred.first_name} ${referred.last_name?.charAt(0) || ''}.`
          : 'Pending signup',
        referred_photo: referred?.photo_url,
        status: r.status,
        clicked_at: r.clicked_at,
        signed_up_at: r.signed_up_at,
        applied_at: r.first_application_at,
        placed_at: r.placed_at,
        source: r.source,
        expires_at: r.expires_at,
        rewards_pending: rewardsByReferral?.[r.id]?.pending || 0,
        rewards_earned: rewardsByReferral?.[r.id]?.paid || 0,
      }
    })

    return NextResponse.json({
      referrals: formattedReferrals || [],
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
