/**
 * Test Vincere Photo Upload
 *
 * Tests uploading a photo to a candidate in Vincere.
 *
 * Run with: npx tsx apps/web/scripts/test-vincere-photo-upload.ts <candidate-email>
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load env from apps/web/.env.local
config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

const args = process.argv.slice(2);
const email = args[0];

if (!email) {
  console.error('Usage: npx tsx apps/web/scripts/test-vincere-photo-upload.ts <candidate-email>');
  process.exit(1);
}

async function main() {
  console.log(`Testing photo upload for candidate: ${email}\n`);

  const { getVincereClient } = await import('../lib/vincere/client');
  const { searchByEmail } = await import('../lib/vincere/candidates');
  const { uploadCandidatePhoto, getCandidatePhotoFile, getCandidateFiles } = await import('../lib/vincere/files');

  const client = getVincereClient();

  // Find candidate
  console.log('1. Searching for candidate...');
  const candidate = await searchByEmail(email, client);
  if (!candidate) {
    console.error('Candidate not found');
    process.exit(1);
  }
  console.log(`   Found: ${candidate.name} (ID: ${candidate.id})\n`);

  // Get current files
  console.log('2. Getting current files...');
  const files = await getCandidateFiles(candidate.id, client);
  console.log(`   Found ${files.length} files:`);
  for (const file of files) {
    console.log(`   - ${file.file_name} (ID: ${file.id}, original_cv: ${file.original_cv})`);
  }

  // Check for existing photo
  console.log('\n3. Checking for existing photo...');
  const existingPhoto = await getCandidatePhotoFile(candidate.id, client);
  if (existingPhoto) {
    console.log(`   Found existing photo: ${existingPhoto.file_name}`);
  } else {
    console.log('   No existing photo found');
  }

  // Create a simple test image (1x1 red pixel PNG)
  console.log('\n4. Creating test image...');
  const testPng = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, 0x02, // bit depth: 8, color type: 2 (RGB)
    0x00, 0x00, 0x00, // compression, filter, interlace
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00, 0x00, // compressed data
    0x01, 0x01, 0x01, 0x00, // CRC placeholder
    0x00, 0x00, 0x00, 0x00, // IEND length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);

  // Upload test photo using URL-based endpoint
  console.log('\n5. Uploading test photo via URL...');
  const supabasePhotoUrl = 'https://ozcuponldhepkdjmemvm.supabase.co/storage/v1/object/public/avatars/profile-photos/b4eb5027-e31d-4158-92bc-a063e7d6ab95-1767901744492.jpg';
  try {
    const result = await uploadCandidatePhoto(
      candidate.id,
      supabasePhotoUrl,
      'profile-photo.jpg',
      client
    );
    console.log('   Upload result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('   Upload failed:', error);

    // Try alternative endpoints
    console.log('\n6. Trying alternative endpoints...');

    // Try PUT /candidate/{id}/photo with JSON body containing base64
    try {
      console.log('   Trying PUT /photo with base64...');
      const base64Photo = testPng.toString('base64');
      const response = await client.put(
        `/candidate/${candidate.id}/photo`,
        { photo: base64Photo, file_name: 'test-photo.png' }
      );
      console.log('   PUT /photo result:', JSON.stringify(response, null, 2));
    } catch (e2) {
      console.error('   PUT /photo failed:', e2 instanceof Error ? e2.message : e2);
    }

    // Try /candidate/{id}/photo/upload
    try {
      console.log('   Trying POST /photo/upload...');
      const response = await client.postMultipart(
        `/candidate/${candidate.id}/photo/upload`,
        testPng,
        'test-photo.png',
        'image/png'
      );
      console.log('   /photo/upload result:', JSON.stringify(response, null, 2));
    } catch (e3) {
      console.error('   /photo/upload failed:', e3 instanceof Error ? e3.message : e3);
    }

    // Try /candidate/{id}/file/upload
    try {
      console.log('   Trying POST /file/upload...');
      const response = await client.postMultipart(
        `/candidate/${candidate.id}/file/upload`,
        testPng,
        'test-photo.png',
        'image/png'
      );
      console.log('   /file/upload result:', JSON.stringify(response, null, 2));
    } catch (e4) {
      console.error('   /file/upload failed:', e4 instanceof Error ? e4.message : e4);
    }

    // Try /candidate/{id}/cv/upload (general file upload)
    try {
      console.log('   Trying POST /cv/upload (for general files)...');
      const response = await client.postMultipart(
        `/candidate/${candidate.id}/cv/upload`,
        testPng,
        'test-photo.png',
        'image/png'
      );
      console.log('   /cv/upload result:', JSON.stringify(response, null, 2));
    } catch (e5) {
      console.error('   /cv/upload failed:', e5 instanceof Error ? e5.message : e5);
    }

    // Try POST /candidate/{id}/photo with JSON containing URL and file_name
    try {
      console.log('   Trying POST /photo with Supabase URL and file_name...');
      const supabasePhotoUrl = 'https://ozcuponldhepkdjmemvm.supabase.co/storage/v1/object/public/avatars/profile-photos/b4eb5027-e31d-4158-92bc-a063e7d6ab95-1767901744492.jpg';
      const response = await client.post(
        `/candidate/${candidate.id}/photo`,
        { url: supabasePhotoUrl, file_name: 'profile-photo.jpg' }
      );
      console.log('   POST /photo with URL result:', JSON.stringify(response, null, 2));
    } catch (e6) {
      console.error('   POST /photo with URL failed:', e6 instanceof Error ? e6.message : e6);
    }

    // Try PATCH /candidate/{id} with photo_url field
    try {
      console.log('   Trying PATCH /candidate with photo_url...');
      const response = await client.patch(
        `/candidate/${candidate.id}`,
        { photo_url: 'https://via.placeholder.com/150' }
      );
      console.log('   PATCH /candidate result:', JSON.stringify(response, null, 2));
    } catch (e7) {
      console.error('   PATCH /candidate failed:', e7 instanceof Error ? e7.message : e7);
    }
  }

  // Verify
  console.log('\n7. Verifying upload...');
  const filesAfter = await getCandidateFiles(candidate.id, client);
  console.log(`   Now ${filesAfter.length} files:`);
  for (const file of filesAfter) {
    console.log(`   - ${file.file_name} (ID: ${file.id})`);
  }
}

main().catch(console.error);
