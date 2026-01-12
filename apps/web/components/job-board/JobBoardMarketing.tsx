"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  CheckCircle,
  Briefcase,
  Ship,
  Globe,
  Home,
  Shield,
  Zap,
  Target,
  Users,
  ArrowRight,
  Lock,
  Star,
  TrendingUp,
  Clock,
  UserPlus,
  Search,
  FileText,
} from "lucide-react";
import { PublicHeader } from "@/components/pricing/PublicHeader";
import { Logo } from "@/components/ui/Logo";
import { Testimonials, type Testimonial } from "@/components/marketing/Testimonials";
import { FAQSection, type FAQItem } from "@/components/marketing/FAQSection";
import { ExitIntent } from "@/components/marketing/ExitIntent";
import { StickyCTA } from "@/components/marketing/StickyCTA";
import type { PublicJob } from "./JobBoardCard";

interface FilterOptions {
  positions: string[];
  contractTypes: string[];
}

interface JobBoardMarketingProps {
  jobs: PublicJob[];
  filterOptions: FilterOptions;
  totalCount: number;
  postedToday: number;
}

const stats = [
  { value: "300+", label: "Placements/Year" },
  { value: "500+", label: "Satisfied Clients" },
  { value: "48hrs", label: "Avg. Response Time" },
  { value: "2-4wks", label: "Avg. Time to Hire" },
];

const benefits = [
  {
    icon: Zap,
    title: "AI-Powered Matching",
    description: "Get personalized job recommendations based on your skills, experience, and preferences.",
  },
  {
    icon: Shield,
    title: "Verified Employers Only",
    description: "No scams, no fake listings. Every employer is verified and trusted by top recruitment agencies.",
  },
  {
    icon: Target,
    title: "Direct Application",
    description: "Apply directly to top agencies and employers. Skip the middleman and get faster responses.",
  },
  {
    icon: TrendingUp,
    title: "Match Score for Each Job",
    description: "See how well you match each position before applying. Save time and focus on the best opportunities.",
  },
  {
    icon: FileText,
    title: "Career Tracking",
    description: "Track your applications, save favorite jobs, and monitor your career progression all in one place.",
  },
  {
    icon: Users,
    title: "Free Forever",
    description: "No hidden fees, no subscriptions. Access all features completely free as a candidate.",
  },
  {
    icon: Star,
    title: "20+ Years of Trust",
    description: "Since 2002, we've placed hundreds of professionals in top positions worldwide. Our reputation is built on results.",
  },
];

const steps = [
  {
    icon: UserPlus,
    title: "Sign Up Free",
    description: "Create your account in 2 minutes. No credit card required.",
    number: "1",
  },
  {
    icon: FileText,
    title: "Complete Your Profile",
    description: "Add your experience, skills, and preferences to get better job matches.",
    number: "2",
  },
  {
    icon: Search,
    title: "Browse & Apply",
    description: "Explore matched jobs and apply directly to top employers with one click.",
    number: "3",
  },
];

const testimonials: Testimonial[] = [
  {
    quote: "I had been looking for the right rotational Captain position for a while, and Milica helped me secure it, thank you Milica!",
    author: "Rick DuBois",
    role: "Captain 70m+ MY",
    rating: 5,
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Rick-DuBois.png",
  },
  {
    quote: "I just wanted you to send you a little message to say that I am the happiest I have ever been on a boat, and in 8 years that is saying something! So thank you very much for how honest you were with me when my options were in front of me and for helping me secure my dream job, you have made all the difference!",
    author: "Laura O'Keeffe",
    role: "SPA Therapist",
    rating: 5,
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Laura.png",
  },
  {
    quote: "Milica and Lighthouse Careers offers an excellent, personable and professional service. Following our initial interview, Milica worked tirelessly to secure me rotational Masters role on a SuperYacht, and I wouldn't hesitate in recommending her to fellow Captains.",
    author: "Adam Virik",
    role: "Captain 60m+ MY",
    rating: 5,
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/decran.png",
  },
  {
    quote: "During current times where communication has become more and more technology-centric, Lighthouse Careers approach to call and speak one-on-one made them stand out from other Agencies. Their genuine approach and time took to sincerely listen and understand both candidates' individual career goals, history and skillset, and the Employer's needs, requirements and onboard crew culture resulted in a very successful match on all fronts.",
    author: "Brianna Stenhouse",
    role: "Chief Stewardess M/Y GLOBAL",
    rating: 5,
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Brianna.png",
  },
  {
    quote: "Throughout my 11 years in yachting, I have found Milica to be my go-to agent for jobs. Not only because she has a great reputation in the industry and great boats in her books but also for her care, kindness and professionalism. Very grateful to Milica for my placement onboard a very successful charter yacht during these uncertain times!",
    author: "Vesna Coklo",
    role: "Chief Stewardess 70m+ MY",
    rating: 5,
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Vesna-Coklo.jpeg",
  },
  {
    quote: "I wanted to thank Milica for her help in finding me the perfect role. I feel like I can contact her anytime and she is very supportive and helpful. She listens and understands the role you are looking for. I would highly recommend her to anyone from starting out in the industry to experienced candidates.",
    author: "Megan Brooksby",
    role: "Chief Stewardess 65m MY",
    rating: 5,
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Megan-Brooksby.png",
  },
  {
    quote: "Thank you for helping me secure great rotational Chief Officer position on 100m+ MY, I could not be happier!",
    author: "Jaksa Sain",
    role: "Chief Officer 100m+ MY",
    rating: 5,
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Jaksa-Sain.png",
  },
  {
    quote: "Milica placed me on my first yacht when I joined the industry, matching my land-based experience perfectly with the vessel. Since then, she has supported my career and seen me move to Chief Stewardess working within larger operations. She can always be relied on to send well-vetted, position-appropriate candidates.",
    author: "Stephanie Wells",
    role: "Chief Stewardess 100m+ M/Y",
    rating: 5,
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Stephanie-Wells.png",
  },
  {
    quote: "I would like to express mine at most gratitude for the placement of my current position as Interior Manager on a 100+ m yacht. All was well organised and monitored from your side. Great communication between the yacht, yourself and me. Everything was handled with confidentiality on every level.",
    author: "Mathieu Barbe",
    role: "Interior Manager, Project ENZO",
    rating: 5,
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Mathieu-Barbe.png",
  },
];

const faqs: FAQItem[] = [
  {
    question: "Is it really free?",
    answer:
      "Yes! Creating an account and browsing jobs is completely free for candidates. There are no hidden fees, no subscriptions, and no charges for applying to jobs. We're committed to helping you find your next role at no cost.",
  },
  {
    question: "What types of jobs are available?",
    answer:
      "We specialize in luxury yacht crew and private household positions. This includes roles like Captain, Chef, Butler, Estate Manager, Nanny, Stewardess, Deckhand, Engineer, and many more. Jobs range from entry-level to senior management positions across the globe.",
  },
  {
    question: "How does AI matching work?",
    answer:
      "Our AI analyzes your profile, experience, skills, and preferences to match you with relevant job opportunities. Each job shows a match score indicating how well it aligns with your background. This helps you focus on the positions where you're most likely to succeed.",
  },
  {
    question: "Can I apply directly to jobs?",
    answer:
      "Absolutely! Once you sign up, you can apply directly to any job posting with one click. Your application goes straight to the employer or recruitment agency, ensuring fast response times and direct communication.",
  },
  {
    question: "Are the employers verified?",
    answer:
      "Yes, all employers and recruitment agencies on our platform are verified. We work only with trusted partners in the industry, so you can be confident that every job listing is legitimate and from a reputable source.",
  },
  {
    question: "How quickly will I hear back after applying?",
    answer:
      "Response times vary by employer, but most respond within 48-72 hours. Our direct application system ensures your profile reaches the right people quickly, and you can track the status of all your applications in your dashboard.",
  },
  {
    question: "How do I know if I'm qualified for these positions?",
    answer:
      "Each job listing shows clear requirements and our AI matching system provides a compatibility score when you create a profile. You'll see which positions best match your experience, skills, and preferences. Don't worry about being perfect - we work with candidates at all experience levels, from entry positions to senior leadership roles.",
  },
  {
    question: "What happens after I apply?",
    answer:
      "Within 24-48 hours, the hiring agency will review your profile. If it's a good match, they'll reach out directly for an interview. You can track all your application statuses in your dashboard and receive email notifications for any updates.",
  },
  {
    question: "Can I browse jobs while still employed?",
    answer:
      "Absolutely! Your profile is completely confidential. You control who sees your information, and we never share your details without your explicit permission. Many of our candidates search while employed, especially those looking for rotational positions.",
  },
  {
    question: "How long does it typically take to get hired?",
    answer:
      "Most successful placements happen within 2-4 weeks, though urgent positions can be filled in days. Our average response time from application to first interview is 48 hours. The timeline depends on the role, your availability, and the employer's needs.",
  },
];

export function JobBoardMarketing({ jobs, filterOptions, totalCount, postedToday }: JobBoardMarketingProps) {
  const pathname = usePathname();
  const redirectPath = pathname || "/job-board";
  const signUpUrl = `/auth/register?redirect=${encodeURIComponent(redirectPath)}`;
  const signInUrl = `/auth/login?redirect=${encodeURIComponent(redirectPath)}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <ExitIntent />
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Logo size="md" />
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href={signInUrl}
                className="text-sm font-medium text-navy-600 hover:text-navy-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href={signUpUrl}
                className="rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-5 py-2.5 text-sm font-medium text-white hover:from-gold-600 hover:to-gold-700 transition-all shadow-lg hover:shadow-xl"
              >
                Join Now
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-28 pb-16">
        {/* Rich navy gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-800 via-navy-900 to-[#0c1525]" />

        {/* Warm champagne ambient light from top */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(195,165,120,0.15),transparent_60%)]" />

        {/* Subtle side accents for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_0%_50%,rgba(195,165,120,0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_100%_50%,rgba(195,165,120,0.06),transparent_50%)]" />

        {/* Art Deco sunburst pattern */}
        <div className="absolute inset-0 opacity-[0.15]">
          <svg
            className="h-full w-full"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <radialGradient id="sunburst-fade-marketing" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#C3A578" stopOpacity="1" />
                <stop offset="100%" stopColor="#C3A578" stopOpacity="0.3" />
              </radialGradient>
            </defs>
            <g stroke="url(#sunburst-fade-marketing)" strokeWidth="0.5" fill="none">
              {[...Array(36)].map((_, i) => {
                const angle = i * 10 * (Math.PI / 180);
                const x2 = Math.round((50 + 70 * Math.cos(angle)) * 100) / 100;
                const y2 = Math.round((50 + 70 * Math.sin(angle)) * 100) / 100;
                return (
                  <line key={i} x1="50%" y1="50%" x2={`${x2}%`} y2={`${y2}%`} />
                );
              })}
            </g>
            <circle
              cx="50%"
              cy="50%"
              r="15%"
              fill="none"
              stroke="#C3A578"
              strokeWidth="0.3"
              opacity="0.5"
            />
            <circle
              cx="50%"
              cy="50%"
              r="30%"
              fill="none"
              stroke="#C3A578"
              strokeWidth="0.3"
              opacity="0.4"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="#C3A578"
              strokeWidth="0.3"
              opacity="0.3"
            />
          </svg>
        </div>

        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            {/* Elegant badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-5 py-2.5 text-sm font-medium text-gold-300 mb-8 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              {totalCount > 0 ? `${totalCount}+ Open Positions` : "Elite Positions Available"}
            </div>

            <h1 className="font-cormorant text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-white mb-6">
              Access Elite Yacht & Private
              <span className="block text-gradient-gold">Household Jobs</span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-white/90 sm:text-xl mb-6">
              Become one of our top talents. AI-powered matching, verified employers, and access to exclusive roles. Free forever.
            </p>
            
            {/* Job Stats */}
            <p className="mx-auto max-w-2xl text-base text-gold-300 sm:text-lg mb-10 font-medium">
              {totalCount > 0 ? `${totalCount} Active Listings / ${postedToday} Posted Today` : "Elite Positions Available"}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <Link
                href={signUpUrl}
                className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-gold-500 to-gold-600 px-8 py-4 text-base font-semibold text-white hover:from-gold-600 hover:to-gold-700 transition-all shadow-2xl hover:shadow-gold-500/50 flex items-center justify-center gap-2"
              >
                Sign Up Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href={signInUrl}
                className="w-full sm:w-auto rounded-2xl border-2 border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white hover:bg-white/20 backdrop-blur-sm transition-all"
              >
                Sign In
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <CheckCircle className="h-4 w-4 text-gold-400 flex-shrink-0" />
                <span>Verified Employers</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Ship className="h-4 w-4 text-gold-400 flex-shrink-0" />
                <span>Yacht Positions</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Home className="h-4 w-4 text-gold-400 flex-shrink-0" />
                <span>Private Estates</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Globe className="h-4 w-4 text-gold-400 flex-shrink-0" />
                <span>Global Opportunities</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Briefcase className="h-4 w-4 text-gold-400 flex-shrink-0" />
                <span>Direct Apply</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Job Stats Section */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-gold-600 mb-2">
                {totalCount > 0 ? `${totalCount}+` : "1000+"}
              </div>
              <div className="text-lg font-semibold text-navy-900">Active Job Listings</div>
              <div className="text-sm text-gray-600 mt-1">Growing daily</div>
            </div>
            <div className="hidden sm:block w-px h-16 bg-gray-200" />
            <div className="text-center">
              <div className="text-5xl font-bold text-gold-600 mb-2">
                {postedToday > 0 ? postedToday : "10+"}
              </div>
              <div className="text-lg font-semibold text-navy-900">Posted Today</div>
              <div className="text-sm text-gray-600 mt-1">Apply before they're filled</div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl mb-4">
              Why Choose Lighthouse Careers?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to find your next elite position, all in one place
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100 mb-4">
                    <Icon className="h-6 w-6 text-gold-600" />
                  </div>
                  <h3 className="font-semibold text-navy-900 text-lg mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-navy-900">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-gold-400 mb-2">{stat.value}</div>
                <div className="text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <Testimonials
            title="What Our Candidates Say"
            subtitle="Join thousands of professionals who found their dream role through Lighthouse Careers"
            testimonials={testimonials}
            variant="dark"
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get started in minutes and find your next role faster
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, idx) => {
              return (
                <div key={idx} className="relative">
                  {/* Connector line */}
                  {idx < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r from-gold-400 to-gold-300 -z-10" />
                  )}
                  <div className="bg-gradient-to-br from-navy-50 to-gray-50 rounded-2xl p-8 border border-gray-200 text-center hover:shadow-md transition-shadow">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-gold-600 text-white font-bold text-2xl mb-6">
                      {step.number}
                    </div>
                    <h3 className="font-semibold text-navy-900 text-lg mb-3">{step.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about using Lighthouse Careers"
        faqs={faqs}
      />

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-navy-900 via-navy-800 to-[#0c1525]">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-5 py-2.5 text-sm font-medium text-gold-300 mb-8 backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            Join 300+ Placements/Year
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-white mb-6">
            Ready to Find Your Next Elite Position?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={signUpUrl}
              className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-gold-500 to-gold-600 px-10 py-5 text-lg font-semibold text-white hover:from-gold-600 hover:to-gold-700 transition-all shadow-2xl hover:shadow-gold-500/50 flex items-center justify-center gap-2"
            >
              Sign Up Free Now
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href={signInUrl}
              className="w-full sm:w-auto rounded-2xl border-2 border-white/30 bg-white/10 px-10 py-5 text-lg font-semibold text-white hover:bg-white/20 backdrop-blur-sm transition-all"
            >
              Already have an account? Sign In
            </Link>
          </div>
          <p className="mt-8 text-sm text-gray-400">
            <Clock className="inline h-4 w-4 mr-1" />
            New jobs posted daily • Free forever • No commitment
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Logo size="sm" />
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Lighthouse Crew Network. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-navy-600 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-gray-500 hover:text-navy-600 transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="text-sm text-gray-500 hover:text-navy-600 transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
      <StickyCTA />
    </div>
  );
}

