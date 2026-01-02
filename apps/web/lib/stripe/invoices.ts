import Stripe from 'stripe'
import { stripe } from './client'
import { createClient } from '@/lib/supabase/server'

type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'void' | 'uncollectible'

/**
 * Map Stripe invoice status to our status
 */
function mapStripeInvoiceStatus(status: string | null): InvoiceStatus {
  switch (status) {
    case 'draft':
      return 'draft'
    case 'open':
      return 'pending'
    case 'paid':
      return 'paid'
    case 'void':
      return 'void'
    case 'uncollectible':
      return 'uncollectible'
    default:
      return 'pending'
  }
}

/**
 * Generate a unique invoice number
 */
async function generateInvoiceNumber(): Promise<string> {
  const supabase = await createClient()

  const { data } = await supabase.rpc('generate_invoice_number')

  return data || `INV-${Date.now()}`
}

/**
 * Sync an invoice from Stripe to our database
 */
export async function syncInvoiceFromStripe(
  stripeInvoiceId: string
): Promise<void> {
  const supabase = await createClient()

  const stripeInvoiceRaw = await stripe.invoices.retrieve(stripeInvoiceId, {
    expand: ['lines.data'],
  })

  // Cast to extended type to access all invoice properties
  type InvoiceWithAllProps = Stripe.Invoice & {
    tax?: number | null
    total_tax_amounts?: Array<{ amount: number }>
    due_date?: number | null
    invoice_pdf?: string | null
    customer_name?: string | null
    customer_email?: string | null
  }
  const stripeInvoice = stripeInvoiceRaw as InvoiceWithAllProps

  // Get agency ID from customer metadata
  let agencyId: string | undefined

  if (stripeInvoice.customer) {
    const customerId = typeof stripeInvoice.customer === 'string'
      ? stripeInvoice.customer
      : stripeInvoice.customer.id
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
    if (!('deleted' in customer)) {
      agencyId = customer.metadata?.agency_id
    }
  }

  if (!agencyId) {
    console.error('No agency_id found for invoice:', stripeInvoiceId)
    return
  }

  // Check if invoice exists
  const { data: existingInvoice } = await supabase
    .from('invoices')
    .select('id')
    .eq('stripe_invoice_id', stripeInvoiceId)
    .single()

  const invoiceNumber =
    stripeInvoice.number || (await generateInvoiceNumber())

  // Calculate total tax from total_tax_amounts array
  const totalTax = stripeInvoice.total_tax_amounts?.reduce(
    (sum, taxAmount) => sum + taxAmount.amount,
    0
  ) || 0

  const invoiceData = {
    stripe_invoice_id: stripeInvoice.id,
    agency_id: agencyId,
    invoice_number: invoiceNumber,
    status: mapStripeInvoiceStatus(stripeInvoice.status),
    subtotal: stripeInvoice.subtotal,
    tax_amount: totalTax,
    total: stripeInvoice.total,
    amount_paid: stripeInvoice.amount_paid,
    amount_due: stripeInvoice.amount_due,
    currency: stripeInvoice.currency.toUpperCase(),
    period_start: stripeInvoice.period_start
      ? new Date(stripeInvoice.period_start * 1000).toISOString()
      : null,
    period_end: stripeInvoice.period_end
      ? new Date(stripeInvoice.period_end * 1000).toISOString()
      : null,
    issued_at: new Date(stripeInvoice.created * 1000).toISOString(),
    due_at: stripeInvoice.due_date
      ? new Date(stripeInvoice.due_date * 1000).toISOString()
      : null,
    paid_at:
      stripeInvoice.status === 'paid' ? new Date().toISOString() : null,
    hosted_invoice_url: stripeInvoice.hosted_invoice_url,
    invoice_pdf_url: stripeInvoice.invoice_pdf,
    billing_name: stripeInvoice.customer_name,
    billing_email: stripeInvoice.customer_email,
  }

  let invoiceId: string

  if (existingInvoice) {
    // Update existing invoice
    await supabase
      .from('invoices')
      .update(invoiceData)
      .eq('id', existingInvoice.id)

    invoiceId = existingInvoice.id
  } else {
    // Insert new invoice
    const { data: newInvoice } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select('id')
      .single()

    if (!newInvoice) {
      console.error('Failed to create invoice')
      return
    }

    invoiceId = newInvoice.id
  }

  // Sync line items
  if (stripeInvoice.lines?.data) {
    // Delete existing line items for this invoice
    await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId)

    // Insert new line items
    type LineItemWithAllProps = Stripe.InvoiceLineItem & {
      unit_amount_excluding_tax?: string | null
    }
    for (const lineRaw of stripeInvoice.lines.data) {
      const line = lineRaw as LineItemWithAllProps
      await supabase.from('invoice_items').insert({
        invoice_id: invoiceId,
        description: line.description || 'Subscription',
        item_type: 'subscription',
        quantity: line.quantity || 1,
        unit_amount: line.unit_amount_excluding_tax
          ? parseInt(line.unit_amount_excluding_tax)
          : line.amount,
        amount: line.amount,
        currency: line.currency.toUpperCase(),
        period_start: line.period?.start
          ? new Date(line.period.start * 1000).toISOString()
          : null,
        period_end: line.period?.end
          ? new Date(line.period.end * 1000).toISOString()
          : null,
      })
    }
  }
}

/**
 * Get invoices for an agency
 */
export async function getInvoices(
  agencyId: string,
  options?: {
    status?: InvoiceStatus
    limit?: number
    offset?: number
  }
) {
  const supabase = await createClient()

  let query = supabase
    .from('invoices')
    .select('*, items:invoice_items(*)')
    .eq('agency_id', agencyId)
    .order('issued_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching invoices:', error)
    throw error
  }

  return data
}

/**
 * Get a single invoice by ID
 */
export async function getInvoice(invoiceId: string, agencyId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invoices')
    .select('*, items:invoice_items(*)')
    .eq('id', invoiceId)
    .eq('agency_id', agencyId)
    .single()

  if (error) {
    console.error('Error fetching invoice:', error)
    throw error
  }

  return data
}

/**
 * Send an invoice to the customer via Stripe
 */
export async function sendInvoice(stripeInvoiceId: string): Promise<void> {
  await stripe.invoices.sendInvoice(stripeInvoiceId)
}

/**
 * Mark an invoice as void
 */
export async function voidInvoice(invoiceId: string): Promise<void> {
  const supabase = await createClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('stripe_invoice_id')
    .eq('id', invoiceId)
    .single()

  if (invoice?.stripe_invoice_id) {
    await stripe.invoices.voidInvoice(invoice.stripe_invoice_id)
  }

  await supabase.from('invoices').update({ status: 'void' }).eq('id', invoiceId)
}

/**
 * Handle invoice payment succeeded (from webhook)
 */
export async function handleInvoicePaid(stripeInvoiceId: string): Promise<void> {
  const supabase = await createClient()

  type InvoiceWithPaymentIntent = Stripe.Invoice & {
    payment_intent?: string | Stripe.PaymentIntent | null
  }
  const stripeInvoice = await stripe.invoices.retrieve(stripeInvoiceId) as InvoiceWithPaymentIntent

  await supabase
    .from('invoices')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      amount_paid: stripeInvoice.amount_paid,
      amount_due: stripeInvoice.amount_due,
    })
    .eq('stripe_invoice_id', stripeInvoiceId)

  // Record payment if there's a payment intent
  if (stripeInvoice.payment_intent) {
    const paymentIntentId = typeof stripeInvoice.payment_intent === 'string'
      ? stripeInvoice.payment_intent
      : stripeInvoice.payment_intent.id
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId) as Stripe.PaymentIntent

    const { data: invoice } = await supabase
      .from('invoices')
      .select('id, agency_id')
      .eq('stripe_invoice_id', stripeInvoiceId)
      .single()

    if (invoice) {
      await supabase.from('payments').insert({
        agency_id: invoice.agency_id,
        invoice_id: invoice.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase(),
        status: 'succeeded',
        payment_method: paymentIntent.payment_method_types?.[0] || 'card',
        stripe_payment_intent_id: paymentIntent.id,
        succeeded_at: new Date().toISOString(),
      })
    }
  }
}

/**
 * Handle invoice payment failed (from webhook)
 */
export async function handleInvoicePaymentFailed(
  stripeInvoiceId: string
): Promise<void> {
  const supabase = await createClient()

  await supabase
    .from('invoices')
    .update({
      status: 'pending', // or 'past_due' depending on your logic
    })
    .eq('stripe_invoice_id', stripeInvoiceId)
}
