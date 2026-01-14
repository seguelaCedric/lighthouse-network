"use client";

import Image from "next/image";
import { PublicHeader } from "@/components/pricing/PublicHeader";
import { PublicFooter } from "@/components/pricing/PublicFooter";
import { Star } from "lucide-react";

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
    quote: "During current times where communication has become more and more technology-centric, Lighthouse Careers approach to call and speak one-on-one made them stand out from other recruitment services. Their genuine approach and time took to sincerely listen and understand both candidates' individual career goals, history and skillset, and the Employer's needs, requirements and onboard crew culture resulted in a very successful match on all fronts. After securing me a new Chief Stew role, Lighthouse Careers attention and care for detail were further reflected in presenting only high calibre candidates that satisfied our search criteria.",
    name: "Brianna Stenhouse",
    role: "Chief Stew M/Y GLOBAL",
    image: "https://www.lighthouse-careers.com/wp-content/uploads/2023/09/Brianna.png",
    type: "candidate",
  },
  {
    quote: "Throughout my 11 years in yachting, I have found Milica to be my go-to agent for jobs. Not only because she has a great reputation in the industry and great boats in her books but also for her care, kindness and professionalism. Very grateful to Milica for my placement onboard a very successful charter yacht during these uncertain times!",
    name: "Vesna Coklo",
    role: "Chief Stew 70m+ MY",
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
    role: "Chief Stew 65m MY",
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
    quote: "Milica placed me on my first yacht when I joined the industry, matching my land-based experience perfectly with the vessel. Since then, she has supported my career and seen me move to Chief Stew working within larger operations. She can always be relied on to send well-vetted, position-appropriate candidates. Her experience with, and knowledge of the 100m+ market, along with her focus on quality means she is the first person I call when I am looking for a role or crew.",
    name: "Stephanie Wells",
    role: "Chief Stew 100m+ M/Y",
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

export default function TestimonialsPage() {
  const clientTestimonials = testimonials.filter((t) => t.type === "client");
  const candidateTestimonials = testimonials.filter((t) => t.type === "candidate");

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h1 className="font-serif text-4xl font-semibold text-white sm:text-5xl lg:text-6xl">
              What Our Clients & Candidates Say
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300 sm:text-xl">
              Real testimonials from industry professionals who have worked with Lighthouse Careers for yacht crew and land-based positions
            </p>
          </div>
        </div>
      </section>

      {/* Client Testimonials Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              From Hiring Managers & Captains
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              See what captains, owners, and hiring managers say about working with us
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {clientTestimonials.map((testimonial, index) => (
              <div
                key={index}
                className="group relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg"
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
                  <span className="rounded-full bg-gold-500/20 px-2.5 py-0.5 text-xs font-medium text-gold-700">
                    Hiring Manager
                  </span>
                </div>

                {/* Quote */}
                <p className="mb-6 text-gray-700 leading-relaxed">
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
                    <div className="font-medium text-navy-900">{testimonial.name}</div>
                    <div className="text-sm text-gold-600">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Candidate Testimonials Section */}
      <section className="bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              From Yacht & Land-Based Professionals
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Hear from crew members and land-based professionals who found their dream positions through Lighthouse Careers
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {candidateTestimonials.map((testimonial, index) => (
              <div
                key={index}
                className="group relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg"
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
                  <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    Yacht Professional
                  </span>
                </div>

                {/* Quote */}
                <p className="mb-6 text-gray-700 leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                {/* Author with avatar */}
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-blue-500/30">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-navy-900">{testimonial.name}</div>
                    <div className="text-sm text-blue-600">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

