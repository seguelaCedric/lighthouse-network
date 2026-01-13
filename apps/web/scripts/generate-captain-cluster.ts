/**
 * Generate Captain Content Cluster (8 pieces)
 *
 * Captain is the senior command position on a yacht.
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

const captainContentCluster = [
  {
    contentType: 'interview_questions' as const,
    targetAudience: 'employer' as const,
    position: 'Captain',
    location: '',
    primaryKeyword: 'yacht captain interview questions',
    targetWordCount: 2000,
    customInstructions: `Comprehensive guide to yacht captain interview questions for yacht owners and management companies. Include:
- 25-30 essential questions organized by competency
- Questions about command experience, vessel handling, and navigation expertise
- Safety management and emergency response scenarios
- Crew management and leadership assessment
- Budget management and yacht maintenance oversight
- Guest relations and charter experience
- Certification verification (MCA, USCG licenses, STCW)
- Red flags vs. strong response indicators
- Questions about specific yacht types (motor yacht, sailing yacht, expedition)`,
  },
  {
    contentType: 'hiring_guide' as const,
    targetAudience: 'employer' as const,
    position: 'Captain',
    location: '',
    primaryKeyword: 'how to hire a yacht captain',
    targetWordCount: 1800,
    customInstructions: `Comprehensive guide to hiring a yacht captain. Cover:
- Understanding captain qualifications by yacht size (MCA Master 200GT, 500GT, 3000GT)
- Charter captain vs. private captain considerations
- Where to find qualified captains (crew agencies, networks, registries)
- Essential certifications and sea time requirements
- Salary expectations by yacht size and program type
- Interview and sea trial process
- Reference verification and background checks
- Contract considerations and notice periods
- Common hiring mistakes to avoid`,
  },
  {
    contentType: 'salary_guide' as const,
    targetAudience: 'both' as const,
    position: 'Captain',
    location: '',
    primaryKeyword: 'yacht captain salary 2026',
    targetWordCount: 2000,
    customInstructions: `Comprehensive yacht captain salary guide for 2026. Include:
- Salary ranges by yacht size (30m, 40m, 50m, 60m+, 80m+)
- Charter vs. private yacht compensation differences
- Regional variations (Mediterranean, Caribbean, US, Asia Pacific)
- Bonus structures (charter tips, performance bonuses, build supervision)
- Benefits packages (flights, insurance, leave allowance)
- Rotation captain compensation
- Owner's captain vs. management captain pay
- Impact of certifications on salary`,
  },
  {
    contentType: 'what_to_look_for' as const,
    targetAudience: 'employer' as const,
    position: 'Captain',
    location: '',
    primaryKeyword: 'what to look for when hiring a yacht captain',
    targetWordCount: 1500,
    customInstructions: `Practical guide on what to look for when hiring a yacht captain:
- Essential qualifications and certifications
- Experience indicators (yacht types, tonnage, cruising areas)
- Leadership and crew management capabilities
- Technical competencies (navigation systems, engineering knowledge)
- Red flags during hiring (gaps in sea time, reference issues)
- Green flags indicating exceptional captains
- Assessing personality fit with owner's program
- Sea trial assessment criteria`,
  },
  {
    contentType: 'onboarding_guide' as const,
    targetAudience: 'employer' as const,
    position: 'Captain',
    location: '',
    primaryKeyword: 'how to onboard a yacht captain',
    targetWordCount: 1500,
    customInstructions: `Onboarding guide for yacht owners/managers hiring a captain:
- Handover period with outgoing captain
- Vessel familiarization and systems training
- Crew introductions and team dynamics
- Owner's preferences and program expectations
- Budget and financial reporting systems
- Maintenance schedules and yard period planning
- ISM/ISPS compliance handover
- Building trust and communication protocols
- First 90 days milestones`,
  },
  {
    contentType: 'position_overview' as const,
    targetAudience: 'candidate' as const,
    position: 'Captain',
    location: '',
    primaryKeyword: 'yacht captain job description',
    targetWordCount: 1800,
    customInstructions: `Comprehensive overview of the yacht captain role for candidates:
- Detailed job description and responsibilities
- Day-to-day activities during cruising, at anchor, and in port
- Types of captain positions (private, charter, delivery, relief)
- Work environment and lifestyle considerations
- Command responsibility and legal obligations
- Career satisfaction factors
- Challenges and rewards
- Is this career right for you?`,
  },
  {
    contentType: 'career_path' as const,
    targetAudience: 'candidate' as const,
    position: 'Captain',
    location: '',
    primaryKeyword: 'yacht captain career path',
    targetWordCount: 1800,
    customInstructions: `Career development guide for yacht captains:
- Entry points (deckhand → mate → captain progression)
- Required certifications at each level (STCW, OOW, Master)
- Sea time requirements and documentation
- Yacht size progression (30m → 50m → 80m+)
- Building your reputation and network
- Charter vs. private career paths
- Expedition and explorer yacht opportunities
- Salary progression expectations
- Continuing education (HELM, ENG1, bridge systems)`,
  },
  {
    contentType: 'skills_required' as const,
    targetAudience: 'candidate' as const,
    position: 'Captain',
    location: '',
    primaryKeyword: 'yacht captain skills required',
    targetWordCount: 1800,
    customInstructions: `Comprehensive skills breakdown for yacht captains:
- Navigation and seamanship expertise
- Leadership and crew management
- Safety management systems (ISM, ISPS)
- Technical knowledge (engineering, electrical, AV systems)
- Budget management and financial reporting
- Guest relations and service excellence
- Communication skills (crew, guests, management)
- Crisis management and decision-making
- How to develop each skill
- Demonstrating skills in interviews and sea trials`,
  },
];

async function generateCaptainCluster() {
  console.log('\n🚀 Generating Captain Content Cluster (8 pieces)\n');

  const generatedPosts: any[] = [];

  for (let i = 0; i < captainContentCluster.length; i++) {
    const params = captainContentCluster[i];
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

  console.log('\n🎉 Success! Generated 8 Captain blog posts.');
}

generateCaptainCluster().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
