import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/billing/plans
 * Public endpoint - returns all active, public subscription plans
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .eq('is_public', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching plans:', error)
      return NextResponse.json(
        { error: 'Failed to fetch plans' },
        { status: 500 }
      )
    }

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Plans API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
