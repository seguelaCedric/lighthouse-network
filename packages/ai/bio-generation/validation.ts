// ============================================================================
// BIO ANONYMIZATION VALIDATION
// ============================================================================
// Pattern-based validation to detect PII leaks in anonymized bios.
// Acts as a safety net to catch anything the AI anonymization missed.
// ============================================================================

/**
 * Validate that an anonymized bio doesn't contain PII.
 * Returns array of warning messages (empty = no issues detected).
 *
 * @param bio - The anonymized bio to validate
 * @param firstName - Candidate's first name to check for
 * @param lastName - Candidate's last name to check for
 * @param yachtNames - Array of yacht names to check for (optional)
 * @param propertyNames - Array of property names to check for (optional)
 * @returns Array of warning messages (empty if valid)
 *
 * @example
 * const warnings = validateAnonymizedBio(
 *   "Worked on VICTORIA as Bosun",
 *   "John",
 *   "Smith",
 *   ["M/Y VICTORIA"],
 *   null
 * );
 * // Returns: ["LEAK: Yacht name 'M/Y VICTORIA' found"]
 */
export function validateAnonymizedBio(
  bio: string,
  firstName: string,
  lastName: string,
  yachtNames?: string[] | null,
  propertyNames?: string[] | null
): string[] {
  const warnings: string[] = [];

  if (!bio || bio.trim().length === 0) {
    return warnings;
  }

  const bioLower = bio.toLowerCase();

  // Check for candidate full name
  const fullName = `${firstName} ${lastName}`.toLowerCase();
  if (bioLower.includes(fullName)) {
    warnings.push(`LEAK: Candidate full name "${firstName} ${lastName}" detected`);
  }

  // Check for first name alone (if distinctive enough)
  if (firstName.length > 3 && bioLower.includes(firstName.toLowerCase())) {
    // Check it's not part of a common word
    const firstNamePattern = new RegExp(`\\b${firstName}\\b`, 'i');
    if (firstNamePattern.test(bio)) {
      warnings.push(`LEAK: Candidate first name "${firstName}" detected`);
    }
  }

  // Check for last name alone
  if (lastName.length > 3 && bioLower.includes(lastName.toLowerCase())) {
    const lastNamePattern = new RegExp(`\\b${lastName}\\b`, 'i');
    if (lastNamePattern.test(bio)) {
      warnings.push(`LEAK: Candidate last name "${lastName}" detected`);
    }
  }

  // Check for yacht names (strip prefixes before checking)
  const YACHT_PREFIX_REGEX = /^(M\/Y|MY|M\.Y\.|MV|M\/V|M\.V\.|S\/Y|SY|S\.Y\.|SV|S\/V|S\.V\.|T\/Y|TY|T\.Y\.)\s*/i;

  if (yachtNames && yachtNames.length > 0) {
    for (const yachtName of yachtNames) {
      if (!yachtName || yachtName.trim().length < 3) continue;

      // Strip prefix to get core name
      const coreName = yachtName.replace(YACHT_PREFIX_REGEX, '').trim();

      // Check if core name appears in bio
      if (coreName.length > 2) {
        // Case-insensitive check
        if (bioLower.includes(coreName.toLowerCase())) {
          warnings.push(`LEAK: Yacht name "${yachtName}" (core: "${coreName}") detected`);
        }
      }
    }
  }

  // Check for property names
  if (propertyNames && propertyNames.length > 0) {
    for (const propertyName of propertyNames) {
      if (!propertyName || propertyName.trim().length < 3) continue;

      if (bioLower.includes(propertyName.toLowerCase())) {
        warnings.push(`LEAK: Property name "${propertyName}" detected`);
      }
    }
  }

  // Check for common company name patterns (heuristic detection)
  const COMPANY_PATTERNS = [
    // Well-known tech companies (exclude software/product names)
    /\b(Google|Amazon|Apple|Meta|Facebook|Netflix|Tesla|Oracle|Adobe|Salesforce|IBM|Intel|Cisco)(?!\s+(?:Excel|Word|Office|Drive|Cloud|Suite|365))\b/gi,
    // Microsoft - only if NOT followed by software names (Excel, Word, etc.)
    /\bMicrosoft(?!\s+(?:Excel|Word|Office|PowerPoint|Outlook|Teams|365|OneDrive))\b/gi,
    // Well-known hospitality brands
    /\b(Ritz-Carlton|Four Seasons|Marriott|Hilton|Hyatt|Mandarin Oriental|Rosewood|Aman|Bulgari)\b/gi,
    // Corporate suffixes
    /\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)\s+(Inc\.|Corp\.|Corporation|Ltd\.|Limited|LLC|LLP|GmbH|S\.A\.|AG)\b/g,
    // Acronym companies (2-5 uppercase letters) in employment context
    /\b(?:worked\s+(?:at|for)|joined|employed\s+(?:at|by))\s+([A-Z]{2,5})\b/gi,
  ];

  for (const pattern of COMPANY_PATTERNS) {
    const matches = bio.matchAll(pattern);
    for (const match of matches) {
      const companyName = match[1] || match[0];
      warnings.push(`LEAK: Possible company name "${companyName}" detected`);
    }
  }

  return warnings;
}

/**
 * Safe wrapper for validateAnonymizedBio that logs warnings without throwing.
 * Use this in production APIs to monitor PII leaks without breaking functionality.
 *
 * @param bio - The anonymized bio to validate
 * @param firstName - Candidate's first name
 * @param lastName - Candidate's last name
 * @param yachtNames - Array of yacht names (optional)
 * @param propertyNames - Array of property names (optional)
 *
 * @example
 * // In API route:
 * validateAnonymizedBioSafe(
 *   bioAnonymized,
 *   candidate.first_name,
 *   candidate.last_name,
 *   yachtNames,
 *   propertyNames
 * );
 * // Logs warnings to console if PII detected, but doesn't throw
 */
export function validateAnonymizedBioSafe(
  bio: string,
  firstName: string,
  lastName: string,
  yachtNames?: string[] | null,
  propertyNames?: string[] | null
): void {
  const warnings = validateAnonymizedBio(bio, firstName, lastName, yachtNames, propertyNames);

  if (warnings.length > 0) {
    console.error('[PII VALIDATION] ⚠️  Potential PII leak detected in anonymized bio:');
    warnings.forEach((warning, idx) => {
      console.error(`  ${idx + 1}. ${warning}`);
    });

    // TODO: Send to monitoring service (Sentry, DataDog, CloudWatch, etc.)
    // Example:
    // Sentry.captureMessage('PII leak in anonymized bio', {
    //   level: 'warning',
    //   extra: { warnings, firstName, lastName }
    // });
  }
}

/**
 * Check if a bio needs anonymization (contains any PII patterns).
 * Useful for backfill scripts to identify candidates that need processing.
 *
 * @param bio - The bio to check
 * @param firstName - Candidate's first name
 * @param lastName - Candidate's last name
 * @returns true if PII patterns detected
 */
export function bioNeedsAnonymization(
  bio: string,
  firstName: string,
  lastName: string
): boolean {
  if (!bio || bio.trim().length === 0) {
    return false;
  }

  const bioLower = bio.toLowerCase();

  // Check for candidate name
  const fullName = `${firstName} ${lastName}`.toLowerCase();
  if (bioLower.includes(fullName)) {
    return true;
  }

  // Check for yacht/vessel patterns (M/Y, M/V, S/Y, etc.)
  const YACHT_PATTERN = /\b(M\/Y|MY|M\.Y\.|MV|M\/V|M\.V\.|S\/Y|SY|S\.Y\.|SV|S\/V|S\.V\.)\s+[A-Z]/gi;
  if (YACHT_PATTERN.test(bio)) {
    return true;
  }

  // Check for property patterns (Villa X, Palace X, etc.)
  const PROPERTY_PATTERN = /\b(Villa|Palace|Château|Castle|Estate|Manor)\s+[A-Z][a-z]+/gi;
  if (PROPERTY_PATTERN.test(bio)) {
    return true;
  }

  // Check for company patterns
  const COMPANY_SUFFIX_PATTERN = /\b[A-Z][A-Za-z]+\s+(Inc\.|Corp\.|Ltd\.|LLC)\b/g;
  if (COMPANY_SUFFIX_PATTERN.test(bio)) {
    return true;
  }

  // Check for well-known company names
  const KNOWN_COMPANIES = /\b(Goldman Sachs|Microsoft|Google|Amazon|Apple|Meta|Facebook|Ritz-Carlton|Four Seasons|Marriott)\b/gi;
  if (KNOWN_COMPANIES.test(bio)) {
    return true;
  }

  return false;
}
