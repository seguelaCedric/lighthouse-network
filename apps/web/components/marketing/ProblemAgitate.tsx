"use client";

import { XCircle, Clock, Ghost, UserX, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ProblemAgitate() {
  return (
    <section className="bg-gray-50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
            Frustrated with Recruitment?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-600">
            We&apos;ve heard these stories thousands of times. Here&apos;s why people switch to us.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Candidate Pain Points */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-8">
            <h3 className="mb-6 font-serif text-xl font-semibold text-navy-900">
              If You&apos;re Looking for Work
            </h3>

            <div className="space-y-5">
              <div className="flex gap-3">
                <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    &ldquo;I&apos;ve applied to 50 jobs. Heard back from 3.&rdquo;
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Ghost className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    &ldquo;Agencies ghost me after the first call.&rdquo;
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    &ldquo;The season is starting and I still don&apos;t have a position.&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* The Lighthouse Difference */}
            <div className="mt-8 border-t border-gray-100 pt-6">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-gold-600">
                The Lighthouse Difference
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">We proactively match you</span>, no mass applying. We call you when a role fits.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">14+ years of relationships</span>, we know captains and estate managers by name.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">You&apos;ll always hear back</span>, updates within 48 hours, every time.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6">
              <Link href="/job-board">
                <Button variant="secondary" className="w-full">
                  See Open Positions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Client Pain Points */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-8">
            <h3 className="mb-6 font-serif text-xl font-semibold text-navy-900">
              If You&apos;re Hiring
            </h3>

            <div className="space-y-5">
              <div className="flex gap-3">
                <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    &ldquo;I paid upfront and got 3 unsuitable CVs.&rdquo;
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <UserX className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    &ldquo;My last hire left after 2 weeks.&rdquo;
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    &ldquo;I need someone yesterday, not next month.&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* The Lighthouse Difference */}
            <div className="mt-8 border-t border-gray-100 pt-6">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-gold-600">
                The Lighthouse Difference
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">No upfront fees</span>, you only pay when you hire someone who works out.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">Free replacement guarantee</span>, if they leave early, we find someone else at no extra cost.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">Pre-vetted candidates same day</span>, we don&apos;t post ads, we tap our 44,000+ network.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6">
              <Link href="/contact">
                <Button className="w-full">
                  Get Staff Today
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
