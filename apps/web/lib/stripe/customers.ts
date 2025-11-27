import { stripe } from './client'
import { createClient } from '@/lib/supabase/server'

interface BillingAddress {
  line1?: string
  line2?: string
  city?: string
  postal_code?: string
  country?: string
}

/**
 * Get or create a Stripe customer for an agency
 */
export async function getOrCreateStripeCustomer(agencyId: string): Promise<string> {
  const supabase = await createClient()

  // Check if agency already has Stripe customer
  const { data: agency } = await supabase
    .from('organizations')
    .select('id, name, billing_email, billing_name, billing_address')
    .eq('id', agencyId)
    .single()

  if (!agency) {
    throw new Error('Agency not found')
  }

  // Check existing subscription for stripe_customer_id
  const { data: subscription } = await supabase
    .from('agency_subscriptions')
    .select('stripe_customer_id')
    .eq('agency_id', agencyId)
    .single()

  if (subscription?.stripe_customer_id) {
    return subscription.stripe_customer_id
  }

  // Get agency owner email
  const { data: owner } = await supabase
    .from('users')
    .select('email')
    .eq('organization_id', agencyId)
    .eq('role', 'owner')
    .single()

  const billingAddress = agency.billing_address as BillingAddress | null

  // Create Stripe customer
  const customer = await stripe.customers.create({
    email: agency.billing_email || owner?.email || undefined,
    name: agency.billing_name || agency.name,
    metadata: {
      agency_id: agencyId,
    },
    address: billingAddress
      ? {
          line1: billingAddress.line1 || '',
          line2: billingAddress.line2 || undefined,
          city: billingAddress.city || undefined,
          postal_code: billingAddress.postal_code || undefined,
          country: billingAddress.country || undefined,
        }
      : undefined,
  })

  // Save customer ID to subscription record (or create one)
  const { data: existingSub } = await supabase
    .from('agency_subscriptions')
    .select('id')
    .eq('agency_id', agencyId)
    .single()

  if (existingSub) {
    await supabase
      .from('agency_subscriptions')
      .update({ stripe_customer_id: customer.id })
      .eq('agency_id', agencyId)
  } else {
    // Get free plan as default
    const { data: freePlan } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('slug', 'free')
      .single()

    await supabase.from('agency_subscriptions').insert({
      agency_id: agencyId,
      plan_id: freePlan?.id,
      stripe_customer_id: customer.id,
      status: 'active',
    })
  }

  return customer.id
}

/**
 * Update Stripe customer billing details
 */
export async function updateStripeCustomer(
  agencyId: string,
  updates: {
    email?: string
    name?: string
    address?: BillingAddress
  }
): Promise<void> {
  const supabase = await createClient()

  const { data: subscription } = await supabase
    .from('agency_subscriptions')
    .select('stripe_customer_id')
    .eq('agency_id', agencyId)
    .single()

  if (!subscription?.stripe_customer_id) {
    throw new Error('No Stripe customer found for this agency')
  }

  await stripe.customers.update(subscription.stripe_customer_id, {
    email: updates.email,
    name: updates.name,
    address: updates.address
      ? {
          line1: updates.address.line1 || '',
          line2: updates.address.line2 || undefined,
          city: updates.address.city || undefined,
          postal_code: updates.address.postal_code || undefined,
          country: updates.address.country || undefined,
        }
      : undefined,
  })
}

/**
 * Get Stripe customer portal session URL
 */
export async function createCustomerPortalSession(
  agencyId: string,
  returnUrl: string
): Promise<string> {
  const customerId = await getOrCreateStripeCustomer(agencyId)

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session.url
}
