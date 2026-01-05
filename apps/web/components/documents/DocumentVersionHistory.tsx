"use client";

import { useState, useEffect } from "react";
import {
  X,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type DocumentStatus = "pending" | "approved" | "rejected";

interface DocumentVersion {
  id: string;
  version: number;
  fileUrl: string;
  name: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  isLatestVersion: boolean;
  uploadedAt: string;
  uploadedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
}

interface DocumentVersionHistoryProps {
  documentId: string;
  onClose: () => void;
}

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
    label: "Pending",
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
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export default function DocumentVersionHistory({
  documentId,
  onClose,
}: DocumentVersionHistoryProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  useEffect(() => {
    fetchVersions();
  }, [documentId]);

  const fetchVersions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/documents/${documentId}/versions`);
      if (!response.ok) throw new Error("Failed to fetch version history");
      const data = await response.json();
      setVersions(data.versions || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load version history"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (versionId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/documents/${versionId}/download?preview=true`);
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
  };

  const toggleExpand = (versionId: string) => {
    setExpandedVersion(expandedVersion === versionId ? null : versionId);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Version History
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {versions.length} {versions.length === 1 ? "version" : "versions"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="bg-error-50 border border-error-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-error-900">
                    Error loading version history
                  </p>
                  <p className="text-sm text-error-700 mt-1">{error}</p>
                  <button
                    onClick={fetchVersions}
                    className="mt-2 text-sm font-medium text-error-600 hover:text-error-700"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No version history
                </h3>
                <p className="text-gray-600">
                  This document has no previous versions.
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

                {/* Versions */}
                <div className="space-y-6">
                  {versions.map((version, index) => {
                    const statusConfig = STATUS_CONFIG[version.status];
                    const StatusIcon = statusConfig.icon;
                    const isExpanded = expandedVersion === version.id;
                    const isLatest = version.isLatestVersion;

                    return (
                      <div key={version.id} className="relative pl-14">
                        {/* Timeline Dot */}
                        <div
                          className={`absolute left-4 top-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isLatest
                              ? "bg-primary-600 border-primary-600"
                              : "bg-white border-gray-300"
                          }`}
                        >
                          {isLatest && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>

                        {/* Version Card */}
                        <div
                          className={`bg-white border rounded-lg overflow-hidden transition-shadow ${
                            isLatest
                              ? "border-primary-200 shadow-md"
                              : "border-gray-200"
                          }`}
                        >
                          {/* Version Header */}
                          <button
                            onClick={() => toggleExpand(version.id)}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-left">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-900">
                                    Version {version.version}
                                  </h4>
                                  {isLatest && (
                                    <span className="px-2 py-0.5 bg-primary-600 text-white text-xs font-medium rounded">
                                      Current
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">
                                  {version.name}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDistanceToNow(
                                    new Date(version.uploadedAt),
                                    { addSuffix: true }
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Status Badge */}
                              <div
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgClassName} ${statusConfig.className}`}
                              >
                                <StatusIcon className="w-4 h-4" />
                                {statusConfig.label}
                              </div>

                              {/* Expand Icon */}
                              <ChevronRight
                                className={`w-5 h-5 text-gray-400 transition-transform ${
                                  isExpanded ? "rotate-90" : ""
                                }`}
                              />
                            </div>
                          </button>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="border-t border-gray-200 p-4 bg-gray-50">
                              <div className="space-y-3">
                                {/* File Details */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-500 mb-1">File Size</p>
                                    <p className="font-medium text-gray-900">
                                      {formatFileSize(version.fileSize)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500 mb-1">File Type</p>
                                    <p className="font-medium text-gray-900">
                                      {version.mimeType.split("/")[1].toUpperCase()}
                                    </p>
                                  </div>
                                </div>

                                {/* Approval/Rejection Info */}
                                {version.status === "approved" &&
                                  version.approvedAt && (
                                    <div className="bg-success-50 border border-success-200 rounded-lg p-3">
                                      <p className="text-sm font-medium text-success-900">
                                        Approved{" "}
                                        {formatDistanceToNow(
                                          new Date(version.approvedAt),
                                          { addSuffix: true }
                                        )}
                                      </p>
                                    </div>
                                  )}

                                {version.status === "rejected" && (
                                  <div className="bg-error-50 border border-error-200 rounded-lg p-3">
                                    <p className="text-sm font-medium text-error-900 mb-1">
                                      Rejected{" "}
                                      {version.rejectedAt &&
                                        formatDistanceToNow(
                                          new Date(version.rejectedAt),
                                          { addSuffix: true }
                                        )}
                                    </p>
                                    {version.rejectionReason && (
                                      <p className="text-sm text-error-700">
                                        Reason: {version.rejectionReason}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {version.status === "pending" && (
                                  <div className="bg-gold-50 border border-gold-200 rounded-lg p-3">
                                    <p className="text-sm font-medium text-gold-900">
                                      Waiting for review
                                    </p>
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 pt-2">
                                  <button
                                    onClick={() => handleDownload(version.id, version.name)}
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <Download className="w-4 h-4" />
                                    Download
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
