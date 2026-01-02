# Supabase Storage Setup for Document Management

## Create Storage Bucket

You need to create a `documents` bucket in Supabase Storage for the document management system to work.

### Via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/ozcuponldhepkdjmemvm/storage/buckets
2. Click **New bucket**
3. Configure:
   - **Name**: `documents`
   - **Public bucket**: `No` (private)
   - **File size limit**: `10 MB` (or adjust as needed)
   - **Allowed MIME types**: Leave empty or specify:
     - `application/pdf`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     - `image/jpeg`
     - `image/png`
     - `image/gif`
4. Click **Create bucket**

## Row Level Security (RLS) Policies

After creating the bucket, add these RLS policies:

### 1. Allow Authenticated Users to Upload

```sql
-- Policy: Allow candidates to upload to their own folder
CREATE POLICY "Candidates can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 2. Allow Users to View Their Own Documents

```sql
-- Policy: Allow users to view their own documents
CREATE POLICY "Users can view own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    -- User can see their own documents
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Recruiters can see all documents in their organization
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.user_type = 'recruiter'
    )
  )
);
```

### 3. Allow Users to Delete Their Own Documents

```sql
-- Policy: Allow users to delete their own documents
CREATE POLICY "Users can delete own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 4. Allow Recruiters to View All Documents

```sql
-- Policy: Recruiters can view all documents
CREATE POLICY "Recruiters can view all documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_id = auth.uid()
    AND users.user_type = 'recruiter'
  )
);
```

## Apply Policies via Dashboard

1. Go to: https://supabase.com/dashboard/project/ozcuponldhepkdjmemvm/storage/policies
2. Click on **documents** bucket
3. Click **New policy**
4. Choose **Create a policy from scratch**
5. Paste each policy SQL above
6. Click **Review** then **Save policy**

## Verify Setup

After setup, test by:

1. **Upload a test document** via the candidate portal at `/crew/verification`
2. **Check storage** at: https://supabase.com/dashboard/project/ozcuponldhepkdjmemvm/storage/buckets/documents
3. **Verify the document** appears in the database:
   ```sql
   SELECT * FROM documents ORDER BY created_at DESC LIMIT 5;
   ```

## Storage Structure

Documents will be stored in this structure:
```
documents/
├── {candidate_id}/
│   ├── cv-{timestamp}.pdf
│   ├── certification-{timestamp}.pdf
│   ├── passport-{timestamp}.jpg
│   └── ...
```

## Next: Use Supabase MCP

If you have Supabase MCP connected, you can manage storage programmatically:

```javascript
// Example: List buckets
await supabase.storage.listBuckets()

// Example: Upload file
await supabase.storage
  .from('documents')
  .upload('candidate-id/cv.pdf', file)
```

Your MCP config should give you tools to:
- Create/delete buckets
- Upload/download files
- Manage policies
- Query database directly

Check available tools with: `/mcp list tools`
