/**
 * Vincere Sync - Data Mapping Functions
 *
 * Maps Vincere candidate data to the Lighthouse Network Candidate type.
 */

import type { Candidate, CandidateInsert, PositionCategory, ContractType } from '../../../../packages/database/types';
import type { VincereCandidate, VincereCustomField, VincereFunctionalExpertise, VincereLocation, VincerecandidateStatus } from './candidates';
import { getFieldValue, getBooleanFieldValue } from './candidates';

/**
 * Extended data from additional Vincere endpoints
 */
export interface VincereExtendedData {
  functionalExpertises?: VincereFunctionalExpertise[];
  currentLocation?: VincereLocation | null;
  candidateStatus?: VincerecandidateStatus | null;
}
import {
  VINCERE_FIELD_KEYS,
  VINCERE_NATIONALITY_MAP,
  VINCERE_MARITAL_STATUS_MAP,
  VINCERE_CONTRACT_TYPE_MAP,
  VINCERE_YACHT_TYPE_MAP,
  VINCERE_LICENSE_MAP,
  NATIONALITY_TO_VINCERE_ID,
  POSITION_MAPPING,
  getVincereLicenseId,
  getVincereSecondLicenseId,
  toISOCountryCode,
} from './constants';

/**
 * Parse salary string like "€5000-€7000" or "5k-7k"
 */
export function parseSalaryRange(salaryString: string | null | undefined): {
  desired_salary_min: number | null;
  desired_salary_max: number | null;
  salary_currency: string;
} {
  if (!salaryString) {
    return { desired_salary_min: null, desired_salary_max: null, salary_currency: 'EUR' };
  }

  // Detect currency
  let currency = 'EUR';
  if (salaryString.includes('$') || salaryString.toLowerCase().includes('usd')) {
    currency = 'USD';
  } else if (salaryString.includes('£') || salaryString.toLowerCase().includes('gbp')) {
    currency = 'GBP';
  }

  // Match patterns like "5000-7000", "€5000-€7000", "5k-7k", "5000 - 7000"
  const rangeMatch = salaryString.match(/(\d+(?:\.\d+)?)\s*k?\s*[-–to]+\s*(\d+(?:\.\d+)?)\s*k?/i);
  if (rangeMatch) {
    let min = parseFloat(rangeMatch[1]);
    let max = parseFloat(rangeMatch[2]);

    // Handle "k" format (5k = 5000)
    if (salaryString.toLowerCase().includes('k')) {
      if (min < 100) min *= 1000;
      if (max < 100) max *= 1000;
    }

    return {
      desired_salary_min: Math.round(min),
      desired_salary_max: Math.round(max),
      salary_currency: currency,
    };
  }

  // Single value like "€5000" or "5k"
  const singleMatch = salaryString.match(/(\d+(?:\.\d+)?)\s*k?/i);
  if (singleMatch) {
    let value = parseFloat(singleMatch[1]);
    if (salaryString.toLowerCase().includes('k') && value < 100) {
      value *= 1000;
    }
    return {
      desired_salary_min: Math.round(value),
      desired_salary_max: null,
      salary_currency: currency,
    };
  }

  return { desired_salary_min: null, desired_salary_max: null, salary_currency: currency };
}

/**
 * Parse yacht size string like "40m-60m" or "50m+"
 */
export function parseYachtSizeRange(sizeString: string | null | undefined): {
  preferred_yacht_size_min: number | null;
  preferred_yacht_size_max: number | null;
} {
  if (!sizeString) {
    return { preferred_yacht_size_min: null, preferred_yacht_size_max: null };
  }

  // Match range patterns like "40m-60m", "40-60m", "40 - 60"
  const rangeMatch = sizeString.match(/(\d+)\s*m?\s*[-–to]+\s*(\d+)\s*m?/i);
  if (rangeMatch) {
    return {
      preferred_yacht_size_min: parseInt(rangeMatch[1]),
      preferred_yacht_size_max: parseInt(rangeMatch[2]),
    };
  }

  // Match "50m+" or "50+"
  const minMatch = sizeString.match(/(\d+)\s*m?\s*\+/i);
  if (minMatch) {
    return {
      preferred_yacht_size_min: parseInt(minMatch[1]),
      preferred_yacht_size_max: null,
    };
  }

  // Single value like "50m"
  const singleMatch = sizeString.match(/(\d+)\s*m?/i);
  if (singleMatch) {
    const size = parseInt(singleMatch[1]);
    return {
      preferred_yacht_size_min: size,
      preferred_yacht_size_max: size,
    };
  }

  return { preferred_yacht_size_min: null, preferred_yacht_size_max: null };
}

/**
 * Parse yacht types from Vincere dropdown value
 */
export function parseYachtTypes(typeValue: number | number[] | null): string[] {
  if (typeValue === null) return [];

  const values = Array.isArray(typeValue) ? typeValue : [typeValue];
  return values
    .map((v) => VINCERE_YACHT_TYPE_MAP[v])
    .filter((v): v is string => v !== undefined);
}

/**
 * Parse contract types from Vincere dropdown value
 */
export function parseContractTypes(typeValue: number | number[] | null): ContractType[] {
  if (typeValue === null) return [];

  const values = Array.isArray(typeValue) ? typeValue : [typeValue];
  return values
    .map((v) => VINCERE_CONTRACT_TYPE_MAP[v] as ContractType | undefined)
    .filter((v): v is ContractType => v !== undefined);
}

/**
 * Standardize position to our categories
 */
export function standardizePosition(rawPosition: string | null | undefined): {
  primary_position: string | null;
  position_category: PositionCategory | null;
} {
  if (!rawPosition) {
    return { primary_position: null, position_category: null };
  }

  const normalized = rawPosition.toLowerCase().trim();

  for (const [key, value] of Object.entries(POSITION_MAPPING)) {
    if (normalized.includes(key)) {
      return {
        primary_position: value.standard,
        position_category: value.category as PositionCategory,
      };
    }
  }

  return {
    primary_position: rawPosition,
    position_category: 'other',
  };
}

/**
 * Map Vincere candidate data to our Candidate type
 */
export function mapVincereToCandidate(
  vincereData: VincereCandidate,
  customFields: Record<string, VincereCustomField>,
  extendedData?: VincereExtendedData
): Partial<CandidateInsert> {
  // Helper to get field values using our typed keys
  const getField = (key: keyof typeof VINCERE_FIELD_KEYS) =>
    getFieldValue(customFields, key);

  const getBoolField = (key: keyof typeof VINCERE_FIELD_KEYS) =>
    getBooleanFieldValue(customFields, key);

  // Parse position
  const { primary_position, position_category } = standardizePosition(vincereData.job_title);

  // Parse salary
  const salaryString = getField('desiredSalary') as string | null;
  const { desired_salary_min, desired_salary_max, salary_currency } = parseSalaryRange(salaryString);

  // Parse yacht size
  const yachtSizeString = getField('yachtSize') as string | null;
  const { preferred_yacht_size_min, preferred_yacht_size_max } = parseYachtSizeRange(yachtSizeString);

  // Parse yacht types
  const yachtTypeValue = getField('yachtType') as number | number[] | null;
  const preferred_yacht_types = parseYachtTypes(yachtTypeValue);

  // Parse contract types
  const contractTypeValue = getField('contractType') as number | number[] | null;
  const preferred_contract_types = parseContractTypes(contractTypeValue);

  // Parse marital status
  const maritalStatusValue = getField('maritalStatus') as number | null;
  const marital_status = maritalStatusValue !== null
    ? VINCERE_MARITAL_STATUS_MAP[maritalStatusValue] ?? null
    : null;

  // Parse second nationality
  const secondNationalityValue = getField('secondNationality') as number | null;
  const second_nationality = secondNationalityValue !== null
    ? VINCERE_NATIONALITY_MAP[secondNationalityValue] ?? null
    : null;

  // Parse start date
  const startDateValue = getField('startDate') as string | null;
  const available_from = startDateValue ?? null;

  // Parse desired location into regions array
  const desiredLocationValue = getField('desiredLocation') as string | null;
  const preferred_regions = desiredLocationValue
    ? desiredLocationValue.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
    : null;

  // Handle couple position (1=Yes, 2=No, 3=Flexible)
  const couplePositionValue = getField('couplePosition') as number | null;
  let is_couple = false;
  let couple_position: string | null = null;
  if (couplePositionValue === 1) {
    is_couple = true;
    couple_position = 'yes';
  } else if (couplePositionValue === 3) {
    is_couple = false;
    couple_position = 'flexible';
  }

  // Handle smoker field (1=Yes, 2=No, 3=Social)
  // Note: Database stores as boolean | null, but Vincere supports 3=Social
  // For now, we map 3 to null (unknown) since boolean doesn't support 'social'
  // TODO: Consider adding a separate field or extending type to support 'social'
  const smokerValue = getField('smoker') as number | null;
  let is_smoker: boolean | null = null;
  if (smokerValue === 1) is_smoker = true;
  else if (smokerValue === 2) is_smoker = false;
  // smokerValue === 3 means "social" - currently mapped to null
  // This preserves the data but doesn't distinguish between "No" and "Social"

  // Process extended data if provided
  // Note: functional expertises will be appended to profile_summary since there's no 'skills' column
  const skillsFromExpertises = extendedData?.functionalExpertises?.map(e => e.name) ?? [];

  // Use current location from extended data if available, fallback to basic data
  const locationFromExtended = extendedData?.currentLocation;
  const currentLocationString = locationFromExtended
    ? [locationFromExtended.city, locationFromExtended.country].filter(Boolean).join(', ') || locationFromExtended.name
    : vincereData.current_location;

  // Map candidate status to availability_status
  // Common Vincere statuses: "Active", "Placed", "Do Not Use", "Inactive", etc.
  // Map to simplified availability: 'available' or 'not_looking'
  let availability_status_from_vincere: 'available' | 'not_looking' | null = null;
  if (extendedData?.candidateStatus) {
    const statusName = extendedData.candidateStatus.name?.toLowerCase() ?? '';
    if (statusName.includes('active') || statusName.includes('available') || statusName.includes('notice')) {
      availability_status_from_vincere = 'available';
    } else if (statusName.includes('placed') || statusName.includes('contract') || statusName.includes('inactive') || statusName.includes('not')) {
      availability_status_from_vincere = 'not_looking';
    }
  }

  return {
    // External ID
    vincere_id: vincereData.id.toString(),

    // Basic info
    first_name: vincereData.first_name,
    last_name: vincereData.last_name,
    email: vincereData.email || vincereData.primary_email || null,
    phone: vincereData.phone ?? null,
    whatsapp: vincereData.mobile ?? null,

    // Demographics
    date_of_birth: vincereData.date_of_birth ?? null,
    gender: vincereData.gender ?? null,
    nationality: vincereData.nationality ?? null,
    second_nationality,

    // Location (prefer extended data)
    current_location: currentLocationString ?? null,

    // Professional
    primary_position,
    position_category,

    // Preferences
    preferred_yacht_types: preferred_yacht_types.length > 0 ? preferred_yacht_types : null,
    preferred_yacht_size_min,
    preferred_yacht_size_max,
    preferred_contract_types: preferred_contract_types.length > 0 ? preferred_contract_types : null,
    preferred_regions,

    // Availability
    available_from,

    // Compensation
    desired_salary_min,
    desired_salary_max,
    salary_currency,

    // Visas
    has_schengen: getBoolField('schengenVisa'),
    has_b1b2: getBoolField('b1b2'),

    // Certifications
    has_stcw: getBoolField('stcw') ?? false,
    has_eng1: getBoolField('eng1') ?? false,
    // License fields are dropdowns - convert numeric ID to string value
    highest_license: (() => {
      const val = getField('highestLicence');
      if (typeof val === 'number') return VINCERE_LICENSE_MAP[val] ?? null;
      if (typeof val === 'string') return val; // Fallback for legacy string values
      return null;
    })(),
    second_license: (() => {
      const val = getField('secondLicence');
      if (typeof val === 'number') return VINCERE_LICENSE_MAP[val] ?? null;
      if (typeof val === 'string') return val; // Fallback for legacy string values
      return null;
    })(),

    // Personal
    is_smoker,
    has_visible_tattoos: getBoolField('tattoos'),
    tattoo_description: getField('tattooLocation') as string | null,
    marital_status,

    // Couple
    is_couple,
    partner_name: getField('partnerName') as string | null,
    partner_position: getField('partnerPosition') as string | null,
    couple_position,

    // Profile - include skills from functional expertises in summary
    profile_summary: [
      vincereData.summary,
      skillsFromExpertises.length > 0 ? `\n\nSkills: ${skillsFromExpertises.join(', ')}` : null,
    ].filter(Boolean).join('') || null,

    // Verification (default for synced candidates)
    verification_tier: 'unverified' as const,

    // Availability status - prefer Vincere status, then available_from date, else omit
    // DB enum: 'available' | 'not_looking'
    ...(availability_status_from_vincere
      ? { availability_status: availability_status_from_vincere }
      : available_from
        ? { availability_status: 'available' as const }
        : {}),

    // Timestamps
    last_synced_at: new Date().toISOString(),
  };
}

/**
 * Get interview notes from custom fields (for agency relationship)
 */
export function getInterviewNotes(
  customFields: Record<string, VincereCustomField>
): string | null {
  const notes = getFieldValue(customFields, 'interviewNotes');
  return typeof notes === 'string' ? notes : null;
}

/**
 * Map our Candidate type back to Vincere format for updates
 */
export function mapCandidateToVincere(
  candidate: Partial<Candidate>
): {
  basicData: Record<string, unknown>;
  customFields: Array<{
    fieldKey: string;
    fieldValue?: string;
    fieldValues?: number[];
    dateValue?: string;
  }>;
} {
  const basicData: Record<string, unknown> = {};
  const customFields: Array<{
    fieldKey: string;
    fieldValue?: string;
    fieldValues?: number[];
    dateValue?: string;
  }> = [];

  // Basic fields
  if (candidate.first_name) basicData.first_name = candidate.first_name;
  if (candidate.last_name) basicData.last_name = candidate.last_name;
  if (candidate.email) basicData.primary_email = candidate.email;
  if (candidate.phone) basicData.phone = candidate.phone;
  if (candidate.whatsapp) basicData.mobile = candidate.whatsapp;
  if (candidate.date_of_birth) {
    // Vincere requires full ISO timestamp, not just date
    // Convert "1990-05-15" to "1990-05-15T00:00:00.000Z"
    const dob = candidate.date_of_birth;
    basicData.date_of_birth = dob.includes('T') ? dob : new Date(dob).toISOString();
  }
  if (candidate.gender) {
    // Vincere expects uppercase gender values: MALE, FEMALE, OTHER
    basicData.gender = candidate.gender.toUpperCase();
  }
  if (candidate.nationality) {
    // Convert nationality to ISO country code (Vincere expects "FR" not "French")
    basicData.nationality = toISOCountryCode(candidate.nationality);
  }
  // NOTE: current_location and job_title are NOT valid for Vincere PATCH API
  // - current_location must use PUT /candidate/{id}/currentlocation endpoint
  // - job_title/primary_position uses functional expertise via setFunctionalExpertises()
  
  // Build comprehensive summary including all relevant fields
  const summaryParts: string[] = [];
  if (candidate.profile_summary) summaryParts.push(candidate.profile_summary);
  
  // Append years of experience if available
  if (candidate.years_experience) {
    summaryParts.push(`\n\nYears of Experience: ${candidate.years_experience}`);
  }
  
  // Append secondary positions if available
  if (candidate.secondary_positions && candidate.secondary_positions.length > 0) {
    summaryParts.push(`\n\nSecondary Positions: ${candidate.secondary_positions.join(', ')}`);
  }
  
  // Append key skills if available (stored in search_keywords or similar)
  if (candidate.search_keywords && candidate.search_keywords.length > 0) {
    summaryParts.push(`\n\nKey Skills: ${candidate.search_keywords.join(', ')}`);
  }
  
  if (summaryParts.length > 0) {
    basicData.summary = summaryParts.join('');
  }

  // Custom fields - boolean fields (1=Yes, 2=No, 3=Social)
  // Note: Database stores is_smoker as boolean | null, so we can only map true→1, false→2
  // If Vincere has value 3 (Social), it will be read as null (limitation until DB supports 'social')
  if (candidate.is_smoker !== null && candidate.is_smoker !== undefined) {
    customFields.push({
      fieldKey: VINCERE_FIELD_KEYS.smoker,
      fieldValues: [candidate.is_smoker ? 1 : 2],
    });
  }

  if (candidate.has_visible_tattoos !== null && candidate.has_visible_tattoos !== undefined) {
    customFields.push({
      fieldKey: VINCERE_FIELD_KEYS.tattoos,
      fieldValues: [candidate.has_visible_tattoos ? 1 : 2],
    });
  }

  if (candidate.has_schengen !== null && candidate.has_schengen !== undefined) {
    customFields.push({
      fieldKey: VINCERE_FIELD_KEYS.schengenVisa,
      fieldValues: [candidate.has_schengen ? 1 : 2],
    });
  }

  if (candidate.has_b1b2 !== null && candidate.has_b1b2 !== undefined) {
    customFields.push({
      fieldKey: VINCERE_FIELD_KEYS.b1b2,
      fieldValues: [candidate.has_b1b2 ? 1 : 2],
    });
  }

  if (candidate.has_eng1 !== null && candidate.has_eng1 !== undefined) {
    customFields.push({
      fieldKey: VINCERE_FIELD_KEYS.eng1,
      fieldValues: [candidate.has_eng1 ? 1 : 2],
    });
  }

  if (candidate.has_stcw !== null && candidate.has_stcw !== undefined) {
    customFields.push({
      fieldKey: VINCERE_FIELD_KEYS.stcw,
      fieldValues: [candidate.has_stcw ? 1 : 2],
    });
  }

  // Text fields
  if (candidate.tattoo_description) {
    customFields.push({
      fieldKey: VINCERE_FIELD_KEYS.tattooLocation,
      fieldValue: candidate.tattoo_description,
    });
  }

  if (candidate.partner_name) {
    customFields.push({
      fieldKey: VINCERE_FIELD_KEYS.partnerName,
      fieldValue: candidate.partner_name,
    });
  }

  if (candidate.partner_position) {
    customFields.push({
      fieldKey: VINCERE_FIELD_KEYS.partnerPosition,
      fieldValue: candidate.partner_position,
    });
  }

  // License fields use dropdown IDs, not string values
  if (candidate.highest_license) {
    console.log(`[VincereSync] highest_license value: "${candidate.highest_license}"`);
    const licenseId = getVincereLicenseId(candidate.highest_license);
    console.log(`[VincereSync] highest_license mapped to ID: ${licenseId}`);
    if (licenseId) {
      customFields.push({
        fieldKey: VINCERE_FIELD_KEYS.highestLicence,
        fieldValues: [licenseId],
      });
    }
  }

  if (candidate.second_license) {
    console.log(`[VincereSync] second_license value: "${candidate.second_license}"`);
    // secondLicence field uses different option IDs (1-23) than highestLicence (33-60)
    const licenseId = getVincereSecondLicenseId(candidate.second_license);
    console.log(`[VincereSync] second_license mapped to ID: ${licenseId}`);
    if (licenseId) {
      customFields.push({
        fieldKey: VINCERE_FIELD_KEYS.secondLicence,
        fieldValues: [licenseId],
      });
    }
  }

  // Date fields
  if (candidate.available_from) {
    customFields.push({
      fieldKey: VINCERE_FIELD_KEYS.startDate,
      dateValue: new Date(candidate.available_from).toISOString(),
    });
  }

  // Salary range
  if (candidate.desired_salary_min || candidate.desired_salary_max) {
    const currency = candidate.salary_currency === 'EUR' ? '€' :
                     candidate.salary_currency === 'USD' ? '$' :
                     candidate.salary_currency === 'GBP' ? '£' : '';
    const min = candidate.desired_salary_min ?? '';
    const max = candidate.desired_salary_max ?? '';
    const salaryString = max ? `${currency}${min}-${currency}${max}` : `${currency}${min}`;
    customFields.push({
      fieldKey: VINCERE_FIELD_KEYS.desiredSalary,
      fieldValue: salaryString,
    });
  }

  // Yacht size range
  if (candidate.preferred_yacht_size_min || candidate.preferred_yacht_size_max) {
    const min = candidate.preferred_yacht_size_min ?? '';
    const max = candidate.preferred_yacht_size_max ?? '';
    const sizeString = max ? `${min}m-${max}m` : `${min}m+`;
    customFields.push({
      fieldKey: VINCERE_FIELD_KEYS.yachtSize,
      fieldValue: sizeString,
    });
  }

  // Preferred regions
  if (candidate.preferred_regions && candidate.preferred_regions.length > 0) {
    customFields.push({
      fieldKey: VINCERE_FIELD_KEYS.desiredLocation,
      fieldValue: candidate.preferred_regions.join(', '),
    });
  }

  // Couple position (1=Yes, 2=No, 3=Flexible)
  if (candidate.is_couple !== null && candidate.is_couple !== undefined) {
    let coupleValue: number;
    if (candidate.is_couple) {
      coupleValue = 1; // Yes
    } else if (candidate.couple_position === 'flexible') {
      coupleValue = 3; // Flexible
    } else {
      coupleValue = 2; // No
    }
    customFields.push({
      fieldKey: VINCERE_FIELD_KEYS.couplePosition,
      fieldValues: [coupleValue],
    });
  }

  // Marital status
  if (candidate.marital_status) {
    const maritalStatusValue = candidate.marital_status === 'single' ? 1 :
                               candidate.marital_status === 'married' ? 2 :
                               candidate.marital_status === 'in_relationship' ? 3 : null;
    if (maritalStatusValue) {
      customFields.push({
        fieldKey: VINCERE_FIELD_KEYS.maritalStatus,
        fieldValues: [maritalStatusValue],
      });
    }
  }

  // Contract type preferences (multi-select)
  if (candidate.preferred_contract_types && candidate.preferred_contract_types.length > 0) {
    const contractValues: number[] = [];
    for (const type of candidate.preferred_contract_types) {
      switch (type) {
        case 'permanent': contractValues.push(1); break;
        case 'rotational': contractValues.push(2); break;
        case 'seasonal': contractValues.push(3); break;
        case 'freelance': contractValues.push(4); break;
      }
    }

    if (contractValues.length > 0) {
      customFields.push({
        fieldKey: VINCERE_FIELD_KEYS.contractType,
        fieldValues: contractValues,
      });
    }
  }

  // Yacht type preferences (multi-select)
  if (candidate.preferred_yacht_types && candidate.preferred_yacht_types.length > 0) {
    const yachtTypeValues: number[] = [];
    for (const type of candidate.preferred_yacht_types) {
      switch (type.toLowerCase()) {
        case 'motor': yachtTypeValues.push(1); break;
        case 'sailing': yachtTypeValues.push(2); break;
      }
    }

    if (yachtTypeValues.length > 0) {
      customFields.push({
        fieldKey: VINCERE_FIELD_KEYS.yachtType,
        fieldValues: yachtTypeValues,
      });
    }
  }

  // Second nationality - need to reverse lookup the ID
  if (candidate.second_nationality) {
    const nationalityId = NATIONALITY_TO_VINCERE_ID[candidate.second_nationality.toLowerCase()];
    if (nationalityId) {
      customFields.push({
        fieldKey: VINCERE_FIELD_KEYS.secondNationality,
        fieldValues: [nationalityId],
      });
    }
  }

  return { basicData, customFields };
}
