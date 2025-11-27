import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getInvoice } from '@/lib/stripe/invoices'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/billing/invoices/[id]
 * Returns single invoice with line items
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
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

    // Get invoice (getInvoice already checks agency ownership)
    const invoice = await getInvoice(id, userData.organization_id)

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error('Invoice detail API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}
