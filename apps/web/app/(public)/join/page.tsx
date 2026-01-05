"use client";

import * as React from "react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Gift,
  CheckCircle,
  Ship,
  Globe,
  DollarSign,
  Users,
  ArrowRight,
  Loader2,
  Shield,
  Briefcase,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

interface ReferrerInfo {
  valid: boolean;
  referrer_name: string;
  referrer_photo: string | null;
  referrer_tier: string;
}

function JoinPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [referrerInfo, setReferrerInfo] = useState<ReferrerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasTracked, setHasTracked] = useState(false);

  const refCode = searchParams.get("ref");

  useEffect(() => {
    if (refCode && !hasTracked) {
      setIsLoading(true);

      // First validate the code and get referrer info
      fetch(`/api/referrals/track?code=${refCode}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            setReferrerInfo(data);

            // Track the click
            fetch("/api/referrals/track", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                code: refCode,
                source: searchParams.get("src") || "link",
                utm_campaign: searchParams.get("utm_campaign"),
                utm_source: searchParams.get("utm_source"),
                utm_medium: searchParams.get("utm_medium"),
              }),
            });

            setHasTracked(true);
          }
        })
        .catch((err) => {
          console.error("Failed to validate referral:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [refCode, hasTracked, searchParams]);

  const handleJoin = () => {
    // Navigate to register with referral code
    const params = new URLSearchParams();
    if (refCode) params.set("ref", refCode);
    router.push(`/auth/register?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 via-white to-gold-50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/">
            <Logo size="md" />
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/job-board"
              className="hidden px-3 py-2 text-sm font-medium text-gray-600 hover:text-navy-800 sm:block"
            >
              Jobs
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-12">
        {/* Referral Banner */}
        {referrerInfo && (
          <div className="mb-8 flex items-center justify-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-gold-200 bg-gold-50 px-6 py-3">
              <Gift className="size-5 text-gold-600" />
              <p className="text-gold-800">
                <span className="font-semibold">{referrerInfo.referrer_name}</span>{" "}
                invited you to join Lighthouse Crew Network
              </p>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 font-serif text-4xl font-semibold text-navy-900 sm:text-5xl">
            Your Next{" "}
            <span className="text-gold-600">Career Opportunity</span>{" "}
            Awaits
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Join the exclusive network where elite yacht crew and private household staff find their perfect
            placements. AI-powered matching, verified opportunities, and a
            community that supports your success.
          </p>
        </div>

        {/* CTA Cards */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2">
          {/* Main CTA */}
          <div className="rounded-2xl border border-gold-200 bg-white p-8 shadow-lg">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-gold-100">
                <Star className="size-6 text-gold-600" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-medium text-navy-900">
                  Create Your Profile
                </h3>
                <p className="text-sm text-gray-500">
                  Takes less than 5 minutes
                </p>
              </div>
            </div>

            <ul className="mb-6 space-y-3">
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="size-4 text-success-500" />
                Get matched with exclusive opportunities
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="size-4 text-success-500" />
                AI-powered job recommendations
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="size-4 text-success-500" />
                Direct connection with top recruiters
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="size-4 text-success-500" />
                Track applications in real-time
              </li>
            </ul>

            {referrerInfo && (
              <div className="mb-6 rounded-lg bg-success-50 p-4">
                <p className="flex items-center gap-2 text-sm text-success-800">
                  <Gift className="size-4" />
                  <strong>Bonus:</strong> Earn €25 when you land your first
                  placement!
                </p>
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleJoin}
            >
              Create Your Profile
              <ArrowRight className="ml-2 size-5" />
            </Button>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-navy-100">
                  <Ship className="size-5 text-navy-600" />
                </div>
                <h4 className="font-medium text-navy-900">500+ Elite Positions</h4>
              </div>
              <p className="text-sm text-gray-600">
                Access exclusive opportunities on yachts, private estates, and
                luxury households worldwide.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-gold-100">
                  <Globe className="size-5 text-gold-600" />
                </div>
                <h4 className="font-medium text-navy-900">Global Placements</h4>
              </div>
              <p className="text-sm text-gray-600">
                From the Mediterranean to the Caribbean, find positions in the
                most desirable cruising grounds.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-success-100">
                  <DollarSign className="size-5 text-success-600" />
                </div>
                <h4 className="font-medium text-navy-900">
                  Competitive Salaries
                </h4>
              </div>
              <p className="text-sm text-gray-600">
                Transparent salary ranges and direct negotiation with employers.
                No hidden fees.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-blue-100">
                  <Shield className="size-5 text-blue-600" />
                </div>
                <h4 className="font-medium text-navy-900">Verified Employers</h4>
              </div>
              <p className="text-sm text-gray-600">
                All yacht owners and management companies are verified. Work with
                trusted employers.
              </p>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="rounded-xl border border-gray-200 bg-white p-8">
          <div className="mb-6 text-center">
            <h3 className="font-serif text-xl font-medium text-navy-900">
              Trusted by Yacht Crew Worldwide
            </h3>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-3xl font-bold text-navy-900">2,500+</p>
              <p className="text-sm text-gray-500">Active Crew Members</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-navy-900">500+</p>
              <p className="text-sm text-gray-500">Job Placements</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-navy-900">50+</p>
              <p className="text-sm text-gray-500">Yacht Clients</p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Button
            variant="primary"
            size="lg"
            onClick={handleJoin}
          >
            Join Lighthouse Network
            <ArrowRight className="ml-2 size-5" />
          </Button>
          <p className="mt-4 text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-gold-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Logo size="sm" />

            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Lighthouse Crew Network. All
              rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-8 animate-spin text-gold-500" />
        </div>
      }
    >
      <JoinPageContent />
    </Suspense>
  );
}
