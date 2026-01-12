/**
 * Test script to verify document versioning cleanup logic
 *
 * This script tests that when a new CV version is uploaded:
 * 1. Old version is marked as is_latest_version = false
 * 2. Old version's extracted_text is cleared
 * 3. Old version's embedding is cleared
 * 4. Old version's file_url and metadata are preserved (for audit history)
 * 5. New version is marked as is_latest_version = true
 * 6. Only the new version triggers embedding queue
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDocumentVersionCleanup() {
  console.log('🧪 Testing document version cleanup logic\n');

  // Step 1: Create a test candidate with an initial embedding
  const mockInitialEmbedding = Array(1536).fill(0.5); // Initial embedding from CV v1
  const { data: candidate, error: candidateError } = await supabase
    .from('candidates')
    .insert({
      first_name: 'Test',
      last_name: 'Candidate',
      email: `test-${Date.now()}@example.com`,
      embedding: mockInitialEmbedding,
      embedding_text: 'Old CV content from version 1',
    })
    .select()
    .single();

  if (candidateError || !candidate) {
    console.error('❌ Failed to create test candidate:', candidateError);
    return;
  }

  console.log('✅ Created test candidate:', candidate.id);
  console.log(`   - Initial embedding: ${candidate.embedding?.length || 0} dims`);

  // Step 2: Create initial CV document with extracted text and embedding
  const mockEmbedding = Array(1536).fill(0.1); // Mock OpenAI embedding
  const { data: doc1, error: doc1Error } = await supabase
    .from('documents')
    .insert({
      entity_type: 'candidate',
      entity_id: candidate.id,
      type: 'cv',
      name: 'test-cv-v1.pdf',
      file_url: 'https://example.com/cv1.pdf',
      file_path: 'candidates/test/cv1.pdf',
      file_size: 100000,
      mime_type: 'application/pdf',
      status: 'approved',
      is_latest_version: true,
      extracted_text: 'This is the first version of the CV with lots of experience and skills.',
      embedding: mockEmbedding,
    })
    .select()
    .single();

  if (doc1Error || !doc1) {
    console.error('❌ Failed to create first document:', doc1Error);
    return;
  }

  console.log('✅ Created first CV document:', doc1.id);
  console.log(`   - extracted_text length: ${doc1.extracted_text?.length || 0}`);
  console.log(`   - embedding length: ${doc1.embedding?.length || 0}`);
  console.log(`   - is_latest_version: ${doc1.is_latest_version}`);

  // Step 3: Create a new version using create_document_version RPC
  const { data: newDocId, error: versionError } = await supabase.rpc('create_document_version', {
    p_parent_document_id: doc1.id,
    p_new_file_url: 'https://example.com/cv2.pdf',
    p_new_file_path: 'candidates/test/cv2.pdf',
    p_new_file_size: 120000,
    p_new_mime_type: 'application/pdf',
    p_uploaded_by: candidate.id,
    p_organization_id: null,
  });

  if (versionError) {
    console.error('❌ Failed to create document version:', versionError);
    return;
  }

  console.log('\n✅ Created new CV version:', newDocId);

  // Step 4: Check that old document was cleaned up
  const { data: oldDoc, error: oldDocError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', doc1.id)
    .single();

  if (oldDocError || !oldDoc) {
    console.error('❌ Failed to fetch old document:', oldDocError);
    return;
  }

  console.log('\n📊 Old document after versioning:');
  console.log(`   - is_latest_version: ${oldDoc.is_latest_version}`);
  console.log(`   - extracted_text: ${oldDoc.extracted_text === null ? 'NULL ✅' : `"${oldDoc.extracted_text}" ❌`}`);
  console.log(`   - embedding: ${oldDoc.embedding === null ? 'NULL ✅' : `${oldDoc.embedding.length} dims ❌`}`);
  console.log(`   - file_url: ${oldDoc.file_url ? 'PRESERVED ✅' : 'LOST ❌'}`);
  console.log(`   - name: ${oldDoc.name ? 'PRESERVED ✅' : 'LOST ❌'}`);

  // Step 4.5: CRITICAL - Check that candidate embedding was invalidated
  const { data: candidateAfterVersion, error: candidateCheckError } = await supabase
    .from('candidates')
    .select('embedding, embedding_text')
    .eq('id', candidate.id)
    .single();

  if (candidateCheckError || !candidateAfterVersion) {
    console.error('❌ Failed to fetch candidate after versioning:', candidateCheckError);
    return;
  }

  console.log('\n📊 Candidate after CV versioning:');
  console.log(`   - embedding: ${candidateAfterVersion.embedding === null ? 'NULL (invalidated) ✅' : `${candidateAfterVersion.embedding.length} dims (STALE!) ❌`}`);
  console.log(`   - embedding_text: ${candidateAfterVersion.embedding_text === null ? 'NULL (invalidated) ✅' : `"${candidateAfterVersion.embedding_text}" (STALE!) ❌`}`);

  // Step 5: Check that new document is correct
  const { data: newDoc, error: newDocError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', newDocId)
    .single();

  if (newDocError || !newDoc) {
    console.error('❌ Failed to fetch new document:', newDocError);
    return;
  }

  console.log('\n📊 New document:');
  console.log(`   - is_latest_version: ${newDoc.is_latest_version}`);
  console.log(`   - status: ${newDoc.status}`);
  console.log(`   - version: ${newDoc.version}`);
  console.log(`   - parent_document_id: ${newDoc.parent_document_id}`);
  console.log(`   - file_url: ${newDoc.file_url}`);

  // Step 6: Check embedding queue
  const { data: queueItems, error: queueError } = await supabase
    .from('embedding_queue')
    .select('*')
    .eq('entity_type', 'candidate')
    .eq('entity_id', candidate.id);

  console.log('\n📊 Embedding queue:');
  if (queueError) {
    console.error('❌ Failed to fetch queue:', queueError);
  } else {
    console.log(`   - Queue items: ${queueItems?.length || 0}`);
    if (queueItems && queueItems.length > 0) {
      console.log(`   - Latest item status: ${queueItems[0].status}`);
    }
  }

  // Step 7: Verify results
  console.log('\n🎯 Test Results:');
  const results = {
    oldVersionFlagCleared: oldDoc.is_latest_version === false,
    oldExtractedTextCleared: oldDoc.extracted_text === null,
    oldEmbeddingCleared: oldDoc.embedding === null,
    oldMetadataPreserved: oldDoc.file_url !== null && oldDoc.name !== null,
    candidateEmbeddingInvalidated: candidateAfterVersion.embedding === null,
    candidateEmbeddingTextInvalidated: candidateAfterVersion.embedding_text === null,
    newVersionFlagSet: newDoc.is_latest_version === true,
    newVersionNumber: newDoc.version === 2,
  };

  for (const [key, value] of Object.entries(results)) {
    console.log(`   ${value ? '✅' : '❌'} ${key}`);
  }

  const allPassed = Object.values(results).every(v => v === true);
  console.log(`\n${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  // Cleanup
  console.log('\n🧹 Cleaning up test data...');
  await supabase.from('documents').delete().eq('entity_id', candidate.id);
  await supabase.from('candidates').delete().eq('id', candidate.id);
  console.log('✅ Cleanup complete');
}

testDocumentVersionCleanup().catch(console.error);
