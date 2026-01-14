"use client"

import { MessageSquare, Eye, Trash2 } from "lucide-react"
import { EnquiryTypeBadge } from "./EnquiryTypeBadge"
import { EnquiryStatusBadge } from "./EnquiryStatusBadge"
import { type UnifiedEnquiry } from "@/lib/validations/enquiries"

interface EnquiriesTableProps {
  enquiries: UnifiedEnquiry[]
  isLoading: boolean
  onViewEnquiry: (enquiry: UnifiedEnquiry) => void
  onDeleteEnquiry: (enquiry: UnifiedEnquiry) => void
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function EnquiriesTable({
  enquiries,
  isLoading,
  onViewEnquiry,
  onDeleteEnquiry,
}: EnquiriesTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="p-8">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-6 w-24 rounded bg-gray-200" />
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="h-4 w-48 rounded bg-gray-200" />
                <div className="h-6 w-20 rounded bg-gray-200" />
                <div className="h-4 w-24 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (enquiries.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="p-8 text-center">
          <MessageSquare className="mx-auto size-12 text-gray-300" />
          <h3 className="mt-4 font-medium text-navy-900">No enquiries found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters or check back later
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Table Header */}
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-4 text-xs font-medium uppercase text-gray-500">
          <div className="w-32">Type</div>
          <div className="flex-1 min-w-0">Contact</div>
          <div className="w-28 hidden md:block">Source</div>
          <div className="w-24">Status</div>
          <div className="w-28 hidden sm:block">Date</div>
          <div className="w-16" />
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-100">
        {enquiries.map((enquiry) => (
          <div
            key={`${enquiry._table}-${enquiry.id}`}
            className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer"
            onClick={() => onViewEnquiry(enquiry)}
          >
            {/* Type */}
            <div className="w-32">
              <EnquiryTypeBadge type={enquiry.type} />
            </div>

            {/* Contact Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-navy-900 truncate">
                {enquiry.name || enquiry.company || "—"}
              </p>
              <p className="text-xs text-gray-500 truncate">{enquiry.email}</p>
              {enquiry.phone && (
                <p className="text-xs text-gray-400 truncate">{enquiry.phone}</p>
              )}
            </div>

            {/* Source */}
            <div className="w-28 hidden md:block">
              <p className="text-xs text-gray-500 truncate">
                {enquiry.utm_source || enquiry.source_url || "—"}
              </p>
            </div>

            {/* Status */}
            <div className="w-24">
              <EnquiryStatusBadge status={enquiry.status} />
            </div>

            {/* Date */}
            <div className="w-28 hidden sm:block">
              <p className="text-xs text-gray-600">{formatDate(enquiry.created_at)}</p>
              <p className="text-xs text-gray-400">{formatTime(enquiry.created_at)}</p>
            </div>

            {/* Actions */}
            <div className="w-16 flex items-center justify-end gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onViewEnquiry(enquiry)
                }}
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title="View details"
              >
                <Eye className="size-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteEnquiry(enquiry)
                }}
                className="rounded p-1.5 text-gray-400 hover:bg-error-50 hover:text-error-600"
                title="Delete"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
