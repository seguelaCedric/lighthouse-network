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
import { HomeVideoHero } from "@/components/marketing/HomeVideoHero";
import { HomePageStructuredData } from "@/components/seo/HomePageStructuredData";
import { Testimonials, type Testimonial } from "@/components/marketing/Testimonials";
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
  Phone,
  Check,
  Zap,
  Sparkles,
} from "lucide-react";

const stats = [
  { value: "500+", label: "Satisfied Clients", description: "Over 500 yacht owners, captains, and private clients trust us" },
  { value: "1500+", label: "Successful Placements", description: "Over 1500 successful placements worldwide" },
  { value: "50+", label: "Countries", description: "Operating in over 50 countries worldwide" },
  { value: "20+", label: "Years of Trust", description: "Established in 2002, serving the industry for over 20 years" },
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

const testimonials: Testimonial[] = [
  // Client testimonials (hiring managers)
  {
    quote: "I wanted to say a few words of thanks for your all your time and efforts over the past few years, working on behalf of Axioma and indeed the other vessels I have worked on. You and your team has always been a massive help in trying to help find us the right candidate for the right job in this ever expanding and delicate industry.",
    author: "Tom Filby",
    role: "Captain M/Y Axioma",
    image: "https://ozcuponldhepkdjmemvm.supabase.co/storage/v1/object/public/marketing/wp-uploads/Capture-decran-2020-02-23-a-12.27.53-150x150-1.png",
    rating: 5,
  },
  {
    quote: "I've had the pleasure of knowing Milica, and using her recruitment services for many years. Her attention to what I'm looking for in a crew member, fast response and flexibility and understanding of feedback has always impressed me, and I look forward to continuing working with her and Lighthouse Careers.",
    author: "Carl Westerlund",
    role: "Captain 101m M/Y",
    image: "https://ozcuponldhepkdjmemvm.supabase.co/storage/v1/object/public/marketing/wp-uploads/Carl-Westerlund.png",
    rating: 5,
  },
  {
    quote: "Milica is always my first call when looking for new crew. Milica helped me get my first command 3 years ago and ever since has supplied me with great candidates for all positions onboard. I can always rely on her judgement and honesty on potential crew and to act fast when I need. I wish her luck with this new venture and look forward to a continued professional affiliation.",
    author: "Mark Sinnatt",
    role: "Captain M/Y GLOBAL",
    image: "https://ozcuponldhepkdjmemvm.supabase.co/storage/v1/object/public/marketing/wp-uploads/Mark-Sinnatt.png",
    rating: 5,
  },
  {
    quote: "Milica and I have known each other for several years. She never dropped her standards of recruitment over the time. Due to her industry knowledge, great candidates she has provided over the years and great sense of urgency and limitations a yacht can have, I decided to reintroduce and appoint Milica's agency to represent our fleet of yachts in the yacht recruitment world. In no time she gained a thorough understanding of our new management structure and fleet needs. Having closely monitored her interactions with my on board teams before and during the summer season, it has certainly proved to be a great partnership.",
    author: "Alina C.",
    role: "Owner's Fleet Representative",
    image: "https://ozcuponldhepkdjmemvm.supabase.co/storage/v1/object/public/marketing/wp-uploads/Alina-C.png",
    rating: 5,
  },
  {
    quote: "I have known Milica for over a decade. In that time I have come to value her judgement and advice on Crew Recruitment. She has placed a number of candidates on my commands and she has also helped me secure my dream job! We have always had an excellent working relationship and I feel if I was more of an Antibes based Captain we would have been very good friends. I feel that she is discreet, honest and professional and that she will take this new venture on to become a reliable Crew Recruitment tool for any professional Captain.",
    author: "Dùghall MacLachlainn",
    role: "Captain",
    image: "https://ozcuponldhepkdjmemvm.supabase.co/storage/v1/object/public/marketing/wp-uploads/Milica.jpeg",
    rating: 5,
  },
  {
    quote: "Milica and I go back for nearly 7 years to the times when I started my journey in the yachting industry. During this time, we have been able to assist each other on various cases and tables have turned few times, depending on me looking for a new challenge or recruiting my own team. Milica has always treated my staff requests with uttermost confidence and care. Not only she has found me some fantastic people to work with but we have also managed to handle sensitive situations with respect and dignity.",
    author: "Meeli Lepik",
    role: "Interior Manager, Project ENZO",
    image: "https://ozcuponldhepkdjmemvm.supabase.co/storage/v1/object/public/marketing/wp-uploads/Meeli-Lepik.png",
    rating: 5,
  },
  // Candidate testimonials (yacht crew professionals)
  {
    quote: "Milica and Lighthouse Careers offers an excellent, personable and professional service. Following our initial interview, Milica worked tirelessly to secure me rotational Masters role on a SuperYacht, and I wouldn't hesitate in recommending her to fellow Captains.",
    author: "Adam Virik",
    role: "Captain 60m+ MY",
    image: "https://ozcuponldhepkdjmemvm.supabase.co/storage/v1/object/public/marketing/wp-uploads/decran.png",
    rating: 5,
  },
  {
    quote: "I had been looking for the right rotational Captain position for a while, and Milica helped me secure it, thank you Milica!",
    author: "Rick DuBois",
    role: "Captain 70m+ MY",
    image: "https://ozcuponldhepkdjmemvm.supabase.co/storage/v1/object/public/marketing/wp-uploads/Rick-DuBois.png",
    rating: 5,
  },
  {
    quote: "I just wanted you to send you a little message to say that I am the happiest I have ever been on a boat, and in 8 years that is saying something! So thank you very much for how honest you were with me when my options were in front of me and for helping me secure my dream job, you have made all the difference!",
    author: "Laura O'Keeffe",
    role: "SPA Therapist",
    image: "https://ozcuponldhepkdjmemvm.supabase.co/storage/v1/object/public/marketing/wp-uploads/Laura.png",
    rating: 5,
  },
  {
    quote: "During current times where communication has become more and more technology-centric, Lighthouse Careers approach to call and speak one-on-one made them stand out from other recruitment services. Their genuine approach and time took to sincerely listen and understand both candidates' individual career goals, history and skillset, and the Employer's needs, requirements and onboard crew culture resulted in a very successful match on all fronts. After securing me a new Chief Stew role, Lighthouse Careers attention and care for detail were further reflected in presenting only high calibre candidates that satisfied our search criteria.",
    author: "Brianna Stenhouse",
    role: "Chief Stew M/Y GLOBAL",
    image: "https://ozcuponldhepkdjmemvm.supabase.co/storage/v1/object/public/marketing/wp-uploads/Brianna.png",
    rating: 5,
  },
  {
    quote: "Throughout my 11 years in yachting, I have found Milica to be my go-to agent for jobs. Not only because she has a great reputation in the industry and great boats in her books but also for her care, kindness and professionalism. Very grateful to Milica for my placement onboard a very successful charter yacht during these uncertain times!",
    author: "Vesna Coklo",
    role: "Chief Stew 70m+ MY",
    image: "https://ozcuponldhepkdjmemvm.supabase.co/storage/v1/object/public/marketing/wp-uploads/Vesna-Coklo.jpeg",
    rating: 5,
  },
  {
    quote: "Thank you for thinking of us for the position as private island managers. We were very pleased when we got offered the position as it's been a long time dream of ours!",
    author: "Dean And Jen",
    role: "Private Island Managers",
    image: "https://ozcuponldhepkdjmemvm.supabase.co/storage/v1/object/public/marketing/wp-uploads/Capture-decran-2019-12-12-a-07.26.59-150x150-1.png",
    rating: 5,
  },
  {
    quote: "I wanted to thank Milica for her help in finding me the perfect role. I feel like I can contact her anytime and she is very supportive and helpful. She listens and understands the role you are looking for. I would highly recommend her to anyone from starting out in the industry to experienced candidates. I am now using Milica to help me find my team and it's always a pleasure to work with her. A big thank you to her and her team at Lighthouse careers.",
    author: "Megan Brooksby",
    role: "Chief Stew 65m MY",
    image: "https://ozcuponldhepkdjmemvm.supabase.co/storage/v1/object/public/marketing/wp-uploads/Megan-Brooksby.png",
    rating: 5,
  },
  {
    quote: "Thank you for helping me secure great rotational Chief Officer position on 100m+ MY, I could not be happier!",
    author: "Jaksa Sain",
    role: "Chief Officer 100m+ MY",
    image: "https://ozcuponldhepkdjmemvm.supabase.co/storage/v1/object/public/marketing/wp-uploads/Jaksa-Sain.png",
    rating: 5,
  },
  {
    quote: "Milica placed me on my first yacht when I joined the industry, matching my land-based experience perfectly with the vessel. Since then, she has supported my career and seen me move to Chief Stew working within larger operations. She can always be relied on to send well-vetted, position-appropriate candidates. Her experience with, and knowledge of the 100m+ market, along with her focus on quality means she is the first person I call when I am looking for a role or crew.",
    author: "Stephanie Wells",
    role: "Chief Stew 100m+ M/Y",
    image: "https://ozcuponldhepkdjmemvm.supabase.co/storage/v1/object/public/marketing/wp-uploads/Stephanie-Wells.png",
    rating: 5,
  },
  {
    quote: "I would like to express mine at most gratitude for the placement of my current position as Interior Manager on a 100+ m yacht. All was well organised and monitored from your side. Great communication between the yacht, yourself and me. Everything was handled with confidentiality on every level. Therefore, I would like to continue working with you for all current and future crew hiring. I always get a quick response at any time of the day, evenings and on weekends. Very professional, fast, and efficient service! Many thanks for the past few years and many more to come.",
    author: "Mathieu Barbe",
    role: "Interior Manager, Project ENZO",
    image: "https://ozcuponldhepkdjmemvm.supabase.co/storage/v1/object/public/marketing/wp-uploads/Mathieu-Barbe.png",
    rating: 5,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <HomePageStructuredData testimonials={testimonials} />
      <ExitIntent />
      <UrgencyBanner showJobCount={false} />
      <PublicHeader />

      <main id="main-content">
        {/* Hero Section */}
        <section
          className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 py-20 sm:py-32"
          aria-labelledby="hero-heading"
        >
          {/* Background Video */}
          <HomeVideoHero
            posterUrl="https://ozcuponldhepkdjmemvm.supabase.co/storage/v1/object/public/marketing/wp-uploads/CARIBBEAN-YACHT-CHARTER-1600x1210-1.jpg"
            videoUrl="/videos/hero-bg.mp4"
          />

          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-10" aria-hidden="true">
            <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-gold-400 blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-gold-500 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              {/* Trust badge - above fold social proof */}
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-2 text-sm font-medium text-gold-300">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-navy-900">4.9</div>
                  <div className="flex" aria-label="4.9 out of 5 stars">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-gold-400 text-gold-400" aria-hidden="true" />
                    ))}
                  </div>
                </div>
                <span className="hidden sm:inline">Trusted by 500+ Clients Worldwide</span>
                <span className="sm:hidden">500+ Clients trust us</span>
              </div>

              <h1 id="hero-heading" className="font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
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
                  <Check className="h-4 w-4 text-gold-400" aria-hidden="true" />
                  <span>No upfront fees</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-gold-400" aria-hidden="true" />
                  <span>Same-day candidates</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-gold-400" aria-hidden="true" />
                  <span>Free replacement guarantee</span>
                </div>
              </div>

              {/* Dual CTAs - specific benefits */}
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/job-board">
                  <Button size="lg" className="w-full min-w-[220px] sm:w-auto">
                    <Ship className="mr-2 h-5 w-5" aria-hidden="true" />
                    See Open Positions
                  </Button>
                </Link>
                <Link href="/match">
                  <Button variant="secondary" size="lg" className="w-full min-w-[220px] border-white/20 text-white hover:bg-white/10 sm:w-auto">
                    <Zap className="mr-2 h-5 w-5" aria-hidden="true" />
                    Start Hiring
                  </Button>
                </Link>
              </div>

              {/* Quick contact for urgency */}
              <p className="mt-6 text-sm text-gray-400">
                Need someone urgently?{" "}
                <a href="tel:+33652928360" className="inline-flex items-center gap-1 text-gold-400 hover:text-gold-300">
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  Call us now
                </a>
              </p>
            </div>

            {/* 3-Step Process Cards */}
            <div className="mt-20 grid gap-6 sm:grid-cols-3" role="list" aria-label="How it works">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="relative rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                    role="listitem"
                  >
                    <div className="absolute -top-3 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-gold-gradient text-sm font-bold text-navy-900" aria-hidden="true">
                      {index + 1}
                    </div>
                    <div className="mb-4 mt-2 flex h-12 w-12 items-center justify-center rounded-lg bg-gold-500/20">
                      <Icon className="h-6 w-6 text-gold-400" aria-hidden="true" />
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
        <section
          className="border-b border-gray-100 bg-gray-50 py-16"
          aria-labelledby="stats-heading"
        >
          <h2 id="stats-heading" className="sr-only">Our Track Record</h2>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div
              className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
              itemScope
              itemType="https://schema.org/Organization"
            >
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
        <section
          className="py-20 sm:py-28"
          aria-labelledby="about-heading"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 id="about-heading" className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
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
                      <Ship className="h-5 w-5 text-gold-600" aria-hidden="true" />
                    </div>
                    <span className="text-sm font-medium text-navy-900">Yacht Crew</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-100">
                      <Home className="h-5 w-5 text-gold-600" aria-hidden="true" />
                    </div>
                    <span className="text-sm font-medium text-navy-900">Private Staff</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-100">
                      <Award className="h-5 w-5 text-gold-600" aria-hidden="true" />
                    </div>
                    <span className="text-sm font-medium text-navy-900">Vetted Talent</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-100">
                      <Users className="h-5 w-5 text-gold-600" aria-hidden="true" />
                    </div>
                    <span className="text-sm font-medium text-navy-900">Global Network</span>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link href="/about">
                    <Button variant="primary">
                      Why 500+ Clients Trust Us
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Link>
                  <Link href="/hire">
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
                      src="https://ozcuponldhepkdjmemvm.supabase.co/storage/v1/object/public/marketing/wp-uploads/superyacht-2.jpg"
                      alt="Luxury superyacht anchored in crystal blue Mediterranean waters"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  {/* Two smaller images */}
                  <div className="relative aspect-square overflow-hidden rounded-xl">
                    <Image
                      src="https://ozcuponldhepkdjmemvm.supabase.co/storage/v1/object/public/marketing/wp-uploads/shutterstock_156742031-1024x683.jpg"
                      alt="Professional yacht deck crew in uniform on duty"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="relative aspect-square overflow-hidden rounded-xl">
                    <Image
                      src="https://ozcuponldhepkdjmemvm.supabase.co/storage/v1/object/public/marketing/wp-uploads/shutterstock_1932897413-1024x683.jpg"
                      alt="Private yacht chef preparing gourmet cuisine"
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
        <section
          className="bg-gray-50 py-20 sm:py-28"
          aria-labelledby="benefits-heading"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-16 text-center">
              <h2 id="benefits-heading" className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
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
                      <Icon className="h-6 w-6 text-gold-600" aria-hidden="true" />
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
        <section
          className="py-20 sm:py-28"
          aria-labelledby="services-heading"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-16 text-center">
              <h2 id="services-heading" className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
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
                    src="https://ozcuponldhepkdjmemvm.supabase.co/storage/v1/object/public/marketing/wp-uploads/376.jpg"
                    alt="Yacht crew on deck"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/80 to-navy-900/40" />
                </div>
                <div className="relative p-8 pt-40">
                  <Ship className="mb-4 h-10 w-10 text-gold-400" aria-hidden="true" />
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
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
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
                    src="https://ozcuponldhepkdjmemvm.supabase.co/storage/v1/object/public/marketing/wp-uploads/shutterstock_1994929460-scaled.jpg"
                    alt="Luxury interior service"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900/60 via-navy-900/40 to-navy-900/15" />
                </div>
                <div className="relative p-8 pt-40">
                  <Home className="mb-4 h-10 w-10 text-gold-400" aria-hidden="true" />
                  <h3 className="mb-3 font-serif text-2xl font-semibold text-white">
                    Looking for Private Staff
                  </h3>
                  <p className="mb-6 text-gray-300">
                    Butlers, Estate Managers, Nannies and more. We find rare talents
                    trained to luxury standards for your private household.
                  </p>
                  <div className="flex items-center font-medium text-gold-400 group-hover:text-gold-300">
                    Get Staff Today
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials Section - Unified component showing all 16 testimonials */}
        <Testimonials
          title="Trusted by Industry Professionals"
          subtitle="See what our clients and candidates say about working with us."
          testimonials={testimonials}
          variant="dark"
          pattern="diamond"
          showStats={true}
          stats={[
            { value: "4.9★", label: "Client Rating" },
            { value: "500+", label: "Satisfied Clients" },
            { value: "300+", label: "Placements/Year" },
            { value: "20+", label: "Years Experience" },
          ]}
        />

        {/* Lead Capture Section */}
        <LeadCapture />

        {/* CTA Section - Clean white design */}
        <section
          className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-20 sm:py-28"
          aria-labelledby="cta-heading"
        >
          {/* Subtle decorative elements */}
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-gold-500/5 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-navy-900/5 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              {/* Left side - Content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-sm font-medium text-gold-600 mb-6">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Start Today
                </div>
                <h2 id="cta-heading" className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl lg:text-5xl">
                  Ready to Start Your Journey?
                </h2>
                <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto lg:mx-0">
                  Whether you&apos;re looking for your next position or your perfect hire,
                  we&apos;re here to help you succeed.
                </p>

                {/* Trust indicators */}
                <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
                    <span>No upfront fees</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
                    <span>500+ clients</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
                    <span>Same-day response</span>
                  </div>
                </div>
              </div>

              {/* Right side - CTA Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {/* For Candidates */}
                <Link href="/job-board" className="group">
                  <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-gold-500/50 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-gold-500/10 transition-transform group-hover:scale-150" aria-hidden="true" />
                    <div className="relative">
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/10">
                        <Briefcase className="h-6 w-6 text-gold-600" aria-hidden="true" />
                      </div>
                      <h3 className="font-serif text-xl font-semibold text-navy-900 mb-2">Find Work</h3>
                      <p className="text-gray-600 text-sm mb-4">Browse yacht crew and private staff positions worldwide.</p>
                      <div className="flex items-center text-gold-600 font-medium text-sm group-hover:gap-2 transition-all">
                        <span>See positions</span>
                        <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </Link>

                {/* For Employers */}
                <Link href="/hire" className="group">
                  <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-navy-500/50 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-navy-500/10 transition-transform group-hover:scale-150" aria-hidden="true" />
                    <div className="relative">
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-navy-500/10">
                        <Users className="h-6 w-6 text-navy-600" aria-hidden="true" />
                      </div>
                      <h3 className="font-serif text-xl font-semibold text-navy-900 mb-2">Hire Staff</h3>
                      <p className="text-gray-600 text-sm mb-4">Get pre-vetted candidates delivered same day.</p>
                      <div className="flex items-center text-navy-600 font-medium text-sm group-hover:gap-2 transition-all">
                        <span>Submit a brief</span>
                        <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Bottom contact prompt */}
            <div className="mt-12 text-center">
              <p className="text-gray-500">
                Need help?{" "}
                <a href="tel:+33652928360" className="font-medium text-navy-600 hover:text-navy-700 underline-offset-2 hover:underline">
                  Call us
                </a>
                {" "}or{" "}
                <Link href="/contact" className="font-medium text-navy-600 hover:text-navy-700 underline-offset-2 hover:underline">
                  send a message
                </Link>
                {" "}- we respond within 2 hours.
              </p>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
      <StickyCTA />
    </div>
  );
}
