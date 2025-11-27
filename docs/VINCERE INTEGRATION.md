# LIGHTHOUSE CREW NETWORK - Vincere Integration & Data Mapping

## Overview

Vincere is the current ATS (Applicant Tracking System) for Lighthouse Careers. This document defines how data flows between Vincere and the new Lighthouse Network platform.

**Strategy**: Vincere remains source of truth during transition. Network platform syncs FROM Vincere initially, then gradually becomes the primary system.

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CURRENT STATE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   VINCERE (ATS)                                                             │
│   ─────────────                                                             │
│   • Candidates (master)                                                     │
│   • Jobs (master)                                                           │
│   • Applications                                                            │
│   • Placements                                                              │
│   • Companies (clients)                                                     │
│           │                                                                 │
│           ▼                                                                 │
│   ┌───────────────┐                                                         │
│   │    n8n        │ ──────► Bubble (Candidate Portal + Job Board)          │
│   │  Workflows    │ ──────► Supabase (Vector embeddings for CV/certs/refs) │
│   └───────────────┘                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            TARGET STATE                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   VINCERE (Legacy)              LIGHTHOUSE NETWORK (Primary)                │
│   ────────────────              ────────────────────────────                │
│   • Historical data             • Candidates (with embeddings)              │
│   • Backup system               • Jobs (with AI parsing)                    │
│   • External reporting          • Submissions (timestamp authority)         │
│                                 • Placements (revenue tracking)             │
│           │                     • Briefs (multi-channel intake)             │
│           │                     • Organizations (multi-agency)              │
│           ▼                                │                                │
│   ┌───────────────┐                       │                                │
│   │    n8n        │◄──────────────────────┘                                │
│   │  Sync Layer   │                                                         │
│   └───────────────┘                                                         │
│           │                                                                 │
│           ▼                                                                 │
│   Bubble (sunset) ──► Redirect to Network candidate portal                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Vincere Data Structure

### Vincere Entities

| Entity | Vincere Endpoint | Description |
|--------|------------------|-------------|
| Candidates | `/candidate` | Crew members |
| Jobs | `/job` | Open positions |
| Applications | `/application` | Candidate-job links |
| Placements | `/placement` | Confirmed hires |
| Companies | `/company` | Clients (yacht owners, mgmt cos) |
| Contacts | `/contact` | People at companies |
| Users | `/user` | Recruiters |

### Vincere Custom Fields (Yacht Industry)

These are your custom fields in Vincere with their exact field keys:

```
CANDIDATE CUSTOM FIELDS:
─────────────────────────
Field Key                              | Field Name               | Value Type
────────────────────────────────────────────────────────────────────────────────
d863391eddef6865b5d78e13d6a688ed       | Second Nationality       | dropdown (1-179)
ce39bf25a1afb59679cd63988813e64d       | Smoker                   | 1=Yes, 2=No, 3=Social
9c7677f6b79f526fe57b76558941b475       | Tattoos                  | 1=Yes, 2=No
a833bdb7288a6f12384e9d1ec23a0579       | Tattoo Location          | text
768f3644fbf76cf6c18185238566f108       | Marital Status           | 1=Single, 2=Married, 3=In relationship
4b954494016e2b840f6b1f14a835b332       | Partners Name            | text
ee670a88fe0c4e2cf424aa6e1fbea5bd       | Partners Position        | text
e322dfbcbb52e1d3f4a3407cfe0cdbba       | Couple Position          | 1=Yes, 2=No, 3=Flexible
1b3980ec75cfc38c2a809f4308346b47       | Schengen Visa            | 1=Yes, 2=No
f2ddc9e39b35108ac88539dc6963c4d9       | B1/B2                    | 1=Yes, 2=No
888d240c45a4c239dc6626c025c805d1       | ENG1                     | 1=Yes, 2=No
c660a4158d8d11f2e2aa1f84db8a52f6       | STCW                     | 1=Yes, 2=No
68df45f3ddb75e93afa7b9f8d66c17bd       | Preferred Contract Type  | 1=Perm, 2=Rot, 3=Seasonal, 4=Freelance
83f3f9dc58b5fc1d0b7d591fd82f001b       | Highest Licence          | dropdown
80429528339faa3362600dedfcb72d9d       | Second Licence           | dropdown
37c70d9ff937132692788d7b6fd85a8c       | Preferred Yacht Size     | text
5d15d9dcdc2eea6ca016960b061e9261       | Desired Salary           | text
7763f7fceda588cc9c5298412dbe7ea7       | Preferred Yacht Type     | 1=Motor, 2=Sailing
03f76b1a428a834d5da30b705b01c574       | Start Date               | date
e5b402a60252d0177afe8c5236b3f7b5       | Interview Notes          | text
9d00638dd03d9a54ba1ea66c48008bd0       | Desired Location         | text

JOB/POSITION CUSTOM FIELDS:
───────────────────────────
Field Key                              | Field Name               | Value Type
────────────────────────────────────────────────────────────────────────────────
f8b2c1ddc995fb699973598e449193c3       | Yacht/Yacht Size         | text
3c580f529de2e205114090aa08e10f7a       | Requirements             | text
9a214be2a25d61d1add26dca93aef45a       | Start Date               | date
b8a75c8b68fb5c85fb083aac4bbbed94       | Itinerary/Location       | text
035ca080627c6bac4e59e6fc6750a5b6       | Salary                   | text
24a44070b5d77ce92fb018745ddbe374       | Private/Charter/Program  | dropdown
ecac1d20eb2b26a248837610935d9b92       | Holiday Package/Contract | text
c980a4f92992081ead936fb8a358fb79       | Contract/Rotation Type   | 1=Perm, 2/3=Rot, 4=Temp

OTHER VINCERE IDs:
──────────────────
candidate_source_id: 29105             | Source for Bubble registrations
creator_id: 28959                      | Default recruiter ID
industry_id: 28884, 28886              | Yacht/Villa industry filters
```

---

## Field Mapping: Vincere → Lighthouse Network

### Candidates

| Vincere Field | Network Field | Notes |
|---------------|---------------|-------|
| `id` | `vincere_id` | Store for sync reference |
| `first_name` | `first_name` | Direct map |
| `last_name` | `last_name` | Direct map |
| `email` | `email` | Direct map |
| `phone` | `phone` | Direct map |
| `mobile` | `whatsapp` | Assume mobile = WhatsApp |
| `date_of_birth` | `date_of_birth` | Direct map |
| `gender` | `gender` | Direct map |
| `nationality` | `nationality` | Direct map |
| `current_location` | `current_location` | Direct map |
| `job_title` | `primary_position` | Map to standardized position |
| `summary` | `profile_summary` | Direct map |
| `created_date` | `created_at` | Direct map |
| `updated_date` | `updated_at` | Direct map |

**Custom Fields Mapping (with exact field_key):**

```javascript
// VINCERE CANDIDATE CUSTOM FIELD MAPPINGS
// Use these field_key values when calling PATCH /candidate/{id}/customfields

const VINCERE_CANDIDATE_CUSTOM_FIELDS = {
  // Personal Details
  'Second Nationality': {
    field_key: 'd863391eddef6865b5d78e13d6a688ed',
    network_field: 'second_nationality',
    type: 'dropdown',
    // Values: 1-179 mapped to nationalities (see NATIONALITY_MAP below)
  },
  'Smoker': {
    field_key: 'ce39bf25a1afb59679cd63988813e64d',
    network_field: 'is_smoker',
    type: 'dropdown',
    values: { 1: true, 2: false, 3: 'social' },
    transform: (v) => v === 1 ? true : (v === 2 ? false : 'social'),
  },
  'Tattoos': {
    field_key: '9c7677f6b79f526fe57b76558941b475',
    network_field: 'has_visible_tattoos',
    type: 'dropdown',
    values: { 1: true, 2: false },
    transform: (v) => v === 1,
  },
  'Tattoo Location': {
    field_key: 'a833bdb7288a6f12384e9d1ec23a0579',
    network_field: 'tattoo_description',
    type: 'text',
  },
  'Marital Status': {
    field_key: '768f3644fbf76cf6c18185238566f108',
    network_field: 'marital_status',
    type: 'dropdown',
    values: { 1: 'single', 2: 'married', 3: 'in_relationship' },
  },
  
  // Partner/Couple Info
  'Partners Name': {
    field_key: '4b954494016e2b840f6b1f14a835b332',
    network_field: 'partner_name',
    type: 'text',
  },
  'Partners Position': {
    field_key: 'ee670a88fe0c4e2cf424aa6e1fbea5bd',
    network_field: 'partner_position',
    type: 'text',
  },
  'Couple Position': {
    field_key: 'e322dfbcbb52e1d3f4a3407cfe0cdbba',
    network_field: 'is_couple',
    type: 'dropdown',
    values: { 1: true, 2: false, 3: 'flexible' },
  },
  
  // Visas & Documents
  'Schengen Visa': {
    field_key: '1b3980ec75cfc38c2a809f4308346b47',
    network_field: 'has_schengen',
    type: 'dropdown',
    values: { 1: true, 2: false },
  },
  'B1/B2': {
    field_key: 'f2ddc9e39b35108ac88539dc6963c4d9',
    network_field: 'has_b1b2',
    type: 'dropdown',
    values: { 1: true, 2: false },
  },
  'ENG1': {
    field_key: '888d240c45a4c239dc6626c025c805d1',
    network_field: 'has_eng1',
    type: 'dropdown',
    values: { 1: true, 2: false },
  },
  'STCW': {
    field_key: 'c660a4158d8d11f2e2aa1f84db8a52f6',
    network_field: 'has_stcw',
    type: 'dropdown',
    values: { 1: true, 2: false },
  },
  
  // Licenses
  'Highest Licence': {
    field_key: '83f3f9dc58b5fc1d0b7d591fd82f001b',
    network_field: 'highest_license',
    type: 'dropdown',
  },
  'Second Licence': {
    field_key: '80429528339faa3362600dedfcb72d9d',
    network_field: null, // → certifications table
    type: 'dropdown',
  },
  
  // Preferences
  'Preferred Contract Type': {
    field_key: '68df45f3ddb75e93afa7b9f8d66c17bd',
    network_field: 'preferred_contract_types',
    type: 'dropdown',
    values: { 1: 'permanent', 2: 'rotational', 3: 'seasonal', 4: 'freelance' },
  },
  'Preferred Yacht Size': {
    field_key: '37c70d9ff937132692788d7b6fd85a8c',
    network_field: 'preferred_yacht_size_min/max',
    type: 'text',
    // Parse "40m-60m" → { min: 40, max: 60 }
  },
  'Preferred Yacht Type': {
    field_key: '7763f7fceda588cc9c5298412dbe7ea7',
    network_field: 'preferred_yacht_types',
    type: 'dropdown',
    values: { 1: 'motor', 2: 'sailing' },
  },
  'Desired Salary': {
    field_key: '5d15d9dcdc2eea6ca016960b061e9261',
    network_field: 'desired_salary_min/max',
    type: 'text',
    // Parse "€5000-€7000" → { min: 5000, max: 7000, currency: 'EUR' }
  },
  'Desired Location': {
    field_key: '9d00638dd03d9a54ba1ea66c48008bd0',
    network_field: 'preferred_regions',
    type: 'text',
  },
  
  // Availability & Notes
  'Start Date': {
    field_key: '03f76b1a428a834d5da30b705b01c574',
    network_field: 'available_from',
    type: 'date',
    // Use date_value instead of field_values
  },
  'Interview Notes': {
    field_key: 'e5b402a60252d0177afe8c5236b3f7b5',
    network_field: null, // → candidate_agency_relationships.interview_notes
    type: 'text',
  },
};

// JOB/POSITION CUSTOM FIELD MAPPINGS
const VINCERE_JOB_CUSTOM_FIELDS = {
  'Yacht': {
    field_key: 'f8b2c1ddc995fb699973598e449193c3',
    network_field: 'vessel_name',
    type: 'text',
  },
  'Requirements': {
    field_key: '3c580f529de2e205114090aa08e10f7a',
    network_field: 'requirements_text',
    type: 'text',
  },
  'Start Date': {
    field_key: '9a214be2a25d61d1add26dca93aef45a',
    network_field: 'start_date',
    type: 'date',
  },
  'Itinerary': {
    field_key: 'b8a75c8b68fb5c85fb083aac4bbbed94',
    network_field: 'cruising_area',
    type: 'text',
  },
  'Salary': {
    field_key: '035ca080627c6bac4e59e6fc6750a5b6',
    network_field: 'salary_min/max',
    type: 'text',
  },
  'Program': {
    field_key: '24a44070b5d77ce92fb018745ddbe374',
    network_field: 'program_type',
    type: 'dropdown',
  },
  'Holiday Package': {
    field_key: 'ecac1d20eb2b26a248837610935d9b92',
    network_field: 'holiday_package',
    type: 'text',
  },
  'Contract Type': {
    field_key: 'c980a4f92992081ead936fb8a358fb79',
    network_field: 'contract_type',
    type: 'dropdown',
    values: { 1: 'permanent', 2: 'rotational', 3: 'rotational', 4: 'temporary' },
  },
};

// OTHER VINCERE SYSTEM IDs
const VINCERE_SYSTEM_IDS = {
  CANDIDATE_SOURCE_BUBBLE: 29105,      // Source ID for Bubble portal registrations
  DEFAULT_CREATOR_ID: 28959,           // Default recruiter/creator ID
  INDUSTRY_YACHT: 28884,               // Industry ID for yacht jobs
  INDUSTRY_VILLA: 28886,               // Industry ID for villa/estate jobs
};
```

### Jobs

| Vincere Field | Network Field | Notes |
|---------------|---------------|-------|
| `id` | `external_id` | Store for sync |
| `job_title` | `title` | Direct |
| `company_id` | → lookup `client_id` | Map company to organization |
| `status` | `status` | Map to enum |
| `salary_from` | `salary_min` | Direct |
| `salary_to` | `salary_max` | Direct |
| `start_date` | `start_date` | Direct |
| `description` | `requirements_text` | Direct |
| `created_date` | `created_at` | Direct |

**Job Status Mapping:**

| Vincere Status | Network Status |
|----------------|----------------|
| `OPEN` | `open` |
| `FILLED` | `filled` |
| `CLOSED` | `cancelled` |
| `ON_HOLD` | `on_hold` |

### Companies → Organizations

| Vincere Field | Network Field | Notes |
|---------------|---------------|-------|
| `id` | Store in metadata | For sync |
| `name` | `name` | Direct |
| `company_type` | `type` | Map to org_type enum |
| `website` | `website` | Direct |
| `phone` | `phone` | Direct |
| `email` | `email` | Direct |

**Company Type Mapping:**

| Vincere Type | Network Type |
|--------------|--------------|
| `Client` | `private_owner` or `management_co` |
| `Prospect` | `private_owner` (draft) |

### Applications → Submissions

| Vincere Field | Network Field | Notes |
|---------------|---------------|-------|
| `id` | Store in metadata | For sync |
| `candidate_id` | `candidate_id` | Lookup by vincere_id |
| `job_id` | `job_id` | Lookup by external_id |
| `status` | `status` | Map to enum |
| `created_date` | `submitted_at` | Critical: preserve timestamp |
| `stage` | `status` | Map interview stages |

**Application Status Mapping:**

| Vincere Stage | Network Status |
|---------------|----------------|
| `NEW` | `pending` |
| `SHORTLIST` | `shortlisted` |
| `INTERVIEW` | `interviewing` |
| `OFFER` | `offer` |
| `PLACED` | `placed` |
| `REJECTED` | `rejected` |
| `WITHDRAWN` | `withdrawn` |

### Placements

| Vincere Field | Network Field | Notes |
|---------------|---------------|-------|
| `id` | Store in metadata | For sync |
| `candidate_id` | `candidate_id` | Lookup |
| `job_id` | `job_id` | Lookup |
| `company_id` | `client_id` | Lookup |
| `start_date` | `start_date` | Direct |
| `end_date` | `end_date` | Direct |
| `salary` | `salary_agreed` | Direct |
| `fee` | `total_fee` | Direct |
| `status` | `status` | Map |

---

## Position Standardization

Map Vincere free-text positions to standardized categories:

```javascript
const POSITION_MAPPING = {
  // Deck
  'captain': { standard: 'Captain', category: 'deck' },
  'master': { standard: 'Captain', category: 'deck' },
  'chief officer': { standard: 'Chief Officer', category: 'deck' },
  'first officer': { standard: 'Chief Officer', category: 'deck' },
  'first mate': { standard: 'Chief Officer', category: 'deck' },
  '2nd officer': { standard: 'Second Officer', category: 'deck' },
  'second officer': { standard: 'Second Officer', category: 'deck' },
  'third officer': { standard: 'Third Officer', category: 'deck' },
  'bosun': { standard: 'Bosun', category: 'deck' },
  'lead deckhand': { standard: 'Lead Deckhand', category: 'deck' },
  'senior deckhand': { standard: 'Senior Deckhand', category: 'deck' },
  'deckhand': { standard: 'Deckhand', category: 'deck' },
  'junior deckhand': { standard: 'Junior Deckhand', category: 'deck' },
  
  // Interior
  'chief stewardess': { standard: 'Chief Stewardess', category: 'interior' },
  'chief stew': { standard: 'Chief Stewardess', category: 'interior' },
  'head of housekeeping': { standard: 'Chief Stewardess', category: 'interior' },
  'purser': { standard: 'Purser', category: 'interior' },
  'chief purser': { standard: 'Purser', category: 'interior' },
  '2nd stewardess': { standard: 'Second Stewardess', category: 'interior' },
  'second stewardess': { standard: 'Second Stewardess', category: 'interior' },
  '2nd stew': { standard: 'Second Stewardess', category: 'interior' },
  '3rd stewardess': { standard: 'Third Stewardess', category: 'interior' },
  'third stewardess': { standard: 'Third Stewardess', category: 'interior' },
  'stewardess': { standard: 'Stewardess', category: 'interior' },
  'stew': { standard: 'Stewardess', category: 'interior' },
  'junior stewardess': { standard: 'Junior Stewardess', category: 'interior' },
  'sole stewardess': { standard: 'Sole Stewardess', category: 'interior' },
  'laundry stewardess': { standard: 'Laundry Stewardess', category: 'interior' },
  'housekeeping': { standard: 'Housekeeping', category: 'interior' },
  
  // Engineering
  'chief engineer': { standard: 'Chief Engineer', category: 'engineering' },
  'chief eng': { standard: 'Chief Engineer', category: 'engineering' },
  '2nd engineer': { standard: 'Second Engineer', category: 'engineering' },
  'second engineer': { standard: 'Second Engineer', category: 'engineering' },
  '3rd engineer': { standard: 'Third Engineer', category: 'engineering' },
  'third engineer': { standard: 'Third Engineer', category: 'engineering' },
  'eto': { standard: 'ETO', category: 'engineering' },
  'electro technical officer': { standard: 'ETO', category: 'engineering' },
  'engineer': { standard: 'Engineer', category: 'engineering' },
  'junior engineer': { standard: 'Junior Engineer', category: 'engineering' },
  
  // Galley
  'head chef': { standard: 'Head Chef', category: 'galley' },
  'executive chef': { standard: 'Head Chef', category: 'galley' },
  'chef': { standard: 'Chef', category: 'galley' },
  'sole chef': { standard: 'Sole Chef', category: 'galley' },
  'sous chef': { standard: 'Sous Chef', category: 'galley' },
  'second chef': { standard: 'Sous Chef', category: 'galley' },
  'crew chef': { standard: 'Crew Chef', category: 'galley' },
  'cook': { standard: 'Cook', category: 'galley' },
  
  // Other
  'nanny': { standard: 'Nanny', category: 'childcare' },
  'governess': { standard: 'Governess', category: 'childcare' },
  'nurse': { standard: 'Nurse', category: 'medical' },
  'medic': { standard: 'Medic', category: 'medical' },
  'security': { standard: 'Security Officer', category: 'security' },
  'yacht manager': { standard: 'Yacht Manager', category: 'management' },
  'personal assistant': { standard: 'PA', category: 'other' },
  'pa': { standard: 'PA', category: 'other' },
};

function standardizePosition(rawPosition) {
  const normalized = rawPosition.toLowerCase().trim();
  
  for (const [key, value] of Object.entries(POSITION_MAPPING)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  return { standard: rawPosition, category: 'other' };
}
```

---

## Sync Strategy

### Phase 1: Initial Import (One-time)

```
VINCERE                           LIGHTHOUSE NETWORK
─────────                         ──────────────────
All candidates ─────────────────► candidates table
  (yacht industry)                  + generate embeddings
                                    + set vincere_id

All companies ──────────────────► organizations table
  (clients)                         + set type

All jobs ───────────────────────► jobs table
  (active + recent)                 + set external_id
                                    + generate embeddings

All applications ───────────────► submissions table
  (last 2 years)                    + preserve timestamps!
                                    + generate hashes

All placements ─────────────────► placements table
  (last 2 years)
```

### Phase 2: Ongoing Sync (Bidirectional)

```
VINCERE → NETWORK (every 2 hours)
──────────────────────────────────
• New candidates (industry = yacht/villa)
• Updated candidate profiles
• New jobs (source = lighthouse or network visibility)
• Job status changes
• New applications (create submissions)

NETWORK → VINCERE (real-time)
──────────────────────────────────
• New candidates (registered via Network)
  → Only if Lighthouse has relationship
• New submissions (by Lighthouse agency)
  → Create Vincere application
• Placements (by Lighthouse agency)
  → Create Vincere placement
```

### Sync Rules

```javascript
const SYNC_RULES = {
  // What syncs FROM Vincere
  fromVincere: {
    candidates: {
      filter: "custom_field.industry IN ('yacht', 'villa', 'superyacht')",
      frequency: '2 hours',
      onConflict: 'vincere_wins', // During transition
    },
    jobs: {
      filter: "status = 'OPEN' OR updated_date > NOW() - INTERVAL '7 days'",
      frequency: '2 hours',
      onConflict: 'vincere_wins',
    },
    applications: {
      filter: "created_date > NOW() - INTERVAL '30 days'",
      frequency: '2 hours',
      onConflict: 'skip', // Don't overwrite network submissions
    },
  },
  
  // What syncs TO Vincere
  toVincere: {
    candidates: {
      filter: "agency_id = LIGHTHOUSE_ID AND created_via = 'network'",
      frequency: 'real-time',
      createOnly: true, // Don't update existing Vincere records
    },
    submissions: {
      filter: "agency_id = LIGHTHOUSE_ID",
      frequency: 'real-time',
      mapTo: 'application',
    },
    placements: {
      filter: "placing_agency_id = LIGHTHOUSE_ID",
      frequency: 'real-time',
    },
  },
};
```

---

## n8n Workflow Modifications

### Current Workflows (from your files)

1. **Application Creation** - Creates Vincere applications
2. **Candidate Update** - Updates Vincere candidate profiles
3. **Job Sync (2hr)** - Syncs jobs from Vincere
4. **Candidate Profile Sync** - Syncs candidate data
5. **Document Processing** - CloudConvert → AI extraction → Supabase vectors

### Modified Workflows Needed

#### 1. Vincere → Network Candidate Sync

```
┌─────────────────────────────────────────────────────────────────┐
│  TRIGGER: Schedule (every 2 hours)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. GET Vincere candidates                                      │
│     - Modified since last sync                                  │
│     - Industry = yacht/villa                                    │
│                                                                 │
│  2. FOR EACH candidate:                                         │
│     │                                                           │
│     ├─► Transform fields (use mapping above)                    │
│     │                                                           │
│     ├─► Standardize position                                    │
│     │                                                           │
│     ├─► Check if exists in Network (by vincere_id)              │
│     │   ├─► EXISTS: Update record                               │
│     │   └─► NEW: Insert record                                  │
│     │                                                           │
│     ├─► Generate embedding (if profile changed)                 │
│     │   POST /api/candidates/{id}/embed                         │
│     │                                                           │
│     └─► Create agency relationship (Lighthouse)                 │
│                                                                 │
│  3. Log sync results                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 2. Vincere → Network Job Sync

```
┌─────────────────────────────────────────────────────────────────┐
│  TRIGGER: Schedule (every 2 hours)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. GET Vincere jobs                                            │
│     - Status = OPEN or updated recently                         │
│                                                                 │
│  2. FOR EACH job:                                               │
│     │                                                           │
│     ├─► Transform fields                                        │
│     │                                                           │
│     ├─► Map company → organization (create if needed)           │
│     │                                                           │
│     ├─► Check if exists in Network (by external_id)             │
│     │   ├─► EXISTS: Update record                               │
│     │   └─► NEW: Insert record                                  │
│     │                                                           │
│     ├─► Generate embedding (if requirements changed)            │
│     │                                                           │
│     └─► Set visibility based on source                          │
│         - Lighthouse client → private                           │
│         - Other → based on job settings                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 3. Network → Vincere Submission Sync

```
┌─────────────────────────────────────────────────────────────────┐
│  TRIGGER: Webhook (on new submission by Lighthouse)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Receive submission from Network                             │
│     - candidate_id                                              │
│     - job_id                                                    │
│     - submitted_at                                              │
│                                                                 │
│  2. Lookup Vincere IDs                                          │
│     - candidate.vincere_id                                      │
│     - job.external_id                                           │
│                                                                 │
│  3. IF both exist in Vincere:                                   │
│     │                                                           │
│     └─► POST /application to Vincere                            │
│         - candidate_id: vincere_id                              │
│         - job_id: external_id                                   │
│         - status: 'NEW'                                         │
│         - created_date: submitted_at (preserve!)                │
│                                                                 │
│  4. Store Vincere application_id on Network submission          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4. Network → Vincere Placement Sync

```
┌─────────────────────────────────────────────────────────────────┐
│  TRIGGER: Webhook (on placement confirmed by Lighthouse)        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Receive placement from Network                              │
│                                                                 │
│  2. Lookup Vincere IDs                                          │
│                                                                 │
│  3. POST /placement to Vincere                                  │
│     - All placement details                                     │
│     - Fee information                                           │
│                                                                 │
│  4. Update job status in Vincere if filled                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 5. Document Processing (Modified)

```
┌─────────────────────────────────────────────────────────────────┐
│  CURRENT: Vincere → CloudConvert → AI → Supabase vectors        │
│                                                                 │
│  MODIFIED: Add Network candidate link                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  After processing document:                                     │
│                                                                 │
│  1. Store in existing vector tables (keep working)              │
│     - lighthouse_candidates_certificates                        │
│     - lighthouse_candidates_references                          │
│     - lighthouse_candidates_cv                                  │
│                                                                 │
│  2. ALSO link to Network candidate                              │
│     - Lookup candidate by vincere_id                            │
│     - Create record in Network documents table                  │
│     - Store vector in Network candidate.embedding               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

---

## Vincere API Request Formats

### Authentication

```javascript
// Step 1: Get ID Token
const tokenResponse = await fetch('https://id.vincere.io/oauth2/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: '6fc2ac8a-982d-40f7-8d76-c4e987c6b858',
    grant_type: 'refresh_token',
    refresh_token: VINCERE_REFRESH_TOKEN,
  }),
});
const { id_token } = await tokenResponse.json();

// Step 2: Use in requests
const headers = {
  'accept': 'application/json',
  'id-token': id_token,
  'x-api-key': '432b3df0-1b0c-4dfa-9f78-73eec7de6867',
};
```

### Update Candidate Custom Fields

```javascript
// PATCH /api/v2/candidate/{id}/customfields
const updateCustomFields = async (candidateId, fields) => {
  const data = [];
  
  // For dropdown fields (field_values array)
  if (fields.smoker !== undefined) {
    data.push({
      element_value_groups: null,
      field_key: 'ce39bf25a1afb59679cd63988813e64d',
      field_values: [fields.smoker ? 1 : 2], // 1=Yes, 2=No
    });
  }
  
  // For text fields (field_value string)
  if (fields.tattooLocation) {
    data.push({
      element_value_groups: null,
      field_key: 'a833bdb7288a6f12384e9d1ec23a0579',
      field_value: fields.tattooLocation,
    });
  }
  
  // For date fields (date_value)
  if (fields.startDate) {
    data.push({
      element_value_groups: null,
      field_key: '03f76b1a428a834d5da30b705b01c574',
      date_value: new Date(fields.startDate).toISOString(),
    });
  }
  
  const response = await fetch(
    `https://lighthouse-careers.vincere.io/api/v2/candidate/${candidateId}/customfields`,
    {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    }
  );
  
  return response.json();
};
```

### Search Candidates

```javascript
// GET /api/v2/candidate/search/fl=id,name,first_name
const searchCandidates = async (email) => {
  const query = `primary_email:${email}#`;
  const response = await fetch(
    `https://lighthouse-careers.vincere.io/api/v2/candidate/search/fl=id,name,first_name?q=${encodeURIComponent(query)}`,
    { headers }
  );
  return response.json();
};
```

### Search Jobs by Industry

```javascript
// Filter yacht/villa jobs updated in last day
const searchJobs = async () => {
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
  const query = `(industry_id:28884# OR industry_id:28886#) AND last_update:[${oneDayAgo} TO NOW]#`;
  
  const response = await fetch(
    `https://lighthouse-careers.vincere.io/api/v2/position/search/fl=id,job_title,last_update,job_status,created_date?q=${encodeURIComponent(query)}&start=0&limit=50`,
    { headers }
  );
  return response.json();
};
```

### Create Application

```javascript
// POST /api/v2/application
const createApplication = async (candidateId, jobId) => {
  const now = new Date().toISOString();
  
  const response = await fetch(
    'https://lighthouse-careers.vincere.io/api/v2/application',
    {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_id: candidateId,
        job_id: jobId,
        stage: 'SHORTLISTED',
        application_stage_associated_date: now,
        shortlisted_stage_associated_date: now,
        creator_id: 28959,
      }),
    }
  );
  
  return response.json();
};
```

---

## Initial Migration Script

### Step 1: Export from Vincere

```javascript
// n8n workflow or script

async function exportVincereCandidates() {
  const candidates = [];
  let page = 1;
  
  while (true) {
    const response = await vincereAPI.get('/candidate', {
      params: {
        page,
        per_page: 100,
        // Filter for yacht industry
      }
    });
    
    if (response.data.length === 0) break;
    
    for (const candidate of response.data) {
      // Get custom fields
      const customFields = await vincereAPI.get(`/candidate/${candidate.id}/customfield`);
      
      candidates.push({
        ...candidate,
        custom_fields: customFields.data,
      });
    }
    
    page++;
  }
  
  return candidates;
}
```

### Step 2: Transform and Import

```javascript
// Field key constants (from your Vincere tenant)
const FIELD_KEYS = {
  SECOND_NATIONALITY: 'd863391eddef6865b5d78e13d6a688ed',
  SMOKER: 'ce39bf25a1afb59679cd63988813e64d',
  TATTOOS: '9c7677f6b79f526fe57b76558941b475',
  TATTOO_LOCATION: 'a833bdb7288a6f12384e9d1ec23a0579',
  MARITAL_STATUS: '768f3644fbf76cf6c18185238566f108',
  PARTNER_NAME: '4b954494016e2b840f6b1f14a835b332',
  PARTNER_POSITION: 'ee670a88fe0c4e2cf424aa6e1fbea5bd',
  COUPLE_POSITION: 'e322dfbcbb52e1d3f4a3407cfe0cdbba',
  SCHENGEN: '1b3980ec75cfc38c2a809f4308346b47',
  B1B2: 'f2ddc9e39b35108ac88539dc6963c4d9',
  ENG1: '888d240c45a4c239dc6626c025c805d1',
  STCW: 'c660a4158d8d11f2e2aa1f84db8a52f6',
  CONTRACT_TYPE: '68df45f3ddb75e93afa7b9f8d66c17bd',
  HIGHEST_LICENCE: '83f3f9dc58b5fc1d0b7d591fd82f001b',
  SECOND_LICENCE: '80429528339faa3362600dedfcb72d9d',
  YACHT_SIZE: '37c70d9ff937132692788d7b6fd85a8c',
  DESIRED_SALARY: '5d15d9dcdc2eea6ca016960b061e9261',
  YACHT_TYPE: '7763f7fceda588cc9c5298412dbe7ea7',
  START_DATE: '03f76b1a428a834d5da30b705b01c574',
  INTERVIEW_NOTES: 'e5b402a60252d0177afe8c5236b3f7b5',
  DESIRED_LOCATION: '9d00638dd03d9a54ba1ea66c48008bd0',
};

async function importToNetwork(vincereCandidates) {
  for (const vc of vincereCandidates) {
    // Get custom fields keyed by field_key
    const customFields = {};
    for (const cf of vc.custom_fields || []) {
      customFields[cf.key] = cf;
    }
    
    // Helper to get field value
    const getField = (key) => {
      const field = customFields[key];
      if (!field) return null;
      return field.field_value || field.date_value || field.field_values?.[0] || null;
    };
    
    // Helper for boolean fields (1=Yes, 2=No)
    const getBoolField = (key) => {
      const val = getField(key);
      return val === 1 ? true : (val === 2 ? false : null);
    };
    
    // Transform
    const networkCandidate = {
      vincere_id: vc.id.toString(),
      first_name: vc.first_name,
      last_name: vc.last_name,
      email: vc.email,
      phone: vc.phone,
      whatsapp: vc.mobile,
      date_of_birth: vc.date_of_birth,
      gender: vc.gender,
      nationality: vc.nationality,
      current_location: vc.current_location,
      
      // Position
      ...standardizePosition(vc.job_title),
      
      // Custom fields using field keys
      second_nationality: NATIONALITY_BY_ID[getField(FIELD_KEYS.SECOND_NATIONALITY)] || null,
      is_smoker: getBoolField(FIELD_KEYS.SMOKER),
      has_visible_tattoos: getBoolField(FIELD_KEYS.TATTOOS),
      tattoo_description: getField(FIELD_KEYS.TATTOO_LOCATION),
      marital_status: {1: 'single', 2: 'married', 3: 'in_relationship'}[getField(FIELD_KEYS.MARITAL_STATUS)] || null,
      partner_name: getField(FIELD_KEYS.PARTNER_NAME),
      partner_position: getField(FIELD_KEYS.PARTNER_POSITION),
      is_couple: getBoolField(FIELD_KEYS.COUPLE_POSITION),
      has_schengen: getBoolField(FIELD_KEYS.SCHENGEN),
      has_b1b2: getBoolField(FIELD_KEYS.B1B2),
      has_eng1: getBoolField(FIELD_KEYS.ENG1),
      has_stcw: getBoolField(FIELD_KEYS.STCW),
      highest_license: getField(FIELD_KEYS.HIGHEST_LICENCE),
      available_from: getField(FIELD_KEYS.START_DATE),
      
      // Parse ranges
      ...parseSalaryRange(getField(FIELD_KEYS.DESIRED_SALARY)),
      ...parseYachtSizeRange(getField(FIELD_KEYS.YACHT_SIZE)),
      
      // Arrays
      preferred_yacht_types: parseYachtTypes(getField(FIELD_KEYS.YACHT_TYPE)),
      preferred_contract_types: parseContractTypes(getField(FIELD_KEYS.CONTRACT_TYPE)),
      
      // Defaults
      verification_tier: 'basic',
      availability_status: 'looking',
      
      // Metadata
      created_at: vc.created_date,
      updated_at: vc.updated_date,
    };
    
    // Insert
    const { data, error } = await supabase
      .from('candidates')
      .upsert(networkCandidate, {
        onConflict: 'vincere_id',
      });
    
    if (error) {
      console.error(`Failed to import ${vc.email}:`, error);
      continue;
    }
    
    // Create Lighthouse agency relationship with interview notes
    const interviewNotes = getField(FIELD_KEYS.INTERVIEW_NOTES);
    await supabase.from('candidate_agency_relationships').upsert({
      candidate_id: data.id,
      agency_id: LIGHTHOUSE_ORG_ID,
      relationship_type: 'registered',
      interview_notes: interviewNotes,
    });
    
    // Generate embedding
    await fetch(`/api/candidates/${data.id}/embed`, { method: 'POST' });
  }
}

// Helper functions
function getCustomField(candidate, fieldName) {
  const field = candidate.custom_fields?.find(f => f.name === fieldName);
  return field?.value || null;
}

function parseSalaryRange(salaryString) {
  if (!salaryString) return {};
  
  // Handle formats like "€5000-€7000", "5000-7000", "5k-7k"
  const matches = salaryString.match(/(\d+)k?\s*[-–]\s*(\d+)k?/i);
  if (matches) {
    let min = parseInt(matches[1]);
    let max = parseInt(matches[2]);
    
    // Handle "5k" format
    if (min < 100) min *= 1000;
    if (max < 100) max *= 1000;
    
    return {
      desired_salary_min: min,
      desired_salary_max: max,
      salary_currency: 'EUR',
    };
  }
  
  return {};
}

function parseYachtSizeRange(sizeString) {
  if (!sizeString) return {};
  
  // Handle formats like "40m-60m", "40-60m", "50m+"
  const rangeMatch = sizeString.match(/(\d+)\s*m?\s*[-–]\s*(\d+)\s*m?/i);
  if (rangeMatch) {
    return {
      preferred_yacht_size_min: parseInt(rangeMatch[1]),
      preferred_yacht_size_max: parseInt(rangeMatch[2]),
    };
  }
  
  const minMatch = sizeString.match(/(\d+)\s*m?\s*\+/i);
  if (minMatch) {
    return {
      preferred_yacht_size_min: parseInt(minMatch[1]),
      preferred_yacht_size_max: null,
    };
  }
  
  return {};
}

function parseYachtTypes(typeString) {
  if (!typeString) return [];
  
  const types = [];
  const normalized = typeString.toLowerCase();
  
  if (normalized.includes('motor')) types.push('motor');
  if (normalized.includes('sail')) types.push('sailing');
  if (normalized.includes('catamaran') || normalized.includes('cat')) types.push('catamaran');
  if (normalized.includes('explorer')) types.push('explorer');
  
  return types.length ? types : ['motor', 'sailing']; // Default: both
}

function parseContractTypes(contractString) {
  if (!contractString) return [];
  
  const types = [];
  const normalized = contractString.toLowerCase();
  
  if (normalized.includes('perm')) types.push('permanent');
  if (normalized.includes('rotat')) types.push('rotational');
  if (normalized.includes('season')) types.push('seasonal');
  if (normalized.includes('temp')) types.push('temporary');
  
  return types;
}
```

---

## Verification Tier Assignment

During migration, assign verification tiers based on existing data:

```javascript
function determineVerificationTier(candidate, customFields) {
  let tier = 'basic';
  
  // Has been interviewed = at least identity
  if (customFields['Interview Notes']) {
    tier = 'identity';
  }
  
  // Has certification check notes = verified
  if (customFields['Certification Check Notes']) {
    tier = 'verified';
  }
  
  // Has multiple placements = premium (trust earned)
  // Would need to check placements count
  
  return tier;
}
```

---

## API Endpoints for Sync

### Webhook Endpoints (Network → Vincere)

```
POST /api/webhooks/vincere/submission
POST /api/webhooks/vincere/placement
POST /api/webhooks/vincere/candidate
```

### Sync Trigger Endpoints

```
POST /api/sync/vincere/candidates  - Manual trigger
POST /api/sync/vincere/jobs        - Manual trigger
GET  /api/sync/vincere/status      - Check last sync
```

---

## Environment Variables

```bash
# Vincere API (from your n8n workflows)
VINCERE_API_URL=https://lighthouse-careers.vincere.io/api/v2
VINCERE_CLIENT_ID=6fc2ac8a-982d-40f7-8d76-c4e987c6b858
VINCERE_X_API_KEY=432b3df0-1b0c-4dfa-9f78-73eec7de6867
VINCERE_AUTH_URL=https://id.vincere.io/oauth2/token

# Sync settings
VINCERE_SYNC_ENABLED=true
VINCERE_SYNC_INTERVAL_HOURS=2
VINCERE_SYNC_BATCH_SIZE=100

# Lighthouse org ID (for agency relationships)
LIGHTHOUSE_ORG_ID=00000000-0000-0000-0000-000000000001

# System IDs
VINCERE_CANDIDATE_SOURCE_ID=29105
VINCERE_DEFAULT_CREATOR_ID=28959
VINCERE_INDUSTRY_YACHT=28884
VINCERE_INDUSTRY_VILLA=28886
```

---

## Nationality Value Mapping

Vincere uses numeric IDs for nationalities. Here's the complete mapping:

```javascript
const NATIONALITY_MAP = {
  'Afghan': 1, 'Albanian': 2, 'Algerian': 3, 'American': 4, 'Andorran': 5,
  'Angolan': 6, 'Antiguan': 7, 'Argentinean': 8, 'Armenian': 9, 'Australian': 10,
  'Austrian': 11, 'Azerbaijani': 12, 'Bahamian': 13, 'Bahraini': 14, 'Bangladeshi': 15,
  'Barbadian': 16, 'Barbudans': 17, 'Batswana': 18, 'Belarusian': 19, 'Belgian': 20,
  'Belizean': 21, 'Beninese': 22, 'Bhutanese': 23, 'Bolivian': 24, 
  'Bosnian or Herzegovinian': 25, 'Brazilian': 26, 'British': 27, 'Bruneian': 28,
  'Bulgarian': 29, 'Burkinan': 30, 'Burmese': 31, 'Burundian': 32, 'Cambodian': 33,
  'Cameroonian': 34, 'Canadian': 35, 'Cabo Verdean': 36, 'Central African': 37,
  'Chadian': 38, 'Chilean': 39, 'Chinese': 40, 'Colombian': 41, 'Comoran': 42,
  'Congolese (Congo)': 43, 'Costa Rican': 44, 'Croatian': 45, 'Cuban': 46,
  'Cypriot': 47, 'Czech': 48, 'Danish': 49, 'Djiboutian': 50, 'Dominican': 51,
  'Dutch': 52, 'Ecuadorean': 53, 'Egyptian': 54, 'Emirati': 55, 'Estonian': 56,
  'Ethiopian': 57, 'Fijian': 58, 'Filipino': 59, 'Finnish': 60, 'French': 61,
  'Gabonese': 62, 'Gambian': 63, 'Georgian': 64, 'German': 65, 'Greek': 66,
  'Grenadian': 67, 'Guatemalan': 68, 'Guinea-Bissauan': 69, 'Guinean': 70,
  'Guyanese': 71, 'Haitian': 72, 'Herzegovinian': 73, 'Honduran': 74,
  'Hungarian': 75, 'Icelandic': 76, 'Indian': 77, 'Indonesian': 78, 'Iranian': 79,
  'Iraqi': 80, 'Irish': 81, 'Israeli': 82, 'Italian': 83, 'Ivorian': 84,
  'Jamaican': 85, 'Japanese': 86, 'Jordanian': 87, 'Kazakhstani': 88, 'Kenyan': 89,
  'Kiribati': 90, 'Kuwaiti': 91, 'Kyrgyzstani': 92, 'Lao': 93, 'Latvian': 94,
  'Lebanese': 95, 'Liberian': 96, 'Libyan': 97, 'Liechtenstein': 98, 'Lithuanian': 99,
  'Luxembourgish': 100, 'Macedonian': 101, 'Malagasy': 102, 'Malawian': 103,
  'Malaysian': 104, 'Maldivian': 105, 'Malian': 106, 'Maltese': 107,
  'Marshallese': 108, 'Mauritanian': 109, 'Mauritian': 110, 'Mexican': 111,
  'Micronesian': 112, 'Moldovan': 113, 'Monacan': 114, 'Mongolian': 115,
  'Moroccan': 116, 'Mozambican': 117, 'Namibian': 118, 'Nepalese': 119,
  'New Zealander': 120, 'Nicaraguan': 121, 'Nigerian': 122, 'North Korean': 123,
  'Northern Irish': 124, 'Norwegian': 125, 'Omani': 126, 'Pakistani': 127,
  'Palauan': 128, 'Panamanian': 129, 'Papua New Guinean': 130, 'Paraguayan': 131,
  'Peruvian': 132, 'Polish': 133, 'Portuguese': 134, 'Qatari': 135, 'Romanian': 136,
  'Russian': 137, 'Rwandan': 138, 'Saint Lucian': 139, 'Salvadoran': 140,
  'Samoan': 141, 'San Marinese': 142, 'Saudi': 143, 'Scottish': 144,
  'Senegalese': 145, 'Serbian': 146, 'Seychellois': 147, 'Sierra Leonean': 148,
  'Singaporean': 149, 'Slovakian': 150, 'Slovenian': 151, 'Solomon Islander': 152,
  'Somali': 153, 'South African': 154, 'South Korean': 155, 'Spanish': 156,
  'Sri Lankan': 157, 'Swazi': 158, 'Swedish': 159, 'Swiss': 160, 'Syrian': 161,
  'Taiwanese': 162, 'Tanzanian': 163, 'Thai': 164, 'Togolese': 165, 'Tongan': 166,
  'Trinidadian or Tobagonian': 167, 'Tunisian': 168, 'Turkish': 169,
  'Tuvaluan': 170, 'Ugandan': 171, 'Ukrainian': 172, 'Uruguayan': 173,
  'Uzbekistani': 174, 'Venezuelan': 175, 'Vietnamese': 176, 'Welsh': 177,
  'Zambian': 178, 'Zimbabwean': 179
};

// Reverse lookup
const NATIONALITY_BY_ID = Object.fromEntries(
  Object.entries(NATIONALITY_MAP).map(([k, v]) => [v, k])
);
```

---

## Migration Checklist

### Pre-Migration

- [ ] Backup Vincere data
- [ ] Run Network schema migrations
- [ ] Test API connections
- [ ] Set up n8n workflows (disabled)

### Migration Execution

- [ ] Run candidate import (expect ~2-4 hours for 5000+ candidates)
- [ ] Run company import
- [ ] Run job import
- [ ] Run application/submission import
- [ ] Run placement import
- [ ] Generate embeddings (batch, overnight)

### Post-Migration

- [ ] Verify record counts match
- [ ] Spot check 50 random candidates
- [ ] Test search/matching
- [ ] Enable n8n sync workflows
- [ ] Monitor for sync errors

### Transition Period (2-4 weeks)

- [ ] Both systems active
- [ ] All changes in Vincere sync to Network
- [ ] Submissions created in both
- [ ] Monitor discrepancies

### Cutover

- [ ] Network becomes primary
- [ ] Vincere becomes backup/sync target
- [ ] Disable Bubble candidate portal
- [ ] Redirect to Network portal

---

## Document Version

- **Version**: 1.0
- **Last Updated**: November 2024
- **Related**: SETUP.md, BUSINESS_PLAN.md
