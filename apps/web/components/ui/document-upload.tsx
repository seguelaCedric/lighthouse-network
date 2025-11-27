"use client";

import * as React from "react";
import {
  Upload,
  File,
  FileText,
  Image,
  X,
  Download,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DocumentType, UploadedDocument } from "@/lib/storage";

interface DocumentUploadProps {
  entityType: "candidate" | "client" | "job";
  entityId: string;
  documents: UploadedDocument[];
  onUpload: (file: File, documentType: DocumentType, options?: { expiryDate?: string; description?: string }) => Promise<void>;
  onDelete: (documentId: string) => Promise<void>;
  isUploading?: boolean;
  className?: string;
}

// Document type options
const documentTypeOptions: { value: DocumentType; label: string }[] = [
  { value: "cv", label: "CV / Resume" },
  { value: "certification", label: "Certification" },
  { value: "passport", label: "Passport" },
  { value: "visa", label: "Visa" },
  { value: "medical", label: "Medical Certificate" },
  { value: "reference", label: "Reference Letter" },
  { value: "contract", label: "Contract" },
  { value: "photo", label: "Photo" },
  { value: "other", label: "Other" },
];

// File icon based on mime type
function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return <Image className="size-5" />;
  }
  if (mimeType === "application/pdf") {
    return <FileText className="size-5" />;
  }
  return <File className="size-5" />;
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Format date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Check if document is expiring soon
function isExpiringSoon(expiryDate?: string): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const daysUntilExpiry = Math.floor(
    (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
}

// Check if document is expired
function isExpired(expiryDate?: string): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
}

// Document Card Component
function DocumentCard({
  document,
  onDelete,
  isDeleting,
}: {
  document: UploadedDocument;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const expired = isExpired(document.metadata.expiryDate);
  const expiringSoon = isExpiringSoon(document.metadata.expiryDate);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 transition-colors",
        expired
          ? "border-error-200 bg-error-50"
          : expiringSoon
          ? "border-warning-200 bg-warning-50"
          : "border-gray-200 bg-white hover:bg-gray-50"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          expired
            ? "bg-error-100 text-error-600"
            : expiringSoon
            ? "bg-warning-100 text-warning-600"
            : "bg-gray-100 text-gray-600"
        )}
      >
        {getFileIcon(document.metadata.mimeType)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-navy-900 truncate">
            {document.fileName}
          </p>
          {expired && (
            <span className="shrink-0 rounded-full bg-error-100 px-2 py-0.5 text-xs font-medium text-error-700">
              Expired
            </span>
          )}
          {expiringSoon && !expired && (
            <span className="shrink-0 rounded-full bg-warning-100 px-2 py-0.5 text-xs font-medium text-warning-700">
              Expiring soon
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
          <span className="capitalize">
            {document.metadata.documentType.replace("_", " ")}
          </span>
          <span>{formatFileSize(document.metadata.size)}</span>
          {document.metadata.expiryDate && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              Expires: {formatDate(document.metadata.expiryDate)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <a
          href={document.publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-navy-600"
          title="Download"
        >
          <Download className="size-4" />
        </a>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="p-2 rounded-lg hover:bg-error-50 text-gray-400 hover:text-error-600 disabled:opacity-50"
          title="Delete"
        >
          {isDeleting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
        </button>
      </div>
    </div>
  );
}

// Upload Modal
function UploadModal({
  isOpen,
  onClose,
  onUpload,
  isUploading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, documentType: DocumentType, options?: { expiryDate?: string; description?: string }) => Promise<void>;
  isUploading: boolean;
}) {
  const [dragActive, setDragActive] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [documentType, setDocumentType] = React.useState<DocumentType>("other");
  const [expiryDate, setExpiryDate] = React.useState("");
  const [description, setDescription] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    await onUpload(selectedFile, documentType, {
      expiryDate: expiryDate || undefined,
      description: description || undefined,
    });

    // Reset form
    setSelectedFile(null);
    setDocumentType("other");
    setExpiryDate("");
    setDescription("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-navy-900">Upload Document</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="size-5 text-gray-500" />
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors",
            dragActive
              ? "border-gold-500 bg-gold-50"
              : selectedFile
              ? "border-success-500 bg-success-50"
              : "border-gray-300 hover:border-gray-400"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
          />

          {selectedFile ? (
            <div className="flex items-center justify-center gap-3">
              <CheckCircle2 className="size-8 text-success-600" />
              <div className="text-left">
                <p className="font-medium text-navy-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
          ) : (
            <>
              <Upload className="mx-auto size-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-navy-900">
                Drop file here or click to browse
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, Word, or images up to 10MB
              </p>
            </>
          )}
        </div>

        {/* Form Fields */}
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Type
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            >
              {documentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date (optional)
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            leftIcon={
              isUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )
            }
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main Component
export function DocumentUpload({
  entityType,
  entityId,
  documents,
  onUpload,
  onDelete,
  isUploading = false,
  className,
}: DocumentUploadProps) {
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDelete = async (documentId: string) => {
    setDeletingId(documentId);
    try {
      await onDelete(documentId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-navy-900">Documents</h3>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowUploadModal(true)}
          leftIcon={<Upload className="size-4" />}
        >
          Upload
        </Button>
      </div>

      {/* Document List */}
      {documents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <FileText className="mx-auto size-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No documents uploaded</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUploadModal(true)}
            className="mt-2"
          >
            Upload your first document
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onDelete={() => handleDelete(doc.id)}
              isDeleting={deletingId === doc.id}
            />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={onUpload}
        isUploading={isUploading}
      />
    </div>
  );
}
