import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cancelSubscription } from '@/lib/stripe/subscriptions'
import { cancelSubscriptionSchema } from '@/lib/validations/billing'

/**
 * POST /api/billing/cancel
 * Cancels subscription (at period end by default)
 */
export async function POST(request: Request) {
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

    // Parse and validate request body
    const body = await request.json().catch(() => ({}))
    const validationResult = cancelSubscriptionSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { immediately, reason } = validationResult.data

    // Check subscription exists
    const { data: subscription } = await supabase
      .from('agency_subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('agency_id', userData.organization_id)
      .single()

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription to cancel' },
        { status: 400 }
      )
    }

    if (subscription.status === 'canceled') {
      return NextResponse.json(
        { error: 'Subscription is already canceled' },
        { status: 400 }
      )
    }

    // Log cancellation reason if provided
    if (reason) {
      await supabase.from('interactions').insert({
        user_id: user.id,
        agency_id: userData.organization_id,
        entity_type: 'organization',
        entity_id: userData.organization_id,
        type: 'subscription_cancellation',
        content: reason,
        occurred_at: new Date().toISOString(),
      })
    }

    // Cancel subscription
    await cancelSubscription(userData.organization_id, immediately)

    // Get updated subscription
    const { data: updatedSub } = await supabase
      .from('agency_subscriptions')
      .select('canceled_at, cancel_at_period_end, current_period_end')
      .eq('agency_id', userData.organization_id)
      .single()

    return NextResponse.json({
      success: true,
      message: immediately
        ? 'Subscription canceled immediately'
        : 'Subscription will be canceled at the end of the billing period',
      canceled_at: updatedSub?.canceled_at,
      cancel_at_period_end: updatedSub?.cancel_at_period_end,
      current_period_end: updatedSub?.current_period_end,
    })
  } catch (error) {
    console.error('Cancel subscription API error:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to cancel subscription'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
