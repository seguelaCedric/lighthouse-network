// ============================================================================
// AI ANONYMIZATION TESTS
// ============================================================================
// Tests for AI-powered bio anonymization and pattern validation
// ============================================================================

import { describe, it, expect } from 'vitest';
import { aiAnonymizeBio } from './ai-anonymize';
import { validateAnonymizedBio, bioNeedsAnonymization } from './validation';

// ----------------------------------------------------------------------------
// AI ANONYMIZATION TESTS
// ----------------------------------------------------------------------------

describe('aiAnonymizeBio', () => {
  it('should remove person names and yacht names', async () => {
    const bioFull = 'John Smith worked as Chief Steward on M/Y VICTORIA (85m) for 3 years, maintaining 5-star standards.';
    const result = await aiAnonymizeBio(bioFull, 'John', 'Smith');

    // Should NOT contain PII
    expect(result).not.toContain('John');
    expect(result).not.toContain('Smith');
    expect(result).not.toContain('VICTORIA');

    // Should preserve details
    expect(result.toLowerCase()).toMatch(/chief steward/i);
    expect(result).toMatch(/85m|superyacht|motor yacht/i);
    expect(result).toMatch(/3 years|three years/i);
  }, 30000); // 30s timeout for AI call

  it('should remove company names', async () => {
    const bioFull = 'Jane Doe worked at Microsoft as a Senior Project Manager for 5 years, leading cross-functional teams.';
    const result = await aiAnonymizeBio(bioFull, 'Jane', 'Doe');

    // Should NOT contain PII
    expect(result).not.toContain('Jane');
    expect(result).not.toContain('Doe');
    expect(result).not.toContain('Microsoft');

    // Should preserve details
    expect(result.toLowerCase()).toMatch(/project manager|senior/i);
    expect(result).toMatch(/technology company|tech company|software company/i);
    expect(result).toMatch(/5 years|five years/i);
  }, 30000);

  it('should remove property names while preserving location', async () => {
    const bioFull = 'Chris Rogers worked at Villa Ephrussi in Monaco as Head Chef, managing a team of 8.';
    const result = await aiAnonymizeBio(bioFull, 'Chris', 'Rogers');

    // Should NOT contain PII
    expect(result).not.toContain('Chris');
    expect(result).not.toContain('Rogers');
    expect(result).not.toContain('Ephrussi');

    // Should preserve details
    expect(result.toLowerCase()).toMatch(/head chef|chef/i);
    expect(result).toContain('Monaco');
    expect(result.toLowerCase()).toMatch(/villa|private villa|estate/i);
    expect(result).toMatch(/8|eight/i); // Team size
  }, 30000);

  it('should handle multiple vessels in bio', async () => {
    const bioFull = 'Sarah worked on M/Y ECLIPSE (163m) and S/Y MALTESE FALCON (88m), gaining diverse experience.';
    const result = await aiAnonymizeBio(bioFull, 'Sarah', 'Thompson');

    // Should NOT contain PII
    expect(result).not.toContain('Sarah');
    expect(result).not.toContain('Thompson');
    expect(result).not.toContain('ECLIPSE');
    expect(result).not.toContain('MALTESE FALCON');
    expect(result).not.toContain('FALCON');

    // Should preserve details
    expect(result).toMatch(/163m/);
    expect(result).toMatch(/88m/);
    expect(result.toLowerCase()).toMatch(/motor yacht|sailing yacht|yacht/i);
  }, 30000);

  it('should handle M/V prefix (motor vessel)', async () => {
    const bioFull = 'Alex worked as Bosun on M/V DAWN (72m) in the Mediterranean.';
    const result = await aiAnonymizeBio(bioFull, 'Alex', 'Martinez');

    expect(result).not.toContain('Alex');
    expect(result).not.toContain('Martinez');
    expect(result).not.toContain('DAWN');
    expect(result.toLowerCase()).toMatch(/bosun/i);
    expect(result).toMatch(/72m/);
    expect(result).toContain('Mediterranean');
  }, 30000);

  it('should handle M.Y. prefix with dots', async () => {
    const bioFull = 'Tom served on M.Y. ANTELOPE IV (43m) as Sole Deckhand/Jr. Engineer.';
    const result = await aiAnonymizeBio(bioFull, 'Tom', 'Williams');

    expect(result).not.toContain('Tom');
    expect(result).not.toContain('Williams');
    expect(result).not.toContain('ANTELOPE');
    expect(result).toMatch(/43m/);
    expect(result.toLowerCase()).toMatch(/deckhand|engineer/i);
  }, 30000);

  it('should preserve empty bios', async () => {
    const result = await aiAnonymizeBio('', 'John', 'Doe');
    expect(result).toBe('');
  });
});

// ----------------------------------------------------------------------------
// VALIDATION TESTS
// ----------------------------------------------------------------------------

describe('validateAnonymizedBio', () => {
  it('should detect leaked candidate full name', () => {
    const bio = 'John Smith worked as a chef on a luxury yacht.';
    const warnings = validateAnonymizedBio(bio, 'John', 'Smith', null, null);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('full name');
    expect(warnings[0]).toContain('John Smith');
  });

  it('should detect leaked first name', () => {
    const bio = 'John worked as a chef on a luxury yacht.';
    const warnings = validateAnonymizedBio(bio, 'John', 'Smith', null, null);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some(w => w.includes('first name'))).toBe(true);
  });

  it('should detect leaked yacht names', () => {
    const bio = 'Worked on VICTORIA as Chief Steward for 3 years.';
    const warnings = validateAnonymizedBio(bio, 'Alex', 'Jones', ['M/Y VICTORIA'], null);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('Yacht name');
    expect(warnings[0]).toContain('VICTORIA');
  });

  it('should detect leaked yacht names with M/V prefix', () => {
    const bio = 'Experience on DAWN and other vessels.';
    const warnings = validateAnonymizedBio(bio, 'Chris', 'Lee', ['M/V DAWN'], null);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('DAWN');
  });

  it('should detect leaked property names', () => {
    const bio = 'Managed Villa Ephrussi with excellence.';
    const warnings = validateAnonymizedBio(bio, 'Jane', 'Doe', null, ['Villa Ephrussi']);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('Property name');
    expect(warnings[0]).toContain('Ephrussi');
  });

  it('should detect common company names', () => {
    const bio = 'Previously worked at Microsoft before joining the yacht industry.';
    const warnings = validateAnonymizedBio(bio, 'Tom', 'Brown', null, null);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some(w => w.includes('Microsoft'))).toBe(true);
  });

  it('should pass clean anonymized bios', () => {
    const bio = 'This candidate worked as Chief Steward on a 85m motor yacht, maintaining 5-star standards across Mediterranean and Caribbean seasons.';
    const warnings = validateAnonymizedBio(bio, 'John', 'Smith', ['M/Y VICTORIA'], null);

    expect(warnings).toHaveLength(0);
  });

  it('should handle roman numerals in yacht names', () => {
    // Note: "ANTELOPE" without "IV" is just the core yacht name
    // The validation strips "M.Y. " prefix and checks for "ANTELOPE IV"
    const bio = 'Served on ANTELOPE IV for multiple seasons.';
    const warnings = validateAnonymizedBio(bio, 'Chris', 'Rogers', ['M.Y. ANTELOPE IV'], null);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('ANTELOPE');
  });
});

// ----------------------------------------------------------------------------
// HELPER FUNCTION TESTS
// ----------------------------------------------------------------------------

describe('bioNeedsAnonymization', () => {
  it('should detect candidate name in bio', () => {
    const bio = 'John Smith is an experienced chef.';
    expect(bioNeedsAnonymization(bio, 'John', 'Smith')).toBe(true);
  });

  it('should detect yacht patterns', () => {
    const bio = 'Worked on M/Y ECLIPSE as Bosun.';
    expect(bioNeedsAnonymization(bio, 'Alex', 'Jones')).toBe(true);
  });

  it('should detect property patterns', () => {
    const bio = 'Managed Villa Rothschild in Cap Ferrat.';
    expect(bioNeedsAnonymization(bio, 'Jane', 'Doe')).toBe(true);
  });

  it('should detect company patterns', () => {
    const bio = 'Worked at Goldman Sachs before transitioning to yachting.';
    expect(bioNeedsAnonymization(bio, 'Tom', 'Brown')).toBe(true);
  });

  it('should pass clean anonymized bios', () => {
    const bio = 'This candidate worked on a 163m superyacht as Bosun, demonstrating excellent seamanship.';
    expect(bioNeedsAnonymization(bio, 'Alex', 'Jones')).toBe(false);
  });

  it('should handle empty bios', () => {
    expect(bioNeedsAnonymization('', 'John', 'Doe')).toBe(false);
  });
});
