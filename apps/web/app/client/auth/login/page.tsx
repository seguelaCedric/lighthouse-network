"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Anchor,
  Mail,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Ship,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendMagicLink } from "@/lib/auth/client-actions";
import { cn } from "@/lib/utils";

export default function ClientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await sendMagicLink(email);

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="flex items-center gap-2">
              <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600">
                <Anchor className="size-6 text-white" />
              </div>
              <span className="font-serif text-2xl font-semibold text-white">
                Lighthouse
              </span>
            </div>
          </div>

          {/* Success Card */}
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-success-100">
                <CheckCircle2 className="size-8 text-success-600" />
              </div>
              <h1 className="mb-2 font-serif text-2xl font-semibold text-navy-900">
                Check Your Email
              </h1>
              <p className="mb-6 text-gray-600">
                We've sent a login link to{" "}
                <span className="font-medium text-navy-900">{email}</span>
              </p>

              <div className="rounded-lg bg-navy-50 p-4 text-left">
                <h3 className="mb-2 font-medium text-navy-900">What's next?</h3>
                <ol className="space-y-2 text-sm text-navy-700">
                  <li className="flex items-start gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-navy-200 text-xs font-semibold">
                      1
                    </span>
                    Open the email from Lighthouse Careers
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-navy-200 text-xs font-semibold">
                      2
                    </span>
                    Click the secure login link
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-navy-200 text-xs font-semibold">
                      3
                    </span>
                    You'll be logged in automatically
                  </li>
                </ol>
              </div>

              <p className="mt-6 text-sm text-gray-500">
                Didn't receive the email?{" "}
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                  }}
                  className="font-medium text-gold-600 hover:text-gold-700"
                >
                  Try again
                </button>
              </p>
            </div>
          </div>

          {/* Link expires notice */}
          <p className="mt-6 text-center text-sm text-gray-400">
            The login link will expire in 1 hour
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Branding */}
      <div className="hidden w-1/2 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600">
            <Anchor className="size-5 text-white" />
          </div>
          <span className="font-serif text-xl font-semibold text-white">
            Lighthouse
          </span>
        </div>

        {/* Hero Content */}
        <div className="space-y-6">
          <h1 className="font-serif text-4xl font-semibold leading-tight text-white">
            Your Crew,
            <br />
            <span className="text-gold-400">Your Way</span>
          </h1>
          <p className="max-w-md text-lg text-gray-300">
            Access your personalized portal to view shortlisted candidates,
            schedule interviews, and find your perfect crew.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-gold-500 text-sm font-semibold text-white ring-2 ring-navy-800">
                MY
              </div>
              <div className="flex size-10 items-center justify-center rounded-full bg-navy-600 text-sm font-semibold text-white ring-2 ring-navy-800">
                SE
              </div>
              <div className="flex size-10 items-center justify-center rounded-full bg-burgundy-500 text-sm font-semibold text-white ring-2 ring-navy-800">
                EL
              </div>
            </div>
            <p className="text-sm text-gray-400">
              Trusted by 500+ yacht owners and captains
            </p>
          </div>
        </div>

        {/* Footer Quote */}
        <div className="rounded-xl bg-white/5 p-6 backdrop-blur-sm">
          <p className="mb-3 font-serif text-lg italic text-gray-300">
            "Lighthouse made finding our Chief Stewardess incredibly simple.
            The shortlist was spot-on and we hired within a week."
          </p>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-navy-600 to-navy-800 font-semibold text-white">
              CM
            </div>
            <div>
              <p className="font-medium text-white">Captain Mike</p>
              <p className="text-sm text-gray-400">M/Y Serenity, 65m</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-full items-center justify-center bg-gray-50 px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600">
                <Anchor className="size-6 text-white" />
              </div>
              <span className="font-serif text-2xl font-semibold text-navy-900">
                Lighthouse
              </span>
            </div>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-navy-100">
                <Ship className="size-7 text-navy-600" />
              </div>
              <h1 className="font-serif text-2xl font-semibold text-navy-900">
                Client Portal
              </h1>
              <p className="mt-2 text-gray-600">
                Enter your email to receive a secure login link
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="captain@yacht.com"
                    required
                    className={cn(
                      "h-12 w-full rounded-lg border bg-white pl-10 pr-4 text-navy-900 placeholder:text-gray-400",
                      "focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20",
                      error ? "border-error-500" : "border-gray-300"
                    )}
                  />
                </div>
                {error && (
                  <p className="mt-1.5 text-sm text-error-600">{error}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                className="h-12 w-full"
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    Sending Link...
                  </>
                ) : (
                  <>
                    Send Login Link
                    <ArrowRight className="ml-2 size-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 rounded-lg bg-gray-50 p-4">
              <h3 className="mb-1 text-sm font-medium text-navy-900">
                No password required
              </h3>
              <p className="text-sm text-gray-600">
                We'll send a secure link to your email. Just click to log in -
                no password to remember.
              </p>
            </div>
          </div>

          {/* Help Text */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Need help?{" "}
            <a
              href="mailto:support@lighthouse.careers"
              className="font-medium text-gold-600 hover:text-gold-700"
            >
              Contact support
            </a>
          </p>

          {/* Recruiter Login Link */}
          <p className="mt-4 text-center text-sm text-gray-500">
            Are you a recruiter?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-navy-600 hover:text-navy-700"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
