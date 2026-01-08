"use client";

import { PublicHeader } from "@/components/pricing/PublicHeader";
import { PublicFooter } from "@/components/pricing/PublicFooter";
import { Button } from "@/components/ui/button";
import { StructuredData } from "./StructuredData";
import { InquiryForm } from "./InquiryForm";
import { MatchPreview } from "./MatchPreview";
import { InternalLinking } from "./InternalLinking";
import {
  CheckCircle,
  Shield,
  Clock,
  Users,
  Award,
  Globe,
  Star,
  ArrowRight,
  HelpCircle,
  MessageSquare,
  Briefcase,
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

interface Testimonial {
  name: string;
  role?: string;
  company?: string;
  quote: string;
  rating?: number;
  photo_url?: string;
}

interface CaseStudy {
  title: string;
  challenge: string;
  solution: string;
  result: string;
  metrics?: string;
}

interface ContentSection {
  heading: string;
  content: string;
  type: string;
  order: number;
}

interface SeoLandingPageData {
  id: string;
  position: string;
  position_slug: string;
  country: string;
  country_slug: string;
  state: string | null;
  state_slug: string | null;
  city: string | null;
  city_slug: string | null;
  original_url_path: string;
  meta_title: string;
  meta_description: string;
  hero_headline: string;
  hero_subheadline: string | null;
  intro_content: string | null;
  benefits: Array<{ title: string; description: string }> | string[];
  form_heading: string;
  cta_text: string;
  // Rich content fields
  about_position?: string | null;
  location_info?: string | null;
  service_description?: string | null;
  process_details?: string | null;
  faq_content?: FAQItem[];
  testimonials?: Testimonial[];
  case_studies?: CaseStudy[];
  content_sections?: ContentSection[];
  primary_keywords?: string[];
  secondary_keywords?: string[];
}

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

interface Props {
  data: SeoLandingPageData;
  relatedPositions?: RelatedPage[];
  relatedLocations?: RelatedPage[];
  contentLinks?: ContentLink[];
}

const defaultBenefits = [
  {
    icon: Shield,
    title: "Fully Vetted Candidates",
    description:
      "Rigorous background checks, reference verification, and skill assessments ensure only qualified professionals.",
  },
  {
    icon: Clock,
    title: "Fast Placement",
    description:
      "Our extensive network means we can present candidates within days, not weeks.",
  },
  {
    icon: Award,
    title: "500+ Satisfied Clients",
    description:
      "Trusted by private households and superyachts worldwide since 2002.",
  },
  {
    icon: Users,
    title: "300+ Placements/Year",
    description:
      "Access our global network of pre-screened, experienced professionals.",
  },
  {
    icon: Globe,
    title: "Global Coverage",
    description:
      "Placements in over 50 countries with local market expertise.",
  },
  {
    icon: Star,
    title: "Success-Fee Model",
    description:
      "No upfront costs. You only pay when we successfully place your ideal candidate.",
  },
];

const processSteps = [
  {
    number: "01",
    title: "Share Your Requirements",
    description:
      "Tell us about your household or yacht, the role you need filled, and your specific requirements.",
  },
  {
    number: "02",
    title: "Receive Matched Candidates",
    description:
      "We search our network and present a shortlist of pre-vetted candidates tailored to your needs.",
  },
  {
    number: "03",
    title: "Interview & Hire",
    description:
      "Meet your candidates, conduct interviews, and make your selection with our full support.",
  },
];

export function HireLandingPage({
  data,
  relatedPositions = [],
  relatedLocations = [],
  contentLinks = [],
}: Props) {
  const locationString = [data.city, data.state, data.country]
    .filter(Boolean)
    .join(", ");

  // Handle benefits - can be array of strings or array of objects
  const benefits =
    data.benefits && data.benefits.length > 0
      ? Array.isArray(data.benefits) && typeof data.benefits[0] === "string"
        ? (data.benefits as string[]).map((b) => ({
            title: b.split(":")[0] || b,
            description: b.split(":")[1] || b,
            icon: CheckCircle,
          }))
        : (data.benefits as Array<{ title: string; description: string }>)
      : defaultBenefits;

  return (
    <div className="min-h-screen bg-white">
      <StructuredData data={data} />
      <PublicHeader />

      <article itemScope itemType="https://schema.org/Service">
        {/* Hero Section */}
        <header className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 py-20 sm:py-28">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-gold-400 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-gold-500 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Hero Content */}
            <div className="flex flex-col justify-center">
              <div className="mb-6 inline-flex w-fit items-center rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-sm font-medium text-gold-300" itemProp="areaServed">
                <Globe className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>Serving {data.country}</span>
              </div>

              <h1 className="font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl" itemProp="name">
                {data.hero_headline}
              </h1>

              {data.hero_subheadline && (
                <p className="mt-6 text-lg text-gray-300 sm:text-xl" itemProp="description">
                  {data.hero_subheadline}
                </p>
              )}

              <p className="mt-4 text-gray-400" itemProp="description">
                {data.intro_content ||
                  `Lighthouse Careers connects you with exceptional ${data.position} professionals in ${locationString}. With 500+ satisfied clients and 300+ placements per year, we find the perfect match for your needs.`}
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() =>
                    document
                      .getElementById("match-preview")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  {data.cta_text || "See Matching Candidates"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button variant="secondary" size="lg" className="border-white/20 text-white hover:bg-white/10">
                  <a href="tel:+33676410299" itemProp="telephone">
                    Call us: <address className="inline">+33 6 76 41 02 99</address>
                  </a>
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-gold-400" />
                  <span>No upfront fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-gold-400" />
                  <span>Vetted candidates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-gold-400" />
                  <span>500+ satisfied clients</span>
                </div>
              </div>
            </div>

            {/* Hero Form */}
            <div
              id="inquiry-form"
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8"
            >
              <h2 className="mb-2 font-serif text-2xl font-semibold text-white">
                {data.form_heading || "Ready to hire your next rare talent?"}
              </h2>
              <p className="mb-6 text-gray-400">
                Tell us what you&apos;re looking for and we&apos;ll be in touch
                within 24 hours.
              </p>
              <InquiryForm
                landingPageId={data.id}
                position={data.position}
                location={locationString}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Match Preview Section - Above the fold, shows value before asking for contact */}
      <section id="match-preview" className="bg-gray-50 py-12 sm:py-16" aria-labelledby="match-preview-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 text-center">
            <h2 id="match-preview-heading" className="font-serif text-2xl font-semibold text-navy-900 sm:text-3xl">
              Matching Candidates Available Now
            </h2>
            <p className="mt-2 text-gray-600">
              Preview of candidates matching your requirements for a {data.position} in {locationString}
            </p>
          </div>
          <MatchPreview
            position={data.position}
            location={locationString}
            positionSlug={data.position_slug}
            locationSlug={data.city_slug || data.state_slug || data.country_slug}
          />
        </div>
      </section>

      {/* About Position Section */}
      {data.about_position && (
        <section className="py-20 sm:py-28" aria-labelledby="about-position-heading">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 id="about-position-heading" className="mb-8 font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              About {data.position.charAt(0).toUpperCase() + data.position.slice(1)} Positions
            </h2>
            <div
              className="prose prose-lg max-w-none text-gray-700 prose-headings:text-navy-900 prose-a:text-gold-600 prose-strong:text-navy-900"
              dangerouslySetInnerHTML={{ __html: data.about_position }}
            />
          </div>
        </section>
      )}

      {/* Location Information Section */}
      {data.location_info && (
        <section className="bg-gray-50 py-20 sm:py-28" aria-labelledby="location-info-heading">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 id="location-info-heading" className="mb-8 font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              {data.position.charAt(0).toUpperCase() + data.position.slice(1)} Market in {locationString}
            </h2>
            <div
              className="prose prose-lg max-w-none text-gray-700 prose-headings:text-navy-900 prose-a:text-gold-600 prose-strong:text-navy-900"
              dangerouslySetInnerHTML={{ __html: data.location_info }}
            />
          </div>
        </section>
      )}

      {/* Service Description Section */}
      {data.service_description && (
        <section className="py-20 sm:py-28" aria-labelledby="service-description-heading">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 id="service-description-heading" className="mb-8 font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              Our {data.position.charAt(0).toUpperCase() + data.position.slice(1)} Placement Service
            </h2>
            <div
              className="prose prose-lg max-w-none text-gray-700 prose-headings:text-navy-900 prose-a:text-gold-600 prose-strong:text-navy-900"
              dangerouslySetInnerHTML={{ __html: data.service_description }}
            />
          </div>
        </section>
      )}

      {/* Process Section */}
      <section className={data.process_details ? "bg-gray-50 py-20 sm:py-28" : "py-20 sm:py-28"} aria-labelledby="how-it-works-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 id="how-it-works-heading" className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Our streamlined process makes hiring a {data.position} in{" "}
              {locationString} simple and stress-free.
            </p>
          </div>

          {data.process_details ? (
            <div className="mx-auto max-w-4xl">
              <div
                className="prose prose-lg max-w-none text-gray-700 prose-headings:text-navy-900 prose-a:text-gold-600 prose-strong:text-navy-900"
                dangerouslySetInnerHTML={{ __html: data.process_details }}
              />
            </div>
          ) : (
            <ol className="grid gap-8 sm:grid-cols-3" itemScope itemType="https://schema.org/HowTo">
              {processSteps.map((step, index) => (
                <li key={step.number} className="relative" itemProp="step" itemScope itemType="https://schema.org/HowToStep">
                  {/* Connector line */}
                  {index < processSteps.length - 1 && (
                    <div className="absolute left-1/2 top-12 hidden h-px w-full bg-gradient-to-r from-gold-300 to-gold-100 sm:block" aria-hidden="true" />
                  )}

                  <div className="relative flex flex-col items-center text-center">
                    <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gold-gradient shadow-gold" aria-label={`Step ${step.number}`}>
                      <span className="font-serif text-3xl font-bold text-navy-900" aria-hidden="true">
                        {step.number}
                      </span>
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-navy-900" itemProp="name">
                      {step.title}
                    </h3>
                    <p className="text-gray-600" itemProp="text">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-20 sm:py-28" aria-labelledby="benefits-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 id="benefits-heading" className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              Why Choose Lighthouse Careers
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              The trusted choice for {data.position} placements in {data.country}{" "}
              since 2002.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, index) => {
              const Icon =
                "icon" in benefit
                  ? (benefit as (typeof defaultBenefits)[0]).icon
                  : CheckCircle;
              return (
                <article
                  key={index}
                  className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gold-100" aria-hidden="true">
                    <Icon className="h-6 w-6 text-gold-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-navy-900">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 sm:py-28" aria-labelledby="stats-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 id="stats-heading" className="sr-only">Company Statistics</h2>
          <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: "500+", label: "Satisfied Clients" },
              { value: "300+", label: "Placements/Year" },
              { value: "50+", label: "Countries" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <dt className="font-serif text-4xl font-bold text-gold-600 sm:text-5xl">
                  {stat.value}
                </dt>
                <dd className="mt-2 text-gray-600">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* FAQ Section */}
      {data.faq_content && data.faq_content.length > 0 && (
        <section className="bg-gray-50 py-20 sm:py-28" aria-labelledby="faq-heading">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="mb-12 text-center">
              <h2 id="faq-heading" className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
                Frequently Asked Questions
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Common questions about hiring a {data.position} in {locationString}
              </p>
            </div>
            <div className="space-y-4">
              {data.faq_content.map((faq, index) => (
                <details
                  key={index}
                  className="group rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <summary className="flex cursor-pointer items-center justify-between font-semibold text-navy-900">
                    <span>{faq.question}</span>
                    <HelpCircle className="h-5 w-5 text-gold-600 transition-transform group-open:rotate-180" />
                  </summary>
                  <div
                    className="mt-4 prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {data.testimonials && data.testimonials.length > 0 && (
        <section className="py-20 sm:py-28" aria-labelledby="testimonials-heading">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-12 text-center">
              <h2 id="testimonials-heading" className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
                What Our Clients Say
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Trusted by employers worldwide for {data.position} placements
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {data.testimonials.map((testimonial, index) => (
                <article
                  key={index}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < (testimonial.rating || 5)
                            ? "fill-gold-400 text-gold-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <div
                    className="mb-4 prose prose-sm max-w-none text-gray-700 italic"
                    dangerouslySetInnerHTML={{ __html: testimonial.quote }}
                  />
                  <div className="border-t border-gray-100 pt-4">
                    <p className="font-semibold text-navy-900">{testimonial.name}</p>
                    {testimonial.role && (
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    )}
                    {testimonial.company && (
                      <p className="text-sm text-gray-500">{testimonial.company}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Case Studies Section */}
      {data.case_studies && data.case_studies.length > 0 && (
        <section className="bg-gray-50 py-20 sm:py-28" aria-labelledby="case-studies-heading">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-12 text-center">
              <h2 id="case-studies-heading" className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
                Success Stories
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Real results from {data.position} placements
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2">
              {data.case_studies.map((caseStudy, index) => (
                <article
                  key={index}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="mb-4 text-xl font-semibold text-navy-900">
                    {caseStudy.title}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="mb-2 font-semibold text-gray-900">Challenge</h4>
                      <p className="text-gray-700">{caseStudy.challenge}</p>
                    </div>
                    <div>
                      <h4 className="mb-2 font-semibold text-gray-900">Solution</h4>
                      <p className="text-gray-700">{caseStudy.solution}</p>
                    </div>
                    <div>
                      <h4 className="mb-2 font-semibold text-gray-900">Result</h4>
                      <p className="text-gray-700">{caseStudy.result}</p>
                    </div>
                    {caseStudy.metrics && (
                      <div className="rounded-lg bg-gold-50 p-4">
                        <p className="font-semibold text-gold-900">{caseStudy.metrics}</p>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Dynamic Content Sections */}
      {data.content_sections &&
        data.content_sections.length > 0 &&
        data.content_sections
          .sort((a, b) => a.order - b.order)
          .map((section, index) => (
            <section
              key={index}
              className={index % 2 === 0 ? "py-20 sm:py-28" : "bg-gray-50 py-20 sm:py-28"}
              aria-labelledby={`content-section-${index}-heading`}
            >
              <div className="mx-auto max-w-4xl px-4 sm:px-6">
                <h2
                  id={`content-section-${index}-heading`}
                  className="mb-8 font-serif text-3xl font-semibold text-navy-900 sm:text-4xl"
                >
                  {section.heading}
                </h2>
                <div
                  className="prose prose-lg max-w-none text-gray-700 prose-headings:text-navy-900 prose-a:text-gold-600 prose-strong:text-navy-900"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              </div>
            </section>
          ))}

      {/* Internal Linking Section */}
      <InternalLinking
        currentPage={{
          id: data.id,
          position: data.position,
          position_slug: data.position_slug,
          city: data.city,
          state: data.state,
          country: data.country,
          country_slug: data.country_slug,
        }}
        relatedPositions={relatedPositions}
        relatedLocations={relatedLocations}
        contentLinks={contentLinks}
      />

      {/* Trust Badges Section */}
      <section className="bg-gray-50 py-12 sm:py-16" aria-labelledby="trust-badges-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 id="trust-badges-heading" className="sr-only">Trust Indicators</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gold-100">
                <Shield className="h-8 w-8 text-gold-600" />
              </div>
              <h3 className="font-semibold text-navy-900">Fully Vetted</h3>
              <p className="mt-1 text-sm text-gray-600">Background checked candidates</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gold-100">
                <Award className="h-8 w-8 text-gold-600" />
              </div>
              <h3 className="font-semibold text-navy-900">500+ Clients</h3>
              <p className="mt-1 text-sm text-gray-600">Trusted by elite employers</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gold-100">
                <Clock className="h-8 w-8 text-gold-600" />
              </div>
              <h3 className="font-semibold text-navy-900">48-Hour Turnaround</h3>
              <p className="mt-1 text-sm text-gray-600">Fast candidate presentation</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gold-100">
                <Star className="h-8 w-8 text-gold-600" />
              </div>
              <h3 className="font-semibold text-navy-900">Success-Fee Only</h3>
              <p className="mt-1 text-sm text-gray-600">No upfront costs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Risk Reversal Section */}
      <section className="py-12 sm:py-16" aria-labelledby="guarantee-heading">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-xl border-2 border-gold-200 bg-gold-50 p-8 text-center">
            <h2 id="guarantee-heading" className="mb-4 font-serif text-2xl font-semibold text-navy-900 sm:text-3xl">
              Our Guarantee
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-700">
              We're so confident in our matching process that we offer a replacement guarantee. 
              If your placed {data.position} doesn't meet expectations within the guarantee period, 
              we'll find a replacement at no additional cost.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-gold-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">No risk, no upfront fees, guaranteed satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-navy-900 py-20 sm:py-28" aria-labelledby="cta-heading">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 id="cta-heading" className="font-serif text-3xl font-semibold text-white sm:text-4xl">
            Ready to hire a {data.position} in {data.city || data.country}?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
            Get in touch today and receive your first candidate shortlist within
            48 hours.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              onClick={() =>
                document
                  .getElementById("match-preview")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              View Matching Candidates
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="secondary" size="lg" className="border-white/20 text-white hover:bg-white/10">
              <a href="mailto:admin@lighthouse-careers.com" itemProp="email">
                Email Us
              </a>
            </Button>
          </div>
        </div>
      </section>
      </article>

      <PublicFooter />
    </div>
  );
}
