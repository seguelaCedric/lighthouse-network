"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Upload,
  UserPlus,
  Phone,
  ChevronRight,
  TrendingUp,
  Eye,
  Star,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { VerificationBadge, type VerificationTier, tierConfig } from "@/components/ui/verification-badge";

export interface VerificationChecks {
  email_verified: boolean;
  cv_uploaded: boolean;
  id_verified: boolean;
  id_pending?: boolean;
  voice_verified: boolean;
  references_verified: number;
  references_total: number;
}

export interface VerificationProgressProps {
  tier: VerificationTier;
  checks: VerificationChecks;
  progress: number;
  nextSteps?: string[];
  candidateId?: string;
  compact?: boolean;
  className?: string;
}

const TIER_ORDER: VerificationTier[] = ["unverified", "basic", "identity", "references", "verified", "premium"];

function getNextTier(current: VerificationTier): VerificationTier | null {
  const currentIndex = TIER_ORDER.indexOf(current);
  if (currentIndex < TIER_ORDER.length - 1) {
    return TIER_ORDER[currentIndex + 1];
  }
  return null;
}

function getNextTierRequirement(current: VerificationTier, checks: VerificationChecks): string {
  switch (current) {
    case "unverified":
      if (!checks.email_verified) return "Verify your email to start";
      if (!checks.cv_uploaded) return "Upload your CV to reach Basic";
      return "Complete basic verification steps";
    case "basic":
      if (!checks.id_verified) return "Upload your ID document to reach Identity tier";
      return "Complete ID verification";
    case "identity":
      if (checks.references_verified < 2) {
        return `Add ${2 - checks.references_verified} more verified references to reach References tier`;
      }
      return "Get your references verified";
    case "references":
      if (!checks.id_verified) return "Verify your ID to reach Verified tier";
      return "Complete ID verification for Verified status";
    case "verified":
      if (!checks.voice_verified) return "Complete voice verification for Premium status";
      return "Schedule a voice verification call";
    case "premium":
      return "You've reached the highest verification level!";
    default:
      return "";
  }
}

const VERIFICATION_BENEFITS = [
  { icon: Eye, text: "Verified candidates get 3x more profile views" },
  { icon: Star, text: "Premium verification = priority matching" },
  { icon: Zap, text: "Stand out to top employers" },
];

export function VerificationProgress({
  tier,
  checks,
  progress,
  nextSteps = [],
  candidateId,
  compact = false,
  className,
}: VerificationProgressProps) {
  const nextTier = getNextTier(tier);
  const nextTierConfig = nextTier ? tierConfig[nextTier] : null;
  const requirement = getNextTierRequirement(tier, checks);

  const checklistItems = [
    {
      id: "email",
      label: "Email verified",
      completed: checks.email_verified,
      action: null,
    },
    {
      id: "cv",
      label: "CV uploaded",
      completed: checks.cv_uploaded,
      action: "/crew/profile/edit",
      actionLabel: "Upload CV",
    },
    {
      id: "id",
      label: "ID document verified",
      completed: checks.id_verified,
      pending: checks.id_pending,
      action: "/crew/verification#id-upload",
      actionLabel: "Upload ID",
    },
    {
      id: "references",
      label: `2 references verified (${checks.references_verified}/2)`,
      completed: checks.references_verified >= 2,
      partial: checks.references_verified > 0 && checks.references_verified < 2,
      action: "/crew/verification#references",
      actionLabel: "Add Reference",
    },
    {
      id: "voice",
      label: "Voice verification",
      completed: checks.voice_verified,
      action: "/crew/verification#voice",
      actionLabel: "Start Call",
    },
  ];

  if (compact) {
    return (
      <div className={cn("rounded-xl border border-gray-200 bg-white p-4", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VerificationBadge tier={tier} size="md" />
            <div>
              <p className="text-sm font-medium text-navy-800">
                Verification: <span className="uppercase">{tier}</span>
              </p>
              {nextTier && (
                <p className="text-xs text-gray-500">
                  Complete {nextSteps.length || "more"} steps for {nextTierConfig?.shortLabel}
                </p>
              )}
            </div>
          </div>
          <Link href="/crew/verification">
            <Button variant="ghost" size="sm" className="text-gold-600 hover:text-gold-700">
              View Details
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white shadow-sm", className)}>
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="font-serif text-lg font-semibold text-navy-800">
          Your Verification Status
        </h2>
      </div>

      <div className="p-6">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    tier === "premium"
                      ? "bg-gradient-to-r from-gold-400 to-gold-500"
                      : tier === "verified"
                      ? "bg-success-500"
                      : tier === "references"
                      ? "bg-gold-500"
                      : tier === "identity"
                      ? "bg-success-400"
                      : tier === "basic"
                      ? "bg-blue-500"
                      : "bg-gray-300"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="min-w-[3rem] text-right text-sm font-semibold text-navy-800">
                {progress}%
              </span>
            </div>
            <VerificationBadge tier={tier} size="md" showLabel />
          </div>
        </div>

        {/* Checklist */}
        <div className="mb-6 space-y-3">
          {checklistItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center justify-between rounded-lg border p-3 transition-colors",
                item.completed
                  ? "border-success-200 bg-success-50"
                  : item.pending
                  ? "border-gold-200 bg-gold-50"
                  : "border-gray-200 bg-gray-50"
              )}
            >
              <div className="flex items-center gap-3">
                {item.completed ? (
                  <CheckCircle2 className="size-5 text-success-600" />
                ) : item.pending ? (
                  <div className="size-5 animate-pulse rounded-full border-2 border-gold-400 bg-gold-100" />
                ) : (
                  <Circle className="size-5 text-gray-400" />
                )}
                <span
                  className={cn(
                    "text-sm font-medium",
                    item.completed ? "text-success-800" : item.pending ? "text-gold-800" : "text-gray-700"
                  )}
                >
                  {item.label}
                  {item.pending && (
                    <span className="ml-2 text-xs text-gold-600">(Pending review)</span>
                  )}
                </span>
              </div>
              {!item.completed && item.action && (
                <Link href={item.action}>
                  <Button variant="ghost" size="sm" className="text-gold-600 hover:text-gold-700">
                    {item.actionLabel}
                    <ChevronRight className="ml-1 size-3" />
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Next Tier Section */}
        {nextTier && nextTierConfig && (
          <div className="mb-6 rounded-lg border border-navy-200 bg-navy-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="size-4 text-navy-600" />
              <span className="text-sm font-semibold text-navy-800">
                NEXT TIER: {nextTierConfig.label}
              </span>
            </div>
            <p className="text-sm text-navy-700">{requirement}</p>
          </div>
        )}

        {/* Benefits */}
        <div className="rounded-lg bg-gradient-to-br from-gold-50 to-gold-100/50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gold-800">WHY VERIFY?</h3>
          <ul className="space-y-2">
            {VERIFICATION_BENEFITS.map((benefit, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-gold-900">
                <benefit.icon className="size-4 text-gold-600" />
                {benefit.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
