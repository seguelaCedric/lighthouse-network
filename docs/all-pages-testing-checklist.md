# Lighthouse Crew Network - Complete Page Testing Checklist

**App URL:** http://localhost:3004
**Total Pages:** 61

---

## 🔐 AUTHENTICATION (Public - No Login Required)

| # | URL | Page | What to Test | Status |
|---|-----|------|--------------|--------|
| 1 | `/auth/login` | Login Page | Email/password fields, validation, login flow, Google OAuth, Remember me | ⬜ |
| 2 | `/auth/register` | Registration Page | Multi-step wizard (4 steps), form validation, terms checkbox | ⬜ |
| 3 | `/auth/forgot-password` | Forgot Password | Email input, reset link sending, validation | ⬜ |
| 4 | `/auth/error` | Auth Error Page | Error message display, back to login link | ⬜ |

---

## 🌐 PUBLIC PAGES (No Login Required)

| # | URL | Page | What to Test | Status |
|---|-----|------|--------------|--------|
| 5 | `/` | Home/Landing | Design system page loads correctly | ⬜ |
| 6 | `/pricing` | Pricing Page | Agency partner program, waitlist signup | ⬜ |
| 7 | `/join` | Join Page | Signup flow for new users | ⬜ |
| 8 | `/job-board` | Public Job Board | Job listings, search bar, filters, apply button | ⬜ |
| 9 | `/mobile-demo` | Mobile Demo | Mobile interface demonstration | ⬜ |
| 10 | `/typography` | Typography | Design system typography reference | ⬜ |

---

## 📊 RECRUITER DASHBOARD (Requires Login)

**Test Credentials:** `admin@lighthouse.careers` / `TestPassword123!`

| # | URL | Page | What to Test | Status |
|---|-----|------|--------------|--------|
| 11 | `/dashboard` | Main Dashboard | Stats cards, briefs inbox, recent applications, quick actions | ⬜ |
| 12 | `/interviews` | Interviews | Interview list, filter tabs, scheduling | ⬜ |
| 13 | `/notifications` | Notifications | Notification list, unread count, mark as read | ⬜ |
| 14 | `/messages` | Messages | Chat interface, conversation list, message input | ⬜ |

---

## 📝 BRIEFS (Requires Login)

| # | URL | Page | What to Test | Status |
|---|-----|------|--------------|--------|
| 15 | `/briefs` | Briefs List | Brief inbox view, status filters, source icons | ⬜ |
| 16 | `/briefs/new` | Create Brief | Form fields, source selection, AI parsing option | ⬜ |
| 17 | `/briefs/parse` | Parse Brief | AI text parsing, extracted data display | ⬜ |
| 18 | `/briefs/[id]` | Brief Details | Brief info, parsed data, actions | ⬜ |
| 19 | `/briefs/[id]/convert` | Convert Brief | Brief to Job conversion form, pre-filled data | ⬜ |

---

## 💼 JOBS (Requires Login)

| # | URL | Page | What to Test | Status |
|---|-----|------|--------------|--------|
| 20 | `/jobs` | Jobs List | Redirects to pipeline view | ⬜ |
| 21 | `/jobs/pipeline` | Jobs Pipeline | Kanban board, 6 columns, drag-drop, job cards | ⬜ |
| 22 | `/jobs/new` | Create Job | Job creation form ⚠️ **Issue #5 - Routing bug** | ⬜ |
| 23 | `/jobs/match` | AI Matching | Candidate matching interface, match scores | ⬜ |
| 24 | `/jobs/[id]` | Job Details | Full job info, candidates, requirements, actions | ⬜ |
| 25 | `/jobs/[id]/submissions` | Job Submissions | Application list, status, actions | ⬜ |

---

## 👥 CANDIDATES (Requires Login)

| # | URL | Page | What to Test | Status |
|---|-----|------|--------------|--------|
| 26 | `/candidates` | Candidates List | Grid/list view, filters, candidate cards | ⬜ |
| 27 | `/candidates/search` | Candidate Search | AI-powered search, advanced filters, results | ⬜ |
| 28 | `/candidates/[id]` | Candidate Profile | Full profile, certifications, references, notes | ⬜ |

---

## 🏢 CLIENTS (Requires Login)

| # | URL | Page | What to Test | Status |
|---|-----|------|--------------|--------|
| 29 | `/clients` | Clients List | Client table, type/status filters, add button | ⬜ |
| 30 | `/clients/[id]` | Client Details | Client info, associated jobs, contact details | ⬜ |

---

## ✅ VERIFICATION (Requires Login)

| # | URL | Page | What to Test | Status |
|---|-----|------|--------------|--------|
| 31 | `/verification` | Verification Queue | ID docs, references, voice verification tabs | ⬜ |

---

## ⚙️ SETTINGS (Requires Login)

| # | URL | Page | What to Test | Status |
|---|-----|------|--------------|--------|
| 32 | `/settings` | Settings Main | Redirects to /settings/profile | ⬜ |
| 33 | `/settings/profile` | Profile Settings | Photo upload, personal info, bio, timezone | ⬜ |
| 34 | `/settings/account` | Account Settings | Password change, 2FA, sessions, API keys | ⬜ |
| 35 | `/settings/notifications` | Notification Settings | Email/push toggles, quiet hours | ⬜ |
| 36 | `/settings/integrations` | Integrations | Vincere, Gmail, WhatsApp, Calendar connections | ⬜ |
| 37 | `/settings/team` | Team Settings | Team members list, roles, invite button | ⬜ |
| 38 | `/settings/billing` | Billing Settings | Subscription, usage stats, payment methods | ⬜ |
| 39 | `/settings/billing/plans` | Billing Plans | Plan comparison, upgrade/downgrade options | ⬜ |
| 40 | `/settings/billing/invoices` | Billing Invoices | Invoice history, download options | ⬜ |

---

## 🔧 ADMIN (Requires Admin Login)

| # | URL | Page | What to Test | Status |
|---|-----|------|--------------|--------|
| 41 | `/admin` | Admin Dashboard | Redirects to /admin/billing | ⬜ |
| 42 | `/admin/billing` | Admin Billing | Placement fees, invoice management | ⬜ |

---

## 🚢 CLIENT PORTAL (Requires Client Magic Link Login)

| # | URL | Page | What to Test | Status |
|---|-----|------|--------------|--------|
| 43 | `/client` | Client Landing | Redirects to /client/auth/login | ⬜ |
| 44 | `/client/auth/login` | Client Login | Magic link email input, no password | ⬜ |
| 45 | `/client/auth/verify` | Client Verify | Email verification token handling | ⬜ |
| 46 | `/client/dashboard` | Client Dashboard | Active jobs, shortlists, metrics | ⬜ |
| 47 | `/client/searches` | Client Searches | Active job searches list | ⬜ |
| 48 | `/client/briefs/new` | Client Brief | Submit hiring brief form | ⬜ |
| 49 | `/client/shortlist/[jobId]` | Client Shortlist | Review candidates, provide feedback | ⬜ |
| 50 | `/client/candidate/[id]` | Client Candidate | View candidate profile (limited view) | ⬜ |
| 51 | `/client/interviews` | Client Interviews | Scheduled interviews list | ⬜ |
| 52 | `/client/placements` | Client Placements | Completed placements history | ⬜ |
| 53 | `/client/notifications` | Client Notifications | Client-specific notifications | ⬜ |
| 54 | `/client/settings` | Client Settings | Client account settings | ⬜ |

---

## ⚓ CREW PORTAL (Requires Crew Login)

| # | URL | Page | What to Test | Status |
|---|-----|------|--------------|--------|
| 55 | `/crew/dashboard` | Crew Dashboard | ⚠️ **Issue #8 - 404 Missing Page** | ⬜ |
| 56 | `/crew/profile/edit` | Crew Profile | Edit profile form, experience, skills | ⬜ |
| 57 | `/crew/jobs` | Crew Jobs | Available job listings | ⬜ |
| 58 | `/crew/applications` | Crew Applications | Application status tracking | ⬜ |
| 59 | `/crew/verification` | Crew Verification | Upload ID, add references, voice verify | ⬜ |
| 60 | `/crew/referrals` | Crew Referrals | Referral code, earnings, history | ⬜ |

---

## 📊 Summary

| Category | Count | Tested | Passing | Failing |
|----------|-------|--------|---------|---------|
| Authentication | 4 | 0 | 0 | 0 |
| Public Pages | 6 | 0 | 0 | 0 |
| Recruiter Dashboard | 4 | 0 | 0 | 0 |
| Briefs | 5 | 0 | 0 | 0 |
| Jobs | 6 | 0 | 0 | 0 |
| Candidates | 3 | 0 | 0 | 0 |
| Clients | 2 | 0 | 0 | 0 |
| Verification | 1 | 0 | 0 | 0 |
| Settings | 9 | 0 | 0 | 0 |
| Admin | 2 | 0 | 0 | 0 |
| Client Portal | 12 | 0 | 0 | 0 |
| Crew Portal | 6 | 0 | 0 | 0 |
| **TOTAL** | **60** | **0** | **0** | **0** |

---

## ⚠️ Known Issues

| Issue # | Severity | Page | Description |
|---------|----------|------|-------------|
| #1 | Critical | Logout | Logout button doesn't clear session |
| #5 | High | `/jobs/new` | Routing bug - "new" treated as invalid job ID |
| #8 | High | `/crew/dashboard` | 404 - Crew portal login page missing |

---

## 📝 Status Legend

| Symbol | Meaning |
|--------|---------|
| ⬜ | Not Started |
| 🟡 | In Progress |
| ✅ | Pass |
| ❌ | Fail |
| ⚠️ | Known Issue |

---

## 🧪 Testing Instructions

### For Each Page:
1. Navigate to the URL
2. Check if page loads without errors
3. Verify all UI elements are present
4. Test interactive elements (buttons, forms, links)
5. Check browser console for errors
6. Take screenshot if needed
7. Update status in this checklist

### Test Credentials:
- **Recruiter/Admin:** `admin@lighthouse.careers` / `TestPassword123!`
- **Client Portal:** Magic link authentication (no password)
- **Crew Portal:** Requires crew account registration

---

## 📅 Testing Log

| Date | Tester | Pages Tested | Notes |
|------|--------|--------------|-------|
| | | | |

