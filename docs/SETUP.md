# LIGHTHOUSE CREW NETWORK - Setup & Development Guide

## How to Use This Project with VS Code + Claude Code

This guide explains how to take the scaffolding and documentation and turn it into a working application using Claude Code (or Cursor, Windsurf, etc.).

---

## Step 1: Download and Extract Project

### Option A: From Claude.ai outputs
1. Download the `lighthouse-network` folder from the outputs
2. Extract to your development directory

### Option B: Fresh start
```bash
mkdir lighthouse-network
cd lighthouse-network
```

---

## Step 2: Project Structure Overview

After download, you should have:

```
lighthouse-network/
├── README.md                    # Project overview
├── package.json                 # Root monorepo config
├── turbo.json                   # Build pipeline
├── docs/
│   ├── ROADMAP.md              # 26-week implementation plan
│   ├── FRONTEND_GUIDE.md       # Design system, components, pages
│   └── SETUP.md                # This file
├── packages/
│   ├── ai/
│   │   ├── package.json
│   │   └── index.ts            # AI functions (parseBrief, rankCandidates)
│   └── database/
│       └── types.ts            # TypeScript types
├── supabase/
│   └── migrations/
│       ├── 001_core_schema.sql # Main database schema
│       └── 002_vector_search.sql # Vector functions
└── apps/
    └── web/
        └── app/api/            # API routes (already built)
```

---

## Step 3: Initialize the Project

### 3.1 Install Dependencies

```bash
# Install pnpm if you don't have it
npm install -g pnpm

# Install project dependencies
cd lighthouse-network
pnpm install
```

### 3.2 Set Up Supabase

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Note your project URL and keys

2. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

3. **Initialize Supabase locally (optional)**
   ```bash
   supabase init
   supabase start
   ```

4. **Run Migrations**
   ```bash
   # If using Supabase Cloud directly:
   # Go to SQL Editor in Supabase Dashboard
   # Copy/paste 001_core_schema.sql
   # Then 002_vector_search.sql

   # Or via CLI:
   supabase db push
   ```

### 3.3 Set Up Environment Variables

```bash
# Copy example env file
cp .env.example .env.local

# Edit with your values
```

**.env.local:**
```bash
# Supabase (from your Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Anthropic (from console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-api03-...

# OpenAI (from platform.openai.com)
OPENAI_API_KEY=sk-...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3.4 Create Next.js App (if not exists)

```bash
cd apps/web

# If the web app doesn't exist yet:
pnpm create next-app . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"

# Install additional dependencies
pnpm add @supabase/supabase-js @supabase/ssr @tanstack/react-query ai @ai-sdk/anthropic @ai-sdk/openai lucide-react class-variance-authority clsx tailwind-merge date-fns zod
```

---

## Step 4: Using Claude Code for Development

### 4.1 Open in VS Code

```bash
code lighthouse-network
```

### 4.2 Install Claude Code Extension

1. Open VS Code Extensions (Cmd/Ctrl + Shift + X)
2. Search for "Claude Code" or "Claude for VS Code"
3. Install and authenticate

### 4.3 How to Prompt Claude Code

The key is to give Claude Code context about what you're building. Here are effective prompts:

---

#### **Starting the Frontend**

```
Read the files in /docs/FRONTEND_GUIDE.md and /packages/database/types.ts

Using the design system and component specs from the guide, create:
1. The recruiter sidebar component at components/layout/recruiter-sidebar.tsx
2. The page layout at app/(recruiter)/layout.tsx

Use the brand colors (gold-500: #B49A5E), Tailwind CSS, and Lucide icons.
```

---

#### **Building a Page**

```
I'm building the recruiter dashboard page.

Context:
- See /docs/FRONTEND_GUIDE.md for the design specs
- See /packages/database/types.ts for data types
- API is at /api/briefs and /api/jobs

Create app/(recruiter)/dashboard/page.tsx with:
- Stats cards (briefs count, active jobs, pipeline value, fill rate)
- Brief inbox section showing recent briefs
- Recent activity feed

Use React Query for data fetching. Follow the component patterns in the guide.
```

---

#### **Creating a Component**

```
Create the MatchCard component for displaying AI-matched candidates.

Reference: /docs/FRONTEND_GUIDE.md section "Match Card Component"
Types: /packages/database/types.ts (CandidateMatch type)

The component should show:
- Candidate avatar (initials), name, position
- Match score (colored based on score)
- Verification tier badge
- Availability status badge
- AI reasoning text
- Strengths/concerns lists
- Submit and View Profile buttons

Use Tailwind CSS with the brand colors from the guide.
```

---

#### **Building the Brief Parser Page**

```
Create the brief parser page at app/(recruiter)/briefs/[id]/page.tsx

This page should:
1. Fetch brief data using the brief ID from params
2. Display two-column layout:
   - Left: Raw brief content
   - Right: AI parsed results (or parse button if not parsed)
3. Show confidence score, ambiguities
4. Have "Create Job Draft" and "Find Candidates" buttons

The parsing uses POST /api/briefs/parse
See /docs/FRONTEND_GUIDE.md for the component structure.
```

---

#### **Connecting to Supabase**

```
Create the Supabase client utilities:

1. lib/supabase/client.ts - Browser client for client components
2. lib/supabase/server.ts - Server client for server components and API routes
3. lib/supabase/middleware.ts - For auth middleware

Follow Supabase SSR patterns for Next.js App Router.
Use the types from /packages/database/types.ts.
```

---

#### **Creating Data Hooks**

```
Create React Query hooks for jobs:

File: lib/hooks/use-jobs.ts

Include:
- useJobs(filters) - list jobs with optional filters
- useJob(id) - single job with submissions
- useJobMatches(id) - get AI matches (calls /api/jobs/[id]/match)
- useCreateSubmission() - mutation to submit candidate

Use Supabase client from lib/supabase/client.ts
Types from /packages/database/types.ts
```

---

### 4.4 Recommended Build Order

Follow this sequence for the best experience:

```
PHASE 1: Foundation (Day 1-2)
├── 1. Set up Supabase, run migrations
├── 2. Create Supabase client utilities
├── 3. Create root layout with providers (React Query)
├── 4. Create recruiter sidebar + layout
└── 5. Create basic page shells

PHASE 2: Core Pages (Day 3-5)
├── 6. Dashboard page with stats
├── 7. Brief inbox page
├── 8. Brief parser page (the magic)
├── 9. Job pipeline page
└── 10. Job detail with match results

PHASE 3: Components (Day 6-7)
├── 11. MatchCard component
├── 12. JobCard component
├── 13. CandidateCard component
├── 14. Data tables
└── 15. Forms (job form, submission modal)

PHASE 4: Candidate Portal (Day 8-10)
├── 16. Candidate sidebar + layout
├── 17. Job browse page
├── 18. Job detail page
├── 19. Profile page
└── 20. Documents page
```

---

## Step 5: Key Prompts Reference

### Create a New Page

```
Create [page name] at app/(recruiter)/[path]/page.tsx

Requirements:
- [List what the page should do]
- [Data it needs to fetch]
- [Components it should use]

Reference the FRONTEND_GUIDE.md for design patterns.
Use the database types from packages/database/types.ts.
```

### Create a New Component

```
Create [component name] component at components/[category]/[name].tsx

Props interface:
- [List props]

Features:
- [List features]

Style: Use Tailwind with brand colors (gold-500: #B49A5E)
Icons: Use Lucide React
```

### Create an API Route

```
Create API route at app/api/[path]/route.ts

This endpoint should:
- Accept [method] requests
- [Describe what it does]
- Use Supabase for database operations
- Return [describe response shape]

Reference existing routes in app/api/ for patterns.
```

### Debug an Issue

```
I'm getting this error: [paste error]

In file: [filename]
When trying to: [what you were doing]

Here's the relevant code:
[paste code]

Help me fix this.
```

---

## Step 6: Running the Application

### Development

```bash
# From root directory
pnpm dev

# Or just the web app
cd apps/web
pnpm dev
```

Open http://localhost:3000

### Build for Production

```bash
pnpm build
```

### Type Check

```bash
pnpm typecheck
```

---

## Step 7: Database Operations

### View Data in Supabase

1. Go to your Supabase Dashboard
2. Click "Table Editor"
3. Browse your tables

### Quick Queries (SQL Editor)

```sql
-- See all candidates
SELECT * FROM candidates LIMIT 10;

-- See all jobs
SELECT * FROM jobs WHERE status = 'open';

-- See submissions for a job
SELECT 
  s.*,
  c.first_name,
  c.last_name
FROM submissions s
JOIN candidates c ON s.candidate_id = c.id
WHERE s.job_id = 'your-job-id';
```

### Generate TypeScript Types from Database

```bash
# If using Supabase CLI
supabase gen types typescript --project-id your-project-id > packages/database/supabase-types.ts
```

---

## Step 8: Testing the AI Features

### Test Brief Parsing

```bash
# Using curl
curl -X POST http://localhost:3000/api/briefs/parse \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Need a Chief Stew for 55m motor yacht, Med summer, 5+ years experience, must speak French, non-smoker, budget €6000",
    "source": "portal"
  }'
```

### Test Candidate Matching

```bash
# First create a job, then:
curl -X POST http://localhost:3000/api/jobs/YOUR_JOB_ID/match \
  -H "Content-Type: application/json" \
  -d '{"limit": 5}'
```

---

## Step 9: Common Issues & Solutions

### "Module not found" errors

```bash
# Make sure all dependencies are installed
pnpm install

# Clear Next.js cache
rm -rf apps/web/.next
pnpm dev
```

### Supabase connection issues

1. Check your environment variables are correct
2. Check your Supabase project is running
3. Check RLS policies aren't blocking access

### AI API errors

1. Verify your ANTHROPIC_API_KEY is correct
2. Check you have API credits
3. Verify the model name is correct (`claude-sonnet-4-20250514`)

### TypeScript errors

```bash
# Regenerate types
pnpm typecheck

# Check for circular dependencies
# Make sure imports are correct
```

---

## Step 10: Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

```bash
# Or use Vercel CLI
vercel
```

### Environment Variables for Production

Make sure these are set in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`

---

## Quick Reference: File Locations

| What | Where |
|------|-------|
| Database schema | `supabase/migrations/001_core_schema.sql` |
| TypeScript types | `packages/database/types.ts` |
| AI functions | `packages/ai/index.ts` |
| Design system | `docs/FRONTEND_GUIDE.md` |
| API routes | `apps/web/app/api/` |
| Pages | `apps/web/app/(recruiter)/` and `app/(candidate)/` |
| Components | `apps/web/components/` |
| Hooks | `apps/web/lib/hooks/` |
| Supabase clients | `apps/web/lib/supabase/` |

---

## Getting Help

### Claude Code Tips

1. **Be specific**: Tell Claude exactly what file to create and where
2. **Give context**: Reference the docs files so Claude knows the design system
3. **Iterate**: If the first result isn't perfect, ask for specific changes
4. **Use @file**: In Claude Code, use @filename to reference specific files

### Example Effective Prompt

```
@docs/FRONTEND_GUIDE.md @packages/database/types.ts

Create the recruiter dashboard page.

Location: apps/web/app/(recruiter)/dashboard/page.tsx

This is a server component that should:
1. Display 4 stats cards in a row (briefs, jobs, pipeline value, fill rate)
2. Show a "Brief Inbox" section with the 5 most recent briefs
3. Show a "Recent Activity" section

Use the StatsCard pattern from the guide.
Fetch data from Supabase using the server client.
Style with Tailwind using brand colors (gold-500 for accents).
```

---

You're ready to build. Start with Phase 1 and work through systematically. The docs have everything you need - just feed them to Claude Code along with your prompts.
