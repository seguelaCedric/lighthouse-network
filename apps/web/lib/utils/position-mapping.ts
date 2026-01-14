/**
 * Maps position display names from registration form to database values
 * Registration form uses display labels (e.g., "Captain", "Chief Officer")
 * Database uses normalized values (e.g., "captain", "chief_officer")
 *
 * Aligned with Vincere functional expertises
 */

export const POSITION_DISPLAY_TO_VALUE: Record<string, string> = {
  // Yacht Crew - Deck
  "Captain": "captain",
  "Chief Officer": "chief_officer",
  "First Officer": "chief_officer", // legacy alias
  "Second Officer": "second_officer",
  "2nd Officer": "second_officer",
  "Third Officer": "third_officer",
  "3rd Officer": "third_officer",
  "OOW": "oow",
  "Bosun": "bosun",
  "Lead Deckhand": "lead_deckhand",
  "Experienced Deckhand": "experienced_deckhand",
  "Deckhand": "experienced_deckhand", // map generic to experienced
  "Junior Deckhand": "junior_deckhand",
  "Carpenter": "carpenter",

  // Yacht Crew - Water Sports
  "Dive Instructor": "dive_instructor",
  "Dive Master": "dive_master",
  "PWC Instructor": "pwc_instructor",

  // Yacht Crew - Engineering
  "Chief Engineer": "chief_engineer",
  "Second Engineer": "second_engineer",
  "2nd Engineer": "second_engineer",
  "Third Engineer": "third_engineer",
  "3rd Engineer": "third_engineer",
  "Junior Engineer": "junior_engineer",
  "ETO": "eto",
  "AV/IT Engineer": "av_it_engineer",

  // Yacht Crew - Interior
  "Purser": "purser",
  "Interior Manager": "interior_manager",
  "Chief Stew": "chief_stewardess",
  "Chief Stewardess": "chief_stewardess", // legacy alias
  "Head of Service": "head_of_service",
  "Head of House": "head_of_house",
  "Second Stew": "second_stewardess",
  "Second Stewardess": "second_stewardess", // legacy alias
  "2nd Stewardess": "second_stewardess", // legacy alias
  "2nd Stew": "second_stewardess", // legacy alias
  "Third Stew": "third_stewardess",
  "Third Stewardess": "third_stewardess", // legacy alias
  "3rd Stewardess": "third_stewardess", // legacy alias
  "3rd Stew": "third_stewardess", // legacy alias
  "Sole Stew": "sole_stewardess",
  "Sole Stewardess": "sole_stewardess", // legacy alias
  "Experienced Stew": "experienced_stewardess",
  "Experienced Stewardess": "experienced_stewardess", // legacy alias
  "Junior Stew": "junior_stewardess",
  "Junior Stewardess": "junior_stewardess", // legacy alias
  "Stew": "stewardess",
  "Stewardess": "stewardess", // legacy alias
  "Laundry Stew": "laundry_stewardess",
  "Laundry Stewardess": "laundry_stewardess", // legacy alias
  "Cook/Stew": "cook_stew",

  // Yacht Crew - Wellness & Beauty
  "Masseuse": "masseuse",
  "Beautician": "beautician",
  "Hairdresser": "hairdresser",
  "SPA Manager": "spa_manager",
  "Yoga Instructor": "yoga_instructor",
  "Personal Trainer": "personal_trainer",

  // Yacht Crew - Medical
  "Nurse": "nurse",
  "Paramedic": "paramedic",

  // Childcare (shared)
  "Nanny": "nanny",
  "Governess": "governess",

  // Culinary (shared)
  "Head Chef": "head_chef",
  "Second Chef": "second_chef",
  "Sous Chef": "sous_chef",
  "Sole Chef": "sole_chef",
  "Crew Chef": "crew_chef",
  "Chef": "head_chef", // map generic to head chef
  "Chef de Partie": "sous_chef", // legacy alias
  "Private Chef": "head_chef", // legacy alias
  "Galley Hand": "galley_hand",

  // Household Staff - Management
  "Estate Manager": "estate_manager",
  "House Manager": "house_manager",
  "Personal Assistant": "personal_assistant",
  "PA": "personal_assistant",

  // Household Staff - Service
  "Butler": "butler",
  "Head Housekeeper": "housekeeper", // legacy alias
  "Housekeeper": "housekeeper",

  // Household Staff - Outdoor & Maintenance
  "Chauffeur": "chauffeur",
  "Gardener": "gardener",
  "Gardener / Groundskeeper": "gardener", // legacy alias
  "Handyman": "handyman",
  "Maintenance / Handyman": "handyman", // legacy alias

  // Security (shared)
  "Security": "security",
  "Security / Close Protection": "security", // legacy alias

  // Couples (shared)
  "Couple": "couple",
  "Couple (Combined Roles)": "couple", // legacy alias

  // Legacy aliases
  "Laundress": "laundry_stewardess",
};

/**
 * Positions that are primarily yacht crew roles
 * Used to determine which preference field to populate
 */
export const YACHT_POSITIONS = new Set([
  // Deck
  "captain", "chief_officer", "second_officer", "third_officer", "oow",
  "bosun", "lead_deckhand", "experienced_deckhand", "junior_deckhand", "carpenter",
  // Water Sports
  "dive_instructor", "dive_master", "pwc_instructor",
  // Engineering
  "chief_engineer", "second_engineer", "third_engineer", "junior_engineer", "eto", "av_it_engineer",
  // Interior
  "purser", "interior_manager", "chief_stewardess", "head_of_service", "head_of_house",
  "second_stewardess", "third_stewardess", "sole_stewardess", "experienced_stewardess",
  "junior_stewardess", "stewardess", "laundry_stewardess", "cook_stew",
  // Wellness & Beauty
  "masseuse", "beautician", "hairdresser", "spa_manager", "yoga_instructor", "personal_trainer",
  // Medical
  "nurse", "paramedic",
  // Culinary (yacht-specific)
  "crew_chef", "galley_hand",
]);

/**
 * Positions that are primarily household staff roles
 * Used to determine which preference field to populate
 */
export const HOUSEHOLD_POSITIONS = new Set([
  // Management
  "estate_manager", "house_manager", "personal_assistant",
  // Service
  "butler", "housekeeper",
  // Outdoor & Maintenance
  "chauffeur", "gardener", "handyman",
]);

/**
 * Positions that are shared between yacht and household
 * These are set in the preference field matching the candidate_type
 */
export const SHARED_POSITIONS = new Set([
  "nanny", "governess", "head_chef", "second_chef", "sous_chef", "sole_chef", "security", "couple",
]);

/**
 * Determine the industry for a position based on candidate type
 * Returns 'yacht', 'household', or 'both' for shared positions
 */
export function getPositionIndustry(
  position: string,
  candidateType?: string | null
): "yacht" | "household" | "both" {
  const normalizedPosition = mapPositionToDatabaseValue(position);

  if (YACHT_POSITIONS.has(normalizedPosition)) {
    return "yacht";
  }

  if (HOUSEHOLD_POSITIONS.has(normalizedPosition)) {
    return "household";
  }

  // For shared positions, use candidate type to determine preference
  if (SHARED_POSITIONS.has(normalizedPosition)) {
    if (candidateType === "yacht_crew") return "yacht";
    if (candidateType === "household_staff") return "household";
    return "both";
  }

  // Default: use candidate type or both
  if (candidateType === "yacht_crew") return "yacht";
  if (candidateType === "household_staff") return "household";
  return "both";
}

/**
 * Convert position display name to database value
 * If the value is already a database value, return it as-is
 */
export function mapPositionToDatabaseValue(position: string): string {
  if (!position) return "";
  
  // If it's already a database value (lowercase with underscores), return as-is
  if (position.includes("_") || position === position.toLowerCase()) {
    return position;
  }
  
  // Otherwise, map from display name to database value
  return POSITION_DISPLAY_TO_VALUE[position] || position.toLowerCase().replace(/\s+/g, "_");
}


