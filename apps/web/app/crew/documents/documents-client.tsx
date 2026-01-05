"use client";

import * as React from "react";
import {
  Upload,
  FileText,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Trash2,
  Download,
  Plus,
  RefreshCw,
  ChevronRight,
  FileImage,
  File,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  DocumentPreviewModal,
  DocumentCategoryTabs,
  categorizeDocumentType,
  filterAndSortDocuments,
  countDocumentsByCategory,
  UploadQueue,
  createQueuedFile,
  type DocumentCategory,
  type DocumentStatus,
  type SortOption,
  type QueuedFile,
} from "@/components/documents";
import {
  type DocumentsPageData,
  type Document,
  type CertificationDocument,
  deleteDocument,
} from "./actions";

// Document type display names
const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  cv: "CV / Resume",
  certification: "Certification",
  passport: "Passport",
  visa: "Visa",
  medical: "Medical Certificate",
  reference: "Reference Letter",
  contract: "Contract",
  photo: "Photo",
  other: "Other Document",
};

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// Format date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Get file icon based on mime type
function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return <FileImage className="w-5 h-5 text-purple-600" />;
  }
  if (mimeType === "application/pdf") {
    return <FileText className="w-5 h-5 text-red-600" />;
  }
  return <File className="w-5 h-5 text-gray-600" />;
}
// Status badge component - using luxury gold/success/error colors
function StatusBadge({
  status,
}: {
  status: "pending" | "approved" | "rejected";
}) {
  const config = {
    pending: {
      icon: Clock,
      label: "Pending Review",
      className: "bg-gold-100 text-gold-700 border-gold-200",
    },
    approved: {
      icon: CheckCircle2,
      label: "Approved",
      className: "bg-success-100 text-success-700 border-success-200",
    },
    rejected: {
      icon: XCircle,
      label: "Rejected",
      className: "bg-error-100 text-error-700 border-error-200",
    },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border",
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

// Certification status badge - using luxury gold/success/error colors
function CertificationStatusBadge({
  status,
  daysUntilExpiry,
}: {
  status: CertificationDocument["status"];
  daysUntilExpiry: number | null;
}) {
  const config = {
    valid: {
      icon: CheckCircle2,
      label: "Valid",
      className: "bg-success-100 text-success-700 border-success-200",
    },
    expiring_soon: {
      icon: AlertTriangle,
      label: daysUntilExpiry
        ? `Expires in ${daysUntilExpiry} days`
        : "Expiring Soon",
      className: "bg-warning-100 text-warning-700 border-warning-200",
    },
    expired: {
      icon: XCircle,
      label: "Expired",
      className: "bg-error-100 text-error-700 border-error-200",
    },
    no_document: {
      icon: Clock,
      label: "No Document",
      className: "bg-gray-100 text-gray-600 border-gray-200",
    },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border",
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

// CV Section Component
function CVSection({
  cv,
  candidateId,
  onUpload,
  onPreview,
}: {
  cv: Document | null;
  candidateId: string;
  onUpload: () => void;
  onPreview: (doc: Document) => void;
}) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!cv) return;
    if (!confirm("Are you sure you want to delete your CV?")) return;

    setIsDeleting(true);
    try {
      const result = await deleteDocument(cv.id);
      if (!result.success) {
        alert(result.error || "Failed to delete CV");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred while deleting");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div id="cv" className="bg-white rounded-xl border border-gray-200 p-6 shadow-[0px_2px_4px_rgba(26,24,22,0.06)] scroll-mt-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gold-100 rounded-xl">
            <FileText className="w-6 h-6 text-gold-600" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-medium text-navy-800">CV / Resume</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Your primary CV that employers will see
            </p>
          </div>
        </div>
        {cv && <StatusBadge status={cv.status} />}
      </div>

      {cv ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-cream-50 rounded-xl border border-gray-100">
            <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
              {getFileIcon(cv.mimeType)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-navy-800 truncate">{cv.name}</p>
              <p className="text-sm text-gray-500">
                {formatFileSize(cv.fileSize)} • Uploaded{" "}
                {formatDate(cv.uploadedAt)}
                {cv.version > 1 && ` • Version ${cv.version}`}
              </p>
            </div>
          </div>

          {cv.status === "rejected" && cv.rejectionReason && (
            <div className="p-4 bg-error-50 border border-error-200 rounded-xl">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-error-600 mt-0.5" />
                <div>
                  <p className="font-medium text-error-800">
                    This CV was rejected
                  </p>
                  <p className="text-sm text-error-700 mt-1">
                    {cv.rejectionReason}
                  </p>
                  <p className="text-sm text-error-600 mt-2">
                    Please upload a new version that addresses the feedback.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => onPreview(cv)}>
              <Eye className="w-4 h-4" />
              View
            </Button>
            <a
              href={cv.fileUrl}
              download
              className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-navy-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
            <Button
              variant="primary"
              size="sm"
              onClick={onUpload}
              className="ml-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Upload New Version
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-error-600 hover:text-error-700 hover:bg-error-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="p-4 bg-gold-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Upload className="w-8 h-8 text-gold-600" />
          </div>
          <h3 className="text-lg font-medium text-navy-800 mb-2">No CV uploaded yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Upload your CV to apply for jobs and let employers discover your experience.
          </p>
          <Button onClick={onUpload}>
            <Upload className="w-4 h-4" />
            Upload CV
          </Button>
        </div>
      )}
    </div>
  );
}

// Certifications Section Component
function CertificationsSection({
  certifications,
  onUpload,
}: {
  certifications: CertificationDocument[];
  onUpload: () => void;
}) {
  const expiring = certifications.filter((c) => c.status === "expiring_soon");
  const expired = certifications.filter((c) => c.status === "expired");

  return (
    <div id="certifications" className="bg-white rounded-xl border border-gray-200 p-6 shadow-[0px_2px_4px_rgba(26,24,22,0.06)] scroll-mt-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gold-100 rounded-xl">
            <Award className="w-6 h-6 text-gold-600" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-medium text-navy-800">
              Certifications
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Your maritime certifications and qualifications
            </p>
          </div>
        </div>
        <Button
          onClick={onUpload}
          className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-gold-500 to-gold-600 rounded-lg hover:from-gold-600 hover:to-gold-700 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Certification
        </Button>
      </div>

      {(expiring.length > 0 || expired.length > 0) && (
        <div className="mb-6 p-4 bg-warning-50 border border-warning-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning-600 mt-0.5" />
            <div>
              <p className="font-medium text-warning-800">Attention Required</p>
              <p className="text-sm text-warning-700 mt-1">
                {expired.length > 0 && (
                  <span>
                    {expired.length} certification(s) have expired.{" "}
                  </span>
                )}
                {expiring.length > 0 && (
                  <span>
                    {expiring.length} certification(s) are expiring soon.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {certifications.length > 0 ? (
        <div className="space-y-3">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="flex items-center justify-between p-4 bg-cream-50 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-2.5 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <Shield className="w-5 h-5 text-navy-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-navy-800">{cert.name}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    {cert.issuingAuthority && (
                      <span>{cert.issuingAuthority}</span>
                    )}
                    {cert.expiryDate && (
                      <span>Expires: {formatDate(cert.expiryDate)}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CertificationStatusBadge
                  status={cert.status}
                  daysUntilExpiry={cert.daysUntilExpiry}
                />
                {cert.documentUrl ? (
                  <a
                    href={cert.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-navy-600 hover:bg-gold-50 rounded-lg transition-colors"
                    title="View document"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                ) : (
                  <button
                    onClick={onUpload}
                    className="p-2 text-navy-600 hover:bg-gold-50 rounded-lg transition-colors"
                    title="Upload document"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="p-4 bg-gold-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Award className="w-8 h-8 text-gold-600" />
          </div>
          <h3 className="text-lg font-medium text-navy-800 mb-2">No certifications added</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Add your STCW, ENG1, and other maritime certifications to complete your profile.
          </p>
          <Button
            onClick={onUpload}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-gold-500 to-gold-600 rounded-lg hover:from-gold-600 hover:to-gold-700 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Certifications
          </Button>
        </div>
      )}
    </div>
  );
}

// Other Documents Section with filtering
function OtherDocumentsSection({
  documents,
  onUpload,
  onPreview,
}: {
  documents: Document[];
  onUpload: () => void;
  onPreview: (doc: Document) => void;
}) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [activeCategory, setActiveCategory] = React.useState<DocumentCategory>("all");
  const [activeStatus, setActiveStatus] = React.useState<DocumentStatus>("all");
  const [sortBy, setSortBy] = React.useState<SortOption>("newest");

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Are you sure you want to delete "${doc.name}"?`)) return;

    setDeletingId(doc.id);
    try {
      const result = await deleteDocument(doc.id);
      if (!result.success) {
        alert(result.error || "Failed to delete document");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred while deleting");
    } finally {
      setDeletingId(null);
    }
  };

  // Calculate counts for category tabs
  const counts = React.useMemo(() => countDocumentsByCategory(documents), [documents]);

  // Filter and sort documents
  const filteredDocuments = React.useMemo(
    () => filterAndSortDocuments(documents, activeCategory, activeStatus, sortBy),
    [documents, activeCategory, activeStatus, sortBy]
  );

  return (
    <div id="other-documents" className="scroll-mt-24 space-y-4">
      {/* Section Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-[0px_2px_4px_rgba(26,24,22,0.06)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gold-100 rounded-xl">
              <File className="w-5 h-5 text-gold-600" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-medium text-navy-800">
                All Documents
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Passport, visa, references, and other supporting documents
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={onUpload}>
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Category Tabs & Filters */}
      {documents.length > 0 && (
        <DocumentCategoryTabs
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          activeStatus={activeStatus}
          onStatusChange={setActiveStatus}
          sortBy={sortBy}
          onSortChange={setSortBy}
          counts={counts}
        />
      )}

      {/* Document List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-[0px_2px_4px_rgba(26,24,22,0.06)]">
        {filteredDocuments.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 hover:bg-cream-50/50 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-2.5 bg-cream-50 rounded-lg border border-gray-100">
                    {getFileIcon(doc.mimeType)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-navy-800 truncate">
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                      <span className="text-navy-600 font-medium">
                        {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
                      </span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span>Uploaded {formatDate(doc.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={doc.status} />
                  <button
                    onClick={() => onPreview(doc)}
                    className="p-2 text-navy-600 hover:bg-gold-50 rounded-lg transition-colors"
                    title="Preview document"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc)}
                    disabled={deletingId === doc.id}
                    className="text-error-600 hover:text-error-700 hover:bg-error-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : documents.length > 0 ? (
          // Filtered results empty state
          <div className="text-center py-12 px-4">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <File className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-navy-800 mb-2">
              No matching documents
            </h3>
            <p className="text-gray-500 mb-4 max-w-sm mx-auto">
              No documents match your current filters. Try adjusting your filters or upload a new document.
            </p>
            <button
              onClick={() => {
                setActiveCategory("all");
                setActiveStatus("all");
              }}
              className="text-sm font-medium text-gold-600 hover:text-gold-700"
            >
              Clear filters
            </button>
          </div>
        ) : (
          // No documents at all empty state
          <div className="text-center py-12 px-4">
            <div className="mx-auto w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center mb-4">
              <File className="w-6 h-6 text-gold-600" />
            </div>
            <h3 className="text-lg font-medium text-navy-800 mb-2">
              No documents yet
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Upload your passport, visa, references, and other important documents to complete your profile.
            </p>
            <Button onClick={onUpload}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Upload Modal Component with Bulk Upload Support
function UploadModal({
  isOpen,
  onClose,
  candidateId,
  uploadType,
}: {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  uploadType: "cv" | "document";
}) {
  const [queuedFiles, setQueuedFiles] = React.useState<QueuedFile[]>([]);
  const [documentType, setDocumentType] = React.useState(uploadType === "cv" ? "cv" : "other");
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Validate and add files to queue
  const processFiles = (files: FileList | File[]) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/jpg", // Some browsers report JPG as image/jpg instead of image/jpeg
      "image/png",
      "image/webp",
    ];

    const validFiles: QueuedFile[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: File size must be less than 10MB`);
        return;
      }

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type`);
        return;
      }

      // Check for duplicates
      const isDuplicate = queuedFiles.some(
        (qf) => qf.file.name === file.name && qf.file.size === file.size
      );
      if (isDuplicate) {
        errors.push(`${file.name}: Already in queue`);
        return;
      }

      validFiles.push(createQueuedFile(file));
    });

    if (errors.length > 0) {
      setError(errors.join("; "));
    } else {
      setError(null);
    }

    if (validFiles.length > 0) {
      setQueuedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset input to allow selecting same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Upload a single file with progress tracking
  const uploadSingleFile = async (
    queuedFile: QueuedFile,
    docType: string
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", queuedFile.file);
      formData.append("entityType", "candidate");
      formData.append("entityId", candidateId);
      formData.append("documentType", docType);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setQueuedFiles((prev) =>
            prev.map((f) =>
              f.id === queuedFile.id ? { ...f, progress } : f
            )
          );
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setQueuedFiles((prev) =>
            prev.map((f) =>
              f.id === queuedFile.id
                ? { ...f, status: "success", progress: 100 }
                : f
            )
          );
          resolve();
        } else {
          let errorMessage = "Upload failed";
          try {
            const result = JSON.parse(xhr.responseText);
            errorMessage = result.error || errorMessage;
          } catch {
            // Ignore parse error
          }
          setQueuedFiles((prev) =>
            prev.map((f) =>
              f.id === queuedFile.id
                ? { ...f, status: "error", error: errorMessage }
                : f
            )
          );
          reject(new Error(errorMessage));
        }
      });

      xhr.addEventListener("error", () => {
        setQueuedFiles((prev) =>
          prev.map((f) =>
            f.id === queuedFile.id
              ? { ...f, status: "error", error: "Network error" }
              : f
          )
        );
        reject(new Error("Network error during upload"));
      });

      xhr.open("POST", "/api/documents/upload");
      xhr.send(formData);
    });
  };

  // Upload all pending files sequentially
  const handleStartUpload = async () => {
    setIsUploading(true);
    setError(null);

    const pendingFiles = queuedFiles.filter((f) => f.status === "pending");
    let successCount = 0;
    let failCount = 0;

    for (const queuedFile of pendingFiles) {
      // Mark as uploading
      setQueuedFiles((prev) =>
        prev.map((f) =>
          f.id === queuedFile.id ? { ...f, status: "uploading", progress: 0 } : f
        )
      );

      try {
        await uploadSingleFile(queuedFile, documentType);
        successCount++;
      } catch {
        failCount++;
      }
    }

    setIsUploading(false);

    // If all succeeded, close and refresh after a short delay
    if (failCount === 0 && successCount > 0) {
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1000);
    }
  };

  // Remove file from queue
  const handleRemoveFile = (id: string) => {
    setQueuedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Retry failed file
  const handleRetryFile = (id: string) => {
    setQueuedFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status: "pending", progress: 0, error: undefined } : f
      )
    );
  };

  // Clear completed files
  const handleClearCompleted = () => {
    setQueuedFiles((prev) =>
      prev.filter((f) => f.status !== "success" && f.status !== "error")
    );
  };

  const resetForm = () => {
    setQueuedFiles([]);
    setDocumentType(uploadType === "cv" ? "cv" : "other");
    setError(null);
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  React.useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hasFiles = queuedFiles.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6 border border-gray-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gold-100 rounded-xl">
            <Upload className="w-5 h-5 text-gold-600" />
          </div>
          <div>
            <h3 className="text-xl font-serif font-medium text-navy-800">
              {uploadType === "cv" ? "Upload CV" : "Upload Documents"}
            </h3>
            <p className="text-sm text-gray-500">
              {uploadType === "cv"
                ? "Upload your CV or resume"
                : "Upload multiple files at once"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* File Input with Drag & Drop */}
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer",
              isDragging
                ? "border-gold-500 bg-gold-50 scale-[1.02]"
                : hasFiles
                  ? "border-gold-300 bg-cream-50"
                  : "border-gray-300 hover:border-gold-400"
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              multiple={uploadType !== "cv"}
              className="sr-only"
            />
            <div
              className={cn(
                "w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center transition-colors",
                isDragging ? "bg-gold-100" : "bg-gray-100"
              )}
            >
              <Upload
                className={cn(
                  "w-6 h-6 transition-colors",
                  isDragging ? "text-gold-600" : "text-gray-400"
                )}
              />
            </div>
            <p
              className={cn(
                "text-sm font-medium transition-colors",
                isDragging ? "text-gold-700" : "text-gray-600"
              )}
            >
              {isDragging
                ? "Drop your files here"
                : hasFiles
                  ? "Click or drag to add more files"
                  : uploadType === "cv"
                    ? "Click or drag your CV to upload"
                    : "Click or drag files to upload"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PDF, DOC, DOCX, JPG, PNG (max 10MB each)
            </p>
          </div>

          {/* Upload Queue */}
          {hasFiles && (
            <UploadQueue
              files={queuedFiles}
              onRemoveFile={handleRemoveFile}
              onRetryFile={handleRetryFile}
              onClearCompleted={handleClearCompleted}
              onStartUpload={handleStartUpload}
              isUploading={isUploading}
              documentType={documentType}
              onDocumentTypeChange={setDocumentType}
              hideTypeSelector={uploadType === "cv"}
            />
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-error-50 border border-error-200 rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-error-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-error-700">{error}</p>
            </div>
          )}

          {/* Close button when no files or all done */}
          {!hasFiles && (
            <div className="flex items-center justify-end pt-2">
              <Button
                variant="secondary"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Component
export function DocumentsClient({ data }: { data: DocumentsPageData }) {
  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);
  const [uploadType, setUploadType] = React.useState<"cv" | "document">("cv");
  const [previewDocument, setPreviewDocument] = React.useState<Document | null>(null);

  const openCVUpload = () => {
    setUploadType("cv");
    setUploadModalOpen(true);
  };

  const openDocumentUpload = () => {
    setUploadType("document");
    setUploadModalOpen(true);
  };

  const handlePreview = (doc: Document) => {
    setPreviewDocument(doc);
  };

  const handleDeleteFromPreview = async (id: string) => {
    const result = await deleteDocument(id);
    if (result.success) {
      setPreviewDocument(null);
      window.location.reload();
    } else {
      alert(result.error || "Failed to delete document");
    }
  };

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-navy-800">
                Documents
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your CV, certifications, and supporting documents
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/crew/dashboard"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-navy-700 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0px_2px_4px_rgba(26,24,22,0.06)] hover:shadow-[0px_4px_8px_rgba(26,24,22,0.08)] transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gold-100 rounded-xl">
                <FileText className="w-5 h-5 text-gold-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-800">
                  {data.cv ? 1 : 0}
                </p>
                <p className="text-sm text-gray-500">CV Uploaded</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0px_2px_4px_rgba(26,24,22,0.06)] hover:shadow-[0px_4px_8px_rgba(26,24,22,0.08)] transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gold-100 rounded-xl">
                <Award className="w-5 h-5 text-gold-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-800">
                  {data.certifications.length}
                </p>
                <p className="text-sm text-gray-500">Certifications</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0px_2px_4px_rgba(26,24,22,0.06)] hover:shadow-[0px_4px_8px_rgba(26,24,22,0.08)] transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-success-100 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-800">
                  {data.certifications.filter((c) => c.status === "valid").length}
                </p>
                <p className="text-sm text-gray-500">Valid</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0px_2px_4px_rgba(26,24,22,0.06)] hover:shadow-[0px_4px_8px_rgba(26,24,22,0.08)] transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-warning-100 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-warning-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-800">
                  {
                    data.certifications.filter(
                      (c) => c.status === "expired" || c.status === "expiring_soon"
                    ).length
                  }
                </p>
                <p className="text-sm text-gray-500">Need Attention</p>
              </div>
            </div>
          </div>
        </div>

        {/* CV Section */}
        <CVSection
          cv={data.cv}
          candidateId={data.candidateId}
          onUpload={openCVUpload}
          onPreview={handlePreview}
        />

        {/* Certifications Section */}
        <CertificationsSection
          certifications={data.certifications}
          onUpload={openDocumentUpload}
        />

        {/* Other Documents Section */}
        <OtherDocumentsSection
          documents={data.documents}
          onUpload={openDocumentUpload}
          onPreview={handlePreview}
        />
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        candidateId={data.candidateId}
        uploadType={uploadType}
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={!!previewDocument}
        onClose={() => setPreviewDocument(null)}
        doc={previewDocument ? {
          id: previewDocument.id,
          name: previewDocument.name,
          fileUrl: previewDocument.fileUrl,
          mimeType: previewDocument.mimeType,
          fileSize: previewDocument.fileSize,
          uploadedAt: previewDocument.uploadedAt,
          documentType: previewDocument.documentType,
          status: previewDocument.status,
        } : null}
        onDelete={handleDeleteFromPreview}
      />
    </div>
  );
}
