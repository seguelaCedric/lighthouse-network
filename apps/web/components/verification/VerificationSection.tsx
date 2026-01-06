"use client";

import * as React from "react";
import Link from "next/link";
import {
  Check,
  Clock,
  Circle,
  ChevronRight,
  Mail,
  FileText,
  Shield,
  Users,
  Mic,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerificationBadge, type VerificationTier, tierConfig } from "@/components/ui/verification-badge";
import { cn } from "@/lib/utils";

export interface VerificationChecklist {
  email_verified: boolean;
  cv_uploaded: boolean;
  id_verified: boolean;
  id_pending: boolean;
  references_verified: number;
  references_total: number;
  voice_verified: boolean;
}

export interface VerificationSectionProps {
  candidateId: string;
  tier: VerificationTier;
  checklist: VerificationChecklist;
  progress: number;
  cvUrl?: string;
  idUrl?: string | null;
  onReviewID?: () => void;
  onVerifyReference?: () => void;
  className?: string;
}

interface CheckItemProps {
  label: string;
  completed: boolean;
  pending?: boolean;
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

function CheckItem({ label, completed, pending, icon, action }: CheckItemProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-2",
        completed ? "text-success-700" : pending ? "text-gold-700" : "text-gray-500"
      )}
    >
      <div className="flex items-center gap-2">
        {completed ? (
          <Check className="size-4 text-success-500" />
        ) : pending ? (
          <Clock className="size-4 text-gold-500" />
        ) : (
          <Circle className="size-4 text-gray-300" />
        )}
        <span className="text-sm">{label}</span>
        {pending && (
          <span className="text-xs text-gold-600">(pending)</span>
        )}
      </div>
      {action && (completed || pending) && (
        action.href || action.onClick ? (
          action.href ? (
            <Link href={action.href}>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-gold-600 hover:text-gold-700">
                {action.label}
                <ChevronRight className="ml-1 size-3" />
              </Button>
            </Link>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-gold-600 hover:text-gold-700"
              onClick={action.onClick}
            >
              {action.label}
              <ChevronRight className="ml-1 size-3" />
            </Button>
          )
        ) : null
      )}
    </div>
  );
}

export function VerificationSection({
  candidateId,
  tier,
  checklist,
  progress,
  cvUrl,
  idUrl,
  onReviewID,
  onVerifyReference,
  className,
}: VerificationSectionProps) {
  const tierInfo = tierConfig[tier];

  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-navy-800">Verification</h2>
          <VerificationBadge tier={tier} size="md" showLabel />
        </div>
        <Link href="/verification">
          <Button variant="ghost" size="sm" className="text-gold-600 hover:text-gold-700">
            Manage
            <ChevronRight className="ml-1 size-4" />
          </Button>
        </Link>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500">Progress</span>
            <span className="text-xs font-semibold text-navy-800">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                tier === "premium"
                  ? "bg-gradient-to-r from-gold-400 to-gold-500"
                  : tier === "verified"
                    ? "bg-success-500"
                    : tier === "references" || tier === "identity"
                      ? "bg-gold-500"
                      : tier === "basic"
                        ? "bg-blue-500"
                        : "bg-gray-300"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Tier Info */}
        <div className="mb-4 rounded-lg bg-gray-50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: tierInfo.color }}
            />
            <span className="text-sm font-medium text-navy-800">
              Tier: {tierInfo.label}
            </span>
          </div>
          <p className="text-xs text-gray-600">{tierInfo.description}</p>
        </div>

        {/* Checklist */}
        <div className="divide-y divide-gray-100">
          <CheckItem
            label="Email verified"
            completed={checklist.email_verified}
            icon={<Mail className="size-4" />}
          />
          <CheckItem
            label="CV uploaded"
            completed={checklist.cv_uploaded}
            icon={<FileText className="size-4" />}
            action={
              cvUrl
                ? { label: "View", onClick: () => window.open(cvUrl, "_blank") }
                : undefined
            }
          />
          <CheckItem
            label="ID document verified"
            completed={checklist.id_verified}
            pending={checklist.id_pending}
            icon={<Shield className="size-4" />}
            action={
              checklist.id_pending
                ? { label: "Review", onClick: onReviewID }
                : idUrl
                  ? { label: "View", onClick: () => window.open(idUrl, "_blank") }
                  : undefined
            }
          />
          <CheckItem
            label={`References: ${checklist.references_verified} verified, ${checklist.references_total - checklist.references_verified} pending`}
            completed={checklist.references_verified >= 2}
            pending={checklist.references_total > checklist.references_verified && checklist.references_verified < 2}
            icon={<Users className="size-4" />}
            action={
              checklist.references_total > checklist.references_verified
                ? { label: "Verify", onClick: onVerifyReference }
                : undefined
            }
          />
          <CheckItem
            label="Voice verification"
            completed={checklist.voice_verified}
            icon={<Mic className="size-4" />}
          />
        </div>

        {/* Upgrade Hint */}
        {tier !== "premium" && (
          <div className="mt-4 rounded-lg border border-gold-200 bg-gold-50 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 size-4 text-gold-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gold-800">
                  {tier === "unverified" && "Complete basic verification to improve visibility"}
                  {tier === "basic" && "Upload ID to reach Identity tier"}
                  {tier === "identity" && "Verify 2 references to reach References tier"}
                  {tier === "references" && "Verify ID to reach Verified tier"}
                  {tier === "verified" && "Complete voice verification for Premium status"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Standalone loading component
export function VerificationSectionSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-6 w-20 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="size-4 animate-pulse rounded-full bg-gray-200" />
              <div className="h-4 flex-1 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
