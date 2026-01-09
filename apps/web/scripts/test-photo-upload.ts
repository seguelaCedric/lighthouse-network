/**
 * Test Photo Upload to Vincere
 *
 * Run with: npx tsx apps/web/scripts/test-photo-upload.ts
 */
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

async function main() {
  const { getVincereClient } = await import('../lib/vincere/client');
  const { uploadCandidatePhoto } = await import('../lib/vincere/files');
  const { getById } = await import('../lib/vincere/candidates');

  const vincereId = 258802;
  const photoUrl = 'https://ozcuponldhepkdjmemvm.supabase.co/storage/v1/object/public/avatars/profile-photos/b4eb5027-e31d-4158-92bc-a063e7d6ab95-1767902921853.png';

  const client = getVincereClient();

  console.log('Authenticating...');
  await client.authenticate();
  console.log('Authenticated!\n');

  console.log('Fetching current data...');
  const before = await getById(vincereId, client);
  console.log('Before upload:');
  console.log('  candidate:', before?.name);
  console.log();

  console.log('Uploading photo...');
  console.log('  URL:', photoUrl);

  try {
    const result = await uploadCandidatePhoto(vincereId, photoUrl, 'profile-photo.png', client);
    console.log('Upload result:', JSON.stringify(result, null, 2));
  } catch (err: any) {
    console.error('Upload failed:', err.message);
    // Log the full error for debugging
    if (err.response) {
      console.error('Response:', err.response);
    }
  }

  // Wait and check
  await new Promise(r => setTimeout(r, 2000));

  console.log('\nFetching updated data...');
  const after = await getById(vincereId, client);
  console.log('After upload:');
  console.log('  candidate:', after?.name);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
