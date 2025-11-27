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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type IDStatus = "not_uploaded" | "pending" | "verified" | "rejected";

export interface IDUploadProps {
  candidateId: string;
  status: IDStatus;
  documentUrl?: string | null;
  rejectionReason?: string | null;
  onUploadComplete?: () => void;
  className?: string;
}

const STATUS_CONFIG: Record<
  IDStatus,
  {
    label: string;
    description: string;
    icon: React.ElementType;
    className: string;
    bgClassName: string;
  }
> = {
  not_uploaded: {
    label: "Not Uploaded",
    description: "Upload your passport or ID card to verify your identity",
    icon: Upload,
    className: "text-gray-600",
    bgClassName: "bg-gray-50 border-gray-200",
  },
  pending: {
    label: "Pending Review",
    description: "Your ID document is being reviewed by our team",
    icon: Clock,
    className: "text-gold-600",
    bgClassName: "bg-gold-50 border-gold-200",
  },
  verified: {
    label: "Verified",
    description: "Your ID has been verified successfully",
    icon: CheckCircle2,
    className: "text-success-600",
    bgClassName: "bg-success-50 border-success-200",
  },
  rejected: {
    label: "Rejected",
    description: "Your ID document was rejected. Please upload a new one.",
    icon: XCircle,
    className: "text-error-600",
    bgClassName: "bg-error-50 border-error-200",
  },
};

export function IDUpload({
  candidateId,
  status,
  documentUrl,
  rejectionReason,
  onUploadComplete,
  className,
}: IDUploadProps) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [dragActive, setDragActive] = React.useState(false);

  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;
  const canUpload = status === "not_uploaded" || status === "rejected";

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a JPEG, PNG, WebP, or PDF file");
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
    } else {
      setPreview(null);
    }

    setError(null);
    setIsUploading(true);

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/candidates/${candidateId}/id-verification`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload document");
      }

      onUploadComplete?.();
      router.refresh();
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
    <div className={cn("rounded-xl border border-gray-200 bg-white shadow-sm", className)} id="id-upload">
      <div className="border-b border-gray-100 px-6 py-4">
        <h3 className="font-serif text-lg font-semibold text-navy-800">
          ID Verification
        </h3>
        <p className="mt-0.5 text-sm text-gray-500">
          Upload your passport or government-issued ID
        </p>
      </div>

      <div className="p-6">
        {/* Status Banner */}
        <div
          className={cn(
            "mb-6 flex items-start gap-3 rounded-lg border p-4",
            config.bgClassName
          )}
        >
          <StatusIcon className={cn("mt-0.5 size-5", config.className)} />
          <div>
            <p className={cn("font-medium", config.className)}>{config.label}</p>
            <p className="mt-0.5 text-sm text-gray-600">{config.description}</p>
            {status === "rejected" && rejectionReason && (
              <div className="mt-2 rounded bg-error-100 p-2 text-sm text-error-700">
                <strong>Reason:</strong> {rejectionReason}
              </div>
            )}
          </div>
        </div>

        {/* Upload Area */}
        {canUpload && (
          <>
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-error-50 p-3 text-sm text-error-700">
                <AlertTriangle className="size-4" />
                {error}
              </div>
            )}

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
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleInputChange}
                className="hidden"
                disabled={isUploading}
              />

              {preview ? (
                <div className="space-y-4">
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
                  <p className="text-sm text-gray-600">
                    {isUploading ? "Uploading..." : "Click to select a different file"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-gray-100">
                    <Upload className="size-6 text-gray-500" />
                  </div>
                  <p className="font-medium text-gray-700">
                    {isUploading ? "Uploading..." : "Drop your ID here or click to browse"}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    JPEG, PNG, WebP, or PDF up to 10MB
                  </p>
                </>
              )}
            </div>
          </>
        )}

        {/* Document Preview for verified/pending */}
        {(status === "verified" || status === "pending") && documentUrl && (
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              {documentUrl.endsWith(".pdf") ? (
                <div className="flex size-12 items-center justify-center rounded-lg bg-gray-100">
                  <FileText className="size-6 text-gray-500" />
                </div>
              ) : (
                <div className="size-12 overflow-hidden rounded-lg border border-gray-200">
                  <img
                    src={documentUrl}
                    alt="ID Document"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-navy-800">ID Document</p>
                <p className="text-sm text-gray-500">
                  {status === "pending" ? "Under review" : "Verified"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        {canUpload && (
          <div className="mt-6 rounded-lg bg-navy-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-navy-800">Tips for a successful upload:</h4>
            <ul className="space-y-1 text-sm text-navy-700">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 size-1 rounded-full bg-navy-400" />
                Ensure all corners of the document are visible
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 size-1 rounded-full bg-navy-400" />
                Make sure the photo and text are clear and legible
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 size-1 rounded-full bg-navy-400" />
                Use good lighting, avoid glare or shadows
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 size-1 rounded-full bg-navy-400" />
                The document must not be expired
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
