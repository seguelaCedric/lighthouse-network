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
  "Chief Stewardess": "chief_stewardess",
  "Chief Stew": "chief_stewardess",
  "Head of Service": "head_of_service",
  "Head of House": "head_of_house",
  "Second Stewardess": "second_stewardess",
  "2nd Stewardess": "second_stewardess",
  "2nd Stew": "second_stewardess",
  "Sole Stewardess": "sole_stewardess",
  "Sole Stew": "sole_stewardess",
  "Experienced Stewardess": "experienced_stewardess",
  "Experienced Stew": "experienced_stewardess",
  "Junior Stewardess": "junior_stewardess",
  "Junior Stew": "junior_stewardess",
  "Stewardess": "junior_stewardess", // map generic to junior
  "3rd Stewardess": "junior_stewardess", // legacy alias
  "Laundry Stewardess": "laundry_stewardess",
  "Laundry Stew": "laundry_stewardess",
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


