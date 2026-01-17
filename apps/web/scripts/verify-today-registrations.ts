/**
 * Verify today's candidate registrations in Vincere
 *
 * Checks that candidates were correctly synced with:
 * - Correct vincere_id assignment
 * - Documents attached to correct candidate
 * - Custom fields set properly
 * - Functional expertise mapped correctly
 *
 * Usage: npx tsx scripts/verify-today-registrations.ts
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { getVincereClient } from '../lib/vincere/client';

// Load .env.local
function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

// Try loading from multiple possible paths
const possiblePaths = [
  resolve(__dirname, '../.env.local'),
  resolve(__dirname, '../.env'),
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '.env'),
];

for (const p of possiblePaths) {
  loadEnvFile(p);
}

interface VincereCandidate {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  primary_email?: string;
  photo_url?: string;
  functional_expertises?: Array<{ id: number; name: string }>;
  custom_fields?: Record<string, unknown>;
  registration_date?: string;
  creator_id?: number;
}

interface VincereSearchResult {
  result: {
    items: VincereCandidate[];
    total: number;
  };
}

interface VincereDocument {
  id: number;
  original_filename: string;
  file_type?: string;
  created_date?: string;
}

async function searchCandidateByName(vincere: ReturnType<typeof getVincereClient>, firstName: string, lastName: string): Promise<VincereCandidate[]> {
  try {
    // Search by name to find all matching candidates (including duplicates)
    const result = await vincere.get<VincereSearchResult>(
      `/candidate/search/fl=id,name,first_name,last_name,email,primary_email,photo_url,registration_date;sort=registration_date desc?q=first_name:${encodeURIComponent(firstName)} AND last_name:${encodeURIComponent(lastName)}`
    );
    return result.result?.items || [];
  } catch (error) {
    console.error(`  Error searching for ${firstName} ${lastName}:`, error);
    return [];
  }
}

async function getCandidateDetails(vincere: ReturnType<typeof getVincereClient>, candidateId: number): Promise<VincereCandidate | null> {
  try {
    return await vincere.get<VincereCandidate>(`/candidate/${candidateId}`);
  } catch (error) {
    console.error(`  Error getting candidate ${candidateId}:`, error);
    return null;
  }
}

async function getCandidateFunctionalExpertise(vincere: ReturnType<typeof getVincereClient>, candidateId: number): Promise<Array<{ id: number; name: string }>> {
  try {
    return await vincere.get<Array<{ id: number; name: string }>>(`/candidate/${candidateId}/functionalexpertises`) || [];
  } catch (error) {
    console.error(`  Error getting functional expertise for ${candidateId}:`, error);
    return [];
  }
}

async function getCandidateCustomFields(vincere: ReturnType<typeof getVincereClient>, candidateId: number): Promise<Record<string, unknown>> {
  try {
    return await vincere.get<Record<string, unknown>>(`/candidate/${candidateId}/customfields`) || {};
  } catch (error) {
    console.error(`  Error getting custom fields for ${candidateId}:`, error);
    return {};
  }
}

async function getCandidateDocuments(vincere: ReturnType<typeof getVincereClient>, candidateId: number): Promise<VincereDocument[]> {
  try {
    return await vincere.get<VincereDocument[]>(`/candidate/${candidateId}/files`) || [];
  } catch (error) {
    console.error(`  Error getting documents for ${candidateId}:`, error);
    return [];
  }
}

async function main() {
  console.log('=== Verifying Today\'s Candidate Registrations in Vincere ===\n');

  // Initialize Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const vincere = getVincereClient();

  // Get today's registrations
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: candidates, error } = await supabase
    .from('candidates')
    .select(`
      id,
      first_name,
      last_name,
      email,
      vincere_id,
      primary_position,
      created_at,
      source,
      last_synced_at,
      is_smoker,
      has_visible_tattoos,
      has_schengen,
      has_b1b2,
      has_eng1,
      has_stcw,
      available_from,
      desired_salary_min,
      preferred_yacht_size_min,
      preferred_yacht_size_max,
      preferred_regions,
      is_couple,
      marital_status,
      preferred_contract_types,
      preferred_yacht_types
    `)
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get candidates: ${error.message}`);
  }

  if (!candidates || candidates.length === 0) {
    console.log('No registrations found for today.\n');
    return;
  }

  console.log(`Found ${candidates.length} registration(s) today:\n`);

  // Get documents for each candidate
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .in('entity_id', candidates.map(c => c.id))
    .eq('entity_type', 'candidate');

  const docsByCandidate = (documents || []).reduce((acc, doc) => {
    if (!acc[doc.entity_id]) acc[doc.entity_id] = [];
    acc[doc.entity_id].push(doc);
    return acc;
  }, {} as Record<string, typeof documents>);

  let hasIssues = false;

  for (const candidate of candidates) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📋 ${candidate.first_name} ${candidate.last_name}`);
    console.log(`   Email: ${candidate.email}`);
    console.log(`   Our ID: ${candidate.id}`);
    console.log(`   Vincere ID (in DB): ${candidate.vincere_id || 'NOT SET'}`);
    console.log(`   Position: ${candidate.primary_position || 'Not set'}`);
    console.log(`   Created: ${candidate.created_at}`);
    console.log(`   Last synced: ${candidate.last_synced_at || 'Never'}`);

    const ourDocs = docsByCandidate[candidate.id] || [];
    console.log(`   Documents in DB: ${ourDocs.length}`);
    ourDocs.forEach(d => console.log(`     - ${d.name} (${d.type})`));
    console.log('');

    // First check if we have a vincere_id to verify directly
    if (!candidate.vincere_id) {
      console.log(`   ❌ No vincere_id in database - sync may have failed!`);
      hasIssues = true;
      continue;
    }

    // Search by name to check for duplicates
    console.log(`   🔍 Searching Vincere by name: ${candidate.first_name} ${candidate.last_name}`);
    const nameMatches = await searchCandidateByName(vincere, candidate.first_name!, candidate.last_name!);

    if (nameMatches.length > 1) {
      console.log(`   ⚠️  POTENTIAL DUPLICATES: Found ${nameMatches.length} candidates with same name in Vincere!`);
      nameMatches.forEach(v => {
        const isOurs = v.id.toString() === candidate.vincere_id;
        console.log(`      ${isOurs ? '→' : ' '} ID: ${v.id}, Name: ${v.name}, Registered: ${v.registration_date}${isOurs ? ' (OURS)' : ''}`);
      });

      // Check if multiple were created today
      const todayMatches = nameMatches.filter(v => {
        if (!v.registration_date) return false;
        const regDate = new Date(v.registration_date);
        const today = new Date();
        return regDate.toDateString() === today.toDateString();
      });

      if (todayMatches.length > 1) {
        console.log(`   ⚠️  ${todayMatches.length} of these were created TODAY - likely a race condition!`);
        hasIssues = true;
      }
    } else if (nameMatches.length === 1) {
      console.log(`   ✅ Only 1 candidate found with this name`);
    } else {
      console.log(`   ⚠️  No candidates found by name search!`);
    }

    // Fetch our candidate directly by vincere_id
    console.log(`\n   📌 Fetching Vincere Candidate ID: ${candidate.vincere_id}`);
    const match = await getCandidateDetails(vincere, parseInt(candidate.vincere_id));

    if (!match) {
      console.log(`   ❌ Could not fetch candidate ${candidate.vincere_id} from Vincere!`);
      hasIssues = true;
      continue;
    }

    console.log(`      Name: ${match.name || match.first_name + ' ' + match.last_name}`);

    // Get photo info
    const hasPhoto = !!(match as any).photo_url || !!(match as any).photo;
    console.log(`      Has photo: ${hasPhoto ? '✅ Yes' : '❌ No'}`);

    // Get functional expertise
    console.log(`\n      Functional Expertise:`);
    const expertise = await getCandidateFunctionalExpertise(vincere, parseInt(candidate.vincere_id));
    if (expertise.length === 0) {
      console.log(`         ❌ None set!`);
      if (candidate.primary_position) {
        console.log(`         ⚠️  Should have: ${candidate.primary_position}`);
        hasIssues = true;
      }
    } else {
      expertise.forEach(e => console.log(`         ✅ ${e.name} (ID: ${e.id})`));
    }

    // Get custom fields
    console.log(`\n      Custom Fields:`);
    const customFields = await getCandidateCustomFields(vincere, parseInt(candidate.vincere_id));
    const fieldCount = Object.keys(customFields).filter(k => customFields[k] !== null && customFields[k] !== '').length;
    console.log(`         Total non-empty fields: ${fieldCount}`);

    // Check key fields
    const keyChecks = [
      { key: 'smoker', our: candidate.is_smoker },
      { key: 'tattoos', our: candidate.has_visible_tattoos },
      { key: 'schengen', our: candidate.has_schengen },
      { key: 'b1b2', our: candidate.has_b1b2 },
      { key: 'eng1', our: candidate.has_eng1 },
      { key: 'stcw', our: candidate.has_stcw },
    ];

    for (const check of keyChecks) {
      const vincereValue = customFields[check.key];
      if (check.our !== null && check.our !== undefined) {
        const matches = vincereValue !== null && vincereValue !== undefined;
        console.log(`         ${check.key}: ${matches ? '✅' : '❌'} (ours: ${check.our}, vincere: ${vincereValue ?? 'not set'})`);
      }
    }

    // Get documents
    console.log(`\n      Documents in Vincere:`);
    const vinDocs = await getCandidateDocuments(vincere, parseInt(candidate.vincere_id));
    if (vinDocs.length === 0) {
      console.log(`         ❌ No documents!`);
      if (ourDocs.length > 0) {
        console.log(`         ⚠️  We have ${ourDocs.length} document(s) that should be synced`);
        hasIssues = true;
      }
    } else {
      vinDocs.forEach(d => console.log(`         ✅ ${d.original_filename} (ID: ${d.id})`));

      // Compare CV count
      const ourCvCount = ourDocs.filter(d => d.type === 'cv').length;
      const vinCvCount = vinDocs.filter(d =>
        d.original_filename?.toLowerCase().includes('cv') ||
        d.file_type?.toLowerCase().includes('cv')
      ).length;
      if (ourCvCount > 0 && vinCvCount === 0) {
        console.log(`         ⚠️  CV not synced to Vincere`);
        hasIssues = true;
      }
    }
    console.log('');
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n=== Summary ===`);
  console.log(`Total registrations today: ${candidates.length}`);
  console.log(`Issues found: ${hasIssues ? '⚠️  YES - Review above' : '✅ None'}`);
}

main().catch((error) => {
  console.error('\nScript failed:', error.message);
  process.exit(1);
});
