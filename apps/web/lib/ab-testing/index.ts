// A/B Testing Framework - Client-safe exports only
// For server-side functions, import directly from *.server.ts files

// Types
export type {
  TestElement,
  PageType,
  ExperimentStatus,
  ConversionType,
  CTAConfig,
  FormPlacementConfig,
  MatchPreviewConfig,
  HeroLayoutConfig,
  VariantConfig,
  ABExperiment,
  ABVariant,
  ABAssignment,
  ABConversion,
  ABExperimentResult,
  VariantStats,
  ExperimentStats,
  ExperimentContext,
  LandingPageExperiments,
  CreateExperimentInput,
  CreateVariantInput,
  UpdateExperimentInput,
  TrackConversionInput,
} from './types';

// Visitor management (client-side only)
export {
  getVisitorIdClient,
  setVisitorIdClient,
  getOrCreateVisitorIdClient,
  generateVisitorId,
  VISITOR_ID_COOKIE,
} from './visitor';

// Assignment (client-side utilities only)
export {
  hashAssignment,
  isInExperiment,
  selectVariant,
} from './assignment';

// Tracking (client-side only)
export {
  trackConversionClient,
  createTracker,
  setupEngagementTracking,
} from './tracking';

// Statistics (pure functions, safe for client)
export {
  calculateSignificance,
  calculateRequiredSampleSize,
  calculateExperimentStats,
  formatPercentage,
  formatLift,
  getConfidenceLabel,
  estimateTimeToSignificance,
} from './statistics';

// Hooks (client-side only)
export {
  useCTAExperiment,
  useFormPlacementExperiment,
  useMatchPreviewExperiment,
  useHeroLayoutExperiment,
  useExperimentTracking,
  useExperiments,
} from './hooks/useExperiment';
