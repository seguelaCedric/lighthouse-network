"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, ArrowRight, Sparkles } from "lucide-react";

export function EmployerInquiryForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service_type: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.email) {
      setError("Please fill in all required fields");
      return;
    }

    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          message: formData.message || `Service needed: ${formData.service_type || "Not specified"}`,
          position_needed: formData.service_type || "General inquiry",
          location: "Not specified",
          source_url: typeof window !== "undefined" ? window.location.href : "",
          utm_source: typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("utm_source") : null,
          utm_medium: typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("utm_medium") : null,
          utm_campaign: typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("utm_campaign") : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit inquiry");
      }

      setIsSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again or call us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/[0.08] p-8 shadow-2xl backdrop-blur-md">
        {/* Subtle glow effect */}
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gold-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-gold-500/10 blur-3xl" />

        <div className="relative text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 ring-4 ring-green-500/10">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-white">Thank You!</h3>
          <p className="mt-2 text-gray-300">
            We&apos;ll be in touch within 24 hours with your personalized candidate shortlist.
          </p>
          <p className="mt-4 text-sm text-gray-400">
            Need candidates faster?{" "}
            <a href="tel:+33652928360" className="text-gold-400 hover:text-gold-300">
              Call us now
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/[0.08] p-6 shadow-2xl backdrop-blur-md sm:p-8">
      {/* Subtle glow effects */}
      <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gold-500/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-gold-500/10 blur-3xl" />

      <div className="relative">
        <div className="mb-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-gold-500/20 px-3 py-1 text-xs font-medium text-gold-400">
            <Sparkles className="h-3 w-3" />
            Free Brief Submission
          </div>
          <h3 className="text-xl font-semibold text-white">Get Candidates Today</h3>
          <p className="mt-1 text-sm text-gray-400">
            Tell us what you need. No upfront fees, no commitment.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-gray-300"
              >
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-gray-500 transition-all focus:border-gold-500/50 focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-300"
              >
                Email *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-gray-500 transition-all focus:border-gold-500/50 focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="phone"
                className="mb-1.5 block text-sm font-medium text-gray-300"
              >
                Phone <span className="text-gray-500">(optional)</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-gray-500 transition-all focus:border-gold-500/50 focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="service_type"
                className="mb-1.5 block text-sm font-medium text-gray-300"
              >
                What do you need?
              </label>
              <select
                id="service_type"
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white transition-all focus:border-gold-500/50 focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              >
                <option value="" className="bg-navy-900">Select service</option>
                <option value="Yacht Crew" className="bg-navy-900">Yacht Crew</option>
                <option value="Private Staff" className="bg-navy-900">Private Household Staff</option>
                <option value="Both" className="bg-navy-900">Both</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="message"
              className="mb-1.5 block text-sm font-medium text-gray-300"
            >
              Tell us more <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Position, experience level, start date..."
              rows={2}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-gray-500 transition-all focus:border-gold-500/50 focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-500/20 p-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full py-6 text-base"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Get Candidates Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>

          <p className="text-center text-xs text-gray-500">
            No upfront fees. We&apos;ll respond within 24 hours.
          </p>
        </form>
      </div>
    </div>
  );
}
