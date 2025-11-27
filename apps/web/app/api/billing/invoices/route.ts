import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getInvoices } from '@/lib/stripe/invoices'
import { invoicesQuerySchema } from '@/lib/validations/billing'

/**
 * GET /api/billing/invoices
 * Returns agency's invoices with pagination
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

    // Get user's organization
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

    // Parse query params
    const { searchParams } = new URL(request.url)
    const validationResult = invoicesQuerySchema.safeParse({
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

    const { status, limit, offset } = validationResult.data

    // Get invoices
    const invoices = await getInvoices(userData.organization_id, {
      status,
      limit,
      offset,
    })

    // Get total count
    const { count } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', userData.organization_id)
      .then((result) => ({ count: result.count || 0 }))

    return NextResponse.json({
      invoices,
      total: count,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Invoices API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}
