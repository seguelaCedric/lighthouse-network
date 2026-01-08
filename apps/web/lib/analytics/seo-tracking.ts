// ============================================================================
// SEO & Conversion Analytics Tracking
// ============================================================================
// Tracks match preview interactions, conversion paths, and internal link clicks
// ============================================================================

export type ConversionPath = 'match_preview_view_more' | 'match_preview_get_profiles' | 'form_submit' | 'direct_form';

export type InternalLinkType = 'related_position' | 'related_location' | 'content_hub' | 'position_hub' | 'location_hub';

export interface MatchPreviewEvent {
  type: 'match_preview_viewed' | 'match_preview_candidate_clicked' | 'match_preview_view_more' | 'match_preview_get_profiles';
  position: string;
  location: string;
  candidateCount?: number;
  candidateId?: string;
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
export function trackEvent(event: MatchPreviewEvent | InternalLinkEvent | ConversionEvent) {
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
};

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
