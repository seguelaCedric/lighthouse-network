---
skill_name: recruitment-ux-designer
version: 1.0.0
description: UI/UX design expertise for recruitment agency software, covering interface design patterns, user research methods, interaction design, and industry-specific user experience requirements for ATS/CRM platforms.
author: Cedric
created: 2025-01-03
---

# Recruitment Agency UI/UX Design Skill

## Overview
This skill provides Claude with expert-level UI/UX design knowledge for recruitment agency software, specifically optimized for ATS/CRM platforms serving yacht crew and luxury household staff sectors. It covers design systems, user research, interaction patterns, accessibility, and conversion optimization.

## Core UX Principles for Recruitment Software

### Speed & Efficiency First
Recruiters are power users who perform repetitive tasks hundreds of times daily. Every extra click, page load, or modal costs productivity.

**Design Principles:**
- **Minimize Clicks**: Common actions should be 1-2 clicks maximum
- **Keyboard Shortcuts**: Power users should never need a mouse (Cmd+K for search, Tab navigation, etc.)
- **Bulk Actions**: Multi-select and bulk operations for everything (email, status updates, exports)
- **Contextual Actions**: Show relevant actions based on current context without navigation
- **Smart Defaults**: Pre-fill forms based on context and user history
- **Persistent Filters**: Remember search filters and view preferences per user

### Information Density vs. Scannability
Recruiters need to see lots of information quickly but must be able to scan it efficiently.

**Design Principles:**
- **Progressive Disclosure**: Show summary, reveal details on demand
- **Visual Hierarchy**: Use typography, color, and spacing to create clear hierarchy
- **Data Visualization**: Use charts/graphs for metrics, not just tables
- **Scannable Lists**: Left-align text, use consistent spacing, highlight key information
- **Color Coding**: Status indicators, priority levels, match scores
- **White Space**: Enough breathing room to prevent cognitive overload

### Mobile Responsiveness
While recruiters work primarily on desktop, clients and candidates increasingly use mobile.

**Design Principles:**
- **Desktop-First for Recruiters**: Optimize primary workflows for large screens
- **Mobile-First for Candidates**: Application forms and portals must work perfectly on mobile
- **Responsive Breakpoints**: 320px (mobile), 768px (tablet), 1024px (desktop), 1440px+ (large desktop)
- **Touch Targets**: Minimum 44x44px for mobile interactive elements
- **Simplified Mobile UX**: Reduce features to core tasks on mobile

## User Personas & Journey Maps

### Primary Personas

#### 1. Sarah - Senior Recruiter (Power User)
**Demographics:** 35 years old, 8 years recruitment experience, works 60+ hours/week during season  
**Goals:** Place high-value candidates quickly, maintain client relationships, maximize commission  
**Pain Points:** Time wasted on admin, poor candidate quality in database, slow search  
**Tech Proficiency:** High - uses keyboard shortcuts, multiple monitors, Chrome extensions  
**Key Workflows:** Search → shortlist → contact → submit → track → place  
**Success Metrics:** Placements per month, time-to-fill, client satisfaction  

**Design Priorities:**
- Lightning-fast search with keyboard navigation
- One-click actions for common tasks
- Multi-monitor support (candidate list + details + email)
- Customizable dashboard with KPIs
- Minimal page loads (SPA with infinite scroll)

#### 2. Marcus - Junior Recruiter (Learning User)
**Demographics:** 24 years old, 6 months experience, eager to prove himself  
**Goals:** Learn the job, build candidate network, make first placements  
**Pain Points:** Overwhelmed by complexity, doesn't know best practices, makes mistakes  
**Tech Proficiency:** Medium - comfortable with web apps, needs guidance  
**Key Workflows:** Find similar past placements → replicate process → ask for help  
**Success Metrics:** Learning speed, error rate, first placement timeline  

**Design Priorities:**
- Onboarding tooltips and contextual help
- "Similar placements" suggestions
- Undo functionality for mistakes
- Templates and examples built in
- Progress indicators for multi-step workflows

#### 3. Jennifer - Yacht Captain (Client)
**Demographics:** 48 years old, manages €50M yacht, limited time between crossings  
**Goals:** Find qualified crew quickly, minimal admin burden, quality over quantity  
**Pain Points:** Too many unqualified submissions, delayed responses, lack of transparency  
**Tech Proficiency:** Low-Medium - uses iPad, prefers simple interfaces  
**Key Workflows:** Submit job order → review candidates → provide feedback → hire  
**Success Metrics:** Quality of candidates, response speed, placement success  

**Design Priorities:**
- Simple, clean client portal
- Visual candidate profiles (photos, key certs visible)
- One-click approve/reject with optional feedback
- Mobile-optimized (iPad primary device)
- Minimal text, more visual information

#### 4. Alex - Deckhand Candidate
**Demographics:** 27 years old, looking for first yacht job, uses phone for everything  
**Goals:** Get noticed by agencies, keep profile updated, respond quickly to opportunities  
**Pain Points:** Complex forms, uploading documents from phone, agencies don't respond  
**Tech Proficiency:** High on mobile, low on desktop  
**Key Workflows:** Create profile → upload certs → apply for jobs → respond to outreach  
**Success Metrics:** Profile completion, response rate, interview invitations  

**Design Priorities:**
- Mobile-first design (90% use smartphones)
- Camera integration for document upload
- Progress-saving (complete profile over multiple sessions)
- Push notifications for new opportunities
- Simple, visual application process

### User Journey Maps

#### Recruiter: Finding Candidates for New Job Order
```
STAGE 1: Receive Job Order
Touchpoint: Email from client or internal team
Emotion: 😐 Neutral (routine task)
Actions: Read requirements, note key details
Pain Points: Unclear requirements, missing information
Opportunities: Auto-parse job order emails, suggest clarifying questions

STAGE 2: Search Database
Touchpoint: Search interface in ATS
Emotion: 😤 Frustrated (if search is slow/poor results)
Actions: Enter keywords, apply filters, scan results
Pain Points: Too many irrelevant results, slow search, rigid filters
Opportunities: AI-powered semantic search, saved searches, suggested filters

STAGE 3: Review Candidates
Touchpoint: Candidate profile pages
Emotion: 🤔 Focused (evaluating fit)
Actions: Check certifications, review experience, assess availability
Pain Points: Missing information, outdated profiles, too much scrolling
Opportunities: Match score with explanation, highlight relevant experience, flag missing info

STAGE 4: Shortlist & Contact
Touchpoint: Email/SMS communication tools
Emotion: ⏱️ Time pressure (need to move fast)
Actions: Send availability check, schedule calls, gather additional info
Pain Points: Manual email composition, tracking responses, follow-up reminders
Opportunities: Templates with personalization, automated follow-up, response tracking

STAGE 5: Submit to Client
Touchpoint: Client portal or email
Emotion: 🤞 Hopeful (want client approval)
Actions: Write candidate summaries, attach CVs, send to client
Pain Points: Formatting CVs for client, writing summaries, tracking submissions
Opportunities: Auto-generate summaries, standardized CV format, submission tracking

STAGE 6: Track Progress
Touchpoint: Pipeline/kanban view
Emotion: 😰 Anxious (waiting for feedback)
Actions: Check for client responses, follow up, update status
Pain Points: Client delays, no visibility into client review process, manual status updates
Opportunities: Client activity tracking, automated reminders, status auto-updates
```

## Design Patterns & Components

### Navigation Architecture

#### Top-Level Navigation (Horizontal Tab Bar)
```
[🏠 Dashboard] [👥 Candidates] [💼 Jobs] [🏢 Clients] [📊 Reports] [⚙️ Settings]
                    ↓ Active
            [Search] [Lists] [Add New] [Import]
```

**Rationale:**
- Single-level navigation for speed
- Most-used sections prominent
- Secondary actions in contextual menus
- Global search always accessible (Cmd+K)

#### Sidebar Navigation (for complex sections)
```
┌─────────────────┬────────────────────────┐
│ Candidates      │ [Search: Type to find] │
│ ─────────────── │                        │
│ 🔍 All          │ Candidate List         │
│ ⭐ My Pool      │                        │
│ 🚢 Available    │ [Filters applied: 2]   │
│ 📋 Lists (12)   │                        │
│   └ Deckhands   │                        │
│   └ Chief Stews │                        │
│ 🔖 Saved (8)    │                        │
│                 │                        │
│ + New Search    │                        │
└─────────────────┴────────────────────────┘
```

**Rationale:**
- Quick access to saved views
- Visual indication of active filters
- Persistent sidebar with collapsible option
- List organization for categorization

### Search Interface Design

#### Advanced Search Pattern
```
┌────────────────────────────────────────────────────┐
│ 🔍  "Chief Stewardess, 40m+, Mediterranean"       │
│                                          [Search]  │
├────────────────────────────────────────────────────┤
│ Smart Filters:                                     │
│ ☑ Available Now (243)                             │
│ ☐ Has Schengen (189)                              │
│ ☐ Rotation Preferred (67)                         │
│                                                    │
│ + Add Filter ▼                                    │
│   ├ Certifications                                │
│   ├ Location                                      │
│   ├ Salary Range                                  │
│   ├ Experience Level                              │
│   └ Last Activity                                 │
└────────────────────────────────────────────────────┘
```

**Features:**
- Natural language search with AI understanding
- Smart filter suggestions based on query
- Show result count per filter
- Collapsible advanced filters for power users
- Save search functionality

#### Search Results Layout
```
┌──────────────────────────────────────────────────────┐
│ 47 candidates found | Sort by: Match Score ▼        │
├──────────────────────────────────────────────────────┤
│ [Photo] Sarah Johnson              Match: 94% 🟢     │
│         Chief Stewardess | 8 yrs exp               │
│         ✓ STCW  ✓ ENG1  ✓ Schengen                 │
│         📍 Antibes • 💰 €5,500/mo • 🚢 50-70m      │
│         Available: Immediately                      │
│         [👁 View] [✉ Email] [⭐ Shortlist]          │
├──────────────────────────────────────────────────────┤
│ [Photo] Michael Chen               Match: 89% 🟢     │
│         Chef de Partie | 5 yrs exp                 │
│         ✓ STCW  ✓ ENG1  ⚠ Visa expiring March     │
│         📍 Monaco • 💰 €4,200/mo • 🚢 40m+         │
│         Available: 2 weeks notice                   │
│         [👁 View] [✉ Email] [⭐ Shortlist]          │
└──────────────────────────────────────────────────────┘
```

**Design Decisions:**
- Match score prominent with color coding (green >85%, yellow 70-85%, red <70%)
- Key information scannable at a glance
- Icons for certifications (visual recognition)
- Location, salary, yacht size inline
- Quick actions without opening profile
- Photos help with recognition

### Candidate Profile Page

#### Layout Structure
```
┌─────────────────────────────────────────────────────┐
│ ← Back to Search                      [Edit Profile]│
├───────────┬─────────────────────────────────────────┤
│  [Photo]  │ SARAH JOHNSON                           │
│  150x150  │ Chief Stewardess                        │
│           │ ⭐⭐⭐⭐⭐ 5.0 (12 placements)            │
│           │ 📧 sarah.j@email.com                    │
│ [Upload]  │ 📱 +33 6 12 34 56 78                    │
│           │ 📍 Antibes, France                      │
│  Status:  │ 🟢 Available Immediately                │
│  🟢 Active│                                         │
│           │ [✉ Send Email] [📞 Call] [⭐ Add to List]│
├───────────┴─────────────────────────────────────────┤
│ [Overview] [Experience] [Certifications] [Documents]│
│ [Applications] [Notes] [Activity]                   │
├──────────────────────────────────────────────────────┤
│ OVERVIEW                                             │
│                                                      │
│ Preferences                                          │
│ • Yacht Size: 50-70m                                │
│ • Contract Type: Permanent                          │
│ • Rotation: Open to 2:1                             │
│ • Salary: €5,500/month                              │
│                                                      │
│ Key Qualifications                                   │
│ • 8 years chief stew experience                     │
│ • Wine certification (WSET Level 2)                 │
│ • Interior management up to 8 crew                  │
│ • Charter experience                                │
│                                                      │
│ Certifications                    Status            │
│ ✅ STCW Basic Safety              Valid: 2027       │
│ ✅ ENG1 Medical                   Valid: 2026       │
│ ✅ Schengen Visa                  Valid: 2028       │
│ ⚠️  Food Safety Level 2           Expires: Mar 2025│
│                                                      │
│ Languages                                            │
│ • English: Native                                   │
│ • French: Conversational                            │
│ • Italian: Basic                                    │
└──────────────────────────────────────────────────────┘
```

**Design Decisions:**
- Left sidebar for photo and quick contact info
- Tabbed navigation for different sections
- Status prominently displayed with color coding
- Quick action buttons always visible
- Certifications with expiry warnings
- Progressive disclosure (tabs prevent overwhelming)

### Job Order Management

#### Job Board View (Kanban)
```
┌─────────────┬─────────────┬─────────────┬──────────┐
│ Open (12)   │ Sourcing (8)│ Submitted(5)│ Filled(2)│
├─────────────┼─────────────┼─────────────┼──────────┤
│ Chief Stew  │ Deckhand    │ Captain     │ Chef     │
│ 60m Motor   │ 45m Sail    │ 50m Motor   │ 40m      │
│ Monaco      │ Antibes     │ Caribbean   │ Med      │
│ 🔴 Urgent   │ 🟡 Normal   │ 🟢 Standard │ ✅ Done  │
│ 2 days ago  │ 1 week ago  │ 3 weeks ago │ Placed   │
│             │             │             │          │
│ 3 candidates│ 12 candidates│ 5 shortlist│          │
│ [View]      │ [View]      │ [View]      │ [View]   │
├─────────────┼─────────────┼─────────────┼──────────┤
│ Interior    │ Engineer    │ Bosun       │          │
│ Manager...  │ 70m...      │ 55m...      │          │
└─────────────┴─────────────┴─────────────┴──────────┘
```

**Features:**
- Drag-and-drop between stages
- Visual indication of urgency
- Candidate count per job
- Quick view on hover
- Color-coded priority

#### Job Order Detail Page
```
┌─────────────────────────────────────────────────────┐
│ ← Jobs                                [Edit] [Close]│
├─────────────────────────────────────────────────────┤
│ CHIEF STEWARDESS - 60M MOTOR YACHT                  │
│ Client: M/Y SERENITY • Location: Monaco             │
│ Posted: 2 days ago • Urgency: 🔴 High               │
│ Salary: €5,500-6,500/mo • Contract: Permanent       │
├─────────────────────────────────────────────────────┤
│ [Details] [Requirements] [Candidates] [Activity]    │
├─────────────────────────────────────────────────────┤
│ CANDIDATES (3 sourced, 0 submitted)                 │
│                                                      │
│ AI Suggested Matches (94% avg match)                │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Sarah Johnson           Match: 96% 🟢           │ │
│ │ Chief Stew • 8 yrs • Available now              │ │
│ │ Why matched: Experience level, yacht size pref, │ │
│ │ certifications, availability                     │ │
│ │ [✉ Contact] [➕ Add to Shortlist]               │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ Manually Added                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Emma Williams          Match: 87% 🟢            │ │
│ │ [Status: Contacted - Awaiting response]          │ │
│ │ Last contact: 1 day ago                         │ │
│ │ [Send Reminder] [Remove]                        │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ [+ Add Candidates] [🔍 Search Database]             │
└─────────────────────────────────────────────────────┘
```

**Features:**
- AI match suggestions with explanations
- Clear status tracking for each candidate
- Quick actions contextual to status
- Easy to add more candidates
- Match scores help prioritize

### Dashboard Design

#### Recruiter Dashboard
```
┌─────────────────────────────────────────────────────┐
│ Good morning, Sarah 👋                    Jan 3, 2025│
│                                                      │
│ Quick Stats (This Month)                            │
│ ┌───────────┬───────────┬───────────┬──────────┐   │
│ │ Active    │ Submitted │ Interviews│ Placements│   │
│ │ Jobs      │ Candidates│ Scheduled │          │   │
│ │    8      │    23     │     5     │    2     │   │
│ │  +2 ↑    │  +5 ↑     │   +1 ↑   │  +1 ↑   │   │
│ └───────────┴───────────┴───────────┴──────────┘   │
│                                                      │
│ Today's Tasks (5)                                   │
│ ☐ Follow up with Captain Smith (Interview feedback)│
│ ☐ Submit 3 deckhands for M/Y AURORA                │
│ ☐ Reference check for Emma Williams                │
│ ☐ Update job order - Chief Engineer Monaco         │
│ ☐ Call client - M/Y SERENITY placement terms       │
│                                                      │
│ Urgent Jobs (2)                                     │
│ 🔴 Chief Stew - M/Y SERENITY (2 days, 0 submitted) │
│ 🔴 Captain - M/Y PHOENIX (5 days, 3 submitted)     │
│                                                      │
│ Recent Activity                                     │
│ • Sarah Johnson viewed your message (5 min ago)    │
│ • New application: Michael Chen → Deckhand Monaco  │
│ • Client feedback: Approved Emma Williams interview│
│                                                      │
│ Pipeline Performance (Last 30 Days)                 │
│ [Bar Chart: Sourced → Submitted → Interview → Offer]│
│ Conversion rates: 45% → 30% → 60%                  │
└─────────────────────────────────────────────────────┘
```

**Design Priorities:**
- Glanceable metrics with trend indicators
- Actionable task list (not just information)
- Urgent items highlighted
- Recent activity for awareness
- Visual pipeline performance

### Forms & Input Patterns

#### Smart Form Design Principles
```
❌ BAD: Traditional Form              ✅ GOOD: Smart Form
┌────────────────────────┐          ┌────────────────────────┐
│ First Name: [_______] │          │ Full Name              │
│ Last Name:  [_______] │          │ [Sarah Johnson_____]   │
│ Email:      [_______] │          │                        │
│ Phone:      [_______] │          │ Email                  │
│ Country:    [▼]       │          │ [sarah@example.com_]   │
│ State:      [▼]       │          │ ✓ Valid email          │
│ City:       [_______] │          │                        │
│ Position:   [▼]       │          │ Phone                  │
│                        │          │ [+33 6 12 34 56 78_]   │
│ [Submit]               │          │ 📍 Detected: France    │
│                        │          │                        │
└────────────────────────┘          │ Position               │
                                    │ [Chief Ste______]      │
                                    │ 💡 Did you mean:       │
                                    │   • Chief Stewardess   │
                                    │   • Chief Stew         │
                                    │                        │
                                    │ [Continue →]           │
                                    └────────────────────────┘
```

**Smart Form Features:**
- Combine related fields (full name vs. first/last)
- Real-time validation with helpful messages
- Auto-detection (country from phone number)
- Autocomplete suggestions
- Progress indication for multi-step forms
- Save draft automatically

#### File Upload Pattern
```
┌────────────────────────────────────────────────────┐
│ Upload Certificates                                 │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │  📄 Drag files here or click to browse      │   │
│ │                                              │   │
│ │  Accepted: PDF, JPG, PNG (max 10MB each)    │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ Uploaded Documents:                                 │
│ ✅ STCW_Certificate.pdf (2.3 MB)    [View] [Delete]│
│    Recognized: STCW Basic Safety                   │
│    Expiry: Dec 2027 ✓                              │
│                                                     │
│ 🔄 ENG1_Medical.pdf (1.8 MB)        [View] [Delete]│
│    Processing... 45%                               │
│                                                     │
│ ❌ Passport_Scan.jpg (8.2 MB)       [View] [Delete]│
│    Could not extract expiry date                   │
│    [Enter manually: MM/YYYY ____]                  │
└────────────────────────────────────────────────────┘
```

**Features:**
- Drag-and-drop with fallback to click
- Clear file requirements
- Visual upload progress
- AI recognition of certificate types
- Auto-extract expiry dates
- Manual override for failed recognition

### Communication Interfaces

#### Email Composition
```
┌────────────────────────────────────────────────────┐
│ ✉ New Email to: Sarah Johnson                     │
├────────────────────────────────────────────────────┤
│ Template: [Availability Check ▼]                  │
│                                                     │
│ Subject: Chief Stew Position - M/Y SERENITY        │
│                                                     │
│ Hi Sarah,                                          │
│                                                     │
│ I hope this message finds you well. I have an     │
│ exciting opportunity that matches your profile:    │
│                                                     │
│ [Insert Job Details]                               │
│ • Position: Chief Stewardess                       │
│ • Yacht: 60m Motor Yacht                          │
│ • Location: Monaco (Mediterranean season)         │
│ • Salary: €6,000/month                            │
│ • Start: Immediate                                │
│                                                     │
│ Given your experience and current availability,    │
│ I think you'd be perfect for this role.            │
│                                                     │
│ Are you available for a quick call this week to    │
│ discuss?                                           │
│                                                     │
│ Best regards,                                      │
│ {{Your Name}}                                      │
│                                                     │
│ [💾 Save as Draft] [📅 Schedule] [📤 Send Now]    │
│                                                     │
│ Quick Insert: [Job Details] [Candidate Name]      │
│               [Your Calendar Link] [Signature]     │
└────────────────────────────────────────────────────┘
```

**Features:**
- Template library with personalization
- Auto-populate job details
- Schedule send for optimal timing
- Save drafts automatically
- Quick insert for common elements

#### SMS/WhatsApp Quick Contact
```
┌────────────────────────────────────┐
│ 💬 Quick Message: Sarah Johnson   │
├────────────────────────────────────┤
│ [📧 Email] [💬 SMS] [📱 WhatsApp] │
├────────────────────────────────────┤
│ Template: Quick Check-in ▼         │
│                                    │
│ Hi Sarah! Quick question - are    │
│ you available for a Chief Stew    │
│ position starting next week in    │
│ Monaco? €6k/month. Let me know!   │
│                                    │
│ Characters: 142/160                │
│                                    │
│ [Send via SMS] [Send via WhatsApp]│
└────────────────────────────────────┘
```

**Features:**
- Character count for SMS
- Multi-channel sending (SMS/WhatsApp)
- Brief templates for mobile
- Send from candidate profile

### Data Visualization & Reports

#### Placement Funnel
```
┌────────────────────────────────────────────────────┐
│ Placement Funnel (Last 30 Days)                    │
│                                                     │
│ Active Jobs (24) ████████████████████████ 100%    │
│                                                     │
│ Candidates Sourced (156) ██████████████ 650%      │
│                                                     │
│ Submitted to Clients (72) ███████ 300%            │
│                    │                                │
│                    │ 46% conversion                 │
│                    ↓                                │
│ Interviews (33) ███ 138%                           │
│                    │                                │
│                    │ 46% conversion                 │
│                    ↓                                │
│ Offers (11) █ 46%                                  │
│                    │                                │
│                    │ 73% conversion                 │
│                    ↓                                │
│ Placements (8) ▌33%                                │
│                                                     │
│ Industry Benchmark: 5-8% job-to-placement rate     │
│ Your performance: 33% ⭐ Top 10% of recruiters     │
└────────────────────────────────────────────────────┘
```

**Design Decisions:**
- Visual funnel with percentages
- Conversion rates between stages
- Benchmark comparison
- Performance indicator
- Identify bottleneck stages

#### Time-to-Fill Analysis
```
┌────────────────────────────────────────────────────┐
│ Average Time to Fill: 18 days                     │
│                                                     │
│ By Position Type:                                  │
│ ┌────────────────────────────────────────────┐    │
│ │ Deckhand        ████████ 12 days           │    │
│ │ Stewardess      ████████████ 16 days       │    │
│ │ Chef            ████████████████ 21 days   │    │
│ │ Engineer        ████████████████████ 25 days│    │
│ │ Captain         ██████████████████████ 28 days│  │
│ └────────────────────────────────────────────┘    │
│                                                     │
│ Breakdown of Time Spent:                           │
│ • Sourcing: 6 days (33%)                          │
│ • Client Review: 8 days (44%)  ← Bottleneck       │
│ • Interviews: 3 days (17%)                        │
│ • Offer to Accept: 1 day (6%)                     │
│                                                     │
│ 💡 Recommendation: Automate client reminders       │
└────────────────────────────────────────────────────┘
```

**Features:**
- Clear average metric
- Breakdown by position type
- Identify bottlenecks
- Actionable recommendations

## Mobile Design Patterns

### Candidate Mobile App

#### Home Screen (Candidate)
```
┌─────────────────────┐
│   ≡  LIGHTHOUSE  🔔 │
├─────────────────────┤
│ Hi Alex 👋          │
│                     │
│ Profile Complete    │
│ ████████░░ 80%      │
│ [Complete Now →]    │
│                     │
│ ┌─────────────────┐ │
│ │ 🎯 New Match!   │ │
│ │ Deckhand        │ │
│ │ 45m Sail Yacht  │ │
│ │ Antibes         │ │
│ │ €3,200/mo       │ │
│ │ [View Details]  │ │
│ └─────────────────┘ │
│                     │
│ Recent Activity     │
│ • Your application  │
│   was viewed (2h)   │
│ • New message from  │
│   Sarah (5h)        │
│                     │
│ [Browse Jobs]       │
│ [My Applications]   │
│ [Messages]          │
└─────────────────────┘
```

**Design Priorities:**
- Card-based layout for mobile
- Large tap targets (min 44px)
- Progress indicators
- Notifications prominent
- Quick actions at bottom

#### Job Application Flow (Mobile)
```
Step 1/3: Basic Info    Step 2/3: Upload Docs   Step 3/3: Confirm
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ ●○○             │    │ ○●○             │    │ ○○●             │
│                 │    │                 │    │                 │
│ Applying for:   │    │ Upload CV       │    │ Review & Submit │
│ Deckhand        │    │                 │    │                 │
│ M/Y SERENITY    │    │ [📄 Take Photo] │    │ ✓ CV uploaded   │
│                 │    │ [📁 From Files] │    │ ✓ Certs uploaded│
│ Why you?        │    │                 │    │ ✓ Cover letter  │
│ [____________]  │    │ ✅ CV.pdf       │    │                 │
│ [____________]  │    │ (2.1 MB)        │    │ Available:      │
│ [____________]  │    │                 │    │ Immediately     │
│                 │    │ Certificates    │    │                 │
│ Available from: │    │ [+ Add Cert]    │    │ Salary:         │
│ [Immediately ▼] │    │                 │    │ €3,200/month    │
│                 │    │ ✅ STCW.pdf     │    │                 │
│                 │    │ ✅ ENG1.pdf     │    │ [Submit App] ✓  │
│ [Next →]        │    │ [Next →]        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Features:**
- Clear progress indicator
- One step per screen
- Large touch targets
- Camera integration for docs
- Review before submit

### Client Mobile Portal

#### Candidate Review (iPad)
```
┌───────────────────────────────────────────┐
│ ← Candidates for Chief Stew Position      │
├───────────────────────────────────────────┤
│ ┌───────┬─────────────────────────────┐   │
│ │[Photo]│ Sarah Johnson               │   │
│ │       │ 8 years experience          │   │
│ │       │ Match Score: 94% 🟢         │   │
│ ├───────┴─────────────────────────────┤   │
│ │ Key Highlights:                     │   │
│ │ ✅ STCW, ENG1, Schengen             │   │
│ │ ✅ Wine certified (WSET Level 2)    │   │
│ │ ✅ 60m+ yacht experience            │   │
│ │ ✅ Charter experience               │   │
│ │                                     │   │
│ │ [📄 View Full CV] [▶ Video Intro]  │   │
│ │                                     │   │
│ │ Previous Placements:                │   │
│ │ • M/Y AURORA (2020-2023)           │   │
│ │ • M/Y PHOENIX (2017-2020)          │   │
│ └─────────────────────────────────────┘   │
│                                            │
│ ┌──────────────────┬──────────────────┐   │
│ │ ❌ Not Suitable  │ ✅ Interview     │   │
│ │                  │                  │   │
│ └──────────────────┴──────────────────┘   │
│                                            │
│ 👈 Swipe for next candidate                │
└───────────────────────────────────────────┘
```

**Design Priorities:**
- Swipe navigation (Tinder-style)
- Visual hierarchy (photo → highlights → details)
- Clear binary actions (reject/approve)
- Video intro option
- Quick assessment mode

## Accessibility Standards

### WCAG 2.1 AA Compliance

#### Color Contrast Requirements
```
Text Size       Min Contrast Ratio
─────────────────────────────────
Body (16px)     4.5:1
Large (24px+)   3:1
Icons/Graphics  3:1

✅ Good Examples:
- #000000 text on #FFFFFF background (21:1)
- #2C3E50 text on #ECF0F1 background (8.2:1)
- #E74C3C button on #FFFFFF background (3.8:1)

❌ Bad Examples:
- #999999 text on #FFFFFF background (2.8:1)
- Light gray on white for body text
```

#### Keyboard Navigation
All interactive elements must be keyboard accessible:
- Tab: Move focus forward
- Shift+Tab: Move focus backward
- Enter/Space: Activate buttons/links
- Esc: Close modals/dropdowns
- Arrow keys: Navigate lists/menus
- Cmd+K: Global search

**Focus Indicators:**
```css
/* Clear, visible focus state */
:focus {
  outline: 3px solid #007AFF;
  outline-offset: 2px;
}

/* Never remove outline without replacement */
:focus:not(:focus-visible) {
  outline: none;
}

:focus-visible {
  outline: 3px solid #007AFF;
  outline-offset: 2px;
}
```

#### Screen Reader Support
```html
<!-- Semantic HTML -->
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/candidates">Candidates</a></li>
  </ul>
</nav>

<!-- ARIA labels for icon buttons -->
<button aria-label="Search candidates">
  <svg>...</svg>
</button>

<!-- Status messages -->
<div role="status" aria-live="polite">
  3 new candidates matched your search
</div>

<!-- Form labels -->
<label for="candidate-name">Full Name</label>
<input id="candidate-name" type="text" required 
       aria-required="true">
```

### Performance Accessibility

#### Loading States
```
┌────────────────────────────────┐
│ Loading candidates...          │
│ ████████░░░░░░░░░░░░░░ 35%    │
│                                │
│ [Skeleton UI showing structure]│
│ ┌──────┬──────────────┐        │
│ │ ░░░░ │ ░░░░░░░░░░░ │        │
│ │ ░░░░ │ ░░░░░░░░    │        │
│ └──────┴──────────────┘        │
└────────────────────────────────┘
```

**Best Practices:**
- Show loading skeletons (not just spinners)
- Provide progress indication for long operations
- Allow cancellation of long-running tasks
- Optimistic UI updates where safe

## Design System & Component Library

### Color Palette

#### Primary Colors
```
Brand Blue:     #007AFF  (Primary actions, links)
Success Green:  #34C759  (Positive actions, success states)
Warning Orange: #FF9500  (Warnings, medium priority)
Error Red:      #FF3B30  (Errors, urgent items)
Info Purple:    #5856D6  (Information, neutral highlights)
```

#### Neutral Grays
```
Gray 900: #1C1C1E  (Primary text)
Gray 700: #3A3A3C  (Secondary text)
Gray 500: #8E8E93  (Tertiary text, disabled)
Gray 300: #C7C7CC  (Borders, dividers)
Gray 100: #F2F2F7  (Backgrounds, cards)
Gray 50:  #FAFAFA  (Page background)
```

#### Semantic Colors
```
Match Score High:    #34C759  (85-100%)
Match Score Medium:  #FF9500  (70-84%)
Match Score Low:     #FF3B30  (<70%)

Status Available:    #34C759
Status Busy:         #FF9500
Status Unavailable:  #8E8E93

Priority Urgent:     #FF3B30
Priority High:       #FF9500
Priority Normal:     #007AFF
Priority Low:        #8E8E93
```

### Typography

#### Font Stack
```
Primary: -apple-system, BlinkMacSystemFont, "Segoe UI", 
         Roboto, "Helvetica Neue", Arial, sans-serif

Monospace: "SF Mono", Monaco, "Cascadia Code", 
           "Courier New", monospace
```

#### Type Scale
```
Heading 1:  32px / 40px line-height, Semi-bold (600)
Heading 2:  24px / 32px line-height, Semi-bold (600)
Heading 3:  20px / 28px line-height, Semi-bold (600)
Heading 4:  16px / 24px line-height, Semi-bold (600)

Body Large: 16px / 24px line-height, Regular (400)
Body:       14px / 20px line-height, Regular (400)
Body Small: 12px / 16px line-height, Regular (400)

Caption:    11px / 16px line-height, Regular (400)
```

### Spacing System
```
Space Scale (8px base unit):
xs:   4px   (0.5 × base)
sm:   8px   (1 × base)
md:   16px  (2 × base)
lg:   24px  (3 × base)
xl:   32px  (4 × base)
2xl:  48px  (6 × base)
3xl:  64px  (8 × base)

Usage:
- xs: Icon padding, tight spacing
- sm: Form element spacing, list item padding
- md: Card padding, section spacing
- lg: Component margins, page sections
- xl: Major sections, modal padding
- 2xl: Page margins
- 3xl: Hero sections
```

### Component States

#### Button States
```
Primary Button:
Default:  bg-#007AFF, text-white
Hover:    bg-#0051D5 (darker)
Active:   bg-#003D99 (even darker)
Disabled: bg-#8E8E93, text-#C7C7CC
Focus:    outline-#007AFF, 3px

Secondary Button:
Default:  bg-transparent, border-#007AFF, text-#007AFF
Hover:    bg-#007AFF10 (10% opacity)
Active:   bg-#007AFF20 (20% opacity)
```

#### Input States
```
Default:  border-#C7C7CC, bg-white
Focus:    border-#007AFF, outline-#007AFF 3px
Error:    border-#FF3B30, text-#FF3B30
Success:  border-#34C759, icon-#34C759
Disabled: bg-#F2F2F7, text-#8E8E93
```

## Interaction Patterns

### Micro-interactions

#### Success Feedback
```
Action: Candidate added to shortlist
Visual: ✅ Checkmark animation (scale + fade in)
Haptic: Light impact (on mobile)
Toast: "Sarah Johnson added to shortlist" (3s)
Undo:   [Undo] button in toast
```

#### Error Feedback
```
Action: Failed to send email
Visual: ❌ Shake animation on email button
Sound:  Error tone (optional, user preference)
Alert:  Inline error message with reason
Retry:  [Try Again] button
```

#### Loading Feedback
```
Action: Searching database
Visual: Progress bar with percentage
Text:   "Searching 12,487 candidates..."
Skeleton: Gray placeholder content
Cancel: [Cancel Search] always available
```

### Drag & Drop Patterns

#### Candidate to Job Order
```
Dragging:
┌─────────────────┐
│ Sarah Johnson   │  ← Cursor grabbing
│ Chief Stew      │     Semi-transparent
└─────────────────┘

Drop Zone Active:
┌─────────────────────────────┐
│ Chief Stew - M/Y SERENITY   │
│ ┌─────────────────────────┐ │  ← Highlighted border
│ │ Drop here to add        │ │
│ │ to this job order       │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘

Success:
✅ Checkmark animation
"Sarah Johnson added to Chief Stew position"
```

### Contextual Menus

#### Right-Click Context Menu
```
Right-click on candidate row:
┌─────────────────────────┐
│ 👁️  View Full Profile   │
│ ✉️  Send Email          │
│ 📱 Send SMS             │
│ ⭐ Add to List          │
│ ──────────────────────  │
│ 📋 Copy Email           │
│ 📋 Copy Phone           │
│ ──────────────────────  │
│ 🗑️  Archive             │
└─────────────────────────┘
```

## Responsive Breakpoints

### Layout Adaptations

#### Desktop (1440px+)
- Three-column layout (sidebar + list + detail)
- Full navigation visible
- Dense information display
- Hover states prominent

#### Laptop (1024-1439px)
- Two-column layout (list + detail, sidebar collapsible)
- Full navigation with some items in dropdowns
- Slightly reduced density

#### Tablet (768-1023px)
- Single column with slide-out panels
- Bottom tab bar navigation
- Reduced information density
- Larger touch targets

#### Mobile (320-767px)
- Single column, full-screen views
- Bottom navigation
- Card-based layouts
- Large touch targets (min 44px)
- Swipe gestures

## Usability Testing Scenarios

### Test Script: Candidate Search & Submission

**Scenario:** You need to find and submit a chief stewardess for a 60m motor yacht in Monaco.

**Tasks:**
1. Search for qualified chief stewardesses
2. Review top 3 candidates
3. Add 2 to shortlist
4. Send availability email to shortlisted candidates
5. Submit best candidate to client

**Success Metrics:**
- Time to complete: <5 minutes (expert user)
- Clicks required: <15
- Errors made: 0
- User satisfaction: 8+/10

**Observation Points:**
- Do users find the search interface intuitive?
- Can they quickly assess candidate quality?
- Is the shortlist function discoverable?
- Are email templates helpful or confusing?
- Do users understand the submission process?

### A/B Testing Framework

#### Test: Search Results Layout

**Variant A: List View (Current)**
```
┌────────────────────────────────────┐
│ [Photo] Name | Position | Exp     │
│         Certifications             │
│         Location • Salary          │
│         [Actions]                  │
├────────────────────────────────────┤
│ [Photo] Name | Position | Exp     │
│ ...                                │
└────────────────────────────────────┘
```

**Variant B: Card View**
```
┌─────────┬─────────┬─────────┐
│ [Photo] │ [Photo] │ [Photo] │
│ Name    │ Name    │ Name    │
│ Position│ Position│ Position│
│ Match   │ Match   │ Match   │
│ [View]  │ [View]  │ [View]  │
└─────────┴─────────┴─────────┘
```

**Metrics to Track:**
- Time to find suitable candidate
- Number of candidates reviewed
- Click-through rate to profile
- Conversion to shortlist
- User preference (survey)

**Hypothesis:** Card view will increase engagement but decrease efficiency for power users.

## Error States & Edge Cases

### Empty States

#### No Search Results
```
┌────────────────────────────────────┐
│                                    │
│          🔍                        │
│                                    │
│   No candidates found              │
│                                    │
│   Try adjusting your filters or    │
│   search for different keywords    │
│                                    │
│   Suggestions:                     │
│   • Remove location filter         │
│   • Expand experience range        │
│   • Try similar position titles    │
│                                    │
│   [Clear Filters] [Broaden Search] │
│                                    │
└────────────────────────────────────┘
```

#### No Jobs Available (Candidate View)
```
┌────────────────────────────────────┐
│                                    │
│          💼                        │
│                                    │
│   No new positions right now       │
│                                    │
│   We'll notify you as soon as      │
│   matching positions are posted    │
│                                    │
│   In the meantime:                 │
│   • Complete your profile (80%)    │
│   • Upload missing certificates    │
│   • Update your availability       │
│                                    │
│   [Complete Profile]               │
│                                    │
└────────────────────────────────────┘
```

### Error Recovery

#### Network Error
```
┌────────────────────────────────────┐
│   ⚠️ Connection Lost               │
│                                    │
│   Your changes have been saved     │
│   locally and will sync when       │
│   connection is restored.          │
│                                    │
│   [Retry Now] [Continue Offline]   │
└────────────────────────────────────┘
```

#### Validation Error
```
┌────────────────────────────────────┐
│ Email Address                      │
│ [sarah@example]  ❌                │
│ Please enter a valid email address │
│                                    │
│ Phone Number                       │
│ [+33612345]  ⚠️                    │
│ Phone number seems incomplete      │
└────────────────────────────────────┘
```

## Implementation Guidelines

### Progressive Enhancement Strategy

**Phase 1: Core Functionality**
- Basic CRUD operations work
- Forms submit and validate
- Search returns results
- Mobile responsive layout

**Phase 2: Enhanced UX**
- Real-time search suggestions
- Keyboard shortcuts
- Drag-and-drop
- Optimistic UI updates

**Phase 3: Advanced Features**
- AI-powered features
- Advanced visualizations
- Offline support
- Push notifications

### Performance Budgets

**Page Load Times:**
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Largest Contentful Paint: <2.5s

**Bundle Sizes:**
- Initial JS: <200KB gzipped
- CSS: <50KB gzipped
- Critical path resources: <100KB total

**Runtime Performance:**
- Search results render: <500ms
- Form validation: <100ms
- Route transitions: <300ms
- 60fps scroll and animations

## Design Handoff Checklist

When handing off designs to developers:

✅ **Visual Design**
- [ ] High-fidelity mockups for all breakpoints
- [ ] Component states documented (hover, focus, active, disabled)
- [ ] Color values, spacing, typography specified
- [ ] Icons provided in multiple formats (SVG preferred)

✅ **Interaction Design**
- [ ] User flows documented
- [ ] Micro-interactions specified
- [ ] Animation timings/easing functions
- [ ] Loading states designed
- [ ] Error states designed
- [ ] Empty states designed

✅ **Responsive Behavior**
- [ ] Breakpoint specifications
- [ ] Component adaptations per breakpoint
- [ ] Touch vs. mouse interactions
- [ ] Orientation handling (portrait/landscape)

✅ **Accessibility**
- [ ] Color contrast ratios verified
- [ ] Keyboard navigation flow specified
- [ ] ARIA labels and roles documented
- [ ] Screen reader considerations noted

✅ **Content & Copy**
- [ ] All UI copy provided
- [ ] Character limits specified
- [ ] Placeholder text provided
- [ ] Error messages written

✅ **Assets**
- [ ] Image dimensions and formats
- [ ] Icon library
- [ ] Illustrations
- [ ] Logos (multiple sizes)

## Resources & Documentation

### Design Tools
- **Figma**: Primary design tool for mockups, prototypes, design system
- **Miro**: User journey maps, brainstorming, workshop facilitation
- **Optimal Workshop**: Card sorting, tree testing for IA
- **Maze**: Usability testing, prototype validation
- **Hotjar**: Heatmaps, session recordings, user feedback

### Inspiration & Research
- **Dribbble/Behance**: Design inspiration for recruitment software
- **Nielsen Norman Group**: UX research and best practices
- **Baymard Institute**: E-commerce and form UX research
- **Laws of UX**: Psychological principles for design decisions

### Learning Resources
- **Refactoring UI**: Practical design tips
- **Don't Make Me Think**: Usability fundamentals
- **The Design of Everyday Things**: Core design principles
- **Inclusive Design Principles**: Accessibility-first approach

---

## Usage Guidelines for Claude

When using this skill, Claude should:

1. **Understand User Intent**: Is this a design critique, feature request, or implementation question?

2. **Apply UX Principles**: Reference specific patterns from this skill (search interface, forms, mobile layouts)

3. **Consider User Context**: Which persona (recruiter, client, candidate) is this for?

4. **Provide Specific Examples**: Use mockup formats from this skill to illustrate points

5. **Balance Aesthetics & Usability**: Beautiful design that doesn't work is useless

6. **Think Mobile-First for Candidates**: They're primarily on smartphones

7. **Optimize for Speed**: Recruiters are power users who hate waiting

8. **Maintain Accessibility**: Every design decision should consider WCAG standards

9. **Suggest Testing**: Recommend usability tests or A/B tests for major changes

10. **Reference Industry Context**: Yacht crew recruitment has unique UX requirements

---

**Example Claude Response Using This Skill:**

**User:** "How should we design the candidate profile page?"

**Claude:** "For the candidate profile page, let's optimize for the recruiter's primary need: quickly assessing candidate fit. Here's my recommended approach:

**Layout Structure (Desktop):**
Use a three-section layout:
- Left sidebar (200px): Photo, contact info, status indicator, quick actions
- Main content (fluid): Tabbed sections for Experience, Certifications, Documents
- Right sidebar (300px): Match score breakdown, applications history

**Key Design Decisions:**

1. **Visual Hierarchy**: Match score prominent at top (94% with color coding: green >85%, yellow 70-85%, red <70%)

2. **Scannable Information**: 
   - Use icons for certifications (✅ STCW, ✅ ENG1, ⚠️ Expiring soon)
   - Location, salary, yacht size on single line with consistent formatting
   - Availability status color-coded and prominent

3. **Quick Actions**: Always visible in sidebar
   - [Send Email] [Call] [Add to List] [Schedule Interview]
   - Keyboard shortcuts: E for email, C for call, S for shortlist

4. **Progressive Disclosure**:
   - Summary view shows key highlights
   - Tabs organize detailed information
   - "Show More" for less critical details

5. **Mobile Adaptation**:
   - Single column, card-based
   - Sticky header with photo and match score
   - Swipe between sections instead of tabs

**Performance Considerations:**
- Lazy load document previews
- Cache candidate data for instant back-navigation
- Pre-fetch related candidates for smooth browsing

**Accessibility:**
- Keyboard tab order: Photo → Contact → Actions → Content tabs
- Screen reader announces match score and status
- High contrast mode support for status indicators

Would you like me to mock up the specific layout or detail any particular section?"