import { Metadata } from "next";
import { PublicHeader } from "@/components/pricing/PublicHeader";
import { PublicFooter } from "@/components/pricing/PublicFooter";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Facebook,
  Linkedin,
  Instagram,
  HelpCircle,
} from "lucide-react";
import { ContactForm } from "@/components/public/ContactForm";

import { generateMetadata as genMeta } from "@/lib/seo/metadata";

export const metadata: Metadata = genMeta({
  title: "Contact Us | Lighthouse Careers",
  description:
    "Get in touch with Lighthouse Careers. Contact our team for yacht crew recruitment, private household staffing, or general inquiries. Phone: +33-6-76-41-02-99, Email: admin@lighthouse-careers.com",
  keywords: [
    "contact lighthouse careers",
    "yacht crew recruitment contact",
    "private staff recruitment contact",
    "recruitment agency contact",
    "hire yacht crew",
    "find private staff",
  ],
  canonical: "https://lighthouse-careers.com/contact",
  openGraph: {
    title: "Contact Us | Lighthouse Careers",
    description:
      "Get in touch with Lighthouse Careers. Contact our team for yacht crew recruitment, private household staffing, or general inquiries.",
    type: "website",
    url: "https://lighthouse-careers.com/contact",
    images: [
      {
        url: "https://lighthouse-careers.com/images/og-contact.jpg",
        width: 1200,
        height: 630,
        alt: "Contact Lighthouse Careers",
      },
    ],
  },
});

const contactMethods = [
  {
    icon: Mail,
    title: "Looking for Work?",
    description: "Submit your CV and find your next opportunity",
    value: "admin@lighthouse-careers.com",
    href: "mailto:admin@lighthouse-careers.com",
  },
  {
    icon: Phone,
    title: "Looking to Hire Crew or Staff?",
    description: "Office hours: Mon-Fri 9am-6pm CET (Paris time)",
    value: "+33 6 76 41 02 99",
    secondaryValue: "ms@lighthouse-careers.com",
    href: "tel:+33676410299",
  },
];

const socialLinks = [
  { icon: Facebook, href: "https://www.facebook.com/lighthousejobboard/", label: "Facebook" },
  { icon: Linkedin, href: "https://www.linkedin.com/company/debbieblazy", label: "LinkedIn" },
  { icon: Instagram, href: "https://www.instagram.com/lighthousecareersjobs/?hl=en", label: "Instagram" },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-28">
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
              {[...Array(36)].map((_, i) => {
                const angle = (i * 10) * (Math.PI / 180);
                const x2 = 50 + 70 * Math.cos(angle);
                const y2 = 50 + 70 * Math.sin(angle);
                return <line key={i} x1="50%" y1="50%" x2={`${x2}%`} y2={`${y2}%`} />;
              })}
            </g>
            <circle cx="50%" cy="50%" r="15%" fill="none" stroke="#C3A578" strokeWidth="0.3" opacity="0.5"/>
            <circle cx="50%" cy="50%" r="30%" fill="none" stroke="#C3A578" strokeWidth="0.3" opacity="0.4"/>
            <circle cx="50%" cy="50%" r="45%" fill="none" stroke="#C3A578" strokeWidth="0.3" opacity="0.3"/>
          </svg>
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="mb-6 inline-flex items-center rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-sm font-medium text-gold-300">
            <MessageCircle className="mr-2 h-4 w-4" />
            We&apos;re Here to Help
          </div>

          <h1 className="font-serif text-4xl font-semibold text-white sm:text-5xl">
            Get in Touch
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
            Our team is committed to ensuring you have a great and hassle-free
            experience with us. Reach out anytime.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="relative -mt-16 pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {contactMethods.map((method) => {
              const Icon = method.icon;
              return (
                <div
                  key={method.title}
                  className="group rounded-xl border border-gray-200 bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gold-100 transition-colors group-hover:bg-gold-200">
                    <Icon className="h-7 w-7 text-gold-600" />
                  </div>
                  <h3 className="mb-1 text-lg font-semibold text-navy-900">
                    {method.title}
                  </h3>
                  <p className="mb-3 text-sm text-gray-500">{method.description}</p>
                  <a href={method.href} className="block font-medium text-gold-600 hover:text-gold-700">
                    {method.value}
                  </a>
                  {method.secondaryValue && (
                    <a href={`mailto:${method.secondaryValue}`} className="block font-medium text-gold-600 hover:text-gold-700 mt-1">
                      {method.secondaryValue}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            {/* Form */}
            <ContactForm />

            {/* Info Side */}
            <div className="space-y-8">
              {/* Office Info */}
              <div className="rounded-2xl bg-navy-900 p-8 text-white">
                <p className="mb-6 text-gray-400">
                  500+ satisfied clients connecting exceptional talent with
                  discerning employers in the yacht and private household sectors.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-1 h-5 w-5 shrink-0 text-gold-400" />
                    <div>
                      <p className="font-medium">Main Office</p>
                      <p className="text-sm text-gray-400">
                        Antibes, France
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="mt-1 h-5 w-5 shrink-0 text-gold-400" />
                    <div>
                      <p className="font-medium">Office Hours</p>
                      <p className="text-sm text-gray-400">
                        Monday - Friday: 9:00 AM - 6:00 PM CET (Paris time)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="rounded-2xl border border-gray-200 bg-white p-8">
                <h3 className="mb-4 font-semibold text-navy-900">Follow Us</h3>
                <p className="mb-6 text-sm text-gray-600">
                  Stay connected and get the latest updates on job opportunities and
                  industry news.
                </p>
                <div className="flex gap-3">
                  {socialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-gold-100 hover:text-gold-600"
                        aria-label={social.label}
                      >
                        <Icon className="h-5 w-5" />
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Quick Links */}
              <div className="rounded-2xl border border-gray-200 bg-white p-8">
                <h3 className="mb-4 font-semibold text-navy-900">Quick Links</h3>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="/job-board"
                      className="text-gray-600 transition-colors hover:text-gold-600"
                    >
                      Browse Job Board →
                    </a>
                  </li>
                  <li>
                    <a
                      href="/yacht-crew"
                      className="text-gray-600 transition-colors hover:text-gold-600"
                    >
                      Find Yacht Crew →
                    </a>
                  </li>
                  <li>
                    <a
                      href="/private-staff"
                      className="text-gray-600 transition-colors hover:text-gold-600"
                    >
                      Find Private Staff →
                    </a>
                  </li>
                  <li>
                    <a
                      href="/about"
                      className="text-gray-600 transition-colors hover:text-gold-600"
                    >
                      About Us →
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-20 sm:py-28 bg-white" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 id="faq-heading" className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Find quick answers to common questions about our services.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How much does your recruitment service cost?",
                a: "We operate on a success-fee model. You only pay when we successfully place a candidate. Contact us for specific rates based on your requirements.",
              },
              {
                q: "How quickly can you find candidates?",
                a: "We typically provide qualified candidates within 24 hours of receiving your brief. Urgent placements can often be expedited.",
              },
              {
                q: "Do you offer a replacement guarantee?",
                a: "Yes, we offer a free replacement if a placement doesn't work out within the guarantee period. This gives you peace of mind.",
              },
              {
                q: "What areas do you cover?",
                a: "We place candidates worldwide, with particular expertise in Europe, the Mediterranean, Caribbean, and Asia-Pacific regions.",
              },
            ].map((faq, index) => (
              <details
                key={index}
                className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg"
              >
                <summary className="flex cursor-pointer items-center justify-between font-semibold text-navy-900 text-lg list-none">
                  <span className="pr-4">{faq.q}</span>
                  <HelpCircle className="h-5 w-5 flex-shrink-0 text-gold-600 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-4 prose prose-sm max-w-none text-gray-700">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
