"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Briefcase, BookOpen, FileText } from "lucide-react";
import { analytics } from "@/lib/analytics/seo-tracking";

interface RelatedPage {
  id: string;
  original_url_path: string;
  position: string;
  position_slug: string;
  city: string | null;
  state: string | null;
  country: string;
  hero_headline: string;
}

interface ContentLink {
  id: string;
  title: string;
  url: string;
  description: string | null;
  content_type: string;
  landing_page_url: string | null;
  blog_post_id: string | null;
}

interface InternalLinkingProps {
  currentPage: {
    id: string;
    position: string;
    position_slug: string;
    city: string | null;
    state: string | null;
    country: string;
    country_slug: string;
  };
  relatedPositions?: RelatedPage[];
  relatedLocations?: RelatedPage[];
  contentLinks?: ContentLink[];
}

export function InternalLinking({
  currentPage,
  relatedPositions = [],
  relatedLocations = [],
  contentLinks = [],
}: InternalLinkingProps) {
  // Filter content links by audience type (employer vs candidate)
  const employerContent = contentLinks.filter(
    (link) =>
      link.content_type === "hiring_guide" ||
      link.content_type === "salary_guide" ||
      link.content_type === "interview_questions"
  );
  const candidateContent = contentLinks.filter(
    (link) =>
      link.content_type === "position_overview" ||
      link.content_type === "career_path" ||
      link.content_type === "skills_required"
  );
  const generalContent = contentLinks.filter(
    (link) =>
      link.content_type === "case_study" ||
      link.content_type === "location_insights" ||
      link.content_type === "faq"
  );

  const hasContent = relatedPositions.length > 0 || relatedLocations.length > 0 || contentLinks.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <section className="bg-gray-50 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="space-y-12">
          {/* Related Positions Section */}
          {relatedPositions.length > 0 && (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-100">
                  <Briefcase className="h-5 w-5 text-gold-600" />
                </div>
                <h2 className="font-serif text-2xl font-semibold text-navy-900">
                  Also Hiring in {currentPage.city || currentPage.state || currentPage.country}
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPositions.slice(0, 6).map((page) => (
                  <Link
                    key={page.id}
                    href={`/${page.original_url_path}`}
                    className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gold-300 hover:shadow-md"
                    onClick={() => {
                      analytics.trackInternalLinkClick(
                        'related_position',
                        typeof window !== 'undefined' ? window.location.href : '',
                        `/${page.original_url_path}`,
                        page.hero_headline
                      );
                    }}
                  >
                    <h3 className="mb-2 font-semibold text-navy-900 group-hover:text-gold-600 transition-colors">
                      {page.hero_headline}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {page.position} in {page.city || page.state || page.country}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-sm font-medium text-gold-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      View page
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                ))}
              </div>
              {relatedPositions.length > 6 && (
                <div className="mt-6 text-center">
                  <Link
                    href={`/hire-in-${currentPage.city?.toLowerCase().replace(/\s+/g, "-") || currentPage.state?.toLowerCase().replace(/\s+/g, "-") || currentPage.country_slug}`}
                    className="inline-flex items-center gap-2 text-gold-600 hover:text-gold-700 font-medium"
                    onClick={() => {
                      analytics.trackInternalLinkClick(
                        'location_hub',
                        typeof window !== 'undefined' ? window.location.href : '',
                        `/hire-in-${currentPage.city?.toLowerCase().replace(/\s+/g, "-") || currentPage.state?.toLowerCase().replace(/\s+/g, "-") || currentPage.country_slug}`
                      );
                    }}
                  >
                    View all positions in {currentPage.city || currentPage.state || currentPage.country}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Related Locations Section */}
          {relatedLocations.length > 0 && (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-100">
                  <MapPin className="h-5 w-5 text-navy-600" />
                </div>
                <h2 className="font-serif text-2xl font-semibold text-navy-900">
                  Also Serving
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedLocations.slice(0, 6).map((page) => (
                  <Link
                    key={page.id}
                    href={`/${page.original_url_path}`}
                    className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gold-300 hover:shadow-md"
                    onClick={() => {
                      analytics.trackInternalLinkClick(
                        'related_location',
                        typeof window !== 'undefined' ? window.location.href : '',
                        `/${page.original_url_path}`,
                        page.hero_headline
                      );
                    }}
                  >
                    <h3 className="mb-2 font-semibold text-navy-900 group-hover:text-gold-600 transition-colors">
                      {page.hero_headline}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {page.position} in {page.city || page.state || page.country}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-sm font-medium text-gold-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      View page
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                ))}
              </div>
              {relatedLocations.length > 6 && (
                <div className="mt-6 text-center">
                  <Link
                    href={`/hire-a-${currentPage.position_slug}`}
                    className="inline-flex items-center gap-2 text-gold-600 hover:text-gold-700 font-medium"
                    onClick={() => {
                      analytics.trackInternalLinkClick(
                        'position_hub',
                        typeof window !== 'undefined' ? window.location.href : '',
                        `/hire-a-${currentPage.position_slug}`
                      );
                    }}
                  >
                    View all locations for {currentPage.position}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Content Hub Links */}
          {contentLinks.length > 0 && (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-burgundy-100">
                  <BookOpen className="h-5 w-5 text-burgundy-600" />
                </div>
                <h2 className="font-serif text-2xl font-semibold text-navy-900">
                  Learn More
                </h2>
              </div>

              {/* Employer-Focused Content */}
              {employerContent.length > 0 && (
                <div className="mb-8">
                  <h3 className="mb-4 text-lg font-semibold text-navy-900">
                    For Employers
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {employerContent.slice(0, 4).map((link) => (
                      <Link
                        key={link.id}
                        href={link.url}
                        className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gold-300 hover:shadow-md"
                        onClick={() => {
                          analytics.trackInternalLinkClick(
                            'content_hub',
                            typeof window !== 'undefined' ? window.location.href : '',
                            link.url,
                            link.title
                          );
                        }}
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gold-600" />
                          <h4 className="font-semibold text-navy-900 group-hover:text-gold-600 transition-colors">
                            {link.title}
                          </h4>
                        </div>
                        {link.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {link.description}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-2 text-sm font-medium text-gold-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          Read article
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Candidate-Focused Content */}
              {candidateContent.length > 0 && (
                <div className="mb-8">
                  <h3 className="mb-4 text-lg font-semibold text-navy-900">
                    For Candidates
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {candidateContent.slice(0, 4).map((link) => (
                      <Link
                        key={link.id}
                        href={link.url}
                        className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gold-300 hover:shadow-md"
                        onClick={() => {
                          analytics.trackInternalLinkClick(
                            'content_hub',
                            typeof window !== 'undefined' ? window.location.href : '',
                            link.url,
                            link.title
                          );
                        }}
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gold-600" />
                          <h4 className="font-semibold text-navy-900 group-hover:text-gold-600 transition-colors">
                            {link.title}
                          </h4>
                        </div>
                        {link.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {link.description}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-2 text-sm font-medium text-gold-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          Read article
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* General Content */}
              {generalContent.length > 0 && (
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-navy-900">
                    Resources
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {generalContent.slice(0, 4).map((link) => (
                      <Link
                        key={link.id}
                        href={link.url}
                        className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gold-300 hover:shadow-md"
                        onClick={() => {
                          analytics.trackInternalLinkClick(
                            'content_hub',
                            typeof window !== 'undefined' ? window.location.href : '',
                            link.url,
                            link.title
                          );
                        }}
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gold-600" />
                          <h4 className="font-semibold text-navy-900 group-hover:text-gold-600 transition-colors">
                            {link.title}
                          </h4>
                        </div>
                        {link.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {link.description}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-2 text-sm font-medium text-gold-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          Read article
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

