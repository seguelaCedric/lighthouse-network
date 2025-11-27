"use client";

import Link from "next/link";
import { Anchor, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 size-80 rounded-full bg-gold-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 size-80 rounded-full bg-navy-200/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md text-center">
        <div className="mb-8">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-navy-900 shadow-lg">
            <Anchor className="size-7 text-gold-400" />
          </div>
          <h1 className="font-serif text-4xl font-semibold text-navy-800">
            Lighthouse Network
          </h1>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-burgundy-100">
            <AlertCircle className="size-8 text-burgundy-600" />
          </div>

          <h2 className="mb-2 font-serif text-2xl font-medium text-navy-800">
            Authentication Error
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            We couldn't verify your authentication. This could happen if the link
            has expired or has already been used.
          </p>

          <div className="space-y-3">
            <Link href="/auth/login">
              <Button variant="primary" className="w-full">
                <ArrowLeft className="mr-2 size-4" />
                Back to Sign In
              </Button>
            </Link>

            <p className="text-xs text-gray-400">
              Need help?{" "}
              <a
                href="mailto:support@lighthousenetwork.com"
                className="font-medium text-navy-600 hover:underline"
              >
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
