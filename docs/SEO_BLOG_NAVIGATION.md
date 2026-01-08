# SEO & Blog Management - Navigation Guide

## Quick Access

### From Dashboard Sidebar
- **SEO & Blog** - Main navigation item in the left sidebar
- Click to access blog management

### From Dashboard Quick Actions
- **Blog Posts** - View all blog posts
- **Generate Blog Post** - Create new AI-generated content

## Full Navigation Paths

### Blog Management (CMS)
1. **Blog List View**
   - Path: `/dashboard/seo-pages/blog`
   - Features: Filter, search, view all posts, edit, publish

2. **Create New Blog Post**
   - Path: `/dashboard/seo-pages/blog/new`
   - Features: AI generation interface with content type selector

3. **Edit Blog Post**
   - Path: `/dashboard/seo-pages/blog/[id]`
   - Features: Rich text editor, SEO preview, publish workflow

### Public Pages
1. **Blog Listing**
   - Path: `/blog`
   - Public-facing blog index

2. **Individual Blog Post**
   - Path: `/blog/[slug]`
   - Example: `/blog/complete-guide-hiring-butler-sydney`

3. **SEO Landing Pages** (with match preview)
   - Path: Uses your existing `original_url_path` format
   - Example: `/hire-a-butler-australia/new-south-wale/sydney-2`
   - Features: Match preview, internal linking, enhanced structured data

4. **Position Hub Pages**
   - Path: `/hire-a-[position]`
   - Example: `/hire-a-butler`
   - Shows all locations for that position

5. **Location Hub Pages**
   - Path: `/hire-in-[location]`
   - Example: `/hire-in-sydney`
   - Shows all positions for that location

## API Endpoints

### Blog Management
- `GET /api/blog-posts` - List posts (with filters)
- `POST /api/blog-posts` - Create new post
- `GET /api/blog-posts/[id]` - Get single post
- `PATCH /api/blog-posts/[id]` - Update post
- `DELETE /api/blog-posts/[id]` - Delete post
- `POST /api/blog-posts/[id]/generate` - Generate with AI
- `POST /api/blog-posts/[id]/publish` - Publish post

### SEO Tools
- `GET /api/seo/url-health` - Check URL health for all landing pages

## Workflow

### Creating a Blog Post
1. Navigate to **SEO & Blog** in sidebar
2. Click **"New Post"** button
3. Select target audience (Employer/Candidate/Both)
4. Choose content type
5. Enter position, location, primary keyword
6. Click **"Generate with AI"**
7. Review preview
8. Click **"Save & Edit"** to refine
9. Publish when ready

### Managing Existing Posts
1. Navigate to **SEO & Blog** in sidebar
2. Use filters to find posts
3. Click **Edit** icon to modify
4. Update content, SEO metadata
5. Change status or publish

## Features Available

✅ AI Blog Generation (13+ content types)
✅ Editorial Workflow (Draft → Review → Published)
✅ SEO Optimization (Meta titles, descriptions, keywords)
✅ Internal Linking (Auto-links to landing pages)
✅ URL Mapping (Preserves existing URL structure)
✅ Analytics Tracking (Match preview, conversions, links)
✅ Public Blog Pages
✅ Hub Pages (Position & Location aggregators)
