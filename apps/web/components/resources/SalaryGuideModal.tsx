"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Download,
  CheckCircle,
  Loader2,
  Mail,
} from "lucide-react";

interface SalaryGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SalaryGuideModal({ open, onOpenChange }: SalaryGuideModalProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/salary-guide/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to request salary guide");
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Error requesting salary guide:", err);
      setError(
        err instanceof Error ? err.message : "Failed to request salary guide. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after modal closes
    setTimeout(() => {
      setSubmitted(false);
      setEmail("");
      setError(null);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <div className="relative pt-4">
          {/* Decorative circle */}
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gold-500/10 pointer-events-none" />

          <div className="relative">
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500/20 to-gold-500/10">
                <Download className="h-8 w-8 text-gold-600" />
              </div>
            </div>

            {/* Title */}
            <h2 className="mb-3 text-center font-serif text-2xl font-semibold text-navy-900">
              2026 Salary Guide
            </h2>

            {/* Description */}
            <p className="mb-6 text-center text-gray-600">
              The latest salary ranges for all positions, from Junior Stew to Captain,
              and from Nanny to Estate Manager.
            </p>

            {/* What's included */}
            <div className="mb-6 space-y-2">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
                <span>Salaries by position and yacht size</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
                <span>Med vs Caribbean market comparison</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
                <span>Negotiation tips from recruiters</span>
              </div>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center gap-3 rounded-lg bg-green-50 p-6 text-center">
                <CheckCircle className="h-10 w-10 text-green-500" />
                <div>
                  <p className="font-medium text-green-700">Check your inbox!</p>
                  <p className="text-sm text-green-600">
                    Your salary guide is on its way.
                  </p>
                </div>
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={handleClose}
                  className="mt-2"
                >
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-12 pr-4 text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download Free Guide
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-gray-500">
                  No spam, ever. Unsubscribe anytime.
                </p>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
