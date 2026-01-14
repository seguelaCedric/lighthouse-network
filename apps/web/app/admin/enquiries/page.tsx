"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  EnquiryStats,
  EnquiryFilters,
  EnquiriesTable,
  EnquiryDetailPanel,
  DeleteEnquiryDialog,
} from "@/components/admin/enquiries"
import {
  type UnifiedEnquiry,
  type EnquiryStats as EnquiryStatsType,
  type EnquiryType,
} from "@/lib/validations/enquiries"

export default function AdminEnquiriesPage() {
  // Data state
  const [enquiries, setEnquiries] = useState<UnifiedEnquiry[]>([])
  const [stats, setStats] = useState<EnquiryStatsType | null>(null)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Filter state
  const [selectedType, setSelectedType] = useState<EnquiryType | "all">("all")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Pagination
  const [offset, setOffset] = useState(0)
  const limit = 50

  // Detail panel state
  const [selectedEnquiry, setSelectedEnquiry] = useState<UnifiedEnquiry | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  // Delete dialog state
  const [deleteEnquiry, setDeleteEnquiry] = useState<UnifiedEnquiry | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Export state
  const [isExporting, setIsExporting] = useState(false)

  // Fetch enquiries
  const fetchEnquiries = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      })

      if (selectedType !== "all") {
        params.set("type", selectedType)
      }
      if (selectedStatus) {
        params.set("status", selectedStatus)
      }
      if (searchQuery) {
        params.set("search", searchQuery)
      }
      if (dateFrom) {
        params.set("date_from", dateFrom)
      }
      if (dateTo) {
        params.set("date_to", dateTo)
      }

      const res = await fetch(`/api/admin/enquiries?${params}`)
      const data = await res.json()

      if (res.ok) {
        setEnquiries(data.enquiries || [])
        setTotal(data.total || 0)
        setStats(data.stats || null)
      } else {
        console.error("Error fetching enquiries:", data.error)
      }
    } catch (error) {
      console.error("Error fetching enquiries:", error)
    } finally {
      setIsLoading(false)
    }
  }, [offset, selectedType, selectedStatus, searchQuery, dateFrom, dateTo])

  useEffect(() => {
    fetchEnquiries()
  }, [fetchEnquiries])

  // Reset pagination when filters change
  useEffect(() => {
    setOffset(0)
  }, [selectedType, selectedStatus, searchQuery, dateFrom, dateTo])

  // Handle view enquiry
  const handleViewEnquiry = (enquiry: UnifiedEnquiry) => {
    setSelectedEnquiry(enquiry)
    setIsPanelOpen(true)
  }

  // Handle update enquiry
  const handleUpdateEnquiry = async (
    enquiry: UnifiedEnquiry,
    updates: { status?: string; notes?: string; review_notes?: string }
  ) => {
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _table: enquiry._table,
          ...updates,
        }),
      })

      if (res.ok) {
        // Update local state
        setEnquiries((prev) =>
          prev.map((e) =>
            e.id === enquiry.id && e._table === enquiry._table
              ? {
                  ...e,
                  status: updates.status || e.status,
                  notes: updates.notes || e.notes,
                  metadata: {
                    ...e.metadata,
                    review_notes: updates.review_notes || e.metadata.review_notes,
                  },
                }
              : e
          )
        )
        // Update selected enquiry
        setSelectedEnquiry((prev) =>
          prev
            ? {
                ...prev,
                status: updates.status || prev.status,
                notes: updates.notes || prev.notes,
                metadata: {
                  ...prev.metadata,
                  review_notes: updates.review_notes || prev.metadata.review_notes,
                },
              }
            : null
        )
      } else {
        const data = await res.json()
        alert(data.error || "Failed to update enquiry")
      }
    } catch (error) {
      console.error("Error updating enquiry:", error)
      alert("Failed to update enquiry")
    }
  }

  // Handle delete enquiry
  const handleDeleteClick = (enquiry: UnifiedEnquiry) => {
    setDeleteEnquiry(enquiry)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async (enquiry: UnifiedEnquiry) => {
    try {
      const res = await fetch(
        `/api/admin/enquiries/${enquiry.id}?_table=${enquiry._table}`,
        { method: "DELETE" }
      )

      if (res.ok) {
        // Remove from local state
        setEnquiries((prev) =>
          prev.filter((e) => !(e.id === enquiry.id && e._table === enquiry._table))
        )
        setTotal((prev) => prev - 1)
        // Close panel if viewing deleted enquiry
        if (selectedEnquiry?.id === enquiry.id) {
          setIsPanelOpen(false)
          setSelectedEnquiry(null)
        }
      } else {
        const data = await res.json()
        alert(data.error || "Failed to delete enquiry")
      }
    } catch (error) {
      console.error("Error deleting enquiry:", error)
      alert("Failed to delete enquiry")
    }
  }

  // Handle export
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams()

      if (selectedType !== "all") {
        params.set("type", selectedType)
      }
      if (selectedStatus) {
        params.set("status", selectedStatus)
      }
      if (searchQuery) {
        params.set("search", searchQuery)
      }
      if (dateFrom) {
        params.set("date_from", dateFrom)
      }
      if (dateTo) {
        params.set("date_to", dateTo)
      }

      const res = await fetch(`/api/admin/enquiries/export?${params}`)

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `enquiries-export-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        alert("Failed to export enquiries")
      }
    } catch (error) {
      console.error("Error exporting enquiries:", error)
      alert("Failed to export enquiries")
    } finally {
      setIsExporting(false)
    }
  }

  // Handle clear filters
  const handleClearFilters = () => {
    setSelectedType("all")
    setSelectedStatus("")
    setSearchQuery("")
    setDateFrom("")
    setDateTo("")
  }

  // Pagination
  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(total / limit)
  const hasPrevious = offset > 0
  const hasNext = total > offset + enquiries.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Enquiries</h1>
          <p className="mt-1 text-gray-500">
            View and manage contact forms, brief matches, and leads
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleExport}
            disabled={isExporting || isLoading}
          >
            <Download className={cn("mr-2 size-4", isExporting && "animate-pulse")} />
            Export CSV
          </Button>
          <Button variant="secondary" onClick={fetchEnquiries} disabled={isLoading}>
            <RefreshCw
              className={cn("mr-2 size-4", isLoading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <EnquiryStats stats={stats} isLoading={isLoading} />

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <EnquiryFilters
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Table */}
      <EnquiriesTable
        enquiries={enquiries}
        isLoading={isLoading}
        onViewEnquiry={handleViewEnquiry}
        onDeleteEnquiry={handleDeleteClick}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-sm text-gray-500">
            Showing {offset + 1}-{Math.min(offset + enquiries.length, total)} of{" "}
            {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setOffset(Math.max(0, offset - limit))}
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
              onClick={() => setOffset(offset + limit)}
              disabled={!hasNext}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      <EnquiryDetailPanel
        enquiry={selectedEnquiry}
        isOpen={isPanelOpen}
        onClose={() => {
          setIsPanelOpen(false)
          setSelectedEnquiry(null)
        }}
        onUpdate={handleUpdateEnquiry}
      />

      {/* Delete Dialog */}
      <DeleteEnquiryDialog
        enquiry={deleteEnquiry}
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setDeleteEnquiry(null)
        }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
