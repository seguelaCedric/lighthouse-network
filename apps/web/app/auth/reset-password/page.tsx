"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { updatePassword } from "@/lib/auth/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Password strength indicators
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    const result = await updatePassword(password);
    setIsLoading(false);

    if (!result.success) {
      toast.error(result.error || "Failed to reset password");
      return;
    }

    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 size-80 rounded-full bg-gold-200/30 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 size-80 rounded-full bg-navy-200/30 blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex justify-center">
              <Logo size="xl" />
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-success-100">
                <CheckCircle2 className="size-8 text-success-600" />
              </div>
              <h1 className="mb-2 font-serif text-2xl font-semibold text-navy-900">
                Password Reset Complete
              </h1>
              <p className="mb-6 text-gray-600">
                Your password has been successfully updated. You can now sign in with your new password.
              </p>

              <Button
                variant="primary"
                className="w-full"
                onClick={() => router.push("/auth/login")}
              >
                <span className="flex items-center gap-2">
                  Sign In Now
                  <ArrowRight className="size-4" />
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 size-80 rounded-full bg-gold-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 size-80 rounded-full bg-navy-200/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex justify-center">
            <Logo size="xl" />
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="p-6">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-navy-100">
                <ShieldCheck className="size-6 text-navy-600" />
              </div>
              <h2 className="font-serif text-2xl font-medium text-navy-800">
                Create New Password
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Enter a strong password to secure your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-navy-900"
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className={cn(
                      "w-full rounded-lg border bg-white py-2.5 pl-10 pr-12 text-navy-900 placeholder:text-gray-400 focus:outline-none focus:ring-2",
                      errors.password
                        ? "border-burgundy-300 focus:border-burgundy-500 focus:ring-burgundy-500/20"
                        : "border-gray-200 focus:border-gold-500 focus:ring-gold-500/20"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-burgundy-600">{errors.password}</p>
                )}
              </div>

              {/* Password Strength Indicators */}
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="mb-2 text-xs font-medium text-gray-600">Password requirements:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className={cn("flex items-center gap-1.5 text-xs", hasMinLength ? "text-success-600" : "text-gray-400")}>
                    <div className={cn("size-1.5 rounded-full", hasMinLength ? "bg-success-500" : "bg-gray-300")} />
                    8+ characters
                  </div>
                  <div className={cn("flex items-center gap-1.5 text-xs", hasUppercase ? "text-success-600" : "text-gray-400")}>
                    <div className={cn("size-1.5 rounded-full", hasUppercase ? "bg-success-500" : "bg-gray-300")} />
                    Uppercase letter
                  </div>
                  <div className={cn("flex items-center gap-1.5 text-xs", hasLowercase ? "text-success-600" : "text-gray-400")}>
                    <div className={cn("size-1.5 rounded-full", hasLowercase ? "bg-success-500" : "bg-gray-300")} />
                    Lowercase letter
                  </div>
                  <div className={cn("flex items-center gap-1.5 text-xs", hasNumber ? "text-success-600" : "text-gray-400")}>
                    <div className={cn("size-1.5 rounded-full", hasNumber ? "bg-success-500" : "bg-gray-300")} />
                    Number
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-sm font-medium text-navy-900"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className={cn(
                      "w-full rounded-lg border bg-white py-2.5 pl-10 pr-12 text-navy-900 placeholder:text-gray-400 focus:outline-none focus:ring-2",
                      errors.confirmPassword
                        ? "border-burgundy-300 focus:border-burgundy-500 focus:ring-burgundy-500/20"
                        : passwordsMatch
                          ? "border-success-300 focus:border-success-500 focus:ring-success-500/20"
                          : "border-gray-200 focus:border-gold-500 focus:ring-gold-500/20"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-burgundy-600">{errors.confirmPassword}</p>
                )}
                {passwordsMatch && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-success-600">
                    <CheckCircle2 className="size-3" />
                    Passwords match
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading || !password || !confirmPassword}
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
                    Updating password...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Reset Password
                    <ArrowRight className="size-4" />
                  </span>
                )}
              </Button>
            </form>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Remember your password?{" "}
          <Link href="/auth/login" className="text-navy-600 hover:underline">
            Sign in instead
          </Link>
        </p>
      </div>
    </div>
  );
}
