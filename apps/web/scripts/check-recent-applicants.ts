import { config } from 'dotenv';
import { resolve } from 'path';

// Load env from apps/web/.env.local
config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

interface VincereSearchResult {
  result: {
    items: Array<{
      id: number;
      name?: string;
      first_name?: string;
      last_name?: string;
      primary_email?: string;
      registration_date?: string;
      created_date?: string;
    }>;
    total: number;
  };
}

async function checkRecentApplicants() {
  const { getVincereClient } = await import('../lib/vincere/client');
  const { getFullCandidateData } = await import('../lib/vincere/candidates');
  const vincere = getVincereClient();

  // Candidates to check (from the job board applications)
  const candidates = [
    { name: 'Federico Scarlatti', position: 'Second Officer' },
    { name: 'EREN UYSAL', position: 'Chief Officer' },
    { name: 'STEVE loyer', position: 'Chief Engineer' },
    { name: 'Maximilian Schröder', position: 'Crew Chef / Sous Chef' },
  ];

  console.log('='.repeat(80));
  console.log('Checking recent job board applicants in Vincere');
  console.log('='.repeat(80));

  for (const { name, position } of candidates) {
    console.log(`\n--- Checking: ${name} (applied for ${position}) ---`);

    // Search by name using Vincere search syntax (suffix with # to terminate)
    const nameParts = name.split(' ');
    const lastName = nameParts[nameParts.length - 1];
    const firstName = nameParts[0];

    // Use suffix wildcard with # terminator (Vincere specific syntax)
    const query = `name:${lastName}*#`;
    const encodedQuery = encodeURIComponent(query);

    try {
      const result = await vincere.get<VincereSearchResult>(
        `/candidate/search/fl=id,name,first_name,last_name,primary_email?q=${encodedQuery}&limit=10`
      );

      const items = result?.result?.items ?? [];
      console.log(`Found ${items.length} candidates with last name "${lastName}"`);

      // Filter to find exact or close match
      const matches = items.filter(item => {
        const itemFirstName = (item.first_name || '').toLowerCase();
        const itemLastName = (item.last_name || '').toLowerCase();
        return itemLastName === lastName.toLowerCase() &&
               itemFirstName.startsWith(firstName.toLowerCase().substring(0, 3));
      });

      if (matches.length > 0) {
        for (const match of matches) {
          console.log(`\n✅ FOUND in Vincere:`);
          console.log(`   ID: ${match.id}`);
          console.log(`   Name: ${match.first_name} ${match.last_name}`);
          console.log(`   Email: ${match.primary_email || 'N/A'}`);
          console.log(`   Registration Date: ${match.registration_date || 'N/A'}`);
          console.log(`   Created Date: ${match.created_date || 'N/A'}`);

          // Get full candidate data including custom fields
          try {
            const fullData = await getFullCandidateData(match.id, vincere);
            if (fullData) {
              console.log(`   Phone: ${fullData.candidate.phone || 'N/A'}`);
              console.log(`   Mobile: ${fullData.candidate.mobile || 'N/A'}`);
              console.log(`   Job Title: ${fullData.candidate.job_title || 'N/A'}`);
              console.log(`   Functional Expertises: ${fullData.functionalExpertises.map(fe => fe.name).join(', ') || 'None'}`);
              console.log(`   Current Location: ${fullData.currentLocation?.name || fullData.currentLocation?.city || 'N/A'}`);
            }
          } catch (err) {
            console.log(`   Error fetching full data: ${err}`);
          }
        }
      } else if (items.length > 0) {
        console.log(`⚠️ Found similar candidates but no exact match:`);
        for (const item of items.slice(0, 3)) {
          console.log(`   - ${item.first_name} ${item.last_name} (ID: ${item.id})`);
        }
      } else {
        console.log(`❌ NOT FOUND in Vincere`);
      }
    } catch (error) {
      console.error(`Error searching for ${name}:`, error);
    }
  }

  // Also check recent registrations (last 2 days) using last_update
  console.log('\n' + '='.repeat(80));
  console.log('Checking most recent candidate updates (last 2 days)');
  console.log('='.repeat(80));

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const sinceISO = twoDaysAgo.toISOString();

  try {
    // Use last_update with # terminator (Vincere specific syntax)
    const recentQuery = `last_update:[${sinceISO} TO NOW]#`;
    const encodedRecentQuery = encodeURIComponent(recentQuery);

    const recentResult = await vincere.get<VincereSearchResult>(
      `/candidate/search/fl=id,name,first_name,last_name,primary_email?q=${encodedRecentQuery}&limit=20&sort=last_update:desc`
    );

    const recentItems = recentResult?.result?.items ?? [];
    console.log(`\nFound ${recentItems.length} candidates updated in last 2 days:\n`);

    for (const item of recentItems) {
      console.log(`- ${item.first_name} ${item.last_name}`);
      console.log(`  ID: ${item.id}`);
      console.log(`  Email: ${item.primary_email || 'N/A'}`);
      console.log('');
    }
  } catch (error) {
    console.error('Error fetching recent updates:', error);
  }
}

checkRecentApplicants().catch(console.error);
