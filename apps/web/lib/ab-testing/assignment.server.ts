// Variant assignment logic for A/B testing - Server-side only
import { createClient } from '@/lib/supabase/server';
import type {
  ABVariant,
  ABAssignment,
  ExperimentContext,
  LandingPageExperiments,
  TestElement,
} from './types';

interface ActiveExperiment {
  experiment_id: string;
  experiment_name: string;
  test_element: TestElement;
  traffic_percentage: number;
}

/**
 * Get active experiments for a page
 */
export async function getActiveExperiments(
  pageType: string = 'hire_landing',
  position?: string,
  location?: string
): Promise<ActiveExperiment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_active_experiments', {
    p_page_type: pageType,
    p_position: position ?? null,
    p_location: location ?? null,
  });

  if (error) {
    console.error('Error fetching active experiments:', error);
    return [];
  }

  return data ?? [];
}

/**
 * Assign a visitor to a variant using database function
 */
export async function assignVariant(
  visitorId: string,
  experimentId: string
): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('assign_variant', {
    p_visitor_id: visitorId,
    p_experiment_id: experimentId,
  });

  if (error) {
    console.error('Error assigning variant:', error);
    return null;
  }

  return data;
}

/**
 * Record an assignment in the database
 */
export async function recordAssignment(
  visitorId: string,
  experimentId: string,
  variantId: string,
  pageUrl?: string,
  userAgent?: string
): Promise<ABAssignment | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ab_assignments')
    .upsert(
      {
        visitor_id: visitorId,
        experiment_id: experimentId,
        variant_id: variantId,
        page_url: pageUrl,
        user_agent: userAgent,
      },
      {
        onConflict: 'visitor_id,experiment_id',
        ignoreDuplicates: true,
      }
    )
    .select()
    .single();

  if (error && error.code !== '23505') {
    // Ignore duplicate key errors
    console.error('Error recording assignment:', error);
    return null;
  }

  return data;
}

/**
 * Get existing assignment for a visitor
 */
export async function getExistingAssignment(
  visitorId: string,
  experimentId: string
): Promise<ABAssignment | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ab_assignments')
    .select('*')
    .eq('visitor_id', visitorId)
    .eq('experiment_id', experimentId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found
    console.error('Error fetching assignment:', error);
  }

  return data ?? null;
}

/**
 * Get variant details
 */
export async function getVariant(variantId: string): Promise<ABVariant | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ab_variants')
    .select('*')
    .eq('id', variantId)
    .single();

  if (error) {
    console.error('Error fetching variant:', error);
    return null;
  }

  return data;
}

/**
 * Get all variants for an experiment
 */
export async function getExperimentVariants(
  experimentId: string
): Promise<ABVariant[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ab_variants')
    .select('*')
    .eq('experiment_id', experimentId)
    .order('created_at');

  if (error) {
    console.error('Error fetching variants:', error);
    return [];
  }

  return data ?? [];
}

/**
 * Get experiment contexts for a landing page
 * This is the main function to call from landing pages
 */
export async function getLandingPageExperiments(
  visitorId: string,
  pageType: string = 'hire_landing',
  position?: string,
  location?: string,
  pageUrl?: string,
  userAgent?: string
): Promise<LandingPageExperiments> {
  const experiments: LandingPageExperiments = {};

  // Get active experiments for this page
  const activeExperiments = await getActiveExperiments(
    pageType,
    position,
    location
  );

  if (activeExperiments.length === 0) {
    return experiments;
  }

  // Process each experiment
  for (const exp of activeExperiments) {
    // Get or create assignment
    const variantId = await assignVariant(visitorId, exp.experiment_id);

    if (!variantId) {
      continue; // Visitor not in experiment
    }

    // Record the assignment
    await recordAssignment(
      visitorId,
      exp.experiment_id,
      variantId,
      pageUrl,
      userAgent
    );

    // Get variant details
    const variant = await getVariant(variantId);
    if (!variant) continue;

    const context: ExperimentContext = {
      experiment_id: exp.experiment_id,
      variant_id: variantId,
      test_element: exp.test_element,
      config: variant.config,
    };

    // Map to appropriate key
    switch (exp.test_element) {
      case 'cta_text':
        experiments.cta = context;
        break;
      case 'form_placement':
        experiments.form_placement = context;
        break;
      case 'match_preview_visibility':
        experiments.match_preview = context;
        break;
      case 'hero_layout':
        experiments.hero_layout = context;
        break;
    }
  }

  return experiments;
}
