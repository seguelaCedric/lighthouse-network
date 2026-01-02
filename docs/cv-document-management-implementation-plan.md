# CV and Document Management Implementation Plan

## Executive Summary

**Goal:** Add CV and document display/upload/download functionality to the candidate section across all three portals (recruiter, candidate, client).

**Current State:**
- ✅ `cv_url` field exists in candidates table
- ✅ Document storage utilities exist (`/lib/storage/documents.ts`)
- ✅ Client portal CV download API exists (`/api/client/candidates/[id]/cv/route.ts`)
- ❌ No CV display in recruiter's candidate profile view
- ❌ No CV upload in candidate portal
- ❌ No comprehensive document management UI

**Recommended Approach:** **Existing Patterns Alignment** (2-3 days)

Mirror the proven ID document verification pattern for CV handling. This provides the best balance of speed, maintainability, and native feel.

---

## Why This Approach?

After analyzing three approaches (Minimal Change, Comprehensive System, Existing Patterns), the **Existing Patterns** approach is recommended because:

1. **Fast delivery** - Ships in 2-3 days vs 5 weeks for comprehensive system
2. **Native feel** - Uses proven patterns from ID verification (already production-tested)
3. **Low risk** - Mirrors working code, no database schema changes needed
4. **Maintainable** - Future developers immediately understand the pattern
5. **Extensible** - Can add versioning, audit logs, advanced features later if needed

---

## Implementation Overview

### Phase 1: API Routes (Backend First)
- Create `/api/candidates/[id]/cv/route.ts` (GET, POST, DELETE)
- Mirror ID verification API pattern
- Use existing verification event logging
- Update verification tier calculation

### Phase 2: Core Components
- `CVUpload.tsx` - Candidate upload component (mirrors `IDUpload.tsx`)
- `CVDisplayCard.tsx` - Recruiter read-only display
- `DocumentCard.tsx` - Reusable document display component
- `DocumentsListCard.tsx` - Aggregate documents view

### Phase 3: Portal Integration
- **Crew Portal:** Add CV upload to `/app/crew/verification/page.tsx`
- **Recruiter Portal:** Add Documents tab to `/app/candidates/[id]/page.tsx`
- **Client Portal:** Enhance existing CV download (already working)

### Phase 4: Polish
- Loading states, error handling, success toasts
- Update verification section to show CV status
- Testing across all portals

---

## Detailed Implementation Plan

### Step 1: Create Document Upload API Route

**File:** `/apps/web/app/api/documents/upload/route.ts`

**Pattern:** Enhanced version with versioning and approval workflow

**Endpoint: POST** - Upload document with versioning

```typescript
// Request body (FormData):
// - file: File
// - entityType: "candidate" | "client" | "job"
// - entityId: UUID
// - documentType: "cv" | "certification" | "passport" | etc.
// - metadata: {
//     description?: string,
//     expiryDate?: string (for certifications),
//     replaceDocumentId?: UUID (if uploading new version)
//   }

// Process:
// 1. Validate file (type, size)
// 2. Check if replacing existing document (versioning)
// 3. If replacing:
//    - Mark old version as is_latest_version = false
//    - Increment version number
//    - Set parent_document_id
// 4. Upload to Supabase Storage "documents/{entityType}/{entityId}/{timestamp}-{filename}"
// 5. Create document record in DB with status = "pending"
// 6. If documentType === "cv":
//    - Update candidates.cv_status = "pending"
//    - Log verification event "cv_uploaded"
// 7. Return document ID and status

// Response:
{
  success: true,
  document: {
    id: UUID,
    version: number,
    status: "pending",
    url: string,
    createdAt: timestamp
  }
}
```

**File:** `/apps/web/app/api/documents/[id]/approve/route.ts`

**Endpoint: POST** - Approve document (recruiter only)

```typescript
// Check user is recruiter
// Update document.status = "approved"
// Set approved_by, approved_at
// If documentType === "cv" AND is_latest_version:
//   - Update candidates.cv_url = document.file_url
//   - Update candidates.cv_document_id = document.id
//   - Update candidates.cv_status = "approved"
//   - Log verification event "cv_approved"
//   - Recalculate verification tier
// Return success
```

**File:** `/apps/web/app/api/documents/[id]/reject/route.ts`

**Endpoint: POST** - Reject document (recruiter only)

```typescript
// Request body:
// - reason: string (required)

// Process:
// Update document.status = "rejected"
// Set rejected_by, rejected_at, rejection_reason
// If documentType === "cv":
//   - Update candidates.cv_status = "rejected"
//   - Log verification event "cv_rejected"
// Notify candidate (email/notification)
// Return success
```

**File:** `/apps/web/app/api/documents/[id]/versions/route.ts`

**Endpoint: GET** - Get version history

```typescript
// Find all documents with same entity and type
// Include parent chain (follow parent_document_id)
// Order by version DESC
// Return array of versions with status, uploader, dates
```

**Key Implementation Details:**
- Use FormData for file upload (same as ID verification)
- Store in Supabase Storage bucket "cvs"
- Generate public URL from storage
- Update `candidates.cv_url` field
- Use `logVerificationEvent()` for audit trail
- Call `calculateVerificationTier()` to update candidate verification status

---

### Step 2: Create Document Upload Component (Multi-Type)

**File:** `/apps/web/components/documents/DocumentUploadModal.tsx`

**Pattern:** Enhanced version of IDUpload with multi-type support

**Features:**
- Document type selection (CV, certification, passport, etc.)
- Drag-and-drop file upload
- File validation (PDF, DOC, DOCX, images, max 10MB)
- Preview for PDFs and images
- Status badges: pending, approved, rejected
- Metadata fields (expiry date for certifications, description)
- Version replacement (upload new version of existing doc)
- Error/success messaging
- Upload progress indicator

**Status Configuration:**
```typescript
const STATUS_CONFIG = {
  pending: {
    label: "Pending Review",
    description: "Your document is waiting for recruiter approval",
    icon: Clock,
    className: "text-warning-600",
    bgClassName: "bg-warning-50 border-warning-200",
  },
  approved: {
    label: "Approved",
    description: "Your document has been approved",
    icon: CheckCircle2,
    className: "text-success-600",
    bgClassName: "bg-success-50 border-success-200",
  },
  rejected: {
    label: "Rejected",
    description: "Your document was rejected. Please upload a new version.",
    icon: XCircle,
    className: "text-error-600",
    bgClassName: "bg-error-50 border-error-200",
  },
};
```

**Document Type Options:**
```typescript
const DOCUMENT_TYPES = [
  { value: "cv", label: "CV / Resume", icon: FileText },
  { value: "certification", label: "Certification", icon: Award, requiresExpiry: true },
  { value: "passport", label: "Passport / ID", icon: CreditCard, requiresExpiry: true },
  { value: "visa", label: "Visa", icon: Plane, requiresExpiry: true },
  { value: "medical", label: "Medical Certificate", icon: Heart, requiresExpiry: true },
  { value: "reference", label: "Reference Letter", icon: Users },
  { value: "contract", label: "Contract", icon: FileSignature },
  { value: "photo", label: "Photo", icon: Camera },
  { value: "other", label: "Other Document", icon: File },
];
```

**Upload Handler:**
```typescript
const handleFileSelect = async (file: File) => {
  // Validate file type (PDF, DOC, DOCX)
  // Validate file size (max 10MB)
  // Create preview for PDFs
  // Create FormData
  // POST to /api/candidates/{candidateId}/cv
  // Handle success/error
  // router.refresh()
};
```

---

### Step 3: Create CV Display Component (Recruiter Portal)

**File:** `/apps/web/components/documents/CVDisplayCard.tsx`

**Pattern:** Read-only version of CVUpload for recruiters

**Features:**
- Status banner (no_cv, uploaded, verified)
- CV preview card with file icon
- Download button (opens in new tab or downloads)
- Verification status indicator
- Upload date display
- Candidate name display

**Component Interface:**
```typescript
interface CVDisplayCardProps {
  candidateId: string;
  cvUrl: string | null;
  candidateName: string;
  uploadedAt?: string;
  verifiedAt?: string;
  className?: string;
}
```

---

### Step 4: Create Document Management Components

**File:** `/apps/web/components/documents/DocumentCard.tsx`

**Purpose:** Display individual document with version badge, status, actions

```typescript
interface DocumentCardProps {
  document: {
    id: string;
    type: DocumentType;
    name: string;
    url: string;
    status: "pending" | "approved" | "rejected";
    version: number;
    uploadedAt: string;
    uploadedBy?: string;
    approvedAt?: string;
    approvedBy?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    expiryDate?: string;
    metadata?: Record<string, any>;
  };
  canApprove?: boolean; // Recruiter only
  canDelete?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
  onDownload?: (id: string) => void;
  onViewVersions?: (id: string) => void;
}
```

**Features:**
- Status badge (pending/approved/rejected) with color coding
- Version badge (v1, v2, v3...)
- Document type icon
- Upload/approval dates
- Expiry warning (for certifications)
- Action buttons: Download, View Versions, Approve, Reject, Delete
- Rejection reason display (if rejected)

---

**File:** `/apps/web/components/documents/DocumentList.tsx`

**Purpose:** List all documents for an entity, grouped by type

```typescript
interface DocumentListProps {
  entityType: "candidate" | "client" | "job";
  entityId: string;
  documents: Document[];
  canApprove?: boolean;
  canUpload?: boolean;
  onUploadClick?: (type: DocumentType) => void;
}
```

**Features:**
- Group documents by type (CV, Certifications, References, etc.)
- Section headers with counts ("CV (1)", "Certifications (3)")
- Empty state per section
- Quick filters: All, Pending, Approved, Rejected
- Sort by: Date, Status, Type

---

**File:** `/apps/web/components/documents/DocumentVersionHistory.tsx`

**Purpose:** Show version timeline for a document

```typescript
interface DocumentVersionHistoryProps {
  documentId: string;
  versions: Array<{
    id: string;
    version: number;
    status: string;
    uploadedAt: string;
    uploadedBy: string;
    approvedAt?: string;
    isLatest: boolean;
  }>;
}
```

**Features:**
- Timeline view (vertical)
- Version number badges
- Status indicators
- Upload/approval dates
- "Current version" badge for latest
- Download action for each version
- Restore previous version option (recruiter only)

---

**File:** `/apps/web/components/documents/DocumentApprovalCard.tsx`

**Purpose:** Recruiter-facing approval/rejection UI

```typescript
interface DocumentApprovalCardProps {
  document: Document;
  candidateName: string;
  onApprove: () => void;
  onReject: (reason: string) => void;
}
```

**Features:**
- Large document preview (PDF viewer or image)
- Candidate info
- Document metadata
- Approve button (green, prominent)
- Reject button (red) with reason modal
- Rejection reason dropdown:
  - "Unclear or blurry"
  - "Document expired"
  - "Wrong document type"
  - "Information incomplete"
  - "Other" (with text field)

---

### Step 5: Add Documents Tab to Candidate Profile (Recruiter View)

**File:** `/apps/web/app/candidates/[id]/page.tsx`

**Changes:**

1. **Add Documents tab** to tabs array (around line 117):
```typescript
const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "certifications", label: "Certifications", icon: Award },
  { id: "references", label: "References", icon: Users },
  { id: "documents", label: "Documents", icon: FileText }, // NEW
  { id: "notes", label: "Notes", icon: StickyNote },
];
```

2. **Add tab content** (after Notes tab, around line 952):
```typescript
{activeTab === "documents" && (
  <div className="space-y-6">
    {/* CV Section */}
    <CVDisplayCard
      candidateId={candidateId}
      cvUrl={candidate.cv_url}
      candidateName={`${candidate.first_name} ${candidate.last_name}`}
      uploadedAt={candidate.cv_uploaded_at}
      verifiedAt={candidate.cv_verified_at}
    />

    {/* Other Documents Section */}
    <DocumentsListCard
      candidateId={candidateId}
      certifications={candidate.certifications}
      references={candidate.references}
    />
  </div>
)}
```

3. **Optional: Add CV download button to header** (around line 420):
```typescript
{candidate.cv_url && (
  <a
    href={candidate.cv_url}
    target="_blank"
    rel="noopener noreferrer"
  >
    <Button variant="secondary" size="sm">
      <Download className="mr-2 size-4" />
      Download CV
    </Button>
  </a>
)}
```

---

### Step 6: Add CV Upload to Candidate Portal

**File:** `/apps/web/app/crew/verification/page.tsx`

**Integration:** Add CVUpload component after email verification section

```typescript
{/* CV Upload Section */}
<div className="space-y-6">
  <h2 className="text-xl font-semibold text-navy-900">Upload Your CV</h2>
  <CVUpload
    candidateId={candidate.id}
    status={
      candidate.cv_verified_at
        ? "verified"
        : candidate.cv_url
          ? "uploaded"
          : "not_uploaded"
    }
    documentUrl={candidate.cv_url}
    onUploadComplete={() => {
      fetchCandidate();
      fetchVerification();
    }}
  />
</div>
```

---

### Step 7: Enhance Client Portal CV Download (Already Working)

**File:** `/apps/web/app/client/(portal)/shortlist/[jobId]/page.tsx`

**Current State:** CV download already exists at line 406-416

**Enhancement:** Add visual indicator and download tracking

```typescript
{candidate.cv_url ? (
  <Button
    variant="secondary"
    size="sm"
    onClick={async () => {
      // Existing API call to /api/client/candidates/[id]/cv
      // Already logs download in activity_logs
      const response = await fetch(`/api/client/candidates/${candidate.id}/cv`);
      const data = await response.json();
      if (data.url) {
        window.open(data.url, '_blank');
      }
    }}
  >
    <Download className="mr-2 size-4" />
    Download CV
  </Button>
) : (
  <span className="text-sm text-gray-500">CV not available</span>
)}
```

---

### Step 8: Update Verification System

**File:** `/apps/web/lib/verification/index.ts`

**Add CV upload helper:**

```typescript
export async function uploadCV(
  candidateId: string,
  file: File,
  uploadedBy: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Upload to storage
    const fileExt = file.name.split('.').pop();
    const filePath = `${candidateId}/cv_${Date.now()}.${fileExt}`;

    const supabase = await createClient();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(filePath, file);

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("cvs")
      .getPublicUrl(filePath);

    // Update candidate record
    await supabase
      .from("candidates")
      .update({
        cv_url: publicUrl,
        cv_uploaded_at: new Date().toISOString(),
        verification_updated_at: new Date().toISOString(),
      })
      .eq("id", candidateId);

    // Log event
    await logVerificationEvent(candidateId, "cv_uploaded", {
      newValue: publicUrl,
      performedBy: uploadedBy,
    });

    // Recalculate tier
    await calculateVerificationTier(candidateId);

    return { success: true, url: publicUrl };
  } catch (error) {
    return { success: false, error: "Failed to upload CV" };
  }
}
```

**Ensure CV is checked in verification tier:**

The `getVerificationChecks()` function already checks `cv_uploaded: !!candidate.cv_url` (confirmed in code exploration).

---

### Step 9: Create Supabase Storage Bucket

**Action:** Create "cvs" storage bucket in Supabase dashboard

**Configuration:**
- Public bucket: Yes (for easy access)
- File size limit: 10MB
- Allowed MIME types: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

**RLS Policies:**
- INSERT: Authenticated users only
- SELECT: Public (or restrict to organization_id)
- DELETE: Candidate (own files) or recruiter (any files)

---

### Step 10: Validation Schema

**File:** `/apps/web/lib/validations/documents.ts` (create new)

```typescript
import { z } from "zod";

export const cvUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, "File size must be less than 10MB")
    .refine(
      (file) => [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].includes(file.type),
      "Only PDF, DOC, and DOCX files are allowed"
    ),
});

export const documentTypeSchema = z.enum([
  "cv",
  "certification",
  "passport",
  "visa",
  "medical",
  "reference",
  "contract",
  "photo",
  "other",
]);
```

---

## Database Schema Changes Required

### New Migration: `013_document_versioning.sql`

**Enhance `documents` table for versioning:**

```sql
-- Add versioning columns
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_document_id UUID REFERENCES documents(id),
  ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN DEFAULT TRUE,

  -- Add approval workflow columns
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_version ON documents(entity_type, entity_id, document_type, version);
CREATE INDEX IF NOT EXISTS idx_documents_latest ON documents(is_latest_version) WHERE is_latest_version = TRUE;
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_parent ON documents(parent_document_id) WHERE parent_document_id IS NOT NULL;

-- Update candidates table to always point to latest approved CV
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS cv_document_id UUID REFERENCES documents(id),
  ADD COLUMN IF NOT EXISTS cv_status TEXT DEFAULT 'not_uploaded' CHECK (cv_status IN ('not_uploaded', 'pending', 'approved', 'rejected'));

-- Create function to get latest approved document
CREATE OR REPLACE FUNCTION get_latest_approved_document(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_document_type TEXT
)
RETURNS UUID AS $$
DECLARE
  v_document_id UUID;
BEGIN
  SELECT id INTO v_document_id
  FROM documents
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND document_type = p_document_type
    AND status = 'approved'
    AND is_latest_version = TRUE
    AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN v_document_id;
END;
$$ LANGUAGE plpgsql;
```

**Key Changes:**
- `documents.version` - Track version number (1, 2, 3...)
- `documents.parent_document_id` - Link to previous version
- `documents.is_latest_version` - Flag for latest version
- `documents.status` - Approval status (pending/approved/rejected)
- `candidates.cv_document_id` - FK to current approved CV document
- `candidates.cv_status` - Quick status check (not_uploaded/pending/approved/rejected)
- Keep `candidates.cv_url` for backward compatibility (auto-updated when CV approved)

---

## UI/UX Pattern Consistency

### Component Styling
- Use `rounded-xl border border-gray-200 bg-white` for cards
- Status badges with icon, label, description, className, bgClassName
- Drag-and-drop area with dashed border on hover
- Lucide-react icons: FileText, Download, Upload, CheckCircle2

### Color Scheme
- Success: `text-success-600`, `bg-success-50`, `border-success-200`
- Error: `text-error-600`, `bg-error-50`, `border-error-200`
- Warning: `text-warning-600`, `bg-warning-50`, `border-warning-200`
- Neutral: `text-gray-600`, `bg-gray-50`, `border-gray-200`

### Button Variants
- Primary: `variant="primary"` (gold background)
- Secondary: `variant="secondary"` (white background, border)
- Ghost: `variant="ghost"` (transparent, hover effect)

### Spacing
- Card padding: `p-6`
- Section gaps: `gap-6` or `space-y-6`
- Element margins: `mb-4`, `mt-2`

---

## Testing Checklist

### Recruiter Portal
- [ ] Open candidate with CV → see Documents tab
- [ ] Documents tab shows CV card with download button
- [ ] Click download → CV opens in new tab
- [ ] Open candidate without CV → see "No CV uploaded" message
- [ ] Documents tab shows certifications with documents
- [ ] Documents tab shows references with documents

### Candidate Portal
- [ ] Navigate to verification page
- [ ] See CV upload section
- [ ] Drag PDF file → preview shows
- [ ] Click upload → success message, verification tier updates
- [ ] Try 15MB file → error message "File too large"
- [ ] Try .txt file → error message "Invalid file type"
- [ ] Upload CV → see "uploaded" status
- [ ] Replace CV → new version uploaded, old replaced

### Client Portal
- [ ] View shortlisted candidates
- [ ] See "Download CV" button for candidates with CVs
- [ ] Click download → CV opens
- [ ] View candidates not shortlisted → no CV access
- [ ] Download tracked in activity_logs (verify in database)

### API Testing
- [ ] POST /api/candidates/{id}/cv with valid file → 200, cv_url updated
- [ ] POST with invalid file type → 400 error
- [ ] POST with file too large → 400 error
- [ ] GET /api/candidates/{id}/cv as recruiter → returns cv_url
- [ ] GET as candidate (own profile) → returns status
- [ ] GET as candidate (other profile) → 403 forbidden
- [ ] DELETE /api/candidates/{id}/cv → cv_url cleared, file deleted

---

## Critical Files to Review Before Implementation

### Primary Reference Files (Understand Patterns)
1. `/apps/web/components/verification/IDUpload.tsx` - Upload component pattern (318 lines)
2. `/apps/web/app/api/candidates/[id]/id-verification/route.ts` - API pattern
3. `/apps/web/lib/verification/index.ts` - Verification logic pattern
4. `/apps/web/app/candidates/[id]/page.tsx` - Tab UI pattern (993 lines)

### Integration Points (Where New Code Goes)
5. `/apps/web/app/crew/verification/page.tsx` - Add CV upload for candidates
6. `/apps/web/components/verification/VerificationSection.tsx` - Update CV check display

### Supporting Files (Utilities)
7. `/packages/database/types.ts` - Verify field definitions (cv_url at line 299)
8. `/apps/web/lib/supabase/server.ts` - Supabase client pattern
9. `/apps/web/lib/validations/verification.ts` - Validation patterns

### UI Components (Styling Consistency)
10. `/apps/web/components/ui/button.tsx` - Button component
11. `/apps/web/components/verification/IDReviewModal.tsx` - Review modal pattern (if approval workflow)

---

## Future Enhancements (Post-MVP)

These can be added later without changing the core implementation:

### Document Versioning
- Store multiple versions in `documents` table
- Add `version` column and `parent_document_id` FK
- UI to view version history
- Rollback to previous version

### Approval Workflow
- Add `cv_status` field: pending, approved, rejected
- Create CV review modal (mirror IDReviewModal)
- Add approval queue to recruiter dashboard
- Email notifications for status changes

### Advanced Document Management
- Support multiple document types (certifications, references, contracts)
- Bulk upload
- Document expiry reminders (for certifications)
- Document templates (for contracts)
- OCR text extraction for searchability

### Access Control & Audit
- Role-based document visibility
- Audit log table for all downloads
- Download analytics dashboard
- Share links with expiry dates

### Compliance & Reporting
- Retention policies
- GDPR export functionality
- Document expiry reports
- Compliance audit trail

---

## Implementation Timeline (This Week - 5 Days)

### Day 1: Database & Core Infrastructure
- [ ] Create migration `013_document_versioning.sql`
- [ ] Run migration on development environment
- [ ] Create Supabase storage bucket "documents"
- [ ] Set up RLS policies for documents table
- [ ] Create document service utilities (`/lib/services/documents.ts`)
- [ ] Add versioning helper functions
- [ ] Add approval workflow functions

**Deliverable:** Database ready, storage configured, core utilities implemented

### Day 2: API Routes & Backend Logic
- [ ] Create `/api/documents/upload` - Multi-type document upload with versioning
- [ ] Create `/api/documents/[id]` - GET/PATCH/DELETE document
- [ ] Create `/api/documents/[id]/versions` - Get version history
- [ ] Create `/api/documents/[id]/approve` - Approve document (recruiter only)
- [ ] Create `/api/documents/[id]/reject` - Reject document (recruiter only)
- [ ] Create `/api/candidates/[id]/documents` - Get all candidate documents
- [ ] Update `/lib/verification/index.ts` for CV approval workflow
- [ ] Add validation schemas (`/lib/validations/documents.ts`)

**Deliverable:** All API endpoints working, can upload/approve/reject via API

### Day 3: Core Components & Candidate Portal
- [ ] Create `DocumentUploadModal.tsx` - Upload with type selection, drag-drop
- [ ] Create `DocumentList.tsx` - List all documents with status badges
- [ ] Create `DocumentCard.tsx` - Individual document display with actions
- [ ] Create `DocumentVersionHistory.tsx` - Show version timeline
- [ ] Add document upload to `/app/crew/verification/page.tsx`
- [ ] Add document list to candidate profile view
- [ ] Test candidate upload flow (upload → pending → see status)

**Deliverable:** Candidates can upload CVs and documents, see pending status

### Day 4: Recruiter Portal & Approval Workflow
- [ ] Create `DocumentApprovalCard.tsx` - Approve/reject UI for recruiters
- [ ] Add Documents tab to `/app/candidates/[id]/page.tsx`
- [ ] Show all candidate documents with versions
- [ ] Add approval/rejection actions
- [ ] Create `/app/verification/page.tsx` - Verification queue for recruiters
- [ ] Filter by pending documents (CVs, certs, etc.)
- [ ] Test approval workflow (pending → approve → cv_url updated)
- [ ] Test rejection workflow (pending → reject → candidate notified)

**Deliverable:** Recruiters can approve/reject documents, see version history

### Day 5: Client Portal, Polish & Testing
- [ ] Verify client CV download still works (`/api/client/candidates/[id]/cv`)
- [ ] Update to only serve approved CVs
- [ ] Add loading states to all components
- [ ] Add error handling and user feedback (toasts)
- [ ] Add empty states ("No documents yet")
- [ ] Update VerificationSection to show CV approval status
- [ ] E2E testing across all three portals
- [ ] Bug fixes and polish

**Deliverable:** Complete system working, tested, ready for production

**Total: 5 days (this week)** - Core functionality complete with approval workflow and versioning

---

## Success Criteria

### Core Functionality
✅ Candidates can upload multiple document types (CV, certifications, etc.)
✅ All uploads go to "pending" status awaiting recruiter approval
✅ Recruiters can approve/reject documents with reasons
✅ Approved CVs automatically update candidates.cv_url
✅ Document versioning works (can upload new version, see history)
✅ Clients can only download approved CVs for shortlisted candidates

### Approval Workflow
✅ Pending documents appear in recruiter verification queue
✅ Recruiters can approve with one click
✅ Recruiters can reject with reason (from predefined list)
✅ Candidates see approval status on their documents
✅ Email notifications sent on approval/rejection (optional for week 1)

### Versioning
✅ Uploading new CV creates version 2, 3, etc.
✅ Previous versions marked as is_latest_version = false
✅ Version history visible in UI (timeline view)
✅ Can download any previous version
✅ cv_url always points to latest approved version

### UI/UX
✅ Status badges clearly show pending/approved/rejected
✅ Version badges show v1, v2, v3...
✅ Expiry warnings for certifications
✅ Empty states guide users to upload
✅ Loading states during upload/approval
✅ Success/error toasts for all actions
✅ UI consistent with existing ID verification pattern

### Security & Validation
✅ File validation prevents invalid uploads (type, size)
✅ Only recruiters can approve/reject
✅ Candidates can only upload to own profile
✅ Clients only access approved CVs for shortlisted candidates
✅ All actions logged to verification_events table
✅ RLS policies enforce access control

### Performance
✅ Documents list paginated (if >20 documents)
✅ Image/PDF previews optimized
✅ Upload progress indicator
✅ No performance regression on existing pages

---

## Final Requirements (User Confirmed)

✅ **1. Approval Workflow:** Manual approval (CV uploaded → pending → recruiter reviews → approved/rejected)
- Mirror ID document verification pattern
- Add cv_status field: "pending", "approved", "rejected"
- Recruiters approve/reject from verification queue or candidate profile
- Clients only see approved CVs

✅ **2. Document Versioning:** Keep version history
- Store all versions in `documents` table
- Track version numbers (v1, v2, v3...)
- Link versions with parent_document_id
- Show version history in UI
- cv_url always points to latest approved version

✅ **3. Document Types:** Multiple types (CV, certifications, references, photos, etc.)
- Use existing `documents` table with document_type field
- Support: cv, certification, passport, visa, medical, reference, contract, photo, other
- Each document type has appropriate metadata (expiry dates for certs, etc.)
- Comprehensive document management UI

✅ **4. Timeline:** This week (core functionality)
- Focus on CV upload/approval/display first
- Other document types can use same infrastructure
- Prioritize recruiter approval workflow
- Polish can come in follow-up iterations

---

## Notes

- This plan mirrors the proven ID verification pattern for consistency
- No database schema changes required (uses existing cv_url field)
- Can extend to comprehensive document system later without refactoring
- Minimal risk as it reuses working patterns
- Native feel as it follows existing UI/UX conventions
