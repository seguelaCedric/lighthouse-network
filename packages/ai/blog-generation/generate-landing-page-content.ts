// ============================================================================
// AI LANDING PAGE CONTENT GENERATION SERVICE
// ============================================================================
// Generates SEO-optimized content for landing pages including position
// descriptions, location info, FAQs, and keywords
// ============================================================================

import { generateObject } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

// Create model lazily to ensure env vars are available at runtime
// (module-level initialization can fail in serverless environments)
function getContentModel() {
  const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  return anthropic('claude-sonnet-4-20250514');
}

// ============================================================================
// TYPES
// ============================================================================

export interface LandingPageContentParams {
  position: string;
  country: string;
  state?: string | null;
  city?: string | null;
  existingContent?: {
    about_position?: string | null;
    location_info?: string | null;
    service_description?: string | null;
    process_details?: string | null;
  };
}

export interface GeneratedLandingPageContent {
  about_position: string; // 300-500 words, HTML format
  location_info: string; // 200-300 words, HTML format
  service_description: string; // 200-300 words, HTML format
  process_details: string; // 200-300 words, HTML format
  faq_content: Array<{ question: string; answer: string }>; // 8-12 FAQs
  primary_keywords: string[]; // 3-5 primary keywords
  secondary_keywords: string[]; // 5-10 secondary keywords
}

// ============================================================================
// GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate comprehensive SEO-optimized content for a landing page
 */
export async function generateLandingPageContent(
  params: LandingPageContentParams
): Promise<GeneratedLandingPageContent> {
  const locationString = [params.city, params.state, params.country]
    .filter(Boolean)
    .join(', ');

  // Generate content sections SEQUENTIALLY to avoid rate limits
  console.log(`Generating content for ${params.position} in ${locationString}`);

  try {
    const aboutPosition = await generateAboutPosition(params.position, locationString);
    console.log('Generated aboutPosition');

    const locationInfo = await generateLocationInfo(params.position, locationString);
    console.log('Generated locationInfo');

    const serviceDescription = await generateServiceDescription(params.position, locationString);
    console.log('Generated serviceDescription');

    const processDetails = await generateProcessDetails(params.position, locationString);
    console.log('Generated processDetails');

    const faqContent = await generateFAQContent(params.position, locationString);
    console.log('Generated faqContent');

    const keywords = await generateKeywords(params.position, locationString);
    console.log('Generated keywords');

    return {
      about_position: aboutPosition,
      location_info: locationInfo,
      service_description: serviceDescription,
      process_details: processDetails,
      faq_content: faqContent,
      primary_keywords: keywords.primary,
      secondary_keywords: keywords.secondary,
    };
  } catch (error) {
    // Log the full error details for debugging
    console.error('Content generation error details:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? (error as Error & { cause?: unknown }).cause : undefined,
      position: params.position,
      location: locationString,
    });
    throw error;
  }
}

/**
 * Generate About Position section (300-500 words)
 * Throws on failure - do not use fallback content
 */
async function generateAboutPosition(
  position: string,
  location: string
): Promise<string> {
  const schema = z.object({
    content: z.string().describe('HTML formatted content about the position'),
  });

  const result = await generateObject({
    model: getContentModel(),
    schema,
    prompt: `You are writing SEO content for Lighthouse Careers, a luxury private staffing agency that places high-end domestic staff for ultra-high-net-worth individuals and families.

Write a comprehensive 300-500 word description about ${position} positions in ${location}.

CONTEXT:
- Lighthouse Careers specializes in placing: Private Chefs, House Managers, Butlers, Personal Assistants, Estate Managers, and other luxury household staff
- Our clients are ultra-high-net-worth families, celebrities, executives, and royal households
- We place staff in private residences, estates, yachts, and chalets worldwide
- This is a B2B landing page targeting EMPLOYERS looking to hire a ${position}

CONTENT REQUIREMENTS:
- Focus on what makes an exceptional ${position} in private service (NOT restaurant/hotel roles)
- Include specific responsibilities unique to private household settings
- Mention qualifications, certifications, and experience employers should look for
- Highlight the value a professional ${position} brings to a luxury household
- Include location-specific insights about ${location} where relevant
- Use "hire a ${position}" and "${position} in ${location}" naturally for SEO

FORMAT REQUIREMENTS:
- Use proper HTML formatting (h2, h3, p, ul, li tags)
- Start with a compelling opening paragraph (no heading)
- Include 2-3 sections with h2/h3 headings
- Use bullet points for lists of responsibilities or qualifications
- Write in a professional, authoritative tone
- Do NOT start with an h1 or main title`,
  });

  if (!result?.object?.content) {
    throw new Error('generateAboutPosition: Invalid response from AI - no content returned');
  }

  return result.object.content;
}

/**
 * Generate Location Information section (200-300 words)
 * Throws on failure - do not use fallback content
 */
async function generateLocationInfo(
  position: string,
  location: string
): Promise<string> {
  const schema = z.object({
    content: z.string().describe('HTML formatted location-specific content'),
  });

  const result = await generateObject({
    model: getContentModel(),
    schema,
    prompt: `You are writing SEO content for Lighthouse Careers, a luxury private staffing agency.

Write a 200-300 word location-specific section about hiring a ${position} in ${location}.

CONTEXT:
- Target audience: Ultra-high-net-worth employers looking to hire private household staff
- Focus on the LOCAL MARKET in ${location} specifically

CONTENT REQUIREMENTS:
- Include realistic salary ranges for ${position} positions in ${location} (research typical UHNW household staff salaries)
- Mention local market demand and competition for talent
- Reference any location-specific considerations (cost of living, local culture, visa requirements if international)
- Mention nearby affluent areas or neighborhoods where demand is high
- Include any local certifications or requirements if applicable
- Use "${position} in ${location}" and "hire ${position} ${location}" naturally for SEO

FORMAT REQUIREMENTS:
- Use proper HTML formatting (h2, h3, p, ul, li tags)
- Start with an opening paragraph about the local market
- Include a section on salary/compensation insights
- Keep it concise but informative
- Do NOT start with an h1 or main title`,
  });

  if (!result?.object?.content) {
    throw new Error('generateLocationInfo: Invalid response from AI - no content returned');
  }

  return result.object.content;
}

/**
 * Generate Service Description section (200-300 words)
 * Throws on failure - do not use fallback content
 */
async function generateServiceDescription(
  position: string,
  location: string
): Promise<string> {
  const schema = z.object({
    content: z.string().describe('HTML formatted service description'),
  });

  const result = await generateObject({
    model: getContentModel(),
    schema,
    prompt: `You are writing SEO content for Lighthouse Careers, a luxury private staffing agency.

Write a 200-300 word service description for our ${position} placement services in ${location}.

ABOUT LIGHTHOUSE CAREERS:
- We are a boutique recruitment agency specializing in luxury private household staff
- We use a SUCCESS-FEE model (clients only pay when they hire)
- We offer a replacement guarantee
- We thoroughly vet all candidates (background checks, reference verification, skills assessment)
- We provide dedicated consultant support throughout the hiring process

CONTENT REQUIREMENTS:
- Emphasize our success-fee model (no upfront costs, no risk)
- Highlight our thorough vetting process
- Mention our replacement guarantee
- Include a clear call-to-action
- Use "${position} placement" and "hire ${position} ${location}" naturally for SEO

FORMAT REQUIREMENTS:
- Use proper HTML formatting (h2, h3, p, ul, li tags)
- Start with a compelling opening about our service
- Include bullet points for service features
- End with guarantee and CTA
- Write in a persuasive, professional tone
- Do NOT start with an h1 or main title`,
  });

  if (!result?.object?.content) {
    throw new Error('generateServiceDescription: Invalid response from AI - no content returned');
  }

  return result.object.content;
}

/**
 * Generate Process Details section (200-300 words)
 * Throws on failure - do not use fallback content
 */
async function generateProcessDetails(
  position: string,
  location: string
): Promise<string> {
  const schema = z.object({
    content: z.string().describe('HTML formatted process details'),
  });

  const result = await generateObject({
    model: getContentModel(),
    schema,
    prompt: `You are writing SEO content for Lighthouse Careers, a luxury private staffing agency.

Write a 200-300 word explanation of our hiring process for ${position} positions in ${location}.

OUR PROCESS:
1. Initial Consultation - Client shares requirements, household culture, and expectations
2. Candidate Search - We search our pre-vetted network of ${position} professionals
3. Shortlist Delivery - Within 24 hours, client receives curated shortlist with detailed profiles
4. Interviews - We coordinate interviews and provide guidance
5. Placement - We handle final references and assist with onboarding

CONTENT REQUIREMENTS:
- Explain each step clearly and professionally
- Mention our 24-hour shortlist turnaround
- Note that most placements complete within 1-2 weeks
- Emphasize the hands-on support throughout
- Use "hire ${position}" and "${position} recruitment" naturally for SEO

FORMAT REQUIREMENTS:
- Use proper HTML formatting (h2, h3, p, ol, li tags)
- Use an ordered list for the process steps
- Include brief timeline expectations
- Write in a clear, reassuring tone
- Do NOT start with an h1 or main title`,
  });

  if (!result?.object?.content) {
    throw new Error('generateProcessDetails: Invalid response from AI - no content returned');
  }

  return result.object.content;
}

/**
 * Generate FAQ content (8-12 questions)
 * Throws on failure - do not use fallback content
 */
async function generateFAQContent(
  position: string,
  location: string
): Promise<Array<{ question: string; answer: string }>> {
  const schema = z.object({
    faqs: z
      .array(
        z.object({
          question: z.string().describe('FAQ question'),
          answer: z.string().describe('FAQ answer in HTML format'),
        })
      )
      .min(8)
      .max(12),
  });

  const result = await generateObject({
    model: getContentModel(),
    schema,
    prompt: `You are writing SEO content for Lighthouse Careers, a luxury private staffing agency.

Generate 10-12 frequently asked questions about hiring a ${position} in ${location}.

CONTEXT:
- Target audience: Ultra-high-net-worth employers looking to hire private household staff
- Lighthouse Careers uses a success-fee model (no upfront costs)
- We offer a replacement guarantee
- Typical placement timeline: 1-2 weeks
- First shortlist delivered within 24 hours

FAQ TOPICS TO COVER:
1. Cost/pricing (success-fee model, no upfront fees)
2. Hiring timeline and process
3. Qualifications and experience to look for in a ${position}
4. Our vetting process (background checks, references, skills assessment)
5. Our replacement guarantee
6. Location-specific questions about ${location}
7. What's included in our service
8. How to get started
9. Salary expectations for ${position} in ${location}
10. Live-in vs. live-out arrangements (if applicable)
11. Travel requirements (if applicable for the position)
12. Trial periods and contracts

CONTENT REQUIREMENTS:
- Answers should be 50-150 words each
- Answers should be formatted as HTML (use p tags, ul/li for lists where appropriate)
- Be specific and helpful, not generic
- Include location-specific details where relevant
- Use "hire ${position}" and "${position} ${location}" naturally

Return as an array of question/answer pairs.`,
  });

  if (!result?.object?.faqs) {
    throw new Error('generateFAQContent: Invalid response from AI - no FAQs returned');
  }

  return result.object.faqs;
}

/**
 * Generate SEO keywords
 * Throws on failure - do not use fallback content
 */
async function generateKeywords(
  position: string,
  location: string
): Promise<{ primary: string[]; secondary: string[] }> {
  const schema = z.object({
    primary_keywords: z
      .array(z.string())
      .min(3)
      .max(5)
      .describe('Primary SEO keywords (3-5 keywords)'),
    secondary_keywords: z
      .array(z.string())
      .min(5)
      .max(10)
      .describe('Secondary SEO keywords (5-10 keywords)'),
  });

  const result = await generateObject({
    model: getContentModel(),
    schema,
    prompt: `Generate SEO keywords for a landing page about hiring a ${position} in ${location}.

CONTEXT:
- This is a B2B landing page for Lighthouse Careers, a luxury private staffing agency
- Target audience: Ultra-high-net-worth employers looking to hire household staff
- Focus on HIGH-INTENT keywords (people ready to hire)

PRIMARY KEYWORDS (3-5):
- High-value, high-intent transactional keywords
- Examples: "hire ${position.toLowerCase()} ${location.split(',')[0]}", "${position.toLowerCase()} agency ${location.split(',')[0]}"
- Include location in most primary keywords

SECONDARY KEYWORDS (5-10):
- Related long-tail keywords
- Include variations like: "${position.toLowerCase()} placement", "${position.toLowerCase()} recruitment", "find ${position.toLowerCase()}"
- Include some without location for broader reach
- Include industry terms like "private household staff", "domestic staffing"

Return primary and secondary keyword arrays.`,
  });

  if (!result?.object?.primary_keywords || !result?.object?.secondary_keywords) {
    throw new Error('generateKeywords: Invalid response from AI - no keywords returned');
  }

  return {
    primary: result.object.primary_keywords,
    secondary: result.object.secondary_keywords,
  };
}
