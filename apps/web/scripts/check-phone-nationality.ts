/**
 * Check phone and nationality in Vincere
 */
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

async function main() {
  const { getVincereClient } = await import('../lib/vincere/client');
  const { VINCERE_FIELD_KEYS } = await import('../lib/vincere/constants');

  const vincere = getVincereClient();
  const candidate = await vincere.get<any>('/candidate/258802');

  console.log('=== Vincere Candidate - All Fields ===');
  console.log('Total fields:', Object.keys(candidate).length);
  console.log(JSON.stringify(candidate, null, 2));

  // Check custom fields for second nationality
  console.log('\n=== Vincere Custom Fields ===');
  try {
    const customFields = await vincere.get<any>(`/candidate/${258802}/customfields`);
    console.log('All custom fields:', JSON.stringify(customFields, null, 2));

    // Look for second nationality field
    const secondNatField = customFields?.find((f: any) => f.field_key === VINCERE_FIELD_KEYS.secondNationality);
    console.log('\nSecond Nationality Field Key:', VINCERE_FIELD_KEYS.secondNationality);
    console.log('Second Nationality Value:', secondNatField ? JSON.stringify(secondNatField) : 'Not found');
  } catch (e) {
    console.log('Error fetching custom fields:', e);
  }
}

main().catch(console.error);
