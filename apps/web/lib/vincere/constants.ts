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
  candidateSourceBubble: 29105, // Source ID for Bubble portal registrations
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

  // Other
  'nanny': { standard: 'Nanny', category: 'childcare' },
  'governess': { standard: 'Governess', category: 'childcare' },
  'nurse': { standard: 'Nurse', category: 'medical' },
  'medic': { standard: 'Medic', category: 'medical' },
  'security': { standard: 'Security Officer', category: 'security' },
  'yacht manager': { standard: 'Yacht Manager', category: 'management' },
  'personal assistant': { standard: 'PA', category: 'other' },
  'pa': { standard: 'PA', category: 'other' },
};

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
