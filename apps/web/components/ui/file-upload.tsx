"use client";

import * as React from "react";
import { Upload, File, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileUploadProps {
  label?: string;
  helperText?: string;
  error?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  value?: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      label,
      helperText,
      error,
      accept,
      multiple = false,
      maxSize = 10 * 1024 * 1024, // 10MB default
      maxFiles = 5,
      value = [],
      onChange,
      disabled,
      className,
      id,
    },
    ref
  ) => {
    const [isDragOver, setIsDragOver] = React.useState(false);
    const [localError, setLocalError] = React.useState<string | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const uploadId = id || React.useId();

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const validateFiles = (files: FileList | File[]): File[] => {
      const fileArray = Array.from(files);
      const validFiles: File[] = [];

      for (const file of fileArray) {
        if (maxSize && file.size > maxSize) {
          setLocalError(`File "${file.name}" exceeds maximum size of ${formatFileSize(maxSize)}`);
          continue;
        }
        validFiles.push(file);
      }

      if (multiple && validFiles.length + value.length > maxFiles) {
        setLocalError(`Maximum ${maxFiles} files allowed`);
        return validFiles.slice(0, maxFiles - value.length);
      }

      return validFiles;
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;

      setLocalError(null);
      const validFiles = validateFiles(e.dataTransfer.files);
      if (validFiles.length > 0) {
        onChange(multiple ? [...value, ...validFiles] : validFiles.slice(0, 1));
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || disabled) return;

      setLocalError(null);
      const validFiles = validateFiles(e.target.files);
      if (validFiles.length > 0) {
        onChange(multiple ? [...value, ...validFiles] : validFiles.slice(0, 1));
      }
      e.target.value = "";
    };

    const handleRemove = (index: number) => {
      onChange(value.filter((_, i) => i !== index));
      setLocalError(null);
    };

    const displayError = error || localError;

    return (
      <div className="w-full" ref={ref}>
        {label && (
          <label
            htmlFor={uploadId}
            className="mb-1.5 block text-sm font-medium text-navy-700"
          >
            {label}
          </label>
        )}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={cn(
            "relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-gray-50/50 p-6 transition-colors duration-200",
            isDragOver
              ? "border-gold-500 bg-gold-50"
              : displayError
                ? "border-error-300 bg-error-50/50"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
        >
          <input
            ref={inputRef}
            type="file"
            id={uploadId}
            accept={accept}
            multiple={multiple}
            onChange={handleFileChange}
            disabled={disabled}
            className="sr-only"
            aria-invalid={!!displayError}
            aria-describedby={
              displayError
                ? `${uploadId}-error`
                : helperText
                  ? `${uploadId}-helper`
                  : undefined
            }
          />
          <div className="flex flex-col items-center text-center">
            <div
              className={cn(
                "mb-3 flex size-12 items-center justify-center rounded-full",
                isDragOver ? "bg-gold-100" : "bg-gray-100"
              )}
            >
              <Upload
                className={cn(
                  "size-6",
                  isDragOver ? "text-gold-600" : "text-gray-400"
                )}
              />
            </div>
            <p className="mb-1 text-sm font-medium text-navy-900">
              {isDragOver ? "Drop files here" : "Drop files here or click to upload"}
            </p>
            <p className="text-xs text-gray-500">
              {accept ? `Accepted: ${accept}` : "Any file type"} • Max{" "}
              {formatFileSize(maxSize)}
              {multiple && ` • Up to ${maxFiles} files`}
            </p>
          </div>
        </div>

        {value.length > 0 && (
          <ul className="mt-3 space-y-2">
            {value.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex size-8 items-center justify-center rounded-md bg-gold-100">
                    <File className="size-4 text-gold-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-navy-900">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(index);
                  }}
                  className="ml-2 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gold-500"
                  disabled={disabled}
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {displayError && (
          <p
            id={`${uploadId}-error`}
            className="mt-1.5 flex items-center gap-1 text-sm text-error-500"
          >
            <AlertCircle className="size-4" />
            {displayError}
          </p>
        )}
        {helperText && !displayError && (
          <p id={`${uploadId}-helper`} className="mt-1.5 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
FileUpload.displayName = "FileUpload";

export { FileUpload };
