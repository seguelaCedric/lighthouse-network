// ============================================================================
// BIO ANONYMIZATION
// ============================================================================
// Convert named bios to anonymous versions for public display
// ============================================================================

import type { ReferenceDetail } from '../cv-extraction/types';

// Partial types for anonymization - only need the fields we use for name replacement
// This allows passing data from various sources that may have slightly different schemas
interface YachtExperienceForAnonymization {
  yacht_name?: string | null;
  yacht_size_meters?: number | null;
  yacht_type?: string | null;
}

interface VillaExperienceForAnonymization {
  property_name?: string | null;
  location?: string | null;
  property_type?: string | null;
}

/**
 * Anonymize a candidate bio for public display.
 *
 * Replaces the candidate's name and referee names with generic patterns
 * while preserving all other content.
 *
 * @example
 * Input: "John Smith is a 32-year-old British Deckhand... Captain James recommended..."
 * Output: "This British Deckhand is a 32-year-old professional... A former Captain recommended..."
 *
 * @param bioFull - The complete bio with candidate name
 * @param firstName - Candidate's first name
 * @param lastName - Candidate's last name
 * @param nationality - Candidate's nationality (e.g., "British")
 * @param position - Candidate's primary position (e.g., "Deckhand")
 * @param references - Optional array of reference details to anonymize
 * @returns Anonymized bio with names replaced
 */
export function anonymizeBio(
  bioFull: string | null | undefined,
  firstName: string,
  lastName: string,
  nationality: string | null | undefined,
  position: string | null | undefined,
  references?: ReferenceDetail[] | null,
  yachtExperience?: YachtExperienceForAnonymization[] | null,
  villaExperience?: VillaExperienceForAnonymization[] | null
): string {
  if (!bioFull) return '';

  const fullName = `${firstName} ${lastName}`;
  const nationalityStr = nationality || 'international';
  const positionStr = position || 'professional';

  // Escape special regex characters in names
  const escapeRegex = (str: string) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  let anonymized = bioFull;

  // Replace full name (case-insensitive) with nationality + position pattern
  // "John Smith" → "This British Deckhand"
  const fullNamePattern = new RegExp(escapeRegex(fullName), 'gi');
  anonymized = anonymized.replace(fullNamePattern, `This ${nationalityStr} ${positionStr}`);

  // Replace first name occurrences with "the candidate"
  // Often used in personality paragraph: "John is known for..."
  const firstNamePattern = new RegExp(`\\b${escapeRegex(firstName)}\\b`, 'gi');
  anonymized = anonymized.replace(firstNamePattern, 'the candidate');

  // Replace last name occurrences (rare but possible)
  // "Mr. Smith" → "the candidate"
  const lastNamePattern = new RegExp(`\\b${escapeRegex(lastName)}\\b`, 'gi');
  anonymized = anonymized.replace(lastNamePattern, 'the candidate');

  // Anonymize referee/reference names
  if (references && references.length > 0) {
    anonymized = anonymizeReferenceNames(anonymized, references);
  }

  // Anonymize employer names (yacht names and property names)
  if (yachtExperience && yachtExperience.length > 0) {
    anonymized = anonymizeYachtNames(anonymized, yachtExperience);
  }
  if (villaExperience && villaExperience.length > 0) {
    anonymized = anonymizePropertyNames(anonymized, villaExperience);
  }

  // Clean up any double spaces created by replacements
  anonymized = anonymized.replace(/\s+/g, ' ');

  // Clean up any awkward "the candidate the candidate" patterns
  anonymized = anonymized.replace(/the candidate the candidate/gi, 'the candidate');

  return anonymized.trim();
}

/**
 * Anonymize reference/referee names in text.
 * Replaces referee names with their position title (e.g., "a former Captain").
 */
function anonymizeReferenceNames(text: string, references: ReferenceDetail[]): string {
  // Escape special regex characters in names
  const escapeRegex = (str: string) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  let result = text;

  for (const ref of references) {
    if (!ref.name) continue;

    // Determine the replacement text based on referee's position
    const refPosition = ref.position || 'previous employer';
    const replacement = `a former ${refPosition}`;

    // Split referee name into parts to handle full name and partial matches
    const nameParts = ref.name.trim().split(/\s+/);

    if (nameParts.length >= 2) {
      // Replace full name first (e.g., "Captain John Smith" → "a former Captain")
      const fullNamePattern = new RegExp(`\\b${escapeRegex(ref.name)}\\b`, 'gi');
      result = result.replace(fullNamePattern, replacement);

      // Also check for "Title FirstName LastName" pattern
      // e.g., "Captain John Smith" where the title might be in front
      if (ref.position) {
        const titleWithName = `${ref.position} ${ref.name}`;
        const titleNamePattern = new RegExp(`\\b${escapeRegex(titleWithName)}\\b`, 'gi');
        result = result.replace(titleNamePattern, replacement);
      }

      // Replace last name if it's distinctive (3+ chars, not a common word)
      const lastName = nameParts[nameParts.length - 1];
      if (lastName.length >= 3 && !isCommonWord(lastName)) {
        const lastNamePattern = new RegExp(`\\b${escapeRegex(lastName)}\\b`, 'gi');
        result = result.replace(lastNamePattern, replacement);
      }
    } else {
      // Single word name - only replace if it's not a common word
      if (!isCommonWord(ref.name)) {
        const namePattern = new RegExp(`\\b${escapeRegex(ref.name)}\\b`, 'gi');
        result = result.replace(namePattern, replacement);
      }
    }
  }

  // Clean up duplicate replacements like "a former Captain a former Captain"
  result = result.replace(/(a former [A-Za-z\s]+?)\s+\1/gi, '$1');

  return result;
}

/**
 * Check if a word is too common to be a unique name identifier.
 * This prevents replacing words like "the", "and", "with", etc.
 */
function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'the', 'and', 'for', 'with', 'from', 'has', 'have', 'had', 'was', 'were',
    'is', 'are', 'been', 'being', 'her', 'his', 'she', 'he', 'they', 'them',
    'this', 'that', 'these', 'those', 'who', 'which', 'what', 'where', 'when',
    'how', 'why', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
    'some', 'such', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'also',
    // Common position words that shouldn't be replaced
    'captain', 'chief', 'first', 'second', 'third', 'head', 'senior', 'junior',
    'officer', 'engineer', 'steward', 'stewardess', 'mate', 'bosun', 'chef',
  ]);
  return commonWords.has(word.toLowerCase());
}

/**
 * Generate a partially hidden display name for lead generation.
 * Shows first initial and partial last name to create curiosity.
 *
 * @example
 * "John" "Smith" → "J*** S***"
 * "Maria" "de la Cruz" → "M**** d* l* C***"
 */
export function obfuscateName(firstName: string, lastName: string): string {
  const obfuscateWord = (word: string): string => {
    if (word.length <= 2) return word;
    return word[0] + '*'.repeat(word.length - 1);
  };

  const obfuscatedFirst = obfuscateWord(firstName);
  const obfuscatedLast = lastName
    .split(' ')
    .map(obfuscateWord)
    .join(' ');

  return `${obfuscatedFirst} ${obfuscatedLast}`;
}

/**
 * Check if a bio appears to contain the candidate's name.
 * Useful for validation/debugging.
 */
export function bioContainsName(
  bio: string,
  firstName: string,
  lastName: string
): boolean {
  const fullName = `${firstName} ${lastName}`.toLowerCase();
  const bioLower = bio.toLowerCase();

  return (
    bioLower.includes(fullName) ||
    bioLower.includes(firstName.toLowerCase()) ||
    bioLower.includes(lastName.toLowerCase())
  );
}

// ----------------------------------------------------------------------------
// EMPLOYER/YACHT NAME ANONYMIZATION
// ----------------------------------------------------------------------------

/**
 * Anonymize yacht names in text.
 * Replaces specific yacht names with generic descriptors while preserving size and type.
 *
 * @example
 * "M/Y Eclipse (85m)" → "a 85m motor yacht"
 * "worked on M/Y Azzam" → "worked on a superyacht"
 */
function anonymizeYachtNames(text: string, yachts: YachtExperienceForAnonymization[]): string {
  const escapeRegex = (str: string) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Common yacht prefixes to strip from stored names and match in text
  const prefixes = [
    // Motor yacht variants
    'M/Y', 'MY', 'M.Y.', 'MV', 'M/V', 'M.V.',
    // Sailing yacht variants
    'S/Y', 'SY', 'S.Y.', 'SV', 'S/V', 'S.V.',
    // Training yacht (rare but exists)
    'T/Y', 'TY', 'T.Y.',
  ];
  const prefixPattern = new RegExp(`^(${prefixes.map(escapeRegex).join('|')})\\s*`, 'i');

  let result = text;

  for (const yacht of yachts) {
    if (!yacht.yacht_name) continue;

    const rawYachtName = yacht.yacht_name.trim();
    if (rawYachtName.length < 2) continue;

    // Strip any prefix from the stored yacht name to get the core name
    // e.g., "M/Y BURKUT" → "BURKUT", "BURKUT" → "BURKUT"
    const coreName = rawYachtName.replace(prefixPattern, '').trim();
    if (coreName.length < 2) continue;

    // Build the replacement based on available info
    const sizePart = yacht.yacht_size_meters ? `${yacht.yacht_size_meters}m ` : '';
    const typePart = getYachtTypeLabel(yacht.yacht_type);
    const replacement = `a ${sizePart}${typePart}`;

    // Match patterns with prefix: "M/Y BURKUT", "MY BURKUT", etc.
    for (const prefix of prefixes) {
      // Pattern: "M/Y Eclipse" or "M/Y Eclipse (85m)"
      const patternWithPrefix = new RegExp(
        `\\b${escapeRegex(prefix)}\\s*${escapeRegex(coreName)}(?:\\s*\\([^)]*\\))?`,
        'gi'
      );
      result = result.replace(patternWithPrefix, replacement);
    }

    // Also match the raw yacht name as stored (in case it includes the prefix)
    // This handles cases where the AI writes the exact stored name
    if (rawYachtName !== coreName && !isCommonWord(rawYachtName)) {
      const rawPattern = new RegExp(
        `\\b${escapeRegex(rawYachtName)}(?:\\s*\\([^)]*\\))?`,
        'gi'
      );
      result = result.replace(rawPattern, replacement);
    }

    // Pattern: just the yacht name when it's likely a vessel reference
    // Only replace if the name is distinctive (not a common word)
    if (!isCommonWord(coreName) && coreName.length >= 3) {
      // Match "on [Name]", "aboard [Name]", "the [Name]" patterns
      const contextPatterns = [
        new RegExp(`\\bon\\s+${escapeRegex(coreName)}\\b`, 'gi'),
        new RegExp(`\\baboard\\s+${escapeRegex(coreName)}\\b`, 'gi'),
        new RegExp(`\\bthe\\s+${escapeRegex(coreName)}\\b(?!\\s+(?:and|or|,))`, 'gi'),
      ];

      for (const pattern of contextPatterns) {
        result = result.replace(pattern, (match) => {
          const prefix = match.split(/\s+/)[0];
          return `${prefix} ${replacement}`;
        });
      }

      // Also match just the core name preceded by size info (common AI pattern)
      // e.g., "55m M/Y BURKUT" or "the 80m GENESIS"
      const sizeWithNamePattern = new RegExp(
        `\\b(\\d+m?)\\s*(?:${prefixes.map(escapeRegex).join('|')})?\\s*${escapeRegex(coreName)}\\b`,
        'gi'
      );
      result = result.replace(sizeWithNamePattern, replacement);
    }
  }

  // Clean up any double articles ("a a", "the a")
  result = result.replace(/\b(a|an|the)\s+(a|an)\s+/gi, '$2 ');

  // Clean up redundant size mentions like "55m a 55m motor yacht" → "a 55m motor yacht"
  result = result.replace(/\b(\d+m)\s+a\s+\1\s+/gi, 'a $1 ');

  return result;
}

/**
 * Anonymize property/estate names in text.
 * Replaces specific property names with generic descriptors while preserving location.
 *
 * @example
 * "Palace of Versailles (Paris)" → "a palace in Paris"
 * "worked at Blenheim Palace" → "worked at a private estate"
 */
function anonymizePropertyNames(text: string, properties: VillaExperienceForAnonymization[]): string {
  const escapeRegex = (str: string) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  let result = text;

  for (const property of properties) {
    if (!property.property_name) continue;

    const propertyName = property.property_name.trim();
    if (propertyName.length < 2) continue;

    // Build the replacement based on available info
    const typePart = getPropertyTypeLabel(property.property_type);
    const locationPart = property.location ? ` in ${property.location}` : '';
    const replacement = `a ${typePart}${locationPart}`;

    // Replace the property name
    if (!isCommonWord(propertyName) && propertyName.length >= 3) {
      // First, try to match "PropertyName in Location" to avoid duplication
      if (property.location) {
        const nameWithLocationPattern = new RegExp(
          `\\b${escapeRegex(propertyName)}\\s+in\\s+${escapeRegex(property.location)}\\b`,
          'gi'
        );
        result = result.replace(nameWithLocationPattern, replacement);
      }

      // Then replace standalone property name occurrences
      const propertyPattern = new RegExp(`\\b${escapeRegex(propertyName)}\\b`, 'gi');
      result = result.replace(propertyPattern, replacement);
    }
  }

  // Clean up any double articles
  result = result.replace(/\b(a|an|the)\s+(a|an)\s+/gi, '$2 ');

  return result;
}

/**
 * Get a human-readable label for yacht type.
 */
function getYachtTypeLabel(yachtType: string | null | undefined): string {
  if (!yachtType) return 'yacht';

  const typeMap: Record<string, string> = {
    motor: 'motor yacht',
    sail: 'sailing yacht',
    catamaran: 'catamaran',
    explorer: 'explorer yacht',
    classic: 'classic yacht',
    superyacht: 'superyacht',
    charter: 'charter yacht',
    private: 'private yacht',
    commercial: 'commercial vessel',
    cruise: 'cruise vessel',
    expedition: 'expedition yacht',
    cargo: 'cargo vessel',
    other: 'yacht',
  };

  return typeMap[yachtType.toLowerCase()] || 'yacht';
}

/**
 * Get a human-readable label for property type.
 */
function getPropertyTypeLabel(propertyType: string | null | undefined): string {
  if (!propertyType) return 'private residence';

  const typeMap: Record<string, string> = {
    villa: 'private villa',
    estate: 'private estate',
    private_residence: 'private residence',
    chalet: 'private chalet',
    penthouse: 'private penthouse',
    palace: 'palace',
    castle: 'castle',
    other: 'private residence',
  };

  return typeMap[propertyType.toLowerCase()] || 'private residence';
}

// Options for text/achievements anonymization
export interface AnonymizeOptions {
  yachtExperience?: YachtExperienceForAnonymization[] | null;
  villaExperience?: VillaExperienceForAnonymization[] | null;
  // Candidate name info for name anonymization
  firstName?: string | null;
  lastName?: string | null;
  position?: string | null;
}

// ----------------------------------------------------------------------------
// CANDIDATE NAME ANONYMIZATION (used by text and achievements functions)
// ----------------------------------------------------------------------------

/**
 * Anonymize candidate name in text.
 * Replaces full name, first name, and last name with generic terms.
 */
function anonymizeCandidateName(
  text: string,
  firstName: string,
  lastName: string,
  position?: string | null
): string {
  const escapeRegex = (str: string) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  let result = text;
  const fullName = `${firstName} ${lastName}`;
  const positionStr = position || 'candidate';

  // Replace possessive forms: "John Smith's" → "This candidate's"
  const possessiveFullName = new RegExp(`\\b${escapeRegex(fullName)}'s\\b`, 'gi');
  result = result.replace(possessiveFullName, `This ${positionStr}'s`);

  // Replace full name: "John Smith" → "This candidate"
  const fullNamePattern = new RegExp(`\\b${escapeRegex(fullName)}\\b`, 'gi');
  result = result.replace(fullNamePattern, `This ${positionStr}`);

  // Replace possessive first name: "John's" → "The candidate's"
  const possessiveFirst = new RegExp(`\\b${escapeRegex(firstName)}'s\\b`, 'gi');
  result = result.replace(possessiveFirst, "The candidate's");

  // Replace first name: "John" → "the candidate"
  const firstNamePattern = new RegExp(`\\b${escapeRegex(firstName)}\\b`, 'gi');
  result = result.replace(firstNamePattern, 'the candidate');

  // Replace last name if distinctive (not common word)
  if (!isCommonWord(lastName) && lastName.length >= 3) {
    const lastNamePattern = new RegExp(`\\b${escapeRegex(lastName)}\\b`, 'gi');
    result = result.replace(lastNamePattern, 'the candidate');
  }

  // Clean up awkward patterns
  result = result.replace(/the candidate the candidate/gi, 'the candidate');
  result = result.replace(/This candidate This candidate/gi, 'This candidate');

  return result;
}

// ----------------------------------------------------------------------------
// CAREER ACHIEVEMENTS ANONYMIZATION
// ----------------------------------------------------------------------------

/**
 * Anonymize career achievements/highlights text.
 * Removes specific employer names and optionally candidate names while preserving quantifiable achievements.
 *
 * @example
 * "Managed 25-person team at Buckingham Palace" → "Managed 25-person team at a palace"
 * "Served 5 seasons on M/Y Eclipse (85m)" → "Served 5 seasons on a 85m motor yacht"
 */
export function anonymizeCareerAchievements(
  achievements: string | string[] | null | undefined,
  yachtExperience?: YachtExperienceForAnonymization[] | null,
  villaExperience?: VillaExperienceForAnonymization[] | null,
  options?: AnonymizeOptions
): string[] {
  if (!achievements) return [];

  const achievementList = Array.isArray(achievements) ? achievements : [achievements];

  return achievementList.map((achievement) => {
    if (!achievement) return '';

    let anonymized = achievement;

    // Anonymize candidate name if provided
    if (options?.firstName && options?.lastName) {
      anonymized = anonymizeCandidateName(
        anonymized,
        options.firstName,
        options.lastName,
        options.position
      );
    }

    // Anonymize yacht names
    const yachts = options?.yachtExperience ?? yachtExperience;
    if (yachts && yachts.length > 0) {
      anonymized = anonymizeYachtNames(anonymized, yachts);
    }

    // Anonymize property names
    const villas = options?.villaExperience ?? villaExperience;
    if (villas && villas.length > 0) {
      anonymized = anonymizePropertyNames(anonymized, villas);
    }

    // Clean up double spaces
    anonymized = anonymized.replace(/\s+/g, ' ').trim();

    return anonymized;
  }).filter(Boolean);
}

/**
 * Anonymize a single text string by removing employer names and optionally candidate names.
 * Useful for "why good fit" explanations and other single-string fields.
 *
 * @example
 * "Their experience on M/Y Eclipse (85m) makes them ideal" → "Their experience on a 85m motor yacht makes them ideal"
 * "John Smith's extensive experience..." → "This candidate's extensive experience..."
 */
export function anonymizeText(
  text: string | null | undefined,
  yachtExperience?: YachtExperienceForAnonymization[] | null,
  villaExperience?: VillaExperienceForAnonymization[] | null,
  options?: AnonymizeOptions
): string {
  if (!text) return '';

  let anonymized = text;

  // Anonymize candidate name if provided
  if (options?.firstName && options?.lastName) {
    anonymized = anonymizeCandidateName(
      anonymized,
      options.firstName,
      options.lastName,
      options.position
    );
  }

  // Anonymize yacht names
  const yachts = options?.yachtExperience ?? yachtExperience;
  if (yachts && yachts.length > 0) {
    anonymized = anonymizeYachtNames(anonymized, yachts);
  }

  // Anonymize property names
  const villas = options?.villaExperience ?? villaExperience;
  if (villas && villas.length > 0) {
    anonymized = anonymizePropertyNames(anonymized, villas);
  }

  // Clean up double spaces
  anonymized = anonymized.replace(/\s+/g, ' ').trim();

  return anonymized;
}
