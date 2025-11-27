# LIGHTHOUSE CREW NETWORK - Implementation Roadmap

## Updated Priority Order

Based on what actually drives revenue:
```
1. RECRUITER DASHBOARD (Weeks 1-8)
   └── You need this to work faster
   
2. PUBLIC JOB BOARD (Weeks 9-12)
   └── Attracts candidates (they come for jobs)
   
3. CANDIDATE APPLY FLOW (Weeks 9-12)
   └── Captures candidates when they see a job they want
   
4. CLIENT PORTAL - OUTPUT (Weeks 13-16)
   └── Clients view shortlists, give feedback
   
5. CLIENT PORTAL - INPUT (Week 17+)
   └── Brief submission form (low priority, most use WhatsApp/phone)
   
6. CANDIDATE DASHBOARD (Weeks 17-20)
   └── Nice to have, keeps them engaged
   
7. NETWORK FEATURES (Weeks 21-26)
   └── Agency collaboration, growth
```

---

## Phase 1: Recruiter Dashboard (Weeks 1-8)

### Sprint 1-2: Core Data & Brief Inbox

**Goal**: You can paste briefs from any source and manage candidates

**Tasks**:
```
Week 1:
├── [x] Project setup, Supabase, auth
├── [x] Basic UI shell (luxury design)
├── [x] Candidate CRUD
├── [x] Job CRUD
├── [x] Brief Inbox UI
└── [x] "Add Brief" modal (paste from phone/WhatsApp/email)

Week 2:
├── [x] Brief source tracking (phone, whatsapp, email, portal)
├── [x] Client detection from brief text
├── [x] Basic search/filter
├── [x] Document upload
└── [x] Vincere sync (import existing candidates)
```

**Deliverable**: Paste a WhatsApp message → it's in your brief inbox

---

### Sprint 3-4: AI Integration

**Goal**: AI parses briefs and matches candidates

**Tasks**:
```
Week 3:
├── [x] Brief parser (GPT-4)
├── [~] Test with 50 real briefs (deferred - will do later)
├── [x] Clarifying question generation
├── [x] Brief → Job conversion
└── [x] Embedding generation

Week 4:
├── [x] Vector search (pgvector)
├── [x] Candidate matching engine
├── [x] AI scoring with breakdown
├── [x] Match results UI
└── [~] Performance optimization (<10s) (deferred - will do later)
```

**Deliverable**: Paste brief → AI parses → See matched candidates

---

### Sprint 5-6: Shortlist & Submission

**Goal**: Complete recruiter workflow

**Tasks**:
```
Week 5:
├── [x] Match review interface
├── [x] Shortlist builder (select candidates)
├── [x] Client submission workflow
├── [x] Submission tracking
└── [x] Email templates (shortlist delivery)

Week 6:
├── [x] Job pipeline (Kanban)
├── [x] Candidate profile view
├── [x] Notes & activity logging
├── [x] Quick actions (call, email, WhatsApp)
└── [x] Basic notifications
```

**Deliverable**: Brief → Parse → Match → Shortlist → Submit to client (all in platform)

---

### Sprint 7-8: Communication Integration

**Goal**: WhatsApp and email flow into the system

**Tasks**:
```
Week 7:
├── [x] WhatsApp integration (Twilio)
├── [x] Auto-import WhatsApp briefs
├── [x] Email inbound (briefs@lighthouse.crew)
├── [x] Email → brief conversion
└── [x] Phone note entry optimization

Week 8:
├── [x] Candidate WhatsApp messaging
├── [x] Availability updates via WhatsApp
├── [x] Email notifications (Resend)
├── [x] In-app notification center
└── [x] Communication history
```

**Deliverable**: WhatsApp brief auto-appears in inbox, AI parses, you submit shortlist same day

---

## Phase 2: Candidate Acquisition (Weeks 9-12)

### Sprint 9-10: Public Job Board

**Goal**: Candidates find your jobs, no login required to browse

**Tasks**:
```
Week 9:
├── [x] Public job board page (/jobs)
├── [x] Job card design (luxury aesthetic)
├── [x] Search & filters (position, location, salary)
├── [x] Job detail page
├── [x] SEO optimization (meta tags, structured data)
└── [x] "Apply" button (requires signup)

Week 10:
├── [x] Apply flow (minimal signup)
├── [x] CV upload during apply
├── [x] Application confirmation
├── [x] Application → candidate + application in your dashboard
└── [x] Email notification to you: "New application"

Week 10.5 (Recruiter-Application Integration):
├── [x] Dashboard: Recent Applications feed (job board applications)
├── [x] Job detail: Applicants tab (separate from AI matches)
├── [x] Job detail: Pipeline/Applicants/Matches tab navigation
├── [x] API: Source filtering for applications (?source=job_board)
└── [x] Job cards: Applicant count badges
```

**Deliverable**: Candidate googles "yacht chief stew jobs" → finds your board → applies → you see them

---

### Sprint 11-12: Candidate Authentication & Basics

**Goal**: Candidates can register, login, and complete their profile

**Tasks**:
```
Week 11:
├── [x] Candidate auth system (separate from recruiter)
│   ├── [x] user_type column migration (recruiter/candidate/client)
│   ├── [x] Candidate registration page (/crew/auth/register)
│   ├── [x] Registration with job context (?job=id shows job being applied to)
│   ├── [x] Candidate login page (/crew/auth/login)
│   ├── [x] Auth callback route (/crew/auth/callback)
│   ├── [x] Email verification flow
│   └── [x] Middleware route protection
├── [x] Candidate profile editor
├── [x] Document uploads (certs, photos)
├── [x] Certification tracking (expiry dates)
├── [x] Visa & travel documents
└── [x] Profile completeness indicator

Week 12:
├── [x] My Applications page
├── [x] Application status tracking
├── [x] Job recommendations (based on profile)
├── [x] Availability toggle
└── [x] Basic notifications
```

**Auth Architecture**:
- Same `auth.users` table, different `user_type` values
- Recruiters: `/auth/login` → `/dashboard`
- Candidates: `/crew/auth/login` → `/crew/dashboard`
- Clients: `/client/auth/login` → `/client/dashboard`

**Deliverable**: Candidates can register, apply for jobs, complete profile, track applications

---

## Phase 3: Client Portal - OUTPUT (Weeks 13-16)

### Sprint 13-14: Shortlist Viewing

**Goal**: Clients review candidates you send them

**Tasks**:
```
Week 13:
├── [x] Client auth (magic link, no password)
├── [x] Client dashboard
├── [x] Shortlist view page
├── [x] Candidate cards (redacted: first name + initial only)
├── [x] AI summary display
└── [x] Match highlights display

Week 14:
├── [x] Feedback form per candidate (interested/maybe/no)
├── [x] Feedback notes field
├── [x] Bulk feedback submission
├── [x] Interview request button
├── [x] CV download
└── [x] Profile detail view
```

**Deliverable**: Client gets link → reviews candidates → submits feedback

---

### Sprint 15-16: Client Experience

**Goal**: Complete client self-service for OUTPUT

**Tasks**:
```
Week 15:
├── [x] Active searches overview
├── [x] Search status tracking
├── [x] Interview scheduling (recruiter side)
├── [x] Placement confirmation
└── [x] History view (placements page)

Week 16:
├── [x] Client notifications (new shortlist ready)
├── [x] Notification center page
├── [x] Email templates (shortlist delivery, interview confirmation)
│   ├── [x] clientPortalInviteEmail template
│   ├── [x] clientMagicLinkEmail template
│   ├── [x] interviewScheduledClientEmail template
│   ├── [x] Wired up client portal invite email
│   ├── [x] Wired up magic link login email
│   ├── [x] Shortlist ready email to clients
│   └── [x] Interview confirmation emails (candidate + client)
├── [x] Client portal mobile optimization
│   ├── [x] Mobile drawer menu width fix (85vw max-w-72)
│   ├── [x] Safe area padding for notched devices
│   └── [x] Touch-friendly button sizes (44px minimum)
├── [x] Crew portal mobile optimization
│   ├── [x] Implemented mobile drawer menu (was missing entirely)
│   ├── [x] User profile/settings access in mobile menu
│   └── [x] Sign out option for mobile users
├── [x] Mobile foundation
│   ├── [x] Button sizes: 44px minimum on mobile (button.tsx)
│   ├── [x] Input font size: 16px on mobile (prevents iOS zoom)
│   └── [x] Safe area utilities (pb-safe, pt-safe, etc.)
└── [x] Brief submission form (secondary, available but not pushed)
```

**Deliverable**: Clients can view shortlists, give feedback, request interviews, track searches

---

## Phase 4: Polish & Network (Weeks 17-26)

### Sprint 17-18: Candidate Dashboard

**Goal**: Keep candidates engaged

**Tasks**:
├── [x] Candidate dashboard redesign
│   ├── [x] New (crew) route group with authenticated layout
│   ├── [x] Dashboard with availability toggle, applications, recommendations
│   ├── [x] Applications page with timeline/progress tracking
│   ├── [x] API routes for profile and availability
│   └── [x] Mobile-first responsive design
├── [x] Job matching feed (recommendations on dashboard)
├── [x] Profile strength gamification (completeness indicator)
├── [x] Certification expiry alerts (alerts section on dashboard)
├── [ ] Push notifications / WhatsApp alerts
└── [x] Referral program infrastructure
    ├── [x] Database migration (009_referrals.sql)
    │   ├── [x] candidates: referral_code, referred_by_candidate_id, referred_at columns
    │   ├── [x] referrals table (tracks click → signup → apply → placed funnel)
    │   ├── [x] referral_rewards table (reward ledger for both parties)
    │   ├── [x] referral_settings table (admin-configurable program settings)
    │   ├── [x] RLS policies for candidates and recruiters
    │   ├── [x] Functions: generate_referral_code, assign_referral_code
    │   ├── [x] Functions: get_referral_stats, track_referral_milestone
    │   └── [x] Views: referral_leaderboard, pending_referral_payouts
    ├── [x] TypeScript types (packages/database/types.ts)
    │   ├── [x] ReferralStatus, ReferralSource, RewardStatus, RewardType
    │   ├── [x] Referral, ReferralReward, ReferralSettings interfaces
    │   └── [x] ReferralStats, ReferralLeaderboardEntry, PendingPayout
    ├── [x] Referral service (apps/web/lib/referrals/index.ts)
    │   ├── [x] getOrCreateReferralCode, getCandidateByReferralCode
    │   ├── [x] trackReferralClick, convertReferralSignup
    │   ├── [x] trackReferralApplication, trackReferralPlacement
    │   ├── [x] getReferralStats, getReferralsByReferrer, getRewardsByCandidateId
    │   ├── [x] getReferralSettings, isReferralProgramActive, canCandidateRefer
    │   ├── [x] getReferralLeaderboard, getPendingPayouts
    │   └── [x] approveReward, markRewardPaid, cancelReward
    ├── [x] Referral API routes (apps/web/app/api/referrals/)
    │   ├── [x] GET /api/referrals/code - Get/generate referral code + shareable link
    │   ├── [x] POST /api/referrals/track - Track referral click (public)
    │   ├── [x] GET /api/referrals/track?code=X - Validate code + get referrer info
    │   ├── [x] GET /api/referrals/stats - Get candidate's referral stats
    │   ├── [x] GET /api/referrals - List candidate's referrals
    │   ├── [x] GET /api/referrals/rewards - Get candidate's rewards (grouped by status)
    │   └── [x] POST /api/referrals/payout - Request payout of approved rewards
    ├── [x] Admin referral API routes (apps/web/app/api/admin/referrals/)
    │   ├── [x] GET /api/admin/referrals - List all referrals with filters
    │   ├── [x] GET /api/admin/referrals/settings - Get program settings
    │   ├── [x] PATCH /api/admin/referrals/settings - Update program settings
    │   ├── [x] PATCH /api/admin/referrals/rewards/[id] - Approve/cancel reward
    │   └── [x] POST /api/admin/referrals/rewards/[id]/pay - Mark reward as paid
    ├── [x] Zod validation schemas (lib/validations/referral.ts)
    ├── [x] Registration referral tracking (/auth/register)
    │   ├── [x] Parse ?ref=CODE from URL
    │   ├── [x] Track referral click on mount
    │   ├── [x] Show "Referred by X" banner
    │   └── [x] Pass referral_id to signup metadata
    ├── [x] Application referral tracking
    │   └── [x] Call trackReferralApplication() on application creation
    └── [x] Referral UI
        ├── [x] Referral components (apps/web/components/referrals/)
        │   ├── [x] ShareReferralCard - Copy link, QR code, social sharing
        │   ├── [x] ReferralStats - Earnings and performance metrics
        │   ├── [x] ReferralList - List of referrals with status badges
        │   └── [x] PayoutRequestModal - Bank/PayPal payout form
        ├── [x] /crew/referrals page (share link, stats, referral list)
        ├── [x] /join?ref=CODE landing page (public referral landing)
        ├── [x] Navigation update (Referrals link in crew portal)
        ├── [x] Dashboard referral promotion card
        └── [ ] Admin: /referrals (review rewards, process payouts)

### Sprint 19-20: Verification System

**Tasks**:
├── [x] Verification tiers (unverified, basic, identity, references, verified, premium)
│   ├── [x] Database migration: 008_verification.sql
│   ├── [x] Enum extension: added 'unverified' and 'references' tiers
│   └── [x] Type definitions in packages/database/types.ts
├── [x] Verification infrastructure
│   ├── [x] verification_events audit log table
│   ├── [x] Candidate fields: email_verified_at, cv_url, id_*, voice_*
│   ├── [x] Reference fields: status, contacted_at, rating, feedback
│   └── [x] RLS policies for candidates and recruiters
├── [x] Verification service (apps/web/lib/verification/index.ts)
│   ├── [x] calculateVerificationTier() - tier calculation logic
│   ├── [x] updateVerificationTier() - auto-upgrade with notifications
│   ├── [x] getVerificationStatus() - checks + next steps + progress
│   ├── [x] logVerificationEvent() - audit logging
│   ├── [x] addReference(), updateReferenceStatus()
│   ├── [x] verifyId(), uploadIdDocument()
│   ├── [x] markEmailVerified(), uploadCv()
│   └── [x] completeVoiceVerification()
├── [x] Verification badge component (existing)
├── [x] Verification API routes
│   ├── [x] GET /api/candidates/[id]/verification - status endpoint
│   ├── [x] GET/POST /api/candidates/[id]/references - list/create
│   ├── [x] GET/PATCH/DELETE /api/candidates/[id]/references/[refId] - CRUD
│   ├── [x] POST/PATCH /api/candidates/[id]/references/[refId]/verify - recruiter verify
│   ├── [x] GET/POST/PATCH /api/candidates/[id]/id-verification - ID upload/review
│   └── [x] GET/POST/PATCH /api/candidates/[id]/voice-verification - Vapi calls
├── [x] Validation schemas (lib/validations/verification.ts)
├── [x] Verification badge component (updated for all tiers)
│   └── [x] Support for unverified, basic, identity, references, verified, premium
├── [x] Candidate verification UI
│   ├── [x] VerificationProgress component (progress bar + checklist)
│   ├── [x] IDUpload component (dropzone + status display)
│   ├── [x] ReferencesList component (list with status badges)
│   ├── [x] AddReferenceForm component (form with validation)
│   ├── [x] VoiceVerification component (call initiation UI)
│   ├── [x] Verification page (/crew/verification)
│   └── [x] Dashboard verification card (compact progress view)
├── [x] Recruiter verification management UI
│   ├── [x] Verification queue page (/verification)
│   │   ├── [x] Filter tabs: All / ID Documents / References / Voice
│   │   ├── [x] Pending ID documents with candidate info
│   │   ├── [x] Pending references with referee details
│   │   └── [x] Pending voice verifications
│   ├── [x] IDReviewModal component
│   │   ├── [x] Document preview with zoom/rotate
│   │   ├── [x] Candidate name matching
│   │   ├── [x] Approve/Reject workflow
│   │   └── [x] Rejection reason dropdown + notes
│   ├── [x] ReferenceVerifyModal component
│   │   ├── [x] Reference details display
│   │   ├── [x] Verification method selection
│   │   ├── [x] Star rating input
│   │   ├── [x] Would rehire question
│   │   ├── [x] Feedback from reference field
│   │   └── [x] Internal notes field
│   ├── [x] VerificationSection component (for candidate detail page)
│   │   ├── [x] Tier badge + progress bar
│   │   ├── [x] Verification checklist
│   │   └── [x] Quick action buttons
│   └── [x] GET /api/verification/pending endpoint
│       ├── [x] Returns pending ID docs, references, voice
│       └── [x] Filter by type query param
├── [~] Vapi voice verification integration (deferred - not needed at this stage)
└── [x] Candidate card verification badge (already exists)

### Sprint 21-22: Billing & Subscriptions

**Goal**: Enable revenue through subscription plans and placement fee tracking

**Tasks**:
├── [x] Billing database infrastructure
│   ├── [x] Migration: 010_billing.sql
│   ├── [x] subscription_plans table (Free, Pro, Enterprise)
│   ├── [x] agency_subscriptions table (links agencies to plans)
│   ├── [x] invoices table with invoice_items
│   ├── [x] payments table (payment history)
│   ├── [x] placement_fees table (track platform cut)
│   ├── [x] RLS policies for agency access
│   ├── [x] Admin policies for full access
│   └── [x] generate_invoice_number() function
├── [x] TypeScript types (packages/database/types.ts)
│   ├── [x] BillingCycle, SubscriptionStatus, InvoiceStatus, PaymentStatus
│   ├── [x] SubscriptionPlan, AgencySubscription interfaces
│   ├── [x] Invoice, InvoiceItem, Payment interfaces
│   ├── [x] PlacementFee, BillingAddress interfaces
│   └── [x] SubscriptionUsage, BillingOverview helpers
├── [x] Organizations table billing fields
│   └── [x] Added: billing_email, billing_name, billing_address, vat_number
├── [x] Stripe integration (apps/web/lib/stripe/)
│   ├── [x] Stripe client setup (client.ts)
│   ├── [x] Customer management (customers.ts)
│   ├── [x] Subscription lifecycle (subscriptions.ts)
│   │   ├── [x] createSubscription, cancelSubscription, resumeSubscription
│   │   ├── [x] updateSubscription, getSubscription
│   │   └── [x] syncSubscriptionFromStripe
│   ├── [x] Checkout session (checkout.ts)
│   │   ├── [x] createCheckoutSession (for subscriptions)
│   │   ├── [x] createInvoiceCheckoutSession (for one-time payments)
│   │   └── [x] handleCheckoutComplete
│   ├── [x] Invoice management (invoices.ts)
│   │   ├── [x] syncInvoiceFromStripe, getInvoices, getInvoice
│   │   ├── [x] sendInvoice, voidInvoice
│   │   └── [x] handleInvoicePaid, handleInvoicePaymentFailed
│   ├── [x] Placement fees (placement-fees.ts)
│   │   ├── [x] createPlacementFee, getPendingFees, getPlacementFees
│   │   ├── [x] invoicePendingFees, waivePlacementFee
│   │   └── [x] getFeeSummary
│   └── [x] Index re-exports (index.ts)
├── [x] Webhook handler (apps/web/app/api/webhooks/stripe/route.ts)
│   ├── [x] Signature verification
│   ├── [x] customer.subscription.created/updated/deleted
│   ├── [x] invoice.created/updated/finalized/paid/payment_failed
│   ├── [x] payment_intent.succeeded/payment_failed
│   └── [x] checkout.session.completed
├── [x] Billing API routes (apps/web/app/api/billing/)
│   ├── [x] GET /api/billing/plans - list public plans
│   ├── [x] GET /api/billing/subscription - get current subscription + usage
│   ├── [x] POST /api/billing/subscribe - create checkout session
│   ├── [x] POST /api/billing/change-plan - change plan with proration
│   ├── [x] POST /api/billing/cancel - cancel subscription
│   ├── [x] POST /api/billing/reactivate - reactivate pending cancellation
│   ├── [x] POST /api/billing/portal - create Stripe customer portal
│   ├── [x] GET /api/billing/invoices - list invoices
│   ├── [x] GET /api/billing/invoices/[id] - invoice detail
│   └── [x] GET/POST /api/billing/payment-method - manage payment methods
├── [x] Admin billing API routes (apps/web/app/api/admin/billing/)
│   ├── [x] GET /api/admin/billing/placement-fees - list all fees
│   ├── [x] POST /api/admin/billing/placement-fees - create invoice for fees
│   └── [x] GET /api/admin/billing/stats - MRR, ARR, revenue stats
├── [x] Zod validation schemas (lib/validations/billing.ts)
│   ├── [x] subscribeSchema, changePlanSchema, cancelSubscriptionSchema
│   ├── [x] invoicesQuerySchema, portalSessionSchema
│   └── [x] createPlacementFeeInvoiceSchema, billingStatsQuerySchema
├── [x] Billing UI (apps/web/app/settings/billing/)
│   ├── [x] page.tsx - main billing dashboard with real data
│   │   ├── [x] CurrentPlanCard component (shows subscription + features)
│   │   ├── [x] UsageCard component (candidates, jobs, placements, pending fees)
│   │   ├── [x] PaymentMethodCard component (card/SEPA display, update via Stripe)
│   │   ├── [x] InvoiceTable component (recent invoices with download)
│   │   └── [x] CancelSubscriptionModal component (reason collection, confirmation)
│   ├── [x] plans/page.tsx - plan selection / upgrade page
│   │   ├── [x] Monthly/yearly billing toggle
│   │   ├── [x] PlanCard component (features, pricing, CTA)
│   │   ├── [x] ChangePlanModal component (proration preview)
│   │   └── [x] FAQ section
│   ├── [x] invoices/page.tsx - full invoice history
│   │   ├── [x] Status filtering (all, paid, pending, draft, void)
│   │   ├── [x] Pagination
│   │   ├── [x] Download PDF and view online buttons
│   │   └── [x] Summary stats
│   ├── [x] Billing components (apps/web/components/billing/)
│   │   ├── [x] CurrentPlanCard.tsx
│   │   ├── [x] UsageCard.tsx
│   │   ├── [x] PaymentMethodCard.tsx
│   │   ├── [x] InvoiceTable.tsx
│   │   ├── [x] PlanCard.tsx
│   │   ├── [x] ChangePlanModal.tsx
│   │   ├── [x] CancelSubscriptionModal.tsx
│   │   └── [x] index.ts (re-exports)
│   ├── [x] Connected to API endpoints
│   ├── [x] Plan upgrade/downgrade flow
│   ├── [x] Invoice download
│   └── [x] Payment method management (via Stripe portal)
├── [x] Agency Partner Program waitlist page (apps/web/app/(public)/pricing/)
│   ├── [x] page.tsx - Waitlist page with email capture (replaces premature pricing)
│   ├── [x] layout.tsx - SEO metadata for waitlist
│   ├── [x] PublicHeader component (nav: Jobs, For Agencies)
│   ├── [x] PublicFooter component (shared footer)
│   ├── [x] Updated /join page nav (Jobs link instead of Pricing)
│   └── [~] Pricing components kept for Phase 4 launch:
│       ├── [x] PricingToggle, PricingCard, FeatureComparisonTable, PricingFAQ
│       └── [ ] Full pricing page deferred until agency network launch
└── [x] Placement fee tracking
    ├── [x] createPlacementFee() function (lib/stripe/placement-fees.ts)
    ├── [x] getPendingFees(), getPlacementFees(), getFeeSummary()
    ├── [x] invoicePendingFees() - create invoice for pending fees
    ├── [x] waivePlacementFee() - admin waive fee
    ├── [x] Admin API: GET/POST /api/admin/billing/placement-fees
    ├── [x] Auto-create placement_fee on placement confirmation
    │       ├── [x] Added placementValue field to confirmation schema
    │       ├── [x] Called createPlacementFee() in /api/client/placements POST
    │       ├── [x] Added trackReferralPlacement() for referral bonus tracking
    │       └── [x] Added increment_agency_placements() for subscription usage
    ├── [x] Monthly invoice generation (cron/scheduled job)
    │       ├── [x] Vercel cron configured (1st of month at 6am)
    │       ├── [x] /api/cron/invoice-fees endpoint
    │       ├── [x] /api/admin/billing/invoice-job endpoint (manual trigger)
    │       └── [x] lib/billing/monthly-invoice-job.ts utility functions
    └── [ ] Admin dashboard UI for fee management

### Sprint 22-23: Client Portal - INPUT (Low Priority)

**Tasks**:
├── [ ] Brief submission form (polish)
├── [ ] Chat with recruiter
└── [ ] Invoice viewing for clients

### Sprint 23-26: Network & Scale

**Tasks**:
├── [ ] Multi-agency support
├── [ ] Collaboration system
├── [ ] Fee splitting
├── [ ] Agency onboarding
└── [ ] Public launch

---

## Updated Success Metrics

### Week 8 (Recruiter Dashboard Done)
- [ ] You process briefs 50% faster
- [ ] Same-day shortlists possible
- [ ] 100+ candidates in database
- [ ] AI parses 90% of briefs correctly

### Week 12 (Candidate Acquisition)
- [ ] Public job board live
- [ ] 50+ jobs posted
- [ ] 100+ candidate applications
- [ ] Candidates finding you via Google

### Week 16 (Client Portal OUTPUT)
- [ ] 10+ clients using portal
- [ ] Clients give feedback without calling you
- [ ] 50% reduction in "any updates?" calls

### Week 26 (Full Platform)
- [ ] 200+ active jobs
- [ ] 2,000+ candidates
- [ ] 20+ partner agencies
- [ ] €50K+ monthly platform revenue