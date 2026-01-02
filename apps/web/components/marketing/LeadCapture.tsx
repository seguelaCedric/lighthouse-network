"use client";

import { useState } from "react";
import { Download, Send, CheckCircle, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LeadCaptureProps {
  variant?: "salary-guide" | "client-brief" | "both";
}

export function LeadCapture({ variant = "both" }: LeadCaptureProps) {
  const [candidateEmail, setCandidateEmail] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [candidateSubmitted, setCandidateSubmitted] = useState(false);
  const [clientSubmitted, setClientSubmitted] = useState(false);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);

  const handleCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCandidateLoading(true);
    // Simulate API call - replace with actual implementation
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setCandidateSubmitted(true);
    setCandidateLoading(false);
  };

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientLoading(true);
    // Simulate API call - replace with actual implementation
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setClientSubmitted(true);
    setClientLoading(false);
  };

  const showCandidate = variant === "salary-guide" || variant === "both";
  const showClient = variant === "client-brief" || variant === "both";

  return (
    <section className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
            Get Free Resources
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Whether you&apos;re job hunting or hiring, we&apos;ve got something valuable for you.
          </p>
        </div>

        <div className={`grid gap-8 ${showCandidate && showClient ? "lg:grid-cols-2" : "max-w-lg mx-auto"}`}>
          {/* Candidate Lead Magnet - Salary Guide */}
          {showCandidate && (
            <div className="rounded-2xl border border-gold-500/20 bg-navy-700/80 p-8 backdrop-blur-sm">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/20">
                <Download className="h-6 w-6 text-gold-400" />
              </div>

              <h3 className="mb-2 font-serif text-xl font-semibold text-white">
                2025 Yacht Crew Salary Guide
              </h3>
              <p className="mb-6 text-sm text-gray-400">
                Know your worth. Get the latest salary ranges for all positions,
                from Junior Stew to Captain, across different yacht sizes.
              </p>

              {/* What's included */}
              <div className="mb-6 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-gold-400" />
                  <span>Salaries by position and yacht size</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-gold-400" />
                  <span>Med vs Caribbean market comparison</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-gold-400" />
                  <span>Negotiation tips from recruiters</span>
                </div>
              </div>

              {candidateSubmitted ? (
                <div className="flex items-center gap-3 rounded-lg bg-green-500/10 p-4 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span>Check your inbox! Guide on its way.</span>
                </div>
              ) : (
                <form onSubmit={handleCandidateSubmit} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                    <input
                      type="email"
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full rounded-lg border border-white/20 bg-white/5 py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={candidateLoading}
                  >
                    {candidateLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download Free Guide
                      </>
                    )}
                  </Button>
                  <p className="text-center text-xs text-gray-500">
                    No spam, ever. Unsubscribe anytime.
                  </p>
                </form>
              )}
            </div>
          )}

          {/* Client Lead Magnet - Get Candidates */}
          {showClient && (
            <div className="rounded-2xl border border-gold-500/20 bg-navy-700/80 p-8 backdrop-blur-sm">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/20">
                <Send className="h-6 w-6 text-gold-400" />
              </div>

              <h3 className="mb-2 font-serif text-xl font-semibold text-white">
                Get 3 Pre-Vetted Candidates
              </h3>
              <p className="mb-6 text-sm text-gray-400">
                Tell us what you need and we&apos;ll send you 3 matched candidates
                within 48 hours. No commitment, no upfront cost.
              </p>

              {/* What's included */}
              <div className="mb-6 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-gold-400" />
                  <span>Candidates matched to your requirements</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-gold-400" />
                  <span>Full profiles with references checked</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-gold-400" />
                  <span>No fees until you make a hire</span>
                </div>
              </div>

              {clientSubmitted ? (
                <div className="flex items-center gap-3 rounded-lg bg-green-500/10 p-4 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span>We&apos;ll be in touch within 2 hours!</span>
                </div>
              ) : (
                <form onSubmit={handleClientSubmit} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full rounded-lg border border-white/20 bg-white/5 py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={clientLoading}
                  >
                    {clientLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Get Free Candidates
                      </>
                    )}
                  </Button>
                  <p className="text-center text-xs text-gray-500">
                    We&apos;ll call to understand your needs. No obligation.
                  </p>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
