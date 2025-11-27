# LIGHTHOUSE CREW NETWORK - Frontend Development Guide

## Quick Start

```bash
# Clone/download the project
cd lighthouse-network

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Start development
pnpm dev
```

---

## Part 1: Design System

### Brand Colors

```css
/* Primary - Champagne Gold (Luxury Palette) */
--gold-50: #FDFBF7;
--gold-100: #F9F5EB;
--gold-200: #F0E6D0;
--gold-300: #E1D4B5;
--gold-400: #CBBA8E;
--gold-500: #B49A5E;  /* Primary brand color */
--gold-600: #9A7F45;
--gold-700: #7D6636;
--gold-800: #5E4D29;
--gold-900: #3D3219;

/* Primary - Midnight Navy */
--navy-50: #F4F6F9;
--navy-100: #E4E9F0;
--navy-200: #C5CFE0;
--navy-300: #94A3C4;
--navy-400: #5E6F94;
--navy-500: #3D4F6F;
--navy-600: #2A3A54;
--navy-700: #1C2840;
--navy-800: #111827;  /* Sidebar background */
--navy-900: #0A0F1A;

/* Neutrals - Warm Grays */
--gray-50: #FAFAF8;   /* Page background (warm white) */
--gray-100: #F5F4F1;
--gray-200: #E8E6E1;
--gray-300: #D4D1CA;  /* Card borders: rgba(212, 209, 202, 0.6) */
--gray-400: #A8A49B;
--gray-500: #7D796F;
--gray-600: #5C5850;
--gray-700: #433F38;
--gray-800: #2A2722;
--gray-900: #1A1816;

/* Semantic - Luxury Equivalents */
--success: #1D9A6C;   /* Emerald */
--warning: #E69A2E;   /* Warm Amber */
--error: #D64545;     /* Deep Rose */
--info: #3B82F6;

/* Verification Tiers */
--tier-basic: #A8A49B;     /* Warm Gray */
--tier-identity: #3B82F6;  /* Blue */
--tier-verified: #1D9A6C;  /* Emerald */
--tier-premium: #B49A5E;   /* Champagne Gold */
```

### Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FDFBF7',
          100: '#F9F5EB',
          200: '#F0E6D0',
          300: '#E1D4B5',
          400: '#CBBA8E',
          500: '#B49A5E',
          600: '#9A7F45',
          700: '#7D6636',
          800: '#5E4D29',
          900: '#3D3219',
        },
        navy: {
          50: '#F4F6F9',
          100: '#E4E9F0',
          200: '#C5CFE0',
          300: '#94A3C4',
          400: '#5E6F94',
          500: '#3D4F6F',
          600: '#2A3A54',
          700: '#1C2840',
          800: '#111827',
          900: '#0A0F1A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
    },
  },
}
```

### Typography

```css
/* Headings */
h1: text-3xl font-bold text-gray-900     /* 30px */
h2: text-2xl font-semibold text-gray-900 /* 24px */
h3: text-xl font-semibold text-gray-900  /* 20px */
h4: text-lg font-medium text-gray-900    /* 18px */

/* Body */
body: text-base text-gray-600            /* 16px */
small: text-sm text-gray-500             /* 14px */
tiny: text-xs text-gray-400              /* 12px */

/* Brand text */
.text-brand: text-brand-500
```

### Spacing Scale

```
4px   = 1    (p-1, m-1)
8px   = 2    (p-2, m-2)
12px  = 3    (p-3, m-3)
16px  = 4    (p-4, m-4)
20px  = 5    (p-5, m-5)
24px  = 6    (p-6, m-6)
32px  = 8    (p-8, m-8)
40px  = 10   (p-10, m-10)
48px  = 12   (p-12, m-12)
```

### Border Radius

```
Cards: rounded-xl (12px)
Buttons: rounded-lg (8px)
Inputs: rounded-lg (8px)
Badges: rounded-full
```

### Shadows

```css
/* Cards */
.shadow-card: shadow-sm hover:shadow-md transition-shadow

/* Elevated */
.shadow-elevated: shadow-lg

/* Modals */
.shadow-modal: shadow-xl
```

---

## Part 2: Component Library

### Buttons

```tsx
// Primary Button (Gold)
<button className="
  bg-brand-500 hover:bg-brand-600 
  text-white font-medium
  px-4 py-2 rounded-lg
  transition-colors
">
  Apply for this position
</button>

// Secondary Button (Outline)
<button className="
  border border-brand-500 
  text-brand-500 hover:bg-brand-50
  font-medium px-4 py-2 rounded-lg
  transition-colors
">
  Refer a Friend
</button>

// Ghost Button
<button className="
  text-gray-600 hover:text-gray-900 hover:bg-gray-100
  font-medium px-4 py-2 rounded-lg
  transition-colors
">
  Cancel
</button>

// Danger Button
<button className="
  bg-error-500 hover:bg-red-600 
  text-white font-medium
  px-4 py-2 rounded-lg
">
  Delete
</button>

// Button Sizes
sm: px-3 py-1.5 text-sm
md: px-4 py-2 text-base (default)
lg: px-6 py-3 text-lg
```

### Cards

```tsx
// Base Card
<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
  {children}
</div>

// Job Card (from your current design)
<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
  <div className="flex justify-between items-start">
    <div>
      <h3 className="text-xl font-semibold text-brand-500">
        Experienced stew
      </h3>
      <p className="text-sm text-gray-500 mt-1">Job ID #60737</p>
    </div>
    <button className="text-gray-400 hover:text-brand-500">
      <HeartIcon className="w-6 h-6" />
    </button>
  </div>
  
  <div className="mt-6 space-y-3">
    <div className="flex items-center gap-3 text-gray-600">
      <ShipIcon className="w-5 h-5 text-brand-500" />
      <span>35m</span>
    </div>
    <div className="flex items-center gap-3 text-gray-600">
      <MapPinIcon className="w-5 h-5 text-brand-500" />
      <span>Based in UAE, will charter in the Med next summer</span>
    </div>
    <div className="flex items-center gap-3 text-gray-600">
      <DollarSignIcon className="w-5 h-5 text-brand-500" />
      <span>€3000</span>
    </div>
    <div className="flex items-center gap-3 text-gray-600">
      <BriefcaseIcon className="w-5 h-5 text-brand-500" />
      <span>Permanent</span>
    </div>
    <div className="flex items-center gap-3 text-gray-600">
      <PlaneIcon className="w-5 h-5 text-brand-500" />
      <span>42 days leave</span>
    </div>
  </div>
  
  <div className="mt-6 flex justify-end gap-3">
    <button className="border border-brand-500 text-brand-500 px-4 py-2 rounded-lg">
      Refer a Friend
    </button>
    <button className="bg-brand-500 text-white px-4 py-2 rounded-lg">
      Apply for this position
    </button>
  </div>
</div>

// Candidate Match Card (NEW - for recruiter view)
<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
  <div className="flex justify-between items-start">
    <div className="flex gap-4">
      <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center">
        <span className="text-brand-600 font-semibold">SM</span>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">Sarah M.</h3>
        <p className="text-sm text-gray-500">Chief Stewardess</p>
      </div>
    </div>
    <div className="text-right">
      <div className="text-2xl font-bold text-brand-500">94%</div>
      <div className="text-xs text-gray-500">match</div>
    </div>
  </div>
  
  {/* Verification Badge */}
  <div className="mt-3 flex items-center gap-2">
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-700">
      ⭐ Premium Verified
    </span>
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
      🟢 Available now
    </span>
  </div>
  
  {/* AI Summary */}
  <p className="mt-4 text-sm text-gray-600">
    8 years Chief Stew experience on 50m+ motor yachts. Fluent French. 
    Strong references from M/Y Serenity and M/Y Quantum.
  </p>
  
  {/* Strengths & Concerns */}
  <div className="mt-4 grid grid-cols-2 gap-4">
    <div>
      <p className="text-xs font-medium text-gray-500 mb-2">STRENGTHS</p>
      <ul className="space-y-1">
        <li className="text-sm text-success-600 flex items-center gap-1">
          <CheckIcon className="w-4 h-4" /> 8 years experience
        </li>
        <li className="text-sm text-success-600 flex items-center gap-1">
          <CheckIcon className="w-4 h-4" /> Fluent French
        </li>
        <li className="text-sm text-success-600 flex items-center gap-1">
          <CheckIcon className="w-4 h-4" /> Available immediately
        </li>
      </ul>
    </div>
    <div>
      <p className="text-xs font-medium text-gray-500 mb-2">CONCERNS</p>
      <ul className="space-y-1">
        <li className="text-sm text-warning-600 flex items-center gap-1">
          <AlertIcon className="w-4 h-4" /> Prefers 60m+ (this is 55m)
        </li>
      </ul>
    </div>
  </div>
  
  <div className="mt-6 flex justify-end gap-3">
    <button className="text-gray-600 hover:text-gray-900 px-4 py-2">
      View Profile
    </button>
    <button className="bg-brand-500 text-white px-4 py-2 rounded-lg">
      Submit to Client
    </button>
  </div>
</div>
```

### Form Inputs

```tsx
// Text Input
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    First Name *
  </label>
  <input
    type="text"
    className="
      w-full px-4 py-2 
      border border-gray-300 rounded-lg
      focus:ring-2 focus:ring-brand-500 focus:border-brand-500
      placeholder:text-gray-400
    "
    placeholder="First Name"
  />
</div>

// Select
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Position
  </label>
  <select className="
    w-full px-4 py-2 
    border border-gray-300 rounded-lg
    focus:ring-2 focus:ring-brand-500 focus:border-brand-500
  ">
    <option>Select position...</option>
    <option>Chief Stewardess</option>
    <option>Second Stewardess</option>
  </select>
</div>

// Toggle (Availability)
<div className="flex items-center gap-3">
  <span className="text-sm text-gray-600">Currently available</span>
  <button
    className={`
      relative inline-flex h-6 w-11 items-center rounded-full
      transition-colors
      ${isOn ? 'bg-brand-500' : 'bg-gray-300'}
    `}
  >
    <span className={`
      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
      ${isOn ? 'translate-x-6' : 'translate-x-1'}
    `} />
  </button>
</div>

// Textarea
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Description
  </label>
  <textarea
    rows={4}
    className="
      w-full px-4 py-2 
      border border-gray-300 rounded-lg
      focus:ring-2 focus:ring-brand-500 focus:border-brand-500
      placeholder:text-gray-400
    "
    placeholder="Enter description..."
  />
</div>
```

### Navigation

```tsx
// Sidebar (Candidate Portal)
<aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
  {/* Logo */}
  <div className="p-6 border-b border-gray-200">
    <img src="/logo.svg" alt="Lighthouse Careers" className="h-8" />
  </div>
  
  {/* Navigation */}
  <nav className="p-4 space-y-1">
    <NavItem icon={<HomeIcon />} label="Overview" href="/overview" />
    <NavItem icon={<BriefcaseIcon />} label="Favorite Jobs" href="/favorites" />
    <NavItem icon={<UserIcon />} label="Candidate Profile" href="/profile" active />
    <NavItem icon={<FileIcon />} label="Documents" href="/documents" />
    <NavItem icon={<SettingsIcon />} label="Settings" href="/settings" />
  </nav>
</aside>

// NavItem Component
const NavItem = ({ icon, label, href, active }) => (
  <a
    href={href}
    className={`
      flex items-center gap-3 px-4 py-3 rounded-lg
      transition-colors
      ${active 
        ? 'bg-brand-50 text-brand-600' 
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }
    `}
  >
    <span className={active ? 'text-brand-500' : 'text-gray-400'}>
      {icon}
    </span>
    <span className="font-medium">{label}</span>
  </a>
);

// Header
<header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
  <div className="flex items-center gap-4">
    {/* Mobile menu button */}
    <button className="lg:hidden">
      <MenuIcon className="w-6 h-6 text-gray-600" />
    </button>
  </div>
  
  <div className="flex items-center gap-4">
    <a href="/jobs" className="text-gray-600 hover:text-gray-900 font-medium">
      Browse Jobs
    </a>
    <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
      <span className="text-brand-600 font-semibold">SM</span>
    </div>
  </div>
</header>
```

### Badges & Tags

```tsx
// Verification Tier Badges
<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
  ⚪ Basic
</span>

<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
  🔵 Identity Verified
</span>

<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
  ✓ Verified
</span>

<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-700">
  ⭐ Premium
</span>

// Status Badges
<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
  🟢 Available
</span>

<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gold-100 text-gold-700">
  🟡 Looking
</span>

<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
  ⚫ Unavailable
</span>

// Job Status
<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
  Open
</span>

<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
  Interviewing
</span>

<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
  Filled
</span>
```

### Stats Cards (Dashboard)

```tsx
<div className="grid grid-cols-4 gap-6">
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <p className="text-sm font-medium text-gray-500">New Briefs</p>
    <p className="text-3xl font-bold text-gray-900 mt-2">3</p>
    <p className="text-sm text-success-600 mt-2">+2 today</p>
  </div>
  
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <p className="text-sm font-medium text-gray-500">Active Jobs</p>
    <p className="text-3xl font-bold text-gray-900 mt-2">12</p>
    <p className="text-sm text-gray-500 mt-2">4 need attention</p>
  </div>
  
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <p className="text-sm font-medium text-gray-500">Pipeline Value</p>
    <p className="text-3xl font-bold text-brand-500 mt-2">€127K</p>
    <p className="text-sm text-success-600 mt-2">+18% vs last month</p>
  </div>
  
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <p className="text-sm font-medium text-gray-500">Fill Rate</p>
    <p className="text-3xl font-bold text-gray-900 mt-2">89%</p>
    <p className="text-sm text-gray-500 mt-2">Last 90 days</p>
  </div>
</div>
```

---

## Part 3: Page Specifications

### Candidate Portal Pages

#### 1. Overview (Dashboard)
```
URL: /candidate/overview
Layout: Sidebar + Main Content

Content:
- Welcome message with name
- Availability toggle (prominent)
- Profile completion progress bar
- AI-matched jobs carousel (3-4 cards)
- Recent applications list
- Alerts/notifications
```

#### 2. Browse Jobs
```
URL: /candidate/jobs
Layout: Sidebar + Main Content

Content:
- Search bar
- Filters sidebar (position, location, salary, contract type)
- Results count ("205 Results")
- Job cards grid/list
- Pagination
- "AI Matches" section at top (highlighted)
```

#### 3. Job Detail
```
URL: /candidate/jobs/[id]
Layout: Full width

Content:
- Job header (title, ID, favorite button)
- Left column: Specs (size, location, salary, contract, benefits)
- Right column: Description
- Apply CTA (sticky on mobile)
- Similar jobs
```

#### 4. Candidate Profile
```
URL: /candidate/profile
Layout: Sidebar + Main Content

Content:
- Profile photo upload
- Availability toggle
- Personal Information form
  - Name, email, phone
  - Date of birth, gender
  - Nationality (1st, 2nd)
- Professional Information
  - Primary position
  - Secondary positions
  - Years experience
- Preferences
  - Yacht type, size range
  - Contract type
  - Preferred regions
  - Salary expectations
- Certifications section
- References section
- Visas section
```

#### 5. Documents
```
URL: /candidate/documents
Layout: Sidebar + Main Content

Content:
- CV upload (primary)
- Certificates upload
- Photos upload
- Other documents
- Document list with download/delete
```

---

### Recruiter Portal Pages

#### 1. Dashboard
```
URL: /recruiter/dashboard
Layout: Sidebar + Main Content

Content:
- Stats row (briefs, jobs, pipeline, fill rate)
- Brief inbox (new briefs, parsed status)
- Recent activity feed
- Jobs needing attention
- Upcoming interviews
```

#### 2. Brief Inbox
```
URL: /recruiter/briefs
Layout: Sidebar + Main Content

Content:
- Brief list with status indicators
  - 🟡 New (unparsed)
  - 🔵 Parsing
  - 🟢 Parsed (matches ready)
  - ⚫ Converted to job
- Quick actions (parse, view, archive)
- Filters (status, source, date)
```

#### 3. Brief Detail / Parser
```
URL: /recruiter/briefs/[id]
Layout: Full width

Content:
- Source info (WhatsApp/Email/Portal)
- Two-column layout:
  - Left: Raw brief content
  - Right: AI parsed requirements (editable)
- Confidence score
- Ambiguities list
- Clarification chat (send to client)
- Actions: [Create Job Draft] [Find Candidates]
```

#### 4. Jobs Pipeline
```
URL: /recruiter/jobs
Layout: Sidebar + Main Content

Content:
- Kanban board view
  - Columns: Draft | Open | Shortlisting | Interviewing | Offer | Filled
- Card shows: title, client, submissions count, days open
- Quick filters
- Search
- List view toggle
```

#### 5. Job Detail
```
URL: /recruiter/jobs/[id]
Layout: Full width with tabs

Tabs:
- Overview: Job specs, requirements, client info
- Matches: AI-matched candidates
- Submissions: Submitted candidates
- Activity: Timeline of actions

Match tab content:
- "Find Matches" button
- Match results list
- Each match card shows: photo, name, score, summary, actions
- Bulk select and submit
```

#### 6. Candidate Pool
```
URL: /recruiter/candidates
Layout: Sidebar + Main Content

Content:
- Search bar (semantic search)
- Filters panel
  - Position
  - Availability
  - Verification tier
  - Experience
  - Location
  - Certifications
- Results grid
- Candidate cards with quick actions
```

#### 7. Candidate Profile (Recruiter View)
```
URL: /recruiter/candidates/[id]
Layout: Full width

Content:
- Header: Photo, name, position, verification badge
- Quick stats: experience, availability, salary
- Tabs:
  - Profile: Full details
  - Documents: CV, certs
  - References: Verified references
  - History: Placements, applications
  - Notes: Internal notes
- Actions: Submit to job, Add note, Verify
```

#### 8. Submissions
```
URL: /recruiter/submissions
Layout: Sidebar + Main Content

Content:
- Table view
- Columns: Candidate, Job, Client, Submitted, Status, Actions
- Filters: Status, Job, Date range
- Bulk actions
```

#### 9. Placements
```
URL: /recruiter/placements
Layout: Sidebar + Main Content

Content:
- Table view
- Columns: Candidate, Job, Client, Start Date, Fee, Status
- Revenue summary cards
- Export functionality
```

---

## Part 4: File Structure

```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (candidate)/
│   │   ├── layout.tsx              # Candidate sidebar layout
│   │   ├── overview/
│   │   │   └── page.tsx
│   │   ├── jobs/
│   │   │   ├── page.tsx            # Browse jobs
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Job detail
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── documents/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── (recruiter)/
│   │   ├── layout.tsx              # Recruiter sidebar layout
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── briefs/
│   │   │   ├── page.tsx            # Brief inbox
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Brief detail/parser
│   │   ├── jobs/
│   │   │   ├── page.tsx            # Pipeline
│   │   │   ├── new/
│   │   │   │   └── page.tsx        # Create job
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Job detail
│   │   │       └── match/
│   │   │           └── page.tsx    # AI matches
│   │   ├── candidates/
│   │   │   ├── page.tsx            # Candidate pool
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Candidate profile
│   │   ├── submissions/
│   │   │   └── page.tsx
│   │   ├── placements/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── api/
│   │   ├── briefs/
│   │   │   ├── route.ts
│   │   │   ├── parse/
│   │   │   │   └── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── jobs/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── match/
│   │   │           └── route.ts
│   │   ├── candidates/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   └── submissions/
│   │       └── route.ts
│   │
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Landing page (redirect)
│   └── globals.css
│
├── components/
│   ├── ui/                         # Shadcn components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── badge.tsx
│   │   ├── toggle.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── table.tsx
│   │   └── tabs.tsx
│   │
│   ├── layout/
│   │   ├── candidate-sidebar.tsx
│   │   ├── recruiter-sidebar.tsx
│   │   ├── header.tsx
│   │   ├── mobile-nav.tsx
│   │   └── page-header.tsx
│   │
│   ├── briefs/
│   │   ├── brief-inbox.tsx
│   │   ├── brief-card.tsx
│   │   ├── brief-parser.tsx
│   │   └── clarification-chat.tsx
│   │
│   ├── jobs/
│   │   ├── job-card.tsx
│   │   ├── job-grid.tsx
│   │   ├── job-filters.tsx
│   │   ├── job-pipeline.tsx
│   │   ├── job-form.tsx
│   │   └── job-detail.tsx
│   │
│   ├── candidates/
│   │   ├── candidate-card.tsx
│   │   ├── candidate-grid.tsx
│   │   ├── candidate-filters.tsx
│   │   ├── candidate-profile.tsx
│   │   ├── match-card.tsx
│   │   └── match-results.tsx
│   │
│   ├── submissions/
│   │   ├── submission-table.tsx
│   │   ├── submission-card.tsx
│   │   └── submit-modal.tsx
│   │
│   └── shared/
│       ├── stats-card.tsx
│       ├── search-input.tsx
│       ├── data-table.tsx
│       ├── loading.tsx
│       ├── empty-state.tsx
│       └── avatar.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   │
│   ├── hooks/
│   │   ├── use-briefs.ts
│   │   ├── use-jobs.ts
│   │   ├── use-candidates.ts
│   │   ├── use-submissions.ts
│   │   └── use-user.ts
│   │
│   └── utils/
│       ├── cn.ts                   # Class name utility
│       ├── format.ts               # Date, currency formatters
│       └── constants.ts
│
├── public/
│   ├── logo.svg
│   ├── logo-icon.svg
│   └── placeholder-avatar.png
│
├── styles/
│   └── globals.css
│
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Part 5: Key Component Code

### Recruiter Sidebar

```tsx
// components/layout/recruiter-sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  Briefcase,
  Users,
  Send,
  Trophy,
  Building2,
  Network,
  BarChart3,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const navigation = [
  { name: 'Dashboard', href: '/recruiter/dashboard', icon: LayoutDashboard },
  { name: 'Briefs', href: '/recruiter/briefs', icon: Inbox, badge: 3 },
  { name: 'Jobs', href: '/recruiter/jobs', icon: Briefcase },
  { name: 'Candidates', href: '/recruiter/candidates', icon: Users },
  { name: 'Submissions', href: '/recruiter/submissions', icon: Send },
  { name: 'Placements', href: '/recruiter/placements', icon: Trophy },
  { type: 'divider' },
  { name: 'Clients', href: '/recruiter/clients', icon: Building2 },
  { name: 'Network', href: '/recruiter/network', icon: Network },
  { name: 'Reports', href: '/recruiter/reports', icon: BarChart3 },
  { type: 'divider' },
  { name: 'Settings', href: '/recruiter/settings', icon: Settings },
];

export function RecruiterSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/recruiter/dashboard">
          <img src="/logo.svg" alt="Lighthouse" className="h-8" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item, index) => {
          if (item.type === 'divider') {
            return <div key={index} className="my-4 border-t border-gray-200" />;
          }

          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive ? 'text-brand-500' : 'text-gray-400')} />
              <span className="font-medium flex-1">{item.name}</span>
              {item.badge && (
                <span className="bg-brand-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
            <span className="text-brand-600 font-semibold text-sm">LH</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Lighthouse</p>
            <p className="text-xs text-gray-500 truncate">Agency</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
```

### Match Card Component

```tsx
// components/candidates/match-card.tsx
'use client';

import { Check, AlertTriangle, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface MatchCardProps {
  candidate: {
    id: string;
    first_name: string;
    last_name: string;
    primary_position: string;
    verification_tier: 'basic' | 'identity' | 'verified' | 'premium';
    availability_status: 'available' | 'looking' | 'employed' | 'unavailable';
    available_from?: string;
  };
  match_score: number;
  match_reasoning: string;
  strengths: string[];
  concerns: string[];
  onSubmit?: () => void;
  onViewProfile?: () => void;
}

const tierConfig = {
  basic: { label: 'Basic', className: 'bg-gray-100 text-gray-600' },
  identity: { label: 'ID Verified', className: 'bg-blue-100 text-blue-700' },
  verified: { label: 'Verified', className: 'bg-success-100 text-success-700' },
  premium: { label: '⭐ Premium', className: 'bg-brand-100 text-brand-700' },
};

const availabilityConfig = {
  available: { label: '🟢 Available now', className: 'bg-success-100 text-success-700' },
  looking: { label: '🟡 Looking', className: 'bg-gold-100 text-gold-700' },
  employed: { label: '🔵 Employed', className: 'bg-blue-100 text-blue-700' },
  unavailable: { label: '⚫ Unavailable', className: 'bg-gray-100 text-gray-600' },
};

export function MatchCard({
  candidate,
  match_score,
  match_reasoning,
  strengths,
  concerns,
  onSubmit,
  onViewProfile,
}: MatchCardProps) {
  const initials = `${candidate.first_name[0]}${candidate.last_name[0]}`;
  const tier = tierConfig[candidate.verification_tier];
  const availability = availabilityConfig[candidate.availability_status];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center">
            <span className="text-brand-600 font-semibold">{initials}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {candidate.first_name} {candidate.last_name.charAt(0)}.
            </h3>
            <p className="text-sm text-gray-500">{candidate.primary_position}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={cn(
            'text-2xl font-bold',
            match_score >= 90 ? 'text-success-500' :
            match_score >= 80 ? 'text-brand-500' :
            match_score >= 70 ? 'text-gold-500' : 'text-gray-500'
          )}>
            {match_score}%
          </div>
          <div className="text-xs text-gray-500">match</div>
        </div>
      </div>

      {/* Badges */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge className={tier.className}>{tier.label}</Badge>
        <Badge className={availability.className}>{availability.label}</Badge>
      </div>

      {/* AI Summary */}
      <p className="mt-4 text-sm text-gray-600">{match_reasoning}</p>

      {/* Strengths & Concerns */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Strengths
          </p>
          <ul className="space-y-1">
            {strengths.slice(0, 3).map((strength, i) => (
              <li key={i} className="text-sm text-success-600 flex items-center gap-1">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Concerns
          </p>
          <ul className="space-y-1">
            {concerns.length > 0 ? (
              concerns.slice(0, 3).map((concern, i) => (
                <li key={i} className="text-sm text-warning-600 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{concern}</span>
                </li>
              ))
            ) : (
              <li className="text-sm text-gray-400">None identified</li>
            )}
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onViewProfile}>
          View Profile
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
        <Button onClick={onSubmit}>Submit to Client</Button>
      </div>
    </div>
  );
}
```

### Brief Parser Component

```tsx
// components/briefs/brief-parser.tsx
'use client';

import { useState } from 'react';
import { Loader2, Check, AlertTriangle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface ParsedBrief {
  position: string;
  position_category: string;
  vessel?: { type?: string; size_min?: number; size_max?: number };
  contract?: { type?: string; start_date?: string };
  location?: { region?: string };
  compensation?: { salary_min?: number; salary_max?: number; currency?: string };
  requirements?: {
    experience_years_min?: number;
    certifications_required?: string[];
    languages_required?: string[];
    non_smoker?: boolean;
  };
  confidence: number;
  ambiguities: string[];
}

interface BriefParserProps {
  briefId: string;
  rawContent: string;
  source: string;
  clientName?: string;
  onCreateJob: (parsed: ParsedBrief) => void;
  onFindCandidates: (parsed: ParsedBrief) => void;
}

export function BriefParser({
  briefId,
  rawContent,
  source,
  clientName,
  onCreateJob,
  onFindCandidates,
}: BriefParserProps) {
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedBrief | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    setParsing(true);
    setError(null);

    try {
      const response = await fetch('/api/briefs/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: rawContent, source }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to parse brief');
      }

      setParsed(data.parsed);
    } catch (err) {
      setError(err.message);
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left: Raw Brief */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Original Brief</h3>
          <Badge variant="outline">{source}</Badge>
        </div>
        {clientName && (
          <p className="text-sm text-gray-500 mb-4">From: {clientName}</p>
        )}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-700 whitespace-pre-wrap">{rawContent}</p>
        </div>
        
        {!parsed && (
          <Button onClick={handleParse} disabled={parsing} className="mt-4 w-full">
            {parsing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Parsing with AI...
              </>
            ) : (
              'Parse Brief'
            )}
          </Button>
        )}
      </Card>

      {/* Right: Parsed Results */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">AI Parsing</h3>
          {parsed && (
            <Badge className={
              parsed.confidence >= 0.8 ? 'bg-success-100 text-success-700' :
              parsed.confidence >= 0.6 ? 'bg-gold-100 text-gold-700' :
              'bg-error-100 text-red-700'
            }>
              {Math.round(parsed.confidence * 100)}% confidence
            </Badge>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        {parsed ? (
          <div className="space-y-4">
            {/* Position */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Position</label>
              <p className="text-lg font-semibold text-gray-900">{parsed.position}</p>
            </div>

            {/* Vessel */}
            {parsed.vessel && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Vessel</label>
                <p className="text-gray-900">
                  {parsed.vessel.type}
                  {parsed.vessel.size_max && `, ${parsed.vessel.size_max}m`}
                </p>
              </div>
            )}

            {/* Location */}
            {parsed.location?.region && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Region</label>
                <p className="text-gray-900">{parsed.location.region}</p>
              </div>
            )}

            {/* Contract */}
            {parsed.contract && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Contract</label>
                <p className="text-gray-900">
                  {parsed.contract.type}
                  {parsed.contract.start_date && ` • Start: ${parsed.contract.start_date}`}
                </p>
              </div>
            )}

            {/* Salary */}
            {parsed.compensation && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Salary</label>
                <p className="text-gray-900">
                  {parsed.compensation.salary_min && `€${parsed.compensation.salary_min.toLocaleString()}`}
                  {parsed.compensation.salary_min && parsed.compensation.salary_max && ' - '}
                  {parsed.compensation.salary_max && `€${parsed.compensation.salary_max.toLocaleString()}`}
                  /month
                </p>
              </div>
            )}

            {/* Requirements */}
            {parsed.requirements && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Requirements</label>
                <ul className="mt-2 space-y-1">
                  {parsed.requirements.experience_years_min && (
                    <li className="text-sm text-gray-700 flex items-center gap-2">
                      <Check className="w-4 h-4 text-success-500" />
                      {parsed.requirements.experience_years_min}+ years experience
                    </li>
                  )}
                  {parsed.requirements.certifications_required?.map((cert) => (
                    <li key={cert} className="text-sm text-gray-700 flex items-center gap-2">
                      <Check className="w-4 h-4 text-success-500" />
                      {cert}
                    </li>
                  ))}
                  {parsed.requirements.languages_required?.map((lang) => (
                    <li key={lang} className="text-sm text-gray-700 flex items-center gap-2">
                      <Check className="w-4 h-4 text-success-500" />
                      {lang}
                    </li>
                  ))}
                  {parsed.requirements.non_smoker && (
                    <li className="text-sm text-gray-700 flex items-center gap-2">
                      <Check className="w-4 h-4 text-success-500" />
                      Non-smoker
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Ambiguities */}
            {parsed.ambiguities.length > 0 && (
              <div className="bg-gold-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gold-800 flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Needs Clarification
                </p>
                <ul className="space-y-1">
                  {parsed.ambiguities.map((item, i) => (
                    <li key={i} className="text-sm text-gold-700">• {item}</li>
                  ))}
                </ul>
                <Button variant="outline" size="sm" className="mt-3">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Ask Client
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => onCreateJob(parsed)} className="flex-1">
                Create Job Draft
              </Button>
              <Button onClick={() => onFindCandidates(parsed)} className="flex-1">
                Find Candidates →
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>Click "Parse Brief" to extract requirements</p>
          </div>
        )}
      </Card>
    </div>
  );
}
```

---

## Part 6: API Integration (Hooks)

```tsx
// lib/hooks/use-jobs.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function useJobs(filters?: { status?: string; visibility?: string }) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          client:organizations!client_id(id, name, vessel_name),
          submissions(count)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.visibility) {
        query = query.eq('visibility', filters.visibility);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useJob(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          client:organizations!client_id(*),
          submissions(
            *,
            candidate:candidates(*),
            agency:organizations!agency_id(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useJobMatches(jobId: string) {
  return useQuery({
    queryKey: ['job-matches', jobId],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${jobId}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 10 }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data;
    },
    enabled: !!jobId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      candidateId,
      coverNote,
    }: {
      jobId: string;
      candidateId: string;
      coverNote?: string;
    }) => {
      const response = await fetch(`/api/jobs/${jobId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_id: candidateId, cover_note: coverNote }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job-matches', jobId] });
    },
  });
}
```

```tsx
// lib/hooks/use-briefs.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function useBriefs(status?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['briefs', status],
    queryFn: async () => {
      let query = supabase
        .from('briefs')
        .select(`
          *,
          client:organizations!client_id(id, name, vessel_name)
        `)
        .order('received_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useBrief(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['brief', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('briefs')
        .select(`
          *,
          client:organizations!client_id(*),
          converted_job:jobs!converted_to_job_id(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useParseBrief() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, clientId, source }: {
      content: string;
      clientId?: string;
      source: string;
    }) => {
      const response = await fetch('/api/briefs/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, client_id: clientId, source }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['briefs'] });
    },
  });
}
```

---

## Part 7: Environment Setup

### .env.example

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI (Vercel AI SDK)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### package.json (apps/web)

```json
{
  "name": "@lighthouse/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@lighthouse/ai": "workspace:*",
    "@lighthouse/database": "workspace:*",
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/ssr": "^0.1.0",
    "@tanstack/react-query": "^5.17.0",
    "ai": "^3.4.0",
    "@ai-sdk/anthropic": "^0.0.50",
    "@ai-sdk/openai": "^0.0.60",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "date-fns": "^3.2.0",
    "lucide-react": "^0.309.0",
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwind-merge": "^2.2.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.3"
  }
}
```

---

This document gives you everything needed to build the frontend. Ready for the setup guide?
