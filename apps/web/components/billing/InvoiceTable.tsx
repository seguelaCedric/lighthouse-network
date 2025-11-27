"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Filter,
} from "lucide-react";
import type { Invoice, InvoiceStatus } from "@lighthouse/database";

interface InvoiceTableProps {
  invoices: Invoice[];
  total?: number;
  limit?: number;
  offset?: number;
  onPageChange?: (offset: number) => void;
  onDownload?: (invoice: Invoice) => void;
  onViewOnline?: (invoice: Invoice) => void;
  showViewAll?: boolean;
  onViewAll?: () => void;
  isLoading?: boolean;
  compact?: boolean;
}

const statusStyles: Record<
  InvoiceStatus,
  { bg: string; text: string; label: string }
> = {
  draft: { bg: "bg-gray-100", text: "text-gray-700", label: "Draft" },
  pending: { bg: "bg-gold-100", text: "text-gold-700", label: "Pending" },
  paid: { bg: "bg-success-100", text: "text-success-700", label: "Paid" },
  void: { bg: "bg-gray-100", text: "text-gray-500", label: "Void" },
  uncollectible: {
    bg: "bg-burgundy-100",
    text: "text-burgundy-700",
    label: "Uncollectible",
  },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(cents: number, currency: string = "EUR"): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function InvoiceTable({
  invoices,
  total = 0,
  limit = 10,
  offset = 0,
  onPageChange,
  onDownload,
  onViewOnline,
  showViewAll,
  onViewAll,
  isLoading,
  compact,
}: InvoiceTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <div className="h-5 w-32 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="divide-y divide-gray-100">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-gray-100 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
                  <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-5 w-16 rounded bg-gray-200 animate-pulse" />
                <div className="h-5 w-14 rounded-full bg-gray-100 animate-pulse" />
                <div className="size-8 rounded-lg bg-gray-100 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-gray-100">
          <FileText className="size-6 text-gray-400" />
        </div>
        <h3 className="font-medium text-navy-900">No invoices yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Your invoice history will appear here
        </p>
      </div>
    );
  }

  const hasMore = total > offset + invoices.length;
  const hasPrevious = offset > 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 p-4">
        <h3 className="font-semibold text-navy-900">
          {compact ? "Recent Invoices" : "Invoice History"}
        </h3>
        {showViewAll && onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-sm font-medium text-gold-600 hover:text-gold-700"
          >
            View all
            <ChevronRight className="size-4" />
          </button>
        )}
      </div>

      {/* Invoice list */}
      <div className="divide-y divide-gray-100">
        {invoices.map((invoice) => {
          const status = statusStyles[invoice.status] || statusStyles.pending;

          return (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-gray-100">
                  <FileText className="size-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-navy-900">
                    {invoice.invoice_number}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(invoice.issued_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium text-navy-900">
                  {formatAmount(invoice.total, invoice.currency)}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    status.bg,
                    status.text
                  )}
                >
                  {status.label}
                </span>
                <div className="flex items-center gap-1">
                  {invoice.invoice_pdf_url && onDownload && (
                    <button
                      onClick={() => onDownload(invoice)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Download PDF"
                    >
                      <Download className="size-4" />
                    </button>
                  )}
                  {invoice.hosted_invoice_url && onViewOnline && (
                    <button
                      onClick={() => onViewOnline(invoice)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="View online"
                    >
                      <ExternalLink className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination - only show if not compact and has multiple pages */}
      {!compact && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
          <p className="text-sm text-gray-500">
            Showing {offset + 1}-{Math.min(offset + invoices.length, total)} of{" "}
            {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(Math.max(0, offset - limit))}
              disabled={!hasPrevious}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <span className="px-2 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(offset + limit)}
              disabled={!hasMore}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
