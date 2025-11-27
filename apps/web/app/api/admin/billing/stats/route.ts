import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { billingStatsQuerySchema } from '@/lib/validations/billing'

/**
 * GET /api/admin/billing/stats
 * Billing statistics for admin dashboard (admin only)
 * Returns MRR, ARR, revenue by plan, churn indicators
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
    const validationResult = billingStatsQuerySchema.safeParse({
      start_date: searchParams.get('start_date'),
      end_date: searchParams.get('end_date'),
    })

    // Get all active subscriptions with plan details
    const { data: subscriptions } = await supabase
      .from('agency_subscriptions')
      .select(
        `
        id,
        agency_id,
        billing_cycle,
        status,
        cancel_at_period_end,
        plan:subscription_plans(
          id,
          name,
          slug,
          price_monthly,
          price_yearly
        )
      `
      )
      .in('status', ['active', 'trialing', 'past_due'])

    // Calculate MRR
    let mrr = 0
    const revenueByPlan: Record<string, { count: number; mrr: number }> = {}

    for (const sub of subscriptions || []) {
      // Handle plan as single object (Supabase returns array for joins)
      const plan = Array.isArray(sub.plan) ? sub.plan[0] : sub.plan
      if (!plan) continue

      const monthlyAmount =
        sub.billing_cycle === 'yearly'
          ? Math.round((plan.price_yearly || 0) / 12)
          : (plan.price_monthly || 0)

      // Don't count subscriptions scheduled to cancel
      if (!sub.cancel_at_period_end) {
        mrr += monthlyAmount
      }

      const planKey = plan.slug || 'unknown'
      if (!revenueByPlan[planKey]) {
        revenueByPlan[planKey] = { count: 0, mrr: 0 }
      }
      revenueByPlan[planKey].count++
      if (!sub.cancel_at_period_end) {
        revenueByPlan[planKey].mrr += monthlyAmount
      }
    }

    // Get subscription counts by status
    const { data: statusCounts } = await supabase
      .from('agency_subscriptions')
      .select('status')

    const subscriptionsByStatus: Record<string, number> = {}
    for (const sub of statusCounts || []) {
      subscriptionsByStatus[sub.status] =
        (subscriptionsByStatus[sub.status] || 0) + 1
    }

    // Get subscriptions set to cancel (churn indicator)
    const { count: pendingCancellations } = await supabase
      .from('agency_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('cancel_at_period_end', true)

    // Get recently canceled subscriptions (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: recentCancellations } = await supabase
      .from('agency_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'canceled')
      .gte('canceled_at', thirtyDaysAgo.toISOString())

    // Get invoice stats for current month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: monthlyInvoices } = await supabase
      .from('invoices')
      .select('total, status')
      .gte('issued_at', startOfMonth.toISOString())

    let invoicedThisMonth = 0
    let collectedThisMonth = 0

    for (const inv of monthlyInvoices || []) {
      invoicedThisMonth += inv.total
      if (inv.status === 'paid') {
        collectedThisMonth += inv.total
      }
    }

    // Get placement fee stats
    const { data: placementFeeStats } = await supabase
      .from('placement_fees')
      .select('platform_fee, status')

    let pendingFees = 0
    let collectedFees = 0

    for (const fee of placementFeeStats || []) {
      if (fee.status === 'pending') {
        pendingFees += fee.platform_fee
      } else if (fee.status === 'paid') {
        collectedFees += fee.platform_fee
      }
    }

    // Calculate ARR
    const arr = mrr * 12

    return NextResponse.json({
      mrr, // Monthly Recurring Revenue (in cents)
      arr, // Annual Recurring Revenue (in cents)

      subscriptions: {
        total: subscriptions?.length || 0,
        by_status: subscriptionsByStatus,
        pending_cancellations: pendingCancellations || 0,
        recent_cancellations: recentCancellations || 0,
      },

      revenue_by_plan: revenueByPlan,

      invoices: {
        invoiced_this_month: invoicedThisMonth,
        collected_this_month: collectedThisMonth,
      },

      placement_fees: {
        pending: pendingFees,
        collected: collectedFees,
      },

      // Formatted for display
      formatted: {
        mrr: formatCurrency(mrr),
        arr: formatCurrency(arr),
        invoiced_this_month: formatCurrency(invoicedThisMonth),
        collected_this_month: formatCurrency(collectedThisMonth),
        pending_fees: formatCurrency(pendingFees),
        collected_fees: formatCurrency(collectedFees),
      },
    })
  } catch (error) {
    console.error('Billing stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}
