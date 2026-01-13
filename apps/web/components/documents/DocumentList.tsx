"use client";

import { useState, useEffect } from "react";
import DocumentCard from "./DocumentCard";
import { DocumentUploadModal } from "./DocumentUploadModal";
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
  Upload,
  Filter,
  Search,
  AlertCircle,
  Loader2,
} from "lucide-react";

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

interface DocumentListProps {
  candidateId: string;
  entityType?: "candidate" | "client" | "job";
  entityId?: string;
  isRecruiter?: boolean;
  onDocumentsChange?: () => void;
  excludeDocumentTypes?: DocumentType[];
  showStatusBadges?: boolean;
}

const DOCUMENT_TYPE_CONFIG: Record<
  DocumentType,
  { label: string; icon: React.ElementType }
> = {
  cv: { label: "CV / Resume", icon: FileText },
  certification: { label: "Certifications", icon: Award },
  passport: { label: "Passport", icon: CreditCard },
  visa: { label: "Visa", icon: Globe },
  medical: { label: "Medical Certificates", icon: Heart },
  reference: { label: "References", icon: FileCheck },
  contract: { label: "Contracts", icon: FileSignature },
  photo: { label: "Photos", icon: ImageIcon },
  other: { label: "Other Documents", icon: File },
};

const STATUS_FILTERS = [
  { value: "all", label: "All Documents" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const;

export default function DocumentList({
  candidateId,
  entityType = "candidate",
  entityId,
  isRecruiter = false,
  onDocumentsChange,
  excludeDocumentTypes,
  showStatusBadges,
}: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [groupedDocuments, setGroupedDocuments] = useState<
    Record<DocumentType, Document[]>
  >({} as Record<DocumentType, Document[]>);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | undefined>();

  const finalEntityId = entityId || candidateId;

  // Fetch documents
  useEffect(() => {
    fetchDocuments();
  }, [candidateId, entityId, entityType]);

  // Filter and group documents
  useEffect(() => {
    let filtered = documents;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((doc) => doc.status === statusFilter);
    }

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(
        (doc) =>
          doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          DOCUMENT_TYPE_CONFIG[doc.documentType].label
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    setFilteredDocuments(filtered);

    // Group by document type
    const grouped = filtered.reduce((acc, doc) => {
      if (!acc[doc.documentType]) {
        acc[doc.documentType] = [];
      }
      acc[doc.documentType].push(doc);
      return acc;
    }, {} as Record<DocumentType, Document[]>);

    setGroupedDocuments(grouped);
  }, [documents, statusFilter, searchQuery]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/${entityType}s/${finalEntityId}/documents?latestOnly=true`
      );
      if (!response.ok) throw new Error("Failed to fetch documents");
      const data = await response.json();
      const fetchedDocuments = data.documents || [];
      const filteredDocuments = excludeDocumentTypes?.length
        ? fetchedDocuments.filter(
            (doc: Document) => !excludeDocumentTypes.includes(doc.documentType)
          )
        : fetchedDocuments;
      setDocuments(filteredDocuments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (documentId: string) => {
    // Only available for recruiters
    if (!isRecruiter) return;
    try {
      const response = await fetch(`/api/documents/${documentId}/approve`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to approve document");
      await fetchDocuments();
      if (onDocumentsChange) onDocumentsChange();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve document");
    }
  };

  const handleReject = async (documentId: string, reason: string) => {
    // Only available for recruiters
    if (!isRecruiter) return;
    try {
      const response = await fetch(`/api/documents/${documentId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error("Failed to reject document");
      await fetchDocuments();
      if (onDocumentsChange) onDocumentsChange();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject document");
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete document");
      await fetchDocuments();
      if (onDocumentsChange) onDocumentsChange();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete document");
    }
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    setSelectedDocumentType(undefined);
    fetchDocuments();
    if (onDocumentsChange) onDocumentsChange();
  };

  const handleUploadClick = (documentType?: DocumentType) => {
    setSelectedDocumentType(documentType);
    setShowUploadModal(true);
  };

  const statusCounts = {
    all: documents.length,
    pending: documents.filter((d) => d.status === "pending").length,
    approved: documents.filter((d) => d.status === "approved").length,
    rejected: documents.filter((d) => d.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-gold-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-50 border border-error-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-error-900">Error loading documents</p>
          <p className="text-sm text-error-700 mt-1">{error}</p>
          <button
            onClick={fetchDocuments}
            className="mt-2 text-sm font-medium text-error-600 hover:text-error-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
          <p className="text-sm text-gray-600 mt-1">
            {documents.length} {documents.length === 1 ? "document" : "documents"} uploaded
          </p>
        </div>
        <button
          onClick={() => handleUploadClick()}
          className="btn-primary flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === filter.value
                  ? "bg-navy-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {filter.label}
              {statusCounts[filter.value as keyof typeof statusCounts] > 0 && (
                <span className="ml-2">
                  ({statusCounts[filter.value as keyof typeof statusCounts]})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          />
        </div>
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {documents.length === 0 ? "No documents yet" : "No documents found"}
          </h3>
          <p className="text-gray-600 mb-4">
            {documents.length === 0
              ? "Upload your first document to get started"
              : "Try adjusting your filters or search query"}
          </p>
          {documents.length === 0 && (
            <button
              onClick={() => handleUploadClick()}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Document
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Grouped by Document Type */}
          {Object.entries(groupedDocuments).map(([type, docs]) => {
            const typeConfig = DOCUMENT_TYPE_CONFIG[type as DocumentType] || DOCUMENT_TYPE_CONFIG.other;
            const TypeIcon = typeConfig.icon;
            return (
              <div key={type}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TypeIcon className="w-5 h-5 text-gold-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {typeConfig.label}
                    </h3>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded">
                      {docs.length}
                    </span>
                  </div>
                  <button
                    onClick={() => handleUploadClick(type as DocumentType)}
                    className="text-sm text-gold-600 hover:text-gold-700 font-medium flex items-center gap-1"
                  >
                    <Upload className="w-4 h-4" />
                    Add {typeConfig.label}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {docs.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      onApprove={isRecruiter ? handleApprove : undefined}
                      onReject={isRecruiter ? handleReject : undefined}
                      onDelete={handleDelete}
                      isRecruiter={isRecruiter}
                      showActions={true}
                      showStatusBadge={showStatusBadges}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowUploadModal(false);
              setSelectedDocumentType(undefined);
            }}
          />
          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <DocumentUploadModal
              candidateId={candidateId}
              documentType={selectedDocumentType}
              onClose={() => {
                setShowUploadModal(false);
                setSelectedDocumentType(undefined);
              }}
              onUploadComplete={handleUploadSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
}
