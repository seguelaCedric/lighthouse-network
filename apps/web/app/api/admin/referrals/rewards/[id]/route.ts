import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateRewardSchema, markRewardPaidSchema, uuidSchema } from '@/lib/validations/referral'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/referrals/rewards/[id]
 * Get details of a specific reward
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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

    // Validate ID
    const idResult = uuidSchema.safeParse(id)
    if (!idResult.success) {
      return NextResponse.json({ error: 'Invalid reward ID' }, { status: 400 })
    }

    // Get reward with details
    const { data: reward, error } = await supabase
      .from('referral_rewards')
      .select(
        `
        *,
        candidate:candidate_id (
          id,
          first_name,
          last_name,
          email
        ),
        referral:referral_id (
          id,
          status,
          referrer:referrer_id (
            first_name,
            last_name
          ),
          referred:referred_id (
            first_name,
            last_name
          )
        )
      `
      )
      .eq('id', id)
      .single()

    if (error || !reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    return NextResponse.json({ reward })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/referrals/rewards/[id]
 * Update reward status (approve or cancel)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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
      .select('id, user_type, role')
      .eq('auth_id', user.id)
      .single()

    if (!userData || (userData.user_type !== 'recruiter' && !['admin', 'owner'].includes(userData.role || ''))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate ID
    const idResult = uuidSchema.safeParse(id)
    if (!idResult.success) {
      return NextResponse.json({ error: 'Invalid reward ID' }, { status: 400 })
    }

    // Parse request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    // Validate input
    const parseResult = updateRewardSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const { status, notes } = parseResult.data

    // Check reward exists and is pending
    const { data: existing } = await supabase
      .from('referral_rewards')
      .select('status')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    if (existing.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending rewards can be updated' },
        { status: 400 }
      )
    }

    // Update reward
    const updateData: Record<string, unknown> = {
      status,
      notes,
    }

    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString()
      updateData.approved_by = userData.id
    }

    const { data: reward, error } = await supabase
      .from('referral_rewards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update reward' },
        { status: 500 }
      )
    }

    return NextResponse.json({ reward })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
