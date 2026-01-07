# Vincere Webhook Mapping Verification

## ✅ Verification Status: **CONFIRMED**

This document verifies that when candidates/jobs are added/updated in Vincere, the information is correctly mapped and stored in our application.

## Test Results

All tests passed successfully:
- ✅ Webhook event structure validation
- ✅ Job mapping function verification
- ✅ Candidate mapping function verification
- ✅ Webhook handler logic verification

## Webhook Event Format

Vincere sends webhook events in the following format:

```typescript
interface VincereWebhookEvent {
  entity_type: "JOB" | "CANDIDATE";
  action_type: "CREATE" | "UPDATE" | "DELETE" | "ARCHIVE";
  timestamp?: string;
  data: {
    id: number; // Vincere ID
    [key: string]: unknown;
  };
}
```

## Job Webhook Flow

### Endpoint
`POST /api/webhooks/vincere`

### Supported Events
- `JOB.CREATE` - New job created in Vincere
- `JOB.UPDATE` - Job updated in Vincere
- `JOB.DELETE` - Job deleted in Vincere (marked as cancelled)

### Processing Flow

1. **Receive Webhook Event**
   - Validates event structure (`entity_type`, `action_type`, `data.id`)
   - Extracts Vincere job ID from `event.data.id`

2. **Fetch Full Job Data**
   - Calls `getJobWithCustomFields(vincereJobId)` to fetch:
     - Base job data from `/position/{id}`
     - Custom fields from `/position/{id}/customfields`

3. **Map to Internal Format**
   - Uses `mapVincereToJob(job, customFields)` to transform:
     - Vincere job structure → Our job structure
     - Custom fields (yacht, requirements, salary, itinerary, etc.) → Standardized fields
     - Status mapping (OPEN → open, CLOSED → cancelled, etc.)
     - Visibility mapping (open jobs → public, closed → private)

4. **Database Operations**
   - **Find existing job**: Query by `external_id` and `external_source = 'vincere'`
   - **Update or Insert**:
     - If exists: Update all fields, preserve `client_id` and `created_by_user_id`
     - If new: Insert with `created_by_agency_id = LIGHTHOUSE_ORG_ID`
   - **Always set**: `created_by_agency_id = "00000000-0000-0000-0000-000000000001"` (Lighthouse Careers)

### Field Mapping

| Vincere Field | Our Field | Mapping Logic |
|--------------|-----------|---------------|
| `id` | `external_id` | Direct conversion to string |
| `job_title` | `title` | Direct |
| `company_name` | `vessel_name` | Direct (fallback to custom field "yacht") |
| `salary_from` | `salary_min` | Direct (or parsed from custom field) |
| `salary_to` | `salary_max` | Direct (or parsed from custom field) |
| `start_date` | `start_date` | Direct (or from custom field) |
| `location` | `primary_region` | Direct (or extracted from itinerary) |
| `internal_description` | `requirements_text` | Direct (with fallbacks) |
| `open_date` + `closed_job` | `status` | Complex logic: determines `open`, `cancelled`, `draft`, `on_hold` |
| `open_date` + `closed_job` | `is_public` | Only open jobs are public |
| Custom: `yacht` | `vessel_name`, `vessel_type`, `vessel_size_meters` | Parsed (e.g., "80m MY" → size: 80, type: "motor") |
| Custom: `requirements` | `requirements_text` | Direct |
| Custom: `itinerary` | `itinerary` | Direct |
| Custom: `salary` | `salary_min`, `salary_max` | Parsed from text |
| Custom: `holidayPackage` | `rotation_schedule` or `holiday_days` | Detects rotation vs. holiday days |
| Custom: `contractType` | `contract_type` | Mapped from ID to enum |
| Custom: `program` | `program` | Direct |
| Custom: `startDate` | `start_date` | Direct |

### Status Mapping Logic

```typescript
// Vincere determines job status by:
// 1. closed_job field being true → cancelled
// 2. close_date in the past → cancelled
// 3. open_date must exist for job to be open
// 4. job_status field for explicit status

const isOpen = hasOpenDate && !isClosedJob && !isPastCloseDate;

if (vincereStatus === 'FILLED') {
  status = 'filled';
} else if (isClosedJob || isPastCloseDate) {
  status = 'cancelled';
} else if (!hasOpenDate) {
  status = 'draft';
} else if (vincereStatus === 'ON_HOLD') {
  status = 'on_hold';
} else {
  status = 'open';
}
```

## Candidate Webhook Flow

### Endpoint
`POST /api/webhooks/vincere/candidates`

### Supported Events
- `CANDIDATE.CREATE` - New candidate created in Vincere
- `CANDIDATE.UPDATE` - Candidate updated in Vincere
- `CANDIDATE.ARCHIVE` - Candidate archived in Vincere
- `CANDIDATE.DELETE` - Candidate deleted in Vincere (unlinked)

### Processing Flow

1. **Receive Webhook Event**
   - Validates event structure (`entity_type`, `action_type`, `data.id`)
   - Extracts Vincere candidate ID from `event.data.id`

2. **Fetch Full Candidate Data**
   - Calls `getCandidateWithCustomFields(vincereCandidateId)` to fetch:
     - Base candidate data from `/candidate/{id}`
     - Custom fields from `/candidate/{id}/customfields`

3. **Map to Internal Format**
   - Uses `mapVincereToCandidate(candidate, customFields)` to transform:
     - Vincere candidate structure → Our candidate structure
     - Custom fields (yacht preferences, certifications, visas, etc.) → Standardized fields
     - Position standardization (maps various position names to our categories)

4. **Database Operations**
   - **Find existing candidate**: Query by `vincere_id`
   - **Update or Insert**:
     - If exists: Update all fields
     - If new: Insert new candidate
   - **Create/Update Agency Relationship**:
     - Always ensure `candidate_agency_relationships` entry exists
     - Links candidate to `LIGHTHOUSE_ORG_ID` via `candidate_agency_relationships` table
     - Sets `relationship_type = "vincere_sync"`
     - Stores `agency_candidate_id = vincereCandidateId.toString()`

### Field Mapping

| Vincere Field | Our Field | Mapping Logic |
|--------------|-----------|---------------|
| `id` | `vincere_id` | Direct conversion to string |
| `first_name` | `first_name` | Direct |
| `last_name` | `last_name` | Direct |
| `email` or `primary_email` | `email` | Direct (with fallback) |
| `phone` | `phone` | Direct |
| `mobile` | `whatsapp` | Direct |
| `date_of_birth` | `date_of_birth` | Direct |
| `gender` | `gender` | Direct |
| `nationality` | `nationality` | Direct |
| `job_title` | `primary_position`, `position_category` | Standardized using position mapping |
| `summary` | `profile_summary` | Direct (with skills appended) |
| `current_location` | `current_location` | Direct (or from extended data) |
| Custom: `desiredSalary` | `desired_salary_min`, `desired_salary_max`, `salary_currency` | Parsed from text (e.g., "€5000-€7000") |
| Custom: `yachtSize` | `preferred_yacht_size_min`, `preferred_yacht_size_max` | Parsed from text (e.g., "40m-60m") |
| Custom: `yachtType` | `preferred_yacht_types` | Mapped from IDs to array |
| Custom: `contractType` | `preferred_contract_types` | Mapped from IDs to array |
| Custom: `desiredLocation` | `preferred_regions` | Split by comma/semicolon |
| Custom: `startDate` | `available_from` | Direct |
| Custom: `maritalStatus` | `marital_status` | Mapped from ID |
| Custom: `secondNationality` | `second_nationality` | Mapped from ID |
| Custom: `couplePosition` | `is_couple`, `couple_position` | Mapped from ID (1=yes, 2=no, 3=flexible) |
| Custom: `smoker` | `is_smoker` | Mapped from ID (1=yes, 2=no) |
| Custom: `schengenVisa` | `has_schengen` | Boolean |
| Custom: `b1b2` | `has_b1b2` | Boolean |
| Custom: `stcw` | `has_stcw` | Boolean |
| Custom: `eng1` | `has_eng1` | Boolean |
| Custom: `highestLicence` | `highest_license` | Direct |
| Custom: `secondLicence` | `second_license` | Direct |
| Custom: `tattoos` | `has_visible_tattoos` | Boolean |
| Custom: `tattooLocation` | `tattoo_description` | Direct |
| Custom: `partnerName` | `partner_name` | Direct |
| Custom: `partnerPosition` | `partner_position` | Direct |
| Extended: `functionalExpertises` | `profile_summary` | Skills appended to summary |
| Extended: `currentLocation` | `current_location` | Prefer extended data |
| Extended: `candidateStatus` | `availability_status` | Mapped to 'available' or 'not_looking' |

### Organization Allocation

**Important**: Candidates are NOT directly linked to organizations via `organization_id`. Instead, they are linked via the `candidate_agency_relationships` table:

```typescript
// After creating/updating candidate, ensure relationship exists:
await supabase.from("candidate_agency_relationships").upsert({
  candidate_id: candidate.id,
  agency_id: "00000000-0000-0000-0000-000000000001", // Lighthouse Careers
  relationship_type: "vincere_sync",
  is_exclusive: false,
  agency_candidate_id: vincereCandidateId.toString(),
});
```

## Data Allocation Verification

### Jobs
- ✅ All jobs from Vincere are assigned to `created_by_agency_id = "00000000-0000-0000-0000-000000000001"` (Lighthouse Careers)
- ✅ Existing relationships (`client_id`, `created_by_user_id`) are preserved on updates

### Candidates
- ✅ All candidates from Vincere are linked to Lighthouse Careers via `candidate_agency_relationships`
- ✅ Relationship type is set to `"vincere_sync"`
- ✅ `agency_candidate_id` stores the Vincere candidate ID for reference

## Error Handling

### Job Webhook Errors
- If job not found in Vincere: Logs error, returns gracefully
- If mapping fails: Throws error, webhook returns 500
- If database insert/update fails: Logs error, throws error

### Candidate Webhook Errors
- If candidate not found in Vincere: Logs error, returns gracefully
- If mapping fails: Throws error, webhook returns 500
- If database insert/update fails: Logs error, throws error
- If relationship creation fails: Logs error but doesn't fail webhook (non-critical)

## Testing

Run the verification test suite:

```bash
cd apps/web && npx tsx scripts/test-webhook-mapping.ts
```

This test suite verifies:
1. Webhook event structure matches expected format
2. Mapping functions correctly transform Vincere data
3. Field types match database schema
4. Webhook handler logic correctly routes events

## Conclusion

✅ **All webhook mappings are verified and working correctly.**

When a candidate or job is added/updated in Vincere:
1. Webhook is received with correct event structure
2. Full data is fetched from Vincere API (including custom fields)
3. Data is correctly mapped to our internal format
4. Data is stored in database with correct organization allocation
5. Relationships are properly maintained

The system is production-ready for receiving and processing Vincere webhooks.

