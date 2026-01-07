/**
 * Maps position display names from registration form to database values
 * Registration form uses display labels (e.g., "Captain", "Chief Officer")
 * Database uses normalized values (e.g., "captain", "first_officer")
 */

export const POSITION_DISPLAY_TO_VALUE: Record<string, string> = {
  // Yacht Crew - Deck
  "Captain": "captain",
  "Chief Officer": "first_officer",
  "2nd Officer": "second_officer",
  "3rd Officer": "third_officer",
  "Bosun": "bosun",
  "Deckhand": "deckhand",
  "Lead Deckhand": "lead_deckhand",
  
  // Yacht Crew - Engineering
  "Chief Engineer": "chief_engineer",
  "2nd Engineer": "second_engineer",
  "ETO": "eto",
  
  // Yacht Crew - Interior
  "Chief Stewardess": "chief_stewardess",
  "2nd Stewardess": "second_stewardess",
  "3rd Stewardess": "third_stewardess",
  "Stewardess": "stewardess",
  "Purser": "purser",
  
  // Culinary
  "Head Chef": "head_chef",
  "Sous Chef": "sous_chef",
  "Chef de Partie": "chef_de_partie",
  "Private Chef": "private_chef",
  
  // Household Staff
  "Estate Manager": "estate_manager",
  "House Manager": "house_manager",
  "Butler": "butler",
  "Head Housekeeper": "head_housekeeper",
  "Housekeeper": "housekeeper",
  "Personal Assistant": "personal_assistant",
  "Nanny": "nanny",
  "Governess": "governess",
  "Chauffeur": "chauffeur",
  "Security / Close Protection": "security",
  "Gardener / Groundskeeper": "gardener",
  "Maintenance / Handyman": "maintenance",
  "Laundress": "laundress",
  "Couple (Combined Roles)": "couple",
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


