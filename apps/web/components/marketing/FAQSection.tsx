"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title?: string;
  subtitle?: string;
  faqs: FAQItem[];
  className?: string;
}

export function FAQSection({
  title = "Frequently Asked Questions",
  subtitle,
  faqs,
  className,
}: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Generate JSON-LD structured data for FAQs
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <section className={cn("py-20 sm:py-28", className)}>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">{subtitle}</p>
          )}
        </div>

        <div className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
          {faqs.map((faq, index) => (
            <div key={index} className="group">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-gray-50"
                aria-expanded={openIndex === index}
              >
                <span className="pr-4 font-medium text-navy-900">
                  {faq.question}
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 flex-shrink-0 text-gray-400 transition-transform duration-200",
                    openIndex === index && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  openIndex === index ? "max-h-96" : "max-h-0"
                )}
              >
                <div className="px-6 pb-5 text-gray-600">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
