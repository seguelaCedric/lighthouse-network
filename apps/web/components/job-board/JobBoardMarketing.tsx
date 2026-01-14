"use client";

import React, { useState } from "react";
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
import { PublicHeader, PublicFooter } from "@/components/pricing";
import { Testimonials, type Testimonial } from "@/components/marketing/Testimonials";
import { FAQSection, type FAQItem } from "@/components/marketing/FAQSection";
import { ExitIntent } from "@/components/marketing/ExitIntent";
import { StickyCTA } from "@/components/marketing/StickyCTA";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PublicJob } from "./JobBoardCard";
import { cn } from "@/lib/utils";

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
  { value: "24hrs", label: "Avg. Response Time" },
  { value: "2-4wks", label: "Avg. Time to Hire" },
];

// Feature dialog content for "Why Choose" cards
const featureDialogContent: Record<string, {
  title: string;
  icon: typeof Zap;
  iconColor: string;
  description: string;
  details: Array<{
    heading: string;
    content?: string;
    bullets?: string[];
  }>;
}> = {
  "ai-matching": {
    title: "AI-Powered Matching",
    icon: Zap,
    iconColor: "purple",
    description: "Our intelligent matching system analyzes your profile to find the perfect opportunities.",
    details: [
      {
        heading: "How It Works",
        content: "Our AI analyzes your skills, experience, preferences, and career goals to match you with relevant positions. The more you interact with the platform, the smarter the recommendations become."
      },
      {
        heading: "What We Analyze",
        bullets: [
          "Your professional experience and skills",
          "Desired location and mobility preferences",
          "Salary expectations and benefits requirements",
          "Career trajectory and growth goals",
          "Work style and cultural fit indicators"
        ]
      },
      {
        heading: "Benefits",
        bullets: [
          "Save time - see only relevant opportunities",
          "Discover positions you might have missed",
          "Get better matches as the system learns",
          "Receive instant notifications for new matches"
        ]
      }
    ]
  },
  "expert-recruitment": {
    title: "Expert Recruitment",
    icon: Shield,
    iconColor: "emerald",
    description: "Every opportunity and employer is personally vetted by our experienced recruitment team.",
    details: [
      {
        heading: "Our Vetting Process",
        content: "Before any position appears on our board, our team conducts thorough verification to ensure legitimacy, quality, and safety for our candidates."
      },
      {
        heading: "What We Verify",
        bullets: [
          "Employer identity and business credentials",
          "Job posting accuracy and legitimacy",
          "Compensation fairness and market rates",
          "Workplace conditions and safety standards",
          "Employer reputation in the industry"
        ]
      },
      {
        heading: "Your Protection",
        bullets: [
          "No fake or scam job postings",
          "Verified employer contact information",
          "Accurate job descriptions and requirements",
          "Fair compensation packages",
          "Safe and professional work environments"
        ]
      }
    ]
  },
  "personal-matching": {
    title: "Personal Matching & Introduction",
    icon: Target,
    iconColor: "blue",
    description: "We don't just show you jobs - we personally introduce you to the right employers.",
    details: [
      {
        heading: "How Personal Matching Works",
        content: "Our recruitment specialists review your profile and actively match you with suitable positions, then personally introduce you to employers with a warm referral."
      },
      {
        heading: "What We Do",
        bullets: [
          "Review your profile with expert eyes",
          "Identify opportunities that fit your goals",
          "Contact employers on your behalf",
          "Provide warm introductions with context",
          "Facilitate initial conversations"
        ]
      },
      {
        heading: "Your Advantage",
        bullets: [
          "Skip the 'cold apply' process",
          "Get noticed faster by employers",
          "Professional representation",
          "Insider advocacy for your candidacy",
          "Higher response and interview rates"
        ]
      }
    ]
  },
  "exclusive-access": {
    title: "Exclusive Access to Hidden Opportunities",
    icon: TrendingUp,
    iconColor: "rose",
    description: "Access elite positions that aren't advertised publicly.",
    details: [
      {
        heading: "Why Jobs Aren't Always Public",
        content: "Many premium employers prefer discretion when hiring. They work exclusively with trusted recruiters to find candidates without public job postings."
      },
      {
        heading: "What You'll Access",
        bullets: [
          "Confidential searches for high-profile vessels",
          "Private household positions for UHNW families",
          "Executive crew roles on superyachts",
          "Replacement positions before they're vacant",
          "Off-market opportunities shared only with us"
        ]
      },
      {
        heading: "Your Competitive Edge",
        bullets: [
          "Less competition - positions not on job boards",
          "First access to premium opportunities",
          "Access to UHNW and celebrity employers",
          "Early notification before market saturation",
          "Exclusive consideration for top roles"
        ]
      }
    ]
  },
  "career-support": {
    title: "Comprehensive Career Support",
    icon: FileText,
    iconColor: "amber",
    description: "Ongoing guidance throughout your job search and beyond.",
    details: [
      {
        heading: "What Support You Get",
        content: "Our team provides personalized support at every stage of your career journey, from initial search through onboarding and beyond."
      },
      {
        heading: "Services Included",
        bullets: [
          "Resume and CV optimization for yacht/private sector",
          "Interview preparation and coaching",
          "Salary negotiation guidance",
          "Reference checking support",
          "Contract review assistance",
          "Onboarding guidance"
        ]
      },
      {
        heading: "Long-Term Partnership",
        bullets: [
          "Career development advice",
          "Industry insights and trends",
          "Professional growth recommendations",
          "Alumni network access",
          "Ongoing support for your next move"
        ]
      }
    ]
  }
};

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
      "Response times vary by employer, but most respond within 24-48 hours. Our direct application system ensures your profile reaches the right people quickly, and you can track the status of all your applications in your dashboard.",
  },
  {
    question: "How do I know if I'm qualified for these positions?",
    answer:
      "Each job listing shows clear requirements and our AI matching system provides a compatibility score when you create a profile. You'll see which positions best match your experience, skills, and preferences. Don't worry about being perfect - we work with candidates at all experience levels, from entry positions to senior leadership roles.",
  },
  {
    question: "What happens after I apply?",
    answer:
      "Within 24 hours, the hiring agency will review your profile. If it's a good match, they'll reach out directly for an interview. You can track all your application statuses in your dashboard and receive email notifications for any updates.",
  },
  {
    question: "Can I browse jobs while still employed?",
    answer:
      "Absolutely! Your profile is completely confidential. You control who sees your information, and we never share your details without your explicit permission. Many of our candidates search while employed, especially those looking for rotational positions.",
  },
  {
    question: "How long does it typically take to get hired?",
    answer:
      "Most successful placements happen within 2-4 weeks, though urgent positions can be filled in days. Our average response time from application to first interview is 24 hours. The timeline depends on the role, your availability, and the employer's needs.",
  },
];

export function JobBoardMarketing({ jobs, filterOptions, totalCount, postedToday }: JobBoardMarketingProps) {
  const pathname = usePathname();
  const redirectPath = pathname || "/job-board";
  const signUpUrl = `/auth/register?redirect=${encodeURIComponent(redirectPath)}`;
  const signInUrl = `/auth/login?redirect=${encodeURIComponent(redirectPath)}`;

  // State for feature dialog
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <ExitIntent />
      {/* Header */}
      <PublicHeader />

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
              Premium Job Board
            </div>

            <h1 className="font-cormorant text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-white mb-6">
              Access Elite <span className="text-gradient-gold">Yacht</span> & Private
              <span className="block text-gradient-gold">Household Jobs</span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-white/90 sm:text-xl mb-6">
              Connect with top employers through our expert recruitment service. AI-powered matching, exclusive positions, personal support. Free forever.
            </p>
            
            {/* Job Stats */}
            <p className="mx-auto max-w-2xl text-base text-gold-300 sm:text-lg mb-10 font-medium">
              100+ Active Jobs / {postedToday > 0 ? `${postedToday}` : "10+"} Posted Today
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

      {/* Value Proposition Section */}
      <section className="py-24 lg:py-32 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gold-500 rounded-full filter blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-navy-800 rounded-full filter blur-3xl" />
        </div>

        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-5 py-2 text-sm font-medium text-gold-600 mb-6 backdrop-blur-sm">
              <Star className="h-4 w-4" />
              Premium Features
            </div>
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl lg:text-5xl mb-4">
              Why Choose Lighthouse Careers?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to find your next elite position, all in one place
            </p>
          </div>

          {/* Feature Cards Grid - matching homepage style */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* AI-Powered Matching - Dialog */}
            <div
              onClick={() => setOpenDialog('ai-matching')}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-purple-500/50 hover:-translate-y-1">
                <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-purple-500/10 transition-transform group-hover:scale-150" aria-hidden="true" />
                <div className="relative">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                    <Zap className="h-6 w-6 text-purple-600" aria-hidden="true" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-navy-900 mb-2">AI-Powered Matching</h3>
                  <p className="text-gray-600 text-sm mb-4">Get personalized job recommendations based on your skills and experience.</p>
                  <div className="flex items-center text-purple-600 font-medium text-sm group-hover:gap-2 transition-all">
                    <span>Learn more</span>
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>

            {/* Expert Recruitment - Dialog */}
            <div
              onClick={() => setOpenDialog('expert-recruitment')}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-emerald-500/50 hover:-translate-y-1">
                <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-emerald-500/10 transition-transform group-hover:scale-150" aria-hidden="true" />
                <div className="relative">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Shield className="h-6 w-6 text-emerald-600" aria-hidden="true" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-navy-900 mb-2">Expert Recruitment</h3>
                  <p className="text-gray-600 text-sm mb-4">We personally vet every opportunity and employer for your peace of mind.</p>
                  <div className="flex items-center text-emerald-600 font-medium text-sm group-hover:gap-2 transition-all">
                    <span>Learn more</span>
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Matching - Dialog */}
            <div
              onClick={() => setOpenDialog('personal-matching')}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-blue-500/50 hover:-translate-y-1">
                <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-blue-500/10 transition-transform group-hover:scale-150" aria-hidden="true" />
                <div className="relative">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                    <Target className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-navy-900 mb-2">Personal Matching</h3>
                  <p className="text-gray-600 text-sm mb-4">We match you with the right roles and introduce you directly to employers.</p>
                  <div className="flex items-center text-blue-600 font-medium text-sm group-hover:gap-2 transition-all">
                    <span>Learn more</span>
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>

            {/* Exclusive Access - Dialog */}
            <div
              onClick={() => setOpenDialog('exclusive-access')}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-rose-500/50 hover:-translate-y-1">
                <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-rose-500/10 transition-transform group-hover:scale-150" aria-hidden="true" />
                <div className="relative">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10">
                    <TrendingUp className="h-6 w-6 text-rose-600" aria-hidden="true" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-navy-900 mb-2">Exclusive Access</h3>
                  <p className="text-gray-600 text-sm mb-4">Get access to elite positions not advertised anywhere else.</p>
                  <div className="flex items-center text-rose-600 font-medium text-sm group-hover:gap-2 transition-all">
                    <span>Learn more</span>
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>

            {/* Career Support - Dialog */}
            <div
              onClick={() => setOpenDialog('career-support')}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-amber-500/50 hover:-translate-y-1">
                <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-amber-500/10 transition-transform group-hover:scale-150" aria-hidden="true" />
                <div className="relative">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                    <FileText className="h-6 w-6 text-amber-600" aria-hidden="true" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-navy-900 mb-2">Career Support</h3>
                  <p className="text-gray-600 text-sm mb-4">Ongoing guidance throughout your job search and placement journey.</p>
                  <div className="flex items-center text-amber-600 font-medium text-sm group-hover:gap-2 transition-all">
                    <span>Learn more</span>
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>

            {/* Free Forever - Emphasized */}
            <Link href={signUpUrl} className="group">
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-gold-500/50 hover:-translate-y-1">
                <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-gold-500/10 transition-transform group-hover:scale-150" aria-hidden="true" />
                <div className="relative">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/10">
                    <Users className="h-6 w-6 text-gold-600" aria-hidden="true" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-navy-900 mb-2">Free Forever</h3>
                  <p className="text-gray-600 text-sm mb-4">No hidden fees, no subscriptions. All features free for candidates.</p>
                  <div className="flex items-center text-gold-600 font-medium text-sm group-hover:gap-2 transition-all">
                    <span>Get started</span>
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof Section - Testimonials with Stats */}
      <Testimonials
        title="What Our Candidates Say"
        subtitle="Join thousands of professionals who found their dream role through Lighthouse Careers"
        testimonials={testimonials}
        variant="dark"
        pattern="diamond"
        showStats={true}
        stats={stats}
      />

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-b from-navy-900/5 via-navy-800/5 to-white relative">
        {/* Subtle top gradient for seamless transition */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white to-transparent" />
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
      <PublicFooter />
      <StickyCTA />

      {/* Feature Information Dialog */}
      <Dialog open={openDialog !== null} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {openDialog && featureDialogContent[openDialog] && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "inline-flex h-12 w-12 items-center justify-center rounded-xl",
                    featureDialogContent[openDialog].iconColor === "purple" && "bg-purple-500/10",
                    featureDialogContent[openDialog].iconColor === "emerald" && "bg-emerald-500/10",
                    featureDialogContent[openDialog].iconColor === "blue" && "bg-blue-500/10",
                    featureDialogContent[openDialog].iconColor === "rose" && "bg-rose-500/10",
                    featureDialogContent[openDialog].iconColor === "amber" && "bg-amber-500/10"
                  )}>
                    {React.createElement(featureDialogContent[openDialog].icon, {
                      className: cn(
                        "h-6 w-6",
                        featureDialogContent[openDialog].iconColor === "purple" && "text-purple-600",
                        featureDialogContent[openDialog].iconColor === "emerald" && "text-emerald-600",
                        featureDialogContent[openDialog].iconColor === "blue" && "text-blue-600",
                        featureDialogContent[openDialog].iconColor === "rose" && "text-rose-600",
                        featureDialogContent[openDialog].iconColor === "amber" && "text-amber-600"
                      )
                    })}
                  </div>
                  <DialogTitle className="text-2xl font-serif">
                    {featureDialogContent[openDialog].title}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-base text-gray-600">
                  {featureDialogContent[openDialog].description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {featureDialogContent[openDialog].details.map((section, idx) => (
                  <div key={idx}>
                    <h3 className="font-semibold text-lg text-navy-900 mb-2">
                      {section.heading}
                    </h3>
                    {section.content && (
                      <p className="text-gray-600 leading-relaxed">
                        {section.content}
                      </p>
                    )}
                    {section.bullets && (
                      <ul className="space-y-2 mt-2">
                        {section.bullets.map((bullet, bidx) => (
                          <li key={bidx} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              <DialogFooter className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setOpenDialog(null)}
                >
                  Close
                </Button>
                <Link href={signUpUrl}>
                  <Button className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700">
                    Sign Up Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

