"use client";

import { useState, useEffect } from "react";
import { X, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

interface UrgencyBannerProps {
  message?: string;
  ctaText?: string;
  ctaLink?: string;
  showJobCount?: boolean;
}

export function UrgencyBanner({
  message = "Caribbean Season Peak Hiring",
  ctaText = "See positions",
  ctaLink = "/job-board",
  showJobCount = true,
}: UrgencyBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if banner was dismissed in this session
    const dismissed = sessionStorage.getItem("urgency-banner-dismissed");
    if (dismissed) {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("urgency-banner-dismissed", "true");
  };

  if (!mounted || !isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 px-4 py-2.5 text-center text-sm font-medium text-navy-900">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 sm:gap-4">
        <Clock className="hidden h-4 w-4 animate-pulse sm:block" />
        <span className="flex items-center gap-2">
          <span>{message}</span>
          {showJobCount && (
            <>
              <span className="hidden sm:inline">|</span>
              <span className="font-bold">47 positions closing soon</span>
            </>
          )}
        </span>
        <Link
          href={ctaLink}
          className="ml-2 inline-flex items-center gap-1 rounded-full bg-navy-900 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-navy-800"
        >
          {ctaText}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-navy-900/60 transition-colors hover:bg-gold-400/50 hover:text-navy-900"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
