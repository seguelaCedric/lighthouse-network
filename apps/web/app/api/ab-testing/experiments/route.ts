import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { CreateExperimentInput } from '@/lib/ab-testing/types';

// GET /api/ab-testing/experiments - List experiments
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const testElement = searchParams.get('test_element');

  const supabase = await createClient();

  let query = supabase
    .from('ab_experiments')
    .select(
      `
      *,
      variants:ab_variants(*)
    `
    )
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (testElement) {
    query = query.eq('test_element', testElement);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching experiments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch experiments' },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

// POST /api/ab-testing/experiments - Create experiment
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: CreateExperimentInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validate required fields
  if (!body.name || !body.test_element || !body.variants?.length) {
    return NextResponse.json(
      { error: 'Missing required fields: name, test_element, variants' },
      { status: 400 }
    );
  }

  // Ensure at least one control variant
  const hasControl = body.variants.some((v) => v.is_control);
  if (!hasControl) {
    body.variants[0].is_control = true;
  }

  const supabase = await createClient();

  // Create experiment
  const { data: experiment, error: expError } = await supabase
    .from('ab_experiments')
    .insert({
      name: body.name,
      description: body.description,
      test_element: body.test_element,
      target_page_type: body.target_page_type ?? 'hire_landing',
      target_positions: body.target_positions,
      target_locations: body.target_locations,
      traffic_percentage: body.traffic_percentage ?? 100,
      minimum_sample_size: body.minimum_sample_size ?? 100,
      created_by: session.user.id,
    })
    .select()
    .single();

  if (expError) {
    console.error('Error creating experiment:', expError);
    return NextResponse.json(
      { error: 'Failed to create experiment' },
      { status: 500 }
    );
  }

  // Create variants
  const variantInserts = body.variants.map((v) => ({
    experiment_id: experiment.id,
    name: v.name,
    variant_key: v.variant_key,
    is_control: v.is_control ?? false,
    config: v.config,
    weight: v.weight ?? 1,
  }));

  const { data: variants, error: varError } = await supabase
    .from('ab_variants')
    .insert(variantInserts)
    .select();

  if (varError) {
    console.error('Error creating variants:', varError);
    // Clean up experiment on failure
    await supabase.from('ab_experiments').delete().eq('id', experiment.id);
    return NextResponse.json(
      { error: 'Failed to create variants' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { ...experiment, variants },
    { status: 201 }
  );
}
