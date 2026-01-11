// ============================================================================
// SEO & Conversion Analytics Tracking
// ============================================================================
// Tracks match preview interactions, conversion paths, and internal link clicks
// ============================================================================

export type ConversionPath = 'match_preview_view_more' | 'match_preview_get_profiles' | 'form_submit' | 'direct_form' | 'landing_to_match' | 'hero_cta';

export type InternalLinkType = 'related_position' | 'related_location' | 'content_hub' | 'position_hub' | 'location_hub' | 'answer_capsule_related' | 'answer_capsule_hub' | 'answer_capsule_cta';

export type ScrollDepthMilestone = 25 | 50 | 75 | 100;

export interface MatchPreviewEvent {
  type: 'match_preview_viewed' | 'match_preview_candidate_clicked' | 'match_preview_view_more' | 'match_preview_get_profiles';
  position: string;
  location: string;
  candidateCount?: number;
  candidateId?: string;
}

export interface FormTrackingEvent {
  type: 'form_start' | 'form_complete' | 'form_abandon';
  formId: string;
  formName: string;
  position?: string;
  location?: string;
  fieldsCompleted?: number;
  totalFields?: number;
  abandonedField?: string;
}

export interface ScrollDepthEvent {
  type: 'scroll_depth';
  milestone: ScrollDepthMilestone;
  pageUrl: string;
}

export interface InternalLinkEvent {
  type: 'internal_link_clicked';
  linkType: InternalLinkType;
  sourceUrl: string;
  targetUrl: string;
  linkText?: string;
}

export interface ConversionEvent {
  type: 'conversion_started' | 'conversion_completed';
  path: ConversionPath;
  position: string;
  location: string;
  formType?: 'inquiry' | 'lead_capture';
}

// Track event to analytics provider
export function trackEvent(event: MatchPreviewEvent | InternalLinkEvent | ConversionEvent | FormTrackingEvent | ScrollDepthEvent) {
  // Check if we're in browser
  if (typeof window === 'undefined') return;

  // Google Analytics 4
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', event.type, {
      ...(event as any),
      event_category: 'seo_optimization',
    });
  }

  // Custom analytics endpoint (if you have one)
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
    fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer,
      }),
    }).catch((err) => console.error('Analytics tracking error:', err));
  }

  // Console log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event);
  }
}

// Helper functions for common events
export const analytics = {
  trackMatchPreviewViewed: (position: string, location: string, candidateCount: number) => {
    trackEvent({
      type: 'match_preview_viewed',
      position,
      location,
      candidateCount,
    });
  },

  trackMatchPreviewCandidateClick: (position: string, location: string, candidateId: string) => {
    trackEvent({
      type: 'match_preview_candidate_clicked',
      position,
      location,
      candidateId,
    });
  },

  trackMatchPreviewViewMore: (position: string, location: string) => {
    trackEvent({
      type: 'match_preview_view_more',
      position,
      location,
    });
  },

  trackMatchPreviewGetProfiles: (position: string, location: string) => {
    trackEvent({
      type: 'match_preview_get_profiles',
      position,
      location,
    });
  },

  trackInternalLinkClick: (
    linkType: InternalLinkType,
    sourceUrl: string,
    targetUrl: string,
    linkText?: string
  ) => {
    trackEvent({
      type: 'internal_link_clicked',
      linkType,
      sourceUrl,
      targetUrl,
      linkText,
    });
  },

  trackConversionStarted: (path: ConversionPath, position: string, location: string, formType?: 'inquiry' | 'lead_capture') => {
    trackEvent({
      type: 'conversion_started',
      path,
      position,
      location,
      formType,
    });
  },

  trackConversionCompleted: (path: ConversionPath, position: string, location: string, formType?: 'inquiry' | 'lead_capture') => {
    trackEvent({
      type: 'conversion_completed',
      path,
      position,
      location,
      formType,
    });
  },

  trackLandingPageToMatch: (landingPageId: string, position: string, location: string, source: 'hero' | 'preview' | 'cta') => {
    trackEvent({
      type: 'conversion_started',
      path: 'landing_to_match',
      position,
      location,
    });
    // Also track as gtag event for better GA4 reporting
    if (typeof window !== 'undefined' && typeof window.gtag !== 'undefined') {
      window.gtag('event', 'landing_to_match_redirect', {
        landing_page_id: landingPageId,
        position,
        location,
        source,
        event_category: 'conversion_funnel',
      });
    }
  },

  // Form tracking helpers
  trackFormStart: (formId: string, formName: string, position?: string, location?: string) => {
    trackEvent({
      type: 'form_start',
      formId,
      formName,
      position,
      location,
    });
  },

  trackFormComplete: (formId: string, formName: string, fieldsCompleted: number, totalFields: number, position?: string, location?: string) => {
    trackEvent({
      type: 'form_complete',
      formId,
      formName,
      fieldsCompleted,
      totalFields,
      position,
      location,
    });
  },

  trackFormAbandon: (formId: string, formName: string, abandonedField: string, fieldsCompleted: number, totalFields: number, position?: string, location?: string) => {
    trackEvent({
      type: 'form_abandon',
      formId,
      formName,
      abandonedField,
      fieldsCompleted,
      totalFields,
      position,
      location,
    });
  },

  // Scroll depth tracking
  trackScrollDepth: (milestone: ScrollDepthMilestone) => {
    trackEvent({
      type: 'scroll_depth',
      milestone,
      pageUrl: typeof window !== 'undefined' ? window.location.pathname : '',
    });
  },
};

// Scroll depth tracking utility - call this to initialize scroll tracking
export function initScrollDepthTracking() {
  if (typeof window === 'undefined') return;

  const milestones: ScrollDepthMilestone[] = [25, 50, 75, 100];
  const trackedMilestones = new Set<ScrollDepthMilestone>();

  const handleScroll = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);

    for (const milestone of milestones) {
      if (scrollPercent >= milestone && !trackedMilestones.has(milestone)) {
        trackedMilestones.add(milestone);
        analytics.trackScrollDepth(milestone);
      }
    }
  };

  // Throttle scroll handler
  let ticking = false;
  const throttledHandleScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', throttledHandleScroll, { passive: true });

  // Return cleanup function
  return () => {
    window.removeEventListener('scroll', throttledHandleScroll);
  };
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
