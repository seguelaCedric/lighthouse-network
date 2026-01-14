"use client"

import { useState, useEffect } from "react"
import {
  X,
  Mail,
  Phone,
  Globe,
  Calendar,
  Building2,
  MapPin,
  Briefcase,
  User,
  Copy,
  Check,
  Save,
  Loader2,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { EnquiryTypeBadge } from "./EnquiryTypeBadge"
import { EnquiryStatusBadge, getStatusOptionsForType } from "./EnquiryStatusBadge"
import { type UnifiedEnquiry } from "@/lib/validations/enquiries"

interface EnquiryDetailPanelProps {
  enquiry: UnifiedEnquiry | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (enquiry: UnifiedEnquiry, updates: { status?: string; notes?: string; review_notes?: string }) => Promise<void>
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Parse message to extract interested candidates section
function parseMessageContent(message: string | null): {
  mainMessage: string | null
  interestedCandidates: string[]
} {
  if (!message) return { mainMessage: null, interestedCandidates: [] }

  const separator = "--- Candidate Interest ---"
  const parts = message.split(separator)

  if (parts.length === 1) {
    return { mainMessage: message, interestedCandidates: [] }
  }

  const mainMessage = parts[0].trim() || null
  const candidateSection = parts[1] || ""

  // Parse candidates from "Interested in:\n  - Name (Position)" format
  const candidates: string[] = []
  const lines = candidateSection.split("\n")
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith("- ")) {
      candidates.push(trimmed.substring(2))
    }
  }

  return { mainMessage, interestedCandidates: candidates }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      title="Copy"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  )
}

export function EnquiryDetailPanel({
  enquiry,
  isOpen,
  onClose,
  onUpdate,
}: EnquiryDetailPanelProps) {
  const [status, setStatus] = useState("")
  const [notes, setNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Reset form when enquiry changes
  useEffect(() => {
    if (enquiry) {
      setStatus(enquiry.status)
      setNotes(enquiry.notes || enquiry.metadata.review_notes || "")
      setHasChanges(false)
    }
  }, [enquiry])

  // Track changes
  useEffect(() => {
    if (enquiry) {
      const originalNotes = enquiry.notes || enquiry.metadata.review_notes || ""
      setHasChanges(status !== enquiry.status || notes !== originalNotes)
    }
  }, [status, notes, enquiry])

  const handleSave = async () => {
    if (!enquiry || !hasChanges) return

    setIsSaving(true)
    try {
      const updates: { status?: string; notes?: string; review_notes?: string } = {}

      if (status !== enquiry.status) {
        updates.status = status
      }

      const originalNotes = enquiry.notes || enquiry.metadata.review_notes || ""
      if (notes !== originalNotes) {
        if (enquiry._table === "employer_enquiries") {
          updates.review_notes = notes
        } else {
          updates.notes = notes
        }
      }

      await onUpdate(enquiry, updates)
      setHasChanges(false)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen || !enquiry) return null

  const statusOptions = getStatusOptionsForType(enquiry.type)
  const canEditStatus = enquiry._table !== "salary_guide_leads"

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <EnquiryTypeBadge type={enquiry.type} />
            <EnquiryStatusBadge status={enquiry.status} />
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              Contact Information
            </h3>
            <div className="space-y-3">
              {enquiry.name && (
                <div className="flex items-center gap-3">
                  <User className="size-4 text-gray-400" />
                  <span className="text-navy-900 font-medium">{enquiry.name}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-gray-400" />
                <a
                  href={`mailto:${enquiry.email}`}
                  className="text-navy-600 hover:underline"
                >
                  {enquiry.email}
                </a>
                <CopyButton text={enquiry.email} />
              </div>
              {enquiry.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="size-4 text-gray-400" />
                  <a
                    href={`tel:${enquiry.phone}`}
                    className="text-navy-600 hover:underline"
                  >
                    {enquiry.phone}
                  </a>
                  <CopyButton text={enquiry.phone} />
                </div>
              )}
              {enquiry.company && (
                <div className="flex items-center gap-3">
                  <Building2 className="size-4 text-gray-400" />
                  <span className="text-navy-900">{enquiry.company}</span>
                </div>
              )}
            </div>
          </section>

          {/* Message & Interested Candidates */}
          {enquiry.message && (() => {
            const { mainMessage, interestedCandidates } = parseMessageContent(enquiry.message)
            return (
              <>
                {/* Interested Candidates - Show prominently for match funnel */}
                {interestedCandidates.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                      Interested In ({interestedCandidates.length} Candidates)
                    </h3>
                    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                      <div className="space-y-2">
                        {interestedCandidates.map((candidate, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Users className="size-4 text-purple-600" />
                            <span className="text-sm text-purple-900 font-medium">
                              {candidate}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                {/* Main Message/Requirements */}
                {mainMessage && (
                  <section>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                      {enquiry.type === "match_funnel" || enquiry.type === "brief_match"
                        ? "Requirements"
                        : "Message"}
                    </h3>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {mainMessage}
                      </p>
                    </div>
                  </section>
                )}
              </>
            )
          })()}

          {/* Type-specific Details */}
          {(enquiry.metadata.position_needed ||
            enquiry.metadata.location ||
            enquiry.metadata.referrer_name ||
            enquiry.metadata.company_name) && (
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Details
              </h3>
              <div className="space-y-3">
                {enquiry.metadata.position_needed && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="size-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Position: <span className="text-navy-900">{enquiry.metadata.position_needed}</span>
                    </span>
                  </div>
                )}
                {enquiry.metadata.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="size-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Location: <span className="text-navy-900">{enquiry.metadata.location}</span>
                    </span>
                  </div>
                )}
                {enquiry.metadata.company_name && enquiry.type === "employer_referral" && (
                  <div className="flex items-center gap-3">
                    <Building2 className="size-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Company: <span className="text-navy-900">{enquiry.metadata.company_name}</span>
                    </span>
                  </div>
                )}
                {enquiry.metadata.referrer_name && (
                  <div className="flex items-center gap-3">
                    <User className="size-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Referrer: <span className="text-navy-900">{enquiry.metadata.referrer_name}</span>
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Source Info */}
          {(enquiry.source_url || enquiry.utm_source) && (
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Source
              </h3>
              <div className="space-y-2">
                {enquiry.source_url && (
                  <div className="flex items-center gap-3">
                    <Globe className="size-4 text-gray-400" />
                    <span className="text-sm text-gray-600 truncate">
                      {enquiry.source_url}
                    </span>
                  </div>
                )}
                {enquiry.utm_source && (
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      Source: {enquiry.utm_source}
                    </span>
                    {enquiry.utm_medium && (
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        Medium: {enquiry.utm_medium}
                      </span>
                    )}
                    {enquiry.utm_campaign && (
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        Campaign: {enquiry.utm_campaign}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Status & Notes Section */}
          <section className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              Status & Notes
            </h3>

            {/* Status Select */}
            {canEditStatus && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notes Textarea */}
            {canEditStatus && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Internal Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Add internal notes..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500 resize-none"
                />
              </div>
            )}

            {/* Save Button */}
            {canEditStatus && (
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 size-4" />
                    Save Changes
                  </>
                )}
              </Button>
            )}

            {!canEditStatus && (
              <p className="text-sm text-gray-500 italic">
                Salary guide leads cannot be edited.
              </p>
            )}
          </section>

          {/* Timeline */}
          <section className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              Timeline
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Calendar className="size-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Created: <span className="text-navy-900">{formatDateTime(enquiry.created_at)}</span>
                </span>
              </div>
              {enquiry.updated_at && enquiry.updated_at !== enquiry.created_at && (
                <div className="flex items-center gap-3">
                  <Calendar className="size-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Updated: <span className="text-navy-900">{formatDateTime(enquiry.updated_at)}</span>
                  </span>
                </div>
              )}
              {enquiry.metadata.reviewed_at && (
                <div className="flex items-center gap-3">
                  <Calendar className="size-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Reviewed: <span className="text-navy-900">{formatDateTime(enquiry.metadata.reviewed_at as string)}</span>
                  </span>
                </div>
              )}
              {enquiry.metadata.sent_at && (
                <div className="flex items-center gap-3">
                  <Mail className="size-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Email sent: <span className="text-navy-900">{formatDateTime(enquiry.metadata.sent_at as string)}</span>
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
