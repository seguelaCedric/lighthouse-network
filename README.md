# LIGHTHOUSE CREW NETWORK

> The professional infrastructure for yacht & villa crew recruitment

## 🎯 Mission

Make quality win over speed. Make agencies essential. Be the AI-powered rails that the entire yacht recruitment industry runs on.

---

## 📊 Business Model

### Revenue Streams

| Stream | Target | Pricing | Year 1 Projection |
|--------|--------|---------|-------------------|
| **Lighthouse Agency** | Existing clients | €4,000-6,000/placement | €800,000 |
| **Platform Fees** | All network placements | 10% of placement fee | €320,000 |
| **Agency Subscriptions** | Partner agencies | €199-499/month | €100,000 |
| **Client Subscriptions** | Boats, management cos | €79-149/month | €150,000 |
| **Premium Services** | Verification, background checks | €75-200/each | €100,000 |
| **Total Year 1** | | | **€1,470,000** |

### Value Proposition by User Type

**For Candidates (Free)**
- Professional profile with verification tiers
- Access to quality jobs (no scams)
- Career tracking and progression
- Agency advocacy when needed

**For Clients (Boats/Owners)**
- Organized job posting and submissions
- AI-matched candidates
- Clear "first submission" timestamps
- Access to verified professionals

**For Partner Agencies**
- AI-powered matching tools
- Access to network jobs they wouldn't see
- Collaboration exchange for overflow
- Proof of first submission

**For Lighthouse (Your Team)**
- 10x recruiter productivity
- Brief → Shortlist in 90 seconds
- Proactive client intelligence
- Platform revenue on top of placements

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         LIGHTHOUSE CREW NETWORK                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   FRONTENDS (Next.js)                                                │
│   ├── apps/web           → Main platform (all user types)            │
│   ├── apps/candidate     → Mobile-optimized candidate app            │
│   └── apps/marketing     → Public site, job board, SEO               │
│                                                                      │
│   BACKEND (Supabase)                                                 │
│   ├── PostgreSQL         → Core data                                 │
│   ├── pgvector           → Semantic search                           │
│   ├── Auth               → User authentication                       │
│   ├── Storage            → Files (CVs, certificates)                 │
│   ├── Realtime           → Live updates                              │
│   └── Edge Functions     → Serverless compute                        │
│                                                                      │
│   AI LAYER                                                           │
│   ├── Claude             → Brief parsing, reasoning, summaries       │
│   ├── OpenAI Embeddings  → Vector generation                         │
│   └── Vapi               → Voice AI reference checks                 │
│                                                                      │
│   INTEGRATIONS                                                       │
│   ├── Vincere            → Lighthouse ATS sync                       │
│   ├── Twilio             → WhatsApp, SMS                             │
│   ├── Resend             → Email                                     │
│   └── Stripe             → Billing                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js 14 (App Router) | SEO, speed, React ecosystem |
| Styling | Tailwind + Shadcn/ui | Rapid development, consistency |
| State | React Query + Zustand | Server state + client state |
| Backend | Supabase | All-in-one: DB, auth, storage, realtime |
| Database | PostgreSQL + pgvector | Relational + vector search |
| AI | Vercel AI SDK + Claude | Native streaming, unified API |
| Embeddings | OpenAI text-embedding-3-small | Cost-effective, good quality |
| Voice AI | Vapi | Reference check automation |
| Email | Resend | Developer-friendly, reliable |
| Messaging | Twilio | WhatsApp + SMS |
| Payments | Stripe | Subscriptions, invoicing |
| Hosting | Vercel | Next.js native, edge |
| Monitoring | Sentry + Posthog | Errors + analytics |

---

## 📁 Project Structure

```
lighthouse-network/
├── apps/
│   ├── web/                    # Main platform application
│   │   ├── app/
│   │   │   ├── (auth)/         # Login, signup, password reset
│   │   │   ├── (marketing)/    # Public pages
│   │   │   ├── (platform)/     # Authenticated platform
│   │   │   │   ├── dashboard/
│   │   │   │   ├── jobs/
│   │   │   │   ├── candidates/
│   │   │   │   ├── submissions/
│   │   │   │   ├── placements/
│   │   │   │   └── settings/
│   │   │   ├── api/            # API routes
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/             # Base components (shadcn)
│   │   │   ├── forms/          # Form components
│   │   │   ├── tables/         # Data tables
│   │   │   └── features/       # Feature-specific components
│   │   └── lib/
│   │       ├── supabase/
│   │       ├── ai/
│   │       └── utils/
│   │
│   └── marketing/              # Public website (later phase)
│
├── packages/
│   ├── database/               # Shared database types & queries
│   │   ├── types/              # Generated TypeScript types
│   │   ├── queries/            # Reusable query functions
│   │   └── migrations/         # SQL migrations
│   │
│   ├── ai/                     # AI/ML functionality
│   │   ├── brief-parser/       # Parse briefs into requirements
│   │   ├── matcher/            # Candidate-job matching
│   │   ├── embeddings/         # Vector generation
│   │   └── prompts/            # Prompt templates
│   │
│   ├── integrations/           # External service integrations
│   │   ├── vincere/            # Vincere ATS sync
│   │   ├── twilio/             # WhatsApp, SMS
│   │   ├── resend/             # Email
│   │   └── vapi/               # Voice AI
│   │
│   └── shared/                 # Shared utilities
│       ├── constants/
│       ├── validators/
│       └── utils/
│
├── supabase/
│   ├── migrations/             # Database migrations
│   ├── functions/              # Edge Functions
│   │   ├── parse-brief/
│   │   ├── match-candidates/
│   │   ├── generate-embedding/
│   │   ├── whatsapp-webhook/
│   │   └── sync-vincere/
│   └── seed.sql
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── business-rules.md
│   └── deployment.md
│
├── turbo.json                  # Turborepo config
├── package.json
└── README.md
```

---

## 🔑 Core Features

### Phase 1: Speed Engine (MVP)

#### 1.1 Brief Intake
**Goal**: Accept job briefs from any channel, parse into structured requirements

```
Channels:
├── WhatsApp → AI parses message, asks clarifying questions
├── Email    → AI extracts requirements from email/attachments
├── Portal   → Structured form with AI assist
└── Phone    → Recruiter enters, voice-to-text assist

Output: Structured Brief
{
  position: "Chief Stewardess",
  vessel: { type: "Motor", size_min: 45 },
  contract_type: "permanent",
  start_date: "2025-02-01",
  requirements: {
    experience_years_min: 5,
    certifications: ["STCW", "ENG1"],
    languages: ["English", "French"],
    non_smoker: true
  },
  salary: { min: 5500, max: 6500, currency: "EUR" }
}
```

#### 1.2 AI Matching
**Goal**: Find and rank candidates in seconds, not hours

```
Input: Structured Brief
Process:
├── Generate embedding from brief
├── Vector search against candidate embeddings
├── Filter by hard requirements (certs, availability)
├── AI re-rank with reasoning
└── Return top candidates with explanations

Output: Ranked Shortlist
[
  {
    candidate: { id, name, position, ... },
    match_score: 94,
    reasoning: "8 years Chief Stew experience on similar vessels. 
                Non-smoker, STCW current. Available Feb 1.",
    strengths: ["Experience matches", "Availability perfect"],
    concerns: ["No French (preferred, not required)"]
  },
  ...
]
```

#### 1.3 Recruiter Dashboard
**Goal**: Review AI shortlists, approve, send to clients in minutes

```
Dashboard Views:
├── Inbox         → New briefs, AI shortlists ready for review
├── Active Jobs   → Jobs being worked on
├── Submissions   → Track candidate submissions
├── Placements    → Won placements, fee tracking
└── Candidates    → Candidate pool management
```

#### 1.4 Client Presentation
**Goal**: Professional shortlist delivery

```
Options:
├── Email         → Branded PDF/HTML with candidate summaries
├── Portal        → Client logs in, views submissions
└── WhatsApp      → Quick summary with portal link
```

### Phase 2: Trust Infrastructure

#### 2.1 Submission Timestamps
**Goal**: Immutable proof of "first CV wins"

```
When agency submits candidate:
├── Generate SHA256 hash of (job_id + candidate_id + timestamp)
├── Store immutably (no updates to timestamp)
├── Flag if candidate already submitted by another agency
└── Provide audit trail for disputes

Dispute Resolution:
├── Both parties see blockchain-like submission record
├── Clear evidence of who submitted first
└── Platform decision is final
```

#### 2.2 Verification Tiers
**Goal**: Quality certification that differentiates professionals

```
Tiers:
├── Basic     → Self-registered, email verified
├── Identity  → ID document verified
├── Verified  → ID + certs + basic reference check
└── Premium   → Full vetting: interview, deep references, background

Benefits by tier:
├── Basic     → Can apply to jobs
├── Identity  → Appears in search results
├── Verified  → Priority in matching, visible to clients
└── Premium   → Featured listings, agency recommendation
```

#### 2.3 Reference Verification
**Goal**: Automated, trustworthy reference checks

```
Process:
├── Candidate provides referee details
├── System sends reference request (email/SMS)
├── Referee completes online form OR
├── Vapi calls referee with AI interview
├── AI summarizes reference into structured format
└── Reference linked to candidate profile

Output: Verified Reference
{
  referee: "Captain John Smith",
  relationship: "Direct supervisor",
  vessel: "M/Y Excellence (58m)",
  period: "2021-2023",
  rating: 5,
  would_rehire: true,
  summary: "Exceptional Chief Stew. Professional, detail-oriented...",
  verified_at: "2024-01-15"
}
```

### Phase 3: Collaboration Network

#### 3.1 Job Exchange
**Goal**: Network jobs visible to all participating agencies

```
Visibility Rules:
├── Private   → Only creating agency sees job
├── Network   → All partner agencies can submit
└── Public    → Visible on public job board

Fee Split (Network Jobs):
├── Client's agency fee: €4,000
├── Platform fee (10%): €400
├── Remaining: €3,600
│   ├── If same agency has client + candidate: €3,600
│   └── If collaboration: €1,800 each (client agency + candidate agency)
```

#### 3.2 Candidate Exchange
**Goal**: Agencies share candidates they can't place

```
Options:
├── Open Pool    → Verified candidates visible to all agencies
├── Restricted   → Only certain agencies can see
└── Exclusive    → Locked to one agency for X days

Revenue:
├── Agency A has candidate, Agency B has job
├── Agency B submits (with A's candidate)
├── Placement fee: €4,000
│   ├── Agency B (has client): €1,800
│   ├── Agency A (has candidate): €1,800
│   └── Platform: €400
```

#### 3.3 Collaboration Requests
**Goal**: Structured process for inter-agency collaboration

```
Request Types:
├── "Can I submit your candidate to my job?"
├── "Can you submit to my client? I'll split fee."
└── "Do you have anyone for this role?"

Process:
├── Agency A sends request
├── Agency B reviews (7 day expiry)
├── If approved: terms locked in
├── If rejected: no hard feelings
└── Platform tracks all for reporting
```

### Phase 4: Client Experience

#### 4.1 Client Portal
**Goal**: Clients post jobs, view submissions, track progress

```
Features:
├── Post Job       → Form or paste description
├── View Jobs      → Status, submissions count
├── Submissions    → Ranked candidates from agencies
├── Interviews     → Schedule, track, feedback
├── Placements     → History, upcoming contract ends
└── Analytics      → Time to hire, cost per hire
```

#### 4.2 Proactive Intelligence
**Goal**: Anticipate client needs before they ask

```
Alerts:
├── "Contract ending in 6 weeks for [position] on [vessel]"
├── "[Top candidate] is now available, matches your past hires"
├── "Market update: [position] salaries up 8% this quarter"
└── "3 candidates you liked last year are available"

Automation:
├── Track all contract end dates
├── Monitor candidate availability changes
├── Match against client preferences
└── Trigger outreach (AI-drafted, human-approved)
```

### Phase 5: Candidate Experience

#### 5.1 Candidate Portal/App
**Goal**: Seamless profile management, job discovery

```
Features:
├── Profile        → Build once, always current
├── Availability   → One-tap status update
├── Jobs           → Matched opportunities
├── Applications   → Track submissions (anonymized agencies)
├── Documents      → CV, certs, references
└── Career         → Placement history, growth tracking
```

#### 5.2 WhatsApp Integration
**Goal**: Candidates update status without app/portal

```
Interactions:
├── Weekly: "Still available? Reply YES/NO"
├── Match: "New job matches your profile. Interested?"
├── Update: "Contract ending soon. Want us to look?"
└── Response: "Thanks! We'll be in touch."
```

---

## 📋 Business Rules

### Submission Rules

```yaml
# First submission wins
when: agency_submits_candidate
rules:
  - candidate_can_only_be_submitted_once_per_job_per_agency: true
  - if_candidate_already_submitted_by_other_agency:
      action: allow_submission
      flag: duplicate_candidate
      notify: submitting_agency
  - timestamp_is_immutable: true
  - hash_generated_for_audit: true

# Who gets the placement?
when: placement_made
rules:
  - first_submitting_agency_has_rights: true
  - unless:
      - candidate_withdrew_from_first_agency
      - first_agency_inactive_for_30_days
      - client_explicitly_requests_different_agency
```

### Fee Rules

```yaml
# Standard placement
when: placement_type == "standard"
calculate:
  total_fee: job.fee_amount  # e.g., €4,000
  platform_fee: total_fee * 0.10  # €400
  agency_fee: total_fee - platform_fee  # €3,600

# Collaboration placement
when: placement_type == "collaboration"
calculate:
  total_fee: job.fee_amount  # e.g., €4,000
  platform_fee: total_fee * 0.10  # €400
  remaining: total_fee - platform_fee  # €3,600
  client_agency_fee: remaining * 0.50  # €1,800
  candidate_agency_fee: remaining * 0.50  # €1,800
  
# Network jobs (client posts directly)
when: job.source == "client_direct"
calculate:
  total_fee: job.fee_amount  # e.g., €3,000 (lower for self-service)
  platform_fee: total_fee * 0.15  # €450 (higher cut)
  agency_fee: total_fee - platform_fee  # €2,550
```

### Visibility Rules

```yaml
# Candidate visibility
candidates:
  basic_tier:
    visible_to: [registered_agency_only]
    searchable: false
  
  verified_tier:
    visible_to: [all_network_agencies]
    searchable: true
    contact_info: redacted
    
  premium_tier:
    visible_to: [all_network_agencies, clients_via_shortlist]
    searchable: true
    featured: true
    full_profile: true
    contact_info: via_platform_only

# Job visibility
jobs:
  private:
    visible_to: [creating_agency_only]
    
  network:
    visible_to: [all_network_agencies]
    submissions: [any_network_agency]
    
  public:
    visible_to: [everyone]
    applications: [via_agency_only]  # Even public jobs go through agencies
```

### Anti-Cannibalization Rules

```yaml
# Force agency placement for senior roles
senior_positions:
  - Captain
  - Chief Officer
  - Chief Engineer
  - Chief Stewardess
  - Head Chef
  
when: job.position in senior_positions OR job.salary > 7000
rules:
  - self_service_disabled: true
  - agency_consultation_required: true
  - message: "For senior positions, we recommend our Agency Placement 
              service to ensure you get the best candidates with full vetting."

# Lighthouse advantage
lighthouse_benefits:
  - priority_matching: true  # Our candidates matched first
  - premium_verifications: true  # We do the deep vetting
  - proactive_intelligence: true  # We know before others
  - relationship_data: true  # We know what clients really want
```

---

## 🗓️ Implementation Roadmap

### Month 1-2: Foundation

**Week 1-2: Setup**
- [ ] Initialize monorepo (Turborepo)
- [ ] Setup Supabase project
- [ ] Run database migrations
- [ ] Setup Next.js app with auth
- [ ] Basic UI shell with navigation

**Week 3-4: Core Data**
- [ ] Organization management (Lighthouse first)
- [ ] User management and roles
- [ ] Candidate CRUD
- [ ] Job CRUD
- [ ] Basic submission flow

**Week 5-6: AI Integration**
- [ ] Brief parsing with Claude
- [ ] Embedding generation pipeline
- [ ] Vector search setup
- [ ] Basic candidate matching

**Week 7-8: Recruiter MVP**
- [ ] Recruiter dashboard
- [ ] Brief inbox
- [ ] AI shortlist review
- [ ] Basic client presentation (email)

### Month 3-4: Trust & Quality

**Week 9-10: Submissions**
- [ ] Immutable timestamp system
- [ ] Duplicate detection
- [ ] Submission tracking
- [ ] Status workflow

**Week 11-12: Verification**
- [ ] Verification tier system
- [ ] Certification management
- [ ] Basic reference collection
- [ ] Document storage

**Week 13-14: Client Portal**
- [ ] Client onboarding
- [ ] Job posting form
- [ ] Submission viewing
- [ ] Basic messaging

**Week 15-16: Integrations**
- [ ] WhatsApp brief intake
- [ ] Email parsing
- [ ] Vincere sync (Lighthouse)
- [ ] Basic notifications

### Month 5-6: Network

**Week 17-18: Multi-Agency**
- [ ] Agency onboarding flow
- [ ] Network job visibility
- [ ] Cross-agency submissions
- [ ] Fee tracking

**Week 19-20: Collaboration**
- [ ] Collaboration requests
- [ ] Fee split calculations
- [ ] Candidate exchange
- [ ] Agency dashboard

**Week 21-22: Billing**
- [ ] Stripe integration
- [ ] Subscription management
- [ ] Invoice generation
- [ ] Platform fee collection

**Week 23-24: Polish**
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Onboarding flows
- [ ] Documentation

### Month 7+: Growth

- Voice AI reference checks
- Advanced analytics
- Public job board
- Mobile app
- API for integrations
- International expansion

---

## 🔌 API Design

### REST Endpoints

```yaml
# Organizations
GET    /api/organizations
POST   /api/organizations
GET    /api/organizations/:id
PATCH  /api/organizations/:id

# Users
GET    /api/users/me
PATCH  /api/users/me
GET    /api/organizations/:org_id/users

# Candidates
GET    /api/candidates
POST   /api/candidates
GET    /api/candidates/:id
PATCH  /api/candidates/:id
POST   /api/candidates/:id/verify
GET    /api/candidates/search?q=...

# Jobs
GET    /api/jobs
POST   /api/jobs
GET    /api/jobs/:id
PATCH  /api/jobs/:id
POST   /api/jobs/:id/publish
GET    /api/jobs/:id/matches

# Submissions
GET    /api/jobs/:id/submissions
POST   /api/jobs/:id/submissions
GET    /api/submissions/:id
PATCH  /api/submissions/:id/status

# Briefs
POST   /api/briefs
GET    /api/briefs/:id
POST   /api/briefs/:id/parse
POST   /api/briefs/:id/convert

# Matching
POST   /api/match/candidates
POST   /api/match/jobs

# Webhooks
POST   /api/webhooks/whatsapp
POST   /api/webhooks/email
POST   /api/webhooks/stripe
```

### Realtime Subscriptions

```typescript
// Subscribe to new submissions on a job
supabase
  .channel('job-submissions')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'submissions',
    filter: `job_id=eq.${jobId}`
  }, handleNewSubmission)
  .subscribe()

// Subscribe to brief inbox
supabase
  .channel('agency-briefs')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'briefs',
    filter: `assigned_agency_id=eq.${agencyId}`
  }, handleNewBrief)
  .subscribe()
```

---

## 🔄 Vincere Sync Strategy

### What Syncs

```yaml
# FROM Vincere TO Lighthouse Network
sync_to_network:
  candidates:
    - when: candidate.industry IN ['yacht', 'villa']
    - fields: [basic_info, certifications, work_history]
    - NOT synced: internal_notes, agency_rating
    
  jobs:
    - when: job.source = 'lighthouse_client'
    - when: job.visibility = 'network'
    - fields: [all]

# FROM Lighthouse Network TO Vincere
sync_to_vincere:
  submissions:
    - when: submission.agency = 'lighthouse'
    - creates: vincere.application
    
  placements:
    - when: placement.agency = 'lighthouse'
    - creates: vincere.placement
    
  candidates:
    - when: candidate.registered_via = 'network'
    - when: lighthouse.has_relationship = true
```

### Sync Implementation

```typescript
// Edge Function: sync-vincere
const syncCandidateToVincere = async (candidate: Candidate) => {
  // Only sync if Lighthouse has relationship
  const relationship = await getRelationship(candidate.id, LIGHTHOUSE_ORG_ID);
  if (!relationship) return;
  
  // Check if exists in Vincere
  const vincereCandidate = await vincere.searchByEmail(candidate.email);
  
  if (vincereCandidate) {
    // Update existing
    await vincere.updateCandidate(vincereCandidate.id, mapToVincere(candidate));
  } else {
    // Create new
    const newId = await vincere.createCandidate(mapToVincere(candidate));
    // Store Vincere ID
    await updateRelationship(candidate.id, LIGHTHOUSE_ORG_ID, { 
      agency_candidate_id: newId 
    });
  }
};
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase account
- OpenRouter API key (for Claude)
- OpenAI API key (for embeddings)
- Twilio account (for WhatsApp)

### Local Development

```bash
# Clone repository
git clone https://github.com/lighthouse/crew-network.git
cd crew-network

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Start Supabase locally
supabase start

# Run migrations
supabase db push

# Start development server
pnpm dev
```

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI (Vercel AI SDK uses these directly)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Integrations
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=

RESEND_API_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Vincere (Lighthouse only)
VINCERE_API_KEY=
VINCERE_CLIENT_ID=
VINCERE_REFRESH_TOKEN=
```

---

## 📈 Success Metrics

### North Star
**Network Placements Per Month** - Total successful placements across all agencies

### Supporting Metrics

| Metric | Target M1 | Target M6 | Target M12 |
|--------|-----------|-----------|------------|
| Active Agencies | 1 (Lighthouse) | 15 | 50 |
| Active Clients | 50 | 200 | 500 |
| Registered Candidates | 1,000 | 5,000 | 15,000 |
| Verified Candidates | 200 | 1,500 | 5,000 |
| Monthly Placements | 20 | 80 | 200 |
| Brief → Shortlist Time | <4 hours | <1 hour | <15 min |
| Recruiter Productivity | 1x | 2x | 4x |

---

## 🔒 Security & Compliance

### Data Protection
- All PII encrypted at rest
- GDPR compliant (EU data residency available)
- Candidate consent management
- Right to deletion workflow

### Access Control
- Row-level security (RLS) on all tables
- Role-based permissions
- Audit logging for sensitive operations
- Session management

### Financial
- PCI-DSS compliant payments (via Stripe)
- Invoice records retained 7 years
- Fee calculations auditable

---

## 📞 Support

- **Technical Issues**: tech@lighthouse-careers.com
- **Agency Onboarding**: partners@lighthouse-careers.com
- **General Inquiries**: info@lighthouse-careers.com

---

## License

Proprietary - Lighthouse Careers © 2024
