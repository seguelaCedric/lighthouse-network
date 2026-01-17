/**
 * License Display Names
 *
 * Maps canonical snake_case license values (used in backend/database)
 * to human-readable display names for the frontend.
 *
 * Backend: "master_3000gt" (for reliable filtering)
 * Frontend: "Master 3000GT" (for human readability)
 */

export const LICENSE_DISPLAY_NAMES: Record<string, string> = {
  // Deck licenses - basic
  powerboat_level_2: 'Powerboat Level 2',
  day_skipper: 'Day Skipper',
  coastal_skipper: 'Coastal Skipper',
  yacht_rating: 'Yacht Rating',

  // Deck licenses - Yachtmaster
  yachtmaster_coastal: 'Yachtmaster Coastal',
  yachtmaster_offshore: 'Yachtmaster Offshore',
  yachtmaster_ocean: 'Yachtmaster Ocean',

  // Deck licenses - OOW (Officer of the Watch)
  ow_500gt: 'OOW 500GT',
  ow_3000gt: 'OOW 3000GT',
  ow_unlimited: 'OOW Unlimited',

  // Deck licenses - Chief Mate
  chief_mate_500gt: 'Chief Mate 500GT',
  chief_mate_3000gt: 'Chief Mate 3000GT',
  chief_mate_unlimited: 'Chief Mate Unlimited',

  // Deck licenses - Master
  master_200gt: 'Master 200GT',
  master_500gt: 'Master 500GT',
  master_3000gt: 'Master 3000GT',
  master_unlimited: 'Master Unlimited',

  // Engineering licenses - Entry level
  aec: 'AEC (Approved Engine Course)',
  meol: 'MEOL',

  // Engineering licenses - Yacht tickets
  y4: 'Y4',
  y3: 'Y3',
  y2: 'Y2',
  y1: 'Y1',

  // Engineering licenses - EOOW
  eoow: 'EOOW',

  // Engineering licenses - Officers
  third_engineer: 'Third Engineer',
  second_engineer_3000kw: 'Second Engineer 3000kW',
  second_engineer_unlimited: 'Second Engineer Unlimited',
  chief_engineer_3000kw: 'Chief Engineer 3000kW',
  chief_engineer_9000kw: 'Chief Engineer 9000kW',
  chief_engineer_unlimited: 'Chief Engineer Unlimited',

  // Medical/Safety certificates (sometimes stored as licenses)
  eng1: 'ENG1 Medical',
  stcw: 'STCW',
};

/**
 * Get human-readable display name for a license
 * Falls back to title-casing the snake_case value if not in map
 */
export function getLicenseDisplayName(canonicalLicense: string | null | undefined): string {
  if (!canonicalLicense) return '';

  // Check if we have a display name mapping
  if (LICENSE_DISPLAY_NAMES[canonicalLicense]) {
    return LICENSE_DISPLAY_NAMES[canonicalLicense];
  }

  // Fallback: Convert snake_case to Title Case
  return canonicalLicense
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get all licenses with their display names
 * Useful for dropdowns/select inputs
 */
export function getAllLicensesWithDisplayNames(): Array<{ value: string; label: string }> {
  return Object.entries(LICENSE_DISPLAY_NAMES).map(([value, label]) => ({
    value,
    label,
  }));
}

/**
 * Get deck licenses only (for deck officer positions)
 */
export function getDeckLicenses(): Array<{ value: string; label: string }> {
  const deckLicenses = [
    'powerboat_level_2',
    'day_skipper',
    'coastal_skipper',
    'yacht_rating',
    'yachtmaster_coastal',
    'yachtmaster_offshore',
    'yachtmaster_ocean',
    'ow_500gt',
    'ow_3000gt',
    'ow_unlimited',
    'chief_mate_500gt',
    'chief_mate_3000gt',
    'chief_mate_unlimited',
    'master_200gt',
    'master_500gt',
    'master_3000gt',
    'master_unlimited',
  ];

  return deckLicenses.map(value => ({
    value,
    label: LICENSE_DISPLAY_NAMES[value] || value,
  }));
}

/**
 * Get engineering licenses only (for engineering positions)
 */
export function getEngineeringLicenses(): Array<{ value: string; label: string }> {
  const engLicenses = [
    'aec',
    'meol',
    'y4',
    'y3',
    'y2',
    'y1',
    'eoow',
    'third_engineer',
    'second_engineer_3000kw',
    'second_engineer_unlimited',
    'chief_engineer_3000kw',
    'chief_engineer_9000kw',
    'chief_engineer_unlimited',
  ];

  return engLicenses.map(value => ({
    value,
    label: LICENSE_DISPLAY_NAMES[value] || value,
  }));
}
