import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PublicHeader } from "@/components/pricing/PublicHeader";
import { PublicFooter } from "@/components/pricing/PublicFooter";
import { Button } from "@/components/ui/button";
import { FAQSection, type FAQItem } from "@/components/marketing/FAQSection";
import { Star } from "lucide-react";
import {
  Anchor,
  Shield,
  Eye,
  Heart,
  Lock,
  DollarSign,
  RefreshCw,
  Zap,
  ArrowRight,
  CheckCircle,
  Ship,
  Wrench,
  ChefHat,
  Sparkles,
  FileText,
  Users,
  Award,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Yacht Crew Recruitment Agency | Hire Vetted Crew in 48 Hours | Lighthouse",
  description:
    "Premier yacht crew recruitment specialists with 500+ satisfied clients. We place Captains, Engineers, Chefs, and Stewardesses on superyachts worldwide. Vetted candidates delivered in 48 hours. No upfront fees.",
  keywords: [
    "yacht crew recruitment",
    "yacht crew agency",
    "superyacht crew",
    "captain recruitment",
    "yacht stewardess",
    "yacht chef recruitment",
    "yacht engineer jobs",
  ],
  openGraph: {
    title: "Yacht Crew Recruitment | Hire Vetted Crew in 48 Hours",
    description:
      "Premier yacht crew recruitment specialists with 500+ satisfied clients. Captains, Engineers, Chefs, and Interior crew for superyachts worldwide.",
    type: "website",
    url: "https://lighthouse-careers.com/yacht-crew/",
    siteName: "Lighthouse Careers",
    images: [
      {
        url: "/images/og-yacht-crew.jpg",
        width: 1200,
        height: 630,
        alt: "Lighthouse Yacht Crew Recruitment",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yacht Crew Recruitment | Lighthouse Careers",
    description: "Hire vetted yacht crew in 48 hours. No upfront fees.",
  },
  alternates: {
    canonical: "https://lighthouse-careers.com/yacht-crew/",
  },
};

// Stats
const stats = [
  { value: "300+", label: "Placements/Year" },
  { value: "500+", label: "Satisfied Clients" },
  { value: "20+", label: "Years Experience" },
  { value: "24h", label: "First Candidates" },
];

const benefits = [
  {
    icon: Zap,
    title: "48-Hour Candidate Delivery",
    description: "Receive your first batch of pre-screened, qualified candidates within 48 hours of briefing us.",
    highlight: true,
  },
  {
    icon: Shield,
    title: "Zero Upfront Fees",
    description: "No retainer, no commitment. You only pay when we successfully place your crew.",
    highlight: true,
  },
  {
    icon: CheckCircle,
    title: "100% Vetted Candidates",
    description: "Every candidate undergoes reference checks, certificate verification, and background screening.",
    highlight: false,
  },
  {
    icon: RefreshCw,
    title: "Replacement Guarantee",
    description: "We stand behind every placement. If things don't work out, we'll find you a suitable replacement.",
    highlight: false,
  },
  {
    icon: Eye,
    title: "Full Transparency",
    description: "Progress updates at every stage. Track your search in real-time.",
    highlight: false,
  },
  {
    icon: Lock,
    title: "Confidential Search",
    description: "Anonymous recruiting available for sensitive replacements. Complete discretion guaranteed.",
    highlight: false,
  },
  {
    icon: Heart,
    title: "Dedicated Specialist",
    description: "Your own recruitment consultant who learns your yacht's unique culture and needs.",
    highlight: false,
  },
  {
    icon: DollarSign,
    title: "Transparent Pricing",
    description: "Clear fee structure with no hidden costs. Know exactly what you'll pay upfront.",
    highlight: false,
  },
];

const departments = [
  {
    name: "Deck",
    slug: "deck",
    icon: Anchor,
    color: "bg-blue-500",
    image: "/images/yacht/deck.jpg",
    positions: ["Captain", "First Officer", "Second Officer", "Bosun", "Lead Deckhand", "Deckhand", "Dive Master", "Tender Captain", "Waterports Instructor", "Carpenter", "Deck/Stew"],
  },
  {
    name: "Engineering",
    slug: "engineering",
    icon: Wrench,
    color: "bg-orange-500",
    image: "/images/yacht/engine.webp",
    positions: ["Chief Engineer", "Second Engineer", "Third Engineer", "Solo Engineer", "ETO", "AV/IT Officer", "Junior Engineer", "Electrical Engineer", "HVAC Technician", "Engineer/Deckhand"],
  },
  {
    name: "Galley",
    slug: "galley",
    icon: ChefHat,
    color: "bg-red-500",
    image: "/images/yacht/galley.jpg",
    positions: ["Head Chef", "Sous Chef", "Second Chef", "Third Chef", "Crew Chef", "Solo Chef", "Pastry Chef", "Cook/Stew", "Galley Assistant"],
  },
  {
    name: "Interior",
    slug: "interior",
    icon: Sparkles,
    color: "bg-purple-500",
    image: "/images/yacht/interior.webp",
    positions: ["Chief Stewardess", "Purser", "Head of House", "Head of Service", "2nd Stewardess", "3rd Stewardess", "Stewardess", "Junior Stewardess", "Laundry Stewardess", "Housekeeper", "Butler", "Nanny/Stew"],
  },
];

// Real testimonials from yacht crew clients and professionals
const testimonials = [
  {
    quote: "I wanted to say a few words of thanks for your all your time and efforts over the past few years, working on behalf of Axioma and indeed the other vessels I have worked on. You and your team has always been a massive help in trying to help find us the right candidate for the right job in this ever expanding and delicate industry.",
    name: "Tom Filby",
    role: "Captain M/Y Axioma",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Capture-decran-2020-02-23-a-12.27.53-150x150-1.png",
    type: "client" as const,
  },
  {
    quote: "Milica is always my first call when looking for new crew. Milica helped me get my first command 3 years ago and ever since has supplied me with great candidates for all positions onboard. I can always rely on her judgement and honesty on potential crew and to act fast when I need.",
    name: "Mark Sinnatt",
    role: "Captain M/Y GLOBAL",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Mark-Sinnatt.png",
    type: "client" as const,
  },
  {
    quote: "I have known Milica for over a decade. In that time I have come to value her judgement and advice on Crew Recruitment. She has placed a number of candidates on my commands and she has also helped me secure my dream job! I feel that she is discreet, honest and professional.",
    name: "Dùghall MacLachlainn",
    role: "Captain",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Milica.jpeg",
    type: "client" as const,
  },
  {
    quote: "Milica and I go back for nearly 7 years to the times when I started my journey in the yachting industry. Milica has always treated my staff requests with uttermost confidence and care. Not only she has found me some fantastic people to work with but we have also managed to handle sensitive situations with respect and dignity.",
    name: "Meeli Lepik",
    role: "Interior Manager, Project ENZO",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Meeli-Lepik.png",
    type: "client" as const,
  },
  {
    quote: "Milica placed me on my first yacht when I joined the industry, matching my land-based experience perfectly with the vessel. Since then, she has supported my career and seen me move to Chief Stewardess working within larger operations. Her experience with, and knowledge of the 100m+ market means she is the first person I call when I am looking for a role or crew.",
    name: "Stephanie Wells",
    role: "Chief Stewardess 100m+ M/Y",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Stephanie-Wells.png",
    type: "candidate" as const,
  },
  {
    quote: "Throughout my 11 years in yachting, I have found Milica to be my go-to agent for jobs. Not only because she has a great reputation in the industry and great boats in her books but also for her care, kindness and professionalism. Very grateful to Milica for my placement onboard a very successful charter yacht!",
    name: "Vesna Coklo",
    role: "Chief Stewardess 70m+ MY",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Vesna-Coklo.jpeg",
    type: "candidate" as const,
  },
];

const faqs: FAQItem[] = [
  {
    question: "How much does yacht crew recruitment cost?",
    answer: "Our fees are success-based, meaning you only pay when we successfully place a crew member. There are no upfront costs or retainers, and we offer some of the best terms in the industry. Get in touch to learn more.",
  },
  {
    question: "How quickly can you fill a position?",
    answer: "We deliver your first batch of pre-screened candidates within 48 hours of briefing. Most positions are filled within 1-2 weeks, though senior roles like Captains may take slightly longer to ensure the perfect fit.",
  },
  {
    question: "Do you recruit for all yacht departments?",
    answer: "Yes, we cover all departments: Deck (Captains to Deckhands), Engineering (Chief Engineers to ETOs), Interior (Chief Stews to Junior Stewardesses), and Galley (Head Chefs to Crew Cooks). We also place specialized roles like AV/IT Officers and Pursers.",
  },
  {
    question: "What's included in your vetting process?",
    answer: "Every candidate undergoes comprehensive screening: certificate verification (STCW, MCA, etc.), employment history verification, reference checks from previous captains/HODs, background checks, and a personality assessment to ensure cultural fit.",
  },
  {
    question: "Do you offer a guarantee on placements?",
    answer: "Yes, we stand behind our placements with a replacement guarantee. If a placement doesn't work out, we'll find you a suitable replacement. Contact us for full terms and conditions.",
  },
  {
    question: "Can you help with last-minute or emergency crew needs?",
    answer: "Absolutely. We maintain a database of immediately available crew and can often provide candidates same-day for urgent needs. Contact us directly at +33 6 76 41 02 99 for emergency placements.",
  },
];

const steps = [
  {
    number: "01",
    title: "Detailed Brief",
    description:
      "We gather comprehensive position requirements, recognizing that every yacht and crew dynamic is unique.",
    icon: FileText,
  },
  {
    number: "02",
    title: "Candidate Vetting",
    description:
      "We assess personality, skillset, and compatibility. Full background checks and reference verification.",
    icon: Users,
  },
  {
    number: "03",
    title: "Handpicked Matches",
    description:
      "You receive thoroughly vetted professionals matched on both skills and personality fit.",
    icon: Award,
  },
];

// JSON-LD Structured Data
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Lighthouse Careers",
  url: "https://lighthouse-careers.com",
  logo: "https://lighthouse-careers.com/images/logo.png",
  description: "Premier yacht crew and private staff recruitment agency with over 20 years of industry experience.",
  foundingDate: "2020",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+33-6-76-41-02-99",
    contactType: "sales",
    availableLanguage: ["English", "French"],
  },
  sameAs: [
    "https://www.linkedin.com/company/lighthouse-careers",
  ],
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Yacht Crew Recruitment",
  description: "Professional yacht crew recruitment services for superyachts worldwide. We place Captains, Engineers, Chefs, Stewardesses, and all yacht positions.",
  provider: {
    "@type": "Organization",
    name: "Lighthouse Careers",
  },
  serviceType: "Recruitment Agency",
  areaServed: "Worldwide",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Yacht Crew Positions",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Deck Crew Recruitment" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Engineering Crew Recruitment" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Interior Crew Recruitment" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Galley Crew Recruitment" } },
    ],
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://lighthouse-careers.com" },
    { "@type": "ListItem", position: 2, name: "Yacht Crew", item: "https://lighthouse-careers.com/yacht-crew/" },
  ],
};

export default function YachtCrewPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Structured Data */}
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
            Hire vetted candidates within{" "}
            <span className="text-gold-400">24h</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300 sm:text-xl">
            Premier yacht crew recruitment trusted by 500+ yacht owners and management companies.
            From Captains to Stewardesses, we deliver pre-screened candidates fast.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href="/contact">
              <Button size="lg" className="min-w-[200px]">
                Start Receiving Applicants
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/job-board">
              <Button
                variant="secondary"
                size="lg"
                className="min-w-[200px] border-white/20 text-white hover:bg-white/10"
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

      {/* Process Section - Visual steps */}
      <section className="relative -mt-16 pb-20">
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
                  src="/images/yacht/superyacht-flyboarder.jpeg"
                  alt="Luxury superyacht with water sports activities"
                  fill
                  className="object-cover"
                />
              </div>
              {/* Decorative element */}
              <div className="absolute -bottom-6 -right-6 -z-10 h-full w-full rounded-2xl bg-gold-100" />
            </div>
            <div>
              <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
                Exceptional Crew for
                <span className="text-gold-600"> Exceptional Yachts</span>
              </h2>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                We understand that your yacht is more than just a vessel—it's a floating
                sanctuary that reflects your lifestyle and standards. Our rigorous selection
                process ensures every candidate we present embodies the professionalism,
                expertise, and service excellence your yacht deserves.
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold-500" />
                  <span className="text-gray-600">Comprehensive reference checks from previous captains and HODs</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold-500" />
                  <span className="text-gray-600">Certificate verification (STCW, MCA, ENG1, etc.)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold-500" />
                  <span className="text-gray-600">Personality and cultural fit assessment for your yacht's unique environment</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-navy-900 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
              Trusted by Yacht Professionals
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-400">
              See why captains, fleet managers, and yacht owners choose Lighthouse for their crew recruitment.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="group relative rounded-2xl border border-gold-500/20 bg-navy-700/80 p-6 backdrop-blur-sm transition-all hover:border-gold-500/40 hover:bg-navy-600/80"
              >
                {/* Header row with stars and badge */}
                <div className="mb-4 flex items-center justify-between">
                  {/* Stars */}
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-gold-400 text-gold-400"
                      />
                    ))}
                  </div>

                  {/* Type badge */}
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    testimonial.type === "client"
                      ? "bg-gold-500/20 text-gold-300"
                      : "bg-blue-500/20 text-blue-300"
                  }`}>
                    {testimonial.type === "client" ? "Hiring Manager" : "Yacht Professional"}
                  </span>
                </div>

                {/* Quote */}
                <p className="mb-6 text-gray-300 leading-relaxed line-clamp-4">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                {/* Author with avatar */}
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-gold-500/30">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-white">{testimonial.name}</div>
                    <div className="text-sm text-gold-400">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 border-t border-white/10 pt-12">
            <div className="text-center">
              <div className="font-serif text-3xl font-bold text-gold-400">4.9/5</div>
              <div className="mt-1 flex justify-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold-400 text-gold-400" />
                ))}
              </div>
              <div className="mt-1 text-sm text-gray-400">Average Rating</div>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div className="text-center">
              <div className="font-serif text-3xl font-bold text-gold-400">500+</div>
              <div className="mt-1 text-sm text-gray-400">5-Star Reviews</div>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div className="text-center">
              <div className="font-serif text-3xl font-bold text-gold-400">20+</div>
              <div className="mt-1 text-sm text-gray-400">Years of Trust</div>
            </div>
          </div>
        </div>
      </section>

      {/* Departments Section */}
      <section className="bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Section Header with Image */}
          <div className="mb-16 grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
                All Departments Covered
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                We place exceptional professionals across all yacht departments. From deck
                to engineering, galley to interior—our extensive network covers every aspect of
                superyacht crew recruitment.
              </p>
            </div>
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl shadow-xl">
              <Image
                src="/images/yacht/deck.jpg"
                alt="Professional yacht crew"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {departments.map((dept) => {
              const Icon = dept.icon;
              return (
                <div
                  key={dept.name}
                  className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100">
                    <Icon className="h-6 w-6 text-gold-600" />
                  </div>
                  <h3 className="mb-4 text-xl font-semibold text-navy-900">
                    {dept.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {dept.positions.slice(0, 6).map((position) => (
                      <span
                        key={position}
                        className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                      >
                        {position}
                      </span>
                    ))}
                    <span className="inline-flex items-center rounded-full bg-gold-100 px-3 py-1 text-xs font-medium text-gold-700">
                      & more
                    </span>
                  </div>
                  <Link
                    href={`/job-board?department=${dept.slug}`}
                    className="mt-4 inline-flex items-center text-sm font-medium text-gold-600 transition-colors hover:text-gold-700"
                  >
                    View All {dept.name} Positions
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              Why Choose Lighthouse Careers
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Two decades of experience placing exceptional talent on exceptional yachts.
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
        subtitle="Everything you need to know about our yacht crew recruitment services."
        faqs={faqs}
      />

      {/* CTA Section - Bold and prominent */}
      <section className="relative overflow-hidden bg-navy-900 py-20 sm:py-28">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-gold-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
            Ready to Find Your
            <br />
            <span className="text-gold-400">Perfect Crew?</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
            Start receiving vetted, qualified candidates within 48 hours. No upfront
            commitment, no risk.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/contact">
              <Button size="lg" className="min-w-[220px]">
                Start Receiving Applicants
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="tel:+33676410299">
              <Button
                variant="secondary"
                size="lg"
                className="min-w-[220px] border-white/20 text-white hover:bg-white/10"
              >
                Call +33 6 76 41 02 99
              </Button>
            </a>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
