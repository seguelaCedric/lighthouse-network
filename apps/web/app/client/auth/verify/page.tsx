"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Anchor,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyMagicLink } from "@/lib/auth/client-actions";

type VerifyState = "loading" | "success" | "error";

export default function ClientVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerifyState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setState("error");
      setError("No login token provided.");
      return;
    }

    const verify = async () => {
      try {
        const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : undefined;
        const result = await verifyMagicLink(token, userAgent);

        if (result.success) {
          setState("success");
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push("/client/dashboard");
          }, 1500);
        } else {
          setState("error");
          setError(result.error || "Verification failed.");
        }
      } catch {
        setState("error");
        setError("Something went wrong. Please try again.");
      }
    };

    verify();
  }, [searchParams, router]);

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

        {/* Status Card */}
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          {state === "loading" && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-navy-100">
                <Loader2 className="size-8 animate-spin text-navy-600" />
              </div>
              <h1 className="mb-2 font-serif text-2xl font-semibold text-navy-900">
                Verifying Login...
              </h1>
              <p className="text-gray-600">
                Please wait while we verify your login link.
              </p>
            </div>
          )}

          {state === "success" && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-success-100">
                <CheckCircle2 className="size-8 text-success-600" />
              </div>
              <h1 className="mb-2 font-serif text-2xl font-semibold text-navy-900">
                Login Successful!
              </h1>
              <p className="mb-6 text-gray-600">
                Redirecting you to your dashboard...
              </p>
              <div className="flex justify-center">
                <div className="flex items-center gap-1">
                  <div className="size-2 animate-pulse rounded-full bg-gold-500" />
                  <div
                    className="size-2 animate-pulse rounded-full bg-gold-500"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="size-2 animate-pulse rounded-full bg-gold-500"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          {state === "error" && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-error-100">
                <XCircle className="size-8 text-error-600" />
              </div>
              <h1 className="mb-2 font-serif text-2xl font-semibold text-navy-900">
                Login Failed
              </h1>
              <p className="mb-6 text-gray-600">{error}</p>

              <div className="space-y-3">
                <Link href="/client/auth/login">
                  <Button variant="primary" className="w-full">
                    Request New Login Link
                    <ArrowRight className="ml-2 size-5" />
                  </Button>
                </Link>

                <p className="text-sm text-gray-500">
                  Login links expire after 1 hour for security reasons.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Help Text */}
        {state === "error" && (
          <p className="mt-6 text-center text-sm text-gray-400">
            Having trouble?{" "}
            <a
              href="mailto:support@lighthouse.careers"
              className="font-medium text-gold-400 hover:text-gold-300"
            >
              Contact support
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
