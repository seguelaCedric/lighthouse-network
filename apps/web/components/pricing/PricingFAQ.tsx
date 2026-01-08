"use client";

import { HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: "What is the placement fee?",
    answer:
      "The placement fee is a percentage of the first month's salary for each successful placement made through the platform. This fee only applies when a candidate you placed through Lighthouse actually starts working. Starter plans have a 15% fee, Pro plans 10%, and Enterprise plans 5%.",
  },
  {
    question: "Can I change plans later?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference for the remainder of your billing cycle. When downgrading, your new rate takes effect at the start of your next billing cycle.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, MasterCard, American Express) and SEPA direct debit for European customers. Enterprise customers can also pay via bank transfer with NET 30 terms.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes! Pro plans come with a 14-day free trial with full access to all features. No credit card required to start. You can cancel anytime during the trial without being charged.",
  },
  {
    question: "What happens when I reach my candidate limit on Starter?",
    answer:
      "You'll receive a notification when you're approaching your 50 candidate limit. You can either archive inactive candidates to free up space or upgrade to Pro for unlimited candidates.",
  },
  {
    question: "How does the WhatsApp integration work?",
    answer:
      "Our WhatsApp integration (available on Pro and Enterprise) allows you to send messages directly to candidates and clients from within Lighthouse. Briefs sent to you via WhatsApp can be automatically imported into your brief inbox.",
  },
  {
    question: "What's included in Enterprise custom integrations?",
    answer:
      "Enterprise customers get access to our REST API for custom integrations, webhooks for real-time data sync, white-label client portals with your branding, and dedicated support for building custom workflows.",
  },
  {
    question: "Do you offer discounts for annual billing?",
    answer:
      "Yes, annual billing saves you 20% compared to monthly billing. This discount is automatically applied when you select yearly billing.",
  },
];

export function PricingFAQ() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {faqItems.map((item, index) => (
        <details
          key={index}
          className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg"
        >
          <summary className="flex cursor-pointer items-center justify-between font-semibold text-navy-900 text-lg list-none">
            <span className="pr-4">{item.question}</span>
            <HelpCircle className="h-5 w-5 flex-shrink-0 text-gold-600 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-4 prose prose-sm max-w-none text-gray-700">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );
}
