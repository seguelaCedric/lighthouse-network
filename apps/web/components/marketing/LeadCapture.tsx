"use client";

import { useState } from "react";
import { Download, CheckCircle, Loader2, Mail, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LeadCapture() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/salary-guide/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to request salary guide");
      }

      setSubmitted(true);
    } catch (error) {
      console.error("Error requesting salary guide:", error);
      alert(error instanceof Error ? error.message : "Failed to request salary guide. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative bg-white py-16 sm:py-24 print:bg-white print:py-12 print:break-inside-avoid">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear_gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center print:mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-sm font-medium text-gold-600 mb-4">
            <FileText className="h-4 w-4" />
            Free Resource
          </div>
          <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl print:text-3xl print:text-navy-900">
            Know Your Worth
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-600 print:text-gray-700 print:text-base">
            Get our comprehensive salary guide for yacht crew and private household staff.
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          {/* Salary Guide Lead Magnet */}
          <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-gold-500/50 print:border-2 print:border-gold-600 print:bg-white print:shadow-lg print:p-10">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gold-500/10 transition-transform group-hover:scale-150" />

            <div className="relative flex flex-col flex-1">
              <div className="mb-6 flex justify-center print:mb-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500/20 to-gold-500/10 print:bg-gold-100 print:h-20 print:w-20">
                  <Download className="h-8 w-8 text-gold-600 print:text-gold-600 print:h-10 print:w-10" />
                </div>
              </div>

              <h3 className="mb-3 text-center font-serif text-xl font-semibold text-navy-900 print:text-2xl print:text-navy-900 sm:text-2xl">
                2026 Salary Guide
              </h3>
              <p className="mb-6 text-center text-sm text-gray-600 print:text-gray-700 print:mb-6 sm:text-base">
                The latest salary ranges for all positions, from Junior Stew to Captain,
                and from Nanny to Estate Manager.
              </p>

              {/* What's included */}
              <div className="mb-6 space-y-2 print:mb-6 flex-1">
                <div className="flex items-center gap-3 text-sm text-gray-600 print:text-gray-700">
                  <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500 print:text-gold-600" />
                  <span>Salaries by position and yacht size</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 print:text-gray-700">
                  <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500 print:text-gold-600" />
                  <span>Med vs Caribbean market comparison</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 print:text-gray-700">
                  <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500 print:text-gold-600" />
                  <span>Negotiation tips from recruiters</span>
                </div>
              </div>

              {submitted ? (
                <div className="flex items-center justify-center gap-3 rounded-lg bg-green-50 p-4 text-green-700 print:bg-green-50 print:text-green-700 mt-auto">
                  <CheckCircle className="h-5 w-5" />
                  <span>Check your inbox! Guide on its way.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3 print:space-y-3 mt-auto">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 print:text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-12 pr-4 text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 print:border-gray-300 print:bg-white print:text-navy-900 print:placeholder:text-gray-400 print:focus:border-gold-600 print:focus:ring-gold-600"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full print:bg-gold-600 print:text-white print:hover:bg-gold-700"
                    disabled={loading}
                  >
                    {loading ? (
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
          </div>
        </div>
      </div>
    </section>
  );
}
