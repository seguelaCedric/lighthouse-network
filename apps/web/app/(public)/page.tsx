"use client";

import Link from "next/link";
import Image from "next/image";
import { PublicHeader } from "@/components/pricing/PublicHeader";
import { PublicFooter } from "@/components/pricing/PublicFooter";
import { AudienceSplit } from "@/components/marketing/AudienceSplit";
import { LeadCapture } from "@/components/marketing/LeadCapture";
import { UrgencyBanner } from "@/components/marketing/UrgencyBanner";
import { ProblemAgitate } from "@/components/marketing/ProblemAgitate";
import { ExitIntent } from "@/components/marketing/ExitIntent";
import { StickyCTA } from "@/components/marketing/StickyCTA";
import { Button } from "@/components/ui/button";
import {
  Anchor,
  Ship,
  Home,
  Users,
  Award,
  Clock,
  Shield,
  Eye,
  Heart,
  ArrowRight,
  CheckCircle,
  Star,
  Briefcase,
  UserPlus,
  Search,
  Quote,
  Phone,
  Check,
  Zap,
} from "lucide-react";

const stats = [
  { value: "500+", label: "Satisfied Clients" },
  { value: "300+", label: "Placements/Year" },
  { value: "50+", label: "Countries" },
  { value: "20+", label: "Years of Trust" },
];

const benefits = [
  {
    icon: Shield,
    title: "No Risk",
    description: "Receive great talents today without any upfront engagement or commitment.",
  },
  {
    icon: Clock,
    title: "Efficiency",
    description: "Immediate search and applicant delivery - we work fast to fill your positions.",
  },
  {
    icon: Eye,
    title: "Transparency",
    description: "Progress updates throughout the process so you always know where things stand.",
  },
  {
    icon: Heart,
    title: "Integrity",
    description: "Only thoroughly vetted candidates who meet our rigorous standards.",
  },
];

const steps = [
  {
    icon: UserPlus,
    title: "Create an Account",
    description: "Register with us in minutes and tell us about your requirements.",
  },
  {
    icon: Search,
    title: "Browse Opportunities",
    description: "Access our job board or let us match you with the perfect position.",
  },
  {
    icon: Briefcase,
    title: "Apply in Seconds",
    description: "One-click applications to your dream yacht or household position.",
  },
];

const testimonials = [
  // Client testimonials (hiring managers)
  {
    quote: "I wanted to say a few words of thanks for your all your time and efforts over the past few years, working on behalf of Axioma and indeed the other vessels I have worked on. You and your team has always been a massive help in trying to help find us the right candidate for the right job in this ever expanding and delicate industry.",
    name: "Tom Filby",
    role: "Captain M/Y Axioma",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Capture-decran-2020-02-23-a-12.27.53-150x150-1.png",
    type: "client",
  },
  {
    quote: "I've had the pleasure of knowing Milica, and using her recruitment services for many years. Her attention to what I'm looking for in a crew member, fast response and flexibility and understanding of feedback has always impressed me, and I look forward to continuing working with her and Lighthouse Careers.",
    name: "Carl Westerlund",
    role: "Captain 101m M/Y",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Carl-Westerlund.png",
    type: "client",
  },
  {
    quote: "Milica is always my first call when looking for new crew. Milica helped me get my first command 3 years ago and ever since has supplied me with great candidates for all positions onboard. I can always rely on her judgement and honesty on potential crew and to act fast when I need. I wish her luck with this new venture and look forward to a continued professional affiliation.",
    name: "Mark Sinnatt",
    role: "Captain M/Y GLOBAL",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Mark-Sinnatt.png",
    type: "client",
  },
  {
    quote: "Milica and I have known each other for several years. She never dropped her standards of recruitment over the time. Due to her industry knowledge, great candidates she has provided over the years and great sense of urgency and limitations a yacht can have, I decided to reintroduce and appoint Milica's agency to represent our fleet of yachts in the yacht recruitment world. In no time she gained a thorough understanding of our new management structure and fleet needs. Having closely monitored her interactions with my on board teams before and during the summer season, it has certainly proved to be a great partnership.",
    name: "Alina C.",
    role: "Owner's Fleet Representative",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Alina-C.png",
    type: "client",
  },
  {
    quote: "I have known Milica for over a decade. In that time I have come to value her judgement and advice on Crew Recruitment. She has placed a number of candidates on my commands and she has also helped me secure my dream job! We have always had an excellent working relationship and I feel if I was more of an Antibes based Captain we would have been very good friends. I feel that she is discreet, honest and professional and that she will take this new venture on to become a reliable Crew Recruitment tool for any professional Captain.",
    name: "Dùghall MacLachlainn",
    role: "Captain",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Milica.jpeg",
    type: "client",
  },
  {
    quote: "Milica and I go back for nearly 7 years to the times when I started my journey in the yachting industry. During this time, we have been able to assist each other on various cases and tables have turned few times, depending on me looking for a new challenge or recruiting my own team. Milica has always treated my staff requests with uttermost confidence and care. Not only she has found me some fantastic people to work with but we have also managed to handle sensitive situations with respect and dignity.",
    name: "Meeli Lepik",
    role: "Interior Manager, Project ENZO",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Meeli-Lepik.png",
    type: "client",
  },
  // Candidate testimonials (yacht crew professionals)
  {
    quote: "Milica and Lighthouse Careers offers an excellent, personable and professional service. Following our initial interview, Milica worked tirelessly to secure me rotational Masters role on a SuperYacht, and I wouldn't hesitate in recommending her to fellow Captains.",
    name: "Adam Virik",
    role: "Captain 60m+ MY",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/decran.png",
    type: "candidate",
  },
  {
    quote: "I had been looking for the right rotational Captain position for a while, and Milica helped me secure it, thank you Milica!",
    name: "Rick DuBois",
    role: "Captain 70m+ MY",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Rick-DuBois.png",
    type: "candidate",
  },
  {
    quote: "I just wanted you to send you a little message to say that I am the happiest I have ever been on a boat, and in 8 years that is saying something! So thank you very much for how honest you were with me when my options were in front of me and for helping me secure my dream job, you have made all the difference!",
    name: "Laura O'Keeffe",
    role: "SPA Therapist",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Laura.png",
    type: "candidate",
  },
  {
    quote: "During current times where communication has become more and more technology-centric, Lighthouse Careers approach to call and speak one-on-one made them stand out from other recruitment services. Their genuine approach and time took to sincerely listen and understand both candidates' individual career goals, history and skillset, and the Employer's needs, requirements and onboard crew culture resulted in a very successful match on all fronts. After securing me a new Chief stewardess role, Lighthouse Careers attention and care for detail were further reflected in presenting only high calibre candidates that satisfied our search criteria.",
    name: "Brianna Stenhouse",
    role: "Chief Stewardess M/Y GLOBAL",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Brianna.png",
    type: "candidate",
  },
  {
    quote: "Throughout my 11 years in yachting, I have found Milica to be my go-to agent for jobs. Not only because she has a great reputation in the industry and great boats in her books but also for her care, kindness and professionalism. Very grateful to Milica for my placement onboard a very successful charter yacht during these uncertain times!",
    name: "Vesna Coklo",
    role: "Chief Stewardess 70m+ MY",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Vesna-Coklo.jpeg",
    type: "candidate",
  },
  {
    quote: "Thank you for thinking of us for the position as private island managers. We were very pleased when we got offered the position as it's been a long time dream of ours!",
    name: "Dean And Jen",
    role: "Private Island Managers",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Capture-decran-2019-12-12-a-07.26.59-150x150-1.png",
    type: "candidate",
  },
  {
    quote: "I wanted to thank Milica for her help in finding me the perfect role. I feel like I can contact her anytime and she is very supportive and helpful. She listens and understands the role you are looking for. I would highly recommend her to anyone from starting out in the industry to experienced candidates. I am now using Milica to help me find my team and it's always a pleasure to work with her. A big thank you to her and her team at Lighthouse careers.",
    name: "Megan Brooksby",
    role: "Chief Stewardess 65m MY",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Megan-Brooksby.png",
    type: "candidate",
  },
  {
    quote: "Thank you for helping me secure great rotational Chief Officer position on 100m+ MY, I could not be happier!",
    name: "Jaksa Sain",
    role: "Chief Officer 100m+ MY",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Jaksa-Sain.png",
    type: "candidate",
  },
  {
    quote: "Milica placed me on my first yacht when I joined the industry, matching my land-based experience perfectly with the vessel. Since then, she has supported my career and seen me move to Chief Stewardess working within larger operations. She can always be relied on to send well-vetted, position-appropriate candidates. Her experience with, and knowledge of the 100m+ market, along with her focus on quality means she is the first person I call when I am looking for a role or crew.",
    name: "Stephanie Wells",
    role: "Chief Stewardess 100m+ M/Y",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Stephanie-Wells.png",
    type: "candidate",
  },
  {
    quote: "I would like to express mine at most gratitude for the placement of my current position as Interior Manager on a 100+ m yacht. All was well organised and monitored from your side. Great communication between the yacht, yourself and me. Everything was handled with confidentiality on every level. Therefore, I would like to continue working with you for all current and future crew hiring. I always get a quick response at any time of the day, evenings and on weekends. Very professional, fast, and efficient service! Many thanks for the past few years and many more to come.",
    name: "Mathieu Barbe",
    role: "Interior Manager, Project ENZO",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Mathieu-Barbe.png",
    type: "candidate",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <ExitIntent />
      <UrgencyBanner showJobCount={false} />
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 py-20 sm:py-32">
        {/* Background Video */}
        <div className="absolute inset-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-40"
            poster="https://www.lighthouse-careers.com/wp-content/uploads/2023/09/CARIBBEAN-YACHT-CHARTER-1600x1210-1.jpg"
          >
            <source
              src="/videos/hero-bg.mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-navy-900/70 via-navy-900/50 to-navy-900/90" />
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-gold-400 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-gold-500 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            {/* Trust badge - above fold social proof */}
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-2 text-sm font-medium text-gold-300">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-navy-900">4.9</div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-gold-400 text-gold-400" />
                  ))}
                </div>
              </div>
              <span className="hidden sm:inline">Trusted by 500+ Clients Worldwide</span>
              <span className="sm:hidden">500+ Clients trust us</span>
            </div>

            <h1 className="font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Your Next Yacht Job or Perfect Hire
              <br />
              <span className="text-gold-400">Is One Call Away.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300 sm:text-xl">
              Stop competing with 500 applicants. Get matched to positions on superyachts,
              in private villas, or luxury estates - or find pre-screened staff that actually show up.
              500+ satisfied clients placing top talent worldwide.
            </p>

            {/* Trust indicators - risk reversal */}
            <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-gold-400" />
                <span>No upfront fees</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-gold-400" />
                <span>Same-day candidates</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-gold-400" />
                <span>Free replacement guarantee</span>
              </div>
            </div>

            {/* Dual CTAs - specific benefits */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/job-board">
                <Button size="lg" className="w-full min-w-[220px] sm:w-auto">
                  <Ship className="mr-2 h-5 w-5" />
                  See Open Positions
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="secondary" size="lg" className="w-full min-w-[220px] border-white/20 text-white hover:bg-white/10 sm:w-auto">
                  <Zap className="mr-2 h-5 w-5" />
                  Get Staff Today
                </Button>
              </Link>
            </div>

            {/* Quick contact for urgency */}
            <p className="mt-6 text-sm text-gray-400">
              Need someone urgently?{" "}
              <a href="tel:+33676410299" className="inline-flex items-center gap-1 text-gold-400 hover:text-gold-300">
                <Phone className="h-3.5 w-3.5" />
                Call us now
              </a>
            </p>
          </div>

          {/* 3-Step Process Cards */}
          <div className="mt-20 grid gap-6 sm:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="relative rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                >
                  <div className="absolute -top-3 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-gold-gradient text-sm font-bold text-navy-900">
                    {index + 1}
                  </div>
                  <div className="mb-4 mt-2 flex h-12 w-12 items-center justify-center rounded-lg bg-gold-500/20">
                    <Icon className="h-6 w-6 text-gold-400" />
                  </div>
                  <h3 className="mb-2 font-semibold text-white">{step.title}</h3>
                  <p className="text-sm text-gray-400">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-gray-100 bg-gray-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-serif text-4xl font-bold text-gold-600 sm:text-5xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audience Split - Path Selection */}
      <AudienceSplit />

      {/* Problem-Agitate Section */}
      <ProblemAgitate />

      {/* About Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
                We Help Great Talents
                <br />
                <span className="text-gold-600">Find Their Dream Job</span>
              </h2>
              <p className="mt-6 text-lg text-gray-600">
                Lighthouse Careers provides bespoke yacht crew recruitment and private
                household staff placement services worldwide. We focus on making the
                recruitment process smooth and seamless for both clients and candidates.
              </p>
              <p className="mt-4 text-gray-600">
                With 500+ satisfied clients, we understand what it takes to match
                exceptional talent with discerning employers. Our team of industry
                specialists has real-world experience in the sectors we recruit for.
              </p>

              {/* Feature list */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-100">
                    <Ship className="h-5 w-5 text-gold-600" />
                  </div>
                  <span className="text-sm font-medium text-navy-900">Yacht Crew</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-100">
                    <Home className="h-5 w-5 text-gold-600" />
                  </div>
                  <span className="text-sm font-medium text-navy-900">Private Staff</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-100">
                    <Award className="h-5 w-5 text-gold-600" />
                  </div>
                  <span className="text-sm font-medium text-navy-900">Vetted Talent</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-100">
                    <Users className="h-5 w-5 text-gold-600" />
                  </div>
                  <span className="text-sm font-medium text-navy-900">Global Network</span>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link href="/about">
                  <Button variant="primary">
                    Why 500+ Clients Trust Us
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="secondary">Brief Us Now</Button>
                </Link>
              </div>
            </div>

            {/* Image collage */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {/* Main large image */}
                <div className="relative col-span-2 aspect-[16/10] overflow-hidden rounded-2xl">
                  <Image
                    src="https://www.lighthouse-careers.com/wp-content/uploads/2024/02/superyacht-2.jpg"
                    alt="Luxury superyacht"
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Two smaller images */}
                <div className="relative aspect-square overflow-hidden rounded-xl">
                  <Image
                    src="https://www.lighthouse-careers.com/wp-content/uploads/2023/08/shutterstock_156742031-1024x683.jpg"
                    alt="Yacht deck crew"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="relative aspect-square overflow-hidden rounded-xl">
                  <Image
                    src="https://www.lighthouse-careers.com/wp-content/uploads/2023/08/shutterstock_1932897413-1024x683.jpg"
                    alt="Yacht chef"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 rounded-xl bg-navy-900 px-6 py-4 text-white shadow-xl">
                <div className="text-2xl font-bold text-gold-400">500+</div>
                <div className="text-sm text-gray-300">Satisfied Clients</div>
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
              Why Choose Lighthouse Careers
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              We&apos;ve built our reputation on trust, expertise, and results.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
                  <h3 className="mb-2 text-lg font-semibold text-navy-900">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600">{benefit.description}</p>
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
              Our Services
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Yacht Crew */}
            <Link
              href="/yacht-crew"
              className="group relative overflow-hidden rounded-2xl transition-transform hover:-translate-y-1"
            >
              {/* Background image */}
              <div className="absolute inset-0">
                <Image
                  src="https://www.lighthouse-careers.com/wp-content/uploads/2023/08/376.jpg"
                  alt="Yacht crew on deck"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/80 to-navy-900/40" />
              </div>
              <div className="relative p-8 pt-40">
                <Ship className="mb-4 h-10 w-10 text-gold-400" />
                <h3 className="mb-3 font-serif text-2xl font-semibold text-white">
                  Looking for Yacht Crew
                </h3>
                <p className="mb-6 text-gray-300">
                  From Captains to Deckhands, we cover all departments. Our team of
                  specialists with real yacht experience understands exactly what
                  you need.
                </p>
                <div className="flex items-center font-medium text-gold-400 group-hover:text-gold-300">
                  Get Crew Today
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            {/* Private Staff */}
            <Link
              href="/private-staff"
              className="group relative overflow-hidden rounded-2xl transition-transform hover:-translate-y-1"
            >
              {/* Background image */}
              <div className="absolute inset-0">
                <Image
                  src="https://www.lighthouse-careers.com/wp-content/uploads/2023/08/Superyacht-Charter-Experience-5_480x480-1.webp"
                  alt="Luxury interior service"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/70 to-navy-900/30" />
              </div>
              <div className="relative p-8 pt-40">
                <Home className="mb-4 h-10 w-10 text-gold-400" />
                <h3 className="mb-3 font-serif text-2xl font-semibold text-white">
                  Looking for Private Staff
                </h3>
                <p className="mb-6 text-gray-300">
                  Butlers, Estate Managers, Nannies and more. We find rare talents
                  trained to luxury standards for your private household.
                </p>
                <div className="flex items-center font-medium text-gold-400 group-hover:text-gold-300">
                  Get Staff Today
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-navy-900 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
              Trusted by Industry Professionals
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-400">
              See what our clients and candidates say about working with us.
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
                <p className="mb-6 text-gray-300 leading-relaxed">
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

      {/* Lead Capture Section */}
      <LeadCapture />

      {/* CTA Section */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="https://www.lighthouse-careers.com/wp-content/uploads/2023/08/pexels-pixabay-289319.jpg"
            alt="Luxury yacht at sea"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-navy-900/80" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
            Ready to Start Your Journey?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
            Whether you&apos;re looking for your next position or your perfect hire,
            we&apos;re here to help.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/join">
              <Button size="lg">
                Find Work
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/hire">
              <Button variant="secondary" size="lg" className="border-white/20 text-white hover:bg-white/10">
                Hire Staff
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
      <StickyCTA />
    </div>
  );
}
