/**
 * Create Internal Content Links for Any Position Content Cluster
 *
 * Usage: npx tsx scripts/create-content-links-for-position.ts "Position Name"
 * Example: npx tsx scripts/create-content-links-for-position.ts "Estate Manager"
 */

import { createClient } from '@supabase/supabase-js';
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

const positionName = process.argv[2];
if (!positionName) {
  console.error('❌ Please provide a position name as argument');
  console.log('Usage: npx tsx scripts/create-content-links-for-position.ts "Position Name"');
  process.exit(1);
}

async function getPostsForPosition(position: string) {
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, content_type, target_audience')
    .eq('target_position', position)
    .in('content_type', [
      'interview_questions', 'hiring_guide', 'salary_guide', 'what_to_look_for',
      'onboarding_guide', 'position_overview', 'career_path', 'skills_required',
    ]);

  if (error) throw error;

  const postMap: Record<string, any> = {};
  posts?.forEach(post => { postMap[post.content_type] = post; });
  return postMap;
}

function generateLinkDescriptions(position: string) {
  const posLower = position.toLowerCase();
  return {
    // Interview Questions links
    iq_to_hg: `Learn the complete ${posLower} hiring process from job posting to onboarding`,
    iq_to_wtlf: `Discover key qualities and red flags to watch for in ${posLower} candidates`,
    iq_to_sg: `Understand 2026 ${posLower} salary ranges to make competitive offers`,
    // Hiring Guide links
    hg_to_iq: `Review essential interview questions to evaluate ${posLower} candidates`,
    hg_to_wtlf: `Identify must-have skills and traits for your ideal ${posLower}`,
    hg_to_og: `Set your new ${posLower} up for success with effective onboarding`,
    hg_to_sg: `Benchmark ${posLower} salaries to attract top talent`,
    // What to Look For links
    wtlf_to_hg: `Follow the complete ${posLower} hiring process step-by-step`,
    wtlf_to_iq: `Ask the right questions to assess these key ${posLower} traits`,
    wtlf_to_sr: `See the full breakdown of essential ${posLower} skills`,
    // Onboarding Guide links
    og_to_hg: `Review the complete hiring process before onboarding`,
    og_to_wtlf: `Understand what makes a great ${posLower} to guide your onboarding`,
    // Position Overview links
    po_to_sr: `Master the essential skills needed for ${posLower} success`,
    po_to_cp: `Explore ${posLower} career progression opportunities`,
    po_to_sg: `Research ${posLower} salary ranges for your experience level`,
    // Skills Required links
    sr_to_po: `Learn how these skills fit into the day-to-day ${posLower} role`,
    sr_to_cp: `See how skill development drives ${posLower} career progression`,
    sr_to_iq: `Prepare to demonstrate these skills in ${posLower} interviews`,
    // Career Path links
    cp_to_sr: `Identify skills you need to develop at each career stage`,
    cp_to_po: `Understand the full scope of ${posLower} responsibilities`,
    cp_to_sg: `Track salary expectations as you advance your ${posLower} career`,
    // Salary Guide links
    sg_to_hg: `Learn how to hire a ${posLower} at market-competitive rates`,
    sg_to_cp: `Understand how salary grows with ${posLower} career progression`,
    sg_to_sr: `See which skills command higher ${posLower} salaries`,
  };
}

async function createContentLinks(position: string) {
  console.log(`\n🔗 Creating Internal Content Links for ${position} Content Cluster\n`);

  const posts = await getPostsForPosition(position);
  const desc = generateLinkDescriptions(position);

  const linkDefinitions = [
    // Interview Questions → Related
    { from: 'interview_questions', to: 'hiring_guide', desc: desc.iq_to_hg, priority: 100 },
    { from: 'interview_questions', to: 'what_to_look_for', desc: desc.iq_to_wtlf, priority: 90 },
    { from: 'interview_questions', to: 'salary_guide', desc: desc.iq_to_sg, priority: 80 },
    // Hiring Guide → Related
    { from: 'hiring_guide', to: 'interview_questions', desc: desc.hg_to_iq, priority: 100 },
    { from: 'hiring_guide', to: 'what_to_look_for', desc: desc.hg_to_wtlf, priority: 90 },
    { from: 'hiring_guide', to: 'onboarding_guide', desc: desc.hg_to_og, priority: 85 },
    { from: 'hiring_guide', to: 'salary_guide', desc: desc.hg_to_sg, priority: 80 },
    // What to Look For → Related
    { from: 'what_to_look_for', to: 'hiring_guide', desc: desc.wtlf_to_hg, priority: 100 },
    { from: 'what_to_look_for', to: 'interview_questions', desc: desc.wtlf_to_iq, priority: 90 },
    { from: 'what_to_look_for', to: 'skills_required', desc: desc.wtlf_to_sr, priority: 80 },
    // Onboarding Guide → Related
    { from: 'onboarding_guide', to: 'hiring_guide', desc: desc.og_to_hg, priority: 90 },
    { from: 'onboarding_guide', to: 'what_to_look_for', desc: desc.og_to_wtlf, priority: 85 },
    // Position Overview → Related
    { from: 'position_overview', to: 'skills_required', desc: desc.po_to_sr, priority: 100 },
    { from: 'position_overview', to: 'career_path', desc: desc.po_to_cp, priority: 90 },
    { from: 'position_overview', to: 'salary_guide', desc: desc.po_to_sg, priority: 80 },
    // Skills Required → Related
    { from: 'skills_required', to: 'position_overview', desc: desc.sr_to_po, priority: 100 },
    { from: 'skills_required', to: 'career_path', desc: desc.sr_to_cp, priority: 90 },
    { from: 'skills_required', to: 'interview_questions', desc: desc.sr_to_iq, priority: 80 },
    // Career Path → Related
    { from: 'career_path', to: 'skills_required', desc: desc.cp_to_sr, priority: 100 },
    { from: 'career_path', to: 'position_overview', desc: desc.cp_to_po, priority: 90 },
    { from: 'career_path', to: 'salary_guide', desc: desc.cp_to_sg, priority: 80 },
    // Salary Guide → Related
    { from: 'salary_guide', to: 'hiring_guide', desc: desc.sg_to_hg, priority: 90 },
    { from: 'salary_guide', to: 'career_path', desc: desc.sg_to_cp, priority: 85 },
    { from: 'salary_guide', to: 'skills_required', desc: desc.sg_to_sr, priority: 80 },
  ];

  let created = 0;
  let skipped = 0;

  for (const link of linkDefinitions) {
    const fromPost = posts[link.from];
    const toPost = posts[link.to];

    if (!fromPost || !toPost) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from('seo_content_links').insert({
      blog_post_id: fromPost.id,
      target_blog_post_id: toPost.id,
      title: toPost.title,
      url: `/blog/${toPost.slug}`,
      description: link.desc,
      content_type: toPost.content_type,
      priority: link.priority,
      is_active: true,
    });

    if (error) {
      console.error(`❌ Error: ${link.from} → ${link.to}:`, error.message);
    } else {
      console.log(`✅ ${link.from} → ${link.to}`);
      created++;
    }
  }

  console.log(`\n🎉 Created ${created} links (${skipped} skipped - missing posts)`);
}

createContentLinks(positionName).then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
