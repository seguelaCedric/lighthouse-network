/**
 * Generate ETO (Electro-Technical Officer) Content Cluster (8 pieces)
 */

import { createClient } from '@supabase/supabase-js';
import { generateBlogPost } from '../../../packages/ai/blog-generation/index';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const contentCluster = [
  {
    contentType: 'interview_questions' as const, targetAudience: 'employer' as const, position: 'ETO',
    primaryKeyword: 'eto interview questions yacht', targetWordCount: 2000,
    customInstructions: `Comprehensive ETO (Electro-Technical Officer) interview questions. Include questions about electrical systems, AV systems, IT infrastructure, network management, CCTV, automation systems, PLC programming, certifications (ETO CoC), troubleshooting electronics, and integration skills.`,
  },
  {
    contentType: 'hiring_guide' as const, targetAudience: 'employer' as const, position: 'ETO',
    primaryKeyword: 'how to hire eto yacht', targetWordCount: 1800,
    customInstructions: `Guide to hiring a yacht ETO. Cover certification requirements (ETO CoC, STCW), AV/IT expertise levels, salary expectations by yacht size, where to find candidates, and what technical assessments to use.`,
  },
  {
    contentType: 'salary_guide' as const, targetAudience: 'both' as const, position: 'ETO',
    primaryKeyword: 'eto salary yacht 2026', targetWordCount: 2000,
    customInstructions: `ETO salary guide 2026. Include ranges by yacht size and system complexity, AV/IT specialization premiums, charter vs private, regional variations, benefits, rotation positions, and career progression.`,
  },
  {
    contentType: 'what_to_look_for' as const, targetAudience: 'employer' as const, position: 'ETO',
    primaryKeyword: 'what to look for hiring eto yacht', targetWordCount: 1500,
    customInstructions: `What to look for when hiring an ETO. Cover certifications, AV expertise, IT network skills, automation experience, brand familiarity (Crestron, AMX), red flags, and practical assessment criteria.`,
  },
  {
    contentType: 'onboarding_guide' as const, targetAudience: 'employer' as const, position: 'ETO',
    primaryKeyword: 'how to onboard eto yacht', targetWordCount: 1500,
    customInstructions: `Onboarding guide for ETO. Cover systems documentation handover, AV rack familiarization, network topology review, automation programming access, vendor relationships, and first 90 days.`,
  },
  {
    contentType: 'position_overview' as const, targetAudience: 'candidate' as const, position: 'ETO',
    primaryKeyword: 'eto job description yacht', targetWordCount: 1800,
    customInstructions: `ETO job description overview. Cover responsibilities, daily duties, AV vs IT focus, work environment, relationship with engineering department, career satisfaction, and is this role right for you.`,
  },
  {
    contentType: 'career_path' as const, targetAudience: 'candidate' as const, position: 'ETO',
    primaryKeyword: 'eto career path yacht', targetWordCount: 1800,
    customInstructions: `ETO career path guide. Cover entry points (electrician, AV tech, IT), certification requirements (ETO CoC), yacht size progression, specializations (automation, AV, IT), and salary expectations.`,
  },
  {
    contentType: 'skills_required' as const, targetAudience: 'candidate' as const, position: 'ETO',
    primaryKeyword: 'eto skills required yacht', targetWordCount: 1800,
    customInstructions: `ETO skills breakdown. Cover electrical systems, AV programming (Crestron, AMX), networking, CCTV, PLC/automation, satellite communications, troubleshooting methodology, and how to develop each skill.`,
  },
];

async function generate() {
  console.log('\n🚀 Generating ETO Content Cluster (8 pieces)\n');
  const posts: any[] = [];

  for (let i = 0; i < contentCluster.length; i++) {
    const p = contentCluster[i];
    console.log(`📝 ${i + 1}/8: ${p.contentType.replace(/_/g, ' ').toUpperCase()}`);
    const start = Date.now();
    const result = await generateBlogPost({ ...p, location: '', relatedLandingPageUrls: [] });
    console.log(`✅ ${((Date.now() - start) / 1000).toFixed(1)}s - ${result.title}`);
    posts.push({ ...result, ...p });
  }

  console.log('\n💾 Inserting...\n');
  for (const post of posts) {
    await supabase.from('blog_posts').insert({
      title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content,
      meta_title: post.metaTitle, meta_description: post.metaDescription, status: 'draft',
      content_type: post.contentType, target_audience: post.targetAudience, target_position: post.position,
      primary_keyword: post.primaryKeyword, target_keywords: post.targetKeywords,
      answer_capsule: post.answerCapsule, answer_capsule_question: post.answerCapsuleQuestion,
      key_facts: post.keyFacts,
    });
    console.log(`✅ ${post.title}`);
  }
  console.log('\n🎉 Done!');
}

generate().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
