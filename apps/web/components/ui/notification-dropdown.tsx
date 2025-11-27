"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  FileText,
  Briefcase,
  User,
  Send,
  Calendar,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Clock,
  Check,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationType } from "@/lib/notifications";

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  read: boolean;
  created_at: string;
}

interface NotificationDropdownProps {
  className?: string;
}

// Notification type icons
const notificationIcons: Record<NotificationType, React.ReactNode> = {
  brief_received: <FileText className="size-4" />,
  brief_parsed: <Sparkles className="size-4" />,
  brief_needs_clarification: <AlertTriangle className="size-4" />,
  job_match_ready: <Sparkles className="size-4" />,
  candidate_submitted: <Send className="size-4" />,
  candidate_interview_scheduled: <Calendar className="size-4" />,
  candidate_feedback_received: <MessageSquare className="size-4" />,
  candidate_placed: <CheckCircle2 className="size-4" />,
  candidate_rejected: <XCircle className="size-4" />,
  message_received: <MessageSquare className="size-4" />,
  document_expiring: <AlertTriangle className="size-4" />,
  system: <Bell className="size-4" />,
};

// Notification type colors
const notificationColors: Record<NotificationType, string> = {
  brief_received: "bg-blue-100 text-blue-600",
  brief_parsed: "bg-purple-100 text-purple-600",
  brief_needs_clarification: "bg-warning-100 text-warning-600",
  job_match_ready: "bg-gold-100 text-gold-700",
  candidate_submitted: "bg-purple-100 text-purple-600",
  candidate_interview_scheduled: "bg-amber-100 text-amber-600",
  candidate_feedback_received: "bg-blue-100 text-blue-600",
  candidate_placed: "bg-success-100 text-success-600",
  candidate_rejected: "bg-error-100 text-error-600",
  message_received: "bg-blue-100 text-blue-600",
  document_expiring: "bg-warning-100 text-warning-600",
  system: "bg-gray-100 text-gray-600",
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
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

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [markingRead, setMarkingRead] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications?limit=10");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and polling
  React.useEffect(() => {
    fetchNotifications();

    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      setMarkingRead(true);
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all: true }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    } finally {
      setMarkingRead(false);
    }
  };

  // Mark single notification as read
  const handleMarkRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_ids: [notificationId] }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-error-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 rounded-xl border border-gray-200 bg-white shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="font-semibold text-navy-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingRead}
                className="text-sm text-navy-600 hover:text-navy-800 disabled:opacity-50"
              >
                {markingRead ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Mark all read"
                )}
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-gray-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="mx-auto size-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const icon =
                    notificationIcons[notification.type] || <Bell className="size-4" />;
                  const colorClass =
                    notificationColors[notification.type] || "bg-gray-100 text-gray-600";

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex gap-3 px-4 py-3 transition-colors hover:bg-gray-50",
                        !notification.read && "bg-blue-50/50"
                      )}
                    >
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
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium text-navy-900">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkRead(notification.id)}
                              className="shrink-0 p-0.5 rounded hover:bg-gray-200"
                              title="Mark as read"
                            >
                              <Check className="size-3.5 text-gray-400" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="mt-1 flex items-center gap-3">
                          <span className="text-xs text-gray-400">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          {notification.action_url && (
                            <Link
                              href={notification.action_url}
                              onClick={() => {
                                handleMarkRead(notification.id);
                                setIsOpen(false);
                              }}
                              className="text-xs font-medium text-navy-600 hover:text-navy-800"
                            >
                              {notification.action_label || "View"}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-3">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm font-medium text-navy-600 hover:text-navy-800"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
