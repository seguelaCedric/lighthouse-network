import Stripe from 'stripe'
import { stripe } from './client'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateStripeCustomer } from './customers'

type BillingCycle = 'monthly' | 'yearly'

// Extended Stripe Subscription type to include all properties used
type StripeSubscription = Stripe.Subscription & {
  current_period_start: number
  current_period_end: number
  canceled_at?: number | null
}

interface CreateSubscriptionResult {
  subscriptionId: string
  clientSecret: string | null
}

/**
 * Create a new subscription for an agency
 */
export async function createSubscription(
  agencyId: string,
  planSlug: string,
  billingCycle: BillingCycle
): Promise<CreateSubscriptionResult> {
  const supabase = await createClient()

  // Get plan
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('slug', planSlug)
    .single()

  if (!plan) {
    throw new Error('Plan not found')
  }

  const priceId =
    billingCycle === 'yearly'
      ? plan.stripe_price_id_yearly
      : plan.stripe_price_id_monthly

  if (!priceId) {
    throw new Error('Stripe price not configured for this plan')
  }

  // Get or create customer
  const customerId = await getOrCreateStripeCustomer(agencyId)

  // Create subscription
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription',
    },
    expand: ['latest_invoice.payment_intent'],
    metadata: {
      agency_id: agencyId,
      plan_slug: planSlug,
    },
  }) as unknown as StripeSubscription

  // Save subscription to database
  await supabase.from('agency_subscriptions').upsert({
    agency_id: agencyId,
    plan_id: plan.id,
    billing_cycle: billingCycle,
    status: 'active',
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    current_period_start: new Date(
      subscription.current_period_start * 1000
    ).toISOString(),
    current_period_end: new Date(
      subscription.current_period_end * 1000
    ).toISOString(),
  })

  type InvoiceWithPaymentIntent = Stripe.Invoice & {
    payment_intent?: string | Stripe.PaymentIntent | null
  }
  const invoice = subscription.latest_invoice as InvoiceWithPaymentIntent
  const paymentIntent = typeof invoice.payment_intent === 'object'
    ? invoice.payment_intent
    : null

  return {
    subscriptionId: subscription.id,
    clientSecret: paymentIntent?.client_secret || null,
  }
}

/**
 * Cancel a subscription (at period end or immediately)
 */
export async function cancelSubscription(
  agencyId: string,
  cancelImmediately = false
): Promise<void> {
  const supabase = await createClient()

  const { data: sub } = await supabase
    .from('agency_subscriptions')
    .select('stripe_subscription_id')
    .eq('agency_id', agencyId)
    .single()

  if (!sub?.stripe_subscription_id) {
    throw new Error('No subscription found')
  }

  if (cancelImmediately) {
    await stripe.subscriptions.cancel(sub.stripe_subscription_id)

    await supabase
      .from('agency_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
      })
      .eq('agency_id', agencyId)
  } else {
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    await supabase
      .from('agency_subscriptions')
      .update({
        cancel_at_period_end: true,
      })
      .eq('agency_id', agencyId)
  }
}

/**
 * Resume a subscription that was set to cancel at period end
 */
export async function resumeSubscription(agencyId: string): Promise<void> {
  const supabase = await createClient()

  const { data: sub } = await supabase
    .from('agency_subscriptions')
    .select('stripe_subscription_id')
    .eq('agency_id', agencyId)
    .single()

  if (!sub?.stripe_subscription_id) {
    throw new Error('No subscription found')
  }

  await stripe.subscriptions.update(sub.stripe_subscription_id, {
    cancel_at_period_end: false,
  })

  await supabase
    .from('agency_subscriptions')
    .update({
      cancel_at_period_end: false,
    })
    .eq('agency_id', agencyId)
}

/**
 * Update subscription to a different plan
 */
export async function updateSubscription(
  agencyId: string,
  newPlanSlug: string,
  billingCycle: BillingCycle
): Promise<void> {
  const supabase = await createClient()

  // Get current subscription
  const { data: sub } = await supabase
    .from('agency_subscriptions')
    .select('stripe_subscription_id')
    .eq('agency_id', agencyId)
    .single()

  if (!sub?.stripe_subscription_id) {
    throw new Error('No subscription found')
  }

  // Get new plan
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('slug', newPlanSlug)
    .single()

  if (!plan) {
    throw new Error('Plan not found')
  }

  const priceId =
    billingCycle === 'yearly'
      ? plan.stripe_price_id_yearly
      : plan.stripe_price_id_monthly

  if (!priceId) {
    throw new Error('Stripe price not configured for this plan')
  }

  // Get current subscription from Stripe
  const currentSub = await stripe.subscriptions.retrieve(
    sub.stripe_subscription_id
  ) as unknown as StripeSubscription

  // Update subscription
  await stripe.subscriptions.update(sub.stripe_subscription_id, {
    items: [
      {
        id: currentSub.items.data[0].id,
        price: priceId,
      },
    ],
    proration_behavior: 'create_prorations',
  })

  // Update database
  await supabase
    .from('agency_subscriptions')
    .update({
      plan_id: plan.id,
      billing_cycle: billingCycle,
    })
    .eq('agency_id', agencyId)
}

/**
 * Get the current subscription for an agency
 */
export async function getSubscription(agencyId: string) {
  const supabase = await createClient()

  const { data: subscription } = await supabase
    .from('agency_subscriptions')
    .select(
      `
      *,
      plan:subscription_plans(*)
    `
    )
    .eq('agency_id', agencyId)
    .single()

  return subscription
}

/**
 * Sync subscription from Stripe (after webhook)
 */
export async function syncSubscriptionFromStripe(
  stripeSubscriptionId: string
): Promise<void> {
  const supabase = await createClient()

  const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId) as unknown as StripeSubscription
  const agencyId = stripeSub.metadata?.agency_id

  if (!agencyId) {
    console.error('No agency_id in subscription metadata')
    return
  }

  // Map Stripe status to our status
  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'past_due',
    trialing: 'trialing',
    incomplete: 'active',
    incomplete_expired: 'canceled',
    paused: 'active',
  }

  await supabase
    .from('agency_subscriptions')
    .update({
      status: statusMap[stripeSub.status] || 'active',
      current_period_start: new Date(
        stripeSub.current_period_start * 1000
      ).toISOString(),
      current_period_end: new Date(
        stripeSub.current_period_end * 1000
      ).toISOString(),
      cancel_at_period_end: stripeSub.cancel_at_period_end,
      canceled_at: stripeSub.canceled_at
        ? new Date(stripeSub.canceled_at * 1000).toISOString()
        : null,
    })
    .eq('stripe_subscription_id', stripeSubscriptionId)
}
