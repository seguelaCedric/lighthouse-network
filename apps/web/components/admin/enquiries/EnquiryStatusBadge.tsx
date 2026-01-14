"use client"

import { cn } from "@/lib/utils"
import {
  Sparkles,
  Phone,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Send,
  Eye,
  Copy,
  type LucideIcon,
} from "lucide-react"

interface StatusConfig {
  label: string
  bg: string
  text: string
  icon: LucideIcon
}

const statusConfig: Record<string, StatusConfig> = {
  // seo_inquiries statuses
  new: {
    label: "New",
    bg: "bg-blue-100",
    text: "text-blue-700",
    icon: Sparkles,
  },
  contacted: {
    label: "Contacted",
    bg: "bg-gold-100",
    text: "text-gold-700",
    icon: Phone,
  },
  qualified: {
    label: "Qualified",
    bg: "bg-purple-100",
    text: "text-purple-700",
    icon: Star,
  },
  converted: {
    label: "Converted",
    bg: "bg-success-100",
    text: "text-success-700",
    icon: CheckCircle2,
  },
  closed: {
    label: "Closed",
    bg: "bg-gray-100",
    text: "text-gray-500",
    icon: XCircle,
  },

  // salary_guide_leads (derived)
  pending: {
    label: "Pending",
    bg: "bg-gold-100",
    text: "text-gold-700",
    icon: Clock,
  },
  sent: {
    label: "Sent",
    bg: "bg-success-100",
    text: "text-success-700",
    icon: Mail,
  },

  // employer_enquiries statuses
  submitted: {
    label: "Submitted",
    bg: "bg-blue-100",
    text: "text-blue-700",
    icon: Send,
  },
  under_review: {
    label: "Under Review",
    bg: "bg-gold-100",
    text: "text-gold-700",
    icon: Eye,
  },
  verified: {
    label: "Verified",
    bg: "bg-success-100",
    text: "text-success-700",
    icon: CheckCircle2,
  },
  invalid: {
    label: "Invalid",
    bg: "bg-error-100",
    text: "text-error-700",
    icon: XCircle,
  },
  duplicate: {
    label: "Duplicate",
    bg: "bg-gray-100",
    text: "text-gray-500",
    icon: Copy,
  },
}

// Fallback for unknown statuses
const defaultConfig: StatusConfig = {
  label: "Unknown",
  bg: "bg-gray-100",
  text: "text-gray-500",
  icon: Clock,
}

interface EnquiryStatusBadgeProps {
  status: string
  className?: string
  showIcon?: boolean
}

export function EnquiryStatusBadge({
  status,
  className,
  showIcon = true,
}: EnquiryStatusBadgeProps) {
  const config = statusConfig[status] || {
    ...defaultConfig,
    label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " "),
  }
  const Icon = config.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.bg,
        config.text,
        className
      )}
    >
      {showIcon && <Icon className="size-3" />}
      {config.label}
    </span>
  )
}

// Export status options for dropdowns
export function getStatusOptionsForType(
  enquiryType: string
): { value: string; label: string }[] {
  if (enquiryType === "salary_guide") {
    return [
      { value: "pending", label: "Pending" },
      { value: "sent", label: "Sent" },
    ]
  }

  if (enquiryType === "employer_referral") {
    return [
      { value: "submitted", label: "Submitted" },
      { value: "under_review", label: "Under Review" },
      { value: "verified", label: "Verified" },
      { value: "invalid", label: "Invalid" },
      { value: "duplicate", label: "Duplicate" },
    ]
  }

  // Default for seo_inquiries (contact, brief_match, match_funnel)
  return [
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" },
    { value: "converted", label: "Converted" },
    { value: "closed", label: "Closed" },
  ]
}
