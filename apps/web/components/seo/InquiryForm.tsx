"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";

interface InquiryFormProps {
  landingPageId: string;
  position: string;
  location: string;
}

export function InquiryForm({
  landingPageId,
  position,
  location,
}: InquiryFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
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
          ...formData,
          landing_page_id: landingPageId,
          position_needed: position,
          location: location,
          source_url: typeof window !== "undefined" ? window.location.href : "",
          utm_source: new URLSearchParams(window.location.search).get("utm_source"),
          utm_medium: new URLSearchParams(window.location.search).get("utm_medium"),
          utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign"),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit inquiry");
      }

      setIsSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again or contact us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="rounded-xl border border-success-500/30 bg-success-500/10 p-6 text-center">
        <CheckCircle className="mx-auto mb-3 h-10 w-10 text-success-400" />
        <h3 className="font-medium text-white">Thank you for your inquiry!</h3>
        <p className="mt-2 text-sm text-gray-300">
          We&apos;ll be in touch within 24 hours with your personalized
          candidate shortlist.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="mb-1 block text-sm font-medium text-gray-300"
        >
          Full Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Your name"
          className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-gray-500 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
          required
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-medium text-gray-300"
        >
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="your@email.com"
          className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-gray-500 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
          required
        />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="mb-1 block text-sm font-medium text-gray-300"
        >
          Phone Number
        </label>
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+1 (555) 000-0000"
          className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-gray-500 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="mb-1 block text-sm font-medium text-gray-300"
        >
          Tell us about your requirements
        </label>
        <textarea
          id="message"
          value={formData.message}
          onChange={(e) =>
            setFormData({ ...formData, message: e.target.value })
          }
          placeholder="Describe the role, experience level, and any specific requirements..."
          rows={4}
          className="w-full resize-none rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-gray-500 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-error-500/20 p-3 text-sm text-error-300">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Sending...
          </>
        ) : (
          "Get Your Candidate Shortlist"
        )}
      </Button>

      <p className="text-center text-xs text-gray-500">
        By submitting, you agree to our{" "}
        <a href="/privacy" className="text-gold-400 hover:underline">
          Privacy Policy
        </a>
        . We&apos;ll never share your information.
      </p>
    </form>
  );
}
