import { createClient } from '@/lib/supabase/server'

interface PlacementFee {
  id: string
  placement_id: string
  agency_id: string
  invoice_id: string | null
  placement_value: number
  fee_percent: number
  platform_fee: number
  currency: string
  status: 'pending' | 'invoiced' | 'paid' | 'waived'
  placement_date: string
  invoiced_at: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
}

/**
 * Create a placement fee record when a placement is confirmed
 */
export async function createPlacementFee(
  placementId: string,
  agencyId: string,
  placementValue: number // in cents
): Promise<PlacementFee | null> {
  const supabase = await createClient()

  // Get agency's plan to determine fee percentage
  const { data: subscription } = await supabase
    .from('agency_subscriptions')
    .select('plan:subscription_plans(placement_fee_percent)')
    .eq('agency_id', agencyId)
    .single()

  // Default to 15% if no subscription (free tier)
  const feePercent =
    (subscription?.plan as { placement_fee_percent?: number })
      ?.placement_fee_percent || 15.0
  const platformFee = Math.round(placementValue * (feePercent / 100))

  const { data: fee, error } = await supabase
    .from('placement_fees')
    .insert({
      placement_id: placementId,
      agency_id: agencyId,
      placement_value: placementValue,
      fee_percent: feePercent,
      platform_fee: platformFee,
      status: 'pending',
      placement_date: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating placement fee:', error)
    throw error
  }

  return fee
}

/**
 * Get pending placement fees for an agency
 */
export async function getPendingFees(agencyId: string): Promise<PlacementFee[]> {
  const supabase = await createClient()

  const { data: fees, error } = await supabase
    .from('placement_fees')
    .select('*')
    .eq('agency_id', agencyId)
    .eq('status', 'pending')
    .order('placement_date', { ascending: false })

  if (error) {
    console.error('Error fetching pending fees:', error)
    throw error
  }

  return fees || []
}

/**
 * Get all placement fees for an agency
 */
export async function getPlacementFees(
  agencyId: string,
  options?: {
    status?: 'pending' | 'invoiced' | 'paid' | 'waived'
    limit?: number
    offset?: number
  }
) {
  const supabase = await createClient()

  let query = supabase
    .from('placement_fees')
    .select('*')
    .eq('agency_id', agencyId)
    .order('placement_date', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(
      options.offset,
      options.offset + (options.limit || 10) - 1
    )
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching placement fees:', error)
    throw error
  }

  return data
}

interface InvoiceOptions {
  feeIds?: string[] // Specific fees to include (if not provided, all pending fees)
  dueDays?: number // Days until due (default: 30)
  notes?: string // Internal notes
}

/**
 * Create an invoice for pending placement fees
 * @param agencyId - The agency to invoice
 * @param options - Optional invoice configuration
 */
export async function invoicePendingFees(
  agencyId: string,
  options?: InvoiceOptions
): Promise<{ invoiceId: string; total: number } | null> {
  const supabase = await createClient()

  // Get pending fees - either specific ones or all
  let query = supabase
    .from('placement_fees')
    .select('*')
    .eq('agency_id', agencyId)
    .eq('status', 'pending')

  if (options?.feeIds && options.feeIds.length > 0) {
    query = query.in('id', options.feeIds)
  }

  const { data: fees, error: feesError } = await query

  if (feesError) {
    console.error('Error fetching pending fees:', feesError)
    throw feesError
  }

  if (!fees || fees.length === 0) {
    return null
  }

  const totalFee = fees.reduce((sum, f) => sum + f.platform_fee, 0)
  const dueDays = options?.dueDays || 30

  // Generate invoice number
  const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number')

  // Get billing info
  const { data: agency } = await supabase
    .from('organizations')
    .select('name, billing_email, billing_name, billing_address')
    .eq('id', agencyId)
    .single()

  // Create invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      agency_id: agencyId,
      invoice_number: invoiceNumber || `INV-${Date.now()}`,
      status: 'pending',
      subtotal: totalFee,
      total: totalFee,
      amount_due: totalFee,
      currency: 'EUR',
      period_start: fees[fees.length - 1].placement_date,
      period_end: new Date().toISOString(),
      issued_at: new Date().toISOString(),
      due_at: new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString(),
      billing_name: agency?.billing_name || agency?.name,
      billing_email: agency?.billing_email,
      billing_address: agency?.billing_address,
      notes: options?.notes,
    })
    .select()
    .single()

  if (invoiceError || !invoice) {
    console.error('Error creating invoice:', invoiceError)
    throw invoiceError || new Error('Failed to create invoice')
  }

  // Create line items and link fees
  for (const fee of fees) {
    // Create line item
    await supabase.from('invoice_items').insert({
      invoice_id: invoice.id,
      description: `Platform fee for placement #${fee.placement_id.slice(0, 8)}`,
      item_type: 'placement_fee',
      quantity: 1,
      unit_amount: fee.platform_fee,
      amount: fee.platform_fee,
      currency: 'EUR',
      placement_id: fee.placement_id,
    })

    // Update fee status
    await supabase
      .from('placement_fees')
      .update({
        invoice_id: invoice.id,
        status: 'invoiced',
        invoiced_at: new Date().toISOString(),
      })
      .eq('id', fee.id)
  }

  return {
    invoiceId: invoice.id,
    total: totalFee,
  }
}

/**
 * Waive a placement fee (admin action)
 */
export async function waivePlacementFee(
  feeId: string,
  reason?: string
): Promise<void> {
  const supabase = await createClient()

  await supabase
    .from('placement_fees')
    .update({
      status: 'waived',
      notes: reason || 'Fee waived by admin',
    })
    .eq('id', feeId)
}

/**
 * Get placement fee summary for an agency
 */
export async function getFeeSummary(agencyId: string) {
  const supabase = await createClient()

  const { data: fees, error } = await supabase
    .from('placement_fees')
    .select('status, platform_fee')
    .eq('agency_id', agencyId)

  if (error) {
    console.error('Error fetching fee summary:', error)
    throw error
  }

  const summary = {
    pending: 0,
    invoiced: 0,
    paid: 0,
    waived: 0,
    total: 0,
  }

  for (const fee of fees || []) {
    summary[fee.status as keyof typeof summary] += fee.platform_fee
    if (fee.status !== 'waived') {
      summary.total += fee.platform_fee
    }
  }

  return summary
}
