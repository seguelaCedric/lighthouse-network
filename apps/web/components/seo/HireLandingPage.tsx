"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PublicHeader } from "@/components/pricing/PublicHeader";
import { PublicFooter } from "@/components/pricing/PublicFooter";
import { Button } from "@/components/ui/button";
import { StructuredData } from "./StructuredData";
import { InquiryForm } from "./InquiryForm";
import { MatchPreview } from "./MatchPreview";
import { InternalLinking } from "./InternalLinking";
import { analytics, initScrollDepthTracking } from "@/lib/analytics/seo-tracking";
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
  Phone,
  Play,
  Sparkles,
  Quote,
  FileText,
} from "lucide-react";

// Lifestyle images for visual appeal
const HERO_IMAGES = {
  mansion: "https://www.lighthouse-careers.com/wp-content/uploads/2023/08/exceptional_luxury_mansion_marbella.jpeg",
  yacht: "https://www.lighthouse-careers.com/wp-content/uploads/2023/08/istockphoto-1164197131-170667a.jpeg",
  service: "https://www.lighthouse-careers.com/wp-content/uploads/2023/08/QFY5VVSAKUBMNTKQKVSGC6RYXI.jpg",
  meeting: "https://www.lighthouse-careers.com/wp-content/uploads/2023/08/smiling-business-people-having-meeting-cafe.jpg",
  luxury: "https://www.lighthouse-careers.com/wp-content/uploads/2023/08/globeair_couple_2207-42.jpg",
  professional: "https://www.lighthouse-careers.com/wp-content/uploads/2023/08/istockphoto-79339690-1024x1024-transformed-e1693403052699.jpeg",
};

// Real testimonials from clients and candidates
const TESTIMONIALS = [
  {
    quote: "I wanted to say a few words of thanks for your all your time and efforts over the past few years. You and your team has always been a massive help in trying to help find us the right candidate for the right job in this ever expanding and delicate industry.",
    name: "Tom Filby",
    role: "Captain M/Y Axioma",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Capture-decran-2020-02-23-a-12.27.53-150x150-1.png",
    type: "client",
  },
  {
    quote: "I've had the pleasure of knowing Milica, and using her recruitment services for many years. Her attention to what I'm looking for in a crew member, fast response and flexibility and understanding of feedback has always impressed me.",
    name: "Carl Westerlund",
    role: "Captain 101m M/Y",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Carl-Westerlund.png",
    type: "client",
  },
  {
    quote: "Milica is always my first call when looking for new crew. She helped me get my first command 3 years ago and ever since has supplied me with great candidates for all positions onboard.",
    name: "Mark Sinnatt",
    role: "Captain M/Y GLOBAL",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Mark-Sinnatt.png",
    type: "client",
  },
  {
    quote: "Due to her industry knowledge, great candidates she has provided over the years and great sense of urgency, I decided to appoint Milica's agency to represent our fleet of yachts. It has certainly proved to be a great partnership.",
    name: "Alina C.",
    role: "Owner's Fleet Representative",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Alina-C.png",
    type: "client",
  },
  {
    quote: "I have known Milica for over a decade. In that time I have come to value her judgement and advice on Crew Recruitment. She has placed a number of candidates on my commands and she has also helped me secure my dream job!",
    name: "Dùghall MacLachlainn",
    role: "Captain",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Milica.jpeg",
    type: "client",
  },
  {
    quote: "Throughout my 11 years in yachting, I have found Milica to be my go-to agent for jobs. Not only because she has a great reputation in the industry and great boats in her books but also for her care, kindness and professionalism.",
    name: "Vesna Coklo",
    role: "Chief Stewardess 70m+ MY",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Vesna-Coklo.jpeg",
    type: "candidate",
  },
];

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

const processSteps = [
  {
    number: "01",
    title: "Share Your Requirements",
    description: "Tell us about your household or yacht, the role you need filled, and your specific requirements.",
    icon: FileText,
  },
  {
    number: "02",
    title: "Receive Matched Candidates",
    description: "We search our network and present a shortlist of pre-vetted candidates tailored to your needs.",
    icon: Users,
  },
  {
    number: "03",
    title: "Interview & Hire",
    description: "Meet your candidates, conduct interviews, and make your selection with our full support.",
    icon: Award,
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

  const router = useRouter();
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Initialize scroll depth tracking for CRO analytics
  useEffect(() => {
    const cleanup = initScrollDepthTracking();
    return cleanup;
  }, []);

  // Show sticky bar after scrolling past hero section
  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 500px (roughly past hero)
      setShowStickyBar(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handler to redirect to match page with pre-filled query
  const handleSeeMatches = (source: 'hero' | 'preview' | 'cta' = 'hero') => {
    analytics.trackLandingPageToMatch(data.id, data.position, locationString, source);

    const query = `Hire a ${data.position} in ${locationString}`;
    const params = new URLSearchParams({
      query,
      from: `landing-${data.position_slug}-${data.city_slug || data.state_slug || data.country_slug}`,
      position: data.position,
      location: locationString,
    });
    router.push(`/match?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <StructuredData data={data} />
      <PublicHeader />

      <article itemScope itemType="https://schema.org/Service">
        {/* Hero Section - Centered layout matching yacht-crew */}
        <header className="relative min-h-[70vh] overflow-hidden">
          {/* Rich navy gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-navy-800 via-navy-900 to-[#0c1525]" />

          {/* Warm champagne ambient light from top */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(195,165,120,0.15),transparent_60%)]" />

          {/* Subtle side accents for depth */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_0%_50%,rgba(195,165,120,0.06),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_100%_50%,rgba(195,165,120,0.06),transparent_50%)]" />

          {/* Art Deco sunburst pattern */}
          <div className="absolute inset-0 opacity-[0.15]">
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
              <defs>
                <radialGradient id="sunburst-fade" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#C3A578" stopOpacity="1"/>
                  <stop offset="100%" stopColor="#C3A578" stopOpacity="0.3"/>
                </radialGradient>
              </defs>
              <g stroke="url(#sunburst-fade)" strokeWidth="0.5" fill="none">
                {/* Radiating lines from center */}
                {[...Array(36)].map((_, i) => {
                  const angle = (i * 10) * (Math.PI / 180);
                  const x2 = Math.round((50 + 70 * Math.cos(angle)) * 100) / 100;
                  const y2 = Math.round((50 + 70 * Math.sin(angle)) * 100) / 100;
                  return <line key={i} x1="50%" y1="50%" x2={`${x2}%`} y2={`${y2}%`} />;
                })}
              </g>
              {/* Concentric arcs */}
              <circle cx="50%" cy="50%" r="15%" fill="none" stroke="#C3A578" strokeWidth="0.3" opacity="0.5"/>
              <circle cx="50%" cy="50%" r="30%" fill="none" stroke="#C3A578" strokeWidth="0.3" opacity="0.4"/>
              <circle cx="50%" cy="50%" r="45%" fill="none" stroke="#C3A578" strokeWidth="0.3" opacity="0.3"/>
            </svg>
          </div>

          <div className="relative mx-auto flex min-h-[70vh] max-w-6xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
            {/* Trust badge - above fold social proof */}
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-navy-900">4.9</div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-gold-400 text-gold-400" />
                  ))}
                </div>
              </div>
              <span className="hidden sm:inline">Trusted by 500+ Clients Worldwide</span>
              <span className="sm:hidden">500+ Clients</span>
            </div>

            {/* Headline with "24h" in gold */}
            <h1 className="font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl" itemProp="name">
              Find Your Perfect {data.position} within{" "}
              <span className="text-gold-400">24h</span>
            </h1>

            {/* Subheadline */}
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300 sm:text-xl" itemProp="description">
              {data.intro_content ||
                `Premium ${data.position} recruitment in ${locationString}. Vetted candidates delivered fast, no upfront fees.`}
            </p>

            {/* Centered CTA */}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                onClick={() => handleSeeMatches('hero')}
                className="w-full sm:w-auto sm:min-w-[200px]"
              >
                See Matching Candidates
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => document.getElementById('how-it-works-heading')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto sm:min-w-[200px] border-white/20 text-white hover:bg-white/10"
              >
                How It Works
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Trust badges with checkmarks */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400">
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
                <span>24-hour response</span>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Section - overlaps hero */}
        <section className="relative -mt-12 z-10">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl sm:grid-cols-4 sm:gap-8 sm:p-8">
              {[
                { value: "300+", label: "Placements/Year" },
                { value: "500+", label: "Satisfied Clients" },
                { value: "20+", label: "Years Experience" },
                { value: "24h", label: "First Candidates" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold text-navy-900 sm:text-3xl">{stat.value}</div>
                  <div className="mt-1 text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Spacer to prevent overlap */}
        <div className="h-8 sm:h-12"></div>

        {/* Value Proposition Section with Images - Moved before MatchPreview for better conversion flow */}
        <section className="py-20 sm:py-28 bg-white overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Image Grid */}
              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="relative h-48 rounded-2xl overflow-hidden shadow-xl">
                      <Image
                        src={HERO_IMAGES.service}
                        alt="Professional service"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>
                    <div className="relative h-64 rounded-2xl overflow-hidden shadow-xl">
                      <Image
                        src={HERO_IMAGES.luxury}
                        alt="Luxury lifestyle"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>
                  </div>
                  <div className="space-y-4 pt-8">
                    <div className="relative h-64 rounded-2xl overflow-hidden shadow-xl">
                      <Image
                        src={HERO_IMAGES.yacht}
                        alt="Yacht setting"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>
                    <div className="relative h-48 rounded-2xl overflow-hidden shadow-xl">
                      <Image
                        src={HERO_IMAGES.professional}
                        alt="Professional staff"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>
                  </div>
                </div>
                {/* Floating Stats Card */}
                <div className="absolute -bottom-6 -right-6 bg-navy-900 text-white rounded-2xl p-6 shadow-2xl hidden sm:block">
                  <div className="text-4xl font-bold text-gold-400 font-serif">98%</div>
                  <div className="text-sm text-gray-300">Client Satisfaction</div>
                </div>
              </div>

              {/* Content */}
              <div>
                <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl lg:text-5xl mb-6">
                  Why Elite Employers Choose Us
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  For over 20 years, Lighthouse Careers has been the trusted partner for discerning clients seeking exceptional {data.position} professionals. Our rigorous vetting process ensures only the highest caliber candidates.
                </p>

                <div className="space-y-6">
                  {[
                    {
                      icon: Shield,
                      title: "Rigorous 7-Step Vetting",
                      description: "Background checks, reference verification, and skill assessments",
                    },
                    {
                      icon: Clock,
                      title: "24-Hour Candidate Delivery",
                      description: "Receive your first shortlist within two business days",
                    },
                    {
                      icon: Award,
                      title: "Success-Fee Model",
                      description: "No upfront costs - you only pay when you hire",
                    },
                    {
                      icon: Users,
                      title: "Replacement Guarantee",
                      description: "Free replacement if placement doesn't work out",
                    },
                  ].map((feature, index) => (
                    <div key={index} className="flex gap-4 items-start">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-100 to-gold-200 flex-shrink-0">
                        <feature.icon className="h-6 w-6 text-gold-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-navy-900 text-lg">{feature.title}</h3>
                        <p className="text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section - White card container matching yacht-crew */}
        <section className="relative py-20" aria-labelledby="how-it-works-heading">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl sm:p-12">
              <div className="mb-12 text-center">
                <h2 id="how-it-works-heading" className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
                  How It Works
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-gray-600">
                  Our streamlined process gets you qualified candidates fast.
                </p>
              </div>

              <div className="grid gap-8 lg:grid-cols-3">
                {processSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.number} className="relative">
                      {/* Connector line */}
                      {index < processSteps.length - 1 && (
                        <div className="absolute left-1/2 top-20 hidden h-px w-full bg-gradient-to-r from-gold-300 to-gold-100 lg:block" />
                      )}

                      <div className="relative flex flex-col items-center text-center">
                        {/* Number badge */}
                        <div className="relative mb-6">
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 shadow-lg shadow-gold-500/25">
                            <Icon className="h-8 w-8 text-white" />
                          </div>
                          <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white">
                            {step.number}
                          </div>
                        </div>

                        <h3 className="mb-3 text-xl font-semibold text-navy-900">
                          {step.title}
                        </h3>
                        <p className="text-gray-600">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Match Preview Section - Moved after Value Prop & How It Works for better conversion flow */}
        <section id="match-preview" className="py-20 sm:py-28 bg-gradient-to-b from-gray-50 to-white" aria-labelledby="match-preview-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-50 px-5 py-2 text-sm font-medium text-gold-700 mb-6">
                <Sparkles className="h-4 w-4" />
                AI-Powered Matching
              </div>
              <h2 id="match-preview-heading" className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl lg:text-5xl">
                Your Potential {data.position} Matches
              </h2>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                Preview qualified candidates available in {locationString}. Our AI matches your requirements with our exclusive talent pool.
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

        {/* Testimonials Section - Luxurious navy background with elegant pattern */}
        <section className="relative py-20 sm:py-28 overflow-hidden">
          {/* Rich navy gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-[#0c1525]" />

          {/* Warm glow from top */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_40%_at_50%_0%,rgba(195,165,120,0.08),transparent_60%)]" />

          {/* Elegant geometric pattern - visible and refined */}
          <div className="absolute inset-0">
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="luxury-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                  {/* Elegant diamond */}
                  <path d="M40 4 L76 40 L40 76 L4 40 Z" fill="none" stroke="#C3A578" strokeWidth="0.6" opacity="0.12"/>
                  {/* Inner diamond accent */}
                  <path d="M40 16 L64 40 L40 64 L16 40 Z" fill="none" stroke="#C3A578" strokeWidth="0.4" opacity="0.08"/>
                  {/* Center dot */}
                  <circle cx="40" cy="40" r="2" fill="#C3A578" opacity="0.15"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#luxury-pattern)" />
            </svg>
          </div>

          {/* Subtle vignette for depth */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,transparent_40%,rgba(0,0,0,0.1))]" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-5 py-2 text-sm font-medium text-gold-400 backdrop-blur-sm mb-6">
                <Star className="h-4 w-4 fill-gold-400" />
                Client Success Stories
              </div>
              <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl lg:text-5xl mb-4">
                Trusted by Industry Leaders
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Hear from captains, estate managers, and professionals who have found exceptional talent through Lighthouse Careers.
              </p>
            </div>

            {/* Testimonials Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {TESTIMONIALS.map((testimonial, index) => (
                <div
                  key={index}
                  className="group relative bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/10 p-8 hover:bg-white/[0.06] hover:border-gold-500/30 transition-all duration-300"
                >
                  {/* Quote Icon */}
                  <div className="absolute -top-4 left-8">
                    <div className="h-8 w-8 rounded-full bg-gold-500 flex items-center justify-center">
                      <Quote className="h-4 w-4 text-navy-900" />
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex gap-1 mb-4 pt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-gold-400 text-gold-400" />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-gray-300 leading-relaxed mb-6 line-clamp-4">
                    "{testimonial.quote}"
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-gold-500/40">
                      <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-white">{testimonial.name}</div>
                      <div className="text-sm text-gray-400">{testimonial.role}</div>
                    </div>
                  </div>

                  {/* Type Badge */}
                  <div className="absolute top-6 right-6">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      testimonial.type === 'client'
                        ? 'bg-white/10 text-gray-300'
                        : 'bg-gold-500/20 text-gold-400'
                    }`}>
                      {testimonial.type === 'client' ? 'Employer' : 'Placed Candidate'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Stats */}
            <div className="mt-16 text-center">
              <div className="inline-flex flex-wrap items-center justify-center gap-8 sm:gap-12 bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl px-8 py-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold-400 font-serif">500+</div>
                  <div className="text-sm text-gray-400">Happy Clients</div>
                </div>
                <div className="hidden sm:block h-12 w-px bg-white/10" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold-400 font-serif">4.9/5</div>
                  <div className="text-sm text-gray-400">Average Rating</div>
                </div>
                <div className="hidden sm:block h-12 w-px bg-white/10" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold-400 font-serif">20+</div>
                  <div className="text-sm text-gray-400">Years Experience</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Position Section */}
        {data.about_position && (
          <section className="py-20 sm:py-28 bg-white" aria-labelledby="about-position-heading">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <h2 id="about-position-heading" className="mb-8 font-serif text-3xl font-semibold text-navy-900 sm:text-4xl text-center">
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
          <section className="py-20 sm:py-28 bg-gray-50" aria-labelledby="location-info-heading">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <h2 id="location-info-heading" className="mb-8 font-serif text-3xl font-semibold text-navy-900 sm:text-4xl text-center">
                {data.position.charAt(0).toUpperCase() + data.position.slice(1)} Market in {locationString}
              </h2>
              <div
                className="prose prose-lg max-w-none text-gray-700 prose-headings:text-navy-900 prose-a:text-gold-600 prose-strong:text-navy-900"
                dangerouslySetInnerHTML={{ __html: data.location_info }}
              />
            </div>
          </section>
        )}

        {/* FAQ Section */}
        {data.faq_content && data.faq_content.length > 0 && (
          <section className="py-20 sm:py-28 bg-white" aria-labelledby="faq-heading">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
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
                    className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg"
                  >
                    <summary className="flex cursor-pointer items-center justify-between font-semibold text-navy-900 text-lg">
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

        {/* Guarantee Section */}
        <section className="py-16 bg-gradient-to-br from-gold-50 to-gold-100/50">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gold-200 mb-6">
                <Shield className="h-10 w-10 text-gold-700" />
              </div>
              <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl mb-4">
                Our Placement Guarantee
              </h2>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-6">
                We're so confident in our matching process that we offer a replacement guarantee. If your placed {data.position} doesn't meet expectations within the guarantee period, we'll find a replacement at no additional cost.
              </p>
              <div className="inline-flex items-center gap-2 text-gold-700 font-semibold">
                <CheckCircle className="h-5 w-5" />
                <span>No risk, no upfront fees, guaranteed satisfaction</span>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative py-24 sm:py-32 overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src={HERO_IMAGES.mansion}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-navy-900/90" />
          </div>

          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl lg:text-5xl mb-6">
              Ready to Find Your Perfect {data.position}?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
              See matching candidates instantly with our AI-powered search. No commitment required.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                onClick={() => handleSeeMatches('cta')}
                size="lg"
                className="w-full sm:w-auto sm:min-w-[220px]"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                See Matching Candidates
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto border-white/30 text-white hover:bg-white/15 hover:border-white/50"
              >
                <a href="tel:+33676410299" className="flex items-center">
                  <Phone className="mr-2 h-5 w-5" />
                  Call Us Now
                </a>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-white/70">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-gold-400" />
                <span>Free to search</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-gold-400" />
                <span>No commitment</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-gold-400" />
                <span>Results in 24 hours</span>
              </div>
            </div>
          </div>
        </section>
      </article>

      <PublicFooter />

      {/* Floating Bottom CTA Bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transform transition-all duration-300 ease-out ${
          showStickyBar ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Blur backdrop */}
        <div className="absolute inset-0 bg-navy-900/95 backdrop-blur-md border-t border-white/10" />

        <div className="relative mx-auto max-w-7xl px-3 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            {/* Left side - Message (Desktop) */}
            <div className="hidden sm:block flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                Find your perfect {data.position} in {locationString}
              </p>
              <p className="text-sm text-gray-400">
                See matching candidates instantly
              </p>
            </div>

            {/* Mobile: Full width button layout */}
            <div className="sm:hidden flex-1">
              <Button
                onClick={() => handleSeeMatches('cta')}
                size="default"
                className="w-full shadow-lg shadow-gold-500/20"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                See Candidates
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Desktop CTA Button */}
            <Button
              onClick={() => handleSeeMatches('cta')}
              size="lg"
              className="hidden sm:flex whitespace-nowrap shadow-lg shadow-gold-500/20"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              See Matching Candidates
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
