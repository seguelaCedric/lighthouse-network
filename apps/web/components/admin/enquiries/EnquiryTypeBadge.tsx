"use client"

import { cn } from "@/lib/utils"
import {
  Mail,
  Users,
  Target,
  FileText,
  Building2,
  type LucideIcon,
} from "lucide-react"
import { type EnquiryType } from "@/lib/validations/enquiries"

interface TypeConfig {
  label: string
  bg: string
  text: string
  icon: LucideIcon
}

const typeConfig: Record<EnquiryType, TypeConfig> = {
  contact: {
    label: "Contact",
    bg: "bg-navy-100",
    text: "text-navy-700",
    icon: Mail,
  },
  brief_match: {
    label: "Brief Match",
    bg: "bg-burgundy-100",
    text: "text-burgundy-700",
    icon: Users,
  },
  match_funnel: {
    label: "Match Funnel",
    bg: "bg-purple-100",
    text: "text-purple-700",
    icon: Target,
  },
  salary_guide: {
    label: "Salary Guide",
    bg: "bg-gold-100",
    text: "text-gold-700",
    icon: FileText,
  },
  employer_referral: {
    label: "Employer Referral",
    bg: "bg-success-100",
    text: "text-success-700",
    icon: Building2,
  },
}

interface EnquiryTypeBadgeProps {
  type: EnquiryType
  className?: string
  showIcon?: boolean
}

export function EnquiryTypeBadge({
  type,
  className,
  showIcon = true,
}: EnquiryTypeBadgeProps) {
  const config = typeConfig[type]
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
