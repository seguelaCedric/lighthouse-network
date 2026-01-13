/**
 * Generate Yacht Chef Content Cluster (8 pieces)
 *
 * Yacht Chef is the culinary position on superyachts.
 */

import { createClient } from '@supabase/supabase-js';
import { generateBlogPost } from '../../../packages/ai/blog-generation/index';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const yachtChefContentCluster = [
  {
    contentType: 'interview_questions' as const,
    targetAudience: 'employer' as const,
    position: 'Yacht Chef',
    location: '',
    primaryKeyword: 'yacht chef interview questions',
    targetWordCount: 2000,
    customInstructions: `Comprehensive guide to yacht chef interview questions. Include:
- 25-30 essential questions organized by competency
- Questions about culinary background, cuisine expertise, and menu planning
- Provisioning in remote locations and inventory management
- Dietary accommodations and allergy management
- Working in confined galley spaces
- Charter experience and guest preference adaptation
- Crew meal management alongside owner/guest service
- Food safety certifications (Ship's Cook, HACCP)
- Red flags vs. strong response indicators`,
  },
  {
    contentType: 'hiring_guide' as const,
    targetAudience: 'employer' as const,
    position: 'Yacht Chef',
    location: '',
    primaryKeyword: 'how to hire a yacht chef',
    targetWordCount: 1800,
    customInstructions: `Comprehensive guide to hiring a yacht chef. Cover:
- Understanding yacht chef qualifications by yacht size
- Charter vs. private yacht culinary requirements
- Where to find qualified candidates (crew agencies, culinary schools)
- Essential certifications (STCW, Ship's Cook, food safety)
- Salary expectations by yacht size
- Tasting and trial day process
- Reference verification from previous yachts
- Common hiring mistakes to avoid`,
  },
  {
    contentType: 'salary_guide' as const,
    targetAudience: 'both' as const,
    position: 'Yacht Chef',
    location: '',
    primaryKeyword: 'yacht chef salary 2026',
    targetWordCount: 2000,
    customInstructions: `Comprehensive yacht chef salary guide for 2026. Include:
- Salary ranges by yacht size (30m, 40m, 50m, 60m+, 80m+)
- Charter vs. private yacht compensation
- Regional variations (Med, Caribbean, circumnavigation)
- Tip structures and charter bonuses
- Sous chef vs. head chef compensation
- Benefits packages
- Rotation positions
- Impact of Michelin/fine dining background`,
  },
  {
    contentType: 'what_to_look_for' as const,
    targetAudience: 'employer' as const,
    position: 'Yacht Chef',
    location: '',
    primaryKeyword: 'what to look for when hiring a yacht chef',
    targetWordCount: 1500,
    customInstructions: `Practical guide on what to look for when hiring a yacht chef:
- Essential qualifications and certifications
- Experience indicators (yacht sizes, charter seasons, cuisine range)
- Adaptability and creativity in confined spaces
- Provisioning skills for remote cruising
- Red flags during hiring
- Green flags indicating exceptional candidates
- Tasting day assessment criteria
- Personality fit with crew dynamics`,
  },
  {
    contentType: 'onboarding_guide' as const,
    targetAudience: 'employer' as const,
    position: 'Yacht Chef',
    location: '',
    primaryKeyword: 'how to onboard a yacht chef',
    targetWordCount: 1500,
    customInstructions: `Onboarding guide for yacht chef:
- Handover with outgoing chef
- Galley familiarization (equipment, storage, systems)
- Owner/guest dietary preferences and restrictions
- Provisioning accounts and supplier relationships
- Menu planning and approval process
- Crew meal expectations
- Budget and expense tracking
- First 90 days milestones`,
  },
  {
    contentType: 'position_overview' as const,
    targetAudience: 'candidate' as const,
    position: 'Yacht Chef',
    location: '',
    primaryKeyword: 'yacht chef job description',
    targetWordCount: 1800,
    customInstructions: `Comprehensive overview of the yacht chef role:
- Detailed job description and responsibilities
- Day-to-day activities during cruising, charter, and yard periods
- Types of positions (sole chef, head chef with sous, private, charter)
- Work environment and galley life
- Career satisfaction factors
- Challenges and rewards
- Restaurant chef vs. yacht chef comparison
- Is this career right for you?`,
  },
  {
    contentType: 'career_path' as const,
    targetAudience: 'candidate' as const,
    position: 'Yacht Chef',
    location: '',
    primaryKeyword: 'yacht chef career path',
    targetWordCount: 1800,
    customInstructions: `Career development guide for yacht chefs:
- Entry points (restaurant background, culinary school, day work)
- Sous Chef → Head Chef → Chef on larger yachts progression
- Required certifications (STCW, Ship's Cook, ENG1)
- Yacht size progression
- Building reputation through charter seasons
- Specializations (pastry, dietary, ethnic cuisines)
- Transitioning to shore-based or private chef roles
- Salary progression expectations`,
  },
  {
    contentType: 'skills_required' as const,
    targetAudience: 'candidate' as const,
    position: 'Yacht Chef',
    location: '',
    primaryKeyword: 'yacht chef skills required',
    targetWordCount: 1800,
    customInstructions: `Comprehensive skills breakdown for yacht chefs:
- Culinary technique and creativity
- Menu planning and dietary accommodation
- Provisioning and inventory management
- Working in confined galley spaces
- Food safety and hygiene
- Budget management
- Adaptability and flexibility
- Guest relations through food
- How to develop each skill
- Demonstrating skills in tastings`,
  },
];

async function generateYachtChefCluster() {
  console.log('\n🚀 Generating Yacht Chef Content Cluster (8 pieces)\n');

  const generatedPosts: any[] = [];

  for (let i = 0; i < yachtChefContentCluster.length; i++) {
    const params = yachtChefContentCluster[i];
    console.log(`\n📝 Generating Post ${i + 1}/8: ${params.contentType.replace(/_/g, ' ').toUpperCase()}`);
    console.log(`   Keyword: "${params.primaryKeyword}"`);
    console.log('⏳ Generating...');

    const startTime = Date.now();
    const result = await generateBlogPost({
      contentType: params.contentType,
      targetAudience: params.targetAudience,
      position: params.position,
      location: params.location,
      primaryKeyword: params.primaryKeyword,
      targetWordCount: params.targetWordCount,
      relatedLandingPageUrls: [],
      customInstructions: params.customInstructions,
    });

    console.log(`✅ Generated in ${((Date.now() - startTime) / 1000).toFixed(1)}s - ${result.title}`);
    generatedPosts.push({ ...result, contentType: params.contentType, targetAudience: params.targetAudience, position: params.position, primaryKeyword: params.primaryKeyword });
  }

  console.log('\n💾 Inserting posts into database...\n');

  for (const post of generatedPosts) {
    const { data, error } = await supabase.from('blog_posts').insert({
      title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content,
      meta_title: post.metaTitle, meta_description: post.metaDescription, status: 'draft',
      content_type: post.contentType, target_audience: post.targetAudience, target_position: post.position,
      primary_keyword: post.primaryKeyword, target_keywords: post.targetKeywords,
      answer_capsule: post.answerCapsule, answer_capsule_question: post.answerCapsuleQuestion,
      key_facts: post.keyFacts, related_landing_page_urls: null,
    }).select().single();

    if (error) throw error;
    console.log(`✅ Inserted: ${post.title}`);
  }

  console.log('\n🎉 Success! Generated 8 Yacht Chef blog posts.');
}

generateYachtChefCluster().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
