// ============================================================================
// AI CONTENT IDEA GENERATION SERVICE
// ============================================================================
// Generate blog post ideas based on existing landing pages, market analysis,
// and content gaps
// ============================================================================

import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import type { BlogContentType, TargetAudience } from './index';

// Use Claude Sonnet 4.5 for strategic content planning
const ideaModel = anthropic('claude-sonnet-4-20250514');

// ============================================================================
// TYPES
// ============================================================================

export interface ContentIdea {
  position: string;
  location: string;
  content_type: BlogContentType;
  target_audience: TargetAudience;
  primary_keyword: string;
  rationale: string; // Why this idea is valuable
  estimated_traffic_potential?: 'high' | 'medium' | 'low';
}

export interface IdeaGenerationParams {
  // Optional filters
  positions?: string[]; // Limit to specific positions
  locations?: string[]; // Limit to specific locations
  targetAudience?: TargetAudience; // Filter by audience
  contentTypes?: BlogContentType[]; // Filter by content types
  maxIdeas?: number; // Maximum number of ideas to generate (default: 20)
  
  // Context data
  existingLandingPages?: Array<{
    position: string;
    location: string;
    country: string;
    state?: string | null;
    city?: string | null;
  }>;
  existingBlogPosts?: Array<{
    target_position: string | null;
    target_location: string | null;
    content_type: string | null;
  }>;
  
  // Strategy focus
  focus?: 'gaps' | 'trends' | 'competitors' | 'keywords' | 'all';
  customPrompt?: string; // Additional instructions
}

// ============================================================================
// GENERATION FUNCTION
// ============================================================================

export async function generateContentIdeas(
  params: IdeaGenerationParams
): Promise<ContentIdea[]> {
  const {
    positions = [],
    locations = [],
    targetAudience,
    contentTypes = [],
    maxIdeas = 20,
    existingLandingPages = [],
    existingBlogPosts = [],
    focus = 'all',
    customPrompt = '',
  } = params;

  // Build context from existing data
  const landingPageContext = existingLandingPages.length > 0
    ? `\n\nExisting Landing Pages (${existingLandingPages.length}):\n` +
      existingLandingPages
        .slice(0, 50) // Limit to avoid token limits
        .map(
          (page) =>
            `- ${page.position} in ${[page.city, page.state, page.country]
              .filter(Boolean)
              .join(', ')}`
        )
        .join('\n')
    : '';

  const blogPostContext = existingBlogPosts.length > 0
    ? `\n\nExisting Blog Posts (${existingBlogPosts.length}):\n` +
      existingBlogPosts
        .slice(0, 50)
        .map(
          (post) =>
            `- ${post.content_type || 'general'} about ${post.target_position || 'general'} in ${post.target_location || 'general'}`
        )
        .join('\n')
    : '';

  // Build focus instructions
  const focusInstructions = {
    gaps: 'Focus on content gaps - positions/locations that have landing pages but no supporting blog content.',
    trends: 'Focus on trending topics and current market demands in luxury crew recruitment.',
    competitors: 'Focus on content opportunities that competitors might be missing.',
    keywords: 'Focus on high-value keyword opportunities with good search volume potential.',
    all: 'Consider all factors: content gaps, market trends, competitor analysis, and keyword opportunities.',
  };

  // Build the prompt
  const systemPrompt = `You are an expert SEO content strategist specializing in luxury yacht crew and private household staff recruitment.

Your task is to generate strategic blog post ideas that will:
1. Support existing SEO landing pages with valuable content
2. Fill content gaps in the content strategy
3. Target high-value keywords for lead generation
4. Provide value to both employers and candidates
5. Improve search engine rankings and AI/LLM search visibility

${focusInstructions[focus]}

${customPrompt}

Generate ${maxIdeas} blog post ideas. Each idea should include:
- Position (e.g., "Butler", "Chef", "Captain")
- Location (e.g., "Sydney", "New York", "Monaco")
- Content type (from the available types)
- Target audience (employer, candidate, or both)
- Primary keyword (SEO-optimized, 2-5 words)
- Brief rationale explaining why this content is valuable
- Traffic potential estimate (high/medium/low)

Prioritize ideas that:
- Complement existing landing pages
- Fill clear content gaps
- Target underserved markets
- Have strong SEO potential
- Provide genuine value to readers`;

  const userPrompt = `Generate ${maxIdeas} strategic blog post ideas for a luxury crew recruitment agency.

${landingPageContext}
${blogPostContext}

${positions.length > 0 ? `\nFocus on these positions: ${positions.join(', ')}` : ''}
${locations.length > 0 ? `\nFocus on these locations: ${locations.join(', ')}` : ''}
${targetAudience ? `\nTarget audience: ${targetAudience}` : ''}
${contentTypes.length > 0 ? `\nContent types to consider: ${contentTypes.join(', ')}` : ''}

Return your ideas as a JSON array. Each idea should have:
- position: string
- location: string
- content_type: string (one of: hiring_guide, salary_guide, interview_questions, what_to_look_for, onboarding_guide, retention_strategy, legal_requirements, position_overview, career_path, skills_required, certifications, location_insights, case_study, faq_expansion)
- target_audience: string (one of: employer, candidate, both)
- primary_keyword: string (SEO-optimized keyword phrase)
- rationale: string (1-2 sentences explaining the value)
- estimated_traffic_potential: string (one of: high, medium, low)`;

  try {
    const result = await generateText({
      model: ideaModel,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.8, // Higher creativity for ideation
      maxTokens: 4000,
    });

    // Parse JSON response
    const text = result.text.trim();
    
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : text;
    
    let ideas: ContentIdea[];
    try {
      ideas = JSON.parse(jsonText);
    } catch (parseError) {
      // Fallback: try to extract ideas from text
      console.error('Failed to parse JSON, attempting text extraction:', parseError);
      ideas = extractIdeasFromText(text);
    }

    // Validate and clean ideas
    return ideas
      .slice(0, maxIdeas)
      .map((idea) => ({
        position: idea.position || '',
        location: idea.location || '',
        content_type: (idea.content_type || 'hiring_guide') as BlogContentType,
        target_audience: (idea.target_audience || 'both') as TargetAudience,
        primary_keyword: idea.primary_keyword || `${idea.position} ${idea.location}`,
        rationale: idea.rationale || 'Valuable content for SEO and lead generation',
        estimated_traffic_potential: idea.estimated_traffic_potential || 'medium',
      }))
      .filter((idea) => idea.position && idea.location && idea.primary_keyword);
  } catch (error) {
    console.error('Error generating content ideas:', error);
    throw new Error('Failed to generate content ideas');
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function extractIdeasFromText(text: string): ContentIdea[] {
  // Fallback extraction if JSON parsing fails
  const ideas: ContentIdea[] = [];
  const lines = text.split('\n');
  
  let currentIdea: Partial<ContentIdea> = {};
  for (const line of lines) {
    if (line.match(/position|location|content_type|target_audience|primary_keyword|rationale/i)) {
      // Try to extract structured data
      const match = line.match(/(\w+):\s*(.+)/i);
      if (match) {
        const key = match[1].toLowerCase();
        const value = match[2].trim();
        
        if (key.includes('position')) currentIdea.position = value;
        if (key.includes('location')) currentIdea.location = value;
        if (key.includes('content')) currentIdea.content_type = value as BlogContentType;
        if (key.includes('audience')) currentIdea.target_audience = value as TargetAudience;
        if (key.includes('keyword')) currentIdea.primary_keyword = value;
        if (key.includes('rationale')) currentIdea.rationale = value;
        
        if (currentIdea.position && currentIdea.location && currentIdea.primary_keyword) {
          ideas.push({
            position: currentIdea.position,
            location: currentIdea.location,
            content_type: (currentIdea.content_type || 'hiring_guide') as BlogContentType,
            target_audience: (currentIdea.target_audience || 'both') as TargetAudience,
            primary_keyword: currentIdea.primary_keyword,
            rationale: currentIdea.rationale || '',
          });
          currentIdea = {};
        }
      }
    }
  }
  
  return ideas.length > 0 ? ideas : [];
}
