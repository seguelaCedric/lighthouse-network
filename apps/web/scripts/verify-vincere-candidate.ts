/**
 * Script to verify a candidate exists in Vincere with their documents
 *
 * Usage: npx tsx scripts/verify-vincere-candidate.ts <vincere_id>
 */

import 'dotenv/config';
import { getVincereClient } from '../lib/vincere/client';
import { getById as getCandidateById } from '../lib/vincere/candidates';
import { getCandidateFiles, getCandidateCVFile, getCandidatePhotoFile } from '../lib/vincere/files';

async function main() {
  const vincereId = parseInt(process.argv[2] || '260172', 10);

  if (isNaN(vincereId)) {
    console.error('Please provide a valid Vincere ID');
    process.exit(1);
  }

  console.log(`\n🔍 Checking Vincere for candidate ID: ${vincereId}\n`);

  try {
    const client = getVincereClient();

    // Get candidate details
    console.log('1. Fetching candidate details...');
    const candidate = await getCandidateById(vincereId, client);

    if (!candidate) {
      console.log('   ❌ Candidate not found in Vincere');
      process.exit(1);
    }

    console.log('   ✅ Candidate found:');
    console.log(`      Name: ${candidate.first_name} ${candidate.last_name}`);
    console.log(`      Email: ${candidate.email || candidate.primary_email || 'N/A'}`);
    console.log(`      Phone: ${candidate.phone || candidate.mobile || 'N/A'}`);
    console.log(`      Created: ${candidate.created_date}`);

    // Get candidate files
    console.log('\n2. Fetching candidate files...');
    const files = await getCandidateFiles(vincereId, client);

    if (files.length === 0) {
      console.log('   ⚠️  No files found for this candidate');
    } else {
      console.log(`   ✅ Found ${files.length} file(s):`);
      for (const file of files) {
        const type = file.original_cv ? 'CV' : 'Document';
        console.log(`      - [${type}] ${file.file_name || 'Unknown filename'} (ID: ${file.id})`);
      }
    }

    // Check for CV specifically
    console.log('\n3. Checking for CV...');
    const cvFile = await getCandidateCVFile(vincereId, client);
    if (cvFile) {
      console.log(`   ✅ CV found: ${cvFile.file_name}`);
    } else {
      console.log('   ⚠️  No CV found');
    }

    // Check for photo
    console.log('\n4. Checking for profile photo...');
    const photoFile = await getCandidatePhotoFile(vincereId, client);
    if (photoFile) {
      console.log(`   ✅ Photo found: ${photoFile.file_name}`);
    } else {
      console.log('   ⚠️  No profile photo found');
    }

    console.log('\n✅ Vincere verification complete!\n');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
