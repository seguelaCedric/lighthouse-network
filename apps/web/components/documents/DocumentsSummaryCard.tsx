"use client";

import Link from "next/link";
import { FileText, AlertCircle, CheckCircle2, Edit2, Award, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DocumentsSummaryCardProps {
  documents: {
    hasCV: boolean;
    totalDocuments: number;
    totalCertifications: number;
    expiringCertificationsCount: number;
    pendingDocumentsCount?: number; // Optional for backward compatibility, but not used
  };
}

export function DocumentsSummaryCard({ documents }: DocumentsSummaryCardProps) {
  const { hasCV, totalDocuments, totalCertifications, expiringCertificationsCount } = documents;

  const hasIssues = !hasCV || expiringCertificationsCount > 0;
  const isComplete = hasCV && expiringCertificationsCount === 0;

  if (!hasCV) {
    return (
      <Link
        href="/crew/documents#cv"
        className="group block rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 sm:p-6 transition-all hover:border-gold-400 hover:bg-gold-50"
      >
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gray-200 group-hover:bg-gold-100">
            <AlertCircle className="size-6 text-gray-500 group-hover:text-gold-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-navy-900">Upload Your CV</h3>
            <p className="mt-1 text-sm text-gray-600">
              Add your CV to enable quick apply and get better job matches.
            </p>
            <div className="mt-3 inline-flex items-center text-sm font-medium text-gold-600 group-hover:text-gold-700">
              Upload CV
              <Upload className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="mb-3 sm:mb-4 flex items-center justify-between gap-2">
        <h3 className="font-serif text-lg sm:text-xl font-medium text-navy-900">
          Documents
        </h3>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {isComplete && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-100 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium text-success-700 whitespace-nowrap">
              <CheckCircle2 className="size-2.5 sm:size-3" />
              Up to date
            </span>
          )}
          <Link href="/crew/documents">
            <Button
              variant="outline"
              size="sm"
              className="px-2 sm:px-3 text-xs sm:text-sm gap-1.5 border-gray-300 hover:border-gold-400 hover:bg-gold-50"
            >
              <Edit2 className="size-3 sm:size-3.5" />
              <span className="hidden sm:inline">Manage</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3 sm:space-y-4">
        {/* CV Status */}
        {hasCV && (
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="flex size-10 sm:size-12 shrink-0 items-center justify-center rounded-xl bg-navy-50">
              <FileText className="size-4 sm:size-5 text-navy-600" />
            </div>
            <div className="flex-1 pt-0.5 sm:pt-1 min-w-0">
              <p className="font-medium text-sm sm:text-base text-navy-900">CV / Resume</p>
              <p className="mt-0.5 text-xs sm:text-sm text-gray-500">Uploaded</p>
            </div>
          </div>
        )}

        {/* Certifications */}
        {totalCertifications > 0 && (
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div
              className={cn(
                "flex size-10 sm:size-12 shrink-0 items-center justify-center rounded-xl",
                expiringCertificationsCount > 0 ? "bg-warning-50" : "bg-navy-50"
              )}
            >
              <Award
                className={cn(
                  "size-4 sm:size-5",
                  expiringCertificationsCount > 0 ? "text-warning-600" : "text-navy-600"
                )}
              />
            </div>
            <div className="flex-1 pt-0.5 sm:pt-1 min-w-0">
              <p className="font-medium text-sm sm:text-base text-navy-900">
                {totalCertifications} {totalCertifications === 1 ? "Certification" : "Certifications"}
              </p>
              {expiringCertificationsCount > 0 ? (
                <Link
                  href="/crew/documents#certificates"
                  className="mt-0.5 inline-flex items-center gap-1 text-xs sm:text-sm text-warning-700 hover:text-warning-800"
                >
                  <AlertCircle className="size-3 sm:size-3.5" />
                  {expiringCertificationsCount} {expiringCertificationsCount === 1 ? "expiring soon" : "expiring soon"}
                </Link>
              ) : (
                <p className="mt-0.5 text-xs sm:text-sm text-gray-500">All up to date</p>
              )}
            </div>
          </div>
        )}

        {/* Total Documents Count */}
        {totalDocuments > 1 && (
          <div className="pt-1 sm:pt-2 border-t border-gray-100">
            <p className="text-xs sm:text-sm text-gray-600">
              {totalDocuments} total {totalDocuments === 1 ? "document" : "documents"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
