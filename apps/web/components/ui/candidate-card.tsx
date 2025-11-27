"use client";

import * as React from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { VerificationBadge, type VerificationTier } from "./verification-badge";
import { AvailabilityBadge, type AvailabilityStatus } from "./availability-badge";

export interface CandidateCardProps {
  photo?: string | null;
  name: string;
  position: string;
  location: string;
  availability: AvailabilityStatus;
  verificationTier: VerificationTier;
  matchScore?: number;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

const CandidateCard = React.forwardRef<HTMLDivElement, CandidateCardProps>(
  (
    {
      photo,
      name,
      position,
      location,
      availability,
      verificationTier,
      matchScore,
      onClick,
      selected,
      className,
    },
    ref
  ) => {
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return (
      <div
        ref={ref}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        className={cn(
          "relative rounded-lg border border-gray-300/60 bg-white p-6 shadow-[0px_2px_4px_rgba(26,24,22,0.06)] transition-shadow duration-250 ease-out",
          onClick && "cursor-pointer hover:shadow-[0px_4px_8px_rgba(26,24,22,0.08)]",
          selected && "border-gold-500 ring-2 ring-gold-500/20",
          className
        )}
      >
        {matchScore !== undefined && (
          <div className="absolute right-4 top-4 flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500">Match</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-sm font-semibold",
                matchScore >= 90
                  ? "bg-success-100 text-success-700"
                  : matchScore >= 70
                    ? "bg-gold-100 text-gold-700"
                    : matchScore >= 50
                      ? "bg-warning-100 text-warning-700"
                      : "bg-gray-100 text-gray-600"
              )}
            >
              {matchScore}%
            </span>
          </div>
        )}

        <div className="flex items-start gap-4">
          <div className="relative">
            {photo ? (
              <img
                src={photo}
                alt={name}
                className="size-14 rounded-full object-cover ring-2 ring-gray-100"
              />
            ) : (
              <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-navy-100 to-navy-200 text-lg font-semibold text-navy-600 ring-2 ring-gray-100">
                {initials}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1">
              <VerificationBadge tier={verificationTier} size="sm" />
            </div>
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="truncate text-base font-semibold text-navy-900 font-cormorant">
              {name}
            </h3>
            <p className="truncate text-sm text-[#7D796F] font-inter">{position}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-[#7D796F] font-inter">
            <MapPin className="size-4" />
            <span className="truncate">{location}</span>
          </div>
          <AvailabilityBadge status={availability} />
        </div>
      </div>
    );
  }
);
CandidateCard.displayName = "CandidateCard";

export { CandidateCard };
