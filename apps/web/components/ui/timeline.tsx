"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TimelineItem {
  id: string;
  icon?: React.ReactNode;
  iconColor?: string;
  iconBgColor?: string;
  title: string;
  description?: string;
  timestamp: Date | string;
  user?: {
    name: string;
    avatar?: string;
  };
  metadata?: React.ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  showConnector?: boolean;
  className?: string;
}

const formatTimestamp = (timestamp: Date | string): string => {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  ({ items, showConnector = true, className }, ref) => {
    return (
      <div ref={ref} className={cn("relative", className)}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const userInitials = item.user?.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Connector Line */}
              {showConnector && !isLast && (
                <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200" />
              )}

              {/* Icon */}
              <div
                className={cn(
                  "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full",
                  item.iconBgColor || "bg-gray-100"
                )}
                style={
                  item.iconBgColor
                    ? undefined
                    : { backgroundColor: item.iconBgColor }
                }
              >
                {item.icon ? (
                  <span className={item.iconColor || "text-gray-600"}>
                    {item.icon}
                  </span>
                ) : item.user ? (
                  item.user.avatar ? (
                    <img
                      src={item.user.avatar}
                      alt={item.user.name}
                      className="size-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-navy-600">
                      {userInitials}
                    </span>
                  )
                ) : (
                  <div className="size-2 rounded-full bg-gray-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-navy-900">{item.title}</p>
                  <span className="text-xs text-gray-400">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>
                {item.user && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    by {item.user.name}
                  </p>
                )}
                {item.description && (
                  <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                )}
                {item.metadata && (
                  <div className="mt-2">{item.metadata}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);
Timeline.displayName = "Timeline";

export { Timeline };
