"use client";

import Link from "next/link";
import { Clock, CheckCircle2, Briefcase, User, ArrowRight, MapPin } from "lucide-react";
import { analytics } from "@/lib/analytics/seo-tracking";

interface AnswerCapsuleProps {
  /** The question being answered (optional, shown as H2 for SEO) */
  question?: string;
  /** The direct answer - 2-3 sentences, under 100 words, NO LINKS */
  answer: string;
  /** 3-5 key facts as bullet points for quick scanning */
  keyFacts?: string[];
  /** Visible freshness signal - "Last updated" date */
  lastUpdated?: Date | string;
  /** Target audience for styling/icon */
  audienceType?: "employer" | "candidate" | "both";
  /** Optional position name for context */
  position?: string;
  /** Optional location for context */
  location?: string;
}

/**
 * AnswerCapsule Component
 *
 * Critical for AI/LLM search optimization based on SE Ranking research:
 * - 90%+ of ChatGPT-cited pages have answer capsules
 * - Must be link-free for easy LLM extraction
 * - Must appear above the fold
 * - Must be quotable and self-contained
 *
 * Design principles:
 * 1. Direct answer in first 100 words
 * 2. Simple, declarative sentences
 * 3. NO internal or external links in capsule
 * 4. Self-contained and quotable
 * 5. Visible freshness date
 */
export function AnswerCapsule({
  question,
  answer,
  keyFacts = [],
  lastUpdated,
  audienceType = "both",
  position,
  location,
}: AnswerCapsuleProps) {
  // Format the last updated date
  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  // ISO format for structured data
  const isoDate = lastUpdated
    ? new Date(lastUpdated).toISOString().split("T")[0]
    : null;

  // Audience-specific styling
  const audienceConfig = {
    employer: {
      icon: Briefcase,
      label: "For Employers",
      borderColor: "border-l-gold-500",
      bgColor: "bg-gold-50",
      iconColor: "text-gold-600",
    },
    candidate: {
      icon: User,
      label: "For Candidates",
      borderColor: "border-l-navy-500",
      bgColor: "bg-navy-50",
      iconColor: "text-navy-600",
    },
    both: {
      icon: CheckCircle2,
      label: "Quick Answer",
      borderColor: "border-l-burgundy-500",
      bgColor: "bg-gray-50",
      iconColor: "text-burgundy-600",
    },
  };

  const config = audienceConfig[audienceType];
  const Icon = config.icon;

  return (
    <div
      className={`rounded-lg border border-gray-200 ${config.bgColor} border-l-4 ${config.borderColor} p-6 shadow-sm`}
      // Semantic markup for structured data extraction
      itemScope
      itemType="https://schema.org/Answer"
    >
      {/* Header with audience indicator and freshness date */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
          <span className="text-sm font-medium text-gray-700">
            {config.label}
          </span>
        </div>

        {formattedDate && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <time dateTime={isoDate || undefined}>
              Last updated: {formattedDate}
            </time>
          </div>
        )}
      </div>

      {/* Question as H2 for SEO (if provided) */}
      {question && (
        <h2
          className="mb-3 font-serif text-xl font-semibold text-navy-900"
          itemProp="name"
        >
          {question}
        </h2>
      )}

      {/* Answer block - THE CRITICAL PART */}
      {/* This is the quotable, self-contained answer that LLMs will extract */}
      {/* IMPORTANT: NO LINKS ALLOWED IN THIS TEXT */}
      <div
        className="text-base leading-relaxed text-gray-800"
        itemProp="text"
      >
        <p className="font-medium">{answer}</p>
      </div>

      {/* Key Facts - bullet points for scanning */}
      {keyFacts.length > 0 && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
            Key Facts
          </h3>
          <ul className="space-y-1.5">
            {keyFacts.map((fact, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-gray-700"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Context line (position/location if provided) */}
      {(position || location) && (
        <div className="mt-4 text-sm text-gray-500">
          {position && location
            ? `About hiring a ${position} in ${location}`
            : position
              ? `About hiring a ${position}`
              : `About hiring in ${location}`}
        </div>
      )}
    </div>
  );
}

/**
 * Generate structured data for the answer capsule
 * Use this in the page's structured data component
 */
export function getAnswerCapsuleSchema(props: {
  question: string;
  answer: string;
  dateModified?: string;
}) {
  return {
    "@type": "Question",
    name: props.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: props.answer,
      dateModified: props.dateModified,
    },
  };
}

// =============================================================================
// ANSWER CAPSULE WITH INTERNAL LINKING
// =============================================================================
// This wrapper component combines the link-free answer capsule with strategic
// internal links to landing pages. The capsule itself has NO links (for AI),
// but the section BELOW the capsule pushes SEO juice to landing pages.

interface RelatedLandingPage {
  url: string; // original_url_path like "hire-a-butler-australia/new-south-wale/sydney-2"
  title: string; // "Hire a Butler in Sydney"
  position?: string;
  location?: string;
}

interface AnswerCapsuleWithLinksProps extends AnswerCapsuleProps {
  /** Related landing pages to link to (max 3-4 for best UX) */
  relatedPages?: RelatedLandingPage[];
  /** CTA text for the main action */
  ctaText?: string;
  /** CTA link (usually to the primary landing page) */
  ctaLink?: string;
  /** Show position hub link */
  positionHubLink?: string;
  /** Show location hub link */
  locationHubLink?: string;
}

/**
 * AnswerCapsuleWithLinks Component
 *
 * Strategic internal linking for SEO while keeping the answer capsule link-free:
 *
 * Structure:
 * ┌─────────────────────────────────────────────────────┐
 * │  ANSWER CAPSULE (NO LINKS - for AI extraction)      │
 * │  • Question as H2                                   │
 * │  • Direct answer (quotable)                         │
 * │  • Key facts                                        │
 * └─────────────────────────────────────────────────────┘
 * ┌─────────────────────────────────────────────────────┐
 * │  INTERNAL LINKS (SEO juice to landing pages)        │
 * │  • Related position pages                           │
 * │  • Hub page links                                   │
 * │  • Primary CTA                                      │
 * └─────────────────────────────────────────────────────┘
 */
export function AnswerCapsuleWithLinks({
  // Answer capsule props
  question,
  answer,
  keyFacts,
  lastUpdated,
  audienceType,
  position,
  location,
  // Internal linking props
  relatedPages = [],
  ctaText,
  ctaLink,
  positionHubLink,
  locationHubLink,
}: AnswerCapsuleWithLinksProps) {
  const hasLinks = relatedPages.length > 0 || ctaLink || positionHubLink || locationHubLink;

  return (
    <div className="space-y-4">
      {/* The link-free answer capsule for AI extraction */}
      <AnswerCapsule
        question={question}
        answer={answer}
        keyFacts={keyFacts}
        lastUpdated={lastUpdated}
        audienceType={audienceType}
        position={position}
        location={location}
      />

      {/* Internal links section - BELOW the capsule */}
      {hasLinks && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          {/* Related landing pages */}
          {relatedPages.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                Related Hiring Pages
              </h3>
              <div className="flex flex-wrap gap-2">
                {relatedPages.slice(0, 4).map((page, index) => (
                  <Link
                    key={index}
                    href={`/${page.url}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-navy-700 transition-colors hover:border-gold-300 hover:bg-gold-50 hover:text-gold-700"
                    onClick={() => {
                      analytics.trackInternalLinkClick(
                        "answer_capsule_related",
                        typeof window !== "undefined" ? window.location.href : "",
                        `/${page.url}`,
                        page.title
                      );
                    }}
                  >
                    {page.position && <Briefcase className="h-3.5 w-3.5" />}
                    {page.location && !page.position && <MapPin className="h-3.5 w-3.5" />}
                    <span>{page.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Hub links and CTA */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Position hub link */}
            {positionHubLink && position && (
              <Link
                href={positionHubLink}
                className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gold-600"
                onClick={() => {
                  analytics.trackInternalLinkClick(
                    "answer_capsule_hub",
                    typeof window !== "undefined" ? window.location.href : "",
                    positionHubLink,
                    `All ${position} positions`
                  );
                }}
              >
                <Briefcase className="h-4 w-4" />
                <span>All {position} positions</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}

            {/* Location hub link */}
            {locationHubLink && location && (
              <Link
                href={locationHubLink}
                className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gold-600"
                onClick={() => {
                  analytics.trackInternalLinkClick(
                    "answer_capsule_hub",
                    typeof window !== "undefined" ? window.location.href : "",
                    locationHubLink,
                    `All positions in ${location}`
                  );
                }}
              >
                <MapPin className="h-4 w-4" />
                <span>All positions in {location}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}

            {/* Primary CTA */}
            {ctaLink && ctaText && (
              <Link
                href={ctaLink}
                className="ml-auto inline-flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-600"
                onClick={() => {
                  analytics.trackInternalLinkClick(
                    "answer_capsule_cta",
                    typeof window !== "undefined" ? window.location.href : "",
                    ctaLink,
                    ctaText
                  );
                }}
              >
                {ctaText}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
