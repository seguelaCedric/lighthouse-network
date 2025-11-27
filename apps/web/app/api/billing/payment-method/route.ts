import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import { getOrCreateStripeCustomer } from '@/lib/stripe/customers'
import { setupPaymentMethodSchema } from '@/lib/validations/billing'

/**
 * GET /api/billing/payment-method
 * Returns current default payment method
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('auth_id', user.id)
      .single()

    if (!userData?.organization_id) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      )
    }

    // Get subscription with Stripe customer ID
    const { data: subscription } = await supabase
      .from('agency_subscriptions')
      .select('stripe_customer_id')
      .eq('agency_id', userData.organization_id)
      .single()

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({ payment_method: null })
    }

    // Get customer from Stripe
    const customer = await stripe.customers.retrieve(
      subscription.stripe_customer_id,
      { expand: ['invoice_settings.default_payment_method'] }
    )

    if ('deleted' in customer && customer.deleted) {
      return NextResponse.json({ payment_method: null })
    }

    const defaultPm = customer.invoice_settings?.default_payment_method

    if (!defaultPm || typeof defaultPm === 'string') {
      return NextResponse.json({ payment_method: null })
    }

    // Format payment method for response
    const paymentMethod = {
      id: defaultPm.id,
      type: defaultPm.type,
      card: defaultPm.card
        ? {
            brand: defaultPm.card.brand,
            last4: defaultPm.card.last4,
            exp_month: defaultPm.card.exp_month,
            exp_year: defaultPm.card.exp_year,
          }
        : null,
      sepa_debit: defaultPm.sepa_debit
        ? {
            bank_code: defaultPm.sepa_debit.bank_code,
            last4: defaultPm.sepa_debit.last4,
            country: defaultPm.sepa_debit.country,
          }
        : null,
    }

    return NextResponse.json({ payment_method: paymentMethod })
  } catch (error) {
    console.error('Payment method GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment method' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/billing/payment-method
 * Creates a SetupIntent for adding a new payment method
 * Returns client secret for Stripe Elements
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

    // Only owners and admins can manage payment methods
    if (!['owner', 'admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Permission denied. Only owners and admins can manage payment methods.' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const validationResult = setupPaymentMethodSchema.safeParse(body)

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(userData.organization_id)

    // Create SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card', 'sepa_debit'],
      metadata: {
        agency_id: userData.organization_id,
      },
    })

    return NextResponse.json({
      client_secret: setupIntent.client_secret,
      return_url: validationResult.success
        ? validationResult.data.return_url
        : undefined,
    })
  } catch (error) {
    console.error('Payment method POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create setup intent' },
      { status: 500 }
    )
  }
}
