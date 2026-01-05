/**
 * Position Name Formatting Utilities
 *
 * Converts snake_case position names to human-readable Title Case.
 */

/**
 * Convert a snake_case or lowercase position name to Title Case
 *
 * @example
 * formatPositionName('chief_stewardess') // 'Chief Stewardess'
 * formatPositionName('second_engineer') // 'Second Engineer'
 * formatPositionName('deckhand') // 'Deckhand'
 * formatPositionName('bosun') // 'Bosun'
 */
export function formatPositionName(position: string | null | undefined): string {
  if (!position) {
    return '';
  }

  return position
    // Replace underscores with spaces
    .replace(/_/g, ' ')
    // Capitalize first letter of each word
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Common yacht crew positions with proper display names
 * This can be used as a fallback or for exact matching
 */
export const POSITION_DISPLAY_NAMES: Record<string, string> = {
  // Deck
  captain: 'Captain',
  chief_officer: 'Chief Officer',
  first_officer: 'First Officer',
  second_officer: 'Second Officer',
  third_officer: 'Third Officer',
  bosun: 'Bosun',
  lead_deckhand: 'Lead Deckhand',
  deckhand: 'Deckhand',

  // Engineering
  chief_engineer: 'Chief Engineer',
  second_engineer: 'Second Engineer',
  third_engineer: 'Third Engineer',
  eto: 'ETO',
  electrician: 'Electrician',

  // Interior
  chief_stewardess: 'Chief Stewardess',
  chief_steward: 'Chief Steward',
  second_stewardess: 'Second Stewardess',
  second_steward: 'Second Steward',
  third_stewardess: 'Third Stewardess',
  stewardess: 'Stewardess',
  steward: 'Steward',

  // Culinary
  head_chef: 'Head Chef',
  chef: 'Chef',
  sous_chef: 'Sous Chef',
  cook: 'Cook',

  // Other
  purser: 'Purser',
  nanny: 'Nanny',
  massage_therapist: 'Massage Therapist',
  yoga_instructor: 'Yoga Instructor',
  personal_trainer: 'Personal Trainer',
  dive_instructor: 'Dive Instructor',
  water_sports_instructor: 'Water Sports Instructor',

  // Private Household Staff
  housekeeper: 'Housekeeper',
  butler: 'Butler',
  house_manager: 'House Manager',
  estate_manager: 'Estate Manager',
  personal_assistant: 'Personal Assistant',
  driver: 'Driver',
  security: 'Security',
  gardener: 'Gardener',
};

/**
 * Get display name for a position, using exact match if available,
 * otherwise falling back to formatted version
 */
export function getPositionDisplayName(position: string | null | undefined): string {
  if (!position) {
    return '';
  }

  const normalized = position.toLowerCase().trim();
  return POSITION_DISPLAY_NAMES[normalized] ?? formatPositionName(position);
}
