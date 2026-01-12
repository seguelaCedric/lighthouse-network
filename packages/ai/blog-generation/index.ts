// ============================================================================
// AI BLOG POST GENERATION SERVICE
// ============================================================================
// Template-based AI blog post generation for SEO and content marketing
// ============================================================================

import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

// Use Claude Sonnet 4.5 for high-quality blog content
const blogModel = anthropic('claude-sonnet-4-20250514');

// ============================================================================
// TYPES
// ============================================================================

export type BlogContentType =
  // Employer-focused
  | 'hiring_guide'
  | 'salary_guide'
  | 'interview_questions'
  | 'what_to_look_for'
  | 'onboarding_guide'
  | 'retention_strategy'
  | 'legal_requirements'
  // Candidate-focused
  | 'position_overview'
  | 'career_path'
  | 'skills_required'
  | 'certifications'
  // General
  | 'location_insights'
  | 'case_study'
  | 'faq_expansion';

export type TargetAudience = 'employer' | 'candidate' | 'both';

export interface BlogGenerationParams {
  contentType: BlogContentType;
  targetAudience: TargetAudience;
  position?: string;
  location?: string;
  primaryKeyword: string;
  targetWordCount?: number;
  relatedLandingPageUrls?: string[];
  customInstructions?: string;
}

export interface GeneratedBlogPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  targetKeywords: string[];
  relatedLandingPageUrls: string[];
  // Answer capsule fields for AI/LLM optimization
  answerCapsule: string;
  answerCapsuleQuestion: string;
  keyFacts: string[];
}

// ============================================================================
// TEMPLATE PROMPTS
// ============================================================================

const TEMPLATE_PROMPTS: Record<BlogContentType, string> = {
  // Employer-focused templates
  hiring_guide: `Write a comprehensive guide to hiring a {position} in {location}. Include:
- Step-by-step hiring process
- What to look for in candidates
- Red flags to avoid
- Best practices for interviews
- Onboarding considerations
- Timeline expectations
- Cost considerations

Target word count: {wordCount} words. Write in a professional, authoritative tone. Include specific examples and actionable advice.`,

  salary_guide: `Write a detailed salary guide for {position} positions in {location}. Include:
- Market rates by experience level (entry, mid, senior)
- Benefits expectations
- Total compensation considerations
- Regional variations
- Industry benchmarks
- Factors affecting salary

Target word count: {wordCount} words. Include specific salary ranges and data points.`,

  interview_questions: `Create a comprehensive guide with top interview questions for hiring a {position}. Include:
- 20+ behavioral questions
- Technical/skill questions
- Situational scenarios
- Sample answers or what to look for
- Red flag responses
- Questions to assess cultural fit

Target word count: {wordCount} words. Format with clear sections and examples.`,

  what_to_look_for: `Write a guide on what to look for when hiring a {position}. Include:
- Essential qualifications and certifications
- Key skills (hard and soft)
- Personality traits that matter
- Experience indicators
- Red flags to watch for
- Green flags that indicate quality

Target word count: {wordCount} words. Be specific and actionable.`,

  onboarding_guide: `Create an onboarding guide for a new {position}. Include:
- First week checklist
- Training requirements
- Integration strategies
- Setting expectations
- Performance metrics
- Common onboarding mistakes to avoid

Target word count: {wordCount} words. Provide practical, actionable steps.`,

  retention_strategy: `Write about retaining top {position} talent. Include:
- Compensation strategies
- Career development opportunities
- Work-life balance considerations
- Recognition and appreciation
- Professional growth paths
- Common reasons for turnover

Target word count: {wordCount} words. Focus on practical retention strategies.`,

  legal_requirements: `Create a guide on legal requirements for hiring a {position} in {location}. Include:
- Work permits and visas
- Employment contract requirements
- Local labor laws
- Tax considerations
- Insurance requirements
- Compliance checklist

Target word count: {wordCount} words. Be specific to {location} regulations.`,

  // Candidate-focused templates
  position_overview: `Write a comprehensive job description and overview for {position} roles. Include:
- Day-to-day responsibilities
- Required skills and qualifications
- Typical work environment
- Career progression paths
- Salary expectations
- What makes a successful {position}

Target word count: {wordCount} words. Write from the candidate's perspective.`,

  career_path: `Create a career path guide for {position} professionals. Include:
- Entry-level to senior progression
- Skill development at each stage
- Typical timeline for advancement
- Industry trends and opportunities
- Continuing education recommendations
- Success stories

Target word count: {wordCount} words. Inspire and guide career growth.`,

  skills_required: `Write about skills required to become a {position}. Include:
- Hard skills (technical abilities)
- Soft skills (interpersonal)
- Training and education needed
- Certifications required
- Experience prerequisites
- How to develop these skills

Target word count: {wordCount} words. Be specific and actionable.`,

  certifications: `Create a guide on certifications for {position} professionals. Include:
- Required certifications
- Recommended training programs
- Certification providers
- Renewal requirements
- Cost considerations
- Career impact of certifications

Target word count: {wordCount} words. Include specific certification names and details.`,

  // General templates
  location_insights: `Write market insights about hiring {position} in {location}. Include:
- Market trends and demand
- Supply and demand dynamics
- Local considerations
- Salary trends
- Availability of candidates
- Regional characteristics

Target word count: {wordCount} words. Be specific to {location} market.`,

  case_study: `Write a success story about finding a {position} in {location}. Include:
- Client situation and requirements
- Challenges faced
- Our approach and process
- Candidate selection process
- Results achieved
- Client testimonial (create realistic example)

Target word count: {wordCount} words. Tell a compelling story with specific details.`,

  faq_expansion: `Create extended FAQ content about {position} in {location}. Include:
- 10-15 common questions
- Detailed, comprehensive answers
- Related topics and considerations
- Practical examples
- Actionable advice

Target word count: {wordCount} words. Format as Q&A with detailed answers.`,
};

// ============================================================================
// GENERATION FUNCTION
// ============================================================================

export async function generateBlogPost(
  params: BlogGenerationParams
): Promise<GeneratedBlogPost> {
  const {
    contentType,
    targetAudience,
    position = '',
    location = '',
    primaryKeyword,
    targetWordCount = 2000,
    relatedLandingPageUrls = [],
    customInstructions = '',
  } = params;

  // Get template prompt
  const templatePrompt = TEMPLATE_PROMPTS[contentType] || TEMPLATE_PROMPTS.hiring_guide;

  // Build the prompt with answer capsule instructions for AI/LLM optimization
  const systemPrompt = `You are an expert content writer specializing in recruitment and staffing for high-end yacht crew and private household staff.

Your task is to write a comprehensive, SEO-optimized blog post that:
1. Provides valuable, actionable information
2. Is optimized for search engines (especially AI/LLM search like ChatGPT, Perplexity, Claude)
3. Includes natural keyword usage (primary keyword: "${primaryKeyword}")
4. Has proper structure with headings (H2, H3)
5. Includes internal linking opportunities
6. Is written for ${targetAudience === 'employer' ? 'employers' : targetAudience === 'candidate' ? 'candidates' : 'both employers and candidates'}
7. Meets the target word count of approximately ${targetWordCount} words

${customInstructions ? `Additional instructions: ${customInstructions}` : ''}

## CRITICAL: AI/LLM OPTIMIZATION REQUIREMENTS

At the START of your response (before the main article), you MUST include an "Answer Capsule" section.
This is essential for AI search citations. Follow these requirements EXACTLY:

### Answer Capsule Requirements:
1. Start with a clear, direct answer to the main question in 2-3 sentences
2. Use simple, declarative sentences (no qualifiers like "it depends")
3. Include NO links in the capsule - it must be completely self-contained
4. Make it quotable and attributable
5. Keep under 100 words
6. Follow with 3-5 "Key Facts" as bullet points

### REQUIRED FORMAT (follow exactly):

---ANSWER_CAPSULE_START---
QUESTION: [The main question this article answers, e.g., "How much does a butler earn in London?"]
ANSWER: [Your direct, link-free answer in 2-3 sentences. Under 100 words. Simple, declarative sentences.]
KEY_FACTS:
- [Fact 1 - specific, quotable]
- [Fact 2 - specific, quotable]
- [Fact 3 - specific, quotable]
- [Fact 4 - specific, quotable (optional)]
- [Fact 5 - specific, quotable (optional)]
---ANSWER_CAPSULE_END---

Then continue with the full article content in Markdown format with proper headings, lists, and formatting.

## CONTENT STRUCTURE FOR AI CITATIONS:
- Start each section with clear definitions: "X is..." or "X refers to..."
- Use numbered lists for processes, bullets for features
- Use H2 as questions, answer immediately below
- Define terms when first introduced
- Avoid ambiguous pronouns - repeat subject names instead of "it/they"`;

  const userPrompt = templatePrompt
    .replace(/{position}/g, position || 'the position')
    .replace(/{location}/g, location || 'the location')
    .replace(/{wordCount}/g, targetWordCount.toString());

  // Generate content
  const result = await generateText({
    model: blogModel,
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.7,
    maxTokens: Math.min(targetWordCount * 3, 8000), // Rough estimate: 3 tokens per word
  });

  const fullContent = result.text;

  // Parse answer capsule from content
  const { answerCapsule, answerCapsuleQuestion, keyFacts, content } = parseAnswerCapsule(fullContent);

  // Generate title and excerpt
  const titleResult = await generateText({
    model: blogModel,
    system: `You must return EXACTLY ONE LINE of text - the blog post title only. No formatting, no quotes, no asterisks, no options, no explanations. Just: Title Text Here

The title must be 60-70 characters and include: "${primaryKeyword}"`,
    prompt: `Blog content:\n\n${content.substring(0, 500)}\n\nWrite one single title line (60-70 characters, includes "${primaryKeyword}"):`,
    temperature: 0.7,
    maxTokens: 50,
  });

  const excerptResult = await generateText({
    model: blogModel,
    system: `You are an SEO expert. Return ONLY the meta description text, nothing else. No explanations. The description must be 150-160 characters and include the primary keyword.`,
    prompt: `Based on this blog post content, generate a meta description:\n\n${content.substring(0, 500)}\n\nReturn ONLY the meta description text, nothing else.`,
    temperature: 0.7,
    maxTokens: 200,
  });

  const title = titleResult.text.trim().replace(/^["']|["']$/g, '');
  const excerpt = excerptResult.text.trim().replace(/^["']|["']$/g, '').substring(0, 160);

  // Generate slug from title
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Extract keywords from content
  const keywords = extractKeywords(content, primaryKeyword);

  // Generate meta title and description
  const metaTitle = title.length <= 60 ? title : `${title.substring(0, 57)}...`;
  const metaDescription = excerpt.length <= 160 ? excerpt : `${excerpt.substring(0, 157)}...`;

  return {
    title,
    slug,
    excerpt,
    content,
    metaTitle,
    metaDescription,
    targetKeywords: keywords,
    relatedLandingPageUrls,
    // Answer capsule fields for AI/LLM optimization
    answerCapsule,
    answerCapsuleQuestion,
    keyFacts,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parses the answer capsule section from AI-generated content
 * Extracts the question, answer, and key facts for AI/LLM optimization
 */
function parseAnswerCapsule(fullContent: string): {
  answerCapsule: string;
  answerCapsuleQuestion: string;
  keyFacts: string[];
  content: string;
} {
  // Default values if parsing fails
  let answerCapsule = '';
  let answerCapsuleQuestion = '';
  let keyFacts: string[] = [];
  let content = fullContent;

  // Look for the answer capsule section
  const capsuleStartMarker = '---ANSWER_CAPSULE_START---';
  const capsuleEndMarker = '---ANSWER_CAPSULE_END---';

  const startIndex = fullContent.indexOf(capsuleStartMarker);
  const endIndex = fullContent.indexOf(capsuleEndMarker);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    // Extract the capsule section
    const capsuleSection = fullContent.substring(
      startIndex + capsuleStartMarker.length,
      endIndex
    ).trim();

    // Parse question (use [\s\S] instead of . with /s flag for compatibility)
    const questionMatch = capsuleSection.match(/QUESTION:\s*([\s\S]+?)(?=\nANSWER:)/);
    if (questionMatch) {
      answerCapsuleQuestion = questionMatch[1].trim();
    }

    // Parse answer (use [\s\S] instead of . with /s flag for compatibility)
    const answerMatch = capsuleSection.match(/ANSWER:\s*([\s\S]+?)(?=KEY_FACTS:|$)/);
    if (answerMatch) {
      answerCapsule = answerMatch[1].trim();
    }

    // Parse key facts
    const factsMatch = capsuleSection.match(/KEY_FACTS:\s*([\s\S]*?)$/);
    if (factsMatch) {
      const factsText = factsMatch[1].trim();
      // Extract bullet points
      keyFacts = factsText
        .split('\n')
        .map(line => line.replace(/^[-*]\s*/, '').trim())
        .filter(line => line.length > 0);
    }

    // Remove capsule section from main content
    content = fullContent.substring(endIndex + capsuleEndMarker.length).trim();
  } else {
    // Fallback: try to generate capsule from content if not found
    // This handles cases where the AI didn't follow the exact format
    console.warn('Answer capsule section not found in expected format. Using fallback extraction.');

    // Try to extract first paragraph as answer (use [\s\S] instead of . with /s flag for compatibility)
    const firstParagraphMatch = content.match(/^(?:#.*\n+)?([\s\S]+?)(?:\n\n|$)/);
    if (firstParagraphMatch) {
      answerCapsule = firstParagraphMatch[1].replace(/^#+\s*/, '').trim();
    }
  }

  return {
    answerCapsule,
    answerCapsuleQuestion,
    keyFacts,
    content,
  };
}

function extractKeywords(content: string, primaryKeyword: string): string[] {
  const keywords = [primaryKeyword];
  
  // Extract potential keywords (simple approach - can be enhanced)
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 4);

  // Count word frequency
  const wordCounts = new Map<string, number>();
  words.forEach((word) => {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  });

  // Get top 5-10 keywords (excluding common words)
  const commonWords = new Set(['the', 'this', 'that', 'with', 'from', 'have', 'will', 'would', 'could', 'should']);
  const sortedWords = Array.from(wordCounts.entries())
    .filter(([word]) => !commonWords.has(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 9)
    .map(([word]) => word);

  return [...new Set([...keywords, ...sortedWords])].slice(0, 10);
}

// ============================================================================
// URL MAPPING FUNCTION
// ============================================================================

/**
 * Maps blog post to existing landing pages by position and location
 * Returns array of original_url_path values for internal linking
 */
export async function mapBlogPostToLandingPages(
  position: string,
  location: string,
  supabase: any
): Promise<string[]> {
  if (!position && !location) {
    return [];
  }

  const query = supabase.from('seo_landing_pages').select('original_url_path').eq('is_active', true);

  if (position) {
    query.eq('position_slug', position.toLowerCase().replace(/\s+/g, '-'));
  }

  if (location) {
    // Try to match city, state, or country
    const locationLower = location.toLowerCase();
    query.or(
      `city.ilike.%${locationLower}%,state.ilike.%${locationLower}%,country.ilike.%${locationLower}%`
    );
  }

  const { data } = await query.limit(5);

  return (data || []).map((page: any) => page.original_url_path);
}

// Re-export idea generation
export { generateContentIdeas, type ContentIdea, type IdeaGenerationParams } from './generate-ideas';

