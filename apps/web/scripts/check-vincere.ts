import { getVincereClient } from './lib/vincere/client';

async function checkCandidate() {
  const vincere = getVincereClient();
  const customFields = await vincere.get<any[]>('/candidate/258802/customfields');
  
  // Find the license fields
  const highestLicence = customFields?.find((f: any) => f.key === '83f3f9dc58b5fc1d0b7d591fd82f001b');
  const secondLicence = customFields?.find((f: any) => f.key === '80429528339faa3362600dedfcb72d9d');
  
  console.log('Vincere Custom Fields Check:');
  console.log('============================');
  console.log('Highest Licence:', JSON.stringify(highestLicence, null, 2));
  console.log('Second Licence:', JSON.stringify(secondLicence, null, 2));
}

checkCandidate().catch(console.error);
