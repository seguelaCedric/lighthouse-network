import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe/checkout'
import { subscribeSchema } from '@/lib/validations/billing'

/**
 * POST /api/billing/subscribe
 * Creates a Stripe Checkout session for subscription
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
    const validationResult = subscribeSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { plan_slug, billing_cycle, success_url, cancel_url } =
      validationResult.data

    // Verify plan exists and is available
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', plan_slug)
      .eq('is_active', true)
      .single()

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Check if plan has Stripe price configured
    const priceId =
      billing_cycle === 'yearly'
        ? plan.stripe_price_id_yearly
        : plan.stripe_price_id_monthly

    if (!priceId && plan.price_monthly > 0) {
      return NextResponse.json(
        { error: 'Plan is not available for purchase' },
        { status: 400 }
      )
    }

    // For free plan, just create subscription directly
    if (plan.slug === 'free') {
      await supabase.from('agency_subscriptions').upsert({
        agency_id: userData.organization_id,
        plan_id: plan.id,
        billing_cycle: billing_cycle,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: null, // Free plan doesn't expire
      })

      return NextResponse.json({
        success: true,
        message: 'Switched to free plan',
      })
    }

    // Create checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const checkoutUrl = await createCheckoutSession(
      userData.organization_id,
      plan_slug,
      billing_cycle,
      success_url || `${baseUrl}/settings/billing?success=true`,
      cancel_url || `${baseUrl}/settings/billing?canceled=true`
    )

    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    console.error('Subscribe API error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
