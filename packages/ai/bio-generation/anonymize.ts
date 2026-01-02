// ============================================================================
// BIO ANONYMIZATION
// ============================================================================
// Convert named bios to anonymous versions for public display
// ============================================================================

/**
 * Anonymize a candidate bio for public display.
 *
 * Replaces the candidate's name with a nationality/position pattern
 * while preserving all other content.
 *
 * @example
 * Input: "John Smith is a 32-year-old British Deckhand..."
 * Output: "This British Deckhand is a 32-year-old professional..."
 *
 * @param bioFull - The complete bio with candidate name
 * @param firstName - Candidate's first name
 * @param lastName - Candidate's last name
 * @param nationality - Candidate's nationality (e.g., "British")
 * @param position - Candidate's primary position (e.g., "Deckhand")
 * @returns Anonymized bio with name replaced
 */
export function anonymizeBio(
  bioFull: string | null | undefined,
  firstName: string,
  lastName: string,
  nationality: string | null | undefined,
  position: string | null | undefined
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

  // Clean up any double spaces created by replacements
  anonymized = anonymized.replace(/\s+/g, ' ');

  // Clean up any awkward "the candidate the candidate" patterns
  anonymized = anonymized.replace(/the candidate the candidate/gi, 'the candidate');

  return anonymized.trim();
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
