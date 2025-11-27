"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signIn, signInWithGoogle } from "@/lib/auth/actions";
import { loginSchema, type LoginFormData } from "@/lib/auth/validation";
import {
  Eye,
  EyeOff,
  Anchor,
  Mail,
  Lock,
  ArrowRight,
  X,
  Smartphone,
} from "lucide-react";

// Two-Factor Authentication Modal
function TwoFactorModal({
  onClose,
  onVerify,
}: {
  onClose: () => void;
  onVerify: (code: string) => void;
}) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`2fa-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`2fa-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = [...code];
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);
  };

  const handleSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      onVerify(code.join(""));
      setIsLoading(false);
    }, 1500);
  };

  const isComplete = code.every((digit) => digit !== "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-gold-100">
              <Smartphone className="size-5 text-gold-600" />
            </div>
            <div>
              <h3 className="font-semibold text-navy-900">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-500">
                Enter the code from your authenticator app
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 flex justify-center gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`2fa-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={cn(
                  "size-12 rounded-lg border-2 text-center text-xl font-bold transition-colors",
                  "focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20",
                  digit
                    ? "border-gold-400 text-navy-900"
                    : "border-gray-200 text-gray-400"
                )}
              />
            ))}
          </div>

          <p className="mb-6 text-center text-sm text-gray-500">
            Didn't receive a code?{" "}
            <button className="font-medium text-gold-600 hover:text-gold-700">
              Resend
            </button>
          </p>

          <Button
            variant="primary"
            className="w-full"
            onClick={handleSubmit}
            disabled={!isComplete || isLoading}
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
                Verifying...
              </span>
            ) : (
              "Verify"
            )}
          </Button>
        </div>

        <div className="border-t border-gray-100 p-4">
          <p className="text-center text-xs text-gray-500">
            Having trouble?{" "}
            <button className="font-medium text-navy-600 hover:text-navy-700">
              Use backup code
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [show2FA, setShow2FA] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    const result = await signIn(data.email, data.password);

    if (!result.success) {
      toast.error(result.error || "Failed to sign in");
      return;
    }

    toast.success("Signed in successfully");
    router.push("/dashboard");
    router.refresh();
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to sign in with Google"
      );
    }
  };

  const handle2FAVerify = (code: string) => {
    console.log("2FA code:", code);
    setShow2FA(false);
    router.push("/dashboard");
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
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-navy-900 shadow-lg">
            <Anchor className="size-7 text-gold-400" />
          </div>
          <h1 className="font-serif text-4xl font-semibold text-navy-800">
            Lighthouse Network
          </h1>
          <p className="text-sm text-gray-500">Premium Yacht Crew Recruitment</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="p-6">
            <div className="mb-6 text-center">
              <h2 className="font-serif text-2xl font-medium text-navy-800">
                Welcome back
              </h2>
              <p className="text-sm text-gray-500">
                Sign in to your account to continue
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    {...register("email")}
                    placeholder="you@example.com"
                    className={cn(
                      "w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-navy-900 placeholder:text-gray-400 focus:outline-none focus:ring-2",
                      errors.email
                        ? "border-burgundy-300 focus:border-burgundy-500 focus:ring-burgundy-500/20"
                        : "border-gray-200 focus:border-gold-500 focus:ring-gold-500/20"
                    )}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-burgundy-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-navy-900"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="Enter your password"
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
                  <p className="mt-1 text-xs text-burgundy-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="size-4 rounded border-gray-300 text-gold-600 focus:ring-gold-500"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-gold-600 hover:text-gold-700"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
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
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="size-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-sm text-gray-400">or</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <svg className="size-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 p-4 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <Link
                href="/auth/register"
                className="font-medium text-gold-600 hover:text-gold-700"
              >
                Register as Crew
              </Link>{" "}
              or{" "}
              <button className="font-medium text-navy-600 hover:text-navy-700">
                Contact Us
              </button>
            </p>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Lock className="size-3" />
            256-bit SSL
          </span>
          <span>-</span>
          <span>GDPR Compliant</span>
          <span>-</span>
          <span>SOC 2 Certified</span>
        </div>
      </div>

      {/* 2FA Modal */}
      {show2FA && (
        <TwoFactorModal onClose={() => setShow2FA(false)} onVerify={handle2FAVerify} />
      )}
    </div>
  );
}
