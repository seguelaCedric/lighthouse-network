"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Users,
  Ship,
  Home,
  Shield,
  Clock,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function EmployerLoginPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/employer/auth/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
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
            <Link href="/">
              <Logo size="lg" />
            </Link>
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
                    Open the email from Lighthouse
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
                    Access your employer portal
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
        <Link href="/">
          <Logo size="md" />
        </Link>

        {/* Hero Content */}
        <div className="space-y-6">
          <h1 className="font-serif text-4xl font-semibold leading-tight text-white">
            Find Your
            <br />
            <span className="text-gold-400">Perfect Crew</span>
          </h1>
          <p className="max-w-md text-lg text-gray-300">
            Access your portal to view shortlisted candidates, submit hiring
            briefs, and connect with top yacht crew and private staff.
          </p>

          {/* Features */}
          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Ship className="size-5 text-gold-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Yacht Crew</h3>
                <p className="text-sm text-gray-400">
                  Captains, engineers, stewardesses & more
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Home className="size-5 text-gold-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Private Staff</h3>
                <p className="text-sm text-gray-400">
                  Housekeepers, chefs, butlers & estate managers
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Shield className="size-5 text-gold-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Verified Candidates</h3>
                <p className="text-sm text-gray-400">
                  All candidates screened & reference checked
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Quote */}
        <div className="rounded-xl bg-white/5 p-6 backdrop-blur-sm">
          <p className="mb-3 font-serif text-lg italic text-gray-300">
            "Lighthouse found us the perfect Chief Stew within 48 hours. Their
            AI matching is incredibly accurate."
          </p>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-navy-600 to-navy-800 font-semibold text-white">
              JM
            </div>
            <div>
              <p className="font-medium text-white">Captain James</p>
              <p className="text-sm text-gray-400">M/Y Aurora, 72m</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-full items-center justify-center bg-gray-50 px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <Link href="/">
              <Logo size="lg" />
            </Link>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-navy-100">
                <Users className="size-7 text-navy-600" />
              </div>
              <h1 className="font-serif text-2xl font-semibold text-navy-900">
                Employer Portal
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
                    placeholder="you@company.com"
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
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 size-5 shrink-0 text-gray-400" />
                <div>
                  <h3 className="text-sm font-medium text-navy-900">
                    No password required
                  </h3>
                  <p className="text-sm text-gray-600">
                    We'll send a secure link to your email. Just click to log in.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Register Link */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link
              href="/employer/register"
              className="font-medium text-gold-600 hover:text-gold-700"
            >
              Register as an employer
            </Link>
          </p>

          {/* Crew Login Link */}
          <p className="mt-4 text-center text-sm text-gray-500">
            Looking for work?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-navy-600 hover:text-navy-700"
            >
              Sign in as crew
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
