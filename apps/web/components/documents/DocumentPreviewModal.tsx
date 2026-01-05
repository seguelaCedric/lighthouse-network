"use client";

import * as React from "react";
import { X, Download, Trash2, ZoomIn, ZoomOut, RotateCw, FileText, File, Image as ImageIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: {
    id: string;
    name: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number;
    uploadedAt: string;
    documentType: string;
    status: "pending" | "approved" | "rejected";
  } | null;
  onDelete?: (id: string) => void;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  cv: "CV / Resume",
  passport: "Passport",
  visa: "Visa",
  medical: "Medical Certificate",
  certification: "Certification",
  reference: "Reference Letter",
  photo: "Photo",
  other: "Other Document",
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function DocumentPreviewModal({
  isOpen,
  onClose,
  doc,
  onDelete,
}: DocumentPreviewModalProps) {
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [signedUrl, setSignedUrl] = React.useState<string | null>(null);

  // Fetch signed URL when document changes
  React.useEffect(() => {
    if (doc) {
      setZoom(1);
      setRotation(0);
      setIsLoading(true);
      setHasError(false);
      setSignedUrl(null);

      // Fetch signed URL for preview
      fetch(`/api/documents/${doc.id}/download?preview=true`)
        .then(res => res.json())
        .then(data => {
          if (data.url) {
            setSignedUrl(data.url);
          } else {
            setHasError(true);
          }
          setIsLoading(false);
        })
        .catch(error => {
          console.error("Error fetching signed URL:", error);
          setHasError(true);
          setIsLoading(false);
        });
    }
  }, [doc]);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !doc) return null;

  const isPDF = doc.mimeType === "application/pdf";
  const isImage = doc.mimeType.startsWith("image/");
  const isPreviewable = isPDF || isImage;

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handleDownload = async () => {
    try {
      // Get signed download URL
      const response = await fetch(`/api/documents/${doc.id}/download`);
      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Failed to get download URL");
      }

      const link = window.document.createElement("a");
      link.href = data.url;
      link.download = doc.name;
      link.target = "_blank";
      link.click();
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download document. Please try again.");
    }
  };

  const handleDelete = () => {
    if (onDelete && confirm(`Are you sure you want to delete "${doc.name}"?`)) {
      onDelete(doc.id);
      onClose();
    }
  };

  const statusConfig = {
    pending: {
      label: "Pending Review",
      className: "bg-gold-100 text-gold-700 border border-gold-200",
    },
    approved: {
      label: "Approved",
      className: "bg-success-100 text-success-700 border border-success-200",
    },
    rejected: {
      label: "Rejected",
      className: "bg-error-100 text-error-700 border border-error-200",
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy-900/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-cream-50/50">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-2.5 bg-gold-100 rounded-xl flex-shrink-0">
              {isImage ? (
                <ImageIcon className="w-5 h-5 text-gold-600" />
              ) : isPDF ? (
                <FileText className="w-5 h-5 text-gold-600" />
              ) : (
                <File className="w-5 h-5 text-gold-600" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-serif font-medium text-navy-800 truncate">
                {doc.name}
              </h2>
              <p className="text-sm text-gray-500">
                {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Area */}
        <div className="flex-1 relative bg-gray-50 overflow-auto">
          {isPreviewable ? (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              {isPDF ? (
                signedUrl ? (
                  <iframe
                    src={`${signedUrl}#toolbar=0`}
                    className="w-full h-full rounded-lg border border-gray-200 bg-white"
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                      setIsLoading(false);
                      setHasError(true);
                    }}
                    title={doc.name}
                  />
                ) : (
                  <div className="text-gray-500">Loading preview...</div>
                )
              ) : isImage ? (
                signedUrl ? (
                  <div
                    className="relative transition-transform duration-200 ease-out"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    }}
                  >
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <img
                      src={signedUrl}
                      alt={doc.name}
                      className={cn(
                        "max-w-full max-h-[60vh] rounded-lg shadow-lg border border-gray-200",
                        isLoading ? "opacity-0" : "opacity-100"
                      )}
                      onLoad={() => setIsLoading(false)}
                      onError={() => {
                        setIsLoading(false);
                        setHasError(true);
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-gray-500">Loading preview...</div>
                )
              ) : null}

              {hasError && (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-error-100 rounded-2xl flex items-center justify-center mb-4">
                    <File className="w-8 h-8 text-error-600" />
                  </div>
                  <h3 className="text-lg font-medium text-navy-800 mb-2">
                    Unable to preview
                  </h3>
                  <p className="text-gray-500 mb-4">
                    This document could not be loaded for preview.
                  </p>
                  <Button onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Instead
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center py-12">
                <div className="mx-auto w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <File className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-navy-800 mb-2">
                  Preview not available
                </h3>
                <p className="text-gray-500 mb-6 max-w-sm">
                  This file type cannot be previewed in the browser. Download it to view locally.
                </p>
                <Button onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
              </div>
            </div>
          )}

          {/* Image Controls (only for images) */}
          {isImage && !hasError && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-2 py-1.5 border border-gray-200">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="p-2 text-gray-600 hover:text-navy-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-navy-800 min-w-[48px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="p-2 text-gray-600 hover:text-navy-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-gray-200" />
              <button
                onClick={handleRotate}
                className="p-2 text-gray-600 hover:text-navy-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Rotate"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer with metadata and actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium",
                statusConfig[doc.status].className
              )}
            >
              {statusConfig[doc.status].label}
            </span>
            <span>{formatFileSize(doc.fileSize)}</span>
            <span>Uploaded {formatDate(doc.uploadedAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  const response = await fetch(`/api/documents/${doc.id}/download?preview=true`);
                  const data = await response.json();
                  if (data.url) {
                    window.open(data.url, "_blank");
                  } else {
                    alert("Failed to open document");
                  }
                } catch (error) {
                  console.error("Error opening document:", error);
                  alert("Failed to open document");
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-navy-700 hover:text-navy-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </button>
            <Button variant="secondary" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                onClick={handleDelete}
                className="text-error-600 hover:text-error-700 hover:bg-error-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
