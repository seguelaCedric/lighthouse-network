/**
 * Monthly Invoice Job
 *
 * Background job to invoice pending placement fees monthly.
 * Can be triggered via:
 * - Vercel cron job
 * - Manual admin action
 * - External scheduler (e.g., Inngest, QStash)
 */

import { createClient } from '@/lib/supabase/server'
import { invoicePendingFees, getPendingFees } from '@/lib/stripe/placement-fees'

interface InvoiceResult {
  agencyId: string
  agencyName: string
  invoiceId: string | null
  feesCount: number
  totalAmount: number
  success: boolean
  error?: string
}

interface JobResult {
  success: boolean
  processedAt: string
  agenciesProcessed: number
  invoicesCreated: number
  totalAmount: number
  results: InvoiceResult[]
  errors: string[]
}

/**
 * Invoice all pending placement fees across all agencies
 * Typically run at the end of each month
 */
export async function invoiceAllPendingFees(): Promise<JobResult> {
  const supabase = await createClient()
  const results: InvoiceResult[] = []
  const errors: string[] = []
  let totalAmount = 0
  let invoicesCreated = 0

  try {
    // Get all agencies with pending fees
    const { data: agenciesWithFees, error: queryError } = await supabase
      .from('placement_fees')
      .select('agency_id, organizations!placement_fees_agency_id_fkey(id, name)')
      .eq('status', 'pending')
      .not('agency_id', 'is', null)

    if (queryError) {
      throw new Error(`Failed to query pending fees: ${queryError.message}`)
    }

    // Get unique agency IDs
    const uniqueAgencies = new Map<string, string>()
    for (const fee of agenciesWithFees || []) {
      if (fee.agency_id && !uniqueAgencies.has(fee.agency_id)) {
        const org = fee.organizations as unknown as { id: string; name: string } | null
        uniqueAgencies.set(fee.agency_id, org?.name || 'Unknown Agency')
      }
    }

    // Process each agency
    for (const [agencyId, agencyName] of uniqueAgencies) {
      try {
        // Get pending fees for this agency
        const pendingFees = await getPendingFees(agencyId)

        if (pendingFees.length === 0) {
          results.push({
            agencyId,
            agencyName,
            invoiceId: null,
            feesCount: 0,
            totalAmount: 0,
            success: true,
          })
          continue
        }

        // Calculate total
        const feeTotal = pendingFees.reduce((sum, f) => sum + f.platform_fee, 0)

        // Create invoice
        const invoiceResult = await invoicePendingFees(agencyId)

        if (invoiceResult) {
          results.push({
            agencyId,
            agencyName,
            invoiceId: invoiceResult.invoiceId,
            feesCount: pendingFees.length,
            totalAmount: invoiceResult.total,
            success: true,
          })
          totalAmount += invoiceResult.total
          invoicesCreated++
        } else {
          results.push({
            agencyId,
            agencyName,
            invoiceId: null,
            feesCount: pendingFees.length,
            totalAmount: feeTotal,
            success: false,
            error: 'No invoice created',
          })
        }
      } catch (agencyError) {
        const errorMsg =
          agencyError instanceof Error ? agencyError.message : 'Unknown error'
        errors.push(`Agency ${agencyId}: ${errorMsg}`)
        results.push({
          agencyId,
          agencyName,
          invoiceId: null,
          feesCount: 0,
          totalAmount: 0,
          success: false,
          error: errorMsg,
        })
      }
    }

    return {
      success: errors.length === 0,
      processedAt: new Date().toISOString(),
      agenciesProcessed: uniqueAgencies.size,
      invoicesCreated,
      totalAmount,
      results,
      errors,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      processedAt: new Date().toISOString(),
      agenciesProcessed: 0,
      invoicesCreated: 0,
      totalAmount: 0,
      results,
      errors: [errorMsg],
    }
  }
}

/**
 * Invoice pending fees for a single agency
 * Can be triggered manually by admin
 */
export async function invoiceAgencyFees(agencyId: string): Promise<InvoiceResult> {
  const supabase = await createClient()

  try {
    // Get agency name
    const { data: agency } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', agencyId)
      .single()

    const agencyName = agency?.name || 'Unknown Agency'

    // Get pending fees
    const pendingFees = await getPendingFees(agencyId)

    if (pendingFees.length === 0) {
      return {
        agencyId,
        agencyName,
        invoiceId: null,
        feesCount: 0,
        totalAmount: 0,
        success: true,
        error: 'No pending fees to invoice',
      }
    }

    // Create invoice
    const invoiceResult = await invoicePendingFees(agencyId)

    if (invoiceResult) {
      return {
        agencyId,
        agencyName,
        invoiceId: invoiceResult.invoiceId,
        feesCount: pendingFees.length,
        totalAmount: invoiceResult.total,
        success: true,
      }
    }

    return {
      agencyId,
      agencyName,
      invoiceId: null,
      feesCount: pendingFees.length,
      totalAmount: pendingFees.reduce((sum, f) => sum + f.platform_fee, 0),
      success: false,
      error: 'Failed to create invoice',
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return {
      agencyId,
      agencyName: 'Unknown',
      invoiceId: null,
      feesCount: 0,
      totalAmount: 0,
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Get summary of pending fees across all agencies
 * Useful for admin dashboard
 */
export async function getPendingFeesSummary() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('placement_fees')
    .select(
      `
      agency_id,
      platform_fee,
      placement_date,
      organizations!placement_fees_agency_id_fkey(name)
    `
    )
    .eq('status', 'pending')
    .order('placement_date', { ascending: false })

  if (error) {
    throw new Error(`Failed to get pending fees summary: ${error.message}`)
  }

  // Group by agency
  const byAgency = new Map<
    string,
    {
      agencyId: string
      agencyName: string
      feesCount: number
      totalAmount: number
      oldestFee: string
    }
  >()

  for (const fee of data || []) {
    const existing = byAgency.get(fee.agency_id)
    const org = fee.organizations as unknown as { name: string } | null

    if (existing) {
      existing.feesCount++
      existing.totalAmount += fee.platform_fee
      if (fee.placement_date < existing.oldestFee) {
        existing.oldestFee = fee.placement_date
      }
    } else {
      byAgency.set(fee.agency_id, {
        agencyId: fee.agency_id,
        agencyName: org?.name || 'Unknown Agency',
        feesCount: 1,
        totalAmount: fee.platform_fee,
        oldestFee: fee.placement_date,
      })
    }
  }

  const agencies = Array.from(byAgency.values()).sort(
    (a, b) => b.totalAmount - a.totalAmount
  )

  return {
    totalAgencies: agencies.length,
    totalFees: data?.length || 0,
    totalAmount: agencies.reduce((sum, a) => sum + a.totalAmount, 0),
    agencies,
  }
}
