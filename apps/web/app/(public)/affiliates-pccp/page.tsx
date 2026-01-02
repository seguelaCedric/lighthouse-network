import { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/pricing/PublicHeader";
import { PublicFooter } from "@/components/pricing/PublicFooter";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Award,
  Briefcase,
  BookOpen,
  Shield,
  Anchor,
  CheckCircle,
  ArrowRight,
  Ship,
  Sparkles,
  Users,
  Target,
  Star,
  Clock,
  Globe,
} from "lucide-react";

export const metadata: Metadata = {
  title: "PCCP - Progressive Crew Career Programme | Lighthouse Careers",
  description:
    "Start your superyacht career with the Progressive Crew Career Programme. E-learning, certification, and apprenticeship opportunities for aspiring yacht crew.",
};

const benefits = [
  {
    icon: Award,
    title: "Completion Certificate",
    description:
      "Demonstrates your commitment to the industry and helps crew agents assess your suitability for positions.",
  },
  {
    icon: GraduationCap,
    title: "Fully Funded Education",
    description:
      "Access to a comprehensive starter education programme valued at up to €3,980 - completely free.",
  },
  {
    icon: Briefcase,
    title: "Apprenticeship Opportunity",
    description:
      "Top candidates may qualify for a fully paid 3-year luxury yacht apprenticeship worth over €118,000.",
  },
];

const modules = [
  {
    icon: Anchor,
    title: "Deck Operations",
    topics: ["Seamanship basics", "Navigation fundamentals", "Safety at sea", "Tender operations"],
  },
  {
    icon: Shield,
    title: "Safety Protocols",
    topics: ["Emergency procedures", "Fire safety", "Life-saving equipment", "First aid basics"],
  },
  {
    icon: Ship,
    title: "Sailing Fundamentals",
    topics: ["Weather patterns", "Knot tying", "Line handling", "Anchoring procedures"],
  },
  {
    icon: Sparkles,
    title: "Interior Operations",
    topics: ["Housekeeping standards", "Cabin service", "Laundry protocols", "Guest areas"],
  },
  {
    icon: Star,
    title: "Service Standards",
    topics: ["Fine dining service", "Guest etiquette", "Beverage service", "Table settings"],
  },
  {
    icon: BookOpen,
    title: "Contractual Knowledge",
    topics: ["MLC 2006 basics", "Employment rights", "Working hours", "Leave entitlements"],
  },
];

const steps = [
  {
    number: "01",
    title: "Apply Online",
    description: "Complete a simple application form telling us about yourself and your aspirations.",
  },
  {
    number: "02",
    title: "Complete Modules",
    description: "Work through our comprehensive e-learning modules at your own pace.",
  },
  {
    number: "03",
    title: "Earn Certificate",
    description: "Pass assessments and receive your PCCP completion certificate.",
  },
  {
    number: "04",
    title: "Start Your Career",
    description: "Get matched with entry-level positions or apprenticeship opportunities.",
  },
];

export default function AffiliatesPCCPPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 py-20 sm:py-32">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-gold-400 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-blue-500 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-sm font-medium text-gold-300">
                <GraduationCap className="mr-2 h-4 w-4" />
                Progressive Crew Career Programme
              </div>

              <h1 className="font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl">
                Launch Your
                <br />
                <span className="bg-gradient-to-r from-gold-400 to-gold-200 bg-clip-text text-transparent">
                  Superyacht Career
                </span>
              </h1>

              <p className="mt-6 text-lg text-gray-300">
                The PCCP is your gateway to the superyacht industry. Our
                comprehensive e-learning programme provides the foundation you
                need to start an exciting career on luxury yachts worldwide.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link href="/join">
                  <Button size="lg">
                    Apply Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Learn More
                  </Button>
                </a>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="font-serif text-3xl font-bold text-gold-400">€3,980</div>
                <div className="mt-1 text-sm text-gray-400">Programme Value</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="font-serif text-3xl font-bold text-gold-400">€118K+</div>
                <div className="mt-1 text-sm text-gray-400">Apprenticeship Value</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="font-serif text-3xl font-bold text-gold-400">6</div>
                <div className="mt-1 text-sm text-gray-400">Learning Modules</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="font-serif text-3xl font-bold text-gold-400">100%</div>
                <div className="mt-1 text-sm text-gray-400">Free to Candidates</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is PCCP */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
                What is the PCCP?
              </h2>
              <p className="mt-6 text-lg text-gray-600">
                The Progressive Crew Career Programme has been designed as a
                starting point for individuals aspiring to work as crew members
                on yachts. It provides a safe and robust knowledge base for
                those entering an industry that is exciting but challenging.
              </p>
              <p className="mt-4 text-gray-600">
                Whether you dream of working on the deck of a superyacht,
                providing five-star interior service, or mastering the galley,
                the PCCP gives you the foundational knowledge and credentials to
                get started.
              </p>

              <div className="mt-8 flex flex-wrap gap-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-5 w-5 text-gold-500" />
                  Self-paced learning
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-5 w-5 text-gold-500" />
                  Industry-recognized
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-5 w-5 text-gold-500" />
                  Expert instructors
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-4 -top-4 h-72 w-72 rounded-full bg-gold-100 blur-3xl" />
              <div className="relative rounded-2xl bg-gradient-to-br from-navy-900 to-navy-800 p-8 text-white">
                <Target className="mb-6 h-12 w-12 text-gold-400" />
                <h3 className="mb-4 font-serif text-2xl font-semibold">
                  Who Is It For?
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" />
                    <span>Career changers looking for adventure</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" />
                    <span>Hospitality professionals seeking new challenges</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" />
                    <span>Recent graduates with a passion for travel</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" />
                    <span>Anyone serious about a yachting career</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              Programme Benefits
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Complete the PCCP and unlock these exclusive benefits to jumpstart
              your career.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 translate-y-[-8] rounded-full bg-gold-100/50 blur-2xl transition-all group-hover:bg-gold-200/50" />
                  <div className="relative">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 shadow-lg shadow-gold-500/25">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="mb-3 text-xl font-semibold text-navy-900">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Learning Modules */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              What You&apos;ll Learn
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Our comprehensive curriculum covers everything you need to start
              your yacht career.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <div
                  key={module.title}
                  className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-navy-100">
                    <Icon className="h-6 w-6 text-navy-600" />
                  </div>
                  <h3 className="mb-4 font-semibold text-navy-900">{module.title}</h3>
                  <ul className="space-y-2">
                    {module.topics.map((topic) => (
                      <li
                        key={topic}
                        className="flex items-center text-sm text-gray-600"
                      >
                        <CheckCircle className="mr-2 h-4 w-4 text-gold-500" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-navy-900 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
              How It Works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-400">
              Your journey from application to career in four simple steps.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {index < steps.length - 1 && (
                  <div className="absolute left-1/2 top-8 hidden h-px w-full bg-gradient-to-r from-gold-500/50 to-transparent lg:block" />
                )}
                <div className="relative text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-xl font-bold text-navy-900 shadow-lg shadow-gold-500/25">
                    {step.number}
                  </div>
                  <h3 className="mb-3 font-semibold text-white">{step.title}</h3>
                  <p className="text-sm text-gray-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="mb-8 flex justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-6 w-6 fill-gold-400 text-gold-400" />
            ))}
          </div>
          <blockquote className="font-serif text-2xl font-medium text-navy-900 sm:text-3xl">
            &ldquo;The PCCP gave me the confidence and knowledge I needed to land my
            first job as a deckhand. Six months later, I&apos;m living my dream on a
            70m yacht in the Mediterranean.&rdquo;
          </blockquote>
          <div className="mt-8">
            <div className="font-semibold text-navy-900">Alex Thompson</div>
            <div className="text-sm text-gray-500">PCCP Graduate, Now Deckhand</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gold-500 to-gold-600 py-20 sm:py-28">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-gold-300 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl lg:text-5xl">
            Ready to Start Your
            <br />
            Yacht Career?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-navy-900/80">
            Join the PCCP today and take the first step towards an exciting
            career on the world&apos;s finest superyachts.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/join">
              <Button
                size="lg"
                className="min-w-[200px] bg-navy-900 text-white hover:bg-navy-800"
              >
                Apply Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="secondary"
                size="lg"
                className="min-w-[200px] border-navy-900/20 bg-white/80 text-navy-900 hover:bg-white"
              >
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
