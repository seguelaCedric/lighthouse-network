import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PublicHeader } from "@/components/pricing/PublicHeader";
import { PublicFooter } from "@/components/pricing/PublicFooter";
import { Button } from "@/components/ui/button";
import { EmployerInquiryForm } from "@/components/hire/EmployerInquiryForm";
import { FAQSection } from "@/components/marketing/FAQSection";
import { ExitIntent } from "@/components/marketing/ExitIntent";
import { StickyCTA } from "@/components/marketing/StickyCTA";
import {
  Ship,
  Home,
  Shield,
  Clock,
  Users,
  CheckCircle,
  ArrowRight,
  Phone,
  Star,
  Award,
  Zap,
  RefreshCw,
  Quote,
} from "lucide-react";

import { generateMetadata as genMeta } from "@/lib/seo/metadata";

export const metadata: Metadata = genMeta({
  title: "Hire Yacht Crew & Private Staff | Lighthouse Careers",
  description:
    "Find pre-screened yacht crew and private household staff. No upfront fees, same-day candidates, free replacement guarantee. 500+ satisfied clients, 300+ placements per year.",
  keywords: [
    "hire yacht crew",
    "hire private staff",
    "yacht crew recruitment",
    "private household staff",
    "butler recruitment",
    "estate manager recruitment",
    "hire staff",
    "luxury staffing",
  ],
  canonical: "https://lighthouse-careers.com/hire",
  openGraph: {
    title: "Hire Yacht Crew & Private Staff | Lighthouse Careers",
    description:
      "Find pre-screened yacht crew and private household staff. No upfront fees, same-day candidates, free replacement guarantee.",
    type: "website",
    url: "https://lighthouse-careers.com/hire",
    images: [
      {
        url: "https://lighthouse-careers.com/images/og-hire.jpg",
        width: 1200,
        height: 630,
        alt: "Hire Yacht Crew & Private Staff",
      },
    ],
  },
});

const benefits = [
  {
    icon: Shield,
    title: "No Upfront Fees",
    description:
      "Only pay when you hire. No retainers, no search fees, no risk.",
  },
  {
    icon: Zap,
    title: "Same-Day Candidates",
    description:
      "Receive qualified candidates within 24 hours of your brief.",
  },
  {
    icon: RefreshCw,
    title: "Free Replacement",
    description:
      "If a placement doesn't work out, we'll find a replacement at no extra cost.",
  },
  {
    icon: Award,
    title: "Pre-Screened Talent",
    description:
      "All candidates are thoroughly vetted with verified references and certifications.",
  },
];

const services = [
  {
    icon: Ship,
    title: "Yacht Crew",
    description:
      "Captains, Officers, Engineers, Deckhands, Chefs, Steward/esses, and all yacht positions.",
    positions: [
      "Captain",
      "Chief Officer",
      "Chief Engineer",
      "Chef",
      "Chief Stew",
      "Deckhand",
    ],
    href: "/yacht-crew",
  },
  {
    icon: Home,
    title: "Private Household Staff",
    description:
      "Estate Managers, Butlers, House Managers, Nannies, Private Chefs, and household professionals.",
    positions: [
      "Estate Manager",
      "Butler",
      "House Manager",
      "Nanny",
      "Private Chef",
      "Housekeeper",
    ],
    href: "/private-staff",
  },
];

const stats = [
  { value: "300+", label: "Placements/Year" },
  { value: "500+", label: "Satisfied Clients" },
  { value: "24h", label: "Average Response" },
  { value: "20+", label: "Years Experience" },
];

const testimonials = [
  {
    quote:
      "Milica is always my first call when looking for new crew. I can always rely on her judgement and honesty on potential crew and to act fast when I need.",
    name: "Mark Sinnatt",
    role: "Captain M/Y GLOBAL",
    image:
      "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Mark-Sinnatt.png",
  },
  {
    quote:
      "Her attention to what I'm looking for in a crew member, fast response and flexibility has always impressed me.",
    name: "Carl Westerlund",
    role: "Captain 101m M/Y",
    image:
      "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Carl-Westerlund.png",
  },
  {
    quote:
      "Due to her industry knowledge and great sense of urgency, it has certainly proved to be a great partnership.",
    name: "Alina C.",
    role: "Owner's Fleet Representative",
    image:
      "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Alina-C.png",
  },
  {
    quote:
      "She never dropped her standards of recruitment over the time. Her professionalism and dedication to finding the right match is unparalleled.",
    name: "Dùghall MacLachlainn",
    role: "Captain",
    image:
      "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/dughall.png",
  },
  {
    quote:
      "I have known Milica for over a decade. She is discreet, honest and professional. A true asset in the industry.",
    name: "James Richardson",
    role: "Chief Officer",
    image:
      "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/james-r.png",
  },
  {
    quote:
      "Milica has always treated my staff requests with uttermost confidence and care. Not only she has found me some fantastic people to work with but we have also managed to handle sensitive situations with respect and dignity.",
    name: "Meeli Lepik",
    role: "Interior Manager",
    image:
      "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/meeli.png",
  },
];

const process = [
  {
    step: 1,
    title: "Share Your Requirements",
    description:
      "Tell us about the position, vessel/property, and ideal candidate profile.",
  },
  {
    step: 2,
    title: "Receive Candidates",
    description:
      "We search our database and network to find pre-screened matches within 24 hours.",
  },
  {
    step: 3,
    title: "Interview & Hire",
    description:
      "Review profiles, conduct interviews, and make your selection. We handle the rest.",
  },
];

const employerFaqs = [
  {
    question: "How much does your recruitment service cost?",
    answer:
      "We operate on a success-fee model. You only pay when we successfully place a candidate with you. There are no upfront fees, retainers, or search costs. This means zero risk for you – if we don't find the right person, you don't pay anything.",
  },
  {
    question: "How quickly can you find candidates?",
    answer:
      "We typically provide qualified candidates within 24 hours of receiving your brief. Our extensive database of pre-screened yacht crew and private household staff allows us to move fast when you need urgent positions filled.",
  },
  {
    question: "What if the placement doesn't work out?",
    answer:
      "We offer a free replacement guarantee. If a candidate leaves or doesn't meet expectations within the guarantee period, we'll find a suitable replacement at no additional cost to you. Your satisfaction is our priority.",
  },
  {
    question: "What positions do you recruit for?",
    answer:
      "We specialize in two sectors: Yacht Crew (Captains, Officers, Engineers, Deckhands, Chefs, Steward/esses) and Private Household Staff (Estate Managers, Butlers, House Managers, Nannies, Private Chefs, Housekeepers). Our deep expertise in these areas ensures we understand exactly what you need.",
  },
  {
    question: "Do you verify candidates before sending them?",
    answer:
      "Yes, all candidates are thoroughly pre-screened before we present them to you. This includes verification of references, certifications, qualifications, and work history. We only send candidates who meet our strict quality standards and match your specific requirements.",
  },
];

export default function HirePage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero Section with Inline Form */}
      <section className="relative min-h-[85vh] overflow-hidden">
        {/* Rich navy gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-800 via-navy-900 to-[#0c1525]" />

        {/* Warm champagne ambient light from top */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(195,165,120,0.12),transparent_60%)]" />

        {/* Subtle side accents for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_0%_50%,rgba(195,165,120,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_100%_50%,rgba(195,165,120,0.05),transparent_50%)]" />

        {/* Art Deco sunburst pattern */}
        <div className="absolute inset-0 opacity-[0.12]">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <defs>
              <radialGradient id="hire-sunburst-fade" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#C3A578" stopOpacity="1"/>
                <stop offset="100%" stopColor="#C3A578" stopOpacity="0.3"/>
              </radialGradient>
            </defs>
            <g stroke="url(#hire-sunburst-fade)" strokeWidth="0.5" fill="none">
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

        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,20,35,0.3)_100%)]" />

        <div className="relative mx-auto flex min-h-[85vh] max-w-6xl items-center px-4 py-20 sm:px-6">
          <div className="grid w-full items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* Trust Badge */}
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-navy-900">4.9</div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-gold-400 text-gold-400" />
                    ))}
                  </div>
                </div>
                <span className="hidden sm:inline">Trusted by 500+ Clients</span>
                <span className="sm:hidden">500+ Clients</span>
              </div>

              <h1 className="font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-[3.5rem]">
                Hire vetted candidates
                <br />
                within <span className="text-gold-400">24 hours</span>
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-lg text-gray-300 lg:mx-0">
                Stop sifting through hundreds of unqualified CVs. Get matched with
                pre-screened yacht crew and private staff who meet your exact requirements.
              </p>

              {/* Trust indicators */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-gray-300 lg:justify-start">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-gold-400" />
                  <span>No upfront fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-gold-400" />
                  <span>Same-day candidates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-gold-400" />
                  <span>Free replacement</span>
                </div>
              </div>

              {/* Phone CTA */}
              <div className="mt-8 flex items-center justify-center gap-4 lg:justify-start">
                <span className="text-sm text-gray-400">Prefer to talk?</span>
                <a
                  href="tel:+33652928360"
                  className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-2 text-sm font-medium text-gold-400 transition-colors hover:bg-gold-500/20"
                >
                  <Phone className="h-4 w-4" />
                  +33 6 52 92 83 60
                </a>
              </div>
            </div>

            {/* Right - Form */}
            <div className="lg:pl-4">
              <EmployerInquiryForm />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-gray-100 bg-gray-50 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-serif text-3xl font-bold text-navy-900 sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="border-b border-gray-100 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gold-100">
                    <Icon className="h-7 w-7 text-gold-600" />
                  </div>
                  <h3 className="mb-2 font-semibold text-navy-900">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              What Are You Looking For?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              We specialize in two sectors, ensuring deep expertise and the best
              talent pool for your needs.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.title}
                  className="rounded-2xl border border-gray-200 bg-white p-8 transition-shadow hover:shadow-lg"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-navy-100">
                    <Icon className="h-7 w-7 text-navy-600" />
                  </div>
                  <h3 className="mb-3 font-serif text-2xl font-semibold text-navy-900">
                    {service.title}
                  </h3>
                  <p className="mb-6 text-gray-600">{service.description}</p>
                  <div className="mb-6 flex flex-wrap gap-2">
                    {service.positions.map((position) => (
                      <span
                        key={position}
                        className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                      >
                        {position}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={service.href}
                    className="inline-flex items-center font-medium text-gold-600 hover:text-gold-700"
                  >
                    Learn more
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              A simple, efficient process designed to get you the right candidates
              quickly.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {process.map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gold-gradient text-2xl font-bold text-navy-900">
                  {item.step}
                </div>
                <h3 className="mb-3 text-lg font-semibold text-navy-900">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Luxurious Navy Background */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        {/* Navy gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-[#0c1525]" />

        {/* Warm champagne/gold glow from top */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_40%_at_50%_0%,rgba(195,165,120,0.08),transparent_60%)]" />

        {/* Geometric diamond pattern */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hire-diamond-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <path
                  d="M30 0L60 30L30 60L0 30Z"
                  fill="none"
                  stroke="rgba(195, 165, 120, 0.06)"
                  strokeWidth="0.5"
                />
                <circle cx="30" cy="30" r="1" fill="rgba(195, 165, 120, 0.08)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hire-diamond-pattern)" />
          </svg>
        </div>

        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,20,35,0.4)_100%)]" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
              Trusted by Captains & Hiring Managers
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
              See why industry professionals choose Lighthouse Careers.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="group relative bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/10 p-8 hover:bg-white/[0.06] hover:border-gold-500/30 transition-all duration-300"
              >
                {/* Quote icon */}
                <div className="absolute -top-4 left-8">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500 shadow-lg shadow-gold-500/20">
                    <Quote className="h-4 w-4 text-navy-900" />
                  </div>
                </div>

                <div className="mb-4 mt-2 flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-gold-400 text-gold-400"
                    />
                  ))}
                </div>

                <p className="mb-6 text-gray-300 leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-white/10">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom stats bar */}
          <div className="mt-16 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              <div className="text-center">
                <div className="font-serif text-2xl font-bold text-gold-400 sm:text-3xl">4.9★</div>
                <div className="mt-1 text-sm text-gray-400">Client Rating</div>
              </div>
              <div className="text-center">
                <div className="font-serif text-2xl font-bold text-white sm:text-3xl">500+</div>
                <div className="mt-1 text-sm text-gray-400">Satisfied Clients</div>
              </div>
              <div className="text-center">
                <div className="font-serif text-2xl font-bold text-white sm:text-3xl">300+</div>
                <div className="mt-1 text-sm text-gray-400">Placements/Year</div>
              </div>
              <div className="text-center">
                <div className="font-serif text-2xl font-bold text-white sm:text-3xl">20+</div>
                <div className="mt-1 text-sm text-gray-400">Years Experience</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection
        title="Common Questions"
        subtitle="Everything you need to know about working with us."
        faqs={employerFaqs}
      />

      {/* CTA Section */}
      <section className="bg-navy-900 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="mb-6 flex justify-center gap-4">
            <div className="flex items-center rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-sm font-medium text-gold-300">
              <CheckCircle className="mr-1.5 h-4 w-4" />
              No Upfront Fees
            </div>
            <div className="flex items-center rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-sm font-medium text-gold-300">
              <Clock className="mr-1.5 h-4 w-4" />
              24h Response
            </div>
          </div>

          <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
            Start Your Staff Search Today
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
            Tell us about your requirements and receive qualified candidates within
            24 hours. No upfront fees, no risk.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <a href="#top">
              <Button size="lg">
                Submit Your Brief
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <a href="tel:+33652928360">
              <Button
                variant="secondary"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Phone className="mr-2 h-5 w-5" />
                +33 6 52 92 83 60
              </Button>
            </a>
          </div>
          <p className="mt-6 text-sm text-gray-400">
            Or email us at{" "}
            <a
              href="mailto:admin@lighthouse-careers.com"
              className="text-gold-400 hover:text-gold-300"
            >
              admin@lighthouse-careers.com
            </a>
          </p>
        </div>
      </section>

      <PublicFooter />

      {/* Conversion Components */}
      <ExitIntent />
      <StickyCTA />
    </div>
  );
}
