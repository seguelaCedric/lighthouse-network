import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { UpdateExperimentInput } from '@/lib/ab-testing/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/ab-testing/experiments/[id] - Get experiment
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ab_experiments')
    .select(
      `
      *,
      variants:ab_variants(*)
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }
    console.error('Error fetching experiment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch experiment' },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

// PATCH /api/ab-testing/experiments/[id] - Update experiment
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: UpdateExperimentInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const supabase = await createClient();

  // Build update object
  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.target_positions !== undefined)
    updates.target_positions = body.target_positions;
  if (body.target_locations !== undefined)
    updates.target_locations = body.target_locations;
  if (body.traffic_percentage !== undefined)
    updates.traffic_percentage = body.traffic_percentage;
  if (body.minimum_sample_size !== undefined)
    updates.minimum_sample_size = body.minimum_sample_size;

  // Handle status changes
  if (body.status !== undefined) {
    updates.status = body.status;

    // Set started_at when starting
    if (body.status === 'running') {
      const { data: existing } = await supabase
        .from('ab_experiments')
        .select('started_at')
        .eq('id', id)
        .single();

      if (!existing?.started_at) {
        updates.started_at = new Date().toISOString();
      }
    }

    // Set ended_at when completing
    if (body.status === 'completed' || body.status === 'archived') {
      updates.ended_at = new Date().toISOString();
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'No valid fields to update' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('ab_experiments')
    .update(updates)
    .eq('id', id)
    .select(
      `
      *,
      variants:ab_variants(*)
    `
    )
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }
    console.error('Error updating experiment:', error);
    return NextResponse.json(
      { error: 'Failed to update experiment' },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

// DELETE /api/ab-testing/experiments/[id] - Delete experiment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  // Check if experiment is running
  const { data: existing } = await supabase
    .from('ab_experiments')
    .select('status')
    .eq('id', id)
    .single();

  if (existing?.status === 'running') {
    return NextResponse.json(
      { error: 'Cannot delete a running experiment. Stop it first.' },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('ab_experiments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting experiment:', error);
    return NextResponse.json(
      { error: 'Failed to delete experiment' },
      { status: 500 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
