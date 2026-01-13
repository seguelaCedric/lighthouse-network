"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PublicHeader } from "@/components/pricing/PublicHeader";
import { PublicFooter } from "@/components/pricing/PublicFooter";
import { Button } from "@/components/ui/button";
import { AnswerCapsuleWithLinks } from "./AnswerCapsule";
import { analytics, initScrollDepthTracking } from "@/lib/analytics/seo-tracking";
import {
  CheckCircle,
  Shield,
  Clock,
  Users,
  Award,
  Star,
  ArrowRight,
  HelpCircle,
  Phone,
  Sparkles,
  Quote,
  FileText,
  MapPin,
  BookOpen,
} from "lucide-react";

// Lifestyle images
const HERO_IMAGES = {
  mansion: "https://www.lighthouse-careers.com/wp-content/uploads/2023/08/exceptional_luxury_mansion_marbella.jpeg",
  yacht: "https://www.lighthouse-careers.com/wp-content/uploads/2023/08/istockphoto-1164197131-170667a.jpeg",
  service: "https://www.lighthouse-careers.com/wp-content/uploads/2023/08/QFY5VVSAKUBMNTKQKVSGC6RYXI.jpg",
  luxury: "https://www.lighthouse-careers.com/wp-content/uploads/2023/08/globeair_couple_2207-42.jpg",
  professional: "https://www.lighthouse-careers.com/wp-content/uploads/2023/08/istockphoto-79339690-1024x1024-transformed-e1693403052699.jpeg",
};

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
      <PublicHeader />

      {/* Answer Capsule */}
      {data.answer_capsule && (
        <section className="border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white py-6">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <AnswerCapsuleWithLinks
              question={data.answer_capsule_question || `How do I hire a ${data.position}?`}
              answer={data.answer_capsule}
              keyFacts={data.key_facts || []}
              audienceType="employer"
              position={data.position}
              ctaText="See Matched Candidates"
              ctaLink={`/match?position=${encodeURIComponent(data.position)}`}
            />
          </div>
        </section>
      )}

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
                <span>300+ Placements/Year</span>
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

        <div className="h-8 sm:h-12" />

        {/* Intro Content */}
        {data.intro_content && (
          <section className="py-12 bg-white">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
              <p className="text-xl text-gray-700 leading-relaxed">{data.intro_content}</p>
            </div>
          </section>
        )}

        {/* About Position */}
        {data.about_position && (
          <section className="py-16 bg-gray-50">
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
              <div
                className="prose prose-lg max-w-none text-gray-700 prose-headings:text-navy-900 prose-headings:font-serif prose-a:text-gold-600 prose-strong:text-navy-900"
                dangerouslySetInnerHTML={{ __html: data.about_position }}
              />
            </div>
          </section>
        )}

        {/* Content Sections */}
        {data.content_sections && data.content_sections.length > 0 && (
          <>
            {data.content_sections.sort((a, b) => a.order - b.order).map((section, index) => (
              <section
                key={section.type}
                className={`py-16 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                <div className="mx-auto max-w-4xl px-4 sm:px-6">
                  <h2 className="font-serif text-3xl font-semibold text-navy-900 mb-8 text-center">
                    {section.heading}
                  </h2>
                  <div
                    className="prose prose-lg max-w-none text-gray-700 prose-headings:text-navy-900 prose-a:text-gold-600 prose-strong:text-navy-900"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                </div>
              </section>
            ))}
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

        {/* Location Pages Section */}
        {locationPages.length > 0 && (
          <section id="locations" className="py-20 bg-gray-50">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="text-center mb-12">
                <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
                  Hire a {data.position} by Location
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  Find {data.position} professionals in {locationPages.length}+ locations worldwide
                </p>
              </div>

              <div className="space-y-8">
                {Object.entries(locationsByCountry).map(([country, pages]) => (
                  <div key={country}>
                    <h3 className="font-semibold text-navy-900 mb-4 text-lg">{country}</h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {pages.slice(0, 6).map((page) => (
                        <Link
                          key={page.id}
                          href={`/hire/${page.original_url_path}`}
                          className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-gold-300 hover:shadow-md"
                        >
                          <MapPin className="h-5 w-5 text-gold-600 flex-shrink-0" />
                          <span className="font-medium text-navy-900 group-hover:text-gold-600 transition-colors">
                            {page.city || page.state || page.country}
                          </span>
                          <ArrowRight className="h-4 w-4 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ))}
                    </div>
                    {pages.length > 6 && (
                      <p className="mt-3 text-sm text-gray-500">
                        + {pages.length - 6} more locations in {country}
                      </p>
                    )}
                  </div>
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
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-[#0c1525]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_40%_at_50%_0%,rgba(195,165,120,0.08),transparent_60%)]" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
                Trusted by Industry Leaders
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {TESTIMONIALS.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/10 p-8"
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-gold-400 text-gold-400" />
                    ))}
                  </div>
                  <blockquote className="text-gray-300 leading-relaxed mb-6 line-clamp-4">
                    "{testimonial.quote}"
                  </blockquote>
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
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        {data.faq_content && data.faq_content.length > 0 && (
          <section className="py-20 bg-white">
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

        {/* Guarantee Section */}
        <section className="py-16 bg-gradient-to-br from-gold-50 to-gold-100/50">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
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
        </section>

        {/* Final CTA */}
        <section className="relative py-24 overflow-hidden">
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
