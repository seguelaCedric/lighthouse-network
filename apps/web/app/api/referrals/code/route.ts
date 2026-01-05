import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateReferralCode, generateReferralUrl } from '@/lib/referrals'

/**
 * GET /api/referrals/code
 * Get the current candidate's referral code (generates one if needed)
 * Returns shareable link and QR code URL
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
        .select('id, referral_code, verification_tier')
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
        .select('id, referral_code, verification_tier')
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

    // Get or create referral code
    const code = await getOrCreateReferralCode(candidate.id)

    if (!code) {
      return NextResponse.json(
        { error: 'Failed to generate referral code' },
        { status: 500 }
      )
    }

    // Generate shareable link
    const link = generateReferralUrl(code)

    // Generate QR code URL (using a public QR code service)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}`

    return NextResponse.json({
      code,
      link,
      qr_code_url: qrCodeUrl,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
