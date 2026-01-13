# Match Percentage - Preferences Integration Implementation

## Summary
Implemented logic to only show match percentages when users have set their job preferences. When preferences aren't set, users see a call-to-action to set preferences instead.

## Changes Made

### 1. Backend Logic (`apps/web/app/crew/jobs/actions.ts`)
- Added `hasJobPreferences()` function to check if user has:
  - Industry preference set (yacht/household/both)
  - At least one primary position matching their industry preference
- Added `hasJobPreferences: boolean` to `JobsPageData` interface
- Updated `getJobsData()` to calculate and return `hasJobPreferences`

### 2. UI Components (`apps/web/app/crew/jobs/jobs-client.tsx`)

#### MatchScoreBadge Component
- Added `hasPreferences` prop
- When `hasPreferences` is false, shows `PreferencesCTABadge` instead of match score
- `PreferencesCTABadge` is a clickable link to `/crew/preferences`

#### Preferences Notice Banner
- Added prominent banner at top of jobs page when preferences aren't set
- Includes:
  - Icon and clear messaging
  - Call-to-action button to set preferences
  - Responsive design for mobile
- Only shown when `hasPreferences` is false

#### Job Cards
- Updated to pass `hasPreferences` to `MatchScoreBadge`
- Shows "Set Preferences" badge instead of match % when preferences aren't set

#### Job Detail Modal
- Updated to accept and use `hasPreferences` prop
- Shows preferences CTA in modal header when preferences aren't set

## User Experience Flow

1. **User without preferences**:
   - Sees banner at top: "Set Your Job Preferences"
   - Sees "Set Preferences" badge on each job card instead of match %
   - Clicking badge or banner button takes them to preferences page

2. **User with preferences**:
   - No banner shown
   - Sees match percentage badges on job cards (as before)
   - Match scores calculated based on their preferences

## Benefits
- Clear UX: Users understand why they don't see match scores
- Actionable: Easy path to set preferences
- Accurate: Only show match scores when we can actually calculate them
- Non-intrusive: Banner only shown when needed
