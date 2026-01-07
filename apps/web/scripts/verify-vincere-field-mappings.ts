/**
 * Verification script for Vincere custom field mappings
 * 
 * This script verifies that all custom fields defined in VINCERE_FIELD_KEYS
 * are properly mapped in both directions:
 * - mapVincereToCandidate (Vincere → Network)
 * - mapCandidateToVincere (Network → Vincere)
 * 
 * Run with: npx tsx apps/web/scripts/verify-vincere-field-mappings.ts
 */

import { VINCERE_FIELD_KEYS } from '../lib/vincere/constants';
import { readFileSync } from 'fs';
import { join } from 'path';

interface FieldMapping {
  fieldKey: string;
  fieldName: string;
  mappedInVincereToCandidate: boolean;
  mappedInCandidateToVincere: boolean;
  notes?: string;
}

// Field name mapping (from docs/VINCERE INTEGRATION.md)
const FIELD_NAMES: Record<keyof typeof VINCERE_FIELD_KEYS, string> = {
  secondNationality: 'Second Nationality',
  smoker: 'Smoker',
  tattoos: 'Tattoos',
  tattooLocation: 'Tattoo Location',
  maritalStatus: 'Marital Status',
  partnerName: 'Partners Name',
  partnerPosition: 'Partners Position',
  couplePosition: 'Couple Position',
  schengenVisa: 'Schengen Visa',
  b1b2: 'B1/B2',
  eng1: 'ENG1',
  stcw: 'STCW',
  contractType: 'Preferred Contract Type',
  highestLicence: 'Highest Licence',
  secondLicence: 'Second Licence',
  yachtSize: 'Preferred Yacht Size',
  desiredSalary: 'Desired Salary',
  yachtType: 'Preferred Yacht Type',
  startDate: 'Start Date',
  interviewNotes: 'Interview Notes',
  desiredLocation: 'Desired Location',
};

function checkMappings(): {
  allMapped: boolean;
  mappings: FieldMapping[];
  missingInVincereToCandidate: string[];
  missingInCandidateToVincere: string[];
} {
  const syncFilePath = join(process.cwd(), 'apps/web/lib/vincere/sync.ts');
  const syncFileContent = readFileSync(syncFilePath, 'utf-8');

  const mappings: FieldMapping[] = [];
  const missingInVincereToCandidate: string[] = [];
  const missingInCandidateToVincere: string[] = [];

  // Check each field
  for (const [key, fieldKey] of Object.entries(VINCERE_FIELD_KEYS)) {
    const fieldName = FIELD_NAMES[key as keyof typeof VINCERE_FIELD_KEYS] || key;
    
    // Check if mapped in mapVincereToCandidate
    // Look for getField or getBoolField calls with this key
    const mappedInVincereToCandidate = 
      syncFileContent.includes(`getField('${key}')`) ||
      syncFileContent.includes(`getBoolField('${key}')`) ||
      syncFileContent.includes(`getField("${key}")`) ||
      syncFileContent.includes(`getBoolField("${key}")`);

    // Check if mapped in mapCandidateToVincere
    // Look for VINCERE_FIELD_KEYS.${key} usage
    const mappedInCandidateToVincere = 
      syncFileContent.includes(`VINCERE_FIELD_KEYS.${key}`);

    // Special cases
    let notes: string | undefined;
    if (key === 'interviewNotes') {
      notes = 'Mapped to candidate_agency_relationships, not candidate directly';
      // Interview notes are handled separately, so they're "mapped" in a different way
    }

    const mapping: FieldMapping = {
      fieldKey,
      fieldName,
      mappedInVincereToCandidate: mappedInVincereToCandidate || key === 'interviewNotes',
      mappedInCandidateToVincere: mappedInCandidateToVincere || key === 'interviewNotes',
      notes,
    };

    mappings.push(mapping);

    if (!mapping.mappedInVincereToCandidate && key !== 'interviewNotes') {
      missingInVincereToCandidate.push(fieldName);
    }
    if (!mapping.mappedInCandidateToVincere && key !== 'interviewNotes') {
      missingInCandidateToVincere.push(fieldName);
    }
  }

  const allMapped = 
    missingInVincereToCandidate.length === 0 && 
    missingInCandidateToVincere.length === 0;

  return {
    allMapped,
    mappings,
    missingInVincereToCandidate,
    missingInCandidateToVincere,
  };
}

function main() {
  console.log('🔍 Verifying Vincere custom field mappings...\n');

  const result = checkMappings();

  console.log('📊 Mapping Status:\n');
  console.log('Field'.padEnd(30), 'Vincere→Network'.padEnd(18), 'Network→Vincere'.padEnd(18), 'Notes');
  console.log('-'.repeat(90));

  for (const mapping of result.mappings) {
    const toNetwork = mapping.mappedInVincereToCandidate ? '✅' : '❌';
    const toVincere = mapping.mappedInCandidateToVincere ? '✅' : '❌';
    const notes = mapping.notes || '';
    
    console.log(
      mapping.fieldName.padEnd(30),
      toNetwork.padEnd(18),
      toVincere.padEnd(18),
      notes
    );
  }

  console.log('\n');

  if (result.allMapped) {
    console.log('✅ All custom fields are properly mapped in both directions!');
    process.exit(0);
  } else {
    console.log('❌ Some fields are missing mappings:\n');
    
    if (result.missingInVincereToCandidate.length > 0) {
      console.log('Missing in mapVincereToCandidate (Vincere → Network):');
      result.missingInVincereToCandidate.forEach(field => {
        console.log(`  - ${field}`);
      });
      console.log();
    }

    if (result.missingInCandidateToVincere.length > 0) {
      console.log('Missing in mapCandidateToVincere (Network → Vincere):');
      result.missingInCandidateToVincere.forEach(field => {
        console.log(`  - ${field}`);
      });
      console.log();
    }

    console.log('⚠️  Please add the missing mappings to apps/web/lib/vincere/sync.ts');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { checkMappings };

