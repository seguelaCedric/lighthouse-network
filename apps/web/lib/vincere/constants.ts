/**
 * Vincere Constants and Field Mappings
 *
 * Contains exact custom field keys from the Lighthouse Vincere tenant.
 */

/**
 * Vincere candidate custom field keys
 * These are the exact field_key values from the Lighthouse Vincere tenant
 */
export const VINCERE_FIELD_KEYS = {
  secondNationality: 'd863391eddef6865b5d78e13d6a688ed',
  smoker: 'ce39bf25a1afb59679cd63988813e64d',
  tattoos: '9c7677f6b79f526fe57b76558941b475',
  tattooLocation: 'a833bdb7288a6f12384e9d1ec23a0579',
  maritalStatus: '768f3644fbf76cf6c18185238566f108',
  partnerName: '4b954494016e2b840f6b1f14a835b332',
  partnerPosition: 'ee670a88fe0c4e2cf424aa6e1fbea5bd',
  couplePosition: 'e322dfbcbb52e1d3f4a3407cfe0cdbba',
  schengenVisa: '1b3980ec75cfc38c2a809f4308346b47',
  b1b2: 'f2ddc9e39b35108ac88539dc6963c4d9',
  eng1: '888d240c45a4c239dc6626c025c805d1',
  stcw: 'c660a4158d8d11f2e2aa1f84db8a52f6',
  contractType: '68df45f3ddb75e93afa7b9f8d66c17bd',
  highestLicence: '83f3f9dc58b5fc1d0b7d591fd82f001b',
  secondLicence: '80429528339faa3362600dedfcb72d9d',
  yachtSize: '37c70d9ff937132692788d7b6fd85a8c',
  desiredSalary: '5d15d9dcdc2eea6ca016960b061e9261',
  yachtType: '7763f7fceda588cc9c5298412dbe7ea7',
  startDate: '03f76b1a428a834d5da30b705b01c574',
  interviewNotes: 'e5b402a60252d0177afe8c5236b3f7b5',
  desiredLocation: '9d00638dd03d9a54ba1ea66c48008bd0',
} as const;

/**
 * Vincere industry IDs for filtering yacht/villa jobs
 */
export const VINCERE_INDUSTRY_IDS = {
  yacht: 28884,
  villa: 28886,
} as const;

/**
 * Vincere system IDs
 */
export const VINCERE_SYSTEM_IDS = {
  candidateSourceNetwork: 29105, // Source ID for Network portal self-registrations
  defaultCreatorId: 28959, // Default recruiter/creator ID
} as const;

/**
 * Yes/No/Other dropdown value mappings
 */
export const VINCERE_YES_NO_VALUES = {
  yes: 1,
  no: 2,
  social: 3, // For smoker field
  flexible: 3, // For couple position field
} as const;

/**
 * Marital status dropdown values
 */
export const VINCERE_MARITAL_STATUS_VALUES = {
  single: 1,
  married: 2,
  inRelationship: 3,
} as const;

/**
 * Contract type dropdown values
 */
export const VINCERE_CONTRACT_TYPE_VALUES = {
  permanent: 1,
  rotational: 2,
  seasonal: 3,
  freelance: 4,
} as const;

/**
 * Yacht type dropdown values
 */
export const VINCERE_YACHT_TYPE_VALUES = {
  motor: 1,
  sailing: 2,
} as const;

/**
 * Reverse mapping: Vincere value to our value
 */
export const VINCERE_MARITAL_STATUS_MAP: Record<number, string> = {
  1: 'single',
  2: 'married',
  3: 'in_relationship',
};

export const VINCERE_CONTRACT_TYPE_MAP: Record<number, string> = {
  1: 'permanent',
  2: 'rotational',
  3: 'seasonal',
  4: 'freelance',
};

export const VINCERE_YACHT_TYPE_MAP: Record<number, string> = {
  1: 'motor',
  2: 'sailing',
};

/**
 * Nationality mapping (Vincere ID -> Nationality string)
 */
export const VINCERE_NATIONALITY_MAP: Record<number, string> = {
  1: 'Afghan', 2: 'Albanian', 3: 'Algerian', 4: 'American', 5: 'Andorran',
  6: 'Angolan', 7: 'Antiguan', 8: 'Argentinean', 9: 'Armenian', 10: 'Australian',
  11: 'Austrian', 12: 'Azerbaijani', 13: 'Bahamian', 14: 'Bahraini', 15: 'Bangladeshi',
  16: 'Barbadian', 17: 'Barbudans', 18: 'Batswana', 19: 'Belarusian', 20: 'Belgian',
  21: 'Belizean', 22: 'Beninese', 23: 'Bhutanese', 24: 'Bolivian',
  25: 'Bosnian or Herzegovinian', 26: 'Brazilian', 27: 'British', 28: 'Bruneian',
  29: 'Bulgarian', 30: 'Burkinan', 31: 'Burmese', 32: 'Burundian', 33: 'Cambodian',
  34: 'Cameroonian', 35: 'Canadian', 36: 'Cabo Verdean', 37: 'Central African',
  38: 'Chadian', 39: 'Chilean', 40: 'Chinese', 41: 'Colombian', 42: 'Comoran',
  43: 'Congolese (Congo)', 44: 'Costa Rican', 45: 'Croatian', 46: 'Cuban',
  47: 'Cypriot', 48: 'Czech', 49: 'Danish', 50: 'Djiboutian', 51: 'Dominican',
  52: 'Dutch', 53: 'Ecuadorean', 54: 'Egyptian', 55: 'Emirati', 56: 'Estonian',
  57: 'Ethiopian', 58: 'Fijian', 59: 'Filipino', 60: 'Finnish', 61: 'French',
  62: 'Gabonese', 63: 'Gambian', 64: 'Georgian', 65: 'German', 66: 'Greek',
  67: 'Grenadian', 68: 'Guatemalan', 69: 'Guinea-Bissauan', 70: 'Guinean',
  71: 'Guyanese', 72: 'Haitian', 73: 'Herzegovinian', 74: 'Honduran',
  75: 'Hungarian', 76: 'Icelandic', 77: 'Indian', 78: 'Indonesian', 79: 'Iranian',
  80: 'Iraqi', 81: 'Irish', 82: 'Israeli', 83: 'Italian', 84: 'Ivorian',
  85: 'Jamaican', 86: 'Japanese', 87: 'Jordanian', 88: 'Kazakhstani', 89: 'Kenyan',
  90: 'Kiribati', 91: 'Kuwaiti', 92: 'Kyrgyzstani', 93: 'Lao', 94: 'Latvian',
  95: 'Lebanese', 96: 'Liberian', 97: 'Libyan', 98: 'Liechtenstein', 99: 'Lithuanian',
  100: 'Luxembourgish', 101: 'Macedonian', 102: 'Malagasy', 103: 'Malawian',
  104: 'Malaysian', 105: 'Maldivian', 106: 'Malian', 107: 'Maltese',
  108: 'Marshallese', 109: 'Mauritanian', 110: 'Mauritian', 111: 'Mexican',
  112: 'Micronesian', 113: 'Moldovan', 114: 'Monacan', 115: 'Mongolian',
  116: 'Moroccan', 117: 'Mozambican', 118: 'Namibian', 119: 'Nepalese',
  120: 'New Zealander', 121: 'Nicaraguan', 122: 'Nigerian', 123: 'North Korean',
  124: 'Northern Irish', 125: 'Norwegian', 126: 'Omani', 127: 'Pakistani',
  128: 'Palauan', 129: 'Panamanian', 130: 'Papua New Guinean', 131: 'Paraguayan',
  132: 'Peruvian', 133: 'Polish', 134: 'Portuguese', 135: 'Qatari', 136: 'Romanian',
  137: 'Russian', 138: 'Rwandan', 139: 'Saint Lucian', 140: 'Salvadoran',
  141: 'Samoan', 142: 'San Marinese', 143: 'Saudi', 144: 'Scottish',
  145: 'Senegalese', 146: 'Serbian', 147: 'Seychellois', 148: 'Sierra Leonean',
  149: 'Singaporean', 150: 'Slovakian', 151: 'Slovenian', 152: 'Solomon Islander',
  153: 'Somali', 154: 'South African', 155: 'South Korean', 156: 'Spanish',
  157: 'Sri Lankan', 158: 'Swazi', 159: 'Swedish', 160: 'Swiss', 161: 'Syrian',
  162: 'Taiwanese', 163: 'Tanzanian', 164: 'Thai', 165: 'Togolese', 166: 'Tongan',
  167: 'Trinidadian or Tobagonian', 168: 'Tunisian', 169: 'Turkish',
  170: 'Tuvaluan', 171: 'Ugandan', 172: 'Ukrainian', 173: 'Uruguayan',
  174: 'Uzbekistani', 175: 'Venezuelan', 176: 'Vietnamese', 177: 'Welsh',
  178: 'Zambian', 179: 'Zimbabwean',
};

/**
 * Reverse nationality mapping (Nationality string -> Vincere ID)
 */
export const NATIONALITY_TO_VINCERE_ID: Record<string, number> = Object.fromEntries(
  Object.entries(VINCERE_NATIONALITY_MAP).map(([k, v]) => [v.toLowerCase(), parseInt(k)])
);

/**
 * Nationality name to ISO 3166-1 alpha-2 country code mapping
 * Used to convert full nationality names to the format Vincere expects
 *
 * Complete mapping based on ISO 3166-1 alpha-2 codes
 * Last updated: 2026-01-09
 */
export const NATIONALITY_TO_ISO_CODE: Record<string, string> = {
  // A
  'afghan': 'AF',
  'albanian': 'AL',
  'algerian': 'DZ',
  'american': 'US',
  'andorran': 'AD',
  'angolan': 'AO',
  'antiguan': 'AG',
  'argentinean': 'AR',
  'argentine': 'AR',
  'argentinian': 'AR',
  'armenian': 'AM',
  'australian': 'AU',
  'austrian': 'AT',
  'azerbaijani': 'AZ',

  // B
  'bahamian': 'BS',
  'bahraini': 'BH',
  'bangladeshi': 'BD',
  'barbadian': 'BB',
  'barbudans': 'AG',
  'batswana': 'BW',
  'belarusian': 'BY',
  'belgian': 'BE',
  'belizean': 'BZ',
  'beninese': 'BJ',
  'bhutanese': 'BT',
  'bolivian': 'BO',
  'bosnian': 'BA',
  'bosnian or herzegovinian': 'BA',
  'brazilian': 'BR',
  'british': 'GB',
  'uk/british': 'GB',
  'bruneian': 'BN',
  'bulgarian': 'BG',
  'burkinan': 'BF',
  'burmese': 'MM',
  'burundian': 'BI',

  // C
  'cabo verdean': 'CV',
  'cambodian': 'KH',
  'cameroonian': 'CM',
  'canadian': 'CA',
  'central african': 'CF',
  'chadian': 'TD',
  'chilean': 'CL',
  'chinese': 'CN',
  'colombian': 'CO',
  'comoran': 'KM',
  'congolese': 'CG',
  'congolese (congo)': 'CG',
  'costa rican': 'CR',
  'croatian': 'HR',
  'cuban': 'CU',
  'cypriot': 'CY',
  'czech': 'CZ',

  // D
  'danish': 'DK',
  'djiboutian': 'DJ',
  'dominican': 'DO',
  'dutch': 'NL',

  // E
  'ecuadorean': 'EC',
  'ecuadorian': 'EC',
  'egyptian': 'EG',
  'emirati': 'AE',
  'equatorial guinean': 'GQ',
  'eritrean': 'ER',
  'estonian': 'EE',
  'ethiopian': 'ET',

  // F
  'fijian': 'FJ',
  'filipino': 'PH',
  'finnish': 'FI',
  'french': 'FR',

  // G
  'gabonese': 'GA',
  'gambian': 'GM',
  'georgian': 'GE',
  'german': 'DE',
  'ghanaian': 'GH',
  'greek': 'GR',
  'grenadian': 'GD',
  'guatemalan': 'GT',
  'guinea-bissauan': 'GW',
  'guinean': 'GN',
  'guyanese': 'GY',

  // H
  'haitian': 'HT',
  'herzegovinian': 'BA',
  'honduran': 'HN',
  'hungarian': 'HU',

  // I
  'icelandic': 'IS',
  'indian': 'IN',
  'indonesian': 'ID',
  'iranian': 'IR',
  'iraqi': 'IQ',
  'irish': 'IE',
  'israeli': 'IL',
  'italian': 'IT',
  'ivorian': 'CI',

  // J
  'jamaican': 'JM',
  'japanese': 'JP',
  'jordanian': 'JO',

  // K
  'kazakhstani': 'KZ',
  'kenyan': 'KE',
  'kiribati': 'KI',
  'korean': 'KR',
  'kuwaiti': 'KW',
  'kyrgyzstani': 'KG',

  // L
  'lao': 'LA',
  'laotian': 'LA',
  'latvian': 'LV',
  'lebanese': 'LB',
  'liberian': 'LR',
  'libyan': 'LY',
  'liechtenstein': 'LI',
  'liechtensteiner': 'LI',
  'lithuanian': 'LT',
  'luxembourgish': 'LU',
  'luxembourger': 'LU',

  // M
  'macedonian': 'MK',
  'malagasy': 'MG',
  'malawian': 'MW',
  'malaysian': 'MY',
  'maldivian': 'MV',
  'malian': 'ML',
  'maltese': 'MT',
  'marshallese': 'MH',
  'mauritanian': 'MR',
  'mauritian': 'MU',
  'mexican': 'MX',
  'micronesian': 'FM',
  'moldovan': 'MD',
  'monacan': 'MC',
  'monegasque': 'MC',
  'mongolian': 'MN',
  'montenegrin': 'ME',
  'moroccan': 'MA',
  'mozambican': 'MZ',

  // N
  'namibian': 'NA',
  'nauruan': 'NR',
  'nepalese': 'NP',
  'nepali': 'NP',
  'new zealander': 'NZ',
  'nicaraguan': 'NI',
  'nigerian': 'NG',
  'nigerien': 'NE',
  'north korean': 'KP',
  'northern irish': 'GB',
  'norwegian': 'NO',

  // O
  'omani': 'OM',

  // P
  'pakistani': 'PK',
  'palauan': 'PW',
  'palestinian': 'PS',
  'panamanian': 'PA',
  'papua new guinean': 'PG',
  'paraguayan': 'PY',
  'peruvian': 'PE',
  'polish': 'PL',
  'portuguese': 'PT',

  // Q
  'qatari': 'QA',

  // R
  'romanian': 'RO',
  'russian': 'RU',
  'rwandan': 'RW',

  // S
  'saint lucian': 'LC',
  'salvadoran': 'SV',
  'samoan': 'WS',
  'san marinese': 'SM',
  'saudi': 'SA',
  'saudi arabian': 'SA',
  'scottish': 'GB',
  'senegalese': 'SN',
  'serbian': 'RS',
  'seychellois': 'SC',
  'sierra leonean': 'SL',
  'singaporean': 'SG',
  'slovakian': 'SK',
  'slovak': 'SK',
  'slovenian': 'SI',
  'solomon islander': 'SB',
  'somali': 'SO',
  'south african': 'ZA',
  'south korean': 'KR',
  'spanish': 'ES',
  'sri lankan': 'LK',
  'sudanese': 'SD',
  'surinamese': 'SR',
  'swazi': 'SZ',
  'swedish': 'SE',
  'swiss': 'CH',
  'syrian': 'SY',

  // T
  'taiwanese': 'TW',
  'tajikistani': 'TJ',
  'tanzanian': 'TZ',
  'thai': 'TH',
  'togolese': 'TG',
  'tongan': 'TO',
  'trinidadian': 'TT',
  'trinidadian or tobagonian': 'TT',
  'tunisian': 'TN',
  'turkish': 'TR',
  'turkmen': 'TM',
  'tuvaluan': 'TV',

  // U
  'ugandan': 'UG',
  'ukrainian': 'UA',
  'uruguayan': 'UY',
  'uzbekistani': 'UZ',

  // V
  'vanuatuan': 'VU',
  'venezuelan': 'VE',
  'vietnamese': 'VN',

  // W
  'welsh': 'GB',

  // Y
  'yemeni': 'YE',

  // Z
  'zambian': 'ZM',
  'zimbabwean': 'ZW',
};

/**
 * Convert a nationality string to ISO country code
 * Handles both full names ("French") and existing codes ("FR")
 */
export function toISOCountryCode(nationality: string | null | undefined): string | null {
  if (!nationality) return null;

  const trimmed = nationality.trim();

  // If it's already a 2-letter code, return it uppercase
  if (trimmed.length === 2) {
    return trimmed.toUpperCase();
  }

  // Look up in our mapping
  const code = NATIONALITY_TO_ISO_CODE[trimmed.toLowerCase()];
  if (code) return code;

  // If we can't find it, return the original (it might work)
  return trimmed;
}

/**
 * Position standardization mapping
 */
export const POSITION_MAPPING: Record<string, { standard: string; category: string }> = {
  // Deck
  'captain': { standard: 'Captain', category: 'deck' },
  'master': { standard: 'Captain', category: 'deck' },
  'chief officer': { standard: 'Chief Officer', category: 'deck' },
  'first officer': { standard: 'Chief Officer', category: 'deck' },
  'first mate': { standard: 'Chief Officer', category: 'deck' },
  '2nd officer': { standard: 'Second Officer', category: 'deck' },
  'second officer': { standard: 'Second Officer', category: 'deck' },
  'third officer': { standard: 'Third Officer', category: 'deck' },
  'bosun': { standard: 'Bosun', category: 'deck' },
  'lead deckhand': { standard: 'Lead Deckhand', category: 'deck' },
  'senior deckhand': { standard: 'Senior Deckhand', category: 'deck' },
  'deckhand': { standard: 'Deckhand', category: 'deck' },
  'junior deckhand': { standard: 'Junior Deckhand', category: 'deck' },

  // Interior
  'chief stewardess': { standard: 'Chief Stewardess', category: 'interior' },
  'chief stew': { standard: 'Chief Stewardess', category: 'interior' },
  'head of housekeeping': { standard: 'Chief Stewardess', category: 'interior' },
  'purser': { standard: 'Purser', category: 'interior' },
  'chief purser': { standard: 'Purser', category: 'interior' },
  '2nd stewardess': { standard: 'Second Stewardess', category: 'interior' },
  'second stewardess': { standard: 'Second Stewardess', category: 'interior' },
  '2nd stew': { standard: 'Second Stewardess', category: 'interior' },
  '3rd stewardess': { standard: 'Third Stewardess', category: 'interior' },
  'third stewardess': { standard: 'Third Stewardess', category: 'interior' },
  'stewardess': { standard: 'Stewardess', category: 'interior' },
  'stew': { standard: 'Stewardess', category: 'interior' },
  'junior stewardess': { standard: 'Junior Stewardess', category: 'interior' },
  'sole stewardess': { standard: 'Sole Stewardess', category: 'interior' },
  'laundry stewardess': { standard: 'Laundry Stewardess', category: 'interior' },
  'housekeeping': { standard: 'Housekeeping', category: 'interior' },

  // Engineering
  'chief engineer': { standard: 'Chief Engineer', category: 'engineering' },
  'chief eng': { standard: 'Chief Engineer', category: 'engineering' },
  '2nd engineer': { standard: 'Second Engineer', category: 'engineering' },
  'second engineer': { standard: 'Second Engineer', category: 'engineering' },
  '3rd engineer': { standard: 'Third Engineer', category: 'engineering' },
  'third engineer': { standard: 'Third Engineer', category: 'engineering' },
  'eto': { standard: 'ETO', category: 'engineering' },
  'electro technical officer': { standard: 'ETO', category: 'engineering' },
  'engineer': { standard: 'Engineer', category: 'engineering' },
  'junior engineer': { standard: 'Junior Engineer', category: 'engineering' },

  // Galley
  'head chef': { standard: 'Head Chef', category: 'galley' },
  'executive chef': { standard: 'Head Chef', category: 'galley' },
  'chef': { standard: 'Chef', category: 'galley' },
  'sole chef': { standard: 'Sole Chef', category: 'galley' },
  'sous chef': { standard: 'Sous Chef', category: 'galley' },
  'second chef': { standard: 'Sous Chef', category: 'galley' },
  'crew chef': { standard: 'Crew Chef', category: 'galley' },
  'cook': { standard: 'Cook', category: 'galley' },

  // Childcare
  'nanny': { standard: 'Nanny', category: 'childcare' },
  'governess': { standard: 'Governess', category: 'childcare' },
  'au pair': { standard: 'Au Pair', category: 'childcare' },
  'tutor': { standard: 'Tutor', category: 'childcare' },

  // Medical
  'nurse': { standard: 'Nurse', category: 'medical' },
  'medic': { standard: 'Medic', category: 'medical' },
  'paramedic': { standard: 'Paramedic', category: 'medical' },

  // Security
  'security': { standard: 'Security Officer', category: 'security' },
  'security officer': { standard: 'Security Officer', category: 'security' },
  'close protection officer': { standard: 'CPO', category: 'security' },
  'cpo': { standard: 'CPO', category: 'security' },
  'bodyguard': { standard: 'CPO', category: 'security' },

  // Management
  'yacht manager': { standard: 'Yacht Manager', category: 'management' },
  'personal assistant': { standard: 'PA', category: 'management' },
  'pa': { standard: 'PA', category: 'management' },
  'executive assistant': { standard: 'Executive Assistant', category: 'management' },
  'ea': { standard: 'Executive Assistant', category: 'management' },
  'chief of staff': { standard: 'Chief of Staff', category: 'management' },

  // Villa/Estate - Management
  'estate manager': { standard: 'Estate Manager', category: 'villa' },
  'property manager': { standard: 'Estate Manager', category: 'villa' },
  'house manager': { standard: 'House Manager', category: 'villa' },
  'household manager': { standard: 'House Manager', category: 'villa' },
  'villa manager': { standard: 'Villa Manager', category: 'villa' },
  'chalet manager': { standard: 'Chalet Manager', category: 'villa' },

  // Villa/Estate - Service Staff
  'butler': { standard: 'Butler', category: 'villa' },
  'head butler': { standard: 'Head Butler', category: 'villa' },
  'senior butler': { standard: 'Senior Butler', category: 'villa' },
  'junior butler': { standard: 'Junior Butler', category: 'villa' },
  'footman': { standard: 'Footman', category: 'villa' },
  'valet': { standard: 'Valet', category: 'villa' },
  'lady\'s maid': { standard: 'Lady\'s Maid', category: 'villa' },

  // Villa/Estate - Housekeeping
  'head housekeeper': { standard: 'Head Housekeeper', category: 'villa' },
  'housekeeper': { standard: 'Housekeeper', category: 'villa' },
  'executive housekeeper': { standard: 'Executive Housekeeper', category: 'villa' },
  'housemaid': { standard: 'Housemaid', category: 'villa' },
  'maid': { standard: 'Housemaid', category: 'villa' },
  'laundress': { standard: 'Laundress', category: 'villa' },

  // Villa/Estate - Kitchen
  'private chef': { standard: 'Private Chef', category: 'villa' },
  'family chef': { standard: 'Private Chef', category: 'villa' },
  'estate chef': { standard: 'Private Chef', category: 'villa' },
  'kitchen assistant': { standard: 'Kitchen Assistant', category: 'villa' },

  // Villa/Estate - Outdoor & Maintenance
  'chauffeur': { standard: 'Chauffeur', category: 'villa' },
  'driver': { standard: 'Chauffeur', category: 'villa' },
  'head gardener': { standard: 'Head Gardener', category: 'villa' },
  'gardener': { standard: 'Gardener', category: 'villa' },
  'groundskeeper': { standard: 'Groundskeeper', category: 'villa' },
  'maintenance manager': { standard: 'Maintenance Manager', category: 'villa' },
  'handyman': { standard: 'Handyman', category: 'villa' },
  'pool technician': { standard: 'Pool Technician', category: 'villa' },
  'caretaker': { standard: 'Caretaker', category: 'villa' },

  // Villa/Estate - Service Couples
  'couple': { standard: 'Couple', category: 'villa' },
  'house couple': { standard: 'House Couple', category: 'villa' },
  'estate couple': { standard: 'Estate Couple', category: 'villa' },
  'caretaker couple': { standard: 'Caretaker Couple', category: 'villa' },

  // Other/Specialist
  'massage therapist': { standard: 'Massage Therapist', category: 'other' },
  'yoga instructor': { standard: 'Yoga Instructor', category: 'other' },
  'fitness trainer': { standard: 'Fitness Trainer', category: 'other' },
  'personal trainer': { standard: 'Personal Trainer', category: 'other' },
  'dive instructor': { standard: 'Dive Instructor', category: 'other' },
  'water sports instructor': { standard: 'Water Sports Instructor', category: 'other' },
  'florist': { standard: 'Florist', category: 'other' },
  'sommelier': { standard: 'Sommelier', category: 'other' },
};

/**
 * Vincere Functional Expertise IDs
 *
 * Maps standardized position names to Vincere functional expertise IDs.
 * These IDs are specific to the Lighthouse Vincere tenant.
 *
 * Fetched from Vincere API: GET /functionalexpertises
 * Last updated: 2026-01-08
 */
export const VINCERE_FUNCTIONAL_EXPERTISE_IDS: Record<string, number> = {
  // === Deck Department ===
  'Captain': 2987,
  'Chief Officer': 2988,
  'Second Officer': 2989,
  'Third Officer': 2990,
  'OOW': 2991, // Officer of the Watch
  'Bosun': 2992,
  'Lead Deckhand': 2993,
  'Experienced Deckhand': 2994,
  'Deckhand': 2994, // Alias for Experienced Deckhand
  'Junior Deckhand': 2995,
  'Carpenter': 2996,

  // === Water Sports ===
  'Dive Instructor': 2997,
  'Dive Master': 2998,
  'PWC Instructor': 2999,

  // === Engineering Department ===
  'Chief Engineer': 3001,
  'Second Engineer': 3002,
  'Third Engineer': 3003,
  'Junior Engineer': 3004,
  'ETO': 3000,

  // === Interior Department ===
  'Purser': 3005,
  'Interior Manager': 3006,
  'Chief Stew': 3007,
  'Chief Stewardess': 3007, // Alias
  'Head of Service': 3008,
  'Head of House': 3009,
  'Second Stew': 3010,
  'Second Stewardess': 3010, // Alias
  'Sole Stew': 3011,
  'Sole Stewardess': 3011, // Alias
  'Cook/Stew': 3012,
  'Junior Stew': 3013,
  'Junior Stewardess': 3013, // Alias
  'Stewardess': 3013, // Map generic stewardess to Junior Stew
  'Masseuse': 3014,
  'Beautician': 3015,
  'Hairdresser': 3018,
  'Laundry Stew': 3037,
  'Laundry Stewardess': 3037, // Alias
  'Experienced Stew': 3036,

  // === Medical ===
  'Nurse': 3016,
  'Paramedic': 3017,

  // === Fitness & Wellness ===
  'Yoga Instructor': 3019,
  'Personal Trainer': 3020,
  'SPA Manager': 3045,

  // === Childcare ===
  'Nanny': 3021,
  'Governess': 3030,

  // === Galley Department ===
  'Head Chef': 3022,
  'Chef': 3022, // Alias for Head Chef
  'Second Chef': 3023,
  'Sous Chef': 3039,
  'Crew Chef': 3024,
  'Sole Chef': 3035,
  'Cook': 3035, // Alias for Sole Chef
  'Galley Hand': 3038,

  // === Estate/Villa Staff ===
  'Estate Manager': 3026,
  'House Manager': 3027,
  'Butler': 3028,
  'Housekeeper': 3029,
  'Gardener': 3031,
  'Handyman': 3032,
  'Chauffeur': 3033,
  'Personal Assistant': 3025,
  'PA': 3025, // Alias

  // === Security ===
  'Security': 3034,
  'Security Officer': 3034, // Alias

  // === Couples ===
  'Couple': 3040,

  // === Technical ===
  'AV/IT Engineer': 3046,
};

/**
 * Get Vincere functional expertise ID for a position
 * @param position - Position name (will be standardized)
 * @returns Vincere functional expertise ID or undefined if not found
 */
export function getVincereFunctionalExpertiseId(position: string | null | undefined): number | undefined {
  if (!position) return undefined;

  // First try direct match with standardized position name
  const directMatch = VINCERE_FUNCTIONAL_EXPERTISE_IDS[position];
  if (directMatch) return directMatch;

  // Try to find via position mapping (converts aliases to standard names)
  const normalized = position.toLowerCase().trim();
  const mapping = POSITION_MAPPING[normalized];
  if (mapping) {
    return VINCERE_FUNCTIONAL_EXPERTISE_IDS[mapping.standard];
  }

  // Try case-insensitive match on expertise IDs
  const lowerPosition = position.toLowerCase();
  for (const [key, id] of Object.entries(VINCERE_FUNCTIONAL_EXPERTISE_IDS)) {
    if (key.toLowerCase() === lowerPosition) {
      return id;
    }
  }

  return undefined;
}

/**
 * Vincere License Field IDs
 *
 * Maps our app license values to Vincere dropdown option numbers for highestLicence/secondLicence fields.
 * Field keys:
 *   - highestLicence: 83f3f9dc58b5fc1d0b7d591fd82f001b
 *   - secondLicence: 80429528339faa3362600dedfcb72d9d
 *
 * These are used with `field_values: [optionNumber]` for COMBO_BOX custom fields.
 * Valid option numbers: 33-58, 60 (27 total options)
 *
 * IMPORTANT: The option numbers are internal Vincere IDs, NOT sequential 1-27.
 * The mapping below corresponds to the dropdown order in Vincere admin:
 *   Position 1 (Master Unlimited) = Option 33
 *   Position 2 (Master 3000) = Option 34
 *   ... etc.
 *
 * Last updated: 2026-01-09
 */
export const VINCERE_LICENSE_IDS: Record<string, number> = {
  // Deck/Bridge licenses (positions 1-14 = options 33-46)
  'master_unlimited': 33,        // Position 1: Master Unlimited
  'master_3000gt': 34,           // Position 2: Master 3000
  'master_3000': 34,             // Alias
  'master_500gt': 35,            // Position 3: Master 500
  'master_500': 35,              // Alias
  'chief_mate_unlimited': 36,    // Position 4: Chief Mate Unlimited
  'mca_chief_mate': 36,          // Alias
  'chief_mate_3000': 37,         // Position 5: Chief Mate 3000
  'oow_unlimited': 38,           // Position 6: OOW Unlimited
  'mca_oow': 38,                 // Alias
  'ow_unlimited': 38,            // Alias (from DB)
  'oow_3000': 39,                // Position 7: OOW 3000
  'master_200gt': 40,            // Position 8: Master 200
  'master_200': 40,              // Alias
  'rya_yachtmaster_ocean': 41,   // Position 9: RYA Yachtmaster Ocean
  'rya_yachtmaster_offshore': 42, // Position 10: RYA Yachtmaster Offshore
  'yacht_rating': 43,            // Position 11: Yacht Rating
  'coastal_skipper': 44,         // Position 12: Coastal Skipper
  'day_skipper': 45,             // Position 13: Day Skipper
  'powerboat_level_2': 46,       // Position 14: Powerboat Level 2

  // Engineering licenses (positions 15-27 = options 47-58, 60)
  'chief_engineer_unlimited': 47, // Position 15: Chief Engineer Unlimited
  'second_engineer_unlimited': 48, // Position 16: Second Engineer Unlimited
  'eoow': 49,                    // Position 17: EOOW
  'y1_engineer': 50,             // Position 18: Y1 Engineer
  'y1': 50,                      // Alias
  'y2_engineer': 51,             // Position 19: Y2 Engineer
  'y2': 51,                      // Alias
  'y3_engineer': 52,             // Position 20: Y3 Engineer
  'y3': 52,                      // Alias
  'y4_engineer': 53,             // Position 21: Y4 Engineer
  'y4': 53,                      // Alias
  'meol': 54,                    // Position 22: MEOL
  'aec': 55,                     // Position 23: AEC
  'chief_engineer_3000kw': 56,   // Position 24: Chief Engineer 3000kW
  'sv_2nd_engineer': 57,         // Position 25: SV 2nd Engineer
  'sv_chief_engineer_3000kw': 58, // Position 26: SV Chief Engineer 3000kW
  'sv_chief_engineer_9000kw': 60, // Position 27: SV Chief Engineer 9000kW (note: skips 59)
};

/**
 * Reverse mapping: Vincere license ID to our value
 */
export const VINCERE_LICENSE_MAP: Record<number, string> = Object.fromEntries(
  Object.entries(VINCERE_LICENSE_IDS).map(([k, v]) => [v, k])
);

/**
 * Get Vincere license ID for an app license value
 * @param license - License value from our app
 * @returns Vincere license ID or undefined if not found
 */
export function getVincereLicenseId(license: string | null | undefined): number | undefined {
  if (!license) return undefined;
  return VINCERE_LICENSE_IDS[license.toLowerCase()];
}

/**
 * Job custom field keys
 */
export const VINCERE_JOB_FIELD_KEYS = {
  yacht: 'f8b2c1ddc995fb699973598e449193c3',
  requirements: '3c580f529de2e205114090aa08e10f7a',
  startDate: '9a214be2a25d61d1add26dca93aef45a',
  itinerary: 'b8a75c8b68fb5c85fb083aac4bbbed94',
  salary: '035ca080627c6bac4e59e6fc6750a5b6',
  program: '24a44070b5d77ce92fb018745ddbe374',
  holidayPackage: 'ecac1d20eb2b26a248837610935d9b92',
  contractType: 'c980a4f92992081ead936fb8a358fb79',
} as const;
