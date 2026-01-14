import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PublicHeader } from "@/components/pricing/PublicHeader";
import { PublicFooter } from "@/components/pricing/PublicFooter";
import { TeamMemberCard } from "@/components/marketing/TeamMemberCard";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  Users,
  Award,
  Globe,
  Heart,
  Target,
  Ship,
  Home,
  ArrowRight,
  CheckCircle,
  Quote,
  Star,
  Zap,
  Shield,
  Clock,
  Sparkles,
} from "lucide-react";

import { generateMetadata as genMeta } from "@/lib/seo/metadata";

export const metadata: Metadata = genMeta({
  title: "About Us | Lighthouse Careers",
  description:
    "Learn about Lighthouse Careers - 500+ satisfied clients in yacht crew and private household staff recruitment expertise. Meet our team of industry specialists with real-world experience in yachting and luxury hospitality.",
  keywords: [
    "about lighthouse careers",
    "yacht crew recruitment agency",
    "private household staff agency",
    "recruitment team",
    "luxury staffing experts",
    "yacht crew specialists",
  ],
  canonical: "https://lighthouse-careers.com/about",
  openGraph: {
    title: "About Us | Lighthouse Careers",
    description:
      "Learn about Lighthouse Careers - 500+ satisfied clients in yacht crew and private household staff recruitment expertise. Meet our team of industry specialists.",
    type: "website",
    url: "https://lighthouse-careers.com/about",
    images: [
      {
        url: "https://lighthouse-careers.com/images/og-about.jpg",
        width: 1200,
        height: 630,
        alt: "About Lighthouse Careers",
      },
    ],
  },
});

const stats = [
  { value: "300+", label: "Placements/Year" },
  { value: "500+", label: "Satisfied Clients" },
  { value: "20+", label: "Years Experience" },
  { value: "24h", label: "First Candidates" },
];

const values = [
  {
    icon: Heart,
    title: "Passion",
    description:
      "We love what we do. Our team has real-world experience in the industries we serve.",
  },
  {
    icon: Target,
    title: "Precision",
    description:
      "We take time to understand your needs and match you with the right opportunities.",
  },
  {
    icon: Award,
    title: "Excellence",
    description:
      "Only the highest quality candidates make it through our rigorous vetting process.",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description:
      "We serve clients and candidates worldwide, with deep local market knowledge.",
  },
];
const testimonials = [
  {
    quote: "I wanted to say a few words of thanks for your all your time and efforts over the past few years, working on behalf of Axioma and indeed the other vessels I have worked on. You and your team has always been a massive help in trying to help find us the right candidate for the right job in this ever expanding and delicate industry.",
    name: "Tom Filby",
    role: "Captain M/Y Axioma",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Capture-decran-2020-02-23-a-12.27.53-150x150-1.png",
  },
  {
    quote: "I've had the pleasure of knowing Milica, and using Milica's services as a crew agent for many years at two different agencies. Her attention to what I'm looking for in a crew member, fast response and flexibility and understanding of feedback has always impressed me, and I look forward to continuing working with her also now when branching out on her own.",
    name: "Carl Westerlund",
    role: "Captain 101m M/Y",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Carl-Westerlund.png",
  },
  {
    quote: "Milica is always my first call when looking for new crew. Milica helped me get my first command 3 years ago and ever since has supplied me with great candidates for all positions onboard. I can always rely on her judgement and honesty on potential crew and to act fast when I need. I wish her luck with this new venture and look forward to a continued professional affiliation.",
    name: "Mark Sinnatt",
    role: "Captain M/Y GLOBAL",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Mark-Sinnatt.png",
  },
  {
    quote: "Due to her industry knowledge, great candidates she has provided over the years and great sense of urgency and limitations a yacht can have, I decided to reintroduce and appoint Milica's agency to represent our fleet of yachts in the yacht recruitment world. In no time she gained a thorough understanding of our new management structure and fleet needs.",
    name: "Alina C.",
    role: "Owner's Fleet Representative",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Alina-C.png",
  },
];

export default async function AboutPage() {
  const team = await getTeamMembers();

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 sm:py-32">
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
                const x2 = 50 + 70 * Math.cos(angle);
                const y2 = 50 + 70 * Math.sin(angle);
                return <line key={i} x1="50%" y1="50%" x2={`${x2}%`} y2={`${y2}%`} />;
              })}
            </g>
            {/* Concentric arcs */}
            <circle cx="50%" cy="50%" r="15%" fill="none" stroke="#C3A578" strokeWidth="0.3" opacity="0.5"/>
            <circle cx="50%" cy="50%" r="30%" fill="none" stroke="#C3A578" strokeWidth="0.3" opacity="0.4"/>
            <circle cx="50%" cy="50%" r="45%" fill="none" stroke="#C3A578" strokeWidth="0.3" opacity="0.3"/>
          </svg>
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="mb-6 inline-flex items-center rounded-full border border-gold-500/30 bg-gold-500/10 px-5 py-2 text-sm font-medium text-gold-300">
            <Award className="mr-2 h-4 w-4" />
            Trusted by the World&apos;s Finest Yachts &amp; Estates
          </div>

          <h1 className="font-serif text-4xl font-semibold text-white sm:text-5xl lg:text-6xl">
            We don&apos;t just fill positions, we build long lasting partnerships.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300 sm:text-xl">
            From superyachts cruising the Mediterranean to private estates serving royalty,
            we&apos;ve spent over 20 years placing exceptional people in some of the most exclusive roles.
            Our team of specialists come from the industry and have first-hand experience in delivering the highest level of service on super yachts and private households.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/hire">
              <Button size="lg">
                Find Talent
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/job-board">
              <Button
                variant="secondary"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Find Work
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-8 sm:-mt-12 z-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl sm:grid-cols-4 sm:gap-8 sm:p-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-serif text-3xl font-bold text-gold-600 sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Spacer to prevent overlap with next section */}
      <div className="h-12 sm:h-20"></div>

      {/* Mission Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
                Finding the Right Fit.
              </h2>
              <p className="mt-6 text-lg text-gray-600">
                Our entire team has real industry experience, from luxury hotels and cruise ships
                to superyachts and private estates. We don&apos;t just recruit for these roles,
                we&apos;ve lived them.
              </p>
              <p className="mt-4 text-gray-600">
                That firsthand knowledge means we understand what you actually need, the discretion
                required in a high-profile household, the teamwork dynamics on a busy yacht,
                the small details that separate a good hire from a great one.
              </p>
              <p className="mt-4 text-gray-600">
                Every candidate we send has been personally interviewed and thoroughly vetted.
                We take the time to understand both sides, so we can make matches that last.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-5 w-5 text-gold-500" />
                  Rigorous vetting process
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-5 w-5 text-gold-500" />
                  Industry expertise
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-5 w-5 text-gold-500" />
                  Personal service
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-navy-900 p-6 text-white">
                <Ship className="mb-4 h-10 w-10 text-gold-400" />
                <h3 className="font-semibold">Yacht Crew</h3>
                <p className="mt-2 text-sm text-gray-400">
                  All departments from Captain to Deckhand
                </p>
              </div>
              <div className="rounded-2xl bg-gold-50 p-6">
                <Home className="mb-4 h-10 w-10 text-gold-600" />
                <h3 className="font-semibold text-navy-900">Private Staff</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Butlers, managers, housekeepers & more
                </p>
              </div>
              <div className="rounded-2xl bg-gold-50 p-6">
                <Users className="mb-4 h-10 w-10 text-gold-600" />
                <h3 className="font-semibold text-navy-900">Global Network</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Candidates across 50+ countries
                </p>
              </div>
              <div className="rounded-2xl bg-navy-900 p-6 text-white">
                <Award className="mb-4 h-10 w-10 text-gold-400" />
                <h3 className="font-semibold">Vetted Talent</h3>
                <p className="mt-2 text-sm text-gray-400">
                  Rigorous screening process
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why We're Different */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 py-20 sm:py-28">
        {/* Diamond pattern background - matching testimonials */}
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
                <pattern id="about-diamond-primary" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
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
                <pattern id="about-diamond-secondary" x="40" y="40" width="80" height="80" patternUnits="userSpaceOnUse">
                  <path
                    d="M40 20L60 40L40 60L20 40Z"
                    fill="none"
                    stroke="rgba(195, 165, 120, 0.05)"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#about-diamond-primary)" />
              <rect width="100%" height="100%" fill="url(#about-diamond-secondary)" />
            </svg>
          </div>

          {/* Refined vignette with softer edges */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_40%,rgba(10,20,35,0.35)_100%)]" aria-hidden="true" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 z-10">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
              Why Clients Choose Us Over Other Agencies
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-400">
              In a sea of recruitment agencies, here&apos;s what sets us apart.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-navy-800/95 p-6 backdrop-blur-sm transition-all duration-300 hover:border-gold-500/30 hover:shadow-[0_8px_30px_-6px_rgba(195,165,120,0.25)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/20">
                <Sparkles className="h-6 w-6 text-gold-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">We&apos;ve Done the Job</h3>
              <p className="mt-2 text-sm text-gray-400">
                Our recruiters have worked on yachts and in private households. We know the difference between a good CV and a great crew member.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-navy-800/95 p-6 backdrop-blur-sm transition-all duration-300 hover:border-gold-500/30 hover:shadow-[0_8px_30px_-6px_rgba(195,165,120,0.25)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/20">
                <Clock className="h-6 w-6 text-gold-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">24-Hour Response</h3>
              <p className="mt-2 text-sm text-gray-400">
                Yacht emergencies don&apos;t wait. Neither do we. Get qualified candidates in your inbox within 24 hours of your brief.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-navy-800/95 p-6 backdrop-blur-sm transition-all duration-300 hover:border-gold-500/30 hover:shadow-[0_8px_30px_-6px_rgba(195,165,120,0.25)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/20">
                <Shield className="h-6 w-6 text-gold-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Discretion Guaranteed</h3>
              <p className="mt-2 text-sm text-gray-400">
                We serve royalty, billionaires, and high-profile families. Your privacy isn&apos;t just respected, it&apos;s protected.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-navy-800/95 p-6 backdrop-blur-sm transition-all duration-300 hover:border-gold-500/30 hover:shadow-[0_8px_30px_-6px_rgba(195,165,120,0.25)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/20">
                <Zap className="h-6 w-6 text-gold-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">No Time Wasters</h3>
              <p className="mt-2 text-sm text-gray-400">
                Every candidate is interviewed, vetted, and reference-checked before they reach you. We value your time as much as ours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              Our Values
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              The principles that guide everything we do.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="group rounded-2xl border border-gray-200 bg-white p-6 text-center transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 shadow-lg shadow-gold-500/25 transition-transform group-hover:scale-110">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-navy-900">
                    {value.title}
                  </h3>
                  <p className="text-sm text-gray-600">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <div className="mb-4 flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-gold-400 text-gold-400" />
              ))}
            </div>
            <p className="mb-2 text-sm font-medium text-gold-600">Rated 5/5 by Captains &amp; Fleet Managers</p>
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              Don&apos;t Take Our Word For It
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Hear from the captains, fleet managers, and principals who trust us with their most important hires.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg sm:p-8"
              >
                <Quote className="absolute right-6 top-6 h-8 w-8 text-gold-200" />
                <div className="mb-4 flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-gold-400 text-gold-400" />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-navy-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              The People Behind Your Perfect Hire
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Former yacht crew. Private household veterans. Hospitality experts.
              We&apos;ve lived the life, now we help you find people who will excel at it.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member) => (
              <TeamMemberCard key={member.name} member={member} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-navy-900 py-20 sm:py-28">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-gold-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
            Ready to Work With Us?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-400">
            Whether you&apos;re looking for exceptional crew or your next career
            opportunity, we&apos;re here to help.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/contact">
              <Button size="lg">
                Contact Us
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/job-board">
              <Button
                variant="secondary"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10"
              >
                View Open Positions
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex flex-col items-center gap-4 text-gray-400 sm:flex-row sm:justify-center sm:gap-8">
            <a
              href="mailto:admin@lighthouse-careers.com"
              className="transition-colors hover:text-gold-400"
            >
              admin@lighthouse-careers.com
            </a>
            <span className="hidden sm:inline">|</span>
            <a
              href="tel:+33676410299"
              className="transition-colors hover:text-gold-400"
            >
              +33 6 76 41 02 99
            </a>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

async function getTeamMembers() {
  const supabase = await createClient();
  const targetOrgId = await getPrimaryAgencyId(supabase);
  if (!targetOrgId) {
    return [];
  }
  const { data } = await supabase
    .from("team_members")
    .select(
      "name, role, bio, languages, email, image_url, linkedin_url, facebook_url"
    )
    .eq("is_active", true)
    .eq("organization_id", targetOrgId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (data || [])
    .filter((member) => member.image_url)
    .map((member) => ({
      name: member.name,
      role: member.role,
      bio: member.bio,
      languages: member.languages ?? undefined,
      email: member.email ?? undefined,
      image: member.image_url ?? "",
      linkedin: member.linkedin_url ?? undefined,
      facebook: member.facebook_url ?? undefined,
    }));
}

async function getPrimaryAgencyId(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const { data: agencies } = await supabase
    .from("organizations")
    .select("id, slug, created_at")
    .eq("type", "agency");

  if (!agencies || agencies.length === 0) {
    return null;
  }

  if (agencies.length === 1) {
    return agencies[0].id;
  }

  const lighthouseAgencies = agencies.filter(
    (agency) => agency.slug === "lighthouse"
  );
  const candidates = lighthouseAgencies.length > 0 ? lighthouseAgencies : agencies;

  const counts = await Promise.all(
    candidates.map(async (agency) => {
      const { count } = await supabase
        .from("team_members")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", agency.id);
      return {
        id: agency.id,
        created_at: agency.created_at,
        count: count ?? 0,
      };
    })
  );

  counts.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return counts[0]?.id ?? candidates[0].id;
}
