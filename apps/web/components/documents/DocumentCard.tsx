"use client";

import { useState } from "react";
import {
  FileText,
  Award,
  CreditCard,
  Globe,
  Heart,
  FileCheck,
  FileSignature,
  Image as ImageIcon,
  File,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  History,
  MoreVertical,
  Eye,
  Loader2,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type DocumentType =
  | "cv"
  | "certification"
  | "passport"
  | "visa"
  | "medical"
  | "reference"
  | "contract"
  | "photo"
  | "other";

type DocumentStatus = "pending" | "approved" | "rejected";

interface Document {
  id: string;
  documentType: DocumentType;
  fileUrl: string;
  name: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  status: DocumentStatus;
  version: number;
  isLatestVersion: boolean;
  expiryDate?: string;
  uploadedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
}

interface DocumentCardProps {
  document: Document;
  onApprove?: (documentId: string) => void;
  onReject?: (documentId: string, reason: string) => void;
  onDelete?: (documentId: string) => void;
  onViewVersions?: (documentId: string) => void;
  showActions?: boolean;
  isRecruiter?: boolean;
}

const DOCUMENT_TYPE_CONFIG: Record<
  DocumentType,
  { label: string; icon: React.ElementType; color: string }
> = {
  cv: { label: "CV / Resume", icon: FileText, color: "text-navy-600" },
  certification: { label: "Certification", icon: Award, color: "text-gold-600" },
  passport: { label: "Passport", icon: CreditCard, color: "text-blue-600" },
  visa: { label: "Visa", icon: Globe, color: "text-purple-600" },
  medical: { label: "Medical Certificate", icon: Heart, color: "text-red-600" },
  reference: { label: "Reference", icon: FileCheck, color: "text-green-600" },
  contract: { label: "Contract", icon: FileSignature, color: "text-indigo-600" },
  photo: { label: "Photo", icon: ImageIcon, color: "text-pink-600" },
  other: { label: "Other Document", icon: File, color: "text-gray-600" },
};

const STATUS_CONFIG: Record<
  DocumentStatus,
  {
    label: string;
    icon: React.ElementType;
    className: string;
    bgClassName: string;
  }
> = {
  pending: {
    label: "Pending Review",
    icon: Clock,
    className: "text-gold-600",
    bgClassName: "bg-gold-50",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    className: "text-success-600",
    bgClassName: "bg-success-50",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className: "text-error-600",
    bgClassName: "bg-error-50",
  },
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

function isExpiringSoon(expiryDate: string): boolean {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const daysUntilExpiry = Math.ceil(
    (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
}

function isExpired(expiryDate: string): boolean {
  const expiry = new Date(expiryDate);
  const now = new Date();
  return expiry < now;
}

/**
 * Detect MIME type from file extension when stored mimeType is generic
 * This handles cases where documents are synced with "application/octet-stream"
 */
function detectMimeType(mimeType: string, fileName: string): string {
  // If we already have a specific MIME type, use it
  if (mimeType && mimeType !== "application/octet-stream") {
    return mimeType;
  }

  // Extract extension from filename
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (!ext) return mimeType;

  // Map common extensions to MIME types
  const extensionMap: Record<string, string> = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
    svg: "image/svg+xml",
    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    rtf: "application/rtf",
  };

  return extensionMap[ext] || mimeType;
}

export default function DocumentCard({
  document,
  onApprove,
  onReject,
  onDelete,
  onViewVersions,
  showActions = true,
  isRecruiter = false,
}: DocumentCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const typeConfig = DOCUMENT_TYPE_CONFIG[document.documentType];
  const statusConfig = STATUS_CONFIG[document.status];
  const TypeIcon = typeConfig.icon;
  const StatusIcon = statusConfig.icon;

  // Detect actual MIME type from file extension if stored as generic octet-stream
  const effectiveMimeType = detectMimeType(document.mimeType, document.name);
  const isImageFile = effectiveMimeType.startsWith("image/");
  const isPdfFile = effectiveMimeType === "application/pdf";
  const isOfficeDoc = [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ].includes(effectiveMimeType);
  const canPreview = isImageFile || isPdfFile || isOfficeDoc;
  const expired = document.expiryDate ? isExpired(document.expiryDate) : false;
  const expiringSoon = document.expiryDate ? isExpiringSoon(document.expiryDate) : false;

  // Fetch signed URL from API
  // When forPreview=true, the URL will have Content-Disposition: inline for in-browser viewing
  // When forPreview=false, the URL will have Content-Disposition: attachment for downloading
  const getSignedUrl = async (forPreview: boolean = false): Promise<string | null> => {
    setIsLoadingUrl(true);
    setUrlError(null);
    try {
      const url = forPreview
        ? `/api/documents/${document.id}/download?preview=true`
        : `/api/documents/${document.id}/download`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get download URL");
      }

      return data.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get download URL";
      setUrlError(message);
      return null;
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleDownload = async () => {
    const url = await getSignedUrl();
    if (url) {
      // Create a link and trigger download
      const link = window.document.createElement("a");
      link.href = url;
      link.download = document.name;
      link.target = "_blank";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  const handlePreview = async () => {
    // For Office documents, we need a public URL to use with Microsoft's viewer
    if (isOfficeDoc) {
      const signedUrl = await getSignedUrl(true);
      if (signedUrl) {
        setPreviewUrl(signedUrl);
        setShowPreviewModal(true);
      }
    } else {
      // Use the view proxy endpoint which serves files with correct Content-Type
      // This ensures PDFs and images display inline instead of downloading
      const viewUrl = `/api/documents/${document.id}/view`;
      setPreviewUrl(viewUrl);
      setShowPreviewModal(true);
    }
  };

  const handleApprove = () => {
    if (onApprove) {
      onApprove(document.id);
    }
  };

  const handleReject = (reason: string) => {
    if (onReject) {
      onReject(document.id, reason);
    }
    setShowRejectModal(false);
  };

  const handleDelete = () => {
    if (onDelete && confirm("Are you sure you want to delete this document?")) {
      onDelete(document.id);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 w-full">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Document Icon */}
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center ${typeConfig.color}`}>
                <TypeIcon className="w-6 h-6" />
              </div>
            </div>

            {/* Document Info */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-gray-900 truncate">
                  {typeConfig.label}
                </h3>
                {document.version > 1 && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded flex-shrink-0">
                    v{document.version}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 truncate block mb-1 max-w-full" title={document.name}>
                {document.name}
              </p>
              <p className="text-xs text-gray-400">
                {formatFileSize(document.fileSize)} • Uploaded{" "}
                {formatDistanceToNow(new Date(document.uploadedAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Actions Menu */}
          {showActions && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    {canPreview && (
                      <button
                        onClick={() => {
                          handlePreview();
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleDownload();
                        setShowMenu(false);
                      }}
                      disabled={isLoadingUrl}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                    >
                      {isLoadingUrl ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Download
                    </button>
                    {document.version > 1 && onViewVersions && (
                      <button
                        onClick={() => {
                          onViewVersions(document.id);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <History className="w-4 h-4" />
                        View Versions ({document.version})
                      </button>
                    )}
                    {/* Approve button - show for pending and rejected documents */}
                    {isRecruiter && (document.status === "pending" || document.status === "rejected") && (
                      <button
                        onClick={() => {
                          handleApprove();
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-success-600 hover:bg-success-50 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {document.status === "rejected" ? "Re-approve" : "Approve"}
                      </button>
                    )}
                    {/* Reject button - show for pending and approved documents */}
                    {isRecruiter && (document.status === "pending" || document.status === "approved") && (
                      <button
                        onClick={() => {
                          setShowRejectModal(true);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-error-600 hover:bg-error-50 flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          handleDelete();
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-error-600 hover:bg-error-50 flex items-center gap-2 border-t border-gray-100 mt-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {document.description && (
          <p className="text-sm text-gray-600 mb-3">{document.description}</p>
        )}

        {/* Status and Expiry Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {/* Status Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgClassName} ${statusConfig.className}`}
          >
            <StatusIcon className="w-4 h-4" />
            {statusConfig.label}
          </div>

          {/* Expiry Warning */}
          {expired && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-error-50 text-error-600">
              <AlertTriangle className="w-4 h-4" />
              Expired
            </div>
          )}
          {!expired && expiringSoon && document.expiryDate && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-warning-50 text-warning-600">
              <AlertTriangle className="w-4 h-4" />
              Expires{" "}
              {formatDistanceToNow(new Date(document.expiryDate), {
                addSuffix: true,
              })}
            </div>
          )}
        </div>

        {/* Rejection Reason */}
        {document.status === "rejected" && document.rejectionReason && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-3 mb-3">
            <p className="text-sm font-medium text-error-900 mb-1">
              Rejection Reason:
            </p>
            <p className="text-sm text-error-700">{document.rejectionReason}</p>
          </div>
        )}

        {/* Approval/Rejection Info */}
        {document.status === "approved" && document.approvedAt && (
          <p className="text-xs text-gray-500">
            Approved {formatDistanceToNow(new Date(document.approvedAt), { addSuffix: true })}
          </p>
        )}
        {document.status === "rejected" && document.rejectedAt && (
          <p className="text-xs text-gray-500">
            Rejected {formatDistanceToNow(new Date(document.rejectedAt), { addSuffix: true })}
          </p>
        )}

        {/* Expiry Date */}
        {document.expiryDate && !expired && !expiringSoon && (
          <p className="text-xs text-gray-500 mt-2">
            Expires on {new Date(document.expiryDate).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <RejectModal
          onClose={() => setShowRejectModal(false)}
          onReject={handleReject}
        />
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewUrl && (
        <DocumentPreviewModal
          url={previewUrl}
          fileName={document.name}
          mimeType={effectiveMimeType}
          onClose={() => {
            setShowPreviewModal(false);
            setPreviewUrl(null);
          }}
          onDownload={handleDownload}
        />
      )}

      {/* Error Toast */}
      {urlError && (
        <div className="fixed bottom-4 right-4 bg-error-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span>{urlError}</span>
          <button
            onClick={() => setUrlError(null)}
            className="ml-2 hover:bg-error-700 rounded p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}

// Reject Modal Component
function RejectModal({
  onClose,
  onReject,
}: {
  onClose: () => void;
  onReject: (reason: string) => void;
}) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const REJECTION_REASONS = [
    "Unclear or blurry",
    "Document expired",
    "Wrong document type",
    "Information incomplete",
    "Name does not match profile",
    "Invalid document format",
    "Other",
  ];

  const handleSubmit = () => {
    const reason =
      selectedReason === "Other" ? customReason : selectedReason;
    if (reason.trim()) {
      onReject(reason);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Reject Document
          </h3>

          <div className="space-y-3 mb-6">
            {REJECTION_REASONS.map((reason) => (
              <label
                key={reason}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name="rejection-reason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-4 h-4 text-gold-600"
                />
                <span className="text-sm text-gray-700">{reason}</span>
              </label>
            ))}
          </div>

          {selectedReason === "Other" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please specify reason
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                placeholder="Enter rejection reason..."
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                !selectedReason ||
                (selectedReason === "Other" && !customReason.trim())
              }
              className="flex-1 px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reject Document
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Document Preview Modal Component
function DocumentPreviewModal({
  url,
  fileName,
  mimeType,
  onClose,
  onDownload,
}: {
  url: string;
  fileName: string;
  mimeType: string;
  onClose: () => void;
  onDownload: () => void;
}) {
  const isImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf";
  const isOfficeDoc = [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ].includes(mimeType);

  // Microsoft Office Online viewer URL
  // This requires a publicly accessible URL to the document
  const officeViewerUrl = isOfficeDoc
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
    : null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gold-600" />
              <h3 className="text-lg font-semibold text-gray-900 truncate max-w-md">
                {fileName}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onDownload}
                className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-auto p-4 bg-gray-100 min-h-[400px]">
            {isImage && (
              <div className="flex items-center justify-center h-full">
                <img
                  src={url}
                  alt={fileName}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                />
              </div>
            )}
            {isPdf && (
              <iframe
                src={`${url}#toolbar=1&navpanes=0`}
                className="w-full h-[70vh] rounded-lg shadow-lg bg-white"
                title={fileName}
              />
            )}
            {isOfficeDoc && officeViewerUrl && (
              <iframe
                src={officeViewerUrl}
                className="w-full h-[70vh] rounded-lg shadow-lg bg-white"
                title={fileName}
              />
            )}
            {!isImage && !isPdf && !isOfficeDoc && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <File className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">
                  Preview not available for this file type
                </p>
                <p className="text-sm text-gray-500 mb-4">{mimeType}</p>
                <button
                  onClick={onDownload}
                  className="btn-primary flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
