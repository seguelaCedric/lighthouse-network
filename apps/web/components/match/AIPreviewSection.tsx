"use client";

import {
  CheckCircle,
  Phone,
  Users,
  Briefcase,
  Globe,
  Shield,
} from "lucide-react";
import { MatchQualityBadge } from "./MatchQualityBadge";

interface AnonymizedCandidate {
  id: string;
  display_name: string;
  avatar_url: string | null;
  position: string;
  experience_years: number;
  languages: string[];
  nationality: string;
  match_score: number;
  why_good_fit: string;
}

interface AIPreviewSectionProps {
  isLoading: boolean;
  candidates: AnonymizedCandidate[];
  error?: string;
}

// Skeleton card for loading state
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-12 w-12 rounded-lg bg-gray-200" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-32" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-3/4" />
      </div>
    </div>
  );
}

// Compact candidate preview card
function CandidatePreviewCard({
  candidate,
  index,
}: {
  candidate: AnonymizedCandidate;
  index: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {candidate.avatar_url ? (
            <div className="relative h-12 w-12 rounded-lg overflow-hidden ring-1 ring-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={candidate.avatar_url}
                alt=""
                className="h-full w-full object-cover blur-[2px] scale-105"
              />
              <div className="absolute inset-0 bg-navy-800/10" />
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 text-white text-lg font-bold ring-1 ring-gold-300">
              {candidate.display_name?.charAt(0) ||
                String.fromCharCode(65 + index)}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
            <Shield className="h-3 w-3 text-white" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-navy-900 text-sm truncate">
            {candidate.display_name ||
              `Candidate ${String.fromCharCode(65 + index)}`}
          </h4>
          <p className="text-gold-600 text-sm font-medium truncate">
            {candidate.position}
          </p>
        </div>

        {/* Match Score */}
        <MatchQualityBadge
          score={Math.round(candidate.match_score * 100)}
          size="sm"
        />
      </div>

      {/* Quick Stats */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mb-3">
        <div className="flex items-center gap-1">
          <Briefcase className="h-3.5 w-3.5 text-gold-500" />
          <span>{candidate.experience_years}+ yrs</span>
        </div>
        <div className="flex items-center gap-1">
          <Globe className="h-3.5 w-3.5 text-gold-500" />
          <span>{candidate.nationality}</span>
        </div>
        {candidate.languages.length > 0 && (
          <span className="text-gray-500">
            {candidate.languages.slice(0, 2).join(", ")}
            {candidate.languages.length > 2 && " +"}
          </span>
        )}
      </div>

      {/* Why Good Fit - truncated */}
      {candidate.why_good_fit && (
        <p className="text-xs text-gray-600 line-clamp-2">
          {candidate.why_good_fit}
        </p>
      )}
    </div>
  );
}

export function AIPreviewSection({
  isLoading,
  candidates,
  error,
}: AIPreviewSectionProps) {
  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Success Message */}
        <div className="bg-gradient-to-r from-success-50 to-success-100 rounded-xl border border-success-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-500">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-success-800">
                Thank you! Your inquiry has been submitted.
              </h3>
              <p className="text-sm text-success-700">
                A consultant will contact you within 24 hours.
              </p>
            </div>
          </div>
        </div>

        {/* Loading Preview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-100">
              <Users className="h-4 w-4 text-gold-600 animate-pulse" />
            </div>
            <p className="font-medium text-navy-900">
              Searching our candidate database...
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  // Error or No Results State (Fallback)
  if (error || candidates.length === 0) {
    return (
      <div className="space-y-6">
        {/* Success Message */}
        <div className="bg-gradient-to-r from-success-50 to-success-100 rounded-xl border border-success-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-500">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-success-800">
                Thank you! Your inquiry has been received.
              </h3>
              <p className="text-sm text-success-700">
                Your requirements are being reviewed by our team.
              </p>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-gradient-to-br from-gold-50 to-gold-100/50 rounded-xl border border-gold-200 p-4">
          <h4 className="font-semibold text-navy-900 mb-2">What happens next?</h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-gold-600 mt-0.5 flex-shrink-0" />
              <span>
                A consultant will review your requirements and identify matching candidates
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-gold-600 mt-0.5 flex-shrink-0" />
              <span>
                You&apos;ll receive a curated shortlist with full CVs and references
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-gold-600 mt-0.5 flex-shrink-0" />
              <span>
                We&apos;ll call to discuss your needs and answer any questions
              </span>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t border-gold-200">
            <a
              href="tel:+33676410299"
              className="inline-flex items-center gap-2 text-gold-600 hover:text-gold-700 font-semibold text-sm"
            >
              <Phone className="h-4 w-4" />
              Need to speak now? +33 6 76 41 02 99
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Success State with Candidates
  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="bg-gradient-to-r from-success-50 to-success-100 rounded-xl border border-success-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-500">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-success-800">
              Brief received. Here&apos;s a preview of potential matches.
            </h3>
            <p className="text-sm text-success-700">
              Your consultant will send a curated shortlist within 24 hours.
            </p>
          </div>
        </div>
      </div>

      {/* Candidate Preview Cards */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-100">
            <Users className="h-4 w-4 text-gold-600" />
          </div>
          <p className="font-medium text-navy-900">
            Preview: {candidates.length} potential match{candidates.length !== 1 ? "es" : ""}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.slice(0, 3).map((candidate, index) => (
            <CandidatePreviewCard
              key={candidate.id}
              candidate={candidate}
              index={index}
            />
          ))}
        </div>

        {candidates.length > 3 && (
          <p className="text-center text-sm text-gray-500 mt-4">
            + {candidates.length - 3} more in your consultant&apos;s shortlist
          </p>
        )}
      </div>

      {/* What's Next */}
      <div className="bg-gradient-to-br from-gold-50 to-gold-100/50 rounded-xl border border-gold-200 p-4">
        <h4 className="font-semibold text-navy-900 mb-2">What happens next?</h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-gold-600 mt-0.5 flex-shrink-0" />
            <span>
              A consultant will review your requirements and these matches
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-gold-600 mt-0.5 flex-shrink-0" />
            <span>
              You&apos;ll receive full CVs, references, and contact details via
              email
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-gold-600 mt-0.5 flex-shrink-0" />
            <span>
              We&apos;ll call to discuss your needs and answer any questions
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
