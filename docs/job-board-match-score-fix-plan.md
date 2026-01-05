# Job Board Match Score Fix Plan

## Problem
Currently, both the public job board and candidate dashboard show match percentages for all jobs when a user is connected, even for positions that are not relevant to the candidate's profile. For example, a Chef position might show a 60% match for someone looking for Deck positions, simply because they match on region, vessel type, or other non-position factors. This is misleading because the position itself doesn't match.

## Requirements
- Jobs should still be displayed (no filtering)
- Match percentages should only be shown for positions that are actually relevant
- "Relevant" means: exact position match, secondary position match, or same department match
- Jobs without position relevance should not show a match percentage badge
- Applies to both:
  - Public job board (`/job-board`)
  - Candidate dashboard (`/crew/dashboard`)
  - Candidate jobs page (`/crew/jobs`)

## Solution Approach

### 1. Modify Public Job Board Match Score API (`/apps/web/app/api/public/job-match/route.ts`)

**Changes needed:**
- Update `calculateMatchScore` function to return both `score` and `isRelevant` boolean
- `isRelevant` should be `true` if:
  - Exact position match (primary or secondary)
  - Related position match (same department)
- `isRelevant` should be `false` if:
  - No position match at all (different department)
- Return structure: `{ score: number, isRelevant: boolean }`

**Current logic:**
- Base score of 50
- Adds points for position match (0, 8, 12, or 20)
- Adds points for other factors (vessel type, region, contract, salary, etc.)

**New logic:**
- Keep the same scoring
- Track position match level separately
- Set `isRelevant = true` only if position match exists (exact, secondary, or same department)
- Set `isRelevant = false` if no position match

### 2. Update Public Job Board API Response (`/apps/web/app/api/public/job-match/route.ts`)

**Current response:**
```typescript
{
  authenticated: true,
  scores: { [jobId]: number }
}
```

**New response:**
```typescript
{
  authenticated: true,
  scores: { [jobId]: { score: number, isRelevant: boolean } }
}
```

### 3. Update Public Job Board Client (`/apps/web/app/job-board/JobBoardClient.tsx`)

**Changes needed:**
- Update `matchScores` state type from `Record<string, number>` to `Record<string, { score: number, isRelevant: boolean }>`
- Update score extraction logic to handle new structure
- Only pass `matchScore` to components when `isRelevant === true`
- Update sorting logic to handle new structure

### 4. Update Candidate Dashboard (`/apps/web/app/crew/dashboard/actions.ts`)

**Changes needed:**
- Replace simple placeholder match calculation (lines 368-376) with proper `calculateMatchScore` function
- Use the same `calculateMatchScore` logic from `/apps/web/app/crew/jobs/actions.ts`
- Only include `matchPercentage` in `MatchedJob` when `matchType !== "none"`
- Update `MatchedJob` interface to make `matchPercentage` optional

**Current logic:**
- Simple check: if job title includes primary position, score = 95, else 70
- Always shows a match percentage

**New logic:**
- Use proper `calculateMatchScore` function
- Only set `matchPercentage` when position is relevant
- Dashboard component already handles optional `matchPercentage` correctly

### 5. Update Candidate Jobs Page (`/apps/web/app/crew/jobs/actions.ts` and `jobs-client.tsx`)

**Changes needed:**
- The `calculateMatchScore` function already returns `{ score, matchType }`
- Update `MatchScoreBadge` component to return `null` when `matchType === "none"` (currently it still shows score)
- Update sorting to prioritize relevant jobs

**Current behavior:**
- Shows match score even when `matchType === "none"`
- Score can be > 0 even without position match (due to other factors)

**New behavior:**
- Only show match score when `matchType === "exact"` or `matchType === "related"`
- Set `matchScore = null` when `matchType === "none"`

### 6. Update Job Display Components

**Files to update:**
- `JobBoardCard.tsx` - Already handles `matchScore?: number`, no changes needed
- `JobBoardListItem.tsx` - Already handles `matchScore?: number`, no changes needed
- `jobs-client.tsx` - `MatchScoreBadge` needs to check `matchType !== "none"` before showing
- `dashboard-client.tsx` - Already handles optional `matchPercentage`, no changes needed

**Behavior:**
- Components already check `matchScore !== undefined` or `matchPercentage !== undefined` before displaying
- If `isRelevant === false` or `matchType === "none"`, we'll pass `undefined`/`null` as `matchScore`
- This means irrelevant jobs won't show match badges (desired behavior)

### 7. Update Sorting Logic

**Public Job Board (`JobBoardClient.tsx`):**
- Urgent first
- Then by match score (only for relevant jobs)
- Then by date
- Irrelevant jobs (no match score) sorted by date only

**Candidate Dashboard (`actions.ts`):**
- Already sorts by urgency and date
- No changes needed (match scores are just for display)

**Candidate Jobs Page (`actions.ts`):**
- Already sorts by urgency, then match score
- No changes needed (irrelevant jobs will have `matchScore = null` and sort last)

## Implementation Steps

1. **Step 1:** Modify `calculateMatchScore` function in `/apps/web/app/api/public/job-match/route.ts`
   - Add `isRelevant` boolean tracking based on position match
   - Return `{ score, isRelevant }` instead of just `score`

2. **Step 2:** Update public job board API response structure
   - Change scores object to include both score and isRelevant
   - Update response JSON structure

3. **Step 3:** Update `JobBoardClient.tsx` (public job board)
   - Update state type for `matchScores`
   - Update score extraction and filtering logic
   - Only pass `matchScore` prop when `isRelevant === true`
   - Update sorting to handle new structure

4. **Step 4:** Update candidate dashboard (`/apps/web/app/crew/dashboard/actions.ts`)
   - Import or copy `calculateMatchScore` and related functions from `crew/jobs/actions.ts`
   - Replace simple placeholder calculation with proper matching
   - Only set `matchPercentage` when `matchType !== "none"`
   - Update `MatchedJob` interface to make `matchPercentage` optional

5. **Step 5:** Update candidate jobs page (`/apps/web/app/crew/jobs/jobs-client.tsx`)
   - Update `MatchScoreBadge` component to return `null` when `matchType === "none"`
   - Ensure `matchScore` is set to `null` when `matchType === "none"` in actions

6. **Step 6:** Test all three locations
   - Public job board: Verify irrelevant jobs don't show match percentages
   - Candidate dashboard: Verify irrelevant jobs don't show match percentages
   - Candidate jobs page: Verify irrelevant jobs don't show match percentages
   - Verify relevant jobs still show match percentages in all locations
   - Verify sorting still works correctly
   - Verify jobs are still displayed (not filtered out)

## Edge Cases to Handle

1. **No position in candidate profile:** 
   - If candidate has no primary/secondary positions, all jobs should be considered `isRelevant = false`
   - Or we could consider all jobs relevant if no position preference is set (user decision needed)

2. **Position normalization:**
   - Ensure position matching logic handles variations correctly
   - Test with different position name formats

3. **Backward compatibility:**
   - If API fails or returns old format, handle gracefully
   - Don't break if `isRelevant` is missing

## Testing Checklist

- [ ] Login as candidate with specific position preferences
- [ ] View job board
- [ ] Verify jobs matching position show match percentages
- [ ] Verify jobs NOT matching position don't show match percentages
- [ ] Verify all jobs are still displayed (not filtered)
- [ ] Verify sorting works correctly (relevant jobs with scores sorted first)
- [ ] Test with candidate who has no position preferences
- [ ] Test with candidate who has secondary positions
- [ ] Test edge cases (missing data, API errors)

## Files to Modify

1. `/apps/web/app/api/public/job-match/route.ts` - Public job board matching logic
2. `/apps/web/app/job-board/JobBoardClient.tsx` - Public job board client-side display logic
3. `/apps/web/app/crew/dashboard/actions.ts` - Candidate dashboard matching logic
4. `/apps/web/app/crew/jobs/actions.ts` - Candidate jobs page matching logic (set matchScore to null when matchType === "none")
5. `/apps/web/app/crew/jobs/jobs-client.tsx` - Candidate jobs page MatchScoreBadge component

## Files That Don't Need Changes

- `JobBoardCard.tsx` - Already handles optional `matchScore`
- `JobBoardListItem.tsx` - Already handles optional `matchScore`
- `JobMatchBadge.tsx` - Already handles score display
- `dashboard-client.tsx` - Already handles optional `matchPercentage`

