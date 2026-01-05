"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  X,
  FileText,
  Image as ImageIcon,
  File,
  Upload,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type UploadStatus = "pending" | "uploading" | "success" | "error";

export interface QueuedFile {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  documentType?: string;
}

interface UploadQueueProps {
  files: QueuedFile[];
  onRemoveFile: (id: string) => void;
  onRetryFile: (id: string) => void;
  onClearCompleted: () => void;
  onStartUpload: () => void;
  isUploading: boolean;
  documentType: string;
  onDocumentTypeChange: (type: string) => void;
  /** Hide document type selector (for CV uploads where type is fixed) */
  hideTypeSelector?: boolean;
}

// Document types for "All Documents" section (excludes CV - use dedicated CV upload)
const DOCUMENT_TYPES = [
  { value: "other", label: "Other Document" },
  { value: "passport", label: "Passport" },
  { value: "visa", label: "Visa" },
  { value: "medical", label: "Medical Certificate" },
  { value: "certification", label: "Certification" },
  { value: "reference", label: "Reference Letter" },
  { value: "contract", label: "Contract" },
  { value: "photo", label: "Photo" },
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType === "application/pdf") return FileText;
  return File;
}

function FileRow({
  file,
  onRemove,
  onRetry,
  isUploading,
}: {
  file: QueuedFile;
  onRemove: () => void;
  onRetry: () => void;
  isUploading: boolean;
}) {
  const Icon = getFileIcon(file.file.type);
  const isPending = file.status === "pending";
  const isCurrentlyUploading = file.status === "uploading";
  const isSuccess = file.status === "success";
  const isError = file.status === "error";

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
        isSuccess && "bg-success-50 border-success-200",
        isError && "bg-error-50 border-error-200",
        (isPending || isCurrentlyUploading) && "bg-white border-gray-200"
      )}
    >
      {/* File Icon */}
      <div
        className={cn(
          "p-2 rounded-lg flex-shrink-0",
          isSuccess && "bg-success-100",
          isError && "bg-error-100",
          (isPending || isCurrentlyUploading) && "bg-gray-100"
        )}
      >
        <Icon
          className={cn(
            "w-5 h-5",
            isSuccess && "text-success-600",
            isError && "text-error-600",
            (isPending || isCurrentlyUploading) && "text-gray-500"
          )}
        />
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-navy-800 truncate">
            {file.file.name}
          </p>
          {isSuccess && <CheckCircle2 className="w-4 h-4 text-success-600 flex-shrink-0" />}
          {isError && <XCircle className="w-4 h-4 text-error-600 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500">
            {formatFileSize(file.file.size)}
          </span>
          {isError && file.error && (
            <span className="text-xs text-error-600">{file.error}</span>
          )}
        </div>

        {/* Progress Bar */}
        {isCurrentlyUploading && (
          <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold-500 rounded-full transition-all duration-300"
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {isError && (
          <button
            onClick={onRetry}
            disabled={isUploading}
            className="p-1.5 text-gray-400 hover:text-navy-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Retry upload"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
        {(isPending || isError) && (
          <button
            onClick={onRemove}
            disabled={isUploading && !isError}
            className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors disabled:opacity-50"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function UploadQueue({
  files,
  onRemoveFile,
  onRetryFile,
  onClearCompleted,
  onStartUpload,
  isUploading,
  documentType,
  onDocumentTypeChange,
  hideTypeSelector = false,
}: UploadQueueProps) {
  const pendingCount = files.filter((f) => f.status === "pending").length;
  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;
  const uploadingCount = files.filter((f) => f.status === "uploading").length;

  const canStartUpload = pendingCount > 0 && !isUploading;
  const hasCompletedFiles = successCount > 0 || errorCount > 0;
  const allComplete = pendingCount === 0 && uploadingCount === 0 && files.length > 0;

  if (files.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Document Type Selector - hidden for CV uploads */}
      {!hideTypeSelector && (
        <div>
          <label className="block text-sm font-medium text-navy-800 mb-2">
            Document Type (applies to all files)
          </label>
          <select
            value={documentType}
            onChange={(e) => onDocumentTypeChange(e.target.value)}
            disabled={isUploading}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-navy-800 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* File List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {files.map((file) => (
          <FileRow
            key={file.id}
            file={file}
            onRemove={() => onRemoveFile(file.id)}
            onRetry={() => onRetryFile(file.id)}
            isUploading={isUploading}
          />
        ))}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4 text-gray-500">
          {pendingCount > 0 && (
            <span>{pendingCount} pending</span>
          )}
          {uploadingCount > 0 && (
            <span className="text-gold-600">{uploadingCount} uploading...</span>
          )}
          {successCount > 0 && (
            <span className="text-success-600">{successCount} uploaded</span>
          )}
          {errorCount > 0 && (
            <span className="text-error-600">{errorCount} failed</span>
          )}
        </div>
        {hasCompletedFiles && !isUploading && (
          <button
            onClick={onClearCompleted}
            className="text-sm text-gray-500 hover:text-navy-800 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear completed
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        {allComplete ? (
          <div className="flex items-center gap-2 text-sm text-success-600">
            <CheckCircle2 className="w-4 h-4" />
            All files processed
          </div>
        ) : (
          <Button
            onClick={onStartUpload}
            disabled={!canStartUpload}
            className="min-w-[140px]"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {pendingCount} {pendingCount === 1 ? "File" : "Files"}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// Helper to generate unique IDs
export function generateFileId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to create QueuedFile from File
export function createQueuedFile(file: File): QueuedFile {
  return {
    id: generateFileId(),
    file,
    status: "pending",
    progress: 0,
  };
}
