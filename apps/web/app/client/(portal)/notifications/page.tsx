"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Users,
  Calendar,
  FileText,
  Check,
  CheckCheck,
  Loader2,
  Trash2,
  ChevronRight,
  Trophy,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ClientNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl: string | null;
  actionLabel: string | null;
  metadata: Record<string, unknown>;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function NotificationIcon({ type }: { type: string }) {
  const iconClass = "size-5";

  switch (type) {
    case "shortlist_ready":
      return <Users className={cn(iconClass, "text-gold-600")} />;
    case "interview_scheduled":
      return <Calendar className={cn(iconClass, "text-success-600")} />;
    case "interview_reminder":
      return <Calendar className={cn(iconClass, "text-warning-600")} />;
    case "placement_confirmed":
      return <Trophy className={cn(iconClass, "text-gold-600")} />;
    case "feedback_requested":
      return <MessageSquare className={cn(iconClass, "text-navy-600")} />;
    case "new_candidates":
      return <Users className={cn(iconClass, "text-navy-600")} />;
    case "document_ready":
      return <FileText className={cn(iconClass, "text-navy-600")} />;
    default:
      return <Bell className={cn(iconClass, "text-gray-500")} />;
  }
}

function NotificationCard({
  notification,
  onMarkRead,
}: {
  notification: ClientNotification;
  onMarkRead: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-xl border p-4 transition-all",
        notification.read
          ? "border-gray-100 bg-white"
          : "border-gold-200 bg-gold-50/50"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          notification.read ? "bg-gray-100" : "bg-white"
        )}
      >
        <NotificationIcon type={notification.type} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3
              className={cn(
                "text-sm font-semibold",
                notification.read ? "text-gray-700" : "text-navy-900"
              )}
            >
              {notification.title}
            </h3>
            <p className="mt-0.5 text-sm text-gray-600">{notification.message}</p>
          </div>
          <span className="shrink-0 text-xs text-gray-400">
            {formatTimeAgo(notification.createdAt)}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          {notification.actionUrl && (
            <Link href={notification.actionUrl}>
              <Button variant="secondary" size="sm">
                {notification.actionLabel || "View"}
                <ChevronRight className="ml-1 size-3" />
              </Button>
            </Link>
          )}
          {!notification.read && (
            <button
              onClick={() => onMarkRead(notification.id)}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
            >
              <Check className="size-3" />
              Mark as read
            </button>
          )}
        </div>
      </div>

      {/* Unread indicator */}
      {!notification.read && (
        <div className="size-2 shrink-0 rounded-full bg-gold-500" />
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/client/notifications");
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      const result = await response.json();
      setNotifications(result.data.notifications);
      setUnreadCount(result.data.unreadCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/client/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAllRead(true);
    try {
      const response = await fetch("/api/client/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    } finally {
      setMarkingAllRead(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gold-500" />
      </div>
    );
  }

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-serif font-semibold text-navy-800">
                Notifications
              </h1>
              <p className="mt-1 text-gray-500">
                Stay updated on your crew searches
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="secondary"
                onClick={handleMarkAllRead}
                disabled={markingAllRead}
              >
                {markingAllRead ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <CheckCheck className="mr-2 size-4" />
                )}
                Mark all as read
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-6">
        {error ? (
          <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-center text-error-700">
            {error}
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <Bell className="mx-auto size-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-navy-900">
              No notifications yet
            </h3>
            <p className="mt-2 text-gray-500">
              We'll notify you when there are updates on your crew searches
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Unread Section */}
            {unreadNotifications.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-sm font-semibold uppercase text-gray-500">
                    New
                  </h2>
                  <span className="rounded-full bg-gold-100 px-2 py-0.5 text-xs font-semibold text-gold-700">
                    {unreadNotifications.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {unreadNotifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onMarkRead={handleMarkRead}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Read Section */}
            {readNotifications.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">
                  Earlier
                </h2>
                <div className="space-y-3">
                  {readNotifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onMarkRead={handleMarkRead}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
