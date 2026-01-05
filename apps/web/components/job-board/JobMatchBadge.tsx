"use client";

import { Sparkles, TrendingUp, Target, Award } from "lucide-react";

interface JobMatchBadgeProps {
  score: number; // 0-100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
}

function getMatchDetails(score: number): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
  description: string;
} {
  if (score >= 90) {
    return {
      label: "Excellent Match",
      color: "text-emerald-700",
      bgColor: "bg-gradient-to-r from-emerald-500 to-emerald-600",
      borderColor: "border-emerald-200",
      icon: Award,
      description: "Your profile is an excellent fit for this position",
    };
  }
  if (score >= 75) {
    return {
      label: "Strong Match",
      color: "text-emerald-600",
      bgColor: "bg-gradient-to-r from-emerald-400 to-emerald-500",
      borderColor: "border-emerald-100",
      icon: Target,
      description: "Your profile strongly matches this role",
    };
  }
  if (score >= 60) {
    return {
      label: "Good Match",
      color: "text-gold-700",
      bgColor: "bg-gradient-to-r from-gold-500 to-gold-600",
      borderColor: "border-gold-200",
      icon: TrendingUp,
      description: "Your profile aligns well with this position",
    };
  }
  if (score >= 40) {
    return {
      label: "Potential Match",
      color: "text-amber-700",
      bgColor: "bg-gradient-to-r from-amber-400 to-amber-500",
      borderColor: "border-amber-200",
      icon: Sparkles,
      description: "Some aspects of your profile match this role",
    };
  }
  return {
    label: "Partial Match",
    color: "text-gray-600",
    bgColor: "bg-gradient-to-r from-gray-400 to-gray-500",
    borderColor: "border-gray-200",
    icon: Sparkles,
    description: "Consider if this role aligns with your goals",
  };
}

export function JobMatchBadge({
  score,
  size = "md",
  showLabel = true,
  animated = false,
}: JobMatchBadgeProps) {
  const details = getMatchDetails(score);
  const Icon = details.icon;

  const sizeClasses = {
    sm: {
      container: "px-2 py-1 gap-1",
      text: "text-xs",
      icon: "h-3 w-3",
    },
    md: {
      container: "px-3 py-1.5 gap-1.5",
      text: "text-sm",
      icon: "h-4 w-4",
    },
    lg: {
      container: "px-4 py-2 gap-2",
      text: "text-base",
      icon: "h-5 w-5",
    },
  };

  const classes = sizeClasses[size];

  return (
    <div
      className={`inline-flex items-center rounded-full ${details.bgColor} ${classes.container} font-semibold text-white shadow-lg ${animated ? "animate-pulse" : ""}`}
    >
      <Icon className={classes.icon} />
      <span className={classes.text}>{score}%</span>
      {showLabel && <span className={`${classes.text} opacity-90`}>Match</span>}
    </div>
  );
}

// Expanded badge with description for job detail pages
interface JobMatchBadgeExpandedProps {
  score: number;
  className?: string;
}

export function JobMatchBadgeExpanded({ score, className = "" }: JobMatchBadgeExpandedProps) {
  const details = getMatchDetails(score);
  const Icon = details.icon;

  return (
    <div
      className={`rounded-xl border ${details.borderColor} bg-white p-4 shadow-md ${className}`}
    >
      <div className="flex items-start gap-4">
        {/* Score Circle */}
        <div className={`flex h-16 w-16 items-center justify-center rounded-full ${details.bgColor} text-white shadow-lg`}>
          <span className="text-2xl font-bold">{score}</span>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`h-5 w-5 ${details.color}`} />
            <span className={`font-semibold ${details.color}`}>{details.label}</span>
          </div>
          <p className="text-sm text-gray-600">{details.description}</p>
        </div>
      </div>

      {/* Score Breakdown Bar */}
      <div className="mt-4">
        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full ${details.bgColor} transition-all duration-500 ease-out`}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}

// Inline match indicator for lists
interface JobMatchIndicatorProps {
  score: number;
  className?: string;
}

export function JobMatchIndicator({ score, className = "" }: JobMatchIndicatorProps) {
  const details = getMatchDetails(score);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-2 w-16 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full ${details.bgColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${details.color}`}>{score}%</span>
    </div>
  );
}

// Prompt for unauthenticated users
export function JobMatchPrompt({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-gold-200 bg-gradient-to-br from-gold-50 to-white p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-100">
          <Sparkles className="h-5 w-5 text-gold-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-navy-900 mb-1">
            See Your Match Score
          </h4>
          <p className="text-sm text-gray-600 mb-3">
            Sign in to see how well your profile matches each job opportunity.
          </p>
          <a
            href="/auth/login"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-4 py-2 text-sm font-medium text-white hover:from-gold-600 hover:to-gold-700 transition-all shadow"
          >
            Sign In
            <Sparkles className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
