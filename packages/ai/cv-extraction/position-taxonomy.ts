// ============================================================================
// POSITION TAXONOMY - Yacht & Villa Crew
// ============================================================================
// Comprehensive position normalization mapping for CV extraction
// ============================================================================

import type { PositionCategory } from './types';

export interface PositionMapping {
  standard: string;
  category: PositionCategory;
}

// ----------------------------------------------------------------------------
// YACHT POSITIONS
// ----------------------------------------------------------------------------

const YACHT_DECK_POSITIONS: Record<string, PositionMapping> = {
  // Captain / Master
  'captain': { standard: 'Captain', category: 'deck' },
  'master': { standard: 'Captain', category: 'deck' },
  'yacht captain': { standard: 'Captain', category: 'deck' },
  'superyacht captain': { standard: 'Captain', category: 'deck' },
  'relief captain': { standard: 'Relief Captain', category: 'deck' },

  // Officers
  'chief officer': { standard: 'Chief Officer', category: 'deck' },
  'first officer': { standard: 'Chief Officer', category: 'deck' },
  'first mate': { standard: 'Chief Officer', category: 'deck' },
  '1st officer': { standard: 'Chief Officer', category: 'deck' },
  '1st mate': { standard: 'Chief Officer', category: 'deck' },
  'mate': { standard: 'Chief Officer', category: 'deck' },

  'second officer': { standard: 'Second Officer', category: 'deck' },
  '2nd officer': { standard: 'Second Officer', category: 'deck' },
  'second mate': { standard: 'Second Officer', category: 'deck' },
  '2nd mate': { standard: 'Second Officer', category: 'deck' },

  'third officer': { standard: 'Third Officer', category: 'deck' },
  '3rd officer': { standard: 'Third Officer', category: 'deck' },
  'third mate': { standard: 'Third Officer', category: 'deck' },
  '3rd mate': { standard: 'Third Officer', category: 'deck' },

  // Bosun
  'bosun': { standard: 'Bosun', category: 'deck' },
  "bo'sun": { standard: 'Bosun', category: 'deck' },
  'boatswain': { standard: 'Bosun', category: 'deck' },

  // Deckhands
  'lead deckhand': { standard: 'Lead Deckhand', category: 'deck' },
  'senior deckhand': { standard: 'Senior Deckhand', category: 'deck' },
  'deckhand': { standard: 'Deckhand', category: 'deck' },
  'deck hand': { standard: 'Deckhand', category: 'deck' },
  'junior deckhand': { standard: 'Junior Deckhand', category: 'deck' },
  'deck/stew': { standard: 'Deckhand/Stewardess', category: 'deck' },
  'deckstew': { standard: 'Deckhand/Stewardess', category: 'deck' },
  'deck stew': { standard: 'Deckhand/Stewardess', category: 'deck' },
};

const YACHT_INTERIOR_POSITIONS: Record<string, PositionMapping> = {
  // Chief Stew
  'chief stew': { standard: 'Chief Stew', category: 'interior' },
  'chief stewardess': { standard: 'Chief Stew', category: 'interior' },
  'head stewardess': { standard: 'Chief Stew', category: 'interior' },
  'head stew': { standard: 'Chief Stew', category: 'interior' },
  'chief steward': { standard: 'Chief Steward', category: 'interior' },

  // Interior Management (distinct roles)
  'interior manager': { standard: 'Interior Manager', category: 'interior' },
  'head of interior': { standard: 'Interior Manager', category: 'interior' },
  'head of house': { standard: 'Head of House', category: 'interior' },
  'head of housekeeping': { standard: 'Head of House', category: 'interior' },
  'head of service': { standard: 'Head of Service', category: 'interior' },

  // Purser
  'purser': { standard: 'Purser', category: 'interior' },
  'chief purser': { standard: 'Purser', category: 'interior' },
  'purser/chief stew': { standard: 'Purser/Chief Stew', category: 'interior' },
  'chief stew/purser': { standard: 'Purser/Chief Stew', category: 'interior' },

  // Second Stew
  'second stew': { standard: 'Second Stew', category: 'interior' },
  'second stewardess': { standard: 'Second Stew', category: 'interior' },
  '2nd stewardess': { standard: 'Second Stew', category: 'interior' },
  '2nd stew': { standard: 'Second Stew', category: 'interior' },

  // Third Stew
  'third stew': { standard: 'Third Stew', category: 'interior' },
  'third stewardess': { standard: 'Third Stew', category: 'interior' },
  '3rd stewardess': { standard: 'Third Stew', category: 'interior' },
  '3rd stew': { standard: 'Third Stew', category: 'interior' },

  // General Stew
  'stew': { standard: 'Stew', category: 'interior' },
  'stewardess': { standard: 'Stew', category: 'interior' },
  'steward': { standard: 'Steward', category: 'interior' },
  'junior stew': { standard: 'Junior Stew', category: 'interior' },
  'junior stewardess': { standard: 'Junior Stew', category: 'interior' },
  'sole stew': { standard: 'Sole Stew', category: 'interior' },
  'sole stewardess': { standard: 'Sole Stew', category: 'interior' },

  // Specialized Interior
  'laundry stew': { standard: 'Laundry Stew', category: 'interior' },
  'laundry stewardess': { standard: 'Laundry Stew', category: 'interior' },
  'laundress': { standard: 'Laundress', category: 'interior' },
  'housekeeping': { standard: 'Housekeeping', category: 'interior' },
  'housekeeper': { standard: 'Housekeeper', category: 'interior' },
  'cabin stew': { standard: 'Cabin Stew', category: 'interior' },
  'cabin stewardess': { standard: 'Cabin Stew', category: 'interior' },
  'service stew': { standard: 'Service Stew', category: 'interior' },
  'service stewardess': { standard: 'Service Stew', category: 'interior' },
};

const YACHT_ENGINEERING_POSITIONS: Record<string, PositionMapping> = {
  // Chief Engineer
  'chief engineer': { standard: 'Chief Engineer', category: 'engineering' },
  'chief eng': { standard: 'Chief Engineer', category: 'engineering' },
  'head engineer': { standard: 'Chief Engineer', category: 'engineering' },

  // Second Engineer
  'second engineer': { standard: 'Second Engineer', category: 'engineering' },
  '2nd engineer': { standard: 'Second Engineer', category: 'engineering' },

  // Third Engineer
  'third engineer': { standard: 'Third Engineer', category: 'engineering' },
  '3rd engineer': { standard: 'Third Engineer', category: 'engineering' },

  // General Engineer
  'engineer': { standard: 'Engineer', category: 'engineering' },
  'junior engineer': { standard: 'Junior Engineer', category: 'engineering' },
  'sole engineer': { standard: 'Sole Engineer', category: 'engineering' },

  // ETO
  'eto': { standard: 'ETO', category: 'engineering' },
  'electro technical officer': { standard: 'ETO', category: 'engineering' },
  'electro-technical officer': { standard: 'ETO', category: 'engineering' },
  'electrical engineer': { standard: 'ETO', category: 'engineering' },
  'electronics engineer': { standard: 'ETO', category: 'engineering' },
  'av/it': { standard: 'AV/IT Technician', category: 'engineering' },
  'av it': { standard: 'AV/IT Technician', category: 'engineering' },
  'av/it technician': { standard: 'AV/IT Technician', category: 'engineering' },
};

const YACHT_GALLEY_POSITIONS: Record<string, PositionMapping> = {
  // Head Chef
  'head chef': { standard: 'Head Chef', category: 'galley' },
  'executive chef': { standard: 'Head Chef', category: 'galley' },
  'chef de cuisine': { standard: 'Head Chef', category: 'galley' },

  // Chef
  'chef': { standard: 'Chef', category: 'galley' },
  'yacht chef': { standard: 'Chef', category: 'galley' },
  'private chef': { standard: 'Chef', category: 'galley' },
  'sole chef': { standard: 'Sole Chef', category: 'galley' },

  // Sous Chef
  'sous chef': { standard: 'Sous Chef', category: 'galley' },
  'second chef': { standard: 'Sous Chef', category: 'galley' },
  '2nd chef': { standard: 'Sous Chef', category: 'galley' },
  'junior chef': { standard: 'Junior Chef', category: 'galley' },

  // Other Galley
  'crew chef': { standard: 'Crew Chef', category: 'galley' },
  'cook': { standard: 'Cook', category: 'galley' },
  'galley hand': { standard: 'Galley Hand', category: 'galley' },
  'pastry chef': { standard: 'Pastry Chef', category: 'galley' },
};

// ----------------------------------------------------------------------------
// VILLA/ESTATE POSITIONS
// ----------------------------------------------------------------------------

const VILLA_MANAGEMENT_POSITIONS: Record<string, PositionMapping> = {
  // Estate/Villa Management
  'estate manager': { standard: 'Estate Manager', category: 'villa' },
  'house manager': { standard: 'House Manager', category: 'villa' },
  'villa manager': { standard: 'Villa Manager', category: 'villa' },
  'property manager': { standard: 'Property Manager', category: 'villa' },
  'household manager': { standard: 'House Manager', category: 'villa' },
  'residence manager': { standard: 'House Manager', category: 'villa' },
  'chalet manager': { standard: 'Chalet Manager', category: 'villa' },
  'chalet host': { standard: 'Chalet Host', category: 'villa' },
  'lodge manager': { standard: 'Lodge Manager', category: 'villa' },

  // Couple Positions
  'domestic couple': { standard: 'Domestic Couple', category: 'villa' },
  'house couple': { standard: 'Domestic Couple', category: 'villa' },
  'caretaker couple': { standard: 'Caretaker Couple', category: 'villa' },
  'caretaker': { standard: 'Caretaker', category: 'villa' },
};

const VILLA_SERVICE_POSITIONS: Record<string, PositionMapping> = {
  // Butler
  'butler': { standard: 'Butler', category: 'villa' },
  'head butler': { standard: 'Head Butler', category: 'villa' },
  'under butler': { standard: 'Under Butler', category: 'villa' },
  'junior butler': { standard: 'Junior Butler', category: 'villa' },
  'trainee butler': { standard: 'Trainee Butler', category: 'villa' },
  'valet': { standard: 'Valet', category: 'villa' },

  // Housekeeping
  'head housekeeper': { standard: 'Head Housekeeper', category: 'villa' },
  'housekeeper': { standard: 'Housekeeper', category: 'villa' },
  'executive housekeeper': { standard: 'Executive Housekeeper', category: 'villa' },
  'housekeeping supervisor': { standard: 'Housekeeping Supervisor', category: 'villa' },
  'housemaid': { standard: 'Housemaid', category: 'villa' },
  'maid': { standard: 'Housemaid', category: 'villa' },
  'houseman': { standard: 'Houseman', category: 'villa' },
  'laundress': { standard: 'Laundress', category: 'villa' },
};

const VILLA_CULINARY_POSITIONS: Record<string, PositionMapping> = {
  // Private Chef
  'private chef': { standard: 'Private Chef', category: 'villa' },
  'personal chef': { standard: 'Personal Chef', category: 'villa' },
  'family chef': { standard: 'Family Chef', category: 'villa' },
  'estate chef': { standard: 'Estate Chef', category: 'villa' },
  'villa chef': { standard: 'Villa Chef', category: 'villa' },
  'chalet chef': { standard: 'Chalet Chef', category: 'villa' },
  'private cook': { standard: 'Private Cook', category: 'villa' },
};

const VILLA_SUPPORT_POSITIONS: Record<string, PositionMapping> = {
  // Chauffeur
  'chauffeur': { standard: 'Chauffeur', category: 'villa' },
  'driver': { standard: 'Driver', category: 'villa' },
  'personal driver': { standard: 'Personal Driver', category: 'villa' },

  // Grounds
  'gardener': { standard: 'Gardener', category: 'villa' },
  'head gardener': { standard: 'Head Gardener', category: 'villa' },
  'groundskeeper': { standard: 'Groundskeeper', category: 'villa' },
  'estate worker': { standard: 'Estate Worker', category: 'villa' },

  // Technical
  'pool technician': { standard: 'Pool Technician', category: 'villa' },
  'pool man': { standard: 'Pool Technician', category: 'villa' },
  'handyman': { standard: 'Handyman', category: 'villa' },
  'maintenance manager': { standard: 'Maintenance Manager', category: 'villa' },
  'estate technician': { standard: 'Estate Technician', category: 'villa' },
};

// ----------------------------------------------------------------------------
// CHILDCARE POSITIONS
// ----------------------------------------------------------------------------

const CHILDCARE_POSITIONS: Record<string, PositionMapping> = {
  'nanny': { standard: 'Nanny', category: 'childcare' },
  'head nanny': { standard: 'Head Nanny', category: 'childcare' },
  'senior nanny': { standard: 'Senior Nanny', category: 'childcare' },
  'junior nanny': { standard: 'Junior Nanny', category: 'childcare' },
  'live-in nanny': { standard: 'Live-in Nanny', category: 'childcare' },
  'live-out nanny': { standard: 'Live-out Nanny', category: 'childcare' },
  'traveling nanny': { standard: 'Traveling Nanny', category: 'childcare' },
  'governess': { standard: 'Governess', category: 'childcare' },
  'au pair': { standard: 'Au Pair', category: 'childcare' },
  'tutor': { standard: 'Tutor', category: 'childcare' },
  'private tutor': { standard: 'Private Tutor', category: 'childcare' },
  'maternity nurse': { standard: 'Maternity Nurse', category: 'childcare' },
  'night nurse': { standard: 'Night Nurse', category: 'childcare' },
  'newborn care specialist': { standard: 'Newborn Care Specialist', category: 'childcare' },
  'mothers help': { standard: "Mother's Help", category: 'childcare' },
  "mother's help": { standard: "Mother's Help", category: 'childcare' },
};

// ----------------------------------------------------------------------------
// SECURITY POSITIONS
// ----------------------------------------------------------------------------

const SECURITY_POSITIONS: Record<string, PositionMapping> = {
  'security officer': { standard: 'Security Officer', category: 'security' },
  'security guard': { standard: 'Security Officer', category: 'security' },
  'security': { standard: 'Security Officer', category: 'security' },
  'security manager': { standard: 'Security Manager', category: 'security' },
  'head of security': { standard: 'Head of Security', category: 'security' },
  'cpo': { standard: 'Close Protection Officer', category: 'security' },
  'close protection officer': { standard: 'Close Protection Officer', category: 'security' },
  'close protection': { standard: 'Close Protection Officer', category: 'security' },
  'bodyguard': { standard: 'Close Protection Officer', category: 'security' },
  'personal protection': { standard: 'Close Protection Officer', category: 'security' },
};

// ----------------------------------------------------------------------------
// MEDICAL POSITIONS
// ----------------------------------------------------------------------------

const MEDICAL_POSITIONS: Record<string, PositionMapping> = {
  'nurse': { standard: 'Nurse', category: 'medical' },
  'rn': { standard: 'Registered Nurse', category: 'medical' },
  'registered nurse': { standard: 'Registered Nurse', category: 'medical' },
  'medic': { standard: 'Medic', category: 'medical' },
  'ship medic': { standard: 'Ship Medic', category: 'medical' },
  'yacht medic': { standard: 'Yacht Medic', category: 'medical' },
  'paramedic': { standard: 'Paramedic', category: 'medical' },
  'emt': { standard: 'EMT', category: 'medical' },
  'doctor': { standard: 'Doctor', category: 'medical' },
  'physician': { standard: 'Physician', category: 'medical' },
};

// ----------------------------------------------------------------------------
// MANAGEMENT POSITIONS
// ----------------------------------------------------------------------------

const MANAGEMENT_POSITIONS: Record<string, PositionMapping> = {
  // Yacht Management
  'yacht manager': { standard: 'Yacht Manager', category: 'management' },
  'fleet manager': { standard: 'Fleet Manager', category: 'management' },

  // Personal Assistant
  'personal assistant': { standard: 'Personal Assistant', category: 'management' },
  'pa': { standard: 'Personal Assistant', category: 'management' },
  'executive pa': { standard: 'Executive PA', category: 'management' },
  'executive assistant': { standard: 'Executive Assistant', category: 'management' },
  'ea': { standard: 'Executive Assistant', category: 'management' },

  // Family Office
  'family office manager': { standard: 'Family Office Manager', category: 'management' },
  'chief of staff': { standard: 'Chief of Staff', category: 'management' },
  'private secretary': { standard: 'Private Secretary', category: 'management' },
};

// ----------------------------------------------------------------------------
// OTHER POSITIONS
// ----------------------------------------------------------------------------

const WELLNESS_POSITIONS: Record<string, PositionMapping> = {
  // Spa/Massage
  'spa therapist': { standard: 'Spa Therapist', category: 'wellness' },
  'spa manager': { standard: 'Spa Manager', category: 'wellness' },
  'massage therapist': { standard: 'Massage Therapist', category: 'wellness' },
  'masseuse': { standard: 'Massage Therapist', category: 'wellness' },

  // Beauty
  'beautician': { standard: 'Beautician', category: 'wellness' },
  'aesthetician': { standard: 'Aesthetician', category: 'wellness' },
  'beauty therapist': { standard: 'Beauty Therapist', category: 'wellness' },
  'hairdresser': { standard: 'Hairdresser', category: 'wellness' },
  'hair stylist': { standard: 'Hair Stylist', category: 'wellness' },

  // Fitness
  'personal trainer': { standard: 'Personal Trainer', category: 'wellness' },
  'fitness instructor': { standard: 'Fitness Instructor', category: 'wellness' },
  'yoga instructor': { standard: 'Yoga Instructor', category: 'wellness' },
  'pilates instructor': { standard: 'Pilates Instructor', category: 'wellness' },
};

const OTHER_POSITIONS: Record<string, PositionMapping> = {
  // Diving
  'dive instructor': { standard: 'Dive Instructor', category: 'other' },
  'divemaster': { standard: 'Divemaster', category: 'other' },
  'dive master': { standard: 'Divemaster', category: 'other' },

  // Water Sports
  'water sports instructor': { standard: 'Water Sports Instructor', category: 'other' },
  'watersports instructor': { standard: 'Water Sports Instructor', category: 'other' },
  'jet ski instructor': { standard: 'Water Sports Instructor', category: 'other' },

  // Other
  'florist': { standard: 'Florist', category: 'other' },
  'photographer': { standard: 'Photographer', category: 'other' },
};

// ----------------------------------------------------------------------------
// COMBINED TAXONOMY
// ----------------------------------------------------------------------------

export const POSITION_TAXONOMY: Record<string, PositionMapping> = {
  // Yacht
  ...YACHT_DECK_POSITIONS,
  ...YACHT_INTERIOR_POSITIONS,
  ...YACHT_ENGINEERING_POSITIONS,
  ...YACHT_GALLEY_POSITIONS,

  // Villa
  ...VILLA_MANAGEMENT_POSITIONS,
  ...VILLA_SERVICE_POSITIONS,
  ...VILLA_CULINARY_POSITIONS,
  ...VILLA_SUPPORT_POSITIONS,

  // Specialized
  ...CHILDCARE_POSITIONS,
  ...SECURITY_POSITIONS,
  ...MEDICAL_POSITIONS,
  ...MANAGEMENT_POSITIONS,
  ...WELLNESS_POSITIONS,
  ...OTHER_POSITIONS,
};

// ----------------------------------------------------------------------------
// NORMALIZATION FUNCTION
// ----------------------------------------------------------------------------

/**
 * Normalize a position title to a standard form
 * Returns both the normalized title and the category
 */
export function normalizePosition(rawTitle: string): PositionMapping | null {
  if (!rawTitle) return null;

  const normalized = rawTitle.toLowerCase().trim();

  // Direct match
  if (POSITION_TAXONOMY[normalized]) {
    return POSITION_TAXONOMY[normalized];
  }

  // Try partial matches (e.g., "2nd stew/purser" contains "purser")
  for (const [key, value] of Object.entries(POSITION_TAXONOMY)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  // No match found - return with 'other' category
  return null;
}

/**
 * Get all standard positions for a category
 */
export function getPositionsForCategory(category: PositionCategory): string[] {
  const positions = new Set<string>();
  for (const mapping of Object.values(POSITION_TAXONOMY)) {
    if (mapping.category === category) {
      positions.add(mapping.standard);
    }
  }
  return Array.from(positions).sort();
}

/**
 * Get all unique standard position names
 */
export function getAllStandardPositions(): string[] {
  const positions = new Set<string>();
  for (const mapping of Object.values(POSITION_TAXONOMY)) {
    positions.add(mapping.standard);
  }
  return Array.from(positions).sort();
}

/**
 * Get all categories
 */
export function getAllCategories(): PositionCategory[] {
  return [
    'deck',
    'interior',
    'engineering',
    'galley',
    'villa',
    'childcare',
    'security',
    'medical',
    'management',
    'wellness',
    'other',
  ];
}
