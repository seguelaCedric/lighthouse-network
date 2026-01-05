"use client";

import * as React from "react";
import {
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Mail,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmployerEnquiry {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  status: "submitted" | "under_review" | "verified" | "invalid" | "duplicate";
  submitted_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
}

interface EmployerEnquiryListProps {
  enquiries: EmployerEnquiry[];
  className?: string;
}

const statusConfig = {
  submitted: {
    label: "Submitted",
    icon: Clock,
    color: "text-blue-600 bg-blue-100",
    description: "Under initial review",
  },
  under_review: {
    label: "Under Review",
    icon: AlertCircle,
    color: "text-amber-600 bg-amber-100",
    description: "Being verified by our team",
  },
  verified: {
    label: "Verified",
    icon: CheckCircle2,
    color: "text-green-600 bg-green-100",
    description: "Lead confirmed - eligible for rewards",
  },
  invalid: {
    label: "Invalid",
    icon: XCircle,
    color: "text-red-600 bg-red-100",
    description: "Could not verify lead",
  },
  duplicate: {
    label: "Duplicate",
    icon: Copy,
    color: "text-gray-600 bg-gray-100",
    description: "Client already in system",
  },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function EmployerEnquiryList({
  enquiries,
  className,
}: EmployerEnquiryListProps) {
  if (enquiries.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-gray-200 bg-white p-8 text-center",
          className
        )}
      >
        <Building2 className="mx-auto size-12 text-gray-300" />
        <h3 className="mt-4 font-medium text-gray-900">No employer leads yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Submit your first employer lead above to start earning rewards.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {enquiries.map((enquiry) => {
        const status = statusConfig[enquiry.status];
        const StatusIcon = status.icon;

        return (
          <div
            key={enquiry.id}
            className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-navy-100">
                  <Building2 className="size-5 text-navy-600" />
                </div>
                <div>
                  <h4 className="font-medium text-navy-900">
                    {enquiry.company_name}
                  </h4>
                  <p className="text-sm text-gray-600">{enquiry.contact_name}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    {enquiry.contact_email && (
                      <span className="flex items-center gap-1">
                        <Mail className="size-3" />
                        {enquiry.contact_email}
                      </span>
                    )}
                    {enquiry.contact_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="size-3" />
                        {enquiry.contact_phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                    status.color
                  )}
                >
                  <StatusIcon className="size-3.5" />
                  {status.label}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(enquiry.submitted_at)}
                </span>
              </div>
            </div>

            {enquiry.notes && (
              <p className="mt-3 border-t border-gray-100 pt-3 text-sm text-gray-600">
                {enquiry.notes}
              </p>
            )}

            {enquiry.review_notes && enquiry.status !== "submitted" && (
              <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                <span className="font-medium">Review note:</span>{" "}
                {enquiry.review_notes}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
