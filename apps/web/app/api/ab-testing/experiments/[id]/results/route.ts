import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { calculateExperimentStats } from '@/lib/ab-testing/statistics';
import type { ABExperimentResult } from '@/lib/ab-testing/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/ab-testing/experiments/[id]/results - Get experiment results
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  // Refresh materialized view for fresh data
  try {
    await supabase.rpc('refresh_ab_results');
  } catch (e) {
    // Ignore refresh errors - view might not need refresh
    console.warn('Could not refresh results view:', e);
  }

  // Get experiment details
  const { data: experiment, error: expError } = await supabase
    .from('ab_experiments')
    .select('minimum_sample_size')
    .eq('id', id)
    .single();

  if (expError) {
    if (expError.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }
    console.error('Error fetching experiment:', expError);
    return NextResponse.json(
      { error: 'Failed to fetch experiment' },
      { status: 500 }
    );
  }

  // Get results from materialized view
  const { data: results, error: resultsError } = await supabase
    .from('ab_experiment_results')
    .select('*')
    .eq('experiment_id', id);

  if (resultsError) {
    console.error('Error fetching results:', resultsError);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }

  // Calculate statistics
  const stats = calculateExperimentStats(
    results as ABExperimentResult[],
    experiment.minimum_sample_size
  );

  if (!stats) {
    return NextResponse.json({
      experiment_id: id,
      variants: [],
      is_significant: false,
      sample_size_reached: false,
    });
  }

  // Get daily visitor counts for time estimate
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: assignmentData } = await supabase
    .from('ab_assignments')
    .select('assigned_at')
    .eq('experiment_id', id)
    .gte('assigned_at', thirtyDaysAgo.toISOString());

  let dailyVisitors = 0;
  if (assignmentData && assignmentData.length > 0) {
    // Calculate days since first assignment
    const firstDate = new Date(assignmentData[0].assigned_at);
    const daysSinceFirst = Math.max(
      1,
      Math.ceil(
        (Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    dailyVisitors = Math.round(assignmentData.length / daysSinceFirst);
  }

  // Add time estimate
  const totalVisitors = stats.variants.reduce((sum, v) => sum + v.visitors, 0);
  const requiredPerVariant = experiment.minimum_sample_size;
  const requiredTotal = requiredPerVariant * stats.variants.length;

  let estimatedDaysRemaining: number | null = null;
  if (dailyVisitors > 0 && totalVisitors < requiredTotal) {
    estimatedDaysRemaining = Math.ceil(
      (requiredTotal - totalVisitors) / dailyVisitors
    );
  }

  return NextResponse.json({
    ...stats,
    daily_visitors: dailyVisitors,
    estimated_days_remaining: estimatedDaysRemaining,
    raw_results: results,
  });
}

// POST /api/ab-testing/experiments/[id]/results - Force refresh results
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  // Force refresh materialized view
  const { error } = await supabase.rpc('refresh_ab_results');

  if (error) {
    console.error('Error refreshing results:', error);
    return NextResponse.json(
      { error: 'Failed to refresh results' },
      { status: 500 }
    );
  }

  // Return fresh results
  return GET(request, { params });
}
