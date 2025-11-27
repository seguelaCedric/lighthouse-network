import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateSettingsSchema } from '@/lib/validations/referral'

/**
 * GET /api/admin/referrals/settings
 * Get current referral program settings
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

    // Check user is recruiter/admin
    const { data: userData } = await supabase
      .from('users')
      .select('user_type, role')
      .eq('auth_id', user.id)
      .single()

    if (!userData || (userData.user_type !== 'recruiter' && !['admin', 'owner'].includes(userData.role || ''))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get settings
    const { data: settings, error } = await supabase
      .from('referral_settings')
      .select('*')
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/referrals/settings
 * Update referral program settings (admin only)
 */
export async function PATCH(request: NextRequest) {
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

    // Check user is admin/owner
    const { data: userData } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_id', user.id)
      .single()

    if (!userData || !['admin', 'owner'].includes(userData.role || '')) {
      return NextResponse.json({ error: 'Forbidden - admin access required' }, { status: 403 })
    }

    // Parse request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    // Validate input
    const parseResult = updateSettingsSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const updates = parseResult.data

    // Update settings (singleton - fixed ID)
    const { data: settings, error } = await supabase
      .from('referral_settings')
      .update({
        ...updates,
        updated_by: userData.id,
      })
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
