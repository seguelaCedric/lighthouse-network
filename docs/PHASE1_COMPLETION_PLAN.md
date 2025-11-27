# Phase 1 Completion Plan

## Current State Assessment

### What's DONE
- Monorepo setup (Turborepo + pnpm)
- Database schema (5 migrations, production-ready)
- AI Brief Parser (fully functional)
- AI Candidate Matching Engine (4-stage pipeline)
- 22 API routes (complete with validation)
- 28 UI components (shadcn/ui)
- Dashboard page with real data
- Briefs list page with filtering
- Job match results page (fully built)

### What's MISSING for Phase 1 Completion
1. Brief detail page (`/briefs/[id]`) - doesn't exist
2. Brief → Job conversion UI flow
3. Candidate profile page (`/candidates/[id]`) - scaffolded only
4. Candidate search page - partial
5. Job detail page (`/jobs/[id]`) - scaffolded only
6. WhatsApp integration (Twilio)
7. Email integration (Resend)
8. Submission workflow UI

---

## Implementation Plan

### Sprint A: Core Workflow Pages (Priority: Critical)

#### A1. Brief Detail Page
**File**: `apps/web/app/briefs/[id]/page.tsx`

**Requirements**:
- Display raw brief content
- Show parsed data (if parsed)
- Display confidence score with visual indicator
- Show ambiguities/clarification needs
- Actions: Parse, Convert to Job, Assign, Archive
- Status workflow indicator

**API Dependencies**:
- `GET /api/briefs/[id]` ✅ exists
- `POST /api/briefs/[id]/parse` ✅ exists
- `POST /api/briefs/[id]/convert` ✅ exists

**Estimated complexity**: Medium

---

#### A2. Brief → Job Conversion Flow
**File**: `apps/web/app/briefs/[id]/convert/page.tsx`

**Requirements**:
- Pre-filled form from parsed brief data
- Editable fields for all job properties
- Client selection (or create new)
- Vessel information
- Position, salary, requirements
- Review & confirm step
- Success → redirect to job detail

**API Dependencies**:
- `POST /api/briefs/[id]/convert` ✅ exists
- `GET /api/clients` ✅ exists

**Estimated complexity**: Medium-High

---

#### A3. Job Detail Page
**File**: `apps/web/app/jobs/[id]/page.tsx`

**Requirements**:
- Job header with status, vessel, position
- Requirements section (certs, experience, languages)
- Compensation & contract details
- "Run AI Match" button → links to `/jobs/match?jobId=X`
- Applications/shortlist section
- Activity timeline
- Edit job action

**API Dependencies**:
- `GET /api/jobs/[id]` ✅ exists
- `GET /api/jobs/[id]/applications` ✅ exists

**Estimated complexity**: Medium

---

#### A4. Candidate Profile Page
**File**: `apps/web/app/candidates/[id]/page.tsx`

**Requirements**:
- Photo, name, verification badge
- Contact info (phone, email, WhatsApp)
- Primary position & experience
- Certifications list with expiry dates
- Work history
- References section
- Documents list
- Availability status with dates
- Quick actions: Add to shortlist, Contact, Edit

**API Dependencies**:
- `GET /api/candidates/[id]` ✅ exists
- `GET /api/candidates/[id]/certifications` ✅ exists
- `GET /api/candidates/[id]/references` ✅ exists

**Estimated complexity**: Medium

---

#### A5. Candidate Search Page
**File**: `apps/web/app/candidates/search/page.tsx`

**Requirements**:
- Search by name, position, location
- Filters: availability, verification tier, certifications
- Results grid/list view
- Quick profile preview
- Bulk actions: Add to shortlist

**API Dependencies**:
- `GET /api/candidates` ✅ exists (has filtering)

**Estimated complexity**: Medium

---

### Sprint B: Communication Layer (Priority: High)

#### B1. WhatsApp Integration (Twilio)
**Files to create**:
- `apps/web/lib/twilio/client.ts` - Twilio SDK wrapper
- `apps/web/lib/twilio/whatsapp.ts` - WhatsApp message functions
- `apps/web/app/api/webhooks/twilio/route.ts` - Incoming message webhook
- `apps/web/app/api/messages/whatsapp/route.ts` - Send message API

**Requirements**:
- Send WhatsApp messages to clients/candidates
- Receive incoming messages via webhook
- Parse incoming briefs from WhatsApp
- Store communication history
- Link messages to briefs/candidates

**Environment variables needed**:
```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=
```

**Database**: May need `communications` table (or use existing `briefs.source`)

**Estimated complexity**: High

---

#### B2. Email Integration (Resend)
**Files to create**:
- `apps/web/lib/email/client.ts` - Resend client
- `apps/web/lib/email/templates/` - Email templates
- `apps/web/app/api/webhooks/email/route.ts` - Inbound email webhook

**Requirements**:
- Send transactional emails (submission, status updates)
- Email templates: Brief received, Candidate shortlisted, Interview scheduled
- Inbound email parsing (forward briefs to system)

**Environment variables needed**:
```
RESEND_API_KEY=
```

**Estimated complexity**: Medium

---

### Sprint C: Submission & Shortlist Workflow (Priority: Medium)

#### C1. Shortlist Builder Component
**File**: `apps/web/components/shortlist/shortlist-builder.tsx`

**Requirements**:
- Drag-and-drop candidate ordering
- Add/remove candidates
- Generate client presentation
- Send to client action

**Estimated complexity**: Medium

---

#### C2. Submission Tracking
**File**: `apps/web/app/jobs/[id]/submissions/page.tsx`

**Requirements**:
- List all submissions for a job
- Show submission timestamps (first-to-submit tracking)
- Status workflow: Submitted → Reviewed → Interview → Offer → Placed
- Feedback capture per submission

**API Dependencies**:
- `GET /api/jobs/[id]/applications` ✅ exists

**Estimated complexity**: Medium

---

### Sprint D: Polish & Integration (Priority: Medium)

#### D1. Navigation & Layout
**Files**:
- `apps/web/components/layout/sidebar.tsx` - Update navigation
- `apps/web/components/layout/header.tsx` - User menu, notifications

**Requirements**:
- Working sidebar with all routes
- Active state highlighting
- User profile dropdown
- Notification bell (placeholder)

**Estimated complexity**: Low

---

#### D2. Dashboard Refinements
**File**: `apps/web/app/dashboard/dashboard-client.tsx`

**Requirements**:
- Quick action buttons (New Brief, Search Candidates)
- Recent activity feed
- KPI cards clickable → navigate to filtered views

**Estimated complexity**: Low

---

## Task Breakdown by Priority

### Week 1: Core Pages
| Task | File | Complexity | Dependencies |
|------|------|------------|--------------|
| Brief Detail Page | `briefs/[id]/page.tsx` | Medium | None |
| Job Detail Page | `jobs/[id]/page.tsx` | Medium | None |
| Candidate Profile | `candidates/[id]/page.tsx` | Medium | None |
| Brief → Job Convert | `briefs/[id]/convert/page.tsx` | Medium-High | Brief Detail |

### Week 2: Search & Lists
| Task | File | Complexity | Dependencies |
|------|------|------------|--------------|
| Candidate Search | `candidates/search/page.tsx` | Medium | Candidate Profile |
| Jobs List Enhancement | `jobs/page.tsx` | Low | Job Detail |
| Navigation Polish | `components/layout/*` | Low | None |

### Week 3: Communication Layer
| Task | File | Complexity | Dependencies |
|------|------|------------|--------------|
| Twilio Client Setup | `lib/twilio/*` | Medium | None |
| WhatsApp Webhook | `api/webhooks/twilio/route.ts` | High | Twilio Client |
| Send WhatsApp API | `api/messages/whatsapp/route.ts` | Medium | Twilio Client |
| Resend Client | `lib/email/*` | Low | None |
| Email Templates | `lib/email/templates/*` | Medium | Resend Client |

### Week 4: Workflow & Testing
| Task | File | Complexity | Dependencies |
|------|------|------------|--------------|
| Shortlist Builder | `components/shortlist/*` | Medium | None |
| Submission Tracking | `jobs/[id]/submissions/page.tsx` | Medium | Job Detail |
| End-to-End Testing | - | High | All above |
| Bug Fixes & Polish | - | Medium | All above |

---

## Success Criteria for Phase 1 Completion

### Must Have (MVP)
- [ ] Recruiter can view incoming brief details
- [ ] Recruiter can parse a brief with AI
- [ ] Recruiter can convert parsed brief to job
- [ ] Recruiter can run AI match on a job
- [ ] Recruiter can view matched candidate profiles
- [ ] Recruiter can add candidates to shortlist
- [ ] System tracks first-submission timestamps

### Should Have
- [ ] WhatsApp brief intake working
- [ ] Email notifications for key events
- [ ] Candidate search with filters
- [ ] Navigation fully functional

### Nice to Have
- [ ] Client presentation export
- [ ] Bulk candidate actions
- [ ] Activity logging

---

## Technical Notes

### Existing Patterns to Follow

**API Route Pattern** (from `api/jobs/[id]/route.ts`):
```typescript
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  // ... auth check, query, response
}
```

**Page Pattern** (from `dashboard/page.tsx`):
```typescript
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

async function getData() {
  const supabase = await createClient();
  // ... queries
}

export default async function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <Content />
    </Suspense>
  );
}
```

**Client Component Pattern** (from `briefs/page.tsx`):
```typescript
"use client";
import { useState, useEffect } from "react";

export default function ClientPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/...").then(...)
  }, []);
}
```

### Environment Variables Required
```env
# Already configured
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Need to add
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=
RESEND_API_KEY=
```

---

## Getting Started

1. **Start with Brief Detail Page** - This unlocks the entire brief → job → match flow
2. **Then Job Detail Page** - Completes the core workflow
3. **Then Candidate Profile** - Enables reviewing match results properly
4. **Finally Communication Layer** - Adds the "brief in 30 min" capability

Run the dev server and test each piece as you build:
```bash
pnpm dev
```

Check API routes work:
```bash
curl http://localhost:3004/api/briefs
curl http://localhost:3004/api/jobs
curl http://localhost:3004/api/candidates
```
