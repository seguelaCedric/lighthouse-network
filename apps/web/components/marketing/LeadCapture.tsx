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
    
    try {
      const response = await fetch("/api/salary-guide/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: candidateEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to request salary guide");
      }

      setCandidateSubmitted(true);
    } catch (error) {
      console.error("Error requesting salary guide:", error);
      alert(error instanceof Error ? error.message : "Failed to request salary guide. Please try again.");
    } finally {
      setCandidateLoading(false);
    }
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
    <section className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 py-16 sm:py-20 print:bg-white print:py-12 print:break-inside-avoid">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center print:mb-8">
          <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl print:text-3xl print:text-navy-900">
            Get Free Resources
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-400 print:text-gray-700 print:text-base">
            Whether you&apos;re job hunting or hiring, we&apos;ve got something valuable for you.
          </p>
        </div>

        <div className={`grid gap-8 ${showCandidate && showClient ? "lg:grid-cols-2" : "max-w-lg mx-auto"}`}>
          {/* Candidate Lead Magnet - Salary Guide */}
          {showCandidate && (
            <div className="rounded-2xl border border-gold-500/20 bg-navy-700/80 p-8 backdrop-blur-sm print:border-2 print:border-gold-600 print:bg-white print:shadow-lg print:p-10">
              <div className="mb-6 flex justify-center print:mb-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-500/20 print:bg-gold-100 print:h-20 print:w-20">
                  <Download className="h-8 w-8 text-gold-400 print:text-gold-600 print:h-10 print:w-10" />
                </div>
              </div>

              <h3 className="mb-4 text-center font-serif text-2xl font-semibold text-white print:text-3xl print:text-navy-900 sm:text-3xl">
                2026 Yacht Crew & Private Household Salary Guide
              </h3>
              <p className="mb-8 text-center text-base text-gray-400 print:text-gray-700 print:mb-6 sm:text-lg">
                Know your worth. Get the latest salary ranges for all positions,
                from Junior Stew to Captain, and from Nanny to Estate Manager.
              </p>

              {/* What's included */}
              <div className="mb-8 space-y-3 print:mb-6">
                <div className="flex items-center justify-center gap-3 text-sm text-gray-300 print:text-gray-700 sm:text-base">
                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-gold-400 print:text-gold-600" />
                  <span>Salaries by position and yacht size</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-sm text-gray-300 print:text-gray-700 sm:text-base">
                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-gold-400 print:text-gold-600" />
                  <span>Med vs Caribbean market comparison</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-sm text-gray-300 print:text-gray-700 sm:text-base">
                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-gold-400 print:text-gold-600" />
                  <span>Negotiation tips from recruiters</span>
                </div>
              </div>

              {candidateSubmitted ? (
                <div className="flex items-center justify-center gap-3 rounded-lg bg-green-500/10 p-4 text-green-400 print:bg-green-50 print:text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span>Check your inbox! Guide on its way.</span>
                </div>
              ) : (
                <form onSubmit={handleCandidateSubmit} className="space-y-4 print:space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 print:text-gray-400" />
                    <input
                      type="email"
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full rounded-lg border border-white/20 bg-white/5 py-4 pl-12 pr-4 text-white placeholder:text-gray-500 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400 print:border-gray-300 print:bg-white print:text-navy-900 print:placeholder:text-gray-400 print:focus:border-gold-600 print:focus:ring-gold-600"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full print:bg-gold-600 print:text-white print:hover:bg-gold-700"
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
                  <p className="text-center text-xs text-gray-500 print:text-gray-600 print:text-sm">
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
