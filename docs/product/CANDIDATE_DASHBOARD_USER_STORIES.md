# Candidate Dashboard - User Stories & Acceptance Criteria

**Related PRD:** [CANDIDATE_DASHBOARD_PRD.md](./CANDIDATE_DASHBOARD_PRD.md)
**Last Updated:** 2026-01-03

---

## Epic 1: Dashboard Home

### US-1.1: View Dashboard Overview
```
As a candidate,
I want to see my profile status, job matches, and alerts on one page,
So that I know what needs my attention.

Acceptance Criteria:
- [ ] Dashboard loads within 2 seconds
- [ ] Profile strength score displayed as circular progress (0-100%)
- [ ] Top 3-5 matched jobs shown with match percentage
- [ ] My applications list shows jobs I've applied to
- [ ] Alerts section shows expiring documents and incomplete profile items
- [ ] Quick actions: Update availability, Upload CV, Browse Jobs
```

### US-1.2: Profile Strength Score
```
As a candidate,
I want to see what's missing from my profile,
So that I can complete it and be more visible to recruiters.

Acceptance Criteria:
- [ ] Score breakdown shows each section with % weight
- [ ] Incomplete sections highlighted with "Complete" button
- [ ] Score updates immediately when sections completed
- [ ] Calculation: Basic info (15%) + Professional (20%) + CV (20%) + Photo (10%) + Certs (20%) + Prefs (10%) + Verified (5%)
```

### US-1.3: Document Expiry Alerts
```
As a candidate,
I want to see which documents are expiring soon,
So that I can renew them before they become invalid.

Acceptance Criteria:
- [ ] Red alert: Documents expiring in <30 days
- [ ] Amber alert: Documents expiring in 30-90 days
- [ ] Each alert shows document name, expiry date, and "Update" link
- [ ] Dismissed alerts don't reappear for same document
```

---

## Epic 2: Profile Management

### US-2.1: Edit Personal Details
```
As a candidate,
I want to update my contact and personal information,
So that recruiters have my current details.

Acceptance Criteria:
- [ ] Fields: First name*, Last name*, Email*, Phone*, WhatsApp, DOB*, Nationality*, Second nationality, Location*
- [ ] Auto-save on field blur with "Saving..." indicator
- [ ] Validation errors shown inline
- [ ] Changes sync to Vincere within 5 minutes
- [ ] Email change triggers verification
```

### US-2.2: Edit Professional Profile
```
As a candidate,
I want to update my positions and experience,
So that I appear in relevant job searches.

Acceptance Criteria:
- [ ] Primary position: Required single select
- [ ] Secondary positions: Optional multi-select (max 3)
- [ ] Years of experience: Number input (0-50)
- [ ] Experience summary: Textarea (500 char limit)
- [ ] Key skills: Tag input
- [ ] All fields sync to Vincere
```

### US-2.3: Set Job Preferences
```
As a candidate,
I want to specify my job preferences,
So that I get relevant job matches.

Acceptance Criteria:
- [ ] Yacht types: Multi-select (Motor, Sail, Explorer, etc.)
- [ ] Yacht size: Range slider (20m - 100m+)
- [ ] Contract types: Multi-select (Permanent, Rotational, Temp)
- [ ] Regions: Multi-select
- [ ] Salary: Min/max with currency
- [ ] Changes update job matching
```

### US-2.4: Update Availability
```
As a candidate,
I want to update my availability status,
So that recruiters know if I'm looking for work.

Acceptance Criteria:
- [ ] Status options: Available, Looking, Employed, Unavailable
- [ ] Available from date picker
- [ ] Quick toggle from dashboard
- [ ] Syncs to Vincere immediately
```

### US-2.5: Special Circumstances
```
As a candidate,
I want to indicate special circumstances (couple, tattoos, etc.),
So that I'm matched with suitable positions.

Acceptance Criteria:
- [ ] Couple position toggle with partner name/position fields
- [ ] Visible tattoos toggle with description
- [ ] Smoker status toggle
- [ ] All sync to Vincere custom fields
```

---

## Epic 3: Documents

### US-3.1: Upload CV
```
As a candidate,
I want to upload my CV,
So that recruiters can see my full experience.

Acceptance Criteria:
- [ ] Formats: PDF, DOC, DOCX (max 10MB)
- [ ] Drag-and-drop or click to upload
- [ ] Progress indicator during upload
- [ ] Version history shows last 5 uploads
- [ ] "Set as current" for any version
- [ ] Syncs to Vincere documents
```

### US-3.2: Manage Certificates
```
As a candidate,
I want to upload and track my certificates,
So that my qualifications are up to date.

Acceptance Criteria:
- [ ] Categories: Maritime, Medical, Safety, Service
- [ ] Per cert: Upload, name, issue date, expiry date, issuing authority
- [ ] Expiry countdown displayed
- [ ] "Expired" badge for past-due certs
- [ ] Syncs to Vincere certifications
```

### US-3.3: Expiry Notifications
```
As a candidate,
I want to be notified when certificates are expiring,
So that I can renew them in time.

Acceptance Criteria:
- [ ] 90 days: In-app notification
- [ ] 60 days: Email notification
- [ ] 30 days: Dashboard alert (amber)
- [ ] 14 days: Dashboard alert (red)
- [ ] Notification includes renewal guidance
```

### US-3.4: Upload Photos
```
As a candidate,
I want to upload my professional photos,
So that my profile is complete.

Acceptance Criteria:
- [ ] Headshot (required) and full-length (optional)
- [ ] Formats: JPG, PNG (max 5MB)
- [ ] Guidelines shown (lighting, dress code)
- [ ] Crop tool for headshot
- [ ] Syncs to Vincere
```

---

## Epic 4: Jobs

### US-4.1: View Matched Jobs
```
As a candidate,
I want to see jobs that match my profile,
So that I can find relevant opportunities.

Acceptance Criteria:
- [ ] Jobs sorted by match score
- [ ] Match score badge (0-100%)
- [ ] Job card: Title, yacht type/size, location, salary, start date
- [ ] "New" badge for jobs posted in last 48 hours
- [ ] Jobs pulled from Vincere
```

### US-4.2: Search Jobs
```
As a candidate,
I want to search and filter jobs,
So that I can find specific opportunities.

Acceptance Criteria:
- [ ] Filters: Position, Yacht type, Size, Region, Salary
- [ ] Free-text search
- [ ] Results count
- [ ] Sort by: Relevance, Newest, Salary
- [ ] <2 second search response
```

### US-4.3: Save Job
```
As a candidate,
I want to save jobs for later,
So that I can compare before applying.

Acceptance Criteria:
- [ ] Save/unsave toggle on job cards
- [ ] Saved jobs list in navigation
- [ ] Max 50 saved jobs
- [ ] Notification if saved job closes
```

### US-4.4: Apply to Job
```
As a candidate,
I want to apply to a job with one click,
So that I can express interest quickly.

Acceptance Criteria:
- [ ] "Apply" button on job card and detail page
- [ ] Uses current CV automatically
- [ ] Optional cover note (500 chars)
- [ ] Confirmation: "Application submitted"
- [ ] Creates application in Vincere
- [ ] Cannot apply twice to same job
```

---

## Epic 5: My Applications

### US-5.1: View My Applications
```
As a candidate,
I want to see jobs I've applied to,
So that I know what's pending.

Acceptance Criteria:
- [ ] List shows: Job title, Date applied, Status
- [ ] Status: "Applied" or "In Progress" only
- [ ] NO visibility into internal pipeline stages
- [ ] Sort by date (newest first)
- [ ] Empty state: "No applications yet"
```

**Note:** Candidates do NOT see shortlisting, client submission, or rejection. Recruiter communicates directly.

---

## Epic 6: Notifications & Settings

### US-6.1: View Notifications
```
As a candidate,
I want to see all my notifications,
So that I don't miss important updates.

Acceptance Criteria:
- [ ] Notification list with read/unread indicator
- [ ] Badge count in navigation
- [ ] Click to navigate to relevant page
- [ ] "Mark all as read" option
```

### US-6.2: Notification Settings
```
As a candidate,
I want to control what notifications I receive,
So that I'm not overwhelmed.

Acceptance Criteria:
- [ ] Per-type toggles: Document expiry, Job matches, Application updates
- [ ] Email frequency: Real-time, Daily, Weekly
- [ ] Quiet hours option
```

### US-6.3: Account Settings
```
As a candidate,
I want to manage my account,
So that I can keep it secure.

Acceptance Criteria:
- [ ] Change password
- [ ] Update email (with verification)
- [ ] Delete account option (with confirmation)
```

---

## Technical Requirements

### Vincere Sync
- [ ] Profile changes sync to Vincere within 5 minutes
- [ ] Document uploads sync to Vincere immediately
- [ ] Job applications create Vincere submissions
- [ ] Jobs refresh from Vincere hourly

### Performance
- [ ] Page load <2 seconds
- [ ] Search results <2 seconds
- [ ] File upload shows progress

### Mobile
- [ ] All features work on mobile
- [ ] Touch-friendly controls
- [ ] Responsive layouts

---

## Story Point Estimates

| Epic | Stories | Points | Priority |
|------|---------|--------|----------|
| 1. Dashboard Home | 3 | 8 | P0 |
| 2. Profile Management | 5 | 13 | P0 |
| 3. Documents | 4 | 13 | P0 |
| 4. Jobs | 4 | 13 | P1 |
| 5. My Applications | 1 | 3 | P1 |
| 6. Notifications & Settings | 3 | 8 | P2 |
| **Total** | **20** | **58** | |

**Estimated:** ~3 sprints (6 weeks) at 20 points/sprint

---

## Out of Scope

- ❌ Detailed application pipeline visibility
- ❌ Interview scheduling
- ❌ Multi-agency features
- ❌ Reference request workflow
- ❌ Identity verification workflow

---

*Last updated: 2026-01-03*
