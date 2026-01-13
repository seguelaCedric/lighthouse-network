# Match Percentage - Preferences Integration Plan

## Problem
Currently, match percentages are shown even when users haven't set their job preferences. This doesn't make sense because we can't accurately calculate matches without knowing what they're looking for.

## Solution
1. **Check if preferences are set**: Determine if user has:
   - Industry preference (yacht/household/both)
   - At least one primary position set (yacht_primary_position OR household_primary_position)
   
2. **Conditional Match Display**:
   - If preferences are set → Show match percentage as before
   - If preferences are NOT set → Show call-to-action to set preferences

3. **UX Improvements**:
   - Add a banner at top of jobs page if preferences aren't set
   - Replace match badge with "Set Preferences" button/link
   - Make it easy to navigate to preferences page

## Implementation Steps

1. Add `hasPreferences` boolean to `JobsPageData`
2. Create helper function to check if preferences are complete
3. Update `MatchScoreBadge` component to show CTA when no preferences
4. Add banner/notice at top of jobs page
5. Update job cards to conditionally show match or CTA
