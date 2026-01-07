-- Create public bucket for salary guide PDFs
-- This bucket should be public so anyone can download the PDF via the public URL

-- Note: Supabase Storage buckets must be created via the dashboard or API
-- This migration documents the bucket configuration
-- To create the bucket, run: apps/web/scripts/setup-salary-guides-bucket.ts
-- Or create it manually in the Supabase dashboard:
-- 1. Go to Storage > Buckets
-- 2. Click "New bucket"
-- 3. Name: salary-guides
-- 4. Public bucket: Yes
-- 5. File size limit: 10 MB (or as needed)
-- 6. Allowed MIME types: application/pdf

-- RLS policies for public bucket (if needed for tracking)
-- Since it's public, we don't need RLS policies for reading
-- But we can add a policy to allow service role to upload

-- Allow service role to upload/update PDFs
CREATE POLICY IF NOT EXISTS "Service role can manage salary guide PDFs"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'salary-guides')
WITH CHECK (bucket_id = 'salary-guides');

-- Allow public read access (bucket should be public, but this ensures it)
CREATE POLICY IF NOT EXISTS "Public can read salary guide PDFs"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'salary-guides');

