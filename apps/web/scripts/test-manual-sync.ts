/**
 * Test manual sync of phone and nationality to Vincere
 */
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

async function main() {
  const { getVincereClient } = await import('../lib/vincere/client');
  const { updateCandidate } = await import('../lib/vincere/candidates');

  const vincere = getVincereClient();
  const vincereId = 258802;

  console.log('Updating Vincere candidate with phone and nationality...');

  await updateCandidate(
    vincereId,
    {
      phone: '+33612345999',
      nationality: 'GB',
      gender: 'MALE',
    },
    vincere
  );

  console.log('Update complete! Verifying...');

  const candidate = await vincere.get<any>('/candidate/' + vincereId);
  console.log('phone:', candidate.phone);
  console.log('nationality:', candidate.nationality);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
