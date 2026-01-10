// Conversion tracking for A/B testing - Server-side only
import { createClient } from '@/lib/supabase/server';
import type { ABConversion, ConversionType } from './types';

/**
 * Track a conversion event (server-side)
 */
export async function trackConversion(
  visitorId: string,
  experimentId: string,
  conversionType: ConversionType,
  metadata?: Record<string, unknown>
): Promise<ABConversion | null> {
  const supabase = await createClient();

  // First, get the assignment
  const { data: assignment, error: assignmentError } = await supabase
    .from('ab_assignments')
    .select('id, variant_id')
    .eq('visitor_id', visitorId)
    .eq('experiment_id', experimentId)
    .single();

  if (assignmentError || !assignment) {
    // No assignment found - visitor not in experiment
    return null;
  }

  // Record the conversion
  const { data, error } = await supabase
    .from('ab_conversions')
    .upsert(
      {
        assignment_id: assignment.id,
        experiment_id: experimentId,
        variant_id: assignment.variant_id,
        conversion_type: conversionType,
        metadata: metadata ?? {},
      },
      {
        onConflict: 'assignment_id,conversion_type',
        ignoreDuplicates: true,
      }
    )
    .select()
    .single();

  if (error && error.code !== '23505') {
    console.error('Error tracking conversion:', error);
    return null;
  }

  return data;
}

/**
 * Track multiple conversion events at once
 */
export async function trackConversions(
  visitorId: string,
  conversions: Array<{
    experiment_id: string;
    conversion_type: ConversionType;
    metadata?: Record<string, unknown>;
  }>
): Promise<number> {
  let successCount = 0;

  for (const conv of conversions) {
    const result = await trackConversion(
      visitorId,
      conv.experiment_id,
      conv.conversion_type,
      conv.metadata
    );
    if (result) successCount++;
  }

  return successCount;
}

/**
 * Get all conversions for a visitor in an experiment
 */
export async function getVisitorConversions(
  visitorId: string,
  experimentId: string
): Promise<ABConversion[]> {
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from('ab_assignments')
    .select('id')
    .eq('visitor_id', visitorId)
    .eq('experiment_id', experimentId)
    .single();

  if (!assignment) return [];

  const { data, error } = await supabase
    .from('ab_conversions')
    .select('*')
    .eq('assignment_id', assignment.id)
    .order('converted_at');

  if (error) {
    console.error('Error fetching conversions:', error);
    return [];
  }

  return data ?? [];
}

/**
 * Check if a specific conversion has occurred
 */
export async function hasConverted(
  visitorId: string,
  experimentId: string,
  conversionType: ConversionType
): Promise<boolean> {
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from('ab_assignments')
    .select('id')
    .eq('visitor_id', visitorId)
    .eq('experiment_id', experimentId)
    .single();

  if (!assignment) return false;

  const { data } = await supabase
    .from('ab_conversions')
    .select('id')
    .eq('assignment_id', assignment.id)
    .eq('conversion_type', conversionType)
    .single();

  return !!data;
}
