"use client";

import { useState } from "react";
import {
  CheckCircle,
  Phone,
  Users,
  Briefcase,
  Globe,
  Shield,
  Languages,
  Sparkles,
  Network,
  Award,
  Heart,
  Loader2,
  FileCheck,
  UserCheck,
  Search,
  MessageCircle,
} from "lucide-react";
import { MatchQualityBadge } from "./MatchQualityBadge";

interface AnonymizedCandidate {
  id: string;
  display_name: string;
  avatar_url: string | null;
  position: string;
  experience_years: number | null; // null = "Experience on file" display
  languages: string[];
  nationality: string;
  match_score: number;
  why_good_fit: string;
  rich_bio: string;
  career_highlights: string[];
  key_strengths: string[];
  qualifications: string[];
  experience_summary: string;
  availability: string;
}

interface AIPreviewSectionProps {
  isLoading: boolean;
  candidates: AnonymizedCandidate[];
  error?: string;
  totalFound?: number;
  searchQuality?: string;
  inquiryId?: string;
}

// Database size constant (can be fetched from API in future)
const DATABASE_SIZE = "45,000";

// Enhanced loading spinner with sparkles
function LoadingSpinner() {
  return (
    <div className="relative h-16 w-16 mx-auto">
      <div className="absolute inset-0 rounded-full bg-gold-500/10 animate-pulse" />
      <div className="absolute inset-2 rounded-full border-4 border-gray-100" />
      <div className="absolute inset-2 animate-spin rounded-full border-4 border-transparent border-t-gold-500 border-r-gold-300" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Sparkles className="h-7 w-7 text-gold-500" />
      </div>
    </div>
  );
}

// Skeleton card for loading state
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="flex gap-4">
        <div className="h-16 w-16 rounded-xl bg-gray-200 flex-shrink-0" />
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
          <div className="flex gap-4 mb-3">
            <div className="h-3 bg-gray-200 rounded w-20" />
            <div className="h-3 bg-gray-200 rounded w-16" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Rich candidate card - full detail like original match page
function RichCandidateCard({
  candidate,
  index,
  isInterested,
  isSubmitting,
  onInterest,
}: {
  candidate: AnonymizedCandidate;
  index: number;
  isInterested: boolean;
  isSubmitting: boolean;
  onInterest: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Card Header with Avatar and Basic Info */}
      <div className="p-6">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {candidate.avatar_url ? (
              <div className="relative h-16 w-16 rounded-xl overflow-hidden ring-2 ring-gold-500/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={candidate.avatar_url}
                  alt=""
                  className="h-full w-full object-cover blur-[2px] scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-navy-800/20 to-navy-900/30" />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-white text-xl font-bold ring-2 ring-gold-500/30">
                {candidate.display_name?.charAt(0) ||
                  String.fromCharCode(65 + index)}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 ring-2 ring-white shadow-lg">
              <Shield className="h-3 w-3 text-white" />
            </div>
          </div>

          {/* Basic Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-navy-900 truncate text-lg">
                  {candidate.display_name ||
                    `Candidate ${String.fromCharCode(65 + index)}`}
                </h4>
                <p className="text-gold-600 font-medium">
                  {candidate.position}
                </p>
              </div>
              <MatchQualityBadge
                score={Math.round(candidate.match_score * 100)}
                size="md"
              />
            </div>

            {/* Key Metrics */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-gold-600" />
                <span>
                  {candidate.experience_years !== null
                    ? `${candidate.experience_years}+ years experience`
                    : "Experience on file"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-gold-600" />
                <span>{candidate.nationality}</span>
              </div>
              {candidate.languages && candidate.languages.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Languages className="h-4 w-4 text-gold-600" />
                  <span>{candidate.languages.slice(0, 3).join(", ")}</span>
                  {candidate.languages.length > 3 && (
                    <span className="text-gray-400">
                      +{candidate.languages.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Why Good Fit Section - First */}
      {candidate.why_good_fit && (
        <div className="px-6 pb-4">
          <div className="bg-gradient-to-r from-gold-50 to-gold-100/50 rounded-lg p-4 border border-gold-200">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-gold-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-gold-700 uppercase tracking-wide mb-1">
                  Why This Candidate Might Be a Good Fit
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {candidate.why_good_fit}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Anonymized Bio */}
      {candidate.rich_bio && (
        <div className="px-6 pb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Profile
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            {candidate.rich_bio}
          </p>
        </div>
      )}

      {/* Career Highlights */}
      {candidate.career_highlights && candidate.career_highlights.length > 0 && (
        <div className="px-6 pb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Career Highlights
          </p>
          <ul className="space-y-1.5">
            {candidate.career_highlights.slice(0, 3).map((highlight, i) => (
              <li
                key={i}
                className="text-sm text-gray-600 flex items-start gap-2"
              >
                <Award className="h-4 w-4 text-gold-500 mt-0.5 flex-shrink-0" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Key Strengths & Qualifications */}
      {((candidate.key_strengths && candidate.key_strengths.length > 0) ||
        (candidate.qualifications && candidate.qualifications.length > 0)) && (
        <div className="px-6 pb-6 border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Key Competencies
          </p>
          <div className="flex flex-wrap gap-2">
            {[...(candidate.key_strengths || []), ...(candidate.qualifications || [])]
              .slice(0, 6)
              .map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full bg-navy-50 px-3 py-1 text-xs font-medium text-navy-700 border border-navy-200"
                >
                  {item}
                </span>
              ))}
            {((candidate.key_strengths?.length || 0) +
              (candidate.qualifications?.length || 0)) > 6 && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                +
                {(candidate.key_strengths?.length || 0) +
                  (candidate.qualifications?.length || 0) -
                  6}{" "}
                more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Interest CTA Button */}
      <div className="px-6 pb-6">
        <button
          onClick={onInterest}
          disabled={isInterested || isSubmitting}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
            isInterested
              ? "bg-success-100 text-success-700 border border-success-300 cursor-default"
              : isSubmitting
                ? "bg-gray-100 text-gray-500 cursor-wait"
                : "bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 shadow-md hover:shadow-lg"
          }`}
        >
          {isInterested ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Interest Noted
            </>
          ) : isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Heart className="h-4 w-4" />
              I&apos;m Interested in This Candidate
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Agency Value Proposition Section - What makes us different
function AgencyValueSection() {
  return (
    <div className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 rounded-xl p-6 text-white">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold-500/20">
          <UserCheck className="h-6 w-6 text-gold-400" />
        </div>
        <div>
          <h4 className="font-bold text-lg">Why Work With a Specialist Agency?</h4>
          <p className="text-sm text-gray-400">
            What you see above is just an AI-powered preview
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-5 w-5 text-gold-400" />
            <h5 className="font-semibold">Personalised Research</h5>
          </div>
          <p className="text-sm text-gray-300">
            Your consultant searches beyond algorithms, tapping into private networks,
            industry contacts, and candidates not actively looking but perfect for your role.
          </p>
        </div>

        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="h-5 w-5 text-gold-400" />
            <h5 className="font-semibold">Verified References</h5>
          </div>
          <p className="text-sm text-gray-300">
            Every candidate we recommend has been reference-checked. We speak directly
            with previous employers to verify skills, character, and work history.
          </p>
        </div>

        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="h-5 w-5 text-gold-400" />
            <h5 className="font-semibold">Understanding Your Needs</h5>
          </div>
          <p className="text-sm text-gray-300">
            We take time to understand your household, yacht culture, and what makes
            a &quot;perfect fit&quot;, beyond just qualifications on paper.
          </p>
        </div>

        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Network className="h-5 w-5 text-gold-400" />
            <h5 className="font-semibold">Industry Expertise</h5>
          </div>
          <p className="text-sm text-gray-300">
            1,500+ successful placements across yachts and private households. We know
            what works and can advise on salary, structure, and realistic expectations.
          </p>
        </div>
      </div>
    </div>
  );
}

// What's Next Section - Enhanced
function WhatsNextSection() {
  return (
    <div className="bg-gradient-to-br from-gold-50 to-gold-100/50 rounded-xl border border-gold-200 p-5">
      <h4 className="font-semibold text-navy-900 mb-4">What Happens Next?</h4>

      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500 text-white font-bold text-sm flex-shrink-0">
            1
          </div>
          <div>
            <p className="font-medium text-navy-900">Consultant Reviews Your Brief</p>
            <p className="text-sm text-gray-600">
              A dedicated consultant will analyse your requirements and these initial matches
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500 text-white font-bold text-sm flex-shrink-0">
            2
          </div>
          <div>
            <p className="font-medium text-navy-900">Personalised Shortlist Delivered</p>
            <p className="text-sm text-gray-600">
              Within 24 hours, receive full CVs, verified references, and detailed profiles via email
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500 text-white font-bold text-sm flex-shrink-0">
            3
          </div>
          <div>
            <p className="font-medium text-navy-900">Discovery Call</p>
            <p className="text-sm text-gray-600">
              We&apos;ll call to discuss your needs in depth, answer questions, and refine the search
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-gold-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-navy-900">96% placement success rate</span> • No placement, no fee
        </p>
        <a
          href="tel:+33652928360"
          className="inline-flex items-center gap-2 text-gold-600 hover:text-gold-700 font-semibold text-sm"
        >
          <Phone className="h-4 w-4" />
          +33 6 52 92 83 60
        </a>
      </div>
    </div>
  );
}

export function AIPreviewSection({
  isLoading,
  candidates,
  error,
  totalFound = 0,
  searchQuality,
  inquiryId,
}: AIPreviewSectionProps) {
  // Track which candidates user is interested in
  const [interestedCandidates, setInterestedCandidates] = useState<Set<string>>(new Set());
  const [submittingInterest, setSubmittingInterest] = useState<string | null>(null);

  // Handle interest button click
  const handleInterest = async (candidate: AnonymizedCandidate) => {
    if (!inquiryId || interestedCandidates.has(candidate.id)) return;

    setSubmittingInterest(candidate.id);

    try {
      const response = await fetch("/api/inquiries/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: inquiryId,
          interested_candidates: [
            {
              display_name: candidate.display_name,
              position: candidate.position,
            },
          ],
        }),
      });

      if (response.ok) {
        setInterestedCandidates((prev) => new Set([...prev, candidate.id]));
      }
    } catch (err) {
      console.error("Failed to save interest:", err);
    } finally {
      setSubmittingInterest(null);
    }
  };

  // Loading State - Clear messaging not to leave the page
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

        {/* Loading Preview - Clear "don't leave" messaging */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <LoadingSpinner />
          <h3 className="mt-4 text-lg font-semibold text-navy-900">
            Searching our candidate database...
          </h3>
          <p className="mt-2 text-gray-600">
            Please wait a few seconds while we find matching candidates.
          </p>
          <p className="mt-1 text-sm text-gold-600 font-medium">
            Don&apos;t leave this page - your preview is loading!
          </p>

          {/* Skeleton Cards */}
          <div className="mt-6 space-y-4 text-left">
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

        {/* Database Scale */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-100">
              <Users className="h-5 w-5 text-gold-600" />
            </div>
            <div>
              <p className="font-semibold text-navy-900">
                {DATABASE_SIZE}+ professionals in our database
              </p>
              <p className="text-sm text-gray-600">
                Our consultants will find the perfect match for your requirements
              </p>
            </div>
          </div>
        </div>

        {/* Agency Value Proposition */}
        <AgencyValueSection />

        {/* What's Next */}
        <WhatsNextSection />
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
              Brief received! Here&apos;s a preview of potential matches.
            </h3>
            <p className="text-sm text-success-700">
              Your consultant will send a curated shortlist within 24 hours.
            </p>
          </div>
        </div>
      </div>

      {/* Database Scale Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold-500/20">
              <Sparkles className="h-6 w-6 text-gold-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}{" "}
                <span className="font-normal text-lg text-gray-300">
                  match your requirements
                </span>
              </p>
              <p className="text-sm text-gray-400">
                + {DATABASE_SIZE} more professionals in our database
              </p>
            </div>
          </div>
          {searchQuality === "excellent" && (
            <div className="hidden sm:flex items-center gap-1.5 bg-success-500/20 text-success-300 px-3 py-1.5 rounded-full text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              Excellent Match
            </div>
          )}
        </div>
      </div>

      {/* Candidate Cards - Rich detail */}
      <div className="space-y-4">
        {candidates.map((candidate, index) => (
          <RichCandidateCard
            key={candidate.id}
            candidate={candidate}
            index={index}
            isInterested={interestedCandidates.has(candidate.id)}
            isSubmitting={submittingInterest === candidate.id}
            onInterest={() => handleInterest(candidate)}
          />
        ))}
      </div>

      {/* Agency Value Proposition - Why work with us */}
      <AgencyValueSection />

      {/* What's Next */}
      <WhatsNextSection />
    </div>
  );
}
