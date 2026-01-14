"use client"

import { useState } from "react"
import { AlertTriangle, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type UnifiedEnquiry } from "@/lib/validations/enquiries"

interface DeleteEnquiryDialogProps {
  enquiry: UnifiedEnquiry | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (enquiry: UnifiedEnquiry) => Promise<void>
}

export function DeleteEnquiryDialog({
  enquiry,
  isOpen,
  onClose,
  onConfirm,
}: DeleteEnquiryDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  if (!isOpen || !enquiry) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onConfirm(enquiry)
      onClose()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="size-5" />
        </button>

        {/* Icon */}
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-error-100">
          <AlertTriangle className="size-6 text-error-600" />
        </div>

        {/* Title */}
        <h3 className="mt-4 text-center text-lg font-semibold text-navy-900">
          Delete Enquiry
        </h3>

        {/* Description */}
        <p className="mt-2 text-center text-sm text-gray-600">
          Are you sure you want to delete this enquiry? This action cannot be
          undone.
        </p>

        {/* Enquiry info */}
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-sm font-medium text-navy-900">
            {enquiry.name || enquiry.company || "No name"}
          </p>
          <p className="text-xs text-gray-500">{enquiry.email}</p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1 bg-error-600 hover:bg-error-700"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </div>
      </div>
    </>
  )
}
