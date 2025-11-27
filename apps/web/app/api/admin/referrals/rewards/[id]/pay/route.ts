import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { markRewardPaidSchema, uuidSchema } from '@/lib/validations/referral'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/admin/referrals/rewards/[id]/pay
 * Mark a reward as paid
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Parse request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    // Validate input
    const parseResult = markRewardPaidSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const { payment_method, payment_reference } = parseResult.data

    // Check reward exists and is approved
    const { data: existing } = await supabase
      .from('referral_rewards')
      .select('status')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    if (existing.status !== 'approved') {
      return NextResponse.json(
        { error: 'Only approved rewards can be marked as paid' },
        { status: 400 }
      )
    }

    // Update reward
    const { data: reward, error } = await supabase
      .from('referral_rewards')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_method,
        payment_reference,
      })
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
