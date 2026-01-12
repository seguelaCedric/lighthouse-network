/**
 * Generate content for the first 5 blog posts
 * This will take 5-10 minutes as each post generates ~2000-2800 words
 */

const posts = [
  {
    id: '0cbe3c65-5915-48a4-9146-5c648fbd644f',
    title: 'Complete Guide to Hiring a Private Chef in New York',
    contentType: 'hiring_guide',
    targetAudience: 'employer',
    position: 'Chef',
    location: 'New York',
    primaryKeyword: 'hire private chef New York',
    targetWordCount: 2500,
  },
  {
    id: 'fb72c34c-49df-4825-b95c-42b149d55ca8',
    title: "How to Hire a Nanny in New York: A Parent's Complete Guide",
    contentType: 'hiring_guide',
    targetAudience: 'employer',
    position: 'Nanny',
    location: 'New York',
    primaryKeyword: 'hire nanny New York',
    targetWordCount: 2200,
  },
  {
    id: '0712560b-5760-44d0-b2e1-45e5e6b93ae1',
    title: 'Hiring a Personal Assistant in New York: Executive Guide',
    contentType: 'hiring_guide',
    targetAudience: 'employer',
    position: 'Personal Assistant',
    location: 'New York',
    primaryKeyword: 'hire personal assistant New York',
    targetWordCount: 2000,
  },
  {
    id: '86c4f42e-e15a-4b72-98b5-491b6da0be68',
    title: 'Finding a Butler for Your Estate: Complete US Hiring Guide',
    contentType: 'hiring_guide',
    targetAudience: 'employer',
    position: 'Butler',
    location: 'United States',
    primaryKeyword: 'hire butler United States',
    targetWordCount: 2800,
  },
  {
    id: 'ac60c9fe-0534-49f0-b33b-4560e5af386c',
    title: 'How to Hire a Housekeeper in Manhattan: What to Expect',
    contentType: 'hiring_guide',
    targetAudience: 'employer',
    position: 'Housekeeper',
    location: 'Manhattan',
    primaryKeyword: 'hire housekeeper Manhattan',
    targetWordCount: 1800,
  },
];

async function generatePost(post: typeof posts[0]) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004';

  console.log(`\n🚀 Generating: ${post.title}`);
  console.log(`   Target: ${post.targetWordCount} words | Position: ${post.position} | Location: ${post.location}`);

  const startTime = Date.now();

  try {
    const response = await fetch(`${baseUrl}/api/blog-posts/${post.id}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contentType: post.contentType,
        targetAudience: post.targetAudience,
        position: post.position,
        location: post.location,
        primaryKeyword: post.primaryKeyword,
        targetWordCount: post.targetWordCount,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${error}`);
    }

    const generated = await response.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`✅ Generated in ${elapsed}s`);
    console.log(`   Title: ${generated.title}`);
    console.log(`   Slug: ${generated.slug}`);
    console.log(`   Word count: ~${generated.content.length / 5} words`);
    console.log(`   Answer capsule: ${generated.answer_capsule ? 'YES' : 'NO'}`);
    console.log(`   Key facts: ${generated.key_facts?.length || 0}`);
    console.log(`   Status: ${generated.status}`);

    return { success: true, post, generated, elapsed };
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`❌ Failed after ${elapsed}s: ${error}`);
    return { success: false, post, error: String(error), elapsed };
  }
}

async function generateAllPosts() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  GENERATING FIRST 5 BLOG POSTS');
  console.log('  This will take approximately 5-10 minutes');
  console.log('  Each post generates 1800-2800 words with AI optimization');
  console.log('═══════════════════════════════════════════════════════════\n');

  const results = [];
  const totalStart = Date.now();

  for (const [index, post] of posts.entries()) {
    console.log(`\n[${index + 1}/5] Starting generation...`);
    const result = await generatePost(post);
    results.push(result);

    if (index < posts.length - 1) {
      console.log('\n⏳ Waiting 2 seconds before next generation...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const totalElapsed = ((Date.now() - totalStart) / 1000 / 60).toFixed(1);

  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('  GENERATION COMPLETE');
  console.log(`  Total time: ${totalElapsed} minutes`);
  console.log('═══════════════════════════════════════════════════════════\n');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}\n`);

  if (successful > 0) {
    console.log('📝 Next steps:');
    console.log('1. Visit http://localhost:3004/dashboard/seo-pages/blog');
    console.log('2. Review the generated posts');
    console.log('3. Check answer capsules, keywords, and content quality');
    console.log('4. If quality is good, proceed with generating remaining 13 posts\n');
  }

  if (failed > 0) {
    console.log('\n⚠️  Some posts failed to generate. Review errors above.');
  }

  return results;
}

generateAllPosts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
