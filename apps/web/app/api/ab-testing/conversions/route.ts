import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { TrackConversionInput } from '@/lib/ab-testing/types';

// POST /api/ab-testing/conversions - Track a conversion
// This endpoint is public (no auth required) for tracking from landing pages
export async function POST(request: NextRequest) {
  let body: TrackConversionInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validate required fields
  if (!body.visitor_id || !body.experiment_id || !body.conversion_type) {
    return NextResponse.json(
      {
        error:
          'Missing required fields: visitor_id, experiment_id, conversion_type',
      },
      { status: 400 }
    );
  }

  // Validate conversion type
  const validTypes = [
    'form_submit',
    'form_start',
    'cta_click',
    'match_preview_click',
    'time_on_page_30s',
    'time_on_page_60s',
    'scroll_50',
    'scroll_100',
  ];

  if (!validTypes.includes(body.conversion_type)) {
    return NextResponse.json(
      { error: `Invalid conversion_type. Must be one of: ${validTypes.join(', ')}` },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Get the assignment for this visitor and experiment
  const { data: assignment, error: assignmentError } = await supabase
    .from('ab_assignments')
    .select('id, variant_id')
    .eq('visitor_id', body.visitor_id)
    .eq('experiment_id', body.experiment_id)
    .single();

  if (assignmentError || !assignment) {
    // Visitor not in this experiment - silently succeed
    // This prevents errors on the client when tracking for non-assigned visitors
    return NextResponse.json({ success: true, tracked: false });
  }

  // Record the conversion (upsert to prevent duplicates)
  const { data, error } = await supabase
    .from('ab_conversions')
    .upsert(
      {
        assignment_id: assignment.id,
        experiment_id: body.experiment_id,
        variant_id: assignment.variant_id,
        conversion_type: body.conversion_type,
        metadata: body.metadata ?? {},
      },
      {
        onConflict: 'assignment_id,conversion_type',
        ignoreDuplicates: true,
      }
    )
    .select()
    .single();

  if (error && error.code !== '23505') {
    // Ignore duplicate key errors
    console.error('Error tracking conversion:', error);
    return NextResponse.json(
      { error: 'Failed to track conversion' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    tracked: true,
    conversion_id: data?.id,
  });
}

// GET /api/ab-testing/conversions - Get conversions for debugging
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const visitorId = searchParams.get('visitor_id');
  const experimentId = searchParams.get('experiment_id');

  if (!visitorId) {
    return NextResponse.json(
      { error: 'visitor_id parameter required' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Get assignments for visitor
  let assignmentQuery = supabase
    .from('ab_assignments')
    .select('id, experiment_id, variant_id')
    .eq('visitor_id', visitorId);

  if (experimentId) {
    assignmentQuery = assignmentQuery.eq('experiment_id', experimentId);
  }

  const { data: assignments, error: assignmentError } = await assignmentQuery;

  if (assignmentError) {
    console.error('Error fetching assignments:', assignmentError);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }

  if (!assignments || assignments.length === 0) {
    return NextResponse.json({ assignments: [], conversions: [] });
  }

  // Get conversions for these assignments
  const assignmentIds = assignments.map((a) => a.id);

  const { data: conversions, error: conversionError } = await supabase
    .from('ab_conversions')
    .select('*')
    .in('assignment_id', assignmentIds)
    .order('converted_at', { ascending: false });

  if (conversionError) {
    console.error('Error fetching conversions:', conversionError);
    return NextResponse.json(
      { error: 'Failed to fetch conversions' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    assignments,
    conversions: conversions ?? [],
  });
}
