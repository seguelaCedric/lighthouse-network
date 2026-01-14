"use client";

import { useState } from "react";
import Link from "next/link";
import { DollarSign, Download, ArrowRight, Anchor, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SalaryGuideModal } from "./SalaryGuideModal";

export function SalaryGuideHero() {
  const [modalOpen, setModalOpen] = useState(false);

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setModalOpen(true);
  };

  return (
    <>
      <section className="mt-12">
        <Link href="/salary-guide" className="group block">
          <article className="relative overflow-hidden rounded-2xl border border-gold-200 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 p-8 transition-all hover:border-gold-400 hover:shadow-2xl sm:p-10 md:p-12">
            {/* Decorative elements with hover animations */}
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold-500/10 transition-all duration-500 ease-out group-hover:scale-110 group-hover:bg-gold-500/20" />
            <div className="absolute -bottom-8 -left-8 h-48 w-48 rounded-full bg-gold-500/5 transition-all duration-700 ease-out group-hover:scale-125 group-hover:bg-gold-500/15" />
            <div className="absolute right-1/4 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-gold-500/5 transition-all duration-500 ease-out group-hover:scale-150 group-hover:bg-gold-500/10" />

            <div className="relative z-10 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-full bg-gold-500 p-3">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <span className="rounded-full bg-gold-500/20 px-4 py-1.5 text-sm font-semibold uppercase tracking-wider text-gold-400">
                    2026 Edition
                  </span>
                </div>

                <h2 className="mb-4 font-serif text-3xl font-semibold text-white sm:text-4xl">
                  Salary Guide
                </h2>

                <p className="max-w-xl text-lg text-navy-200">
                  Comprehensive salary data and market insights for yacht crew and
                  private household staff positions across all experience levels.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-navy-300">
                  <div className="flex items-center gap-2">
                    <Anchor className="h-4 w-4 text-gold-500" />
                    <span>Yacht Crew Roles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-gold-500" />
                    <span>Private Staff Positions</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start gap-4 sm:items-end">
                <Button
                  variant="primary"
                  size="lg"
                  className="hover:bg-gold-400 hover:shadow-[0px_6px_16px_rgba(212,188,134,0.5)]"
                  onClick={handleDownloadClick}
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download Guide
                </Button>
                <span className="flex items-center gap-2 text-sm text-navy-300 transition-colors group-hover:text-gold-400">
                  View online version
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </article>
        </Link>
      </section>

      <SalaryGuideModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
