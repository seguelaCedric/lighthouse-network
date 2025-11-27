"use client";

import * as React from "react";
import {
  Camera,
  FileText,
  Shield,
  Users,
  ChevronRight,
  MapPin,
  Ship,
  DollarSign,
  Sparkles,
  Calendar,
  Clock,
  Bell,
  AlertTriangle,
  MessageSquare,
  Briefcase,
  CheckCircle2,
  Circle,
  ArrowRight,
  Upload,
  Edit3,
  RefreshCw,
  ExternalLink,
  Star,
  TrendingUp,
  Award,
  Gift,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Types
interface ProfileAction {
  id: string;
  label: string;
  percentageBoost: number;
  completed: boolean;
  icon: React.ReactNode;
}

interface MatchedJob {
  id: string;
  position: string;
  yacht: string;
  yachtSize: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  currency: string;
  matchPercentage: number;
  postedDays: number;
  urgent: boolean;
}

interface Application {
  id: string;
  position: string;
  yacht: string;
  appliedDate: Date;
  status: "pending" | "reviewing" | "interview" | "offer" | "rejected";
  nextStep?: string;
  nextStepDate?: Date;
}

interface Alert {
  id: string;
  type: "certification" | "message" | "application";
  title: string;
  description: string;
  date: Date;
  urgent: boolean;
  actionLabel?: string;
}

// Mock Data
const mockUser = {
  name: "Sarah",
  fullName: "Sarah Johnson",
  profileCompleteness: 78,
  isAvailable: true,
  availableFrom: new Date("2025-03-15"),
  photo: undefined,
};

const mockProfileActions: ProfileAction[] = [
  {
    id: "1",
    label: "Add profile photo",
    percentageBoost: 10,
    completed: false,
    icon: <Camera className="size-4" />,
  },
  {
    id: "2",
    label: "Upload latest CV",
    percentageBoost: 15,
    completed: false,
    icon: <FileText className="size-4" />,
  },
  {
    id: "3",
    label: "Verify identity",
    percentageBoost: 20,
    completed: false,
    icon: <Shield className="size-4" />,
  },
  {
    id: "4",
    label: "Add 2 references",
    percentageBoost: 10,
    completed: true,
    icon: <Users className="size-4" />,
  },
];

const mockMatchedJobs: MatchedJob[] = [
  {
    id: "1",
    position: "Chief Stewardess",
    yacht: "M/Y Eclipse",
    yachtSize: "72m",
    location: "Mediterranean",
    salaryMin: 6500,
    salaryMax: 8000,
    currency: "EUR",
    matchPercentage: 95,
    postedDays: 2,
    urgent: true,
  },
  {
    id: "2",
    position: "Chief Stewardess",
    yacht: "M/Y Serenity",
    yachtSize: "65m",
    location: "Caribbean",
    salaryMin: 7000,
    salaryMax: 8500,
    currency: "EUR",
    matchPercentage: 91,
    postedDays: 5,
    urgent: false,
  },
  {
    id: "3",
    position: "2nd Stewardess",
    yacht: "M/Y Northern Star",
    yachtSize: "55m",
    location: "Mediterranean",
    salaryMin: 4500,
    salaryMax: 5500,
    currency: "EUR",
    matchPercentage: 88,
    postedDays: 1,
    urgent: false,
  },
  {
    id: "4",
    position: "Chief Stewardess",
    yacht: "M/Y Horizon",
    yachtSize: "48m",
    location: "South Pacific",
    salaryMin: 6000,
    salaryMax: 7500,
    currency: "EUR",
    matchPercentage: 85,
    postedDays: 7,
    urgent: false,
  },
];

const mockApplications: Application[] = [
  {
    id: "1",
    position: "Chief Stewardess",
    yacht: "M/Y Azure Dream",
    appliedDate: new Date("2024-11-20"),
    status: "interview",
    nextStep: "Video interview",
    nextStepDate: new Date("2024-11-28"),
  },
  {
    id: "2",
    position: "Chief Stewardess",
    yacht: "M/Y Poseidon",
    appliedDate: new Date("2024-11-18"),
    status: "reviewing",
  },
  {
    id: "3",
    position: "2nd Stewardess",
    yacht: "M/Y Athena",
    appliedDate: new Date("2024-11-15"),
    status: "offer",
    nextStep: "Review offer",
  },
  {
    id: "4",
    position: "Chief Stewardess",
    yacht: "M/Y Neptune",
    appliedDate: new Date("2024-11-10"),
    status: "rejected",
  },
  {
    id: "5",
    position: "Chief Stewardess",
    yacht: "M/Y Odyssey",
    appliedDate: new Date("2024-11-22"),
    status: "pending",
  },
];

const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "certification",
    title: "STCW Expiring Soon",
    description: "Your STCW certificate expires in 45 days. Renew now to avoid gaps.",
    date: new Date(),
    urgent: true,
    actionLabel: "View Details",
  },
  {
    id: "2",
    type: "message",
    title: "New message from M/Y Azure Dream",
    description: "Captain Mitchell sent you a message about your upcoming interview.",
    date: new Date(Date.now() - 1000 * 60 * 60 * 2),
    urgent: false,
    actionLabel: "Read Message",
  },
  {
    id: "3",
    type: "application",
    title: "Application viewed",
    description: "M/Y Poseidon has viewed your application.",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24),
    urgent: false,
  },
];

// Helper functions
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

function formatSalary(min: number, max: number, currency: string): string {
  return `${currency} ${min.toLocaleString()}-${max.toLocaleString()}`;
}

// Circular Progress Component
function CircularProgress({
  value,
  size = 80,
  strokeWidth = 6,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-gold-500 transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-navy-900">{value}%</span>
      </div>
    </div>
  );
}

// Application Status Component
function ApplicationStatus({ status }: { status: Application["status"] }) {
  const stages = ["pending", "reviewing", "interview", "offer"];
  const currentIndex = stages.indexOf(status);
  const isRejected = status === "rejected";

  if (isRejected) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-error-100 px-2.5 py-1 text-xs font-medium text-error-700">
        Not Selected
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {stages.map((stage, index) => (
        <React.Fragment key={stage}>
          <div
            className={cn(
              "flex size-5 items-center justify-center rounded-full text-xs",
              index <= currentIndex
                ? "bg-gold-500 text-white"
                : "bg-gray-200 text-gray-400"
            )}
          >
            {index < currentIndex ? (
              <CheckCircle2 className="size-3" />
            ) : index === currentIndex ? (
              <Circle className="size-2" fill="currentColor" />
            ) : (
              <Circle className="size-2" />
            )}
          </div>
          {index < stages.length - 1 && (
            <div
              className={cn(
                "h-0.5 w-4",
                index < currentIndex ? "bg-gold-500" : "bg-gray-200"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// Alert Icon Component
function AlertIcon({ type }: { type: Alert["type"] }) {
  switch (type) {
    case "certification":
      return (
        <div className="flex size-10 items-center justify-center rounded-full bg-warning-100">
          <AlertTriangle className="size-5 text-warning-600" />
        </div>
      );
    case "message":
      return (
        <div className="flex size-10 items-center justify-center rounded-full bg-navy-100">
          <MessageSquare className="size-5 text-navy-600" />
        </div>
      );
    case "application":
      return (
        <div className="flex size-10 items-center justify-center rounded-full bg-success-100">
          <Briefcase className="size-5 text-success-600" />
        </div>
      );
  }
}

// Match Badge Component
function MatchBadge({ percentage }: { percentage: number }) {
  const color =
    percentage >= 90
      ? "bg-success-100 text-success-700"
      : percentage >= 80
      ? "bg-gold-100 text-gold-700"
      : "bg-gray-100 text-gray-600";

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold", color)}>
      <TrendingUp className="size-3" />
      {percentage}%
    </span>
  );
}

// Main Component
export default function CrewDashboardPage() {
  const [isAvailable, setIsAvailable] = React.useState(mockUser.isAvailable);
  const [availableFrom, setAvailableFrom] = React.useState(
    mockUser.availableFrom.toISOString().split("T")[0]
  );
  const [applicationTab, setApplicationTab] = React.useState<"all" | "pending" | "interview" | "offers">("all");

  const filteredApplications = mockApplications.filter((app) => {
    if (applicationTab === "all") return true;
    if (applicationTab === "pending") return app.status === "pending" || app.status === "reviewing";
    if (applicationTab === "interview") return app.status === "interview";
    if (applicationTab === "offers") return app.status === "offer";
    return true;
  });

  const pendingCount = mockApplications.filter(
    (a) => a.status === "pending" || a.status === "reviewing"
  ).length;
  const interviewCount = mockApplications.filter((a) => a.status === "interview").length;
  const offerCount = mockApplications.filter((a) => a.status === "offer").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Profile Photo Placeholder */}
              <div className="relative">
                <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-navy-100 to-navy-200 text-xl font-bold text-navy-600">
                  {mockUser.name[0]}
                </div>
                <button className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-gold-500 text-white shadow-sm hover:bg-gold-600">
                  <Camera className="size-3" />
                </button>
              </div>

              <div>
                <h1 className="text-4xl font-serif font-semibold text-navy-800">
                  Welcome back, {mockUser.name}!
                </h1>
                <p className="mt-1 text-gray-600">
                  Here's what's happening with your job search
                </p>
              </div>
            </div>

            {/* Profile Completeness */}
            <div className="flex items-center gap-4">
              <CircularProgress value={mockUser.profileCompleteness} />
              <div>
                <p className="text-sm font-medium text-navy-900">Profile Strength</p>
                <p className="text-xs text-gray-500">Complete to get more matches</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Availability Toggle */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-serif font-medium text-navy-800">Your Availability</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Let employers know when you're available
                  </p>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => setIsAvailable(!isAvailable)}
                  className={cn(
                    "relative h-10 w-48 rounded-full transition-colors",
                    isAvailable ? "bg-success-500" : "bg-gray-300"
                  )}
                >
                  <span
                    className={cn(
                      "absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-white shadow-sm transition-all flex items-center justify-center text-sm font-semibold",
                      isAvailable ? "left-1" : "left-[calc(50%+2px)]"
                    )}
                  >
                    {isAvailable ? (
                      <span className="text-success-600">Available</span>
                    ) : (
                      <span className="text-gray-500">Not Looking</span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "absolute inset-y-0 flex w-1/2 items-center justify-center text-sm font-medium",
                      isAvailable ? "right-0 text-white/80" : "left-0 text-gray-500"
                    )}
                  >
                    {isAvailable ? "Not Looking" : "Available"}
                  </span>
                </button>
              </div>

              {isAvailable && (
                <div className="mt-4 flex items-center gap-3 rounded-lg bg-success-50 p-3">
                  <Calendar className="size-5 text-success-600" />
                  <span className="text-sm text-success-700">Available from:</span>
                  <input
                    type="date"
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    className="rounded-lg border border-success-200 bg-white px-3 py-1.5 text-sm font-medium text-success-700 focus:border-success-500 focus:outline-none focus:ring-1 focus:ring-success-500"
                  />
                </div>
              )}
            </div>

            {/* AI-Matched Jobs */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-gold-500" />
                  <h2 className="text-2xl font-serif font-medium text-navy-800">Jobs For You</h2>
                </div>
                <button className="flex items-center gap-1 text-sm font-medium text-gold-600 hover:text-gold-700">
                  View all jobs
                  <ChevronRight className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {mockMatchedJobs.map((job) => (
                  <div
                    key={job.id}
                    className="group relative rounded-lg border border-gray-200 p-4 transition-all hover:border-gold-300 hover:shadow-md"
                  >
                    {job.urgent && (
                      <span className="absolute -right-2 -top-2 rounded-full bg-error-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        URGENT
                      </span>
                    )}

                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-navy-900">{job.position}</h3>
                        <p className="text-sm text-gray-600">{job.yacht}</p>
                      </div>
                      <MatchBadge percentage={job.matchPercentage} />
                    </div>

                    <div className="mb-4 space-y-1.5 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Ship className="size-4" />
                        <span>{job.yachtSize}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="size-4" />
                        <span>{formatSalary(job.salaryMin, job.salaryMax, job.currency)}/mo</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        Posted {job.postedDays === 1 ? "yesterday" : `${job.postedDays} days ago`}
                      </span>
                      <Button variant="primary" size="sm">
                        Apply Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* My Applications */}
            <div className="rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="text-2xl font-serif font-medium text-navy-800">My Applications</h2>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 border-b border-gray-100 px-6">
                <button
                  onClick={() => setApplicationTab("all")}
                  className={cn(
                    "border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                    applicationTab === "all"
                      ? "border-gold-500 text-navy-900"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  )}
                >
                  All ({mockApplications.length})
                </button>
                <button
                  onClick={() => setApplicationTab("pending")}
                  className={cn(
                    "border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                    applicationTab === "pending"
                      ? "border-gold-500 text-navy-900"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  )}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  onClick={() => setApplicationTab("interview")}
                  className={cn(
                    "border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                    applicationTab === "interview"
                      ? "border-gold-500 text-navy-900"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  )}
                >
                  Interview ({interviewCount})
                </button>
                <button
                  onClick={() => setApplicationTab("offers")}
                  className={cn(
                    "border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                    applicationTab === "offers"
                      ? "border-gold-500 text-navy-900"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  )}
                >
                  Offers ({offerCount})
                </button>
              </div>

              {/* Application List */}
              <div className="divide-y divide-gray-100">
                {filteredApplications.length === 0 ? (
                  <div className="py-12 text-center">
                    <Briefcase className="mx-auto size-10 text-gray-300" />
                    <p className="mt-3 text-gray-500">No applications in this category</p>
                  </div>
                ) : (
                  filteredApplications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex size-10 items-center justify-center rounded-full bg-navy-100">
                          <Ship className="size-5 text-navy-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-navy-900">{app.position}</h4>
                          <p className="text-sm text-gray-500">{app.yacht}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Applied {formatDate(app.appliedDate)}</p>
                          {app.nextStep && (
                            <p className="mt-0.5 text-xs font-medium text-gold-600">
                              Next: {app.nextStep}
                              {app.nextStepDate && ` • ${formatDate(app.nextStepDate)}`}
                            </p>
                          )}
                        </div>
                        <ApplicationStatus status={app.status} />
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Profile Strength Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-3">
                <Award className="size-6 text-gold-500" />
                <div>
                  <h2 className="text-2xl font-serif font-medium text-navy-800">Profile Strength</h2>
                  <p className="text-xs text-gray-500">Complete to get better matches</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-navy-900">{mockUser.profileCompleteness}% Complete</span>
                  <span className="text-gray-500">100%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-500 transition-all duration-500"
                    style={{ width: `${mockUser.profileCompleteness}%` }}
                  />
                </div>
              </div>

              {/* Action Items */}
              <div className="space-y-2">
                {mockProfileActions.map((action) => (
                  <button
                    key={action.id}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors",
                      action.completed
                        ? "border-success-200 bg-success-50"
                        : "border-gray-200 bg-white hover:border-gold-300 hover:bg-gold-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-8 items-center justify-center rounded-full",
                          action.completed ? "bg-success-100 text-success-600" : "bg-gray-100 text-gray-500"
                        )}
                      >
                        {action.completed ? <CheckCircle2 className="size-4" /> : action.icon}
                      </div>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          action.completed ? "text-success-700 line-through" : "text-navy-900"
                        )}
                      >
                        {action.label}
                      </span>
                    </div>
                    {!action.completed && (
                      <span className="rounded-full bg-gold-100 px-2 py-0.5 text-xs font-bold text-gold-700">
                        +{action.percentageBoost}%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Alerts Section */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="size-5 text-navy-600" />
                  <h2 className="text-2xl font-serif font-medium text-navy-800">Alerts</h2>
                </div>
                {mockAlerts.length > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-error-500 text-xs font-bold text-white">
                    {mockAlerts.length}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {mockAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-start gap-3 rounded-lg p-3",
                      alert.urgent ? "bg-warning-50" : "bg-gray-50"
                    )}
                  >
                    <AlertIcon type={alert.type} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium text-navy-900">{alert.title}</h4>
                        <span className="shrink-0 text-xs text-gray-400">
                          {formatRelativeTime(alert.date)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-600">{alert.description}</p>
                      {alert.actionLabel && (
                        <button className="mt-2 flex items-center gap-1 text-xs font-medium text-gold-600 hover:text-gold-700">
                          {alert.actionLabel}
                          <ArrowRight className="size-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-2xl font-serif font-medium text-navy-800 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-gold-300 hover:bg-gold-50">
                  <div className="flex size-10 items-center justify-center rounded-full bg-success-100">
                    <RefreshCw className="size-5 text-success-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-navy-900">Update Availability</p>
                    <p className="text-xs text-gray-500">Let employers know when you're free</p>
                  </div>
                </button>

                <button className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-gold-300 hover:bg-gold-50">
                  <div className="flex size-10 items-center justify-center rounded-full bg-navy-100">
                    <Upload className="size-5 text-navy-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-navy-900">Upload New CV</p>
                    <p className="text-xs text-gray-500">Keep your resume up to date</p>
                  </div>
                </button>

                <button className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-gold-300 hover:bg-gold-50">
                  <div className="flex size-10 items-center justify-center rounded-full bg-gold-100">
                    <Edit3 className="size-5 text-gold-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-navy-900">Edit Profile</p>
                    <p className="text-xs text-gray-500">Update your experience and skills</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Referral Promotion Card */}
            <div className="overflow-hidden rounded-xl border border-gold-200 bg-gradient-to-br from-gold-50 to-gold-100">
              <div className="p-6">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-full bg-gold-200">
                    <Gift className="size-5 text-gold-700" />
                  </div>
                  <h2 className="font-serif text-lg font-semibold text-navy-800">
                    Earn Rewards
                  </h2>
                </div>

                <p className="mb-4 text-sm text-gray-700">
                  Refer friends to Lighthouse and earn <strong>€10</strong> when they apply
                  and <strong>€50</strong> when they get placed!
                </p>

                <div className="mb-4 flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gold-700">€10</p>
                    <p className="text-xs text-gray-600">Per application</p>
                  </div>
                  <div className="h-8 w-px bg-gold-200" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gold-700">€50</p>
                    <p className="text-xs text-gray-600">Per placement</p>
                  </div>
                </div>

                <Link href="/crew/referrals">
                  <Button variant="primary" className="w-full">
                    Start Referring
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
