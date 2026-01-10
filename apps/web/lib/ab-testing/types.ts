// A/B Testing Types

export type TestElement =
  | 'cta_text'
  | 'form_placement'
  | 'match_preview_visibility'
  | 'hero_layout';

export type PageType = 'hire_landing' | 'job_listing' | 'all';

export type ExperimentStatus =
  | 'draft'
  | 'running'
  | 'paused'
  | 'completed'
  | 'archived';

export type ConversionType =
  | 'form_submit'
  | 'form_start'
  | 'cta_click'
  | 'match_preview_click'
  | 'time_on_page_30s'
  | 'time_on_page_60s'
  | 'scroll_50'
  | 'scroll_100';

// Variant configurations by test element
export interface CTAConfig {
  cta_text: string;
  cta_color?: 'primary' | 'secondary' | 'accent';
  cta_size?: 'sm' | 'md' | 'lg';
}

export interface FormPlacementConfig {
  placement: 'hero' | 'after_benefits' | 'sidebar' | 'sticky';
}

export interface MatchPreviewConfig {
  show: boolean;
  preview_count?: number;
  position?: 'hero' | 'benefits';
}

export interface HeroLayoutConfig {
  layout: 'centered' | 'split' | 'full_width';
}

export type VariantConfig =
  | CTAConfig
  | FormPlacementConfig
  | MatchPreviewConfig
  | HeroLayoutConfig;

// Database types
export interface ABExperiment {
  id: string;
  name: string;
  description?: string;
  test_element: TestElement;
  target_page_type: PageType;
  target_positions?: string[];
  target_locations?: string[];
  traffic_percentage: number;
  status: ExperimentStatus;
  started_at?: string;
  ended_at?: string;
  minimum_sample_size: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ABVariant {
  id: string;
  experiment_id: string;
  name: string;
  variant_key: string;
  is_control: boolean;
  config: VariantConfig;
  weight: number;
  created_at: string;
}

export interface ABAssignment {
  id: string;
  visitor_id: string;
  experiment_id: string;
  variant_id: string;
  page_url?: string;
  user_agent?: string;
  assigned_at: string;
}

export interface ABConversion {
  id: string;
  assignment_id: string;
  experiment_id: string;
  variant_id: string;
  conversion_type: ConversionType;
  metadata?: Record<string, unknown>;
  converted_at: string;
}

// Results types
export interface ABExperimentResult {
  experiment_id: string;
  experiment_name: string;
  test_element: TestElement;
  status: ExperimentStatus;
  variant_id: string;
  variant_name: string;
  is_control: boolean;
  total_visitors: number;
  form_submits: number;
  cta_clicks: number;
  form_starts: number;
  conversion_rate: number;
  first_assignment?: string;
  last_assignment?: string;
}

export interface VariantStats {
  variant_id: string;
  variant_name: string;
  is_control: boolean;
  visitors: number;
  conversions: number;
  conversion_rate: number;
  confidence_interval: [number, number];
}

export interface ExperimentStats {
  experiment_id: string;
  experiment_name: string;
  status: ExperimentStatus;
  variants: VariantStats[];
  winner?: {
    variant_id: string;
    variant_name: string;
    lift: number; // Percentage improvement over control
    confidence: number; // Statistical confidence (0-1)
  };
  is_significant: boolean;
  sample_size_reached: boolean;
}

// Context for landing pages
export interface ExperimentContext {
  experiment_id: string;
  variant_id: string;
  test_element: TestElement;
  config: VariantConfig;
}

export interface LandingPageExperiments {
  cta?: ExperimentContext;
  form_placement?: ExperimentContext;
  match_preview?: ExperimentContext;
  hero_layout?: ExperimentContext;
}

// API types
export interface CreateExperimentInput {
  name: string;
  description?: string;
  test_element: TestElement;
  target_page_type?: PageType;
  target_positions?: string[];
  target_locations?: string[];
  traffic_percentage?: number;
  minimum_sample_size?: number;
  variants: CreateVariantInput[];
}

export interface CreateVariantInput {
  name: string;
  variant_key: string;
  is_control?: boolean;
  config: VariantConfig;
  weight?: number;
}

export interface UpdateExperimentInput {
  name?: string;
  description?: string;
  target_positions?: string[];
  target_locations?: string[];
  traffic_percentage?: number;
  status?: ExperimentStatus;
  minimum_sample_size?: number;
}

export interface TrackConversionInput {
  visitor_id: string;
  experiment_id: string;
  conversion_type: ConversionType;
  metadata?: Record<string, unknown>;
}
