"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Anchor, Mail, ArrowLeft, CheckCircle2, ArrowRight, Send } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 1500);
  };

  const handleResend = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 size-80 rounded-full bg-gold-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 size-80 rounded-full bg-navy-200/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-navy-900 shadow-lg">
              <Anchor className="size-7 text-gold-400" />
            </div>
          </Link>
          <h1 className="text-4xl font-serif font-semibold text-navy-800">Lighthouse Network</h1>
          <p className="text-sm text-gray-500">Premium Yacht Crew Recruitment</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xl">
          {!isSuccess ? (
            // Request Form
            <div className="p-6">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-serif font-medium text-navy-800">Forgot Password?</h2>
                <p className="mt-1 text-sm text-gray-500">
                  No worries! Enter your email and we'll send you reset instructions.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Input */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-medium text-navy-900"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isLoading || !email}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="size-4 animate-spin" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="size-4" />
                      Send Reset Link
                    </span>
                  )}
                </Button>
              </form>

              {/* Back to Login */}
              <div className="mt-6 text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-navy-900"
                >
                  <ArrowLeft className="size-4" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            // Success State
            <div className="p-6 text-center">
              {/* Success Icon */}
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-success-100">
                <CheckCircle2 className="size-8 text-success-600" />
              </div>

              <h2 className="mb-2 text-2xl font-serif font-medium text-navy-800">Check Your Email</h2>
              <p className="mb-6 text-sm text-gray-500">
                We've sent a password reset link to{" "}
                <span className="font-medium text-navy-900">{email}</span>
              </p>

              {/* Email Icon with animation */}
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-gold-200 opacity-50" />
                  <div className="relative flex size-12 items-center justify-center rounded-full bg-gold-100">
                    <Mail className="size-6 text-gold-600" />
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="mb-6 rounded-lg bg-gray-50 p-4 text-left">
                <p className="mb-2 text-sm font-medium text-navy-900">Next steps:</p>
                <ol className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gold-100 text-xs font-bold text-gold-700">
                      1
                    </span>
                    Check your inbox (and spam folder)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gold-100 text-xs font-bold text-gold-700">
                      2
                    </span>
                    Click the reset link in the email
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gold-100 text-xs font-bold text-gold-700">
                      3
                    </span>
                    Create a new secure password
                  </li>
                </ol>
              </div>

              {/* Resend */}
              <p className="mb-4 text-sm text-gray-500">
                Didn't receive the email?{" "}
                <button
                  onClick={handleResend}
                  disabled={isLoading}
                  className="font-medium text-gold-600 hover:text-gold-700 disabled:opacity-50"
                >
                  {isLoading ? "Sending..." : "Resend"}
                </button>
              </p>

              {/* Open Email Client */}
              <Button variant="outline" className="w-full" asChild>
                <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer">
                  <Mail className="mr-2 size-4" />
                  Open Email App
                </a>
              </Button>

              {/* Back to Login */}
              <div className="mt-4">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-navy-900"
                >
                  <ArrowLeft className="size-4" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Help text */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Having trouble? Contact{" "}
          <a href="mailto:support@lighthousenetwork.com" className="text-navy-600 hover:underline">
            support@lighthousenetwork.com
          </a>
        </p>
      </div>
    </div>
  );
}
