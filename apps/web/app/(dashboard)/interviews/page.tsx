"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Video,
  Phone,
  Users,
  Clock,
  MapPin,
  Check,
  X,
  Mail,
  MessageSquare,
  ChevronRight,
  Loader2,
  Filter,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Interview {
  id: string;
  status: string;
  requestedType: string;
  preferredDates: Array<{ start: string; end: string }> | null;
  notes: string | null;
  scheduledAt: string | null;
  meetingLink: string | null;
  meetingLocation: string | null;
  durationMinutes: number;
  createdAt: string;
  job: {
    id: string;
    title: string;
    vesselName: string;
  };
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    position: string;
    verificationTier: string;
  };
  client: {
    id: string;
    name: string;
    contactName: string;
    contactEmail: string;
  };
}

interface InterviewsData {
  all: Interview[];
  pending: Interview[];
  scheduled: Interview[];
  completed: Interview[];
  cancelled: Interview[];
  stats: {
    total: number;
    pending: number;
    scheduled: number;
    completed: number;
    cancelled: number;
  };
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-warning-100 text-warning-700" },
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

function InterviewTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "video":
      return <Video className="size-4 text-navy-500" />;
    case "phone":
      return <Phone className="size-4 text-navy-500" />;
    case "in_person":
      return <Users className="size-4 text-navy-500" />;
    default:
      return <Video className="size-4 text-navy-500" />;
  }
}

function ScheduleModal({
  interview,
  onClose,
  onSchedule,
  isScheduling,
}: {
  interview: Interview;
  onClose: () => void;
  onSchedule: (data: {
    scheduledAt: string;
    meetingLink?: string;
    meetingLocation?: string;
    durationMinutes?: number;
    notes?: string;
  }) => void;
  isScheduling: boolean;
}) {
  const [scheduledAt, setScheduledAt] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [duration, setDuration] = useState("60");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!scheduledAt) return;
    onSchedule({
      scheduledAt: new Date(scheduledAt).toISOString(),
      meetingLink: meetingLink || undefined,
      meetingLocation: meetingLocation || undefined,
      durationMinutes: parseInt(duration) || 60,
      notes: notes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <div>
            <h3 className="font-semibold text-navy-900">Schedule Interview</h3>
            <p className="text-sm text-gray-500">
              {interview.candidate.firstName} {interview.candidate.lastName} • {interview.job.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {/* Client Preferred Dates */}
          {interview.preferredDates && interview.preferredDates.length > 0 && (
            <div className="rounded-lg bg-gold-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase text-gold-700">
                Client Preferred Times
              </p>
              <div className="space-y-1">
                {interview.preferredDates.map((slot, i) => (
                  <p key={i} className="text-sm text-gold-800">
                    {formatDateTime(slot.start)} - {formatTime(slot.end)}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Date/Time */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Date & Time <span className="text-burgundy-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            />
          </div>

          {/* Meeting Link / Location */}
          {interview.requestedType === "video" ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-900">
                Meeting Link
              </label>
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://zoom.us/j/..."
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>
          ) : interview.requestedType === "in_person" ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-900">
                Meeting Location
              </label>
              <input
                type="text"
                value={meetingLocation}
                onChange={(e) => setMeetingLocation(e.target.value)}
                placeholder="Address or location details"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>
          ) : null}

          {/* Duration */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            >
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any additional information..."
              className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            />
          </div>

          {/* Contact Info */}
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Contact Details</p>
            <div className="space-y-1 text-sm">
              <p className="text-gray-600">
                <strong>Candidate:</strong> {interview.candidate.email}
                {interview.candidate.phone && ` • ${interview.candidate.phone}`}
              </p>
              <p className="text-gray-600">
                <strong>Client:</strong> {interview.client.contactEmail}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 p-4">
          <Button variant="secondary" onClick={onClose} disabled={isScheduling}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!scheduledAt || isScheduling}
          >
            {isScheduling ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              "Schedule Interview"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function InterviewCard({
  interview,
  onSchedule,
  onMarkCompleted,
}: {
  interview: Interview;
  onSchedule: (interview: Interview) => void;
  onMarkCompleted: (interview: Interview) => void;
}) {
  const isScheduled = interview.status === "scheduled" && interview.scheduledAt;
  const isPending = interview.status === "pending";
  const date = interview.scheduledAt ? new Date(interview.scheduledAt) : null;
  const isToday = date && new Date().toDateString() === date.toDateString();
  const isPast = date && date < new Date();

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-5 transition-all",
        isPending
          ? "border-warning-200 bg-warning-50/30"
          : isToday && isScheduled
            ? "border-gold-300 bg-gold-50/30"
            : "border-gray-200"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Date/Time or Status */}
          {isScheduled && date ? (
            <div className="shrink-0 text-center">
              <p
                className={cn(
                  "text-xs font-medium uppercase",
                  isToday ? "text-gold-600" : isPast ? "text-gray-400" : "text-navy-600"
                )}
              >
                {isToday ? "TODAY" : formatDate(interview.scheduledAt!)}
              </p>
              <p className="text-2xl font-bold text-navy-900">
                {formatTime(interview.scheduledAt!)}
              </p>
              <p className="text-xs text-gray-500">{interview.durationMinutes} min</p>
            </div>
          ) : (
            <div className="shrink-0 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-warning-100">
                <AlertCircle className="size-6 text-warning-600" />
              </div>
              <p className="mt-1 text-xs text-warning-600">Needs Scheduling</p>
            </div>
          )}

          <div className="h-12 w-px bg-gray-200" />

          {/* Details */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-navy-900">
                {interview.candidate.firstName} {interview.candidate.lastName}
              </h3>
              <StatusBadge status={interview.status} />
            </div>
            <p className="text-sm text-gray-600">{interview.candidate.position}</p>
            <p className="text-xs text-gray-500">
              {interview.job.title} • {interview.job.vesselName}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Client: {interview.client.name}
            </p>
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

      {/* Client Notes */}
      {interview.notes && (
        <div className="mt-4 rounded-lg bg-navy-50 p-3">
          <p className="text-xs font-semibold uppercase text-navy-600">Client Notes</p>
          <p className="mt-1 text-sm text-navy-800">{interview.notes}</p>
        </div>
      )}

      {/* Meeting Info (if scheduled) */}
      {isScheduled && (interview.meetingLink || interview.meetingLocation) && (
        <div className="mt-4 flex items-center gap-4 rounded-lg bg-gray-50 p-3">
          {interview.meetingLink && (
            <a
              href={interview.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-navy-600 hover:text-navy-800"
            >
              <Video className="size-4" />
              Join Meeting
              <ExternalLink className="size-3" />
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

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2">
          <a
            href={`mailto:${interview.candidate.email}`}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
          >
            <Mail className="size-4" />
            Email
          </a>
          {interview.candidate.phone && (
            <a
              href={`tel:${interview.candidate.phone}`}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
            >
              <Phone className="size-4" />
              Call
            </a>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isPending && (
            <Button variant="primary" size="sm" onClick={() => onSchedule(interview)}>
              <Calendar className="mr-2 size-4" />
              Schedule
            </Button>
          )}
          {isScheduled && !isPast && (
            <>
              <Button variant="secondary" size="sm" onClick={() => onSchedule(interview)}>
                Reschedule
              </Button>
              <Button variant="primary" size="sm" onClick={() => onMarkCompleted(interview)}>
                <Check className="mr-2 size-4" />
                Mark Completed
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InterviewsPage() {
  const [data, setData] = useState<InterviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [scheduleInterview, setScheduleInterview] = useState<Interview | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);

  const fetchInterviews = async () => {
    try {
      const response = await fetch("/api/interviews");
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

  useEffect(() => {
    fetchInterviews();
  }, []);

  const handleSchedule = async (scheduleData: {
    scheduledAt: string;
    meetingLink?: string;
    meetingLocation?: string;
    durationMinutes?: number;
    notes?: string;
  }) => {
    if (!scheduleInterview) return;

    setIsScheduling(true);
    try {
      const response = await fetch(`/api/interviews/${scheduleInterview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleData),
      });

      if (!response.ok) {
        throw new Error("Failed to schedule interview");
      }

      // Refresh data
      await fetchInterviews();
      setScheduleInterview(null);
    } catch (err) {
      console.error("Error scheduling interview:", err);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleMarkCompleted = async (interview: Interview) => {
    try {
      const response = await fetch(`/api/interviews/${interview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });

      if (!response.ok) {
        throw new Error("Failed to update interview");
      }

      await fetchInterviews();
    } catch (err) {
      console.error("Error updating interview:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gold-500" />
      </div>
    );
  }

  const interviews = filter === "all" ? data?.all : data?.[filter as keyof InterviewsData] as Interview[] || [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy-900">Interview Requests</h1>
          <p className="text-gray-500">Manage interview requests from clients</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-warning-100 px-3 py-1.5">
            <AlertCircle className="size-4 text-warning-600" />
            <span className="text-sm font-semibold text-warning-700">
              {data?.stats.pending || 0} pending
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-success-100 px-3 py-1.5">
            <Calendar className="size-4 text-success-600" />
            <span className="text-sm font-semibold text-success-700">
              {data?.stats.scheduled || 0} scheduled
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-2">
        <Filter className="size-4 text-gray-400" />
        {[
          { value: "all", label: "All" },
          { value: "pending", label: "Pending" },
          { value: "scheduled", label: "Scheduled" },
          { value: "completed", label: "Completed" },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              filter === option.value
                ? "bg-navy-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {option.label}
            {option.value !== "all" && data?.stats && (
              <span className="ml-1 opacity-60">
                ({data.stats[option.value as keyof typeof data.stats]})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Interviews List */}
      {error ? (
        <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-center text-error-700">
          {error}
        </div>
      ) : interviews && interviews.length > 0 ? (
        <div className="space-y-4">
          {interviews.map((interview) => (
            <InterviewCard
              key={interview.id}
              interview={interview}
              onSchedule={setScheduleInterview}
              onMarkCompleted={handleMarkCompleted}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <Calendar className="mx-auto size-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-navy-900">No interview requests</h3>
          <p className="mt-2 text-gray-500">
            {filter === "all"
              ? "Interview requests from clients will appear here"
              : `No ${filter} interviews`}
          </p>
        </div>
      )}

      {/* Schedule Modal */}
      {scheduleInterview && (
        <ScheduleModal
          interview={scheduleInterview}
          onClose={() => setScheduleInterview(null)}
          onSchedule={handleSchedule}
          isScheduling={isScheduling}
        />
      )}
    </div>
  );
}
