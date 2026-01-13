# Mobile Jobs Page Layout Fix Plan

## Issues Identified

### 1. Header Section
- **Issue**: Padding `px-6 py-6` is too large on mobile
- **Issue**: Heading text size `text-3xl` is too large on mobile
- **Issue**: Description text might overflow on small screens
- **Fix**: Use responsive padding (`px-4 py-4 sm:px-6 sm:py-6`) and text sizes

### 2. Search Bar
- **Issue**: Height `h-12` might be too tall on mobile
- **Issue**: Icon positioning might need adjustment
- **Fix**: Use responsive height and icon sizing

### 3. Filter Section
- **Issue**: Filters in `flex-wrap` might overflow or be too cramped
- **Issue**: Filter inputs might be too wide on mobile
- **Issue**: Salary range inputs might overflow
- **Fix**: Stack filters vertically on mobile, use full-width inputs

### 4. Job Cards - Critical Issues
- **Issue**: `pr-48` (padding-right 12rem) is WAY too large for mobile - causing content to be pushed left
- **Issue**: Match score badge positioned absolutely might overlap content
- **Issue**: Grid layout `grid-cols-2` might be too cramped on mobile
- **Issue**: Footer buttons might overflow on mobile
- **Fix**: 
  - Remove or significantly reduce right padding on mobile
  - Reposition match badge for mobile
  - Make details grid single column on mobile
  - Stack or scroll footer buttons on mobile

### 5. Results Section
- **Issue**: Padding `px-6 py-6` might be too large
- **Fix**: Use responsive padding

## Implementation Plan

1. Fix header responsive padding and text sizes
2. Fix search bar mobile sizing
3. Fix filter section - stack vertically on mobile
4. Fix job card layout - remove excessive padding, improve mobile grid
5. Fix job card footer - make buttons responsive
6. Fix match score badge positioning
7. Test on mobile viewport
