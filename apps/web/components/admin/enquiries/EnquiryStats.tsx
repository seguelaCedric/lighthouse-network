"use client"

import {
  MessageSquare,
  Sparkles,
  CalendarDays,
  Users,
  Target,
  FileText,
  Building2,
  Mail,
} from "lucide-react"
import { type EnquiryStats as EnquiryStatsType } from "@/lib/validations/enquiries"

interface EnquiryStatsProps {
  stats: EnquiryStatsType | null
  isLoading?: boolean
}

export function EnquiryStats({ stats, isLoading }: EnquiryStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-gray-200 bg-white p-5"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-gray-200" />
              <div className="space-y-2">
                <div className="h-3 w-20 rounded bg-gray-200" />
                <div className="h-6 w-12 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const statCards = [
    {
      label: "Total Enquiries",
      value: stats?.total || 0,
      icon: MessageSquare,
      bg: "bg-navy-100",
      iconColor: "text-navy-600",
      helper: "All time",
    },
    {
      label: "New / Pending",
      value: stats?.new_count || 0,
      icon: Sparkles,
      bg: "bg-blue-100",
      iconColor: "text-blue-600",
      helper: "Needs attention",
    },
    {
      label: "This Week",
      value: stats?.this_week || 0,
      icon: CalendarDays,
      bg: "bg-gold-100",
      iconColor: "text-gold-600",
      helper: "Last 7 days",
    },
    {
      label: "Brief Match",
      value: (stats?.by_type?.brief_match || 0) + (stats?.by_type?.match_funnel || 0),
      icon: Target,
      bg: "bg-purple-100",
      iconColor: "text-purple-600",
      helper: "AI matching leads",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-gray-200 bg-white p-5"
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex size-10 items-center justify-center rounded-lg ${stat.bg}`}
            >
              <stat.icon className={`size-5 ${stat.iconColor}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-navy-900">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.helper}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Type breakdown component for expanded view
export function EnquiryTypeBreakdown({
  stats,
}: {
  stats: EnquiryStatsType | null
}) {
  if (!stats) return null

  const types = [
    {
      label: "Contact",
      value: stats.by_type.contact,
      icon: Mail,
      color: "text-navy-600",
    },
    {
      label: "Brief Match",
      value: stats.by_type.brief_match,
      icon: Users,
      color: "text-burgundy-600",
    },
    {
      label: "Match Funnel",
      value: stats.by_type.match_funnel,
      icon: Target,
      color: "text-purple-600",
    },
    {
      label: "Salary Guide",
      value: stats.by_type.salary_guide,
      icon: FileText,
      color: "text-gold-600",
    },
    {
      label: "Employer Referral",
      value: stats.by_type.employer_referral,
      icon: Building2,
      color: "text-success-600",
    },
  ]

  return (
    <div className="flex flex-wrap gap-4">
      {types.map((type) => (
        <div
          key={type.label}
          className="flex items-center gap-2 text-sm text-gray-600"
        >
          <type.icon className={`size-4 ${type.color}`} />
          <span>{type.label}:</span>
          <span className="font-semibold">{type.value}</span>
        </div>
      ))}
    </div>
  )
}
