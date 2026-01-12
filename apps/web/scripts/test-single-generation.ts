/**
 * Test generating a single blog post
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { generateBlogPost } from '@lighthouse/ai';

async function testGeneration() {
  console.log('🧪 Testing AI blog post generation...\n');

  try {
    const result = await generateBlogPost({
      contentType: 'hiring_guide',
      targetAudience: 'employer',
      position: 'Chef',
      location: 'New York',
      primaryKeyword: 'hire private chef New York',
      targetWordCount: 500, // Shorter for testing
      relatedLandingPageUrls: [],
      customInstructions: '',
    });

    console.log('✅ Generation successful!\n');
    console.log('===== TITLE =====');
    console.log('Title:', result.title);
    console.log('Title length:', result.title.length);
    console.log('Title (JSON):', JSON.stringify(result.title));
    console.log('\nSlug:', result.slug);
    console.log('\nExcerpt:', result.excerpt);
    console.log('Excerpt length:', result.excerpt.length);
    console.log('\nMeta Title:', result.metaTitle);
    console.log('Meta Description:', result.metaDescription);
    console.log('\nAnswer Capsule Question:', result.answerCapsuleQuestion);
    console.log('\nAnswer Capsule:', result.answerCapsule);
    console.log('\nKey Facts:', result.keyFacts);
    console.log('\nContent length:', result.content.length, 'characters');
    console.log('\nTarget Keywords:', result.targetKeywords);

  } catch (error) {
    console.error('❌ Generation failed:', error);
    throw error;
  }
}

testGeneration()
  .then(() => {
    console.log('\n✨ Test complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
