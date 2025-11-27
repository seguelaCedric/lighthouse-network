import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSubscription } from '@/lib/stripe/subscriptions'

/**
 * GET /api/billing/subscription
 * Returns current agency's subscription with plan details and usage
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
      .select('organization_id, role')
      .eq('auth_id', user.id)
      .single()

    if (!userData?.organization_id) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      )
    }

    const agencyId = userData.organization_id

    // Get subscription with plan
    const subscription = await getSubscription(agencyId)

    // Get usage stats
    const [candidatesResult, jobsResult, usersResult, placementsResult] =
      await Promise.all([
        // Count candidates for this agency
        supabase
          .from('candidate_agency_relationships')
          .select('id', { count: 'exact', head: true })
          .eq('agency_id', agencyId),

        // Count active jobs
        supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .eq('created_by_agency_id', agencyId)
          .in('status', ['open', 'shortlisting', 'interviewing']),

        // Count team members
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', agencyId)
          .eq('is_active', true),

        // Count placements this month
        supabase
          .from('placements')
          .select('id', { count: 'exact', head: true })
          .eq('placing_agency_id', agencyId)
          .gte(
            'created_at',
            new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            ).toISOString()
          ),
      ])

    const usage = {
      candidates: {
        used: candidatesResult.count || 0,
        limit: subscription?.plan?.max_candidates || null,
      },
      active_jobs: {
        used: jobsResult.count || 0,
        limit: subscription?.plan?.max_active_jobs || null,
      },
      team_members: {
        used: usersResult.count || 0,
        limit: subscription?.plan?.max_team_members || null,
      },
      placements_this_month: {
        used: placementsResult.count || 0,
        limit: subscription?.plan?.max_placements_per_month || null,
      },
    }

    // If no subscription exists, return free plan info
    if (!subscription) {
      const { data: freePlan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('slug', 'free')
        .single()

      return NextResponse.json({
        subscription: null,
        plan: freePlan,
        usage,
        is_on_free_plan: true,
      })
    }

    return NextResponse.json({
      subscription,
      plan: subscription.plan,
      usage,
      is_on_free_plan: subscription.plan?.slug === 'free',
    })
  } catch (error) {
    console.error('Subscription API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
