import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PublicHeader } from "@/components/pricing/PublicHeader";
import { PublicFooter } from "@/components/pricing/PublicFooter";
import { Button } from "@/components/ui/button";
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
  Calendar,
  RefreshCw,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Hire Yacht Crew & Private Staff | Lighthouse Careers",
  description:
    "Find pre-screened yacht crew and private household staff. No upfront fees, same-day candidates, free replacement guarantee. 500+ satisfied clients, 300+ placements per year.",
};

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
      "Chief Stewardess",
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
  { value: "48h", label: "Average Time to Shortlist" },
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
      "We search our database and network to find pre-screened matches within 24-48 hours.",
  },
  {
    step: 3,
    title: "Interview & Hire",
    description:
      "Review profiles, conduct interviews, and make your selection. We handle the rest.",
  },
];

export default function HirePage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 py-20 sm:py-28">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-gold-400 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-blue-500/30 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-sm font-medium text-gold-300">
                <Users className="mr-2 h-4 w-4" />
                For Employers
              </div>

              <h1 className="font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl">
                Find Pre-Screened
                <br />
                <span className="text-gold-400">Yacht Crew & Private Staff</span>
              </h1>

              <p className="mt-6 text-lg text-gray-300">
                Stop sifting through hundreds of unqualified CVs. Get matched with
                vetted candidates who meet your exact requirements - typically within
                24 hours.
              </p>

              {/* Trust indicators */}
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-gold-400" />
                  <span>No upfront fees</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-gold-400" />
                  <span>Same-day candidates</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-gold-400" />
                  <span>Free replacement</span>
                </div>
              </div>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href="/contact">
                  <Button size="lg" className="w-full sm:w-auto">
                    Brief Us Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href="tel:+33676410299">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full border-white/20 text-white hover:bg-white/10 sm:w-auto"
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    Call Us Now
                  </Button>
                </a>
              </div>
            </div>

            {/* Stats Card */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              <div className="mb-6 text-center">
                <p className="text-sm font-medium uppercase tracking-wider text-gold-400">
                  Trusted by Industry Leaders
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="font-serif text-3xl font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-sm text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
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

          <div className="mt-12 text-center">
            <Link href="/contact">
              <Button size="lg">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              Trusted by Captains & Hiring Managers
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              See why industry professionals choose Lighthouse Careers.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="rounded-2xl border border-gray-200 bg-white p-6"
              >
                <div className="mb-4 flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-gold-400 text-gold-400"
                    />
                  ))}
                </div>
                <p className="mb-6 text-gray-700">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-navy-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-navy-900 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
            Ready to Find Your Perfect Hire?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
            Tell us about your requirements and receive qualified candidates within
            24-48 hours. No upfront fees, no risk.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/contact">
              <Button size="lg">
                Brief Us Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="tel:+33676410299">
              <Button
                variant="secondary"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Phone className="mr-2 h-5 w-5" />
                +33 6 76 41 02 99
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
    </div>
  );
}
