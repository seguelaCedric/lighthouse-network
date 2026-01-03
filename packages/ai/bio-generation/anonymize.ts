// ============================================================================
// BIO ANONYMIZATION
// ============================================================================
// Convert named bios to anonymous versions for public display
// ============================================================================

import type { ReferenceDetail } from '../cv-extraction/types';

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
  references?: ReferenceDetail[] | null
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
