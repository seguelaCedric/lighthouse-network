# AI Matching System

Technical documentation for Lighthouse Network's AI-powered candidate matching system.

## Overview

The matching system connects yacht crew candidates with job opportunities using a multi-stage pipeline:

1. **Whole-Document Embeddings** - Single vector per candidate combining all profile data
2. **Hybrid Search** - Vector similarity + full-text search with RRF fusion
3. **Cohere Reranking** - Neural reranking for precision
4. **Permission-Scoped Output** - Different detail levels for recruiters, clients, and public

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           JOB QUERY                                      │
│                    (title, requirements, etc.)                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     STAGE 1: HYBRID SEARCH                               │
│  ┌──────────────────────┐    ┌──────────────────────┐                   │
│  │   Vector Search      │    │   Full-Text Search    │                  │
│  │   (pgvector HNSW)    │    │   (tsvector + GIN)    │                  │
│  │   Top 200 by cosine  │    │   Top 200 by ts_rank  │                  │
│  └──────────────────────┘    └──────────────────────┘                   │
│              │                         │                                 │
│              └────────┬────────────────┘                                 │
│                       ▼                                                  │
│              Reciprocal Rank Fusion (RRF)                               │
│              k=60, combines both rankings                                │
│                       │                                                  │
│                       ▼                                                  │
│              Top 100 candidates                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     STAGE 2: HARD FILTERS                                │
│                                                                          │
│  - Required certifications (STCW, ENG1)                                 │
│  - Required visas (Schengen, B1/B2)                                     │
│  - Minimum experience years                                              │
│  - Availability status                                                   │
│  - Verification tier                                                     │
│                                                                          │
│  Result: ~50-80 candidates pass filters                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     STAGE 3: COHERE RERANKING                            │
│                                                                          │
│  Model: rerank-v3.5                                                      │
│  Query: Job description + requirements                                   │
│  Documents: Candidate embedding_text                                     │
│                                                                          │
│  Reorders by semantic relevance                                          │
│  Top 20-30 candidates                                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     STAGE 4: SCORING & AI ASSESSMENT                     │
│                                                                          │
│  Score Breakdown (100 points):                                           │
│  - Qualifications: 25 pts (certs, licenses)                             │
│  - Experience: 25 pts (years, vessel types)                             │
│  - Availability: 15 pts (immediate, soon, employed)                     │
│  - Preferences: 15 pts (region, contract type match)                    │
│  - Verification: 10 pts (tier level)                                    │
│  - AI Assessment: 10 pts (GPT-4 fit analysis)                           │
│                                                                          │
│  AI generates: strengths, concerns, red flags, recommendation           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     STAGE 5: OUTPUT SANITIZATION                         │
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │
│  │  RECRUITER  │  │   CLIENT    │  │   PUBLIC    │                      │
│  │  Full data  │  │  Sanitized  │  │  Anonymous  │                      │
│  │  + contacts │  │  No concerns│  │  Match level│                      │
│  │  + notes    │  │  No contacts│  │  only       │                      │
│  │  + refs     │  │  Rating only│  │             │                      │
│  └─────────────┘  └─────────────┘  └─────────────┘                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Embedding Strategy

### Why Whole-Document Embeddings?

We evaluated three approaches:

| Approach | Pros | Cons |
|----------|------|------|
| **Chunked** (512 tokens) | Fine-grained matching | 5-10 chunks/candidate, complex retrieval, expensive at scale |
| **Hierarchical** | Best of both | Complex implementation, maintenance burden |
| **Whole-Document** | Simple, fast, single vector | Less granular, but sufficient for profile matching |

**Decision**: Whole-document embeddings because:
- Yacht profiles are structured data, not long-form text
- We need person-level matches, not paragraph-level
- Simpler = faster queries at 200K scale
- Cohere reranking adds the nuance we lose

### Embedding Text Construction

Each candidate's embedding combines:

```typescript
buildCandidateEmbeddingText(profile, documents, notes, references, viewerType)
```

**Sources Combined**:
1. **Profile fields** - Position, experience, nationality, certifications, preferences
2. **CV extracted text** - Parsed from PDF/DOCX via document processing
3. **Interview notes** - Recruiter observations (if `include_in_embedding: true`)
4. **Verified references** - Reference summaries and ratings

**Example Output**:
```
YACHT CREW CANDIDATE PROFILE

Position: Chief Stewardess
Experience: 8 years in yachting
Nationality: South African

Certifications:
- STCW (valid until 2026)
- ENG1 Medical (valid until 2025)

Preferences:
- Yacht types: Motor, Sailing
- Yacht size: 40-80 meters
- Regions: Mediterranean, Caribbean
- Contract: Permanent, Seasonal

Summary:
Experienced chief stewardess with strong service background...

CV Content:
[Extracted CV text...]

References:
Excellent reference from Captain Smith - "Outstanding crew member..."
```

### Embedding Model

- **Model**: OpenAI `text-embedding-3-small`
- **Dimensions**: 1536
- **Cost**: ~$0.00002 per candidate
- **Total for 200K**: ~$4

### Database Storage

```sql
-- On candidates table
embedding vector(1536),        -- The embedding vector
embedding_text TEXT,           -- Source text (for debugging/reranking)
embedding_updated_at TIMESTAMPTZ,

-- HNSW Index for fast similarity search
CREATE INDEX idx_candidates_embedding_hnsw
ON candidates USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

---

## Hybrid Search

### Why Hybrid?

Pure vector search misses exact keyword matches. Hybrid search combines:

1. **Vector similarity** - Semantic understanding ("experienced stewardess" ≈ "senior interior crew")
2. **Full-text search** - Exact matches ("STCW", "B1/B2 visa", vessel names)

### Reciprocal Rank Fusion (RRF)

Combines rankings from both search methods:

```sql
RRF_score = Σ 1/(k + rank_i)
```

Where `k=60` (standard constant) and `rank_i` is position in each list.

### Implementation

```sql
-- packages/ai/search/hybrid-search.ts
SELECT * FROM hybrid_candidate_search(
  query_embedding := $1,
  query_text := $2,
  match_threshold := 0.5,
  match_count := 100,
  rrf_k := 60
);
```

---

## Cohere Reranking

### Purpose

After hybrid search returns ~100 candidates, Cohere reranks them using a more powerful model that reads full text.

### Configuration

```typescript
// packages/ai/rerank/index.ts
const cohere = new CohereClient({ token: COHERE_API_KEY });

const response = await cohere.rerank({
  model: 'rerank-v3.5',
  query: jobDescription,
  documents: candidates.map(c => c.embedding_text),
  topN: 30,
  returnDocuments: false,
});
```

### Cost

- ~$0.001 per 1000 documents reranked
- Typically rerank 50-100 candidates per job = ~$0.0001/search

---

## Scoring System

### Breakdown (100 points total)

| Category | Points | Components |
|----------|--------|------------|
| **Qualifications** | 25 | STCW (8), ENG1 (7), License (10) |
| **Experience** | 25 | Years (15), Vessel types (5), Positions (5) |
| **Availability** | 15 | Immediate (15), Soon (10), Looking (5), Employed (0) |
| **Preferences** | 15 | Region (5), Contract type (5), Salary (5) |
| **Verification** | 10 | Premium (10), Verified (7), Identity (4), Basic (0) |
| **AI Assessment** | 10 | GPT-4 fit score (0-10) |

### Score Interpretation

| Score Range | Match Level | Recommendation |
|-------------|-------------|----------------|
| 80-100 | Excellent | Strong yes |
| 65-79 | Good | Yes |
| 50-64 | Fair | Maybe |
| Below 50 | Poor | No |

---

## Permission-Scoped Output

Different users see different levels of detail to protect candidate privacy and maintain recruiter value.

### Recruiter View (Full Access)

```typescript
interface RecruiterMatchResult {
  candidateId: string;
  candidate: CandidateData;  // Full profile
  score: number;
  breakdown: MatchBreakdown;
  aiAssessment: {
    fitScore: number;
    strengths: string[];
    concerns: string[];      // ← Only recruiters see
    redFlags: string[];      // ← Only recruiters see
    summary: string;
    recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no';
  };
  contactInfo: { email, phone };  // ← Only recruiters see
  referencesSummary: { count, rating, highlights };
  interviewNotes: string;         // ← Only recruiters see
}
```

### Client View (Sanitized)

```typescript
interface ClientMatchResult {
  candidateId: string;
  candidate: {
    firstName: string;
    lastName: string;  // Initial only: "John S."
    position: string;
    yearsExperience: number;
    nationality: string;
    verificationTier: string;
    availability: string;
  };
  matchScore: number;
  matchLevel: 'excellent' | 'good' | 'fair';
  summary: string;        // Positive-focused, no concerns
  keyStrengths: string[]; // Top 3 only
  certifications: { hasSTCW, hasENG1, license };
  visas: { schengen, usVisa };
  hasVerifiedReferences: boolean;
  referenceRating?: 'excellent' | 'good' | 'satisfactory';
}
```

### Public View (Anonymous)

```typescript
interface PublicMatchResult {
  candidateId: string;
  candidate: {
    position: string;
    experienceLevel: 'junior' | 'mid' | 'senior' | 'expert';
    region?: string;
    verificationBadge: 'verified' | 'premium' | null;
  };
  matchLevel: 'strong' | 'good' | 'potential';
  summary: string;  // Generic one-liner
}
```

---

## Embedding Queue System

### Background Processing

Embeddings are generated asynchronously via a queue:

```sql
-- embedding_queue table
CREATE TABLE embedding_queue (
  id UUID PRIMARY KEY,
  entity_type TEXT,      -- 'candidate' or 'job'
  entity_id UUID,
  priority INTEGER,      -- Lower = higher priority
  status TEXT,           -- pending, processing, completed, failed
  attempts INTEGER,
  max_attempts INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Triggers

```sql
-- Auto-queue on candidate changes
CREATE TRIGGER queue_candidate_embedding
AFTER INSERT OR UPDATE ON candidates
FOR EACH ROW
WHEN (NEW.embedding IS NULL OR NEW.updated_at > NEW.embedding_updated_at)
EXECUTE FUNCTION queue_embedding_update('candidate');
```

### Worker

```typescript
// apps/web/lib/services/embedding-worker.ts
const worker = new EmbeddingWorker(supabase, {
  batchSize: 10,
  pollingIntervalMs: 5000,
});

await worker.start();  // Runs continuously
```

---

## Monitoring

### Health Checks

```sql
SELECT * FROM check_embedding_health();
-- Returns: embedding_coverage, stale_embeddings, queue_backlog, queue_stuck

SELECT * FROM check_vector_index_health();
-- Returns: index_name, table_name, index_size, row_count, is_valid
```

### Dashboard View

```sql
SELECT * FROM embedding_dashboard;
-- Returns: total_candidates, candidates_with_embedding, queue_pending,
--          queue_processing, queue_failed, completed_today, avg_match_duration_ms
```

### Performance Metrics

```sql
SELECT * FROM get_matching_performance_stats(7);  -- Last 7 days
-- Returns: total_matches, avg_duration_ms, p95_duration_ms,
--          avg_candidates_searched, avg_filter_pass_rate, cohere_usage_rate_pct
```

---

## File Locations

| Component | Location |
|-----------|----------|
| Embedding text builder | `packages/ai/embedding/build-candidate-text.ts` |
| Embedding generation | `packages/ai/embedding/index.ts` |
| Hybrid search | `packages/ai/search/hybrid-search.ts` |
| Cohere reranking | `packages/ai/rerank/index.ts` |
| Matcher orchestrator | `packages/ai/matcher/index.ts` |
| Output sanitization | `packages/ai/matcher/sanitize.ts` |
| Type definitions | `packages/ai/matcher/types.ts` |
| Embedding worker | `apps/web/lib/services/embedding-worker.ts` |
| Database migrations | `supabase/migrations/014-018_*.sql` |

---

## Cost Analysis

### Per-Search Cost

| Stage | Cost |
|-------|------|
| Vector search | Free (database) |
| Full-text search | Free (database) |
| Cohere rerank (100 docs) | ~$0.0001 |
| GPT-4 assessment (30 candidates) | ~$0.03 |
| **Total per search** | **~$0.03** |

### Embedding Generation (One-Time)

| Item | Cost |
|------|------|
| 200K candidates × $0.00002 | ~$4 |
| Document text extraction | Free (local parsing) |

### Monthly Projections

| Usage | Searches/Month | Monthly Cost |
|-------|----------------|--------------|
| Light | 1,000 | $30 |
| Medium | 5,000 | $150 |
| Heavy | 20,000 | $600 |

---

## Migration History

| Migration | Description |
|-----------|-------------|
| 014_ai_matching_foundation | Base tables, vector columns, search functions |
| 015_embedding_queue | Queue system for async embedding generation |
| 016_candidate_embedding_triggers | Auto-queue triggers on candidate changes |
| 017_monitoring_health_checks | Health check functions, metrics table, dashboard |
| 018_drop_legacy_tables | Remove old chunked embedding tables |

---

## Future Improvements

1. **Batch AI assessments** - Process multiple candidates in single GPT call
2. **Cached job embeddings** - Reuse for similar job postings
3. **A/B testing framework** - Compare scoring weights
4. **Feedback loop** - Track placement success to refine matching
5. **Real-time updates** - WebSocket notifications for new matches
