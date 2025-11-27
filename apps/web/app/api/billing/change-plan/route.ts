import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateSubscription } from '@/lib/stripe/subscriptions'
import { changePlanSchema } from '@/lib/validations/billing'

/**
 * POST /api/billing/change-plan
 * Updates existing subscription to a different plan
 * Handles proration automatically via Stripe
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
    const body = await request.json()
    const validationResult = changePlanSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { plan_slug, billing_cycle } = validationResult.data

    // Check current subscription exists
    const { data: currentSub } = await supabase
      .from('agency_subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('agency_id', userData.organization_id)
      .single()

    if (!currentSub?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found. Please subscribe first.' },
        { status: 400 }
      )
    }

    // Verify new plan exists
    const { data: newPlan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', plan_slug)
      .eq('is_active', true)
      .single()

    if (!newPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Check if trying to switch to same plan
    if (currentSub.plan?.slug === plan_slug && currentSub.billing_cycle === billing_cycle) {
      return NextResponse.json(
        { error: 'Already on this plan with the same billing cycle' },
        { status: 400 }
      )
    }

    // For downgrade to free, cancel subscription instead
    if (newPlan.slug === 'free') {
      return NextResponse.json(
        { error: 'To downgrade to free, please cancel your subscription' },
        { status: 400 }
      )
    }

    // Update subscription via Stripe
    await updateSubscription(
      userData.organization_id,
      plan_slug,
      billing_cycle
    )

    return NextResponse.json({
      success: true,
      message: `Successfully changed to ${newPlan.name} plan`,
      new_plan: newPlan.name,
      billing_cycle,
    })
  } catch (error) {
    console.error('Change plan API error:', error)
    const message = error instanceof Error ? error.message : 'Failed to change plan'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
