"use client";

import * as React from "react";
import { Upload, Loader2, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineCVUploadProps {
  candidateId: string;
  onUploadSuccess?: () => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

export function InlineCVUpload({
  candidateId,
  onUploadSuccess,
  onUploadError,
  className,
}: InlineCVUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadStatus, setUploadStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
    ];

    if (file.size > maxSize) {
      const error = "File size must be less than 10MB";
      setErrorMessage(error);
      setUploadStatus("error");
      onUploadError?.(error);
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      const error = "Please upload a PDF, Word document, or image file";
      setErrorMessage(error);
      setUploadStatus("error");
      onUploadError?.(error);
      return;
    }

    setIsUploading(true);
    setUploadStatus("idle");
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", "candidate");
      formData.append("entityId", candidateId);
      formData.append("documentType", "cv");

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload CV");
      }

      setUploadStatus("success");
      onUploadSuccess?.();

      // Reset success status after 3 seconds
      setTimeout(() => {
        setUploadStatus("idle");
      }, 3000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to upload CV";
      setErrorMessage(errorMsg);
      setUploadStatus("error");
      onUploadError?.(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

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

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        className="sr-only"
      />

      {uploadStatus === "success" && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>CV uploaded successfully! You can now apply to this job.</span>
        </div>
      )}

      {uploadStatus === "error" && errorMessage && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{errorMessage}</p>
          </div>
          <button
            onClick={() => {
              setUploadStatus("idle");
              setErrorMessage(null);
            }}
            className="flex-shrink-0 p-1 hover:bg-red-100 rounded transition-colors"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer",
          isDragging
            ? "border-gold-500 bg-gold-50 scale-[1.02]"
            : uploadStatus === "success"
              ? "border-green-300 bg-green-50"
              : "border-gray-300 hover:border-gold-400"
        )}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div
          className={cn(
            "w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center transition-colors",
            isDragging ? "bg-gold-100" : uploadStatus === "success" ? "bg-green-100" : "bg-gray-100"
          )}
        >
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-gold-600 animate-spin" />
          ) : uploadStatus === "success" ? (
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          ) : (
            <Upload
              className={cn(
                "w-6 h-6 transition-colors",
                isDragging ? "text-gold-600" : "text-gray-400"
              )}
            />
          )}
        </div>
        <p
          className={cn(
            "text-sm font-medium transition-colors mb-1",
            isDragging ? "text-gold-700" : uploadStatus === "success" ? "text-green-700" : "text-gray-600"
          )}
        >
          {isUploading
            ? "Uploading CV..."
            : uploadStatus === "success"
              ? "CV Uploaded Successfully"
              : isDragging
                ? "Drop your CV here"
                : "Click or drag your CV to upload"}
        </p>
        <p className="text-xs text-gray-400">
          PDF, Word, or image files up to 10MB
        </p>
      </div>
    </div>
  );
}


