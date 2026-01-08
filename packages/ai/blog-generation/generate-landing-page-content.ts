// ============================================================================
// AI LANDING PAGE CONTENT GENERATION SERVICE
// ============================================================================
// Generates SEO-optimized content for landing pages including position
// descriptions, location info, FAQs, and keywords
// ============================================================================

import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

// Use Claude Sonnet 4.5 for high-quality content
const contentModel = anthropic('claude-sonnet-4-20250514');

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

  // Generate all content sections in parallel for efficiency
  // Wrap each in try-catch to handle individual failures gracefully
  const results = await Promise.allSettled([
    generateAboutPosition(params.position, locationString),
    generateLocationInfo(params.position, locationString),
    generateServiceDescription(params.position, locationString),
    generateProcessDetails(params.position, locationString),
    generateFAQContent(params.position, locationString),
    generateKeywords(params.position, locationString),
  ]);

  // Extract results or use fallbacks
  const aboutPosition = results[0].status === 'fulfilled' ? results[0].value : '';
  const locationInfo = results[1].status === 'fulfilled' ? results[1].value : '';
  const serviceDescription = results[2].status === 'fulfilled' ? results[2].value : '';
  const processDetails = results[3].status === 'fulfilled' ? results[3].value : '';
  const faqContent = results[4].status === 'fulfilled' ? results[4].value : [];
  const keywords = results[5].status === 'fulfilled' ? results[5].value : { primary: [], secondary: [] };

  // Log any failures
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Content generation failed for section ${index}:`, result.reason);
    }
  });

  // If all failed, throw an error
  if (results.every(r => r.status === 'rejected')) {
    throw new Error('All content generation sections failed. Please check your API key and try again.');
  }

  return {
    about_position: aboutPosition,
    location_info: locationInfo,
    service_description: serviceDescription,
    process_details: processDetails,
    faq_content: faqContent,
    primary_keywords: keywords.primary,
    secondary_keywords: keywords.secondary,
  };
}

/**
 * Generate About Position section (300-500 words)
 */
async function generateAboutPosition(
  position: string,
  location: string
): Promise<string> {
  const schema = z.object({
    content: z.string().describe('HTML formatted content about the position'),
  });

  try {
    const { object } = await generateObject({
      model: contentModel,
      schema,
      prompt: `Write a comprehensive 300-500 word description about ${position} positions. 

Requirements:
- Use proper HTML formatting (h2, h3, p, ul, li tags)
- Include information about responsibilities, qualifications, and value proposition
- Optimize for SEO with natural keyword usage (1-2% keyword density)
- Write in a professional, authoritative tone
- Include specific examples and details
- Structure with clear headings (h2 for main sections, h3 for subsections)
- Target location: ${location}

Format the response as HTML. Do not include a title/heading at the top - start with content.`,
    });

    if (!object || !object.content) {
      throw new Error('Failed to generate about position: invalid response');
    }

    return object.content;
  } catch (error) {
    console.error('Error generating about position:', error);
    throw error;
  }
}

/**
 * Generate Location Information section (200-300 words)
 */
async function generateLocationInfo(
  position: string,
  location: string
): Promise<string> {
  const schema = z.object({
    content: z.string().describe('HTML formatted location-specific content'),
  });

  try {
    const { object } = await generateObject({
      model: contentModel,
      schema,
      prompt: `Write a 200-300 word location-specific information section about ${position} positions in ${location}.

Requirements:
- Use proper HTML formatting (h2, h3, p, ul, li tags)
- Include market insights, salary ranges, demand information
- Mention local market conditions and trends
- Include location-specific considerations
- Optimize for SEO with natural keyword usage
- Write in a professional, informative tone
- Structure with clear headings

Format the response as HTML. Do not include a title/heading at the top - start with content.`,
    });

    if (!object || !object.content) {
      throw new Error('Failed to generate location info: invalid response');
    }

    return object.content;
  } catch (error) {
    console.error('Error generating location info:', error);
    throw error;
  }
}

/**
 * Generate Service Description section (200-300 words)
 */
async function generateServiceDescription(
  position: string,
  location: string
): Promise<string> {
  const schema = z.object({
    content: z.string().describe('HTML formatted service description'),
  });

  try {
    const { object } = await generateObject({
      model: contentModel,
      schema,
      prompt: `Write a 200-300 word service description for ${position} placement services in ${location}.

Requirements:
- Use proper HTML formatting (h2, h3, p, ul, li tags)
- Describe what's included in the service
- Explain the pricing model (success-fee based)
- Mention guarantees and risk reversal
- Highlight unique value propositions
- Optimize for SEO with natural keyword usage
- Write in a persuasive, professional tone
- Structure with clear headings

Format the response as HTML. Do not include a title/heading at the top - start with content.`,
    });

    if (!object || !object.content) {
      throw new Error('Failed to generate service description: invalid response');
    }

    return object.content;
  } catch (error) {
    console.error('Error generating service description:', error);
    throw error;
  }
}

/**
 * Generate Process Details section (200-300 words)
 */
async function generateProcessDetails(
  position: string,
  location: string
): Promise<string> {
  const schema = z.object({
    content: z.string().describe('HTML formatted process details'),
  });

  try {
    const { object } = await generateObject({
      model: contentModel,
      schema,
      prompt: `Write a 200-300 word detailed explanation of the hiring process for ${position} positions in ${location}.

Requirements:
- Use proper HTML formatting (h2, h3, p, ul, li, ol tags)
- Explain the step-by-step process in detail
- Include timelines and expectations
- Address common questions about the process
- Optimize for SEO with natural keyword usage
- Write in a clear, informative tone
- Structure with clear headings and numbered steps where appropriate

Format the response as HTML. Do not include a title/heading at the top - start with content.`,
    });

    if (!object || !object.content) {
      throw new Error('Failed to generate process details: invalid response');
    }

    return object.content;
  } catch (error) {
    console.error('Error generating process details:', error);
    throw error;
  }
}

/**
 * Generate FAQ content (8-12 questions)
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

  try {
    const { object } = await generateObject({
      model: contentModel,
      schema,
      prompt: `Generate 8-12 frequently asked questions about hiring a ${position} in ${location}.

Requirements:
- Questions should be specific and relevant to the position and location
- Answers should be comprehensive (50-100 words each)
- Answers should be formatted as HTML (use p tags, ul/li for lists)
- Cover topics like: cost, timeline, qualifications, vetting process, guarantees, location-specific questions
- Write in a helpful, informative tone
- Optimize for SEO with natural keyword usage

Return as an array of question/answer pairs.`,
    });

    if (!object || !object.faqs) {
      throw new Error('Failed to generate FAQ content: invalid response');
    }

    return object.faqs;
  } catch (error) {
    console.error('Error generating FAQ content:', error);
    throw error;
  }
}

/**
 * Generate SEO keywords
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

  try {
    const { object } = await generateObject({
      model: contentModel,
      schema,
      prompt: `Generate SEO keywords for a landing page about hiring a ${position} in ${location}.

Requirements:
- Primary keywords: 3-5 high-value, high-intent keywords (e.g., "hire butler Sydney", "butler recruitment Australia")
- Secondary keywords: 5-10 related, long-tail keywords (e.g., "private butler services", "butler placement agency")
- Keywords should be relevant to the position and location
- Include variations and related terms
- Focus on search terms potential clients would use

Return primary and secondary keyword arrays.`,
    });

    if (!object) {
      throw new Error('Failed to generate keywords: no object returned');
    }

    return {
      primary: object.primary_keywords || [],
      secondary: object.secondary_keywords || [],
    };
  } catch (error) {
    console.error('Error generating keywords:', error);
    throw error;
  }
}
