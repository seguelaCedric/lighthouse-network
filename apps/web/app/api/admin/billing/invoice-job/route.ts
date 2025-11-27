import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  invoiceAllPendingFees,
  invoiceAgencyFees,
  getPendingFeesSummary,
} from '@/lib/billing/monthly-invoice-job'

/**
 * GET /api/admin/billing/invoice-job
 * Get summary of pending fees ready to be invoiced
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single()

    if (!userData || !['owner', 'admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const summary = await getPendingFeesSummary()

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Invoice job GET error:', error)
    return NextResponse.json(
      { error: 'Failed to get pending fees summary' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/billing/invoice-job
 * Trigger invoice generation
 *
 * Body options:
 * - { all: true } - Invoice all agencies with pending fees
 * - { agency_id: "uuid" } - Invoice specific agency
 *
 * Can also be triggered by Vercel cron with CRON_SECRET header
 */
export async function POST(request: NextRequest) {
  try {
    // Check for cron secret (for automated runs)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    let isAuthorized = false

    // Check cron secret first
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      isAuthorized = true
    }

    // Otherwise check admin auth
    if (!isAuthorized) {
      const supabase = await createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', user.id)
        .single()

      if (!userData || !['owner', 'admin'].includes(userData.role)) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }

      isAuthorized = true
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    let body: { all?: boolean; agency_id?: string } = { all: true }
    try {
      body = await request.json()
    } catch {
      // Default to all if no body
    }

    // Process invoices
    if (body.agency_id) {
      // Invoice single agency
      const result = await invoiceAgencyFees(body.agency_id)
      return NextResponse.json(result)
    } else {
      // Invoice all agencies
      const result = await invoiceAllPendingFees()
      return NextResponse.json(result)
    }
  } catch (error) {
    console.error('Invoice job POST error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to process invoices', details: message },
      { status: 500 }
    )
  }
}
