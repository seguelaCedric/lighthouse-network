// Variant assignment logic for A/B testing - Client-side utilities only

/**
 * Client-side hash function for deterministic assignment
 * Mirrors the database function for client-side preview
 */
export function hashAssignment(
  visitorId: string,
  experimentId: string,
  seed: string = ''
): number {
  const str = visitorId + experimentId + seed;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 100;
}

/**
 * Check if a visitor should be in an experiment based on traffic percentage
 */
export function isInExperiment(
  visitorId: string,
  experimentId: string,
  trafficPercentage: number
): boolean {
  const hash = hashAssignment(visitorId, experimentId);
  return hash < trafficPercentage;
}

/**
 * Select a variant based on weights (client-side)
 */
export function selectVariant(
  visitorId: string,
  experimentId: string,
  variants: Array<{ id: string; weight: number }>
): string | null {
  if (variants.length === 0) return null;

  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  if (totalWeight === 0) return variants[0]?.id ?? null;

  const hash = hashAssignment(visitorId, experimentId, 'variant') % totalWeight;

  let runningWeight = 0;
  for (const variant of variants) {
    runningWeight += variant.weight;
    if (hash < runningWeight) {
      return variant.id;
    }
  }

  return variants[0]?.id ?? null;
}
