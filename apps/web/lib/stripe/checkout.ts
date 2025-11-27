import { stripe } from './client'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateStripeCustomer } from './customers'

type BillingCycle = 'monthly' | 'yearly'

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  agencyId: string,
  planSlug: string,
  billingCycle: BillingCycle,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
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

  const customerId = await getOrCreateStripeCustomer(agencyId)

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      agency_id: agencyId,
      plan_slug: planSlug,
      billing_cycle: billingCycle,
    },
    subscription_data: {
      metadata: {
        agency_id: agencyId,
        plan_slug: planSlug,
      },
    },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    tax_id_collection: {
      enabled: true,
    },
  })

  if (!session.url) {
    throw new Error('Failed to create checkout session')
  }

  return session.url
}

/**
 * Create a Stripe Checkout session for one-time payment (e.g., placement fee invoice)
 */
export async function createInvoiceCheckoutSession(
  agencyId: string,
  invoiceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const supabase = await createClient()

  // Get invoice details
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('agency_id', agencyId)
    .single()

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  if (invoice.status === 'paid') {
    throw new Error('Invoice is already paid')
  }

  const customerId = await getOrCreateStripeCustomer(agencyId)

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: invoice.currency.toLowerCase(),
          product_data: {
            name: `Invoice ${invoice.invoice_number}`,
            description: `Payment for invoice ${invoice.invoice_number}`,
          },
          unit_amount: invoice.amount_due,
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      agency_id: agencyId,
      invoice_id: invoiceId,
    },
    payment_intent_data: {
      metadata: {
        agency_id: agencyId,
        invoice_id: invoiceId,
      },
    },
  })

  if (!session.url) {
    throw new Error('Failed to create checkout session')
  }

  return session.url
}

/**
 * Handle successful checkout session (called from webhook)
 */
export async function handleCheckoutComplete(
  sessionId: string
): Promise<void> {
  const supabase = await createClient()

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription', 'payment_intent'],
  })

  const agencyId = session.metadata?.agency_id
  const invoiceId = session.metadata?.invoice_id

  if (!agencyId) {
    console.error('No agency_id in checkout session metadata')
    return
  }

  // Handle subscription checkout
  if (session.mode === 'subscription' && session.subscription) {
    const subscription = session.subscription as string
    const planSlug = session.metadata?.plan_slug

    if (planSlug) {
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('slug', planSlug)
        .single()

      if (plan) {
        await supabase.from('agency_subscriptions').upsert({
          agency_id: agencyId,
          plan_id: plan.id,
          billing_cycle: session.metadata?.billing_cycle || 'monthly',
          status: 'active',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscription,
        })
      }
    }
  }

  // Handle one-time payment checkout (invoice)
  if (session.mode === 'payment' && invoiceId) {
    const paymentIntent = session.payment_intent as string

    await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: paymentIntent,
      })
      .eq('id', invoiceId)

    // Record payment
    await supabase.from('payments').insert({
      agency_id: agencyId,
      invoice_id: invoiceId,
      amount: session.amount_total || 0,
      currency: session.currency?.toUpperCase() || 'EUR',
      status: 'succeeded',
      stripe_payment_intent_id: paymentIntent,
      succeeded_at: new Date().toISOString(),
    })

    // Update placement fees linked to this invoice
    await supabase
      .from('placement_fees')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('invoice_id', invoiceId)
  }
}
