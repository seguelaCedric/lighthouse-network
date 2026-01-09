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
const contentModel = anthropic('claude-sonnet-4-5-20250514');

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
    const result = await generateObject({
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

    if (!result?.object?.content) {
      console.error('generateAboutPosition: Invalid response from AI');
      return generateDefaultAboutPosition(position, location);
    }

    return result.object.content;
  } catch (error) {
    console.error('Error generating about position:', error);
    return generateDefaultAboutPosition(position, location);
  }
}

function generateDefaultAboutPosition(position: string, location: string): string {
  return `<p>A professional ${position} plays a vital role in maintaining the highest standards of service and household management. In ${location}, qualified ${position} professionals are in high demand among discerning clients seeking exceptional domestic service.</p>
<h3>Key Responsibilities</h3>
<ul>
<li>Overseeing daily household operations and staff management</li>
<li>Ensuring impeccable service standards and guest satisfaction</li>
<li>Managing household budgets and vendor relationships</li>
<li>Coordinating events and maintaining property presentation</li>
</ul>
<h3>Qualifications</h3>
<p>The ideal ${position} candidate brings years of experience in luxury hospitality or private service, excellent communication skills, discretion, and a genuine commitment to service excellence.</p>`;
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
    const result = await generateObject({
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

    if (!result?.object?.content) {
      console.error('generateLocationInfo: Invalid response from AI');
      return generateDefaultLocationInfo(position, location);
    }

    return result.object.content;
  } catch (error) {
    console.error('Error generating location info:', error);
    return generateDefaultLocationInfo(position, location);
  }
}

function generateDefaultLocationInfo(position: string, location: string): string {
  const city = location.split(',')[0]?.trim() || location;
  return `<p>The market for ${position} professionals in ${location} continues to grow as high-net-worth individuals and families seek exceptional domestic staff. ${city} offers a robust job market with competitive compensation packages.</p>
<h3>Market Overview</h3>
<p>Employers in ${location} typically offer competitive salaries along with benefits such as accommodation, travel opportunities, and professional development. The demand for qualified ${position} candidates consistently exceeds supply in this region.</p>
<h3>What to Expect</h3>
<ul>
<li>Competitive salary packages based on experience</li>
<li>Opportunity to work with prestigious households</li>
<li>Professional growth and development</li>
<li>Excellent working conditions</li>
</ul>`;
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
    const result = await generateObject({
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

    if (!result?.object?.content) {
      console.error('generateServiceDescription: Invalid response from AI');
      return generateDefaultServiceDescription(position, location);
    }

    return result.object.content;
  } catch (error) {
    console.error('Error generating service description:', error);
    return generateDefaultServiceDescription(position, location);
  }
}

function generateDefaultServiceDescription(position: string, location: string): string {
  return `<p>Lighthouse Careers provides comprehensive ${position} placement services in ${location}. Our success-fee model means you only pay when you find the perfect candidate.</p>
<h3>Our Service Includes</h3>
<ul>
<li>Thorough candidate screening and vetting</li>
<li>Background checks and reference verification</li>
<li>Skills assessment and personality matching</li>
<li>Dedicated consultant support throughout the process</li>
</ul>
<h3>Our Guarantee</h3>
<p>We stand behind our placements with a replacement guarantee. If your new ${position} doesn't work out within the guarantee period, we'll find a replacement at no additional cost.</p>
<p><strong>No upfront fees. No risk. Just exceptional talent.</strong></p>`;
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
    const result = await generateObject({
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

    if (!result?.object?.content) {
      console.error('generateProcessDetails: Invalid response from AI');
      return generateDefaultProcessDetails(position, location);
    }

    return result.object.content;
  } catch (error) {
    console.error('Error generating process details:', error);
    return generateDefaultProcessDetails(position, location);
  }
}

function generateDefaultProcessDetails(position: string, location: string): string {
  return `<p>Our streamlined hiring process for ${position} positions in ${location} is designed to find you the perfect candidate quickly and efficiently.</p>
<h3>The Process</h3>
<ol>
<li><strong>Initial Consultation</strong> - Share your requirements, household culture, and expectations with our dedicated consultant.</li>
<li><strong>Candidate Search</strong> - We search our extensive network of pre-vetted ${position} professionals to find matches.</li>
<li><strong>Shortlist Delivery</strong> - Within 48 hours, receive a curated shortlist of qualified candidates with detailed profiles.</li>
<li><strong>Interviews</strong> - We coordinate interviews and provide guidance throughout the selection process.</li>
<li><strong>Placement</strong> - Once you've made your choice, we handle references and assist with onboarding.</li>
</ol>
<h3>Timeline</h3>
<p>Most placements are completed within 1-2 weeks, though this can vary based on your specific requirements and candidate availability.</p>`;
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
    const result = await generateObject({
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

    if (!result?.object?.faqs) {
      console.error('generateFAQContent: Invalid response from AI');
      return generateDefaultFAQContent(position, location);
    }

    return result.object.faqs;
  } catch (error) {
    console.error('Error generating FAQ content:', error);
    return generateDefaultFAQContent(position, location);
  }
}

function generateDefaultFAQContent(position: string, location: string): Array<{ question: string; answer: string }> {
  return [
    {
      question: `How much does it cost to hire a ${position} through Lighthouse Careers?`,
      answer: `<p>We operate on a success-fee model, meaning you only pay when you successfully hire a candidate. There are no upfront fees or retainer costs. Our fee is a percentage of the candidate's annual salary, which we'll discuss during your initial consultation.</p>`,
    },
    {
      question: `How long does the ${position} hiring process take?`,
      answer: `<p>Most placements are completed within 1-2 weeks. You'll receive your first shortlist of qualified candidates within 48 hours of sharing your requirements with us.</p>`,
    },
    {
      question: `What qualifications should a ${position} have?`,
      answer: `<p>Ideal candidates typically have relevant experience in luxury hospitality or private service, excellent references, strong communication skills, and often hold relevant certifications. We thoroughly vet all candidates before presenting them to you.</p>`,
    },
    {
      question: `How do you vet ${position} candidates?`,
      answer: `<p>Our comprehensive vetting process includes background checks, reference verification, skills assessments, and personal interviews. We only present candidates who meet our rigorous standards.</p>`,
    },
    {
      question: `Do you offer a guarantee on placements?`,
      answer: `<p>Yes! We stand behind our placements with a replacement guarantee. If your new ${position} doesn't work out within the guarantee period, we'll find a replacement at no additional cost.</p>`,
    },
    {
      question: `Can you help with ${position} positions in ${location}?`,
      answer: `<p>Absolutely! We have extensive experience placing ${position} professionals in ${location} and understand the local market, expectations, and requirements specific to this region.</p>`,
    },
    {
      question: `What's included in your ${position} recruitment service?`,
      answer: `<p>Our service includes requirement consultation, candidate sourcing, comprehensive vetting, shortlist preparation, interview coordination, reference checks, and placement support. We're with you every step of the way.</p>`,
    },
    {
      question: `How do I get started with hiring a ${position}?`,
      answer: `<p>Simply use our AI matching tool to see available candidates, or contact us directly. We'll schedule a consultation to understand your requirements and begin the search immediately.</p>`,
    },
  ];
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
    const result = await generateObject({
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

    // Check if result exists and has object property
    if (!result || !result.object) {
      console.error('generateKeywords: No result or object returned from generateObject');
      // Return default keywords as fallback
      return {
        primary: [
          `hire ${position.toLowerCase()} ${location.split(',')[0]}`.trim(),
          `${position.toLowerCase()} recruitment ${location.split(',').pop()?.trim()}`,
          `${position.toLowerCase()} agency`,
        ],
        secondary: [
          `${position.toLowerCase()} placement services`,
          `professional ${position.toLowerCase()}`,
          `${position.toLowerCase()} staffing`,
          `find ${position.toLowerCase()}`,
          `${position.toLowerCase()} jobs`,
        ],
      };
    }

    const object = result.object;

    return {
      primary: object.primary_keywords || [],
      secondary: object.secondary_keywords || [],
    };
  } catch (error) {
    console.error('Error generating keywords:', error);
    // Return default keywords as fallback instead of throwing
    return {
      primary: [
        `hire ${position.toLowerCase()} ${location.split(',')[0]}`.trim(),
        `${position.toLowerCase()} recruitment`,
        `${position.toLowerCase()} agency`,
      ],
      secondary: [
        `${position.toLowerCase()} placement`,
        `professional ${position.toLowerCase()}`,
        `${position.toLowerCase()} staffing`,
        `find ${position.toLowerCase()}`,
        `${position.toLowerCase()} services`,
      ],
    };
  }
}
