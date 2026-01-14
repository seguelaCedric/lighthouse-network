import {
  BookOpen,
  DollarSign,
  MessageSquare,
  Search,
  UserPlus,
  Heart,
  Scale,
  Briefcase,
  TrendingUp,
  Award,
  BadgeCheck,
  MapPin,
  FileText,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

export type ContentType =
  | "hiring_guide"
  | "salary_guide"
  | "interview_questions"
  | "what_to_look_for"
  | "onboarding_guide"
  | "retention_strategy"
  | "legal_requirements"
  | "position_overview"
  | "career_path"
  | "skills_required"
  | "certifications"
  | "location_insights"
  | "case_study"
  | "faq_expansion";

export type TargetAudience = "employer" | "candidate" | "both";

export interface Resource {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content_type: ContentType | null;
  target_audience: TargetAudience | null;
  target_position: string | null;
  published_at: string | null;
  view_count: number | null;
  content_length: number;
}

/**
 * Calculate reading time based on content length
 * Average reading speed: 250 words per minute
 * Average word length: ~6 characters
 * So roughly 1500 characters per minute
 */
export function calculateReadingTime(contentLength: number): string {
  const minutes = Math.max(1, Math.ceil(contentLength / 1500));
  return minutes === 1 ? "1 min read" : `${minutes} min read`;
}

/**
 * Map content type to display label
 */
export function getContentTypeLabel(contentType: ContentType | null): string {
  if (!contentType) return "Article";

  const labels: Record<ContentType, string> = {
    hiring_guide: "Hiring Guide",
    salary_guide: "Salary Guide",
    interview_questions: "Interview Tips",
    what_to_look_for: "What to Look For",
    onboarding_guide: "Onboarding Guide",
    retention_strategy: "Retention Tips",
    legal_requirements: "Legal Guide",
    position_overview: "Job Overview",
    career_path: "Career Path",
    skills_required: "Skills Guide",
    certifications: "Certifications",
    location_insights: "Market Insights",
    case_study: "Case Study",
    faq_expansion: "FAQ",
  };

  return labels[contentType] || "Article";
}

/**
 * Map content type to Lucide icon component
 */
export function getContentTypeIcon(contentType: ContentType | null): LucideIcon {
  if (!contentType) return FileText;

  const icons: Record<ContentType, LucideIcon> = {
    hiring_guide: BookOpen,
    salary_guide: DollarSign,
    interview_questions: MessageSquare,
    what_to_look_for: Search,
    onboarding_guide: UserPlus,
    retention_strategy: Heart,
    legal_requirements: Scale,
    position_overview: Briefcase,
    career_path: TrendingUp,
    skills_required: Award,
    certifications: BadgeCheck,
    location_insights: MapPin,
    case_study: FileText,
    faq_expansion: HelpCircle,
  };

  return icons[contentType] || FileText;
}

/**
 * Industry types for categorization
 */
export type Industry = "yacht" | "household" | "general";

/**
 * Yacht crew positions
 */
export const YACHT_POSITIONS = [
  "captain",
  "chief officer",
  "first officer",
  "second officer",
  "officer",
  "engineer",
  "chief engineer",
  "second engineer",
  "eto",
  "electro-technical officer",
  "stewardess",
  "chief stewardess",
  "second stewardess",
  "third stewardess",
  "interior",
  "deckhand",
  "bosun",
  "lead deckhand",
  "deck",
  "purser",
  "chef",
  "sous chef",
  "galley",
  "mate",
  "first mate",
];

/**
 * Private household/estate staff positions
 */
export const HOUSEHOLD_POSITIONS = [
  "butler",
  "house manager",
  "estate manager",
  "household manager",
  "nanny",
  "governess",
  "housekeeper",
  "head housekeeper",
  "personal assistant",
  "pa",
  "executive assistant",
  "security",
  "close protection",
  "driver",
  "chauffeur",
  "gardener",
  "groundskeeper",
  "estate staff",
  "household staff",
  "private staff",
  "domestic staff",
  "laundress",
  "valet",
];

/**
 * Keywords to identify yacht-related content
 */
const YACHT_KEYWORDS = [
  "yacht",
  "superyacht",
  "mega yacht",
  "motor yacht",
  "sailing yacht",
  "vessel",
  "maritime",
  "seafarer",
  "at sea",
  "onboard",
  "crew",
  "charter",
  "stcw",
  "eng1",
  "mca",
];

/**
 * Keywords to identify household-related content
 */
const HOUSEHOLD_KEYWORDS = [
  "household",
  "estate",
  "private residence",
  "family office",
  "hnwi",
  "uhnwi",
  "principal",
  "domestic",
  "private home",
  "mansion",
  "villa",
];

/**
 * Determine industry from position string
 */
export function getIndustryFromPosition(position: string | null): Industry {
  if (!position) return "general";

  const positionLower = position.toLowerCase();

  // Check yacht positions
  for (const yachtPos of YACHT_POSITIONS) {
    if (positionLower.includes(yachtPos)) {
      return "yacht";
    }
  }

  // Check household positions
  for (const householdPos of HOUSEHOLD_POSITIONS) {
    if (positionLower.includes(householdPos)) {
      return "household";
    }
  }

  return "general";
}

/**
 * Determine industry from content (title, excerpt, or position)
 */
export function getIndustryFromContent(resource: Resource): Industry {
  // First check position
  const positionIndustry = getIndustryFromPosition(resource.target_position);
  if (positionIndustry !== "general") {
    return positionIndustry;
  }

  // Check title and excerpt for keywords
  const textToSearch = `${resource.title} ${resource.excerpt || ""}`.toLowerCase();

  // Check yacht keywords
  for (const keyword of YACHT_KEYWORDS) {
    if (textToSearch.includes(keyword)) {
      return "yacht";
    }
  }

  // Check household keywords
  for (const keyword of HOUSEHOLD_KEYWORDS) {
    if (textToSearch.includes(keyword)) {
      return "household";
    }
  }

  return "general";
}

/**
 * Filter resources by industry
 */
export function filterByIndustry(
  resources: Resource[],
  industry: Industry | "all"
): Resource[] {
  if (industry === "all") return resources;
  return resources.filter((r) => getIndustryFromContent(r) === industry);
}

/**
 * Get badge style classes based on content type
 */
export function getContentTypeBadgeStyle(contentType: ContentType | null): string {
  switch (contentType) {
    case "hiring_guide":
    case "what_to_look_for":
      return "bg-gold-100 text-gold-700";
    case "position_overview":
    case "career_path":
      return "bg-blue-100 text-blue-700";
    case "interview_questions":
    case "retention_strategy":
      return "bg-green-100 text-green-700";
    case "case_study":
      return "bg-purple-100 text-purple-700";
    case "salary_guide":
      return "bg-amber-100 text-amber-700";
    case "skills_required":
    case "certifications":
      return "bg-teal-100 text-teal-700";
    case "onboarding_guide":
    case "legal_requirements":
      return "bg-indigo-100 text-indigo-700";
    case "location_insights":
      return "bg-cyan-100 text-cyan-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

/**
 * Get industry display label
 */
export function getIndustryLabel(industry: Industry): string {
  switch (industry) {
    case "yacht":
      return "Yacht Crew";
    case "household":
      return "Private Staff";
    default:
      return "Industry";
  }
}

/**
 * @deprecated Use getContentTypeBadgeStyle instead
 * Get badge style classes based on target audience
 */
export function getAudienceBadgeStyle(audience: TargetAudience | null): string {
  switch (audience) {
    case "employer":
      return "bg-gold-100 text-gold-700";
    case "candidate":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

/**
 * @deprecated No longer using audience-based labeling
 * Get audience display label
 */
export function getAudienceLabel(audience: TargetAudience | null): string {
  switch (audience) {
    case "employer":
      return "For Employers";
    case "candidate":
      return "For Candidates";
    default:
      return "General";
  }
}

/**
 * Filter resources by content types
 */
export function filterByContentTypes(
  resources: Resource[],
  contentTypes: ContentType[]
): Resource[] {
  return resources.filter(
    (r) => r.content_type && contentTypes.includes(r.content_type)
  );
}

/**
 * Filter resources by target audience
 */
export function filterByAudience(
  resources: Resource[],
  audience: TargetAudience | "all"
): Resource[] {
  if (audience === "all") return resources;
  return resources.filter(
    (r) => r.target_audience === audience || r.target_audience === "both"
  );
}

/**
 * Content type groupings for industry sections
 * All resource types can appear in any industry - they're filtered by position/keywords
 */
export const HIRING_CONTENT_TYPES: ContentType[] = [
  "hiring_guide",
  "what_to_look_for",
  "salary_guide",
];

export const CAREER_CONTENT_TYPES: ContentType[] = [
  "position_overview",
  "career_path",
];

export const INTERVIEW_CONTENT_TYPES: ContentType[] = [
  "interview_questions",
  "retention_strategy",
];

export const SKILLS_CONTENT_TYPES: ContentType[] = [
  "skills_required",
  "certifications",
];

export const ONBOARDING_CONTENT_TYPES: ContentType[] = [
  "onboarding_guide",
  "legal_requirements",
];

export const INSIGHTS_CONTENT_TYPES: ContentType[] = [
  "case_study",
  "location_insights",
  "faq_expansion",
];

/**
 * @deprecated Use industry-based filtering instead
 * Content type groupings for sections
 */
export const EMPLOYER_CONTENT_TYPES: ContentType[] = [
  "hiring_guide",
  "what_to_look_for",
  "interview_questions",
  "retention_strategy",
  "onboarding_guide",
  "legal_requirements",
  "salary_guide",
];

/**
 * @deprecated Use industry-based filtering instead
 */
export const CANDIDATE_CONTENT_TYPES: ContentType[] = [
  "position_overview",
  "career_path",
  "skills_required",
  "certifications",
];

/**
 * @deprecated Use INSIGHTS_CONTENT_TYPES instead
 */
export const GENERAL_CONTENT_TYPES: ContentType[] = [
  "case_study",
  "location_insights",
  "faq_expansion",
];
