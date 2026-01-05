"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Users,
  Calendar,
  DollarSign,
  Ship,
  Clock,
  Loader2,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Placement {
  id: string;
  startDate: string | null;
  salary: number | null;
  salaryCurrency: string | null;
  salaryPeriod: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  job: {
    id: string;
    title: string;
    vesselName: string;
  };
  candidate: {
    id: string;
    firstName: string;
    lastInitial: string;
    position: string;
    verificationTier: string;
  };
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function PlacementCard({ placement }: { placement: Placement }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Status Icon */}
          <div className="flex size-12 items-center justify-center rounded-full bg-success-100">
            <CheckCircle2 className="size-6 text-success-600" />
          </div>

          {/* Details */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-navy-900">
                {placement.candidate.firstName} {placement.candidate.lastInitial}.
              </h3>
              <span className="rounded-full bg-success-100 px-2 py-0.5 text-xs font-medium text-success-700">
                Placed
              </span>
            </div>
            <p className="text-sm text-gray-600">{placement.candidate.position}</p>
            <p className="mt-1 text-xs text-gray-500">
              {placement.job.title} • {placement.job.vesselName}
            </p>
          </div>
        </div>

        {/* Date */}
        <div className="text-right">
          <p className="text-sm font-medium text-navy-900">
            {placement.startDate ? formatDate(placement.startDate) : "TBD"}
          </p>
          <p className="text-xs text-gray-500">Start Date</p>
        </div>
      </div>

      {/* Additional Details */}
      <div className="mt-4 grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-3">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Confirmed</p>
            <p className="text-sm font-medium text-navy-900">
              {formatDate(placement.createdAt)}
            </p>
          </div>
        </div>
        {placement.salary && (
          <div className="flex items-center gap-2">
            <DollarSign className="size-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Salary</p>
              <p className="text-sm font-medium text-navy-900">
                {placement.salaryCurrency} {placement.salary.toLocaleString("en-US")}{" "}
                <span className="text-xs text-gray-500">/{placement.salaryPeriod}</span>
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Ship className="size-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Vessel</p>
            <p className="text-sm font-medium text-navy-900">{placement.job.vesselName}</p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {placement.notes && (
        <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <p className="text-sm text-gray-600">{placement.notes}</p>
        </div>
      )}
    </div>
  );
}

export default function PlacementsPage() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlacements = async () => {
      try {
        const response = await fetch("/api/client/placements");
        if (!response.ok) {
          throw new Error("Failed to fetch placements");
        }
        const result = await response.json();
        setPlacements(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchPlacements();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-serif font-semibold text-navy-800">
                Successful Placements
              </h1>
              <p className="mt-1 text-gray-500">
                Track your hiring history with Lighthouse Crew Network
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full bg-gold-100 px-4 py-2">
                <Trophy className="size-5 text-gold-600" />
                <span className="text-lg font-bold text-gold-700">{placements.length}</span>
                <span className="text-sm text-gold-600">placements</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-success-100">
                <CheckCircle2 className="size-5 text-success-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900">{placements.length}</p>
                <p className="text-sm text-gray-500">Total Placements</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-navy-100">
                <Users className="size-5 text-navy-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900">
                  {new Set(placements.map((p) => p.candidate.id)).size}
                </p>
                <p className="text-sm text-gray-500">Unique Crew</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-gold-100">
                <Clock className="size-5 text-gold-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900">
                  {placements.length > 0
                    ? Math.round(
                        (Date.now() - new Date(placements[placements.length - 1].createdAt).getTime()) /
                          (1000 * 60 * 60 * 24 * 30)
                      )
                    : 0}
                </p>
                <p className="text-sm text-gray-500">Months Partnership</p>
              </div>
            </div>
          </div>
        </div>

        {/* Placements List */}
        {error ? (
          <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-center text-error-700">
            {error}
          </div>
        ) : placements.length > 0 ? (
          <div className="space-y-4">
            {placements.map((placement) => (
              <PlacementCard key={placement.id} placement={placement} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <Trophy className="mx-auto size-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-navy-900">No placements yet</h3>
            <p className="mt-2 text-gray-500">
              Your successful placements will appear here once confirmed
            </p>
            <Link href="/client/searches">
              <Button variant="primary" className="mt-4">
                View Active Searches
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
