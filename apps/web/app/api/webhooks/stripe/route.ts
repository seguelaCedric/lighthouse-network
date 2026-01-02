import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import {
  syncInvoiceFromStripe,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
} from '@/lib/stripe/invoices'
import { syncSubscriptionFromStripe } from '@/lib/stripe/subscriptions'
import { handleCheckoutComplete } from '@/lib/stripe/checkout'
import { createClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

/**
 * Stripe webhook handler
 *
 * Events to enable in Stripe Dashboard:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.created
 * - invoice.updated
 * - invoice.finalized
 * - invoice.paid
 * - invoice.payment_failed
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 * - checkout.session.completed
 */
export async function POST(request: Request) {
  // Check if webhook secret is configured
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    console.error('No stripe-signature header')
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', message)
    return NextResponse.json(
      { error: `Invalid signature: ${message}` },
      { status: 400 }
    )
  }

  console.log(`Processing Stripe webhook: ${event.type}`)

  try {
    switch (event.type) {
      // ========================================
      // SUBSCRIPTION EVENTS
      // ========================================
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      // ========================================
      // INVOICE EVENTS
      // ========================================
      case 'invoice.created':
      case 'invoice.updated':
      case 'invoice.finalized':
        await syncInvoiceFromStripe((event.data.object as Stripe.Invoice).id)
        break

      case 'invoice.paid':
        await handleInvoicePaid((event.data.object as Stripe.Invoice).id)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(
          (event.data.object as Stripe.Invoice).id
        )
        await handleSubscriptionPaymentFailed(
          event.data.object as Stripe.Invoice
        )
        break

      // ========================================
      // PAYMENT EVENTS
      // ========================================
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      // ========================================
      // CHECKOUT EVENTS
      // ========================================
      case 'checkout.session.completed':
        await handleCheckoutComplete(
          (event.data.object as Stripe.Checkout.Session).id
        )
        break

      // ========================================
      // CUSTOMER EVENTS (optional)
      // ========================================
      case 'customer.updated':
        // Could sync customer data to organizations table
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Webhook handler error for ${event.type}:`, message)

    // Return 200 to acknowledge receipt even on error
    // This prevents Stripe from retrying, which could cause duplicate processing
    // In production, you might want to log this to an error tracking service
    return NextResponse.json({ received: true, error: message })
  }
}

/**
 * Handle subscription created/updated
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  // Use the dedicated sync function
  await syncSubscriptionFromStripe(subscription.id)
}

/**
 * Handle subscription deleted/canceled
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const supabase = await createClient()
  const agencyId = subscription.metadata?.agency_id

  if (!agencyId) {
    console.error('No agency_id in subscription metadata:', subscription.id)
    return
  }

  // Get free plan
  const { data: freePlan } = await supabase
    .from('subscription_plans')
    .select('id')
    .eq('slug', 'free')
    .single()

  // Downgrade to free plan
  await supabase
    .from('agency_subscriptions')
    .update({
      plan_id: freePlan?.id,
      status: 'canceled',
      stripe_subscription_id: null,
      canceled_at: new Date().toISOString(),
    })
    .eq('agency_id', agencyId)

  // TODO: Send notification to agency about subscription cancellation
  // await createNotification({
  //   type: 'subscription_canceled',
  //   organization_id: agencyId,
  //   title: 'Subscription Canceled',
  //   message: 'Your subscription has been canceled. You have been downgraded to the Free plan.',
  // })
}

/**
 * Handle invoice payment failure - update subscription status
 */
async function handleSubscriptionPaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  const supabase = await createClient()

  // Get agency ID from invoice metadata or customer
  let agencyId = (invoice as unknown as { subscription_details?: { metadata?: { agency_id?: string } } }).subscription_details?.metadata?.agency_id

  if (!agencyId && invoice.customer) {
    const customer = await stripe.customers.retrieve(invoice.customer as string)
    if ('metadata' in customer) {
      agencyId = customer.metadata?.agency_id
    }
  }

  if (!agencyId) return

  // Update subscription status to past_due
  await supabase
    .from('agency_subscriptions')
    .update({ status: 'past_due' })
    .eq('agency_id', agencyId)

  // TODO: Send notification to agency about payment failure
  // await createNotification({
  //   type: 'payment_failed',
  //   organization_id: agencyId,
  //   title: 'Payment Failed',
  //   message: 'We were unable to process your payment. Please update your payment method.',
  //   priority: 'high',
  // })
}

/**
 * Handle successful payment intent (for one-time payments not tied to invoices)
 */
async function handlePaymentSucceeded(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const supabase = await createClient()
  const agencyId = paymentIntent.metadata?.agency_id
  const invoiceId = paymentIntent.metadata?.invoice_id

  // If this payment is for an invoice, it's already handled by invoice.paid
  if (invoiceId) return

  // Record standalone payment if agency_id is present
  if (agencyId) {
    await supabase.from('payments').insert({
      agency_id: agencyId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency.toUpperCase(),
      status: 'succeeded',
      payment_method: paymentIntent.payment_method_types?.[0] || 'card',
      stripe_payment_intent_id: paymentIntent.id,
      succeeded_at: new Date().toISOString(),
    })
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentFailed(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const supabase = await createClient()
  const agencyId = paymentIntent.metadata?.agency_id

  if (!agencyId) return

  // Record failed payment
  await supabase.from('payments').insert({
    agency_id: agencyId,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency.toUpperCase(),
    status: 'failed',
    payment_method: paymentIntent.payment_method_types?.[0] || 'card',
    stripe_payment_intent_id: paymentIntent.id,
    failed_at: new Date().toISOString(),
    failure_reason:
      paymentIntent.last_payment_error?.message || 'Payment failed',
  })

  // TODO: Send notification about payment failure
}

// Disable body parsing since we need raw body for signature verification
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
