"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PublicHeader } from "@/components/pricing/PublicHeader";
import { PublicFooter } from "@/components/pricing/PublicFooter";
import { Button } from "@/components/ui/button";
import { Testimonials } from "@/components/marketing/Testimonials";
import { analytics, initScrollDepthTracking } from "@/lib/analytics/seo-tracking";
import {
  CheckCircle,
  Shield,
  Users,
  Award,
  Star,
  ArrowRight,
  Phone,
  Sparkles,
  FileText,
  MapPin,
  BookOpen,
  Clock,
  UserCheck,
  Briefcase,
  GraduationCap,
  DollarSign,
  ChevronDown,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { ClientLogos } from "@/components/marketing/ClientLogos";
import { CornerstoneStructuredData } from "@/components/seo/CornerstoneStructuredData";

// Yacht positions for image selection
const YACHT_POSITIONS = [
  'captain', 'chief-stewardess', 'yacht-chef', 'chief-engineer',
  'bosun', 'deckhand', 'stewardess', 'second-engineer', 'eto',
  'second-stewardess', 'first-officer'
];

// Section icons mapping
const SECTION_ICONS: Record<string, LucideIcon> = {
  responsibilities: Briefcase,
  qualifications: GraduationCap,
  salary: DollarSign,
  process: FileText,
  why_us: Award,
};

// Section layout types
const SECTION_LAYOUTS: Record<string, 'icon-strip' | 'card' | 'two-column'> = {
  responsibilities: 'two-column',
  qualifications: 'card',
  salary: 'icon-strip',
  process: 'card',
  why_us: 'two-column',
};

// Lifestyle images from Lighthouse website (verified working)
const HERO_IMAGES = {
  // Yacht images
  yacht: "https://www.lighthouse-careers.com/wp-content/uploads/2023/08/Somnio-3-COPYRIGHT.jpeg",
  yachtCrew: "https://www.lighthouse-careers.com/wp-content/uploads/2023/08/Yanira-cenida-puig-2013_20160116221345-1024x683.jpg",
  yachtDeck: "https://www.lighthouse-careers.com/wp-content/uploads/2023/08/shutterstock_156742031-1024x683.jpg",
  yachtPage: "https://www.lighthouse-careers.com/wp-content/uploads/2023/08/376.jpg",
  superyacht: "https://www.lighthouse-careers.com/wp-content/uploads/2024/02/superyacht-2.jpg",
  caribbeanYacht: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/CARIBBEAN-YACHT-CHARTER-1600x1210-1.jpg",
  yachtSunset: "https://www.lighthouse-careers.com/wp-content/uploads/2023/08/pexels-pixabay-289319.jpg",
  // Household/Estate images (using about page hero - verified working)
  household: "https://www.lighthouse-careers.com/wp-content/uploads/2023/08/e658ea1f70b7ee9432a60d64b2f7085b.jpg",
};

const TESTIMONIALS = [
  {
    quote: "I wanted to say a few words of thanks for your all your time and efforts over the past few years. You and your team has always been a massive help in trying to help find us the right candidate for the right job in this ever expanding and delicate industry.",
    author: "Tom Filby",
    role: "Captain M/Y Axioma",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Capture-decran-2020-02-23-a-12.27.53-150x150-1.png",
    rating: 5,
  },
  {
    quote: "I've had the pleasure of knowing Milica, and using her recruitment services for many years. Her attention to what I'm looking for in a crew member, fast response and flexibility and understanding of feedback has always impressed me.",
    author: "Carl Westerlund",
    role: "Captain 101m M/Y",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Carl-Westerlund.png",
    rating: 5,
  },
  {
    quote: "Milica is always my first call when looking for new crew. She helped me get my first command 3 years ago and ever since has supplied me with great candidates for all positions onboard.",
    author: "Mark Sinnatt",
    role: "Captain M/Y GLOBAL",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Mark-Sinnatt.png",
    rating: 5,
  },
  {
    quote: "Working with Lighthouse has been a game-changer for our estate staffing. Their understanding of the unique requirements for private household positions is unmatched.",
    author: "Private Client",
    role: "Family Office, London",
    rating: 5,
  },
  {
    quote: "The team at Lighthouse found us an exceptional House Manager who has transformed how our properties operate. Their vetting process gave us complete confidence in our hire.",
    author: "Estate Owner",
    role: "Multi-property Portfolio",
    rating: 5,
  },
  {
    quote: "Professional, discreet, and incredibly efficient. Lighthouse understood exactly what we needed and delivered outstanding candidates within days.",
    author: "Management Company",
    role: "Yacht Management",
    rating: 5,
  },
];

interface FAQItem {
  question: string;
  answer: string;
}

interface ContentSection {
  heading: string;
  content: string;
  type: string;
  order: number;
}

interface LocationPage {
  id: string;
  original_url_path: string;
  city: string | null;
  state: string | null;
  country: string;
  hero_headline: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content_type: string;
}

interface CornerstonePageData {
  id: string;
  position: string;
  position_slug: string;
  url_path: string;
  meta_title: string;
  meta_description: string;
  hero_headline: string;
  hero_subheadline: string | null;
  intro_content: string | null;
  about_position: string | null;
  service_description: string | null;
  content_sections: ContentSection[] | null;
  faq_content: FAQItem[] | null;
  answer_capsule: string | null;
  answer_capsule_question: string | null;
  key_facts: string[] | null;
  last_reviewed_at: string | null;
  updated_at: string | null;
}

interface Props {
  data: CornerstonePageData;
  locationPages?: LocationPage[];
  blogPosts?: BlogPost[];
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
    description: "We search our network and present a shortlist of pre-vetted candidates within 24-48 hours.",
    icon: Users,
  },
  {
    number: "03",
    title: "Interview & Hire",
    description: "Meet your candidates, conduct interviews, and make your selection with our full support.",
    icon: Award,
  },
];

export function CornerstonePage({
  data,
  locationPages = [],
  blogPosts = [],
}: Props) {
  const router = useRouter();
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const cleanup = initScrollDepthTracking();
    return cleanup;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSeeMatches = (source: 'hero' | 'cta' = 'hero') => {
    analytics.trackLandingPageToMatch(data.id, data.position, 'global', source);
    const query = `Hire a ${data.position}`;
    const params = new URLSearchParams({
      query,
      from: `cornerstone-${data.position_slug}`,
      position: data.position,
    });
    router.push(`/match?${params.toString()}`);
  };

  // Group location pages by country
  const locationsByCountry = locationPages.reduce<Record<string, LocationPage[]>>((acc, page) => {
    const country = page.country || 'Other';
    if (!acc[country]) acc[country] = [];
    acc[country].push(page);
    return acc;
  }, {});

  // Group blog posts by content type
  const blogPostsByType: Record<string, BlogPost[]> = {};
  blogPosts.forEach(post => {
    if (!blogPostsByType[post.content_type]) blogPostsByType[post.content_type] = [];
    blogPostsByType[post.content_type].push(post);
  });

  return (
    <div className="min-h-screen bg-white">
      <CornerstoneStructuredData data={data} />
      <PublicHeader />

      <article itemScope itemType="https://schema.org/Service">
        {/* Hero Section */}
        <header className="relative min-h-[70vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-navy-800 via-navy-900 to-[#0c1525]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(195,165,120,0.15),transparent_60%)]" />

          {/* Art Deco pattern */}
          <div className="absolute inset-0 opacity-[0.15]">
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
              <defs>
                <radialGradient id="sunburst-fade" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#C3A578" stopOpacity="1"/>
                  <stop offset="100%" stopColor="#C3A578" stopOpacity="0.3"/>
                </radialGradient>
              </defs>
              <g stroke="url(#sunburst-fade)" strokeWidth="0.5" fill="none">
                {[...Array(36)].map((_, i) => {
                  const angle = (i * 10) * (Math.PI / 180);
                  const x2 = Math.round((50 + 70 * Math.cos(angle)) * 100) / 100;
                  const y2 = Math.round((50 + 70 * Math.sin(angle)) * 100) / 100;
                  return <line key={i} x1="50%" y1="50%" x2={`${x2}%`} y2={`${y2}%`} />;
                })}
              </g>
              <circle cx="50%" cy="50%" r="15%" fill="none" stroke="#C3A578" strokeWidth="0.3" opacity="0.5"/>
              <circle cx="50%" cy="50%" r="30%" fill="none" stroke="#C3A578" strokeWidth="0.3" opacity="0.4"/>
            </svg>
          </div>

          <div className="relative mx-auto flex min-h-[70vh] max-w-6xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
            {/* Trust badge */}
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
            </div>

            <h1 className="font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl" itemProp="name">
              {data.hero_headline}
            </h1>

            {data.hero_subheadline && (
              <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300 sm:text-xl" itemProp="description">
                {data.hero_subheadline}
              </p>
            )}

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                onClick={() => handleSeeMatches('hero')}
                className="w-full sm:w-auto sm:min-w-[200px]"
              >
                Start Receiving Applicants
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => document.getElementById('locations')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto sm:min-w-[200px] border-white/20 text-white hover:bg-white/10"
              >
                Browse Locations
                <MapPin className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-gold-400" />
                <span>1,500+ Successful Placements</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-gold-400" />
                <span>No Upfront Fees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-gold-400" />
                <span>Replacement Guarantee</span>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Section */}
        <section className="relative -mt-12 z-10">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl sm:grid-cols-4 sm:gap-8 sm:p-8">
              {[
                { value: "1,500+", label: "Successful Placements" },
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

        {/* Value Proposition with Image */}
        {(() => {
          const isYachtPosition = YACHT_POSITIONS.includes(data.position_slug);
          const benefits = [
            { icon: Clock, title: "24-48 Hour Shortlist", desc: "Receive qualified candidates within 1-2 business days" },
            { icon: Shield, title: "Replacement Guarantee", desc: "Peace of mind with our satisfaction guarantee" },
            { icon: UserCheck, title: "Pre-Vetted Candidates", desc: "Background checked and reference verified" },
          ];

          return (
            <section className="py-20 bg-white overflow-hidden">
              <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  {/* Left: Benefits */}
                  <div>
                    <h2 className="font-serif text-3xl font-semibold text-navy-900 mb-8">
                      Why Clients Choose Us for {data.position} Recruitment
                    </h2>
                    <div className="space-y-6">
                      {benefits.map((benefit) => {
                        const Icon = benefit.icon;
                        return (
                          <div className="flex gap-4" key={benefit.title}>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100 flex-shrink-0">
                              <Icon className="h-6 w-6 text-gold-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-navy-900">{benefit.title}</h3>
                              <p className="text-gray-600">{benefit.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <Button
                      onClick={() => handleSeeMatches('hero')}
                      className="mt-8"
                      size="lg"
                    >
                      Start Receiving Applicants
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>

                  {/* Right: Image with floating badge */}
                  <div className="relative hidden lg:block">
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                      <Image
                        src={isYachtPosition ? HERO_IMAGES.yacht : HERO_IMAGES.household}
                        alt={isYachtPosition ? "Luxury yacht" : "Luxury estate"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                    </div>
                    {/* Floating badge */}
                    <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-xl p-4 border border-gray-100">
                      <div className="text-2xl font-bold text-gold-600">1,500+</div>
                      <div className="text-sm text-gray-600">Successful Placements</div>
                    </div>
                    {/* Second floating badge */}
                    <div className="absolute -top-4 -right-4 bg-navy-900 rounded-xl shadow-xl p-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-gold-400 text-gold-400" />
                        ))}
                      </div>
                      <div className="text-sm text-white mt-1">4.9 Rating</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })()}

        {/* Intro Content */}
        {data.intro_content && (
          <section className="py-12 bg-gray-50">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
              <p className="text-xl text-gray-700 leading-relaxed">{data.intro_content}</p>
            </div>
          </section>
        )}

        {/* About Position */}
        {data.about_position && (
          <section className="py-16 bg-white">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4">
                  <div className="lg:sticky lg:top-36">
                    <h2 className="font-serif text-2xl font-semibold text-navy-900 mb-4">
                      About the {data.position} Role
                    </h2>
                    <div className="h-1 w-16 bg-gold-500 rounded-full" />
                  </div>
                </div>
                <div className="lg:col-span-8">
                  <div
                    className="prose prose-lg max-w-none text-gray-700 prose-headings:text-navy-900 prose-headings:font-serif prose-a:text-gold-600 prose-strong:text-navy-900"
                    dangerouslySetInnerHTML={{ __html: data.about_position }}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Content Sections with varied layouts */}
        {data.content_sections && data.content_sections.length > 0 && (
          <>
            {data.content_sections.sort((a, b) => a.order - b.order).map((section) => {
              const layout = SECTION_LAYOUTS[section.type] || 'icon-strip';
              const Icon = SECTION_ICONS[section.type] || FileText;

              // Layout A: Icon strip (salary, default)
              if (layout === 'icon-strip') {
                return (
                  <section key={section.type} className="py-16 bg-gray-50">
                    <div className="mx-auto max-w-4xl px-4 sm:px-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-lg bg-gold-100 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-gold-600" />
                        </div>
                        <h2 className="font-serif text-2xl font-semibold text-navy-900">{section.heading}</h2>
                      </div>
                      <div
                        className="prose prose-lg max-w-none text-gray-700 prose-headings:text-navy-900 prose-a:text-gold-600 prose-strong:text-navy-900"
                        dangerouslySetInnerHTML={{ __html: section.content }}
                      />
                    </div>
                  </section>
                );
              }

              // Layout B: Card with border (qualifications, process)
              if (layout === 'card') {
                return (
                  <section key={section.type} className="py-16 bg-gray-50">
                    <div className="mx-auto max-w-4xl px-4 sm:px-6">
                      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                        <div className="flex items-center justify-center gap-3 mb-6">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20">
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <h2 className="font-serif text-2xl font-semibold text-navy-900 mb-6 text-center">{section.heading}</h2>
                        <div
                          className="prose prose-lg max-w-none text-gray-700 prose-headings:text-navy-900 prose-a:text-gold-600 prose-strong:text-navy-900"
                          dangerouslySetInnerHTML={{ __html: section.content }}
                        />
                      </div>
                    </div>
                  </section>
                );
              }

              // Layout C: Two-column with sticky sidebar (responsibilities, why_us)
              return (
                <section key={section.type} className="py-16 bg-white">
                  <div className="mx-auto max-w-6xl px-4 sm:px-6">
                    <div className="grid lg:grid-cols-12 gap-8">
                      <div className="lg:col-span-4">
                        <div className="lg:sticky lg:top-36">
                          <div className="h-12 w-12 rounded-xl bg-gold-100 flex items-center justify-center mb-4">
                            <Icon className="h-6 w-6 text-gold-600" />
                          </div>
                          <h2 className="font-serif text-2xl font-semibold text-navy-900 mb-4">{section.heading}</h2>
                          <div className="h-1 w-16 bg-gold-500 rounded-full" />
                        </div>
                      </div>
                      <div className="lg:col-span-8">
                        <div
                          className="prose prose-lg max-w-none text-gray-700 prose-headings:text-navy-900 prose-a:text-gold-600 prose-strong:text-navy-900"
                          dangerouslySetInnerHTML={{ __html: section.content }}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </>
        )}

        {/* How It Works */}
        <section className="relative py-20 bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl sm:p-12">
              <div className="mb-12 text-center">
                <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
                  How It Works
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-gray-600">
                  Our streamlined process gets you qualified {data.position} candidates fast.
                </p>
              </div>

              <div className="grid gap-8 lg:grid-cols-3">
                {processSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.number} className="relative">
                      {index < processSteps.length - 1 && (
                        <div className="absolute left-1/2 top-20 hidden h-px w-full bg-gradient-to-r from-gold-300 to-gold-100 lg:block" />
                      )}
                      <div className="relative flex flex-col items-center text-center">
                        <div className="relative mb-6">
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 shadow-lg shadow-gold-500/25">
                            <Icon className="h-8 w-8 text-white" />
                          </div>
                          <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white">
                            {step.number}
                          </div>
                        </div>
                        <h3 className="mb-3 text-xl font-semibold text-navy-900">{step.title}</h3>
                        <p className="text-gray-600">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Location Pages Section - Compact Grid */}
        {locationPages.length > 0 && (
          <section id="locations" className="py-16 bg-navy-900 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-400" />
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl" />

            <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-sm font-medium text-gold-400 mb-4">
                    <Globe className="h-4 w-4" />
                    {locationPages.length}+ Locations
                  </div>
                  <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
                    Hire a {data.position} Near You
                  </h2>
                </div>
                <p className="text-gray-400 lg:text-right max-w-md">
                  We place {data.position} professionals across {Object.keys(locationsByCountry).length} countries worldwide
                </p>
              </div>

              {/* Compact country grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(locationsByCountry).map(([country, pages]) => (
                  <details key={country} className="group bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-gold-500/30 transition-colors">
                    <summary className="p-5 cursor-pointer list-none">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-white text-lg">{country}</h3>
                        <span className="text-xs text-gold-400 bg-gold-500/10 px-2 py-1 rounded-full">
                          {pages.length} {pages.length === 1 ? 'city' : 'cities'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {pages.slice(0, 6).map((page, idx) => (
                          <Link
                            key={page.id}
                            href={`/${page.original_url_path}/`}
                            className="text-sm text-gray-300 hover:text-gold-400 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {page.city || page.state || page.country}
                            {idx < Math.min(pages.length - 1, 5) && <span className="text-gray-600 ml-2">•</span>}
                          </Link>
                        ))}
                        {pages.length > 6 && (
                          <span className="text-sm text-gold-500 group-open:hidden cursor-pointer hover:text-gold-400">
                            +{pages.length - 6} more
                          </span>
                        )}
                      </div>
                    </summary>
                    {pages.length > 6 && (
                      <div className="px-5 pb-5 pt-0 border-t border-white/10 mt-2">
                        <div className="flex flex-wrap gap-2 pt-4">
                          {pages.slice(6).map((page, idx) => (
                            <Link
                              key={page.id}
                              href={`/${page.original_url_path}/`}
                              className="text-sm text-gray-300 hover:text-gold-400 transition-colors"
                            >
                              {page.city || page.state || page.country}
                              {idx < pages.length - 7 && <span className="text-gray-600 ml-2">•</span>}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Blog Content Section */}
        {blogPosts.length > 0 && (
          <section className="py-20 bg-white">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-50 px-5 py-2 text-sm font-medium text-gold-700 mb-6">
                  <BookOpen className="h-4 w-4" />
                  {data.position} Resources
                </div>
                <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
                  Learn More About Hiring a {data.position}
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  Comprehensive guides and resources to help you make the right hire
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {blogPosts.slice(0, 6).map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-gold-300 hover:shadow-lg"
                  >
                    <span className="inline-block px-2 py-1 text-xs font-medium text-gold-700 bg-gold-50 rounded mb-3">
                      {post.content_type.replace(/_/g, ' ')}
                    </span>
                    <h3 className="font-semibold text-navy-900 group-hover:text-gold-600 transition-colors mb-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-gray-600 line-clamp-2">{post.excerpt}</p>
                    )}
                    <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gold-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Read guide
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                ))}
              </div>

              {blogPosts.length > 6 && (
                <div className="text-center mt-8">
                  <Link
                    href={`/blog?position=${encodeURIComponent(data.position)}`}
                    className="inline-flex items-center gap-2 text-gold-600 font-medium hover:text-gold-700"
                  >
                    View all {data.position} articles
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Testimonials */}
        <Testimonials
          title="Trusted by Industry Leaders"
          subtitle="Hear from clients and professionals who've worked with us"
          testimonials={TESTIMONIALS}
          variant="dark"
          pattern="diamond"
          showStats={true}
          stats={[
            { value: "4.9★", label: "Client Rating" },
            { value: "500+", label: "Satisfied Clients" },
            { value: "1,500+", label: "Successful Placements" },
            { value: "20+", label: "Years Experience" },
          ]}
        />

        {/* Client Logos */}
        <ClientLogos
          title="Trusted by Leading Yacht Owners & Management Companies"
          variant="light"
        />

        {/* FAQ Section */}
        {data.faq_content && data.faq_content.length > 0 && (
          <section className="py-20 bg-gray-50">
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
              <div className="mb-12 text-center">
                <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
                  Frequently Asked Questions
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  Common questions about hiring a {data.position}
                </p>
              </div>
              <div className="space-y-4">
                {data.faq_content.map((faq, index) => (
                  <details
                    key={index}
                    className="group rounded-2xl border border-gray-200 bg-white overflow-hidden transition-all hover:shadow-lg hover:border-gold-200"
                  >
                    <summary className="flex cursor-pointer items-center justify-between p-6 font-semibold text-navy-900 text-lg">
                      <div className="flex items-center gap-4">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-100 text-sm font-bold text-gold-700 flex-shrink-0">
                          {index + 1}
                        </span>
                        <span>{faq.question}</span>
                      </div>
                      <ChevronDown className="h-5 w-5 text-gold-600 transition-transform group-open:rotate-180 flex-shrink-0 ml-4" />
                    </summary>
                    <div className="px-6 pb-6 pl-[4.5rem]">
                      <div
                        className="prose prose-sm max-w-none text-gray-700 border-l-2 border-gold-200 pl-4"
                        dangerouslySetInnerHTML={{ __html: faq.answer }}
                      />
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Guarantee Section */}
        <section className="py-20 bg-gradient-to-br from-gold-50 via-white to-gold-50 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-gold-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gold-200/30 rounded-full blur-3xl" />

          <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center relative z-10">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 mb-6 shadow-lg shadow-gold-500/30">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl mb-4">
              Our Placement Guarantee
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
              We're so confident in our matching process that we offer a replacement guarantee. If your placed {data.position} doesn't meet expectations within the guarantee period, we'll find a replacement at no additional cost.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {["No upfront fees", "Replacement guarantee", "Ongoing support"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-gold-700 font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-gold-200">
                  <CheckCircle className="h-5 w-5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            {/* Content freshness signal */}
            {data.last_reviewed_at && (
              <p className="mt-8 text-sm text-gray-500">
                Last reviewed: {new Date(data.last_reviewed_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src={HERO_IMAGES.caribbeanYacht}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-navy-900/90" />
          </div>

          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
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
                Start Receiving Applicants
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto border-white/30 text-white hover:bg-white/15"
              >
                <a href="tel:+33676410299" className="flex items-center">
                  <Phone className="mr-2 h-5 w-5" />
                  Call Us Now
                </a>
              </Button>
            </div>
          </div>
        </section>
      </article>

      <PublicFooter />

      {/* Sticky CTA Bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transform transition-all duration-300 ${
          showStickyBar ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="absolute inset-0 bg-navy-900/95 backdrop-blur-md border-t border-white/10" />
        <div className="relative mx-auto max-w-7xl px-3 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="hidden sm:block flex-1">
              <p className="text-white font-medium">Find your perfect {data.position}</p>
              <p className="text-sm text-gray-400">See matching candidates instantly</p>
            </div>
            <Button
              onClick={() => handleSeeMatches('cta')}
              size="lg"
              className="w-full sm:w-auto shadow-lg shadow-gold-500/20"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
