import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCustomerPortalSession } from '@/lib/stripe/customers'
import { portalSessionSchema } from '@/lib/validations/billing'

/**
 * POST /api/billing/portal
 * Creates a Stripe Customer Portal session
 * Users can manage payment methods, view invoices, and cancel subscriptions
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

    // Only owners and admins can access billing portal
    if (!['owner', 'admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Permission denied. Only owners and admins can access billing.' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const validationResult = portalSessionSchema.safeParse(body)

    const returnUrl =
      validationResult.success && validationResult.data.return_url
        ? validationResult.data.return_url
        : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/billing`

    // Create portal session
    const portalUrl = await createCustomerPortalSession(
      userData.organization_id,
      returnUrl
    )

    return NextResponse.json({ url: portalUrl })
  } catch (error) {
    console.error('Portal API error:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to create portal session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
