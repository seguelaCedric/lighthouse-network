"use client";

import { useState, useEffect } from "react";
import { X, Ship, Users, Download, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ExitIntent() {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedPath, setSelectedPath] = useState<"candidate" | "client" | null>(null);

  useEffect(() => {
    setMounted(true);

    // Check if popup was already shown this session
    const wasShown = sessionStorage.getItem("exit-intent-shown");
    if (wasShown) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse leaves from the top of the page
      if (e.clientY <= 0) {
        setIsVisible(true);
        sessionStorage.setItem("exit-intent-shown", "true");
        // Remove listener after showing once
        document.removeEventListener("mouseleave", handleMouseLeave);
      }
    };

    // Add small delay before enabling exit intent
    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 5000); // Wait 5 seconds before enabling

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!mounted || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg animate-in fade-in zoom-in-95 rounded-2xl bg-white p-8 shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close popup"
        >
          <X className="h-5 w-5" />
        </button>

        {!selectedPath ? (
          // Initial path selection
          <>
            <div className="mb-6 text-center">
              <h2 className="font-serif text-2xl font-semibold text-navy-900">
                Before You Go...
              </h2>
              <p className="mt-2 text-gray-600">
                Which best describes you?
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setSelectedPath("candidate")}
                className="group flex w-full items-center gap-4 rounded-xl border-2 border-gray-200 bg-white p-4 text-left transition-all hover:border-gold-400 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold-100">
                  <Ship className="h-6 w-6 text-gold-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-navy-900">I'm Looking for Work</p>
                  <p className="text-sm text-gray-500">Yacht crew or private household positions</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-gold-500" />
              </button>

              <button
                onClick={() => setSelectedPath("client")}
                className="group flex w-full items-center gap-4 rounded-xl border-2 border-gray-200 bg-white p-4 text-left transition-all hover:border-navy-600 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy-100">
                  <Users className="h-6 w-6 text-navy-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-navy-900">I Need to Hire</p>
                  <p className="text-sm text-gray-500">Find pre-vetted staff same day</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-navy-600" />
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-gray-400">
              We won't spam you. Ever.
            </p>
          </>
        ) : selectedPath === "candidate" ? (
          // Candidate path - Salary Guide offer
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold-100">
                <Download className="h-8 w-8 text-gold-600" />
              </div>
              <h2 className="font-serif text-2xl font-semibold text-navy-900">
                Free 2025 Salary Guide
              </h2>
              <p className="mt-2 text-gray-600">
                Know your worth. Get industry-standard salary ranges for yacht crew and private household positions.
              </p>
            </div>

            <div className="space-y-4">
              <Link href="/salary-guide" onClick={handleClose}>
                <Button className="w-full" size="lg">
                  Download Free Guide
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <div className="text-center">
                <Link
                  href="/job-board"
                  onClick={handleClose}
                  className="text-sm text-gold-600 hover:text-gold-700"
                >
                  Or browse open positions instead
                </Link>
              </div>
            </div>

            <button
              onClick={() => setSelectedPath(null)}
              className="mt-4 w-full text-center text-xs text-gray-400 hover:text-gray-600"
            >
              Back to options
            </button>
          </>
        ) : (
          // Client path - Quick brief offer
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-navy-100">
                <Users className="h-8 w-8 text-navy-600" />
              </div>
              <h2 className="font-serif text-2xl font-semibold text-navy-900">
                Get Candidates Today
              </h2>
              <p className="mt-2 text-gray-600">
                Tell us what you need and receive pre-vetted candidates same day. No upfront fees.
              </p>
            </div>

            <div className="space-y-4">
              <Link href="/contact" onClick={handleClose}>
                <Button className="w-full" size="lg">
                  Submit a Brief
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <div className="text-center">
                <a
                  href="tel:+33676410299"
                  className="text-sm text-gold-600 hover:text-gold-700"
                >
                  Or call us now: +33 6 76 41 02 99
                </a>
              </div>
            </div>

            <button
              onClick={() => setSelectedPath(null)}
              className="mt-4 w-full text-center text-xs text-gray-400 hover:text-gray-600"
            >
              Back to options
            </button>
          </>
        )}
      </div>
    </div>
  );
}
