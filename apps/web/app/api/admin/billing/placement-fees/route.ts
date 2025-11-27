import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getPendingFees,
  getPlacementFees,
  invoicePendingFees,
} from '@/lib/stripe/placement-fees'
import {
  placementFeesQuerySchema,
  createPlacementFeeInvoiceSchema,
} from '@/lib/validations/billing'

/**
 * GET /api/admin/billing/placement-fees
 * List placement fees with filters (admin only)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin/owner
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('auth_id', user.id)
      .single()

    if (!userData || !['owner', 'admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const validationResult = placementFeesQuerySchema.safeParse({
      agency_id: searchParams.get('agency_id'),
      status: searchParams.get('status'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { agency_id, status, limit, offset } = validationResult.data

    // Build query
    let query = supabase
      .from('placement_fees')
      .select(
        `
        *,
        placement:placements(
          id,
          candidate:candidates(first_name, last_name),
          job:jobs(title),
          client:organizations!placements_client_id_fkey(name)
        ),
        agency:organizations!placement_fees_agency_id_fkey(name),
        invoice:invoices(invoice_number, status)
      `
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (agency_id) {
      query = query.eq('agency_id', agency_id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: fees, error } = await query

    if (error) {
      console.error('Error fetching placement fees:', error)
      return NextResponse.json(
        { error: 'Failed to fetch placement fees' },
        { status: 500 }
      )
    }

    // Get total count
    let countQuery = supabase
      .from('placement_fees')
      .select('id', { count: 'exact', head: true })

    if (agency_id) {
      countQuery = countQuery.eq('agency_id', agency_id)
    }

    if (status) {
      countQuery = countQuery.eq('status', status)
    }

    const { count } = await countQuery

    // Get summary stats
    const { data: stats } = await supabase.rpc('get_placement_fee_stats')

    return NextResponse.json({
      fees,
      total: count || 0,
      limit,
      offset,
      stats: stats || {
        pending_count: 0,
        pending_amount: 0,
        invoiced_count: 0,
        invoiced_amount: 0,
        paid_count: 0,
        paid_amount: 0,
      },
    })
  } catch (error) {
    console.error('Placement fees API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/billing/placement-fees
 * Create an invoice for an agency's pending placement fees (admin only)
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

    // Check if user is admin/owner
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('auth_id', user.id)
      .single()

    if (!userData || !['owner', 'admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = createPlacementFeeInvoiceSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { agency_id, fee_ids, due_days, notes } = validationResult.data

    // Verify agency exists
    const { data: agency } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', agency_id)
      .single()

    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
    }

    // Verify all fees exist and belong to this agency
    const { data: fees } = await supabase
      .from('placement_fees')
      .select('id, agency_id, status')
      .in('id', fee_ids)

    if (!fees || fees.length !== fee_ids.length) {
      return NextResponse.json(
        { error: 'One or more fees not found' },
        { status: 400 }
      )
    }

    const invalidFees = fees.filter(
      (f) => f.agency_id !== agency_id || f.status !== 'pending'
    )

    if (invalidFees.length > 0) {
      return NextResponse.json(
        {
          error:
            'Some fees do not belong to this agency or are not in pending status',
        },
        { status: 400 }
      )
    }

    // Create invoice for pending fees
    const result = await invoicePendingFees(agency_id, {
      feeIds: fee_ids,
      dueDays: due_days,
      notes,
    })

    if (!result) {
      return NextResponse.json(
        { error: 'No pending fees to invoice' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      invoice_id: result.invoiceId,
      total: result.total,
      message: `Invoice created for ${fees.length} placement fee(s)`,
    })
  } catch (error) {
    console.error('Create placement fee invoice error:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to create invoice'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
