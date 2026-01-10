'use client';

import { useEffect, useRef, useCallback } from 'react';
import type {
  LandingPageExperiments,
  ExperimentContext,
  CTAConfig,
  FormPlacementConfig,
  MatchPreviewConfig,
  HeroLayoutConfig,
  ConversionType,
} from '../types';
import {
  getOrCreateVisitorIdClient,
  getVisitorIdClient,
} from '../visitor';
import { createTracker, setupEngagementTracking } from '../tracking';

// Default configurations
const DEFAULT_CTA: CTAConfig = {
  cta_text: 'Start Receiving Applicants',
  cta_color: 'primary',
  cta_size: 'lg',
};

const DEFAULT_FORM_PLACEMENT: FormPlacementConfig = {
  placement: 'hero',
};

const DEFAULT_MATCH_PREVIEW: MatchPreviewConfig = {
  show: true,
  preview_count: 3,
  position: 'hero',
};

const DEFAULT_HERO_LAYOUT: HeroLayoutConfig = {
  layout: 'centered',
};

/**
 * Hook to get CTA experiment configuration
 */
export function useCTAExperiment(
  experiments?: LandingPageExperiments
): CTAConfig & { experimentId?: string; variantId?: string } {
  const context = experiments?.cta;

  if (!context) {
    return { ...DEFAULT_CTA };
  }

  const config = context.config as CTAConfig;

  return {
    cta_text: config.cta_text ?? DEFAULT_CTA.cta_text,
    cta_color: config.cta_color ?? DEFAULT_CTA.cta_color,
    cta_size: config.cta_size ?? DEFAULT_CTA.cta_size,
    experimentId: context.experiment_id,
    variantId: context.variant_id,
  };
}

/**
 * Hook to get form placement experiment configuration
 */
export function useFormPlacementExperiment(
  experiments?: LandingPageExperiments
): FormPlacementConfig & { experimentId?: string; variantId?: string } {
  const context = experiments?.form_placement;

  if (!context) {
    return { ...DEFAULT_FORM_PLACEMENT };
  }

  const config = context.config as FormPlacementConfig;

  return {
    placement: config.placement ?? DEFAULT_FORM_PLACEMENT.placement,
    experimentId: context.experiment_id,
    variantId: context.variant_id,
  };
}

/**
 * Hook to get match preview experiment configuration
 */
export function useMatchPreviewExperiment(
  experiments?: LandingPageExperiments
): MatchPreviewConfig & { experimentId?: string; variantId?: string } {
  const context = experiments?.match_preview;

  if (!context) {
    return { ...DEFAULT_MATCH_PREVIEW };
  }

  const config = context.config as MatchPreviewConfig;

  return {
    show: config.show ?? DEFAULT_MATCH_PREVIEW.show,
    preview_count: config.preview_count ?? DEFAULT_MATCH_PREVIEW.preview_count,
    position: config.position ?? DEFAULT_MATCH_PREVIEW.position,
    experimentId: context.experiment_id,
    variantId: context.variant_id,
  };
}

/**
 * Hook to get hero layout experiment configuration
 */
export function useHeroLayoutExperiment(
  experiments?: LandingPageExperiments
): HeroLayoutConfig & { experimentId?: string; variantId?: string } {
  const context = experiments?.hero_layout;

  if (!context) {
    return { ...DEFAULT_HERO_LAYOUT };
  }

  const config = context.config as HeroLayoutConfig;

  return {
    layout: config.layout ?? DEFAULT_HERO_LAYOUT.layout,
    experimentId: context.experiment_id,
    variantId: context.variant_id,
  };
}

/**
 * Hook for experiment tracking
 */
export function useExperimentTracking(experiments?: LandingPageExperiments) {
  const trackerRef = useRef<ReturnType<typeof createTracker> | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const visitorId = getOrCreateVisitorIdClient();
    trackerRef.current = createTracker(visitorId);

    // Get all active experiment IDs
    const experimentIds = Object.values(experiments ?? {})
      .filter((ctx): ctx is ExperimentContext => !!ctx)
      .map((ctx) => ctx.experiment_id);

    // Set up engagement tracking
    if (experimentIds.length > 0) {
      cleanupRef.current = setupEngagementTracking(visitorId, experimentIds) ?? null;
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [experiments]);

  const trackCTAClick = useCallback(
    async (ctaText?: string) => {
      if (!trackerRef.current || !experiments?.cta) return;
      await trackerRef.current.trackCTAClick(
        experiments.cta.experiment_id,
        ctaText
      );
    },
    [experiments?.cta]
  );

  const trackFormStart = useCallback(async () => {
    if (!trackerRef.current) return;

    // Track for all relevant experiments
    const promises: Promise<boolean>[] = [];

    if (experiments?.cta) {
      promises.push(
        trackerRef.current.trackFormStart(experiments.cta.experiment_id)
      );
    }
    if (experiments?.form_placement) {
      promises.push(
        trackerRef.current.trackFormStart(
          experiments.form_placement.experiment_id
        )
      );
    }

    await Promise.all(promises);
  }, [experiments?.cta, experiments?.form_placement]);

  const trackFormSubmit = useCallback(
    async (formData?: Record<string, unknown>) => {
      if (!trackerRef.current) return;

      // Track for all experiments
      const allExperiments = Object.values(experiments ?? {}).filter(
        (ctx): ctx is ExperimentContext => !!ctx
      );

      const promises = allExperiments.map((ctx) =>
        trackerRef.current!.trackFormSubmit(ctx.experiment_id, formData)
      );

      await Promise.all(promises);
    },
    [experiments]
  );

  const trackMatchPreviewClick = useCallback(
    async (candidateId?: string) => {
      if (!trackerRef.current || !experiments?.match_preview) return;
      await trackerRef.current.trackMatchPreviewClick(
        experiments.match_preview.experiment_id,
        candidateId
      );
    },
    [experiments?.match_preview]
  );

  const trackCustomEvent = useCallback(
    async (
      experimentId: string,
      conversionType: ConversionType,
      metadata?: Record<string, unknown>
    ) => {
      if (!trackerRef.current) return;
      await trackerRef.current.track(experimentId, conversionType, metadata);
    },
    []
  );

  return {
    trackCTAClick,
    trackFormStart,
    trackFormSubmit,
    trackMatchPreviewClick,
    trackCustomEvent,
  };
}

/**
 * Combined hook for all experiment data and tracking
 */
export function useExperiments(experiments?: LandingPageExperiments) {
  const cta = useCTAExperiment(experiments);
  const formPlacement = useFormPlacementExperiment(experiments);
  const matchPreview = useMatchPreviewExperiment(experiments);
  const heroLayout = useHeroLayoutExperiment(experiments);
  const tracking = useExperimentTracking(experiments);

  return {
    cta,
    formPlacement,
    matchPreview,
    heroLayout,
    ...tracking,
  };
}
