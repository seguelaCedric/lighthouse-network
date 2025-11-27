"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Check, X, ChevronDown, ChevronUp, Star, MapPin, Briefcase } from "lucide-react";

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: { label: string; icon: React.ElementType; color: string };
  rightAction?: { label: string; icon: React.ElementType; color: string };
  className?: string;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = { label: "Reject", icon: X, color: "bg-burgundy-500" },
  rightAction = { label: "Shortlist", icon: Check, color: "bg-success-500" },
  className,
}: SwipeableCardProps) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 100;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    setOffset(diff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    if (offset > SWIPE_THRESHOLD && onSwipeRight) {
      onSwipeRight();
    } else if (offset < -SWIPE_THRESHOLD && onSwipeLeft) {
      onSwipeLeft();
    }

    setOffset(0);
  };

  const LeftIcon = leftAction.icon;
  const RightIcon = rightAction.icon;

  const leftOpacity = Math.min(Math.abs(Math.min(offset, 0)) / SWIPE_THRESHOLD, 1);
  const rightOpacity = Math.min(Math.max(offset, 0) / SWIPE_THRESHOLD, 1);

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      {/* Action indicators */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 flex w-20 items-center justify-center transition-opacity",
          leftAction.color
        )}
        style={{ opacity: leftOpacity }}
      >
        <div className="text-center text-white">
          <LeftIcon className="mx-auto size-6" />
          <span className="text-xs font-medium">{leftAction.label}</span>
        </div>
      </div>

      <div
        className={cn(
          "absolute inset-y-0 right-0 flex w-20 items-center justify-center transition-opacity",
          rightAction.color
        )}
        style={{ opacity: rightOpacity }}
      >
        <div className="text-center text-white">
          <RightIcon className="mx-auto size-6" />
          <span className="text-xs font-medium">{rightAction.label}</span>
        </div>
      </div>

      {/* Card content */}
      <div
        ref={cardRef}
        className={cn(
          "relative bg-white transition-transform",
          isDragging ? "" : "transition-all duration-200"
        )}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

// Expandable Mobile Candidate Card
interface MobileCandidateCardProps {
  candidate: {
    id: string;
    name: string;
    photo: string | null;
    position: string;
    experience: string;
    location: string;
    matchPercentage: number;
    isVerified: boolean;
    summary?: string;
    skills?: string[];
  };
  onShortlist?: () => void;
  onReject?: () => void;
  onViewProfile?: () => void;
}

export function MobileCandidateCard({
  candidate,
  onShortlist,
  onReject,
  onViewProfile,
}: MobileCandidateCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const initials = candidate.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <SwipeableCard
      onSwipeRight={onShortlist}
      onSwipeLeft={onReject}
      className="border border-gray-300/60 shadow-[0px_2px_4px_rgba(26,24,22,0.06)]"
    >
      <div className="p-4">
        {/* Main content - always visible */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative shrink-0">
            {candidate.photo ? (
              <img
                src={candidate.photo}
                alt={candidate.name}
                className="size-14 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-14 items-center justify-center rounded-full bg-navy-100 text-lg font-semibold text-navy-600">
                {initials}
              </div>
            )}
            {candidate.isVerified && (
              <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-gold-500 p-0.5">
                <Star className="size-3 fill-white text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="font-semibold text-navy-900 font-cormorant">{candidate.name}</h3>
              <div className="flex items-center gap-1 rounded-full bg-navy-900 px-2 py-0.5">
                <span className="text-xs font-bold text-white">{candidate.matchPercentage}%</span>
              </div>
            </div>
            <p className="text-sm font-medium text-[#7D796F] font-inter">{candidate.position}</p>
            <div className="mt-1 flex items-center gap-3 text-xs text-[#7D796F] font-inter">
              <span className="flex items-center gap-1">
                <Briefcase className="size-3" />
                {candidate.experience}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {candidate.location}
              </span>
            </div>
          </div>
        </div>

        {/* Expand button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600"
        >
          {isExpanded ? (
            <>
              Show Less <ChevronUp className="size-3" />
            </>
          ) : (
            <>
              Show More <ChevronDown className="size-3" />
            </>
          )}
        </button>

        {/* Expanded content */}
        {isExpanded && (
          <div className="mt-3 border-t border-gray-100 pt-3">
            {candidate.summary && (
              <p className="mb-3 text-sm text-[#7D796F] font-inter">{candidate.summary}</p>
            )}

            {candidate.skills && candidate.skills.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {candidate.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={onViewProfile}
              className="w-full rounded-lg bg-navy-900 py-2.5 text-sm font-medium text-white"
            >
              View Full Profile
            </button>
          </div>
        )}
      </div>

      {/* Swipe hint */}
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <X className="size-3" /> Swipe left to reject
        </span>
        <span className="flex items-center gap-1">
          Swipe right to shortlist <Check className="size-3" />
        </span>
      </div>
    </SwipeableCard>
  );
}

// Collapsible Stat Card for Mobile Dashboard
interface CollapsibleStatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
  details?: { label: string; value: string | number }[];
  color?: string;
}

export function CollapsibleStatCard({
  title,
  value,
  icon: Icon,
  trend,
  details,
  color = "bg-navy-100 text-navy-600",
}: CollapsibleStatCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-gray-300/60 bg-white shadow-[0px_2px_4px_rgba(26,24,22,0.06)] transition-shadow duration-250 ease-out hover:shadow-[0px_4px_8px_rgba(26,24,22,0.08)]">
      <button
        onClick={() => details && setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={cn("flex size-10 items-center justify-center rounded-full", color)}>
            <Icon className="size-5" />
          </div>
          <div>
            <p className="text-sm text-[#7D796F] font-inter">{title}</p>
            <p className="text-xl font-bold text-navy-900 font-inter">{value}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                "text-sm font-medium",
                trend.isPositive ? "text-success-600" : "text-burgundy-600"
              )}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </span>
          )}
          {details && (
            <ChevronDown
              className={cn(
                "size-4 text-gray-400 transition-transform",
                isExpanded && "rotate-180"
              )}
            />
          )}
        </div>
      </button>

      {isExpanded && details && (
        <div className="border-t border-gray-100 px-4 py-3">
          <div className="space-y-2">
            {details.map((detail) => (
              <div key={detail.label} className="flex items-center justify-between text-sm font-inter">
                <span className="text-[#7D796F]">{detail.label}</span>
                <span className="font-medium text-navy-900">{detail.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
