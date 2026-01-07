"use client";

import Link from "next/link";
import { Ship, Users, ArrowRight, FileText, DollarSign, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AudienceSplit() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
            How Can We Help You Today?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-600">
            Whether you&apos;re looking for your next adventure or building your dream team,
            we&apos;ve got you covered.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Candidate Path */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-8 transition-all hover:border-gold-400 hover:shadow-xl">
            {/* Accent line */}
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-gold-400 to-gold-600" />

            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gold-100">
              <Ship className="h-7 w-7 text-gold-600" />
            </div>

            <h3 className="mb-2 font-serif text-2xl font-semibold text-navy-900">
              I&apos;m Looking for My Next Position
            </h3>
            <p className="mb-6 text-gray-600">
              Join 44,000+ candidates who&apos;ve found their dream roles on superyachts,
              in private villas, and prestigious households worldwide.
            </p>

            {/* Benefits list */}
            <div className="mb-8 space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
                <span>Yacht crew, estate staff, and household positions</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
                <span>Get matched to your ideal role and rotation</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
                <span>Free CV review and career guidance</span>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/job-board" className="flex-1">
                <Button className="w-full">
                  See Open Positions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/salary-guide" className="flex-1">
                <Button variant="secondary" className="w-full">
                  <DollarSign className="mr-2 h-4 w-4" />
                  2025 Salary Guide
                </Button>
              </Link>
            </div>
          </div>

          {/* Client Path */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-8 transition-all hover:border-navy-600 hover:shadow-xl">
            {/* Accent line */}
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-navy-600 to-navy-800" />

            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-navy-100">
              <Users className="h-7 w-7 text-navy-600" />
            </div>

            <h3 className="mb-2 font-serif text-2xl font-semibold text-navy-900">
              I Need to Hire
            </h3>
            <p className="mb-6 text-gray-600">
              Whether you need yacht crew or household staff - get pre-vetted candidates same day.
              No upfront fees. Only pay when you hire.
            </p>

            {/* Benefits list */}
            <div className="mb-8 space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Clock className="h-5 w-5 flex-shrink-0 text-gold-500" />
                <span>Receive qualified candidates same day</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
                <span>All candidates pre-screened and reference checked</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
                <span>Free replacement guarantee for peace of mind</span>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/contact" className="flex-1">
                <Button className="w-full">
                  Get Staff Today
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact" className="flex-1">
                <Button variant="secondary" className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Submit a Brief
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom trust indicator */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Not sure what you need?{" "}
            <a href="tel:+33676410299" className="font-medium text-gold-600 hover:text-gold-700">
              Call us
            </a>{" "}
            or{" "}
            <Link href="/contact" className="font-medium text-gold-600 hover:text-gold-700">
              send a message
            </Link>
            {" "}- we respond within 2 hours.
          </p>
        </div>
      </div>
    </section>
  );
}
