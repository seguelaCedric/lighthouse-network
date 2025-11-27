"use client";

import * as React from "react";
import { Shield, ShieldCheck, Crown, CheckCircle, Star, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type VerificationTier = "unverified" | "basic" | "identity" | "references" | "verified" | "premium";

export interface VerificationBadgeProps {
  tier: VerificationTier;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const tierConfig: Record<
  VerificationTier,
  {
    label: string;
    shortLabel: string;
    icon: React.ElementType;
    iconClassName: string;
    badgeClassName: string;
    labelClassName: string;
  }
> = {
  unverified: {
    label: "Unverified",
    shortLabel: "Unverified",
    icon: Circle,
    iconClassName: "text-gray-400",
    badgeClassName: "bg-white border border-gray-300 border-dashed",
    labelClassName: "text-gray-500",
  },
  basic: {
    label: "Basic Verified",
    shortLabel: "Basic",
    icon: CheckCircle,
    iconClassName: "text-blue-600",
    badgeClassName: "bg-blue-50 border border-blue-200",
    labelClassName: "text-blue-700",
  },
  identity: {
    label: "Identity Verified",
    shortLabel: "Identity",
    icon: Shield,
    iconClassName: "text-success-600",
    badgeClassName: "bg-success-50 border border-success-200",
    labelClassName: "text-success-700",
  },
  references: {
    label: "References Verified",
    shortLabel: "References",
    icon: Star,
    iconClassName: "text-gold-600",
    badgeClassName: "bg-gold-50 border border-gold-200",
    labelClassName: "text-gold-700",
  },
  verified: {
    label: "Fully Verified",
    shortLabel: "Verified",
    icon: ShieldCheck,
    iconClassName: "text-success-700",
    badgeClassName: "bg-success-100 border border-success-300",
    labelClassName: "text-success-800",
  },
  premium: {
    label: "Premium Verified",
    shortLabel: "Premium",
    icon: Crown,
    iconClassName: "text-gold-800",
    badgeClassName: "bg-gradient-to-br from-gold-200 to-gold-300 border border-gold-400 shadow-sm shadow-gold-200/50",
    labelClassName: "text-gold-800 font-semibold",
  },
};

const sizeConfig = {
  sm: {
    badge: "size-5",
    icon: "size-3",
    text: "text-xs",
    padding: "px-2 py-0.5",
    gap: "gap-1",
  },
  md: {
    badge: "size-6",
    icon: "size-4",
    text: "text-sm",
    padding: "px-2.5 py-1",
    gap: "gap-1.5",
  },
  lg: {
    badge: "size-10",
    icon: "size-6",
    text: "text-base",
    padding: "px-4 py-2",
    gap: "gap-2",
  },
};

const VerificationBadge = React.forwardRef<HTMLDivElement, VerificationBadgeProps>(
  ({ tier, size = "md", showLabel = false, className }, ref) => {
    const config = tierConfig[tier];
    const sizes = sizeConfig[size];
    const Icon = config.icon;

    if (showLabel) {
      return (
        <div
          ref={ref}
          className={cn(
            "inline-flex items-center rounded-full",
            sizes.padding,
            sizes.text,
            sizes.gap,
            "font-medium",
            config.badgeClassName,
            className
          )}
        >
          <Icon className={cn(sizes.icon, config.iconClassName)} />
          <span className={config.labelClassName}>
            {size === "sm" ? config.shortLabel : config.label}
          </span>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full",
          sizes.badge,
          config.badgeClassName,
          className
        )}
        title={config.label}
      >
        <Icon className={cn(sizes.icon, config.iconClassName)} />
      </div>
    );
  }
);
VerificationBadge.displayName = "VerificationBadge";

export { VerificationBadge, tierConfig };
