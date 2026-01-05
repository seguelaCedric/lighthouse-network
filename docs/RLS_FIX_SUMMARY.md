# 403 Error Fix: Candidate Self-Access RLS Policies

## Problem Summary

Candidates were unable to load job matches at `/crew/preferences`, receiving a **403 Forbidden** error when the API endpoint `/api/crew/job-matches` attempted to fetch their profile data.

### Root Cause

The `candidates` table had Row Level Security (RLS) enabled but **lacked policies allowing candidates to access their own profiles**. The only existing policy was `candidate_agency_access`, which only allowed:
- Agencies to view candidates they have relationships with
- All agencies to view verified/premium candidates

**There was no policy for candidates to read their own data!**

## Solution

Applied migration [`038_candidate_self_access.sql`](../supabase/migrations/038_candidate_self_access.sql) which adds three new RLS policies:

### 1. `candidate_own_profile_select` (SELECT)
Allows candidates to read their own profile via:
- **user_id matching**: For properly linked candidates
- **email matching**: For Vincere-imported candidates not yet linked
- **Preserves agency access**: Maintains existing agency access logic

### 2. `candidate_own_profile_update` (UPDATE)
Allows candidates to update their own profile via:
- **user_id matching**: Primary method
- **email matching**: Fallback for unlinked candidates

### 3. `candidate_own_profile_insert` (INSERT)
Allows candidates to create their own profile via:
- **user_id matching**: When user_id is known
- **email matching**: When registering with email only

## Technical Details

### Authentication Flow
```
auth.users (Supabase Auth)
    ↓ auth_id
users table (app users record)
    ↓ id → user_id
candidates table (candidate profiles)
```

### Email Fallback Strategy
Vincere-imported candidates have auth accounts but `user_id: null` until first login. The policies support both lookup methods:

```sql
-- Policy condition structure
user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
OR
email = (SELECT email FROM auth.users WHERE id = auth.uid())
```

## Migration Applied

**File**: [`supabase/migrations/038_candidate_self_access.sql`](../supabase/migrations/038_candidate_self_access.sql)
**Applied**: 2025-01-04 via Supabase MCP
**Status**: ✅ Success

## Verification

Test script created: [`apps/web/scripts/test-candidate-access.ts`](../apps/web/scripts/test-candidate-access.ts)

Test results:
```
✅ Candidate accessible by user_id: 6a298646-5de9-4e14-a58e-de788d3b76f4
✅ Candidate accessible by email: 6a298646-5de9-4e14-a58e-de788d3b76f4
✅ RLS policies in place
```

## Testing Instructions

### Manual Testing
1. Log in as `testcandidate@example.com` / `TestPassword123!`
2. Navigate to `/crew/preferences`
3. Verify job matches load without 403 error
4. Check browser console for any errors

### Debug Page
Visit `/crew/debug` while logged in to see:
- Auth user details
- Users table record
- Candidate record
- Linkage status

## Related Files

### API Routes
- [`/apps/web/app/api/crew/job-matches/route.ts`](../apps/web/app/api/crew/job-matches/route.ts) - Job matches endpoint
- Uses `.maybeSingle()` for graceful null handling
- Implements dual lookup (user_id + email fallback)

### Scripts
- [`/apps/web/scripts/link-user-to-candidate.ts`](../apps/web/scripts/link-user-to-candidate.ts) - Links auth users to candidates
- [`/apps/web/scripts/test-candidate-access.ts`](../apps/web/scripts/test-candidate-access.ts) - Verifies RLS fix

### Migrations
- [`001_core_schema.sql`](../supabase/migrations/001_core_schema.sql) - Original schema (missing self-access)
- [`038_candidate_self_access.sql`](../supabase/migrations/038_candidate_self_access.sql) - RLS fix migration

## Code Changes

### Query Method Update
Changed from `.single()` to `.maybeSingle()` throughout the codebase to prevent errors when records don't exist:

```typescript
// Before (throws error if not found)
const { data } = await supabase
  .from("candidates")
  .select("*")
  .eq("user_id", userId)
  .single();

// After (returns null if not found)
const { data } = await supabase
  .from("candidates")
  .select("*")
  .eq("user_id", userId)
  .maybeSingle();
```

## Impact

✅ **Fixed**: Candidates can now access their own profile data
✅ **Fixed**: Job matches API endpoint works for authenticated candidates
✅ **Fixed**: Crew layout redirect issue (changed `.single()` to `.maybeSingle()`)
✅ **Preserved**: Agency access to candidates (existing functionality)
✅ **Maintained**: Vincere import compatibility via email fallback

## Additional Fix: Crew Layout Redirect

After applying the RLS policies, candidates were still being redirected to `/auth/register` on login. This was caused by the crew layout using `.single()` which throws errors when queries fail, causing the candidate variable to be null.

**File**: [`/apps/web/app/crew/layout.tsx`](../apps/web/app/crew/layout.tsx)

**Changes made (lines 86, 95, 108)**:
```typescript
// Before (throws error if not found)
.single();

// After (returns null gracefully)
.maybeSingle();
```

This ensures that even if one lookup strategy fails, the code continues to the next strategy rather than throwing an error and triggering the registration redirect.

## Future Considerations

1. **Link Vincere candidates on first login**: Update the login flow to automatically link `user_id` when a Vincere-imported candidate first logs in.

2. **Monitor RLS performance**: The policies use subqueries which may impact performance at scale. Consider adding indexes if needed.

3. **Audit other tables**: Review other tables with RLS to ensure similar self-access patterns are implemented.

## Rollback Plan

If issues occur, the migration can be rolled back:

```sql
DROP POLICY IF EXISTS candidate_own_profile_select ON candidates;
DROP POLICY IF EXISTS candidate_own_profile_update ON candidates;
DROP POLICY IF EXISTS candidate_own_profile_insert ON candidates;

-- Restore original policy if needed
CREATE POLICY candidate_agency_access ON candidates
  FOR SELECT
  USING (
    id IN (
      SELECT candidate_id FROM candidate_agency_relationships
      WHERE agency_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
    )
    OR verification_tier IN ('verified', 'premium')
  );
```

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
