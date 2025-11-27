import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { trackReferralSchema } from '@/lib/validations/referral'
import { trackReferralClick, getCandidateByReferralCode } from '@/lib/referrals'

/**
 * POST /api/referrals/track
 * Track a referral link click (public, no auth required)
 * Called when someone clicks a referral link
 * Returns referral_id to store in session/cookie for signup flow
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    // Validate input
    const parseResult = trackReferralSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const { code, source, utm_campaign, utm_source, utm_medium } = parseResult.data

    // Get referrer info for display
    const referrer = await getCandidateByReferralCode(code)

    if (!referrer) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      )
    }

    // Track the click
    const referralId = await trackReferralClick(code, {
      source,
      utm_campaign,
      utm_source,
      utm_medium,
    })

    if (!referralId) {
      return NextResponse.json(
        { error: 'Failed to track referral' },
        { status: 500 }
      )
    }

    // Return referral info for display
    // Only show first name + last initial for privacy
    const referrerName = `${referrer.first_name} ${referrer.last_name?.charAt(0) || ''}.`

    return NextResponse.json({
      referral_id: referralId,
      referrer_name: referrerName,
      referrer_photo: referrer.photo_url,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/referrals/track?code=ABC123XY
 * Validate a referral code and get referrer info (public, no auth required)
 * Called when landing page loads to show "Referred by X"
 */
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      )
    }

    // Validate code format
    if (!/^[A-Z0-9]{8}$/i.test(code)) {
      return NextResponse.json(
        { error: 'Invalid referral code format' },
        { status: 400 }
      )
    }

    // Get referrer info
    const referrer = await getCandidateByReferralCode(code.toUpperCase())

    if (!referrer) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      )
    }

    // Return referrer info for display
    const referrerName = `${referrer.first_name} ${referrer.last_name?.charAt(0) || ''}.`

    return NextResponse.json({
      valid: true,
      referrer_name: referrerName,
      referrer_photo: referrer.photo_url,
      referrer_tier: referrer.verification_tier,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
