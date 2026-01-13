"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  X,
  Image as ImageIcon,
  Award,
  CreditCard,
  Plane,
  Heart,
  Users,
  FileSignature,
  Camera,
  File,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { DocumentType } from "@/lib/validations/documents";

export type DocumentStatus = "pending" | "approved" | "rejected";

export interface DocumentUploadModalProps {
  candidateId: string;
  documentType?: DocumentType;
  existingDocumentId?: string | null;
  status?: DocumentStatus;
  rejectionReason?: string | null;
  onUploadComplete?: () => void;
  onClose?: () => void;
  className?: string;
}

const DOCUMENT_TYPES: Array<{
  value: DocumentType;
  label: string;
  icon: React.ElementType;
  requiresExpiry?: boolean;
}> = [
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

const STATUS_CONFIG: Record<
  DocumentStatus,
  {
    label: string;
    description: string;
    icon: React.ElementType;
    className: string;
    bgClassName: string;
  }
> = {
  pending: {
    label: "Uploaded",
    description: "Your document has been uploaded successfully",
    icon: CheckCircle2,
    className: "text-success-600",
    bgClassName: "bg-success-50 border-success-200",
  },
  approved: {
    label: "Uploaded",
    description: "Your document has been uploaded successfully",
    icon: CheckCircle2,
    className: "text-success-600",
    bgClassName: "bg-success-50 border-success-200",
  },
  rejected: {
    label: "Uploaded",
    description: "Your document has been uploaded successfully",
    icon: CheckCircle2,
    className: "text-success-600",
    bgClassName: "bg-success-50 border-success-200",
  },
};

export function DocumentUploadModal({
  candidateId,
  documentType: initialDocumentType,
  existingDocumentId,
  status,
  rejectionReason,
  onUploadComplete,
  onClose,
  className,
}: DocumentUploadModalProps) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = React.useState<DocumentType>(
    initialDocumentType || "cv"
  );
  const [description, setDescription] = React.useState("");
  const [expiryDate, setExpiryDate] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [dragActive, setDragActive] = React.useState(false);

  const selectedType = DOCUMENT_TYPES.find((t) => t.value === selectedDocType);
  const SelectedIcon = selectedType?.icon || FileText;
  const requiresExpiry = selectedType?.requiresExpiry || false;

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const validTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a PDF, Word document, or image file (JPEG, PNG, WebP)");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else if (file.type === "application/pdf") {
      setPreview("pdf");
    } else {
      setPreview("document");
    }

    // Validate expiry date if required
    if (requiresExpiry && !expiryDate) {
      setError("Expiry date is required for this document type");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", "candidate");
      formData.append("entityId", candidateId);
      formData.append("documentType", selectedDocType);

      if (description) {
        formData.append("description", description);
      }

      if (expiryDate) {
        formData.append("expiryDate", new Date(expiryDate).toISOString());
      }

      // If this is a replacement/new version, include the existing document ID
      if (existingDocumentId) {
        formData.append("replaceDocumentId", existingDocumentId);
      }

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload document");
      }

      onUploadComplete?.();
      router.refresh();
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload document");
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

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
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white shadow-sm", className)}>
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-semibold text-navy-800">
              Upload Document
            </h3>
            <p className="mt-0.5 text-sm text-gray-500">
              {existingDocumentId ? "Upload a new version" : "Add a document to your profile"}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Status Banner (if document exists) - simplified for candidates */}
        {status && (
          <div
            className={cn(
              "mb-6 flex items-start gap-3 rounded-lg border p-4",
              STATUS_CONFIG[status].bgClassName
            )}
          >
            {React.createElement(STATUS_CONFIG[status].icon, {
              className: cn("mt-0.5 size-5", STATUS_CONFIG[status].className),
            })}
            <div>
              <p className={cn("font-medium", STATUS_CONFIG[status].className)}>
                {STATUS_CONFIG[status].label}
              </p>
              <p className="mt-0.5 text-sm text-gray-600">
                {STATUS_CONFIG[status].description}
              </p>
            </div>
          </div>
        )}

        {/* Document Type Selection (if not pre-selected) */}
        {!initialDocumentType && (
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Document Type
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {DOCUMENT_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedDocType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSelectedDocType(type.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-3 text-left transition-all",
                      isSelected
                        ? "border-gold-500 bg-gold-50 text-gold-900"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="size-4" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Description Field (optional) */}
        <div className="mb-4">
          <label
            htmlFor="description"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Description (Optional)
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`e.g., ${selectedType?.label} details...`}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          />
        </div>

        {/* Expiry Date Field (if required) */}
        {requiresExpiry && (
          <div className="mb-4">
            <label
              htmlFor="expiryDate"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Expiry Date <span className="text-error-600">*</span>
            </label>
            <input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
              required={requiresExpiry}
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-error-50 p-3 text-sm text-error-700">
            <AlertTriangle className="size-4" />
            {error}
          </div>
        )}

        {/* Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
            dragActive
              ? "border-gold-400 bg-gold-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
            isUploading && "pointer-events-none opacity-50"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
            onChange={handleInputChange}
            className="hidden"
            disabled={isUploading}
          />

          {preview ? (
            <div className="space-y-4">
              {preview.startsWith("data:image") ? (
                <div className="relative mx-auto h-40 w-full max-w-xs overflow-hidden rounded-lg border border-gray-200">
                  <img
                    src={preview}
                    alt="Document preview"
                    className="h-full w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreview(null);
                    }}
                    className="absolute right-2 top-2 rounded-full bg-white p-1 shadow-sm hover:bg-gray-100"
                  >
                    <X className="size-4 text-gray-500" />
                  </button>
                </div>
              ) : (
                <div className="mx-auto flex h-40 w-full max-w-xs items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                  <div className="text-center">
                    <SelectedIcon className="mx-auto size-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      {preview === "pdf" ? "PDF" : "Document"} ready to upload
                    </p>
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-600">
                {isUploading ? "Uploading..." : "Click to select a different file"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-gray-100">
                <SelectedIcon className="size-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {dragActive ? "Drop file here" : "Click to upload or drag and drop"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  PDF, Word, or Image files up to 10MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Upload Button */}
        {preview && !isUploading && (
          <div className="mt-6 flex justify-end gap-3">
            {onClose && (
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isUploading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="button"
              variant="primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || (requiresExpiry && !expiryDate)}
            >
              {existingDocumentId ? "Upload New Version" : "Upload Document"}
            </Button>
          </div>
        )}

        {/* Upload Tips */}
        <div className="mt-6 rounded-lg bg-blue-50 p-4">
          <h4 className="mb-2 text-sm font-medium text-blue-900">Upload Tips</h4>
          <ul className="space-y-1 text-xs text-blue-700">
            <li>• Ensure the document is clear and readable</li>
            <li>• All information must be visible and not cropped</li>
            <li>• File size should not exceed 10MB</li>
            {requiresExpiry && <li>• Make sure the document is not expired</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DocumentUploadModal;
