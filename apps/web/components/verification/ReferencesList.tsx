"use client";

import * as React from "react";
import {
  CheckCircle2,
  Clock,
  Star,
  Building2,
  Calendar,
  Phone,
  Mail,
  Plus,
  ChevronDown,
  ChevronUp,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface Reference {
  id: string;
  referee_name: string;
  relationship: string | null;
  company_vessel: string | null;
  dates_worked: string | null;
  referee_email: string | null;
  referee_phone: string | null;
  status: "pending" | "contacted" | "verified" | "failed" | "declined";
  is_verified: boolean;
  rating: number | null;
  feedback: string | null;
  created_at: string;
}

export interface ReferencesListProps {
  references: Reference[];
  verifiedCount: number;
  requiredCount?: number;
  onAddReference?: () => void;
  showAddButton?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<
  Reference["status"],
  { label: string; icon: React.ElementType; className: string }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    className: "text-gold-600 bg-gold-50 border-gold-200",
  },
  contacted: {
    label: "Contacted",
    icon: Phone,
    className: "text-blue-600 bg-blue-50 border-blue-200",
  },
  verified: {
    label: "Verified",
    icon: CheckCircle2,
    className: "text-success-600 bg-success-50 border-success-200",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    className: "text-error-600 bg-error-50 border-error-200",
  },
  declined: {
    label: "Declined",
    icon: AlertCircle,
    className: "text-gray-600 bg-gray-50 border-gray-200",
  },
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  captain: "Captain",
  chief_officer: "Chief Officer",
  chief_stew: "Chief Stewardess",
  head_chef: "Head Chef",
  chief_engineer: "Chief Engineer",
  bosun: "Bosun",
  manager: "Manager",
  colleague: "Colleague",
  owner: "Owner",
  other: "Other",
};

function ReferenceCard({ reference }: { reference: Reference }) {
  const [expanded, setExpanded] = React.useState(false);
  const statusConfig = STATUS_CONFIG[reference.status];
  const StatusIcon = statusConfig.icon;
  const relationshipLabel = reference.relationship
    ? RELATIONSHIP_LABELS[reference.relationship] || reference.relationship
    : null;

  return (
    <div
      className={cn(
        "rounded-lg border bg-white transition-shadow hover:shadow-sm",
        reference.is_verified ? "border-success-200" : "border-gray-200"
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-navy-800">{reference.referee_name}</h4>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                  statusConfig.className
                )}
              >
                <StatusIcon className="size-3" />
                {statusConfig.label}
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
              {reference.company_vessel && (
                <span className="flex items-center gap-1">
                  <Building2 className="size-3.5 text-gray-400" />
                  {reference.company_vessel}
                </span>
              )}
              {relationshipLabel && (
                <span className="text-gray-500">
                  {relationshipLabel}
                </span>
              )}
              {reference.dates_worked && (
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5 text-gray-400" />
                  {reference.dates_worked}
                </span>
              )}
            </div>

            {/* Rating display for verified references */}
            {reference.is_verified && reference.rating !== null && (
              <div className="mt-2 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "size-4",
                      star <= reference.rating!
                        ? "fill-gold-400 text-gold-400"
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Status message for pending */}
            {reference.status === "pending" && (
              <p className="mt-2 text-xs text-gray-500">
                Awaiting verification by recruiter
              </p>
            )}
          </div>

          {/* Expand button for details */}
          {(reference.referee_email || reference.referee_phone || reference.feedback) && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="ml-2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              {expanded ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>
          )}
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-3 border-t border-gray-100 pt-3">
            {(reference.referee_email || reference.referee_phone) && (
              <div className="mb-2 flex flex-wrap gap-3 text-sm text-gray-600">
                {reference.referee_email && (
                  <span className="flex items-center gap-1">
                    <Mail className="size-3.5 text-gray-400" />
                    {reference.referee_email}
                  </span>
                )}
                {reference.referee_phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="size-3.5 text-gray-400" />
                    {reference.referee_phone}
                  </span>
                )}
              </div>
            )}
            {reference.feedback && (
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-500">Feedback</p>
                <p className="mt-1 text-sm text-gray-700">{reference.feedback}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ReferencesList({
  references,
  verifiedCount,
  requiredCount = 2,
  onAddReference,
  showAddButton = true,
  className,
}: ReferencesListProps) {
  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white shadow-sm", className)}>
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div>
          <h3 className="font-serif text-lg font-semibold text-navy-800">
            Your References
          </h3>
          <p className="mt-0.5 text-sm text-gray-500">
            {verifiedCount}/{requiredCount} verified
          </p>
        </div>
        {showAddButton && onAddReference && (
          <Button variant="secondary" size="sm" onClick={onAddReference}>
            <Plus className="mr-1.5 size-4" />
            Add Reference
          </Button>
        )}
      </div>

      <div className="p-6">
        {references.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-gray-100">
              <Star className="size-6 text-gray-400" />
            </div>
            <p className="font-medium text-gray-600">No references added yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Add references from previous positions to boost your verification status
            </p>
            {showAddButton && onAddReference && (
              <Button variant="secondary" size="sm" className="mt-4" onClick={onAddReference}>
                <Plus className="mr-1.5 size-4" />
                Add Your First Reference
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {references.map((reference) => (
              <ReferenceCard key={reference.id} reference={reference} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
