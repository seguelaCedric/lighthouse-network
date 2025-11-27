import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminReferralsQuerySchema } from '@/lib/validations/referral'

/**
 * GET /api/admin/referrals
 * List all referrals with filters (recruiter/admin only)
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

    // Check user is recruiter/admin
    const { data: userData } = await supabase
      .from('users')
      .select('user_type, role')
      .eq('auth_id', user.id)
      .single()

    if (!userData || (userData.user_type !== 'recruiter' && !['admin', 'owner'].includes(userData.role || ''))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const parseResult = adminReferralsQuerySchema.safeParse(searchParams)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const { status, referrer_id, date_from, date_to, page, limit } = parseResult.data

    // Build query
    let query = supabase
      .from('referrals')
      .select(
        `
        *,
        referrer:referrer_id (
          id,
          first_name,
          last_name,
          email,
          photo_url
        ),
        referred:referred_id (
          id,
          first_name,
          last_name,
          email,
          photo_url
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (referrer_id) {
      query = query.eq('referrer_id', referrer_id)
    }

    if (date_from) {
      query = query.gte('created_at', date_from)
    }

    if (date_to) {
      query = query.lte('created_at', date_to)
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

    // Get summary stats
    const { data: statsData } = await supabase
      .from('referrals')
      .select('status')

    const stats = {
      total: statsData?.length || 0,
      pending: statsData?.filter((r) => r.status === 'pending').length || 0,
      signed_up: statsData?.filter((r) => r.status === 'signed_up').length || 0,
      applied: statsData?.filter((r) => r.status === 'applied').length || 0,
      placed: statsData?.filter((r) => r.status === 'placed').length || 0,
      expired: statsData?.filter((r) => r.status === 'expired').length || 0,
    }

    return NextResponse.json({
      referrals: referrals || [],
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
      stats,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
