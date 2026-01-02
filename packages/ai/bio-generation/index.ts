// ============================================================================
// BIO GENERATION MODULE
// ============================================================================
// AI-powered candidate bio generation with named/anonymous variants
// ============================================================================

import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

import {
  BIO_GENERATION_SYSTEM_PROMPT,
  buildBioGenerationPrompt,
} from './prompts';
import type {
  BioGenerationRequest,
  BioGenerationResult,
  BioGenerationCandidate,
} from './types';
import { BIO_GENERATION_VERSION } from './types';

// Re-export types and utilities
export * from './types';
export * from './anonymize';
export { BIO_GENERATION_SYSTEM_PROMPT, buildBioGenerationPrompt } from './prompts';

// Use Claude 3.5 Haiku for cost-effective generation
const bioModel = anthropic('claude-3-5-haiku-20241022');

// ----------------------------------------------------------------------------
// MAIN GENERATION FUNCTION
// ----------------------------------------------------------------------------

/**
 * Generate a 5-paragraph candidate bio from their CV/profile data.
 *
 * The bio follows this structure:
 * 1. Personal details (name, age, nationality)
 * 2. Qualifications (certifications, education)
 * 3. Experience (roles, vessels, impact)
 * 4. Activities/Hobbies (outside interests)
 * 5. Personality (character traits from references)
 *
 * @param request - The bio generation request with candidate data
 * @returns The generated bio with confidence score
 */
export async function generateCandidateBio(
  request: BioGenerationRequest
): Promise<BioGenerationResult> {
  const { candidate } = request;

  // Calculate age from DOB if available
  const age = candidate.date_of_birth
    ? calculateAge(candidate.date_of_birth)
    : null;

  // Build comprehensive candidate context
  const candidateContext = buildCandidateContext(candidate, age);

  // Generate the bio
  const { text } = await generateText({
    model: bioModel,
    system: BIO_GENERATION_SYSTEM_PROMPT,
    prompt: buildBioGenerationPrompt(
      candidateContext,
      candidate.first_name,
      candidate.last_name,
      age,
      candidate.nationality ?? null
    ),
    temperature: 0.3, // Slightly creative but consistent
  });

  // Calculate confidence based on data completeness
  const confidence = calculateConfidence(candidate);

  // Collect any generation notes
  const notes = collectGenerationNotes(candidate);

  return {
    bio_full: text.trim(),
    generation_confidence: confidence,
    generation_notes: notes.length > 0 ? notes : undefined,
  };
}

/**
 * Safe wrapper that catches errors and returns null
 */
export async function generateCandidateBioSafe(
  request: BioGenerationRequest
): Promise<BioGenerationResult | null> {
  try {
    return await generateCandidateBio(request);
  } catch (error) {
    console.error('[Bio Generation] Error:', error);
    return null;
  }
}

// ----------------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------------

/**
 * Calculate age from date of birth string
 */
function calculateAge(dob: string): number | null {
  try {
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age > 0 && age < 100 ? age : null;
  } catch {
    return null;
  }
}

/**
 * Build comprehensive context string from candidate data
 */
function buildCandidateContext(
  candidate: BioGenerationCandidate,
  age: number | null
): string {
  const sections: string[] = [];

  // Basic info
  sections.push(`## CANDIDATE OVERVIEW
Name: ${candidate.first_name} ${candidate.last_name}
Age: ${age ?? 'Not specified'}
Nationality: ${candidate.nationality || 'Not specified'}
Primary Position: ${candidate.primary_position || 'Not specified'}
Years Experience: ${candidate.years_experience ?? 'Not specified'}`);

  // Positions held
  if (candidate.positions_held && candidate.positions_held.length > 0) {
    const positions = candidate.positions_held
      .map((p) => `- ${p.normalized || p.raw_title} (${p.category})`)
      .join('\n');
    sections.push(`## POSITIONS HELD\n${positions}`);
  }

  // Yacht experience
  if (
    candidate.yacht_experience_extracted &&
    candidate.yacht_experience_extracted.length > 0
  ) {
    const yachts = candidate.yacht_experience_extracted
      .map((y) => {
        const parts = [
          y.position,
          y.yacht_name ? `on ${y.yacht_name}` : null,
          y.yacht_size_meters ? `(${y.yacht_size_meters}m)` : null,
          y.duration_months ? `for ${y.duration_months} months` : null,
        ].filter(Boolean);
        return `- ${parts.join(' ')}`;
      })
      .join('\n');
    sections.push(`## YACHT EXPERIENCE\n${yachts}`);
  }

  // Villa/household experience
  if (
    candidate.villa_experience_extracted &&
    candidate.villa_experience_extracted.length > 0
  ) {
    const villas = candidate.villa_experience_extracted
      .map((v) => {
        const parts = [
          v.position,
          v.property_name ? `at ${v.property_name}` : null,
          v.location ? `(${v.location})` : null,
          v.duration_months ? `for ${v.duration_months} months` : null,
        ].filter(Boolean);
        return `- ${parts.join(' ')}`;
      })
      .join('\n');
    sections.push(`## HOUSEHOLD/VILLA EXPERIENCE\n${villas}`);
  }

  // Certifications
  if (
    candidate.certifications_extracted &&
    candidate.certifications_extracted.length > 0
  ) {
    const certs = candidate.certifications_extracted
      .map((c) => `- ${c.name} (${c.category})`)
      .join('\n');
    sections.push(`## CERTIFICATIONS\n${certs}`);
  }

  // Licenses
  if (
    candidate.licenses_extracted &&
    candidate.licenses_extracted.length > 0
  ) {
    const licenses = candidate.licenses_extracted
      .map((l) => {
        const parts = [l.name, l.issuing_authority ? `(${l.issuing_authority})` : null];
        return `- ${parts.filter(Boolean).join(' ')}`;
      })
      .join('\n');
    sections.push(`## LICENSES\n${licenses}`);
  }

  // Education
  if (
    candidate.education_extracted &&
    candidate.education_extracted.length > 0
  ) {
    const education = candidate.education_extracted
      .map((e) => {
        const parts = [
          e.qualification,
          e.field_of_study ? `in ${e.field_of_study}` : null,
          e.institution ? `from ${e.institution}` : null,
          e.year_completed ? `(${e.year_completed})` : null,
        ].filter(Boolean);
        return `- ${parts.join(' ')}`;
      })
      .join('\n');
    sections.push(`## EDUCATION\n${education}`);
  }

  // Languages
  if (
    candidate.languages_extracted &&
    candidate.languages_extracted.length > 0
  ) {
    const languages = candidate.languages_extracted
      .map((l) => `- ${l.language}: ${l.proficiency}`)
      .join('\n');
    sections.push(`## LANGUAGES\n${languages}`);
  }

  // Skills
  if (candidate.cv_skills && candidate.cv_skills.length > 0) {
    sections.push(`## SKILLS\n${candidate.cv_skills.join(', ')}`);
  }

  // References (for personality paragraph)
  if (
    candidate.references_extracted &&
    candidate.references_extracted.length > 0
  ) {
    const refs = candidate.references_extracted
      .map((r) => {
        const parts = [
          r.name,
          r.position ? `(${r.position})` : null,
          r.relationship ? `- ${r.relationship}` : null,
          r.notes ? `Notes: ${r.notes}` : null,
        ].filter(Boolean);
        return `- ${parts.join(' ')}`;
      })
      .join('\n');
    sections.push(`## REFERENCES (for personality insight)\n${refs}`);
  }

  // Existing profile summary (for additional context)
  if (candidate.profile_summary) {
    sections.push(`## EXISTING PROFILE SUMMARY\n${candidate.profile_summary}`);
  }

  // Key flags
  const flags: string[] = [];
  if (candidate.has_stcw) flags.push('STCW certified');
  if (candidate.has_eng1) flags.push('ENG1 medical');
  if (candidate.highest_license) flags.push(`Highest license: ${candidate.highest_license}`);
  if (flags.length > 0) {
    sections.push(`## KEY FLAGS\n${flags.join(', ')}`);
  }

  return sections.join('\n\n');
}

/**
 * Calculate confidence score based on data completeness
 */
function calculateConfidence(candidate: BioGenerationCandidate): number {
  let score = 0.5; // Base score

  // Essential fields
  if (candidate.first_name && candidate.last_name) score += 0.1;
  if (candidate.nationality) score += 0.05;
  if (candidate.primary_position) score += 0.1;
  if (candidate.years_experience && candidate.years_experience > 0) score += 0.05;

  // Experience data
  if (
    (candidate.yacht_experience_extracted &&
      candidate.yacht_experience_extracted.length > 0) ||
    (candidate.villa_experience_extracted &&
      candidate.villa_experience_extracted.length > 0)
  ) {
    score += 0.1;
  }

  // Qualifications
  if (
    (candidate.certifications_extracted &&
      candidate.certifications_extracted.length > 0) ||
    (candidate.licenses_extracted && candidate.licenses_extracted.length > 0)
  ) {
    score += 0.05;
  }

  // References (for personality paragraph)
  if (
    candidate.references_extracted &&
    candidate.references_extracted.length > 0
  ) {
    score += 0.05;
  }

  return Math.min(score, 1);
}

/**
 * Collect warnings/notes about the generation
 */
function collectGenerationNotes(candidate: BioGenerationCandidate): string[] {
  const notes: string[] = [];

  if (!candidate.date_of_birth) {
    notes.push('Age not available - excluded from bio');
  }

  if (
    (!candidate.yacht_experience_extracted ||
      candidate.yacht_experience_extracted.length === 0) &&
    (!candidate.villa_experience_extracted ||
      candidate.villa_experience_extracted.length === 0)
  ) {
    notes.push('No detailed work history available');
  }

  if (
    !candidate.references_extracted ||
    candidate.references_extracted.length === 0
  ) {
    notes.push('No references available - personality paragraph based on career progression');
  }

  if (!candidate.cv_skills || candidate.cv_skills.length === 0) {
    notes.push('No skills data extracted from CV');
  }

  return notes;
}

// Export version constant
export { BIO_GENERATION_VERSION };
