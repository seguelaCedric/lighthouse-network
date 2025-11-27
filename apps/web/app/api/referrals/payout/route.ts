import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { payoutRequestSchema } from '@/lib/validations/referral'
import { getReferralSettings, formatRewardAmount } from '@/lib/referrals'

/**
 * POST /api/referrals/payout
 * Request a payout of available (approved) rewards
 */
export async function POST(request: NextRequest) {
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
      .select('id, email, first_name, last_name')
      .eq('user_id', user.id)
      .single()

    if (candidateError || !candidate) {
      return NextResponse.json(
        { error: 'Candidate profile not found' },
        { status: 404 }
      )
    }

    // Parse request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    // Validate input
    const parseResult = payoutRequestSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const { method, details } = parseResult.data

    // Validate payment details based on method
    if (method === 'bank_transfer') {
      if (!details.iban || !details.account_name) {
        return NextResponse.json(
          { error: 'Bank transfer requires account_name and iban' },
          { status: 400 }
        )
      }
    } else if (method === 'paypal' || method === 'revolut' || method === 'wise') {
      if (!details.email && !details.phone) {
        return NextResponse.json(
          { error: `${method} requires email or phone` },
          { status: 400 }
        )
      }
    }

    // Get settings for minimum payout amount
    const settings = await getReferralSettings()

    if (!settings?.program_active) {
      return NextResponse.json(
        { error: 'Referral program is currently inactive' },
        { status: 400 }
      )
    }

    // Calculate available balance (approved rewards)
    const { data: approvedRewards, error: rewardsError } = await supabase
      .from('referral_rewards')
      .select('id, amount')
      .eq('candidate_id', candidate.id)
      .eq('status', 'approved')

    if (rewardsError) {
      console.error('Database error:', rewardsError)
      return NextResponse.json(
        { error: 'Failed to fetch rewards' },
        { status: 500 }
      )
    }

    const totalAvailable = approvedRewards?.reduce((sum, r) => sum + r.amount, 0) || 0

    if (totalAvailable === 0) {
      return NextResponse.json(
        { error: 'No approved rewards available for payout' },
        { status: 400 }
      )
    }

    if (totalAvailable < settings.min_payout_amount) {
      return NextResponse.json(
        {
          error: `Minimum payout amount is ${formatRewardAmount(settings.min_payout_amount)}. Your current balance is ${formatRewardAmount(totalAvailable)}.`,
          min_payout: settings.min_payout_amount,
          current_balance: totalAvailable,
        },
        { status: 400 }
      )
    }

    // Create payout request notification for admin
    // In a real system, you might have a dedicated payout_requests table
    // For now, we'll create an alert for the admin
    const payoutDetails = JSON.stringify({
      candidate_id: candidate.id,
      candidate_name: `${candidate.first_name} ${candidate.last_name}`,
      candidate_email: candidate.email,
      amount: totalAvailable,
      method,
      details,
      reward_ids: approvedRewards.map((r) => r.id),
      requested_at: new Date().toISOString(),
    })

    // Create alert for admins
    const { error: alertError } = await supabase.from('alerts').insert({
      type: 'payout_request',
      title: `Payout Request: ${formatRewardAmount(totalAvailable)}`,
      message: `${candidate.first_name} ${candidate.last_name} has requested a payout of ${formatRewardAmount(totalAvailable)} via ${method}.`,
      entity_type: 'candidate',
      entity_id: candidate.id,
      priority: 'high',
      action_url: `/admin/referrals?candidate=${candidate.id}`,
      action_text: 'Process Payout',
    })

    if (alertError) {
      console.error('Failed to create alert:', alertError)
      // Don't fail the request, just log it
    }

    // Store the payout request in candidate notes or a dedicated field
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Payout request submitted successfully',
      amount: totalAvailable,
      amount_formatted: formatRewardAmount(totalAvailable),
      method,
      rewards_count: approvedRewards.length,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
