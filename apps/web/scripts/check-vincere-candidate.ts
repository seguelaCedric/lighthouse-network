import { config } from 'dotenv';
import { resolve } from 'path';

// Load env from apps/web/.env.local
config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

async function checkVincere() {
  const { getVincereClient } = await import('../lib/vincere/client');
  const vincere = getVincereClient();

  const candidate = await vincere.get('/candidate/258802');
  console.log('Vincere candidate data:');
  console.log('  Phone:', candidate.phone);
  console.log('  Email:', candidate.email);
  console.log('  Name:', candidate.first_name, candidate.last_name);
  console.log('  DOB:', candidate.date_of_birth);
  console.log('  Gender:', candidate.gender);
  console.log('  Nationality:', candidate.nationality);
}

checkVincere().catch(console.error);
