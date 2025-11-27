"use client";

import * as React from "react";
import {
  FileText,
  Briefcase,
  User,
  Send,
  Mail,
  MessageSquare,
  Calendar,
  Star,
  CheckCircle2,
  XCircle,
  Edit3,
  Upload,
  Sparkles,
  Clock,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityType, ActivityLogEntry } from "@/lib/activity";

interface ActivityFeedProps {
  activities: ActivityLogEntry[];
  showEntityLink?: boolean;
  className?: string;
}

// Activity type icons
const activityIcons: Record<ActivityType, React.ReactNode> = {
  brief_created: <FileText className="size-4" />,
  brief_parsed: <Sparkles className="size-4" />,
  brief_converted: <ArrowRight className="size-4" />,
  brief_assigned: <User className="size-4" />,
  job_created: <Briefcase className="size-4" />,
  job_updated: <Edit3 className="size-4" />,
  job_status_changed: <ArrowRight className="size-4" />,
  job_matched: <Sparkles className="size-4" />,
  candidate_created: <User className="size-4" />,
  candidate_updated: <Edit3 className="size-4" />,
  candidate_added_to_shortlist: <Star className="size-4" />,
  candidate_submitted: <Send className="size-4" />,
  candidate_stage_changed: <ArrowRight className="size-4" />,
  candidate_feedback_added: <MessageSquare className="size-4" />,
  candidate_rejected: <XCircle className="size-4" />,
  candidate_placed: <CheckCircle2 className="size-4" />,
  note_added: <FileText className="size-4" />,
  email_sent: <Mail className="size-4" />,
  whatsapp_sent: <MessageSquare className="size-4" />,
  interview_scheduled: <Calendar className="size-4" />,
  reference_requested: <User className="size-4" />,
  document_uploaded: <Upload className="size-4" />,
};

// Activity type colors
const activityColors: Record<ActivityType, string> = {
  brief_created: "bg-blue-100 text-blue-600",
  brief_parsed: "bg-purple-100 text-purple-600",
  brief_converted: "bg-success-100 text-success-600",
  brief_assigned: "bg-gray-100 text-gray-600",
  job_created: "bg-navy-100 text-navy-600",
  job_updated: "bg-gray-100 text-gray-600",
  job_status_changed: "bg-amber-100 text-amber-600",
  job_matched: "bg-gold-100 text-gold-700",
  candidate_created: "bg-blue-100 text-blue-600",
  candidate_updated: "bg-gray-100 text-gray-600",
  candidate_added_to_shortlist: "bg-gold-100 text-gold-700",
  candidate_submitted: "bg-purple-100 text-purple-600",
  candidate_stage_changed: "bg-amber-100 text-amber-600",
  candidate_feedback_added: "bg-blue-100 text-blue-600",
  candidate_rejected: "bg-error-100 text-error-600",
  candidate_placed: "bg-success-100 text-success-600",
  note_added: "bg-gray-100 text-gray-600",
  email_sent: "bg-blue-100 text-blue-600",
  whatsapp_sent: "bg-green-100 text-green-600",
  interview_scheduled: "bg-amber-100 text-amber-600",
  reference_requested: "bg-purple-100 text-purple-600",
  document_uploaded: "bg-gray-100 text-gray-600",
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function ActivityItem({ activity }: { activity: ActivityLogEntry }) {
  const icon = activityIcons[activity.type] || <Clock className="size-4" />;
  const colorClass = activityColors[activity.type] || "bg-gray-100 text-gray-600";

  return (
    <div className="flex gap-3 py-3">
      {/* Icon */}
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          colorClass
        )}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-navy-900">{activity.description}</p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
          {activity.user && <span>{activity.user.name}</span>}
          {activity.user && <span>•</span>}
          <span>{formatTimeAgo(activity.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

export function ActivityFeed({
  activities,
  showEntityLink = false,
  className,
}: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <Clock className="mx-auto size-8 text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">No activity yet</p>
      </div>
    );
  }

  return (
    <div className={cn("divide-y divide-gray-100", className)}>
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}

// Compact version for sidebars
export function ActivityFeedCompact({
  activities,
  limit = 5,
  className,
}: {
  activities: ActivityLogEntry[];
  limit?: number;
  className?: string;
}) {
  const displayedActivities = activities.slice(0, limit);

  if (displayedActivities.length === 0) {
    return (
      <div className={cn("text-center py-4", className)}>
        <p className="text-xs text-gray-400">No recent activity</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {displayedActivities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-2">
          <div
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full mt-0.5",
              activityColors[activity.type] || "bg-gray-100 text-gray-600"
            )}
          >
            <span className="scale-75">
              {activityIcons[activity.type] || <Clock className="size-4" />}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-700 line-clamp-2">{activity.description}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {formatTimeAgo(activity.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
