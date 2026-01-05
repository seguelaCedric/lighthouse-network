# Candidate Dashboard - Product Requirements Document

**Document Version:** 1.1
**Created:** 2026-01-03
**Author:** Product Team
**Status:** Draft

---

## Executive Summary

The Candidate Dashboard is a self-service portal for Lighthouse Crew Network candidates (yacht crew and luxury household staff) to manage their professional profiles, documents, and job applications. Data syncs bidirectionally with Vincere (our ATS), reducing manual data entry for recruiters while giving candidates ownership of their career profile.

### Business Case

| Metric | Current State | Target State | Impact |
|--------|--------------|--------------|--------|
| Profile Completion Rate | ~40% (recruiter-managed) | 85%+ (candidate self-service) | Higher match quality |
| Document Collection | Manual email chase | Candidate self-upload | Recruiters focus on placements |
| Cert Expiry Management | Manual tracking | Automated alerts | Zero expired certs at placement |
| Recruiter Admin Time | 3+ hrs/day | <1 hr/day | More relationship building |

### Key Constraint
- **Vincere is source of truth** - All candidate data syncs to/from Vincere
- **Single agency** - This is for Lighthouse candidates only, no multi-agency complexity

---

## Problem Statement

### Candidate Pain Points
1. **Lack of Ownership** - Candidates can't update their own profile or documents
2. **Document Chaos** - CVs, certificates scattered across email threads
3. **Certification Anxiety** - No reminders for expiring STCW, ENG1, visas
4. **Passive Experience** - Waiting for recruiter calls vs. seeing opportunities

### Agency Pain Points
1. **Profile Maintenance** - Updating candidate info manually is time-consuming
2. **Document Collection** - Chasing candidates for updated CVs and certificates
3. **Availability Tracking** - Candidates' availability changes without notification
4. **Compliance Risk** - Candidates placed with expired certifications

---

## User Personas

### Primary: Active Job-Seeking Crew
**"Sophie" - Chief Stewardess, 28**
- 6 years experience on 40-60m motor yachts
- Wants to keep her profile current and see relevant opportunities
- Frustrated by having to email documents repeatedly

### Secondary: Passive/Employed Crew
**"Marcus" - Captain, 42**
- Currently employed, contract ends in 4 months
- Needs to keep documents current for compliance
- Wants to quietly browse opportunities

---

## Feature Overview

### Information Architecture

```
Candidate Dashboard
├── Home (Dashboard Overview)
│   ├── Profile Strength Score
│   ├── Matched Jobs Preview
│   ├── My Applications (simple list)
│   ├── Alerts & Action Items
│   └── Quick Actions
│
├── Profile
│   ├── Personal Details
│   ├── Professional Info (positions, experience)
│   ├── Preferences (yacht type, size, regions, salary)
│   ├── Special Circumstances (couple, tattoos, etc.)
│   └── Availability Status
│
├── Documents
│   ├── CV Upload (with version history)
│   ├── Certificates (with expiry tracking)
│   ├── Visas & Travel Docs
│   └── Photos
│
├── Jobs
│   ├── Matched Jobs (AI-powered)
│   ├── Browse All Jobs
│   └── Saved Jobs
│
├── My Applications
│   ├── Active (jobs I've applied to)
│   └── Past Applications
│
├── Notifications
│   └── All alerts and updates
│
└── Settings
    ├── Account Settings
    ├── Notification Preferences
    └── Privacy
```

---

## Detailed Feature Specifications

### 1. Dashboard Home

**Purpose:** Single-glance overview of status and required actions

#### 1.1 Profile Strength Score
- Circular progress (0-100%)
- Breakdown of what's missing with % boost per item
- Click to navigate to incomplete sections

**Calculation:**
| Section | Weight |
|---------|--------|
| Basic info complete | 15% |
| Professional profile complete | 20% |
| CV uploaded | 20% |
| Photo uploaded | 10% |
| Certifications added | 20% |
| Preferences set | 10% |
| Identity verified | 5% |

#### 1.2 Matched Jobs Preview
- Top 3-5 matched jobs with match score badges
- Quick actions: View, Save, Apply
- Link to full job search

#### 1.3 My Applications (Simple)
- List of jobs candidate has applied to
- Status: **Applied** or **In Progress** (no detailed pipeline)
- Date applied
- No visibility into internal stages (screening, submitted to client, etc.)

#### 1.4 Alerts & Action Items
**Critical (Red):**
- Documents expiring in <30 days
- Missing required certifications

**Important (Amber):**
- Documents expiring in 30-90 days
- Incomplete profile sections

**Informational (Blue):**
- New job matches
- Messages from recruiters

#### 1.5 Quick Actions
- Update Availability (toggle)
- Upload New CV
- Browse Jobs

---

### 2. Profile Management

**Purpose:** Self-service profile editing, syncs to Vincere

#### 2.1 Personal Details

| Field | Type | Required | Vincere Sync |
|-------|------|----------|--------------|
| First Name | Text | Yes | ✓ |
| Last Name | Text | Yes | ✓ |
| Email | Email | Yes | ✓ |
| Phone | Phone | Yes | ✓ |
| WhatsApp | Phone | No | ✓ |
| Date of Birth | Date | Yes | ✓ |
| Nationality | Select | Yes | ✓ |
| Second Nationality | Select | No | ✓ |
| Current Location | Autocomplete | Yes | ✓ |

#### 2.2 Professional Profile

| Field | Type | Vincere Sync |
|-------|------|--------------|
| Primary Position | Select | ✓ |
| Secondary Positions | Multi-select | ✓ |
| Years of Experience | Number | ✓ |
| Experience Summary | Textarea | ✓ (bio field) |
| Key Skills | Tags | ✓ |

#### 2.3 Preferences

| Field | Type | Vincere Sync |
|-------|------|--------------|
| Preferred Yacht Types | Multi-select | ✓ |
| Yacht Size Range | Slider | ✓ |
| Contract Types | Multi-select | ✓ |
| Preferred Regions | Multi-select | ✓ |
| Salary Expectation | Min/Max | ✓ |

#### 2.4 Availability Status
- Status: Available / Looking / Employed / Unavailable
- Available from date
- Current contract end date
- **Syncs to Vincere availability fields**

#### 2.5 Special Circumstances
- Couple position (partner name, partner position)
- Visible tattoos (yes/no, description)
- Smoker status
- All sync to Vincere custom fields

---

### 3. Documents

**Purpose:** Centralized document management with expiry tracking

#### 3.1 CV Management
- Upload PDF/DOC/DOCX (max 10MB)
- Version history (last 5)
- Set current version
- **Syncs to Vincere candidate documents**

#### 3.2 Certificates
**Categories:**
- Maritime (STCW, licenses)
- Medical (ENG1)
- Safety (PSSR, AEC)
- Service (WSET, etc.)

**Per Certificate:**
- Document upload
- Issue date, Expiry date
- Issuing authority
- Certificate number
- **Syncs to Vincere certifications**

**Expiry Alerts:**
- 90 days: In-app reminder
- 60 days: Email notification
- 30 days: Dashboard alert (amber)
- 14 days: Dashboard alert (red)

#### 3.3 Photos
- Professional headshot (required)
- Full-length photo (optional)
- Guidelines displayed
- **Syncs to Vincere**

---

### 4. Jobs

**Purpose:** Browse and apply to opportunities

#### 4.1 Matched Jobs
- AI-powered matching based on profile
- Match score displayed (0-100%)
- Sorted by relevance

#### 4.2 Browse/Search Jobs
- Filter by: Position, Yacht type, Size, Region, Salary
- Jobs pulled from Vincere job orders

#### 4.3 Save Jobs
- Save for later review
- Notification if saved job closes

#### 4.4 Apply to Job
- One-click apply (uses current CV)
- Optional cover note
- **Creates application in Vincere**

---

### 5. My Applications

**Purpose:** Track what candidate has applied to

**Simple View:**
- Job title
- Date applied
- Status: "Applied" or "In Progress"
- **No visibility into internal pipeline stages**

**What candidates DON'T see:**
- Whether they've been shortlisted
- Whether they've been submitted to client
- Interview scheduling (recruiter handles directly)
- Rejection reasons

**Rationale:** Keeps recruiter control over candidate communication. Recruiter calls/emails candidate directly for updates.

---

### 6. Notifications

#### Types
| Type | Channel |
|------|---------|
| Document expiring | Email + In-app |
| New job match | In-app (optional email) |
| Application confirmed | In-app |
| Message from recruiter | Email + In-app |

#### Settings
- Email frequency: Real-time / Daily digest / Weekly
- Job alert preferences
- Quiet hours

---

## Vincere Integration

### Sync Direction

| Data | Direction | Notes |
|------|-----------|-------|
| Candidate profile | Bidirectional | Dashboard edits → Vincere |
| Documents/CV | Dashboard → Vincere | Uploads sync to Vincere |
| Certifications | Bidirectional | Expiry tracked both sides |
| Jobs | Vincere → Dashboard | Jobs pulled from Vincere |
| Applications | Dashboard → Vincere | Apply creates Vincere submission |
| Application status | Vincere → Dashboard | Basic status only |

### Sync Triggers
- **Real-time:** Profile updates, document uploads, job applications
- **Scheduled:** Job listings refresh (hourly), application status sync (every 15 min)

### Existing Infrastructure
- Vincere client: [apps/web/lib/vincere/](apps/web/lib/vincere/)
- Pull scripts: [apps/web/scripts/vincere-pull.ts](apps/web/scripts/vincere-pull.ts)
- Already syncing: Candidates, Jobs, Documents

---

## Implementation Phases

### Phase 1: Profile & Documents (Sprint 1-2)
**Goal:** Candidates can manage their own profile and documents

- [ ] Profile editing (all sections)
- [ ] CV upload with version history
- [ ] Certificate management with expiry tracking
- [ ] Photo upload
- [ ] Dashboard home with profile strength
- [ ] Vincere sync for all above

**Success Criteria:**
- 50% of candidates update profile via portal
- Profile completion >60%

### Phase 2: Jobs & Applications (Sprint 3-4)
**Goal:** Candidates can browse and apply to jobs

- [ ] Job listing from Vincere
- [ ] AI-powered job matching
- [ ] Job search with filters
- [ ] Save jobs
- [ ] Apply to job (creates Vincere application)
- [ ] My Applications list (simple status)

**Success Criteria:**
- 30% of applications come through portal
- Candidates check jobs daily

### Phase 3: Notifications & Polish (Sprint 5)
**Goal:** Proactive alerts and refined UX

- [ ] Document expiry notifications
- [ ] Job match notifications
- [ ] Notification preferences
- [ ] Mobile responsiveness audit
- [ ] Performance optimization

**Success Criteria:**
- Zero expired certs at placement
- Mobile usage >40%

---

## Success Metrics

### Engagement
| Metric | Target |
|--------|--------|
| Weekly Active Users | 50% of registered |
| Profile Completion | >80% |
| Documents Uploaded | >70% have CV |

### Business Impact
| Metric | Target |
|--------|--------|
| Recruiter Admin Time | -50% |
| Document Chase Emails | -80% |
| Expired Cert Incidents | Zero |

### Technical
| Metric | Target |
|--------|--------|
| Page Load Time | <2s |
| Vincere Sync Latency | <5 min |
| Uptime | 99.9% |

---

## Out of Scope (Simplified)

The following are **NOT** included to keep scope manageable:

- ❌ Multi-agency support (single agency: Lighthouse)
- ❌ Agency visibility controls (not needed)
- ❌ Detailed application pipeline visibility (recruiter controls comms)
- ❌ Interview scheduling by candidates (recruiter handles)
- ❌ Reference request workflow (manual for now)
- ❌ Referral rewards program (future phase)
- ❌ Identity verification workflow (manual for now)

---

## Technical Notes

### Existing Infrastructure to Leverage
- Auth: Supabase Auth with candidate user type
- Crew portal layout: [apps/web/app/crew/](apps/web/app/crew/)
- Vincere client: [apps/web/lib/vincere/](apps/web/lib/vincere/)
- UI components: Navy/gold design system
- Existing dashboard patterns: [apps/web/app/crew/dashboard/](apps/web/app/crew/dashboard/)

### New Development
- Profile edit forms with auto-save
- Document upload component with Vincere sync
- Job listing pages with Vincere data
- Application submission flow
- Notification system (new table + UI)

---

## Open Questions

1. **Job visibility:** Should all Vincere jobs show, or only public ones?
2. **Application confirmation:** Email confirmation when they apply?
3. **Recruiter messaging:** In-app messaging, or just email links?

---

*Document maintained by Product Team. Last updated: 2026-01-03*
