"use client";

import { PublicHeader } from "@/components/pricing/PublicHeader";
import { PublicFooter } from "@/components/pricing/PublicFooter";
import { Button } from "@/components/ui/button";
import { StructuredData } from "./StructuredData";
import { InquiryForm } from "./InquiryForm";
import {
  CheckCircle,
  Shield,
  Clock,
  Users,
  Award,
  Globe,
  Star,
  ArrowRight,
} from "lucide-react";

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
  benefits: Array<{ title: string; description: string }>;
  form_heading: string;
  cta_text: string;
}

interface Props {
  data: SeoLandingPageData;
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
    title: "20+ Years Experience",
    description:
      "Trusted by private households and superyachts worldwide since 2002.",
  },
  {
    icon: Users,
    title: "22,000+ Candidates",
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

export function HireLandingPage({ data }: Props) {
  const locationString = [data.city, data.state, data.country]
    .filter(Boolean)
    .join(", ");

  const benefits =
    data.benefits && data.benefits.length > 0 ? data.benefits : defaultBenefits;

  return (
    <div className="min-h-screen bg-white">
      <StructuredData data={data} />
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 py-20 sm:py-28">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-gold-400 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-gold-500 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Hero Content */}
            <div className="flex flex-col justify-center">
              <div className="mb-6 inline-flex w-fit items-center rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-sm font-medium text-gold-300">
                <Globe className="mr-2 h-4 w-4" />
                Serving {data.country}
              </div>

              <h1 className="font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                {data.hero_headline}
              </h1>

              {data.hero_subheadline && (
                <p className="mt-6 text-lg text-gray-300 sm:text-xl">
                  {data.hero_subheadline}
                </p>
              )}

              <p className="mt-4 text-gray-400">
                {data.intro_content ||
                  `Lighthouse Careers connects you with exceptional ${data.position} professionals in ${locationString}. With over 20 years of experience and 22,000+ candidates in our network, we find the perfect match for your needs.`}
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() =>
                    document
                      .getElementById("inquiry-form")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  {data.cta_text || "Receive candidates today"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button variant="secondary" size="lg" className="border-white/20 text-white hover:bg-white/10">
                  Call us: +33 6 76 41 02 99
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
                  <span>20+ years trusted</span>
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
      </section>

      {/* Process Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Our streamlined process makes hiring a {data.position} in{" "}
              {locationString} simple and stress-free.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {processSteps.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Connector line */}
                {index < processSteps.length - 1 && (
                  <div className="absolute left-1/2 top-12 hidden h-px w-full bg-gradient-to-r from-gold-300 to-gold-100 sm:block" />
                )}

                <div className="relative flex flex-col items-center text-center">
                  <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gold-gradient shadow-gold">
                    <span className="font-serif text-3xl font-bold text-navy-900">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-navy-900">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
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
                <div
                  key={index}
                  className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gold-100">
                    <Icon className="h-6 w-6 text-gold-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-navy-900">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: "20+", label: "Years Experience" },
              { value: "22,000+", label: "Candidates" },
              { value: "112,000+", label: "Placements" },
              { value: "50+", label: "Countries" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-serif text-4xl font-bold text-gold-600 sm:text-5xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-navy-900 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
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
                  .getElementById("inquiry-form")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Start Your Search
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="secondary" size="lg" className="border-white/20 text-white hover:bg-white/10">
              <a href="mailto:admin@lighthouse-careers.com">
                Email Us
              </a>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
