"use client";

import Link from "next/link";
import Image from "next/image";
import { PublicHeader } from "@/components/pricing/PublicHeader";
import { PublicFooter } from "@/components/pricing/PublicFooter";
import { Button } from "@/components/ui/button";
import { FAQSection, type FAQItem } from "@/components/marketing/FAQSection";
import { StickyCTA } from "@/components/marketing/StickyCTA";
import { ExitIntent } from "@/components/marketing/ExitIntent";
import {
  Shield,
  Eye,
  Heart,
  Lock,
  DollarSign,
  RefreshCw,
  Zap,
  ArrowRight,
  CheckCircle,
  Crown,
  ChefHat,
  Sparkles,
  Baby,
  FileText,
  Users,
  Award,
  Briefcase,
  Star,
  Quote,
  Check,
} from "lucide-react";
// Stats - matching yacht-crew layout
const stats = [
  { value: "300+", label: "Placements/Year" },
  { value: "500+", label: "Satisfied Clients" },
  { value: "20+", label: "Years Experience" },
  { value: "24h", label: "First Candidates" },
];

const benefits = [
  {
    icon: Shield,
    title: "No Risk",
    description: "No upfront commitment. You only pay when we successfully place your staff.",
  },
  {
    icon: Zap,
    title: "Fast Delivery",
    description: "Receive qualified candidates within 24 hours of briefing us.",
  },
  {
    icon: Eye,
    title: "Full Transparency",
    description: "Progress updates at every stage. You're never left wondering.",
  },
  {
    icon: CheckCircle,
    title: "Vetted Only",
    description: "Rigorous screening, reference checks, and background verification.",
  },
  {
    icon: Lock,
    title: "Confidential Search",
    description: "Complete discretion for high-profile households.",
  },
  {
    icon: DollarSign,
    title: "Competitive Fees",
    description: "Transparent pricing with no hidden costs. Fair and straightforward.",
  },
  {
    icon: RefreshCw,
    title: "Free Replacement",
    description: "If it doesn't work out, we find a replacement at no extra cost.",
  },
  {
    icon: Heart,
    title: "Personal Service",
    description: "Dedicated specialist for your search who understands luxury service.",
  },
];

const departments = [
  {
    name: "Management",
    icon: Briefcase,
    image: "/images/private-staff/dept-management.png",
    color: "bg-navy-600",
    positions: ["House Manager", "Estate Manager", "Personal Assistant", "Travelling PA", "Family Office", "Guardian", "Property Manager", "Lifestyle Manager"],
  },
  {
    name: "Kitchen",
    icon: ChefHat,
    image: "/images/private-staff/dept-culinary.png",
    color: "bg-red-500",
    positions: ["Head Chef", "Sous Chef", "Travelling Chef", "Private Cook", "Pastry Chef", "Diet Specialist", "Chef de Partie", "Caterer"],
  },
  {
    name: "Housekeeping",
    icon: Sparkles,
    image: "/images/private-staff/dept-housekeeping.png",
    color: "bg-purple-500",
    positions: ["Head Housekeeper", "Housekeeper", "Laundress", "Seamstress", "Lady's Maid", "Houseman", "Cleaner", "Wardrobe Manager"],
  },
  {
    name: "Service",
    icon: Crown,
    image: "/images/private-staff/dept-service.png",
    color: "bg-gold-500",
    positions: ["Butler", "Waiting Staff", "Valet", "Footman", "Sommelier", "Barista", "House Butler", "Private Host"],
  },
  {
    name: "Childcare",
    icon: Baby,
    image: "/images/private-staff/dept-childcare.png",
    color: "bg-pink-500",
    positions: ["Governess", "Nanny", "Travelling Nanny", "Tutor", "Baby Nurse", "Maternity Nurse", "Au Pair", "Night Nanny"],
  },
];

const steps = [
  {
    number: "01",
    title: "Detailed Brief",
    description:
      "We gather comprehensive requirements, understanding your household's unique culture and needs.",
    icon: FileText,
    image: "/images/private-staff/process-brief.png",
  },
  {
    number: "02",
    title: "Candidate Assessment",
    description:
      "We evaluate personality, skills, and compatibility. Full background checks and reference verification.",
    icon: Users,
    image: "/images/private-staff/process-assessment.png",
  },
  {
    number: "03",
    title: "Handpicked Matches",
    description:
      "You receive thoroughly vetted professionals matched on both skills and household fit.",
    icon: Award,
    image: "/images/private-staff/process-match.png",
  },
];

// Testimonials - filtered for private staff relevance
const testimonials = [
  {
    quote: "Thank you for thinking of us for the position as private island managers. We were very pleased when we got offered the position as it's been a long time dream of ours!",
    name: "Dean And Jen",
    role: "Private Island Managers",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Capture-decran-2019-12-12-a-07.26.59-150x150-1.png",
  },
  {
    quote: "Milica and I go back for nearly 7 years to the times when I started my journey in the yachting industry. During this time, we have been able to assist each other on various cases and tables have turned few times, depending on me looking for a new challenge or recruiting my own team. Milica has always treated my staff requests with uttermost confidence and care.",
    name: "Meeli Lepik",
    role: "Interior Manager, Project ENZO",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Meeli-Lepik.png",
  },
  {
    quote: "I would like to express mine at most gratitude for the placement of my current position as Interior Manager on a 100+ m yacht. All was well organised and monitored from your side. Great communication between the yacht, yourself and me. Everything was handled with confidentiality on every level.",
    name: "Mathieu Barbe",
    role: "Interior Manager, Project ENZO",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Mathieu-Barbe.png",
  },
  {
    quote: "I have known Milica for over a decade. In that time I have come to value her judgement and advice on Crew Recruitment. She has placed a number of candidates on my commands and she has also helped me secure my dream job! I feel that she is discreet, honest and professional.",
    name: "Dughall MacLachlainn",
    role: "Captain",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Milica.jpeg",
  },
];

// FAQs for private staff recruitment
const faqs: FAQItem[] = [
  {
    question: "How much does private staff recruitment cost?",
    answer: "Our fees are success-based - you only pay when we place someone. No upfront costs or retainers. Contact us for a personalized quote based on your requirements.",
  },
  {
    question: "How do you ensure discretion for high-profile households?",
    answer: "Complete confidentiality is guaranteed. We use NDAs, anonymous searches when needed, and never share client details without explicit permission. Many of our placements are for UHNWIs and public figures.",
  },
  {
    question: "How quickly can you find the right candidate?",
    answer: "We deliver your first batch of pre-screened candidates within 24 hours. Most positions are filled within 2-4 weeks, depending on specialization required.",
  },
  {
    question: "What vetting process do candidates go through?",
    answer: "Every candidate undergoes comprehensive screening: employment verification, reference checks from previous principals, background checks, and personality assessment for household fit.",
  },
  {
    question: "What if a placement doesn't work out?",
    answer: "We offer a replacement guarantee. If a placement doesn't work out, we'll find you a suitable replacement at no additional cost.",
  },
  {
    question: "Do you handle international placements?",
    answer: "Yes, we place staff globally. We've worked with households across Europe, Middle East, Americas, and Asia-Pacific. We can assist with visa and relocation requirements.",
  },
];

// JSON-LD schemas
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Lighthouse Careers",
  url: "https://lighthouse-careers.com",
  logo: "https://lighthouse-careers.com/logo.png",
  description: "Premium private household staff recruitment agency with 500+ satisfied clients placing exceptional talent worldwide.",
  sameAs: [
    "https://www.linkedin.com/company/lighthouse-careers",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+33-6-52-92-83-60",
    contactType: "customer service",
    availableLanguage: ["English", "French"],
  },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Private Household Staff Recruitment",
  provider: {
    "@type": "Organization",
    name: "Lighthouse Careers",
  },
  description: "Comprehensive recruitment services for private households, placing Butlers, Estate Managers, Housekeepers, Nannies, and other household professionals.",
  areaServed: {
    "@type": "Place",
    name: "Worldwide",
  },
  serviceType: "Recruitment Agency",
  offers: {
    "@type": "Offer",
    description: "Success-based fees with no upfront costs",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://lighthouse-careers.com",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Private Staff",
      item: "https://lighthouse-careers.com/private-staff",
    },
  ],
};

export default function PrivateStaffPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <ExitIntent />
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative min-h-[70vh] overflow-hidden">
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

          <h1 className="font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            Find Your Perfect Household Staff
            <br />
            <span className="text-gold-400">
              Within 24h
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/90 sm:text-xl">
            From Butlers to Estate Managers, we've placed exceptional
            professionals in the world's finest homes for over 20 years.
            Vetted, discreet, and matched to your household's unique culture.
          </p>

          {/* Trust indicators - risk reversal */}
          <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/90">
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-gold-300" />
              <span>No upfront fees</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-gold-300" />
              <span>Same-day candidates</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-gold-300" />
              <span>Free replacement guarantee</span>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href="/match">
              <Button size="lg" className="min-w-[220px]">
                Start Receiving Applicants
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/job-board">
              <Button
                variant="secondary"
                size="lg"
                className="min-w-[220px] border-white/20 text-white hover:bg-white/10"
              >
                View Open Positions
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-gold-400" />
              <span>300+ Placements/Year</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-gold-400" />
              <span>500+ Satisfied Clients</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-gold-400" />
              <span>Global Coverage</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-12 z-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl sm:grid-cols-4 sm:gap-8 sm:p-8">
            {stats.map((stat) => (
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

      {/* Process Section - Visual steps */}
      <section className="relative pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl sm:p-12">
            <div className="mb-12 text-center">
              <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
                How It Works
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-gray-600">
                Our streamlined process gets you qualified candidates fast.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className="relative">
                    {/* Connector line */}
                    {index < steps.length - 1 && (
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

      {/* Feature Image Section */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
                <Image
                  src="/images/private-staff/mansion-marbella.jpeg"
                  alt="Exceptional luxury mansion in Marbella"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              {/* Decorative element */}
              <div className="absolute -bottom-6 -right-6 -z-10 h-full w-full rounded-2xl bg-gold-100" />
            </div>
            <div>
              <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
                Exceptional Staff for
                <span className="text-gold-600"> Exceptional Homes</span>
              </h2>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                We understand that your household is more than just a home, it's a sanctuary
                that reflects your lifestyle and values. Our rigorous selection process
                ensures every candidate we present embodies the discretion, professionalism,
                and service excellence your household deserves.
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold-500" />
                  <span className="text-gray-600">In-depth reference checks from previous principals</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold-500" />
                  <span className="text-gray-600">Personality and cultural fit assessment</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold-500" />
                  <span className="text-gray-600">Skills verification and competency testing</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>


      {/* Departments Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Section Header */}
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              Staff Categories
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              From estate management to childcare, we place exceptional professionals
              across every household role with discretion and expertise.
            </p>
          </div>

          {/* Department Cards Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {departments.map((dept, index) => {
              const Icon = dept.icon;
              const isEven = index % 2 === 1;

              return (
                <div
                  key={dept.name}
                  className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-gray-300"
                >
                  {/* Accent Bar */}
                  <div
                    className={`absolute ${isEven ? "right-0" : "left-0"} top-0 bottom-0 w-2 ${
                      isEven ? "bg-gold-500" : "bg-navy-900"
                    } transition-all duration-300 group-hover:w-3 ${
                      isEven
                        ? "group-hover:shadow-[-4px_0_20px_rgba(195,165,120,0.4)]"
                        : "group-hover:shadow-[4px_0_20px_rgba(10,25,47,0.3)]"
                    }`}
                  />

                  {/* Content */}
                  <div className={isEven ? "pr-4 md:text-right" : "pl-4"}>
                    {/* Header */}
                    <div className={`flex items-center gap-4 ${isEven ? "md:flex-row-reverse" : ""}`}>
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-xl ${
                          isEven ? "bg-gold-100" : "bg-navy-100"
                        }`}
                      >
                        <Icon
                          className={`h-7 w-7 ${isEven ? "text-gold-600" : "text-navy-900"}`}
                        />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-semibold text-navy-900 tracking-wide">
                          {dept.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {dept.positions.length} positions
                        </p>
                      </div>
                    </div>

                    {/* Positions Preview */}
                    <div className="mt-6 space-y-2">
                      {dept.positions.slice(0, 4).map((position) => (
                        <div
                          key={position}
                          className={`flex items-center gap-2 text-gray-600 ${
                            isEven ? "md:justify-end" : ""
                          }`}
                        >
                          {!isEven && (
                            <CheckCircle className="h-4 w-4 text-gold-500 flex-shrink-0" />
                          )}
                          <span className="text-sm">{position}</span>
                          {isEven && (
                            <CheckCircle className="h-4 w-4 text-gold-500 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                      {dept.positions.length > 4 && (
                        <p
                          className={`text-sm font-medium text-gold-600 mt-4 group-hover:text-gold-700 transition-colors ${
                            isEven ? "md:text-right" : ""
                          }`}
                        >
                          + {dept.positions.length - 4} more positions →
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Trust Indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-gold-500" />
              All household roles
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-gold-500" />
              Full-time & part-time
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-gold-500" />
              Global placements
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 py-20 sm:py-28">
        {/* Diamond pattern background - matching testimonials component */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Warm champagne/gold glow from top */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_50%_at_50%_0%,rgba(195,165,120,0.12),transparent_70%)]" aria-hidden="true" />

          {/* Secondary glow from bottom corners */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_0%_100%,rgba(195,165,120,0.06),transparent_50%)]" aria-hidden="true" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_100%_100%,rgba(195,165,120,0.06),transparent_50%)]" aria-hidden="true" />

          {/* Geometric diamond pattern - layered for depth */}
          <div className="absolute inset-0" aria-hidden="true">
            <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                {/* Primary diamond pattern */}
                <pattern id="staff-testimonial-diamond-primary" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                  {/* Outer diamond */}
                  <path
                    d="M40 4L76 40L40 76L4 40Z"
                    fill="none"
                    stroke="rgba(195, 165, 120, 0.12)"
                    strokeWidth="0.75"
                  />
                  {/* Inner diamond */}
                  <path
                    d="M40 16L64 40L40 64L16 40Z"
                    fill="none"
                    stroke="rgba(195, 165, 120, 0.08)"
                    strokeWidth="0.5"
                  />
                  {/* Center accent dot */}
                  <circle cx="40" cy="40" r="1.5" fill="rgba(195, 165, 120, 0.15)" />
                  {/* Corner accent dots */}
                  <circle cx="40" cy="4" r="1" fill="rgba(195, 165, 120, 0.1)" />
                  <circle cx="76" cy="40" r="1" fill="rgba(195, 165, 120, 0.1)" />
                  <circle cx="40" cy="76" r="1" fill="rgba(195, 165, 120, 0.1)" />
                  <circle cx="4" cy="40" r="1" fill="rgba(195, 165, 120, 0.1)" />
                </pattern>
                {/* Secondary offset pattern for depth */}
                <pattern id="staff-testimonial-diamond-secondary" x="40" y="40" width="80" height="80" patternUnits="userSpaceOnUse">
                  <path
                    d="M40 20L60 40L40 60L20 40Z"
                    fill="none"
                    stroke="rgba(195, 165, 120, 0.05)"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#staff-testimonial-diamond-primary)" />
              <rect width="100%" height="100%" fill="url(#staff-testimonial-diamond-secondary)" />
            </svg>
          </div>

          {/* Refined vignette with softer edges */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_40%,rgba(10,20,35,0.35)_100%)]" aria-hidden="true" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 z-10">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
              What Our Clients Say
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-400">
              Trusted by household managers and principals worldwide.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="relative rounded-2xl border border-white/10 bg-navy-800/95 p-6 backdrop-blur-sm transition-all duration-300 hover:border-gold-500/30 hover:shadow-[0_8px_30px_-6px_rgba(195,165,120,0.25)]"
              >
                <Quote className="absolute right-6 top-6 h-8 w-8 text-gold-500/20" />
                <div className="flex items-start gap-4">
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-gold-500/30">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-gold-400">{testimonial.role}</p>
                  </div>
                </div>
                <p className="mt-4 text-gray-300 leading-relaxed">
                  "{testimonial.quote}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              Why Lighthouse
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Two decades of experience placing exceptional talent in exceptional homes.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gold-100">
                    <Icon className="h-6 w-6 text-gold-600" />
                  </div>
                  <h3 className="mb-2 font-semibold text-navy-900">{benefit.title}</h3>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about our private staff recruitment services."
        faqs={faqs}
        className="bg-white"
      />

      {/* Luxury Service Section */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1">
              <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
                White-Glove Service for
                <span className="text-gold-600"> Discerning Clients</span>
              </h2>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                Whether you're staffing a private jet, superyacht, estate, or family office,
                our consultants bring decades of combined experience in luxury service recruitment.
                We understand the nuances of high-net-worth households and the importance of
                finding staff who seamlessly integrate into your world.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="text-2xl font-bold text-gold-600">20+</div>
                  <div className="text-sm text-gray-600">Years Industry Experience</div>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="text-2xl font-bold text-gold-600">300+</div>
                  <div className="text-sm text-gray-600">Placements/Year</div>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="text-2xl font-bold text-gold-600">24hr</div>
                  <div className="text-sm text-gray-600">First Candidates</div>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="text-2xl font-bold text-gold-600">100%</div>
                  <div className="text-sm text-gray-600">Confidentiality Guaranteed</div>
                </div>
              </div>
            </div>
            <div className="relative order-1 lg:order-2">
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl shadow-2xl">
                <Image
                  src="/images/private-staff/luxury-service.jpg"
                  alt="Luxury private service and hospitality"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              {/* Decorative element */}
              <div className="absolute -bottom-6 -left-6 -z-10 h-full w-full rounded-2xl bg-gold-100" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-navy-900 py-20 sm:py-28">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-gold-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
            Ready to Find
            <br />
            <span className="text-gold-400">Exceptional Staff?</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
            Start receiving vetted, qualified candidates within 24 hours. Complete
            discretion guaranteed.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/match">
              <Button size="lg" className="min-w-[220px]">
                Start Receiving Applicants
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="mailto:admin@lighthouse-careers.com">
              <Button
                variant="secondary"
                size="lg"
                className="min-w-[220px] border-white/20 text-white hover:bg-white/10"
              >
                Email Us Directly
              </Button>
            </a>
          </div>
        </div>
      </section>

      <PublicFooter />
      <StickyCTA />
    </div>
  );
}
