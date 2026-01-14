/**
 * Generate Cornerstone Pages for All Positions
 *
 * Creates location-agnostic hub pages that serve as:
 * - Ad landing pages (no geo-targeting needed)
 * - Hub pages linking to location-specific pages
 * - Parent pages for blog content clusters
 */

import { createClient } from '@supabase/supabase-js';
import { generateObject } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function getContentModel() {
  const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  // Use Opus for highest quality cornerstone content
  return anthropic('claude-opus-4-20250514');
}

// All positions with their display names and slugs
const POSITIONS = [
  // Yacht Crew
  { name: 'Captain', slug: 'captain', category: 'yacht' },
  { name: 'Chief Stew', slug: 'chief-stew', category: 'yacht' },
  { name: 'Yacht Chef', slug: 'yacht-chef', category: 'yacht' },
  { name: 'Chief Officer', slug: 'chief-officer', category: 'yacht' },
  { name: 'Chief Engineer', slug: 'chief-engineer', category: 'yacht' },
  { name: 'Bosun', slug: 'bosun', category: 'yacht' },
  { name: 'Deckhand', slug: 'deckhand', category: 'yacht' },
  { name: 'Stew', slug: 'stew', category: 'yacht' },
  { name: 'Second Engineer', slug: 'second-engineer', category: 'yacht' },
  { name: 'ETO', slug: 'eto', category: 'yacht' },
  { name: 'Second Stew', slug: 'second-stew', category: 'yacht' },

  // Household Staff
  { name: 'Personal Assistant', slug: 'personal-assistant', category: 'household' },
  { name: 'Butler', slug: 'butler', category: 'household' },
  { name: 'House Manager', slug: 'house-manager', category: 'household' },
  { name: 'Private Chef', slug: 'private-chef', category: 'household' },
  { name: 'Estate Manager', slug: 'estate-manager', category: 'household' },
  { name: 'Nanny', slug: 'nanny', category: 'household' },
  { name: 'Housekeeper', slug: 'housekeeper', category: 'household' },
  { name: 'Governess', slug: 'governess', category: 'household' },
];

interface CornerstoneContent {
  meta_title: string;
  meta_description: string;
  hero_headline: string;
  hero_subheadline: string;
  intro_content: string;
  about_position: string;
  key_responsibilities: string;
  qualifications_skills: string;
  salary_overview: string;
  hiring_process: string;
  why_lighthouse: string;
  service_description: string;
  faq_content: Array<{ question: string; answer: string }>;
  answer_capsule: string;
  answer_capsule_question: string;
  key_facts: string[];
  primary_keywords: string[];
  secondary_keywords: string[];
}

async function generateCornerstoneContent(position: string, category: 'yacht' | 'household'): Promise<CornerstoneContent> {
  const categoryContext = category === 'yacht'
    ? 'superyacht crew for luxury motor yachts and sailing yachts worldwide'
    : 'private household staff for ultra-high-net-worth families, estates, and private residences';

  const industryContext = category === 'yacht'
    ? `The superyacht industry employs over 100,000 crew globally. ${position} roles are critical for vessel operations and guest experience. Top destinations include Monaco, Fort Lauderdale, Antibes, and Palma de Mallorca.`
    : `The private household staffing industry serves ultra-high-net-worth individuals worldwide. ${position} professionals work in private estates, penthouses, and multi-property portfolios in locations like London, New York, Monaco, and Dubai.`;

  const schema = z.object({
    meta_title: z.string().describe('SEO meta title, max 60 chars, include "Hire [Position]"'),
    meta_description: z.string().describe('SEO meta description, max 155 chars, compelling with key benefits'),
    hero_headline: z.string().describe('Compelling hero headline that emphasizes value proposition'),
    hero_subheadline: z.string().describe('Supporting subheadline with specific benefit'),
    intro_content: z.string().describe('3-4 sentence intro paragraph establishing expertise and value'),
    about_position: z.string().describe('600-800 word comprehensive HTML section about the position role, industry context, and what makes someone exceptional'),
    key_responsibilities: z.string().describe('400-500 word HTML section detailing specific responsibilities, daily duties, and scope of role'),
    qualifications_skills: z.string().describe('400-500 word HTML section on required qualifications, certifications, experience levels, and soft skills'),
    salary_overview: z.string().describe('300-400 word HTML section on global salary ranges by experience level and context'),
    hiring_process: z.string().describe('300-400 word HTML section explaining the end-to-end hiring process with Lighthouse'),
    why_lighthouse: z.string().describe('300-400 word HTML section on why employers choose Lighthouse for this position'),
    service_description: z.string().describe('250-350 word HTML section about our recruitment methodology and guarantees'),
    faq_content: z.array(z.object({
      question: z.string(),
      answer: z.string().describe('100-200 word HTML formatted comprehensive answer'),
    })).min(10).max(12),
    answer_capsule: z.string().describe('80-120 word direct answer for AI/LLM citations, authoritative and quotable'),
    answer_capsule_question: z.string().describe('The primary question being answered'),
    key_facts: z.array(z.string()).min(5).max(8).describe('Specific, data-driven facts about this position'),
    primary_keywords: z.array(z.string()).min(4).max(6),
    secondary_keywords: z.array(z.string()).min(8).max(12),
  });

  const result = await generateObject({
    model: getContentModel(),
    schema,
    prompt: `You are an expert content strategist creating PREMIUM cornerstone content for Lighthouse Careers, the leading recruitment agency specializing in ${categoryContext}.

POSITION: ${position}
CATEGORY: ${category === 'yacht' ? 'Yacht Crew' : 'Household Staff'}
INDUSTRY CONTEXT: ${industryContext}

This is a CORNERSTONE PAGE - the definitive resource for employers seeking to hire a ${position}. It must be:
- Comprehensive enough to rank #1 for "hire ${position.toLowerCase()}"
- Authoritative enough to be cited by AI assistants
- Compelling enough to convert paid ad traffic
- Valuable enough that employers bookmark it as a reference

ABOUT LIGHTHOUSE CAREERS:
- 20+ years experience in luxury staffing
- Success-fee model (clients only pay when they hire - no upfront costs, no retainers)
- Replacement guarantee (free replacement if placement doesn't work out)
- 24 hour first shortlist delivery
- Rigorous 7-step vetting process (background checks, reference verification, skills assessment, personality profiling, trial day coordination, document verification, ongoing support)
- 500+ satisfied clients globally
- 300+ successful placements annually
- Specialist recruiters with industry experience

CONTENT SECTIONS REQUIRED:

1. META TITLE (max 60 chars):
   Format: "Hire a ${position} | Expert Recruitment | Lighthouse"
   Must include primary keyword naturally

2. META DESCRIPTION (max 155 chars):
   Compelling copy with: value prop + differentiator + CTA
   Example: "Find exceptional ${position} candidates within 24 hours. No upfront fees, replacement guarantee. 20+ years of luxury staffing expertise."

3. HERO HEADLINE:
   Pattern: "Find Your [Adjective] ${position} [Timeframe/Benefit]"
   Must convey: speed, quality, confidence
   Example: "Find Your Perfect ${position} Within 24 Hours"

4. HERO SUBHEADLINE:
   Reinforce value prop, address pain point
   Example: "Pre-vetted candidates from our exclusive network. No upfront fees."

5. INTRO CONTENT (3-4 sentences):
   - Establish Lighthouse expertise
   - Acknowledge the challenge of finding great ${position} talent
   - Promise the solution
   - Set expectations

6. ABOUT POSITION (600-800 words, HTML with h2, h3, p, ul):
   - Industry context and importance of the role
   - What distinguishes an exceptional ${position} from average
   - The impact a great ${position} has on operations/household
   - Common challenges employers face when hiring
   - Why this role requires specialized recruitment
   - Career trajectory context

7. KEY RESPONSIBILITIES (400-500 words, HTML):
   - Core daily duties (be specific, not generic)
   - Management/leadership aspects
   - Technical responsibilities
   - Interpersonal/service responsibilities
   - Administrative duties
   - Emergency/crisis responsibilities if applicable

8. QUALIFICATIONS & SKILLS (400-500 words, HTML):
   - Required certifications (be specific: STCW for yacht, food hygiene for chef, etc.)
   - Experience levels (entry, mid, senior)
   - Essential hard skills
   - Critical soft skills (discretion, flexibility, etc.)
   - Nice-to-have qualifications
   - Red flags employers should watch for

9. SALARY OVERVIEW (300-400 words, HTML):
   - Global salary ranges by experience level
   - Factors affecting compensation
   - Benefits typically included (accommodation, travel, insurance)
   - How Lighthouse helps with salary benchmarking
   - Note: Ranges are indicative, vary by location and employer

10. HIRING PROCESS (300-400 words, HTML):
    - Step 1: Initial consultation (15-30 mins, understand requirements)
    - Step 2: Search activation (access our network of pre-vetted candidates)
    - Step 3: Shortlist delivery (within 24 hours)
    - Step 4: Interview coordination (we handle logistics)
    - Step 5: Reference and background verification
    - Step 6: Offer and onboarding support
    - Timeline expectations

11. WHY LIGHTHOUSE (300-400 words, HTML):
    - Our specialization in ${category === 'yacht' ? 'yacht crew' : 'private household staff'}
    - Success-fee model explanation
    - Our replacement guarantee
    - Quality of our candidate network
    - Our consultant expertise
    - Client testimonials/success stories references

12. SERVICE DESCRIPTION (250-350 words, HTML):
    - Our recruitment methodology
    - Our 7-step vetting process in detail
    - What's included in our service
    - Our guarantees
    - How to get started

13. FAQ CONTENT (10-12 questions with 100-200 word answers each):
    Must cover:
    - "How much does it cost to hire a ${position} through Lighthouse?"
    - "How long does the hiring process take?"
    - "What qualifications should a ${position} have?"
    - "What is your replacement guarantee?"
    - "How do you vet ${position} candidates?"
    - "What salary should I expect to pay a ${position}?"
    - "Do you help with visa/work permits?"
    - "Can you find ${position} candidates for specific locations?"
    - "What if I need to hire urgently?"
    - "How do I get started?"
    Plus 2-3 position-specific questions

14. ANSWER CAPSULE (80-120 words):
    Question: "How do I hire a ${position}?"
    - Direct, authoritative answer
    - No marketing fluff
    - Factual and quotable
    - Mention key steps and timeline
    - No links or CTAs

15. KEY FACTS (5-8 bullet points):
    Specific, data-driven facts:
    - Salary range
    - Typical hiring timeline
    - Key certifications required
    - Experience levels available
    - Our placement success rate
    - Market demand indicators

16. KEYWORDS:
    Primary (4-6): High-intent transactional
    - "hire ${position.toLowerCase()}"
    - "${position.toLowerCase()} recruitment"
    - "${position.toLowerCase()} agency"
    - "find ${position.toLowerCase()}"

    Secondary (8-12): Long-tail variations
    - "${position.toLowerCase()} job requirements"
    - "how to hire a ${position.toLowerCase()}"
    - "${position.toLowerCase()} salary"
    - "best ${position.toLowerCase()} candidates"
    - etc.

QUALITY STANDARDS:
- Write as an industry expert, not a marketer
- Use specific details, not vague generalizations
- Include realistic numbers and ranges
- Avoid superlatives without substance
- Make every sentence valuable
- Use proper HTML structure (h2, h3, p, ul, li)
- Ensure content could stand alone as an authoritative guide

Generate comprehensive, expert-level content that establishes Lighthouse as THE authority for ${position} recruitment.`,
  });

  return result.object;
}

async function main() {
  console.log('\n🚀 Generating Cornerstone Pages for All Positions\n');
  console.log('=' .repeat(60));

  for (const position of POSITIONS) {
    console.log(`\n📝 Generating: ${position.name}`);

    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from('seo_cornerstone_pages')
        .select('id')
        .eq('position_slug', position.slug)
        .single();

      if (existing) {
        console.log(`   ⏭️  Already exists, skipping`);
        continue;
      }

      const startTime = Date.now();
      const content = await generateCornerstoneContent(position.name, position.category as 'yacht' | 'household');
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      console.log(`   ✅ Generated in ${duration}s`);

      // Combine content sections into comprehensive content_sections JSONB
      const contentSections = [
        { heading: 'Key Responsibilities', content: content.key_responsibilities, type: 'responsibilities', order: 1 },
        { heading: 'Qualifications & Skills', content: content.qualifications_skills, type: 'qualifications', order: 2 },
        { heading: 'Salary Overview', content: content.salary_overview, type: 'salary', order: 3 },
        { heading: 'Our Hiring Process', content: content.hiring_process, type: 'process', order: 4 },
        { heading: 'Why Choose Lighthouse', content: content.why_lighthouse, type: 'why_us', order: 5 },
      ];

      // Insert into database
      const { error } = await supabase.from('seo_cornerstone_pages').insert({
        position: position.name,
        position_slug: position.slug,
        url_path: `hire-a-${position.slug}`,
        meta_title: content.meta_title,
        meta_description: content.meta_description,
        hero_headline: content.hero_headline,
        hero_subheadline: content.hero_subheadline,
        intro_content: content.intro_content,
        about_position: content.about_position,
        service_description: content.service_description,
        content_sections: contentSections,
        faq_content: content.faq_content,
        answer_capsule: content.answer_capsule,
        answer_capsule_question: content.answer_capsule_question,
        key_facts: content.key_facts,
        primary_keywords: content.primary_keywords,
        secondary_keywords: content.secondary_keywords,
        is_active: true,
        ai_generation_status: 'completed',
      });

      if (error) {
        console.error(`   ❌ Insert failed:`, error.message);
      } else {
        console.log(`   💾 Saved to database`);
      }

    } catch (error) {
      console.error(`   ❌ Failed:`, error instanceof Error ? error.message : error);
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🎉 Cornerstone page generation complete!\n');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
