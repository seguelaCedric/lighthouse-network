// Statistical analysis for A/B testing
import type { VariantStats, ExperimentStats, ABExperimentResult } from './types';

/**
 * Calculate z-score for a proportion
 */
function zScore(
  p1: number, // Conversion rate of variant
  p2: number, // Conversion rate of control
  n1: number, // Sample size of variant
  n2: number // Sample size of control
): number {
  if (n1 === 0 || n2 === 0) return 0;

  const p = (p1 * n1 + p2 * n2) / (n1 + n2); // Pooled proportion
  const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2)); // Standard error

  if (se === 0) return 0;

  return (p1 - p2) / se;
}

/**
 * Convert z-score to p-value (two-tailed)
 */
function zToP(z: number): number {
  // Approximation using error function
  const absZ = Math.abs(z);
  const t = 1 / (1 + 0.2316419 * absZ);
  const d = 0.3989423 * Math.exp((-absZ * absZ) / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  return 2 * p; // Two-tailed
}

/**
 * Calculate Wilson score interval for confidence bounds
 * This is more accurate than simple proportion ± margin of error
 */
function wilsonScoreInterval(
  successes: number,
  total: number,
  confidence: number = 0.95
): [number, number] {
  if (total === 0) return [0, 0];

  // Z-score for confidence level
  const z = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.576 : 1.645;

  const p = successes / total;
  const n = total;

  const denominator = 1 + (z * z) / n;
  const center = p + (z * z) / (2 * n);
  const spread = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);

  const lower = Math.max(0, (center - spread) / denominator);
  const upper = Math.min(1, (center + spread) / denominator);

  return [lower * 100, upper * 100]; // Return as percentages
}

/**
 * Calculate statistical significance between two variants
 */
export function calculateSignificance(
  variantConversions: number,
  variantVisitors: number,
  controlConversions: number,
  controlVisitors: number,
  requiredConfidence: number = 0.95
): {
  isSignificant: boolean;
  confidence: number;
  pValue: number;
  lift: number;
} {
  if (controlVisitors === 0 || variantVisitors === 0) {
    return {
      isSignificant: false,
      confidence: 0,
      pValue: 1,
      lift: 0,
    };
  }

  const variantRate = variantConversions / variantVisitors;
  const controlRate = controlConversions / controlVisitors;

  const z = zScore(variantRate, controlRate, variantVisitors, controlVisitors);
  const pValue = zToP(z);
  const confidence = 1 - pValue;

  const lift =
    controlRate > 0 ? ((variantRate - controlRate) / controlRate) * 100 : 0;

  return {
    isSignificant: confidence >= requiredConfidence,
    confidence,
    pValue,
    lift,
  };
}

/**
 * Calculate required sample size for detecting a given effect
 */
export function calculateRequiredSampleSize(
  baselineConversionRate: number,
  minimumDetectableEffect: number, // e.g., 0.1 for 10% improvement
  power: number = 0.8,
  significance: number = 0.05
): number {
  // Z-scores for power and significance
  const zAlpha = significance === 0.05 ? 1.96 : significance === 0.01 ? 2.576 : 1.645;
  const zBeta = power === 0.8 ? 0.84 : power === 0.9 ? 1.28 : 0.52;

  const p1 = baselineConversionRate;
  const p2 = baselineConversionRate * (1 + minimumDetectableEffect);

  const pooledP = (p1 + p2) / 2;
  const numerator = Math.pow(
    zAlpha * Math.sqrt(2 * pooledP * (1 - pooledP)) +
      zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)),
    2
  );
  const denominator = Math.pow(p2 - p1, 2);

  return Math.ceil(numerator / denominator);
}

/**
 * Build variant statistics
 */
function buildVariantStats(result: ABExperimentResult): VariantStats {
  const rate =
    result.total_visitors > 0
      ? (result.form_submits / result.total_visitors) * 100
      : 0;

  return {
    variant_id: result.variant_id,
    variant_name: result.variant_name,
    is_control: result.is_control,
    visitors: result.total_visitors,
    conversions: result.form_submits,
    conversion_rate: rate,
    confidence_interval: wilsonScoreInterval(
      result.form_submits,
      result.total_visitors
    ),
  };
}

/**
 * Calculate complete experiment statistics
 */
export function calculateExperimentStats(
  results: ABExperimentResult[],
  minimumSampleSize: number = 100
): ExperimentStats | null {
  if (results.length === 0) return null;

  const firstResult = results[0];
  const variants = results.map(buildVariantStats);

  // Find control variant
  const control = variants.find((v) => v.is_control);
  if (!control) {
    // If no control marked, use first variant
    variants[0].is_control = true;
  }

  const controlVariant = variants.find((v) => v.is_control)!;

  // Calculate significance for each non-control variant
  let bestVariant: VariantStats | null = null;
  let bestLift = 0;
  let bestConfidence = 0;
  let anySignificant = false;

  for (const variant of variants) {
    if (variant.is_control) continue;

    const { isSignificant, confidence, lift } = calculateSignificance(
      variant.conversions,
      variant.visitors,
      controlVariant.conversions,
      controlVariant.visitors
    );

    if (isSignificant) {
      anySignificant = true;
    }

    // Track best performing variant (positive lift)
    if (lift > bestLift && confidence > bestConfidence) {
      bestVariant = variant;
      bestLift = lift;
      bestConfidence = confidence;
    }
  }

  // Check if we have enough samples
  const totalVisitors = variants.reduce((sum, v) => sum + v.visitors, 0);
  const sampleSizeReached = totalVisitors >= minimumSampleSize;

  return {
    experiment_id: firstResult.experiment_id,
    experiment_name: firstResult.experiment_name,
    status: firstResult.status,
    variants,
    winner:
      anySignificant && bestVariant && bestLift > 0
        ? {
            variant_id: bestVariant.variant_id,
            variant_name: bestVariant.variant_name,
            lift: bestLift,
            confidence: bestConfidence,
          }
        : undefined,
    is_significant: anySignificant,
    sample_size_reached: sampleSizeReached,
  };
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format lift for display (with + or - sign)
 */
export function formatLift(lift: number): string {
  const sign = lift >= 0 ? '+' : '';
  return `${sign}${lift.toFixed(1)}%`;
}

/**
 * Get confidence level label
 */
export function getConfidenceLabel(
  confidence: number
): 'low' | 'medium' | 'high' | 'very_high' {
  if (confidence >= 0.99) return 'very_high';
  if (confidence >= 0.95) return 'high';
  if (confidence >= 0.9) return 'medium';
  return 'low';
}

/**
 * Calculate time to significance estimate
 */
export function estimateTimeToSignificance(
  currentVisitors: number,
  requiredVisitors: number,
  dailyVisitors: number
): number | null {
  if (dailyVisitors <= 0) return null;
  if (currentVisitors >= requiredVisitors) return 0;

  const remaining = requiredVisitors - currentVisitors;
  return Math.ceil(remaining / dailyVisitors);
}
