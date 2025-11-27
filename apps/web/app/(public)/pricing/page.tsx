"use client";

import { useState } from "react";
import { Zap, Users, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { PublicHeader } from "@/components/pricing/PublicHeader";
import { PublicFooter } from "@/components/pricing/PublicFooter";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Zap,
    title: "AI-Powered Matching",
    description: "Match candidates in minutes, not days. Brief parsing and intelligent ranking.",
  },
  {
    icon: Users,
    title: "Collaboration Exchange",
    description: "Monetize your overflow through partner agencies. Turn unused candidates into revenue.",
  },
  {
    icon: CheckCircle,
    title: "Timestamp Authority",
    description: "End 'first CV' disputes forever with neutral, immutable submission proof.",
  },
];

export default function AgencyWaitlistPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    // For now, just simulate submission - can add API later
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In production, this would POST to /api/waitlist
    console.log("Waitlist signup:", email);

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <PublicHeader />

      {/* Hero Section */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-32">
        <div className="mb-6 inline-flex items-center rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5 text-sm font-medium text-gold-700">
          Coming Soon
        </div>

        <h1 className="font-serif text-4xl font-semibold text-navy-900 sm:text-5xl lg:text-6xl">
          Agency Partner Program
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 sm:text-xl">
          We&apos;re building the infrastructure layer for yacht crew recruitment.
          Be among the first agencies to join the network.
        </p>

        {/* Waitlist Form */}
        <div className="mx-auto mt-10 max-w-md">
          {isSubmitted ? (
            <div className="rounded-xl border border-success-200 bg-success-50 p-6">
              <CheckCircle className="mx-auto mb-3 size-10 text-success-500" />
              <h3 className="font-medium text-success-800">You&apos;re on the list!</h3>
              <p className="mt-1 text-sm text-success-700">
                We&apos;ll be in touch when we&apos;re ready to welcome new agencies.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your work email"
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-200"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="whitespace-nowrap"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    Join Waitlist
                    <ArrowRight className="ml-2 size-4" />
                  </>
                )}
              </Button>
            </form>
          )}
          {error && <p className="mt-2 text-sm text-error-600">{error}</p>}
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Currently in private beta with select agencies
        </p>
      </section>

      {/* Features Preview */}
      <section className="border-t border-gray-100 bg-white py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="mb-12 text-center font-serif text-2xl font-semibold text-navy-900 sm:text-3xl">
            What to Expect
          </h2>

          <div className="grid gap-8 sm:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="text-center">
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-gold-100">
                    <Icon className="size-7 text-gold-600" />
                  </div>
                  <h3 className="mb-2 font-medium text-navy-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-gray-100 py-16">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <p className="text-gray-600">
            Have questions about the partner program?
          </p>
          <a
            href="mailto:hello@lighthouse.crew?subject=Agency%20Partner%20Program"
            className="mt-2 inline-block font-medium text-gold-600 hover:text-gold-700 hover:underline"
          >
            Contact us at hello@lighthouse.crew
          </a>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
