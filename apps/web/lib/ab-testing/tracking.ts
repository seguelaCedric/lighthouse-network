// Conversion tracking for A/B testing - Client-side only
import type { ConversionType } from './types';

/**
 * Track a conversion event (client-side)
 */
export async function trackConversionClient(
  visitorId: string,
  experimentId: string,
  conversionType: ConversionType,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  try {
    const response = await fetch('/api/ab-testing/conversions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        visitor_id: visitorId,
        experiment_id: experimentId,
        conversion_type: conversionType,
        metadata,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error tracking conversion:', error);
    return false;
  }
}

/**
 * Create a tracker instance for client-side use
 */
export function createTracker(visitorId: string) {
  const trackedEvents = new Set<string>();

  return {
    /**
     * Track a conversion (with deduplication)
     */
    async track(
      experimentId: string,
      conversionType: ConversionType,
      metadata?: Record<string, unknown>
    ): Promise<boolean> {
      const key = `${experimentId}:${conversionType}`;
      if (trackedEvents.has(key)) {
        return true; // Already tracked
      }

      const success = await trackConversionClient(
        visitorId,
        experimentId,
        conversionType,
        metadata
      );

      if (success) {
        trackedEvents.add(key);
      }

      return success;
    },

    /**
     * Track form submission
     */
    async trackFormSubmit(
      experimentId: string,
      formData?: Record<string, unknown>
    ): Promise<boolean> {
      return this.track(experimentId, 'form_submit', formData);
    },

    /**
     * Track form start (user began filling form)
     */
    async trackFormStart(experimentId: string): Promise<boolean> {
      return this.track(experimentId, 'form_start');
    },

    /**
     * Track CTA click
     */
    async trackCTAClick(
      experimentId: string,
      ctaText?: string
    ): Promise<boolean> {
      return this.track(experimentId, 'cta_click', { cta_text: ctaText });
    },

    /**
     * Track match preview interaction
     */
    async trackMatchPreviewClick(
      experimentId: string,
      candidateId?: string
    ): Promise<boolean> {
      return this.track(experimentId, 'match_preview_click', {
        candidate_id: candidateId,
      });
    },

    /**
     * Track time on page milestone
     */
    async trackTimeOnPage(
      experimentId: string,
      seconds: 30 | 60
    ): Promise<boolean> {
      const type =
        seconds === 30 ? 'time_on_page_30s' : ('time_on_page_60s' as const);
      return this.track(experimentId, type);
    },

    /**
     * Track scroll milestone
     */
    async trackScroll(
      experimentId: string,
      percentage: 50 | 100
    ): Promise<boolean> {
      const type = percentage === 50 ? 'scroll_50' : ('scroll_100' as const);
      return this.track(experimentId, type);
    },
  };
}

/**
 * Auto-track engagement metrics
 */
export function setupEngagementTracking(
  visitorId: string,
  experimentIds: string[]
) {
  if (typeof window === 'undefined' || experimentIds.length === 0) return;

  const tracker = createTracker(visitorId);
  let scrollTracked50 = false;
  let scrollTracked100 = false;

  // Time on page tracking
  setTimeout(() => {
    experimentIds.forEach((id) => tracker.trackTimeOnPage(id, 30));
  }, 30000);

  setTimeout(() => {
    experimentIds.forEach((id) => tracker.trackTimeOnPage(id, 60));
  }, 60000);

  // Scroll tracking
  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;

    if (!scrollTracked50 && scrollPercent >= 50) {
      scrollTracked50 = true;
      experimentIds.forEach((id) => tracker.trackScroll(id, 50));
    }

    if (!scrollTracked100 && scrollPercent >= 95) {
      // 95% to account for rounding
      scrollTracked100 = true;
      experimentIds.forEach((id) => tracker.trackScroll(id, 100));
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}
