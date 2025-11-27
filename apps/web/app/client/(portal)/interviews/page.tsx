"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
  Calendar,
  Video,
  Phone,
  Users,
  Clock,
  MapPin,
  ExternalLink,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Interview {
  id: string;
  status: string;
  requestedType: string;
  scheduledAt: string | null;
  meetingLink: string | null;
  meetingLocation: string | null;
  durationMinutes: number;
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

interface InterviewsData {
  upcoming: Interview[];
  past: Interview[];
  totalCount: number;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InterviewTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "video":
      return <Video className="size-5 text-navy-500" />;
    case "phone":
      return <Phone className="size-5 text-navy-500" />;
    case "in_person":
      return <Users className="size-5 text-navy-500" />;
    default:
      return <Video className="size-5 text-navy-500" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: "Pending Scheduling", className: "bg-warning-100 text-warning-700" },
    scheduled: { label: "Scheduled", className: "bg-success-100 text-success-700" },
    completed: { label: "Completed", className: "bg-gray-100 text-gray-600" },
    cancelled: { label: "Cancelled", className: "bg-error-100 text-error-600" },
  };

  const { label, className } = config[status] || config.pending;
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", className)}>
      {label}
    </span>
  );
}

function InterviewCard({ interview }: { interview: Interview }) {
  const isScheduled = interview.status === "scheduled" && interview.scheduledAt;
  const date = interview.scheduledAt ? new Date(interview.scheduledAt) : null;
  const isToday = date && new Date().toDateString() === date.toDateString();
  const isTomorrow = date && new Date(Date.now() + 86400000).toDateString() === date.toDateString();

  return (
    <div
      className={cn(
        "rounded-xl border p-5 transition-all",
        isToday && isScheduled
          ? "border-gold-300 bg-gold-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {/* Date/Time */}
          {isScheduled && date ? (
            <div className="shrink-0 text-center">
              <p
                className={cn(
                  "text-xs font-medium",
                  isToday ? "text-gold-600" : isTomorrow ? "text-navy-600" : "text-gray-500"
                )}
              >
                {isToday ? "TODAY" : isTomorrow ? "TOMORROW" : formatDate(interview.scheduledAt!)}
              </p>
              <p className="text-2xl font-bold text-navy-900">{formatTime(interview.scheduledAt!)}</p>
            </div>
          ) : (
            <div className="shrink-0 text-center">
              <Clock className="mx-auto size-8 text-gray-300" />
              <p className="mt-1 text-xs text-gray-500">TBD</p>
            </div>
          )}

          <div className="h-12 w-px bg-gray-200" />

          {/* Candidate Info */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-navy-900">
                {interview.candidate.firstName} {interview.candidate.lastInitial}.
              </h3>
              <StatusBadge status={interview.status} />
            </div>
            <p className="text-sm text-gray-600">{interview.candidate.position}</p>
            <p className="text-xs text-gray-500">{interview.job.title} • {interview.job.vesselName}</p>
          </div>
        </div>

        {/* Interview Type */}
        <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5">
          <InterviewTypeIcon type={interview.requestedType} />
          <span className="text-sm font-medium capitalize text-gray-700">
            {interview.requestedType?.replace("_", " ") || "Video"}
          </span>
        </div>
      </div>

      {/* Notes */}
      {interview.notes && (
        <div className="mt-4 rounded-lg bg-navy-50 p-3">
          <p className="text-sm text-navy-700">{interview.notes}</p>
        </div>
      )}

      {/* Actions */}
      {isScheduled && (
        <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
          {interview.meetingLink && (
            <a
              href={interview.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="primary" size="sm">
                <Video className="mr-2 size-4" />
                Join Meeting
                <ExternalLink className="ml-2 size-3" />
              </Button>
            </a>
          )}
          {interview.meetingLocation && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="size-4" />
              {interview.meetingLocation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function InterviewsPage() {
  const [data, setData] = useState<InterviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const response = await fetch("/api/client/interviews");
        if (!response.ok) {
          throw new Error("Failed to fetch interviews");
        }
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gold-500" />
      </div>
    );
  }

  const interviews = view === "upcoming" ? data?.upcoming || [] : data?.past || [];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-serif font-semibold text-navy-800">Interviews</h1>
              <p className="mt-1 text-gray-500">Manage your scheduled interviews</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-gold-100 px-3 py-1 text-sm font-semibold text-gold-700">
                {data?.upcoming.length || 0} upcoming
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        {/* View Toggle */}
        <div className="mb-6 flex gap-2">
          {[
            { value: "upcoming", label: "Upcoming" },
            { value: "past", label: "Past" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setView(option.value as "upcoming" | "past")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                view === option.value
                  ? "bg-navy-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Interviews List */}
        {error ? (
          <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-center text-error-700">
            {error}
          </div>
        ) : interviews.length > 0 ? (
          <div className="space-y-4">
            {interviews.map((interview) => (
              <InterviewCard key={interview.id} interview={interview} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <Calendar className="mx-auto size-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-navy-900">
              {view === "upcoming" ? "No upcoming interviews" : "No past interviews"}
            </h3>
            <p className="mt-2 text-gray-500">
              {view === "upcoming"
                ? "Request interviews from your shortlisted candidates"
                : "Your completed interviews will appear here"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
