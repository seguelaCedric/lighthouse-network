/**
 * Static navigation data for mega menus and site navigation
 * This eliminates database queries for navigation rendering
 */

export interface Position {
  slug: string;
  label: string;
  popular?: boolean;
}

export interface City {
  slug: string;
  label: string;
}

export interface Country {
  slug: string;
  label: string;
  cities: string[];
}

export interface LocationRegion {
  label: string;
  featured: string[];
  countries: Country[];
}

export interface PositionCategory {
  label: string;
  positions: Position[];
}

// Position categories for mega menu organization
export const POSITION_CATEGORIES: Record<string, PositionCategory> = {
  yachtCrew: {
    label: "Yacht Crew",
    positions: [
      { slug: "captain", label: "Captain", popular: true },
      { slug: "chief-officer", label: "Chief Officer" },
      { slug: "first-officer", label: "First Officer" },
      { slug: "bosun", label: "Bosun" },
      { slug: "deckhand", label: "Deckhand" },
      { slug: "chief-engineer", label: "Chief Engineer" },
      { slug: "engineer", label: "Engineer" },
      { slug: "chief-stewardess", label: "Chief Stewardess", popular: true },
      { slug: "stewardess", label: "Stewardess" },
      { slug: "chef", label: "Yacht Chef", popular: true },
      { slug: "sous-chef", label: "Sous Chef" },
    ],
  },
  householdStaff: {
    label: "Household Staff",
    positions: [
      { slug: "butler", label: "Butler", popular: true },
      { slug: "house-manager", label: "House Manager", popular: true },
      { slug: "private-chef", label: "Private Chef", popular: true },
      { slug: "pa", label: "Personal Assistant", popular: true },
    ],
  },
};

// Location organization by region
export const LOCATION_REGIONS: Record<string, LocationRegion> = {
  europe: {
    label: "Europe",
    featured: ["london", "monaco", "marbella", "paris"],
    countries: [
      {
        slug: "uk",
        label: "United Kingdom",
        cities: ["london", "edinburgh", "manchester", "leicester", "birmingham"],
      },
      {
        slug: "france",
        label: "France",
        cities: ["paris", "cannes", "antibes", "nice", "saint-tropez"],
      },
      {
        slug: "monaco",
        label: "Monaco",
        cities: ["monaco"],
      },
      {
        slug: "spain",
        label: "Spain",
        cities: ["marbella", "palma", "barcelona", "ibiza", "madrid"],
      },
      {
        slug: "italy",
        label: "Italy",
        cities: ["rome", "milan", "florence", "venice", "portofino"],
      },
    ],
  },
  americas: {
    label: "Americas",
    featured: ["miami", "new-york", "los-angeles", "aspen"],
    countries: [
      {
        slug: "usa",
        label: "United States",
        cities: [
          "miami",
          "new-york",
          "los-angeles",
          "palm-beach",
          "aspen",
          "hamptons",
          "orlando",
          "san-francisco",
        ],
      },
      {
        slug: "canada",
        label: "Canada",
        cities: ["toronto", "vancouver", "montreal"],
      },
    ],
  },
  middleEast: {
    label: "Middle East & Asia",
    featured: ["dubai", "hong-kong", "singapore"],
    countries: [
      {
        slug: "uae",
        label: "United Arab Emirates",
        cities: ["dubai", "abu-dhabi"],
      },
      {
        slug: "hong-kong",
        label: "Hong Kong",
        cities: ["hong-kong"],
      },
      {
        slug: "singapore",
        label: "Singapore",
        cities: ["singapore"],
      },
    ],
  },
};

// Content categories for mega menu
export const CONTENT_CATEGORIES = {
  forEmployers: {
    label: "For Employers",
    items: [
      { href: "/hire", label: "Hire Staff", icon: "Briefcase" },
      { href: "/blog?audience=employer", label: "Hiring Guides", icon: "BookOpen" },
      { href: "/salary-guide", label: "Salary Guides", icon: "FileText" },
    ],
  },
  forCandidates: {
    label: "For Candidates",
    items: [
      { href: "/join", label: "Find a Job", icon: "Users" },
      { href: "/blog?audience=candidate", label: "Career Resources", icon: "BookOpen" },
      { href: "/job-board", label: "Job Board", icon: "Briefcase" },
    ],
  },
};

// Helper function to get all positions as flat array
export function getAllPositions(): Position[] {
  return Object.values(POSITION_CATEGORIES).flatMap((category) => category.positions);
}

// Helper function to get popular positions
export function getPopularPositions(): Position[] {
  return getAllPositions().filter((pos) => pos.popular);
}

// Helper function to get all locations as flat array
export function getAllLocations(): string[] {
  const locations: string[] = [];
  Object.values(LOCATION_REGIONS).forEach((region) => {
    region.countries.forEach((country) => {
      locations.push(...country.cities);
    });
  });
  return locations;
}

// Helper function to get featured locations
export function getFeaturedLocations(): string[] {
  return Object.values(LOCATION_REGIONS).flatMap((region) => region.featured);
}

// Helper to format position label for display (title case)
export function formatPositionLabel(slug: string): string {
  const position = getAllPositions().find((p) => p.slug === slug);
  return position?.label || slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

// Helper to format location label for display (title case)
export function formatLocationLabel(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}
