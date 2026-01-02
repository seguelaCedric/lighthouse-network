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
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  AlertTriangle,
  Eye,
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

interface Document {
  id: string;
  documentType: DocumentType;
  fileUrl: string;
  name: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  status: "pending";
  version: number;
  expiryDate?: string;
  uploadedAt: string;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface DocumentApprovalCardProps {
  document: Document;
  onApprove: (documentId: string) => void;
  onReject: (documentId: string, reason: string) => void;
}

const DOCUMENT_TYPE_CONFIG: Record<
  DocumentType,
  { label: string; icon: React.ElementType; color: string }
> = {
  cv: { label: "CV / Resume", icon: FileText, color: "text-primary-600" },
  certification: { label: "Certification", icon: Award, color: "text-gold-600" },
  passport: { label: "Passport", icon: CreditCard, color: "text-blue-600" },
  visa: { label: "Visa", icon: Globe, color: "text-purple-600" },
  medical: { label: "Medical Certificate", icon: Heart, color: "text-red-600" },
  reference: { label: "Reference", icon: FileCheck, color: "text-green-600" },
  contract: { label: "Contract", icon: FileSignature, color: "text-indigo-600" },
  photo: { label: "Photo", icon: ImageIcon, color: "text-pink-600" },
  other: { label: "Other Document", icon: File, color: "text-gray-600" },
};

const REJECTION_REASONS = [
  "Unclear or blurry",
  "Document expired",
  "Wrong document type",
  "Information incomplete",
  "Name does not match profile",
  "Invalid document format",
  "Other",
] as const;

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function isExpired(expiryDate: string): boolean {
  const expiry = new Date(expiryDate);
  const now = new Date();
  return expiry < now;
}

export default function DocumentApprovalCard({
  document,
  onApprove,
  onReject,
}: DocumentApprovalCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const typeConfig = DOCUMENT_TYPE_CONFIG[document.documentType];
  const TypeIcon = typeConfig.icon;
  const isImageFile = document.mimeType.startsWith("image/");
  const expired = document.expiryDate ? isExpired(document.expiryDate) : false;

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await onApprove(document.id);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (reason: string) => {
    setProcessing(true);
    try {
      await onReject(document.id, reason);
      setShowRejectModal(false);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            {/* Document Icon/Preview */}
            <div className="flex-shrink-0">
              {isImageFile ? (
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 cursor-pointer" onClick={() => setShowPreview(true)}>
                  <img
                    src={document.fileUrl}
                    alt={document.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className={`w-16 h-16 rounded-lg bg-gray-50 flex items-center justify-center ${typeConfig.color}`}>
                  <TypeIcon className="w-8 h-8" />
                </div>
              )}
            </div>

            {/* Document Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">{typeConfig.label}</h3>
                {document.version > 1 && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                    v{document.version}
                  </span>
                )}
                <span className="px-2 py-0.5 bg-gold-50 text-gold-700 text-xs font-medium rounded inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Pending Review
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{document.name}</p>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {document.candidate.firstName} {document.candidate.lastName}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDistanceToNow(new Date(document.uploadedAt), { addSuffix: true })}
                </span>
                <span>{formatFileSize(document.fileSize)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {document.description && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">{document.description}</p>
          </div>
        )}

        {/* Expiry Warning */}
        {expired && (
          <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-error-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-error-900">Document Expired</p>
              <p className="text-xs text-error-700 mt-0.5">
                This document expired on {new Date(document.expiryDate!).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Candidate Info */}
        <div className="mb-4 p-3 bg-primary-50 rounded-lg">
          <p className="text-xs font-medium text-primary-900 mb-1">Candidate Information</p>
          <p className="text-sm text-primary-800">
            {document.candidate.firstName} {document.candidate.lastName}
          </p>
          <p className="text-xs text-primary-600">{document.candidate.email}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => window.open(document.fileUrl, "_blank")}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={processing}
            className="flex-1 px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>
          <button
            onClick={handleApprove}
            disabled={processing}
            className="flex-1 px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            Approve
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && isImageFile && (
        <>
          <div className="fixed inset-0 bg-black/80 z-40" onClick={() => setShowPreview(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{document.name}</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-4">
                <img
                  src={document.fileUrl}
                  alt={document.name}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <RejectModal
          onClose={() => setShowRejectModal(false)}
          onReject={handleReject}
          processing={processing}
        />
      )}
    </>
  );
}

// Reject Modal Component
function RejectModal({
  onClose,
  onReject,
  processing,
}: {
  onClose: () => void;
  onReject: (reason: string) => void;
  processing: boolean;
}) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const handleSubmit = () => {
    const reason = selectedReason === "Other" ? customReason : selectedReason;
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
                  className="w-4 h-4 text-primary-600"
                  disabled={processing}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter rejection reason..."
                disabled={processing}
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={processing}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                processing ||
                !selectedReason ||
                (selectedReason === "Other" && !customReason.trim())
              }
              className="flex-1 px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? "Processing..." : "Reject Document"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
