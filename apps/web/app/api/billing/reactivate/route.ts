import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resumeSubscription } from '@/lib/stripe/subscriptions'

/**
 * POST /api/billing/reactivate
 * Reactivates a subscription that was set to cancel at period end
 */
export async function POST() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization and check role
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('auth_id', user.id)
      .single()

    if (!userData?.organization_id) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      )
    }

    // Only owners and admins can manage billing
    if (!['owner', 'admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Permission denied. Only owners and admins can manage billing.' },
        { status: 403 }
      )
    }

    // Check subscription exists and is set to cancel
    const { data: subscription } = await supabase
      .from('agency_subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('agency_id', userData.organization_id)
      .single()

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 400 }
      )
    }

    if (subscription.status === 'canceled') {
      return NextResponse.json(
        { error: 'Subscription is already canceled. Please subscribe again.' },
        { status: 400 }
      )
    }

    if (!subscription.cancel_at_period_end) {
      return NextResponse.json(
        { error: 'Subscription is not set to cancel' },
        { status: 400 }
      )
    }

    // Reactivate subscription
    await resumeSubscription(userData.organization_id)

    return NextResponse.json({
      success: true,
      message: 'Subscription reactivated successfully',
    })
  } catch (error) {
    console.error('Reactivate subscription API error:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to reactivate subscription'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
