# Salary Guide PDF Setup

This document outlines the setup for generating and delivering the 2026 Salary Guide as a PDF via email.

## Overview

The salary guide PDF system consists of:
1. **PDF Generation API** (`/api/salary-guide/pdf`) - Generates PDF and uploads to Supabase Storage
2. **Email Request API** (`/api/salary-guide/request`) - Handles email submissions and sends link to PDF
3. **Lead Capture Component** - Frontend form for email collection
4. **Database Table** - Stores email leads
5. **Supabase Storage Bucket** - Public bucket for storing the PDF

## Environment Variables

Make sure these are set in your `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3004  # or your production URL
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Database Setup

Run the migration to create the `salary_guide_leads` table:

```bash
# The migration file is: supabase/migrations/051_salary_guide_leads.sql
# Apply it via Supabase dashboard or CLI
```

## Storage Bucket Setup

Create a public bucket in Supabase Storage for the PDF:

### Option 1: Using the Setup Script

```bash
cd apps/web
pnpm tsx scripts/setup-salary-guides-bucket.ts
```

### Option 2: Manual Setup via Dashboard

1. Go to Supabase Dashboard > Storage > Buckets
2. Click "New bucket"
3. Configure:
   - **Name**: `salary-guides`
   - **Public bucket**: `Yes` (required for public download links)
   - **File size limit**: `10 MB` (or as needed)
   - **Allowed MIME types**: `application/pdf`
4. Click "Create bucket"

The bucket must be **public** so that the PDF can be downloaded via the public URL.

## PDF Generation

The PDF is generated using Puppeteer, which:
1. Launches a headless browser
2. Navigates to `/salary-guide` (the salary guide page)
3. Renders the page as a PDF
4. Uploads the PDF to Supabase Storage (`salary-guides` bucket)
5. Returns the public URL

### Installation

Puppeteer is installed as a dependency:

```bash
pnpm add puppeteer
```

### Caching

The PDF is cached in Supabase Storage. On first request, it's generated and uploaded. Subsequent requests return the existing public URL without regenerating the PDF.

### Serverless Considerations

For serverless environments (Vercel, etc.), Puppeteer may not work due to size limits. Options:
1. Use `puppeteer-core` with a remote browser service (Browserless)
2. Pre-generate PDFs and upload to storage manually
3. Use a service like Gotenberg

## Email Delivery

The email includes:
- A download link to the PDF (public URL from Supabase Storage)
- No attachment (PDF is delivered via public link)

The email is sent via Resend using the `sendEmail` utility from `lib/email/client.ts`.

## How It Works

1. User submits email via lead capture form on `/salary-guide`
2. API stores lead in `salary_guide_leads` table
3. API calls `/api/salary-guide/pdf` to get/ensure PDF exists in storage
4. API sends email with public download link to the PDF
5. User clicks link and downloads PDF directly from Supabase Storage

## Testing

1. Ensure the `salary-guides` bucket exists and is public
2. Submit an email via the lead capture form on `/salary-guide`
3. Check your email for the download link
4. Verify the PDF downloads correctly from the link
5. Verify the lead is stored in `salary_guide_leads` table

## Migration Files

- `supabase/migrations/051_salary_guide_leads.sql` - Creates the leads table
- `supabase/migrations/052_create_salary_guides_bucket.sql` - Documents bucket setup (run script instead)
