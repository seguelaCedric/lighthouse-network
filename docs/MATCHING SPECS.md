# LIGHTHOUSE MATCHING ENGINE - Technical Specification

## Why Most AI Matching Fails

### The Common Mistakes

1. **Pure Vector Search**
   ```
   embed(job) → cosine_similarity(candidates) → top 10
   ```
   This fails because:
   - Missing STCW? 95% similar but 0% qualified
   - Embeddings don't understand "55m motor" vs "55m sail"
   - No way to enforce hard requirements

2. **RAG-Style Retrieval**
   ```
   "Find candidates for Chief Stew role" → semantic search → summarize
   ```
   This fails because:
   - RAG is for Q&A, not recommendation
   - Can't rank or score
   - No structured evaluation

3. **Keyword Matching**
   ```
   job.title ILIKE candidate.position → filter by experience
   ```
   This fails because:
   - "Chief Stewardess" ≠ "Head of Interior" (same role)
   - Misses qualified candidates with different titles
   - No understanding of transferable skills

---

## What Actually Works: Hybrid Multi-Stage Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LIGHTHOUSE MATCHING ENGINE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  JOB BRIEF                                                          │
│      │                                                               │
│      ▼                                                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STAGE 0: REQUIREMENT EXTRACTION                               │   │
│  │ Claude parses job → structured requirements + deal-breakers   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│      │                                                               │
│      ▼                                                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STAGE 1: BOOLEAN PRE-FILTER (SQL)                            │   │
│  │ Hard requirements only - eliminates 80% of candidates         │   │
│  │ • Position category match                                     │   │
│  │ • Required certifications                                     │   │
│  │ • Required visas                                              │   │
│  │ • Availability window                                         │   │
│  │ • Non-negotiables (smoker, tattoos)                          │   │
│  │                                                               │   │
│  │ Result: ~200 candidates who COULD do the job                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
│      │                                                               │
│      ▼                                                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STAGE 2: SEMANTIC EXPANSION (Vector)                         │   │
│  │ Find similar candidates who passed boolean filter             │   │
│  │ • Embeddings for nuanced matching                            │   │
│  │ • Catches synonyms ("Chief Stew" = "Head of Interior")       │   │
│  │ • Expands pool with transferable experience                  │   │
│  │                                                               │   │
│  │ Result: ~100 candidates ranked by relevance                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│      │                                                               │
│      ▼                                                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STAGE 3: MULTI-SIGNAL SCORING                                │   │
│  │ Weighted score across 8 dimensions:                          │   │
│  │                                                               │   │
│  │  ┌─────────────────┬─────────┬───────────────────────────┐   │   │
│  │  │ Signal          │ Weight  │ What It Measures           │   │   │
│  │  ├─────────────────┼─────────┼───────────────────────────┤   │   │
│  │  │ Qualification   │ 20%     │ Certs, licenses, training │   │   │
│  │  │ Experience      │ 20%     │ Years + vessel size/type  │   │   │
│  │  │ Work History    │ 15%     │ Tenure, progression, gaps │   │   │
│  │  │ Verification    │ 15%     │ ID, refs, background      │   │   │
│  │  │ Availability    │ 10%     │ When + flexibility        │   │   │
│  │  │ Preference Fit  │ 10%     │ Do they WANT this job?    │   │   │
│  │  │ Recency         │ 5%      │ Profile freshness         │   │   │
│  │  │ Platform Trust  │ 5%      │ Past placement success    │   │   │
│  │  └─────────────────┴─────────┴───────────────────────────┘   │   │
│  │                                                               │   │
│  │ Result: ~50 candidates with numeric scores                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│      │                                                               │
│      ▼                                                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STAGE 4: AI DEEP EVALUATION                                  │   │
│  │ Claude evaluates top 20 candidates with domain expertise:    │   │
│  │ • Work history narrative analysis                            │   │
│  │ • Red flag detection                                         │   │
│  │ • Cultural fit inference                                     │   │
│  │ • Career trajectory assessment                               │   │
│  │ • Reference quality weighting                                │   │
│  │                                                               │   │
│  │ Result: 10 candidates with reasoning                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│      │                                                               │
│      ▼                                                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STAGE 5: FEEDBACK CALIBRATION                                │   │
│  │ Adjust based on historical data:                             │   │
│  │ • Which similar candidates got placed?                       │   │
│  │ • Recruiter override patterns                                │   │
│  │ • Client feedback on past submissions                        │   │
│  │                                                               │   │
│  │ Result: Final ranked list with confidence scores             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│      │                                                               │
│      ▼                                                               │
│  SHORTLIST with explanations                                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## The Key Insight: Hard Requirements First

The #1 reason matching fails is mixing "nice to have" with "must have".

```
WRONG APPROACH:
┌────────────────────────────────────────────────┐
│ Vector similarity: 0.92                        │
│ "This candidate is 92% similar to the job!"   │
│                                                │
│ But... no STCW certification                   │
│ They literally cannot work on a yacht          │
└────────────────────────────────────────────────┘

RIGHT APPROACH:
┌────────────────────────────────────────────────┐
│ Step 1: Has STCW? No → ELIMINATED              │
│                                                │
│ (Vector similarity is irrelevant for           │
│  candidates who don't meet requirements)       │
└────────────────────────────────────────────────┘
```

---

## Yacht Industry Domain Knowledge

The AI needs to understand yacht-specific nuances:

### Position Hierarchy
```
DECK:
Captain → Chief Officer → 2nd Officer → 3rd Officer → Bosun → 
Lead Deckhand → Deckhand

INTERIOR:
Chief Stewardess → 2nd Stewardess → 3rd Stewardess → Junior Stew

ENGINEERING:
Chief Engineer → 2nd Engineer → 3rd Engineer → ETO

GALLEY:
Head Chef → Sous Chef → Crew Chef
```

### Vessel Type Matters
```
MOTOR vs SAIL:
- Different skill sets
- Different certifications (sailing endorsements)
- Different crew culture

PRIVATE vs CHARTER:
- Private: Owner preferences, longer tenures, higher standards
- Charter: Guest rotation, tips, higher turnover

SIZE IMPLICATIONS:
- <40m: Smaller crew, more versatile roles
- 40-60m: Specialized roles, standard hierarchy
- 60-80m: Full department heads, formal service
- 80m+: Hotel-level operation, strict protocols
```

### Red Flags the AI Should Catch
```
WORK HISTORY RED FLAGS:
- Multiple jobs <6 months (job hopper)
- Gaps >3 months unexplained
- Lateral moves after 5+ years (not progressing)
- Only charter experience applying for private
- Size downgrades (60m → 40m) without explanation

REFERENCE RED FLAGS:
- No references from direct supervisors
- Short reference tenure (<3 months worked together)
- Generic references ("good worker")
- Missing references from recent positions

PROFILE RED FLAGS:
- Incomplete certifications
- Expired ENG1 or STCW
- Salary expectations 50%+ above market
- "Flexible on position" with 5+ years experience
```

---

## Implementation Architecture

### Database Schema Additions

```sql
-- Matching feedback table (for learning)
CREATE TABLE match_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id),
  candidate_id UUID REFERENCES candidates(id),
  match_score DECIMAL(5,2),
  match_rank INTEGER,
  
  -- Recruiter actions
  was_reviewed BOOLEAN DEFAULT FALSE,
  was_shortlisted BOOLEAN DEFAULT FALSE,
  was_submitted BOOLEAN DEFAULT FALSE,
  recruiter_override_rank INTEGER,
  recruiter_notes TEXT,
  
  -- Outcomes
  client_response TEXT, -- 'interested', 'rejected', 'interviewed'
  interview_outcome TEXT,
  was_placed BOOLEAN DEFAULT FALSE,
  
  -- For calibration
  score_breakdown JSONB,
  ai_assessment JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Position synonyms (for semantic matching)
CREATE TABLE position_synonyms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canonical_name TEXT NOT NULL,
  synonym TEXT NOT NULL,
  position_category position_category,
  UNIQUE(canonical_name, synonym)
);

-- Insert yacht position synonyms
INSERT INTO position_synonyms (canonical_name, synonym, position_category) VALUES
('Chief Stewardess', 'Head of Interior', 'interior'),
('Chief Stewardess', 'Head Stew', 'interior'),
('Chief Stewardess', 'Chief Stew', 'interior'),
('Chief Stewardess', 'Interior Manager', 'interior'),
('2nd Stewardess', 'Second Stewardess', 'interior'),
('2nd Stewardess', 'Assistant Chief Stew', 'interior'),
('Deckhand', 'Deck Hand', 'deck'),
('Bosun', 'Lead Deckhand', 'deck'),
('Bosun', 'Deck Supervisor', 'deck'),
('Chief Officer', 'First Officer', 'deck'),
('Chief Officer', 'First Mate', 'deck'),
('Chief Engineer', 'Chief Eng', 'engineering'),
('ETO', 'Electro-Technical Officer', 'engineering'),
('Head Chef', 'Executive Chef', 'galley'),
('Head Chef', 'Chef', 'galley');

-- Work history analysis cache
CREATE TABLE candidate_work_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES candidates(id) UNIQUE,
  
  -- Computed signals
  average_tenure_months DECIMAL(5,1),
  longest_tenure_months INTEGER,
  total_positions INTEGER,
  career_direction TEXT, -- 'ascending', 'lateral', 'descending'
  vessel_size_progression TEXT, -- 'growing', 'stable', 'shrinking'
  
  -- Red flags
  short_tenures_count INTEGER DEFAULT 0,
  unexplained_gaps_count INTEGER DEFAULT 0,
  has_terminations BOOLEAN DEFAULT FALSE,
  
  -- Quality signals
  private_yacht_experience BOOLEAN DEFAULT FALSE,
  charter_experience BOOLEAN DEFAULT FALSE,
  new_build_experience BOOLEAN DEFAULT FALSE,
  refit_experience BOOLEAN DEFAULT FALSE,
  
  -- Computed at
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Endpoint

```typescript
// POST /api/jobs/[id]/match
interface MatchRequest {
  // Optional filters
  verification_tiers?: ('basic' | 'identity' | 'verified' | 'premium')[];
  availability_window_days?: number;
  exclude_submitted?: boolean;
  exclude_candidate_ids?: string[];
  
  // Limit
  limit?: number; // default 10, max 50
  
  // Options
  include_score_breakdown?: boolean;
  include_ai_reasoning?: boolean;
  fast_mode?: boolean; // Skip AI evaluation for speed
}

interface MatchResponse {
  success: boolean;
  matches: {
    candidate: CandidateProfile;
    
    // Scores
    overall_score: number; // 0-100
    confidence: 'high' | 'medium' | 'low';
    
    // Breakdown (if requested)
    score_breakdown?: {
      qualification: { score: number; details: string };
      experience: { score: number; details: string };
      work_history: { score: number; details: string };
      verification: { score: number; details: string };
      availability: { score: number; details: string };
      preference_fit: { score: number; details: string };
      recency: { score: number; details: string };
      platform_trust: { score: number; details: string };
    };
    
    // AI assessment (if requested)
    ai_assessment?: {
      strengths: string[];
      concerns: string[];
      red_flags: string[];
      summary: string;
      recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no';
    };
    
    // For recruiter
    requires_review: boolean;
    review_reasons?: string[];
  }[];
  
  // Metadata
  meta: {
    job_id: string;
    total_candidates_searched: number;
    after_boolean_filter: number;
    after_semantic_ranking: number;
    ai_evaluated: number;
    returned: number;
    processing_time_ms: number;
  };
}
```
