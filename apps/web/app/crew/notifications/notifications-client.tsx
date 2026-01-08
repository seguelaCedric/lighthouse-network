"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  Briefcase,
  MessageSquare,
  Settings,
  ChevronRight,
  Shield,
  Calendar,
  CheckCircle,
  BellRing,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationsData, CrewNotification } from "./actions";

interface NotificationsClientProps {
  data: NotificationsData;
}

const notificationConfig = {
  certification: {
    icon: Shield,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    urgentBgColor: "bg-red-100",
    urgentColor: "text-red-600",
  },
  application: {
    icon: Briefcase,
    color: "text-gold-600",
    bgColor: "bg-gold-100",
    urgentBgColor: "bg-gold-100",
    urgentColor: "text-gold-600",
  },
  message: {
    icon: MessageSquare,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    urgentBgColor: "bg-blue-100",
    urgentColor: "text-blue-600",
  },
  system: {
    icon: Settings,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    urgentBgColor: "bg-gray-100",
    urgentColor: "text-gray-600",
  },
  job_alert: {
    icon: BellRing,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    urgentBgColor: "bg-emerald-100",
    urgentColor: "text-emerald-600",
  },
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

function NotificationItem({ notification }: { notification: CrewNotification }) {
  const config = notificationConfig[notification.type];
  const Icon = config.icon;

  const bgColor = notification.urgent ? config.urgentBgColor : config.bgColor;
  const iconColor = notification.urgent ? config.urgentColor : config.color;

  return (
    <div
      className={cn(
        "flex gap-4 rounded-xl p-4 transition-colors",
        notification.urgent ? "bg-amber-50/50" : "bg-white hover:bg-gray-50"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          bgColor
        )}
      >
        <Icon className={cn("size-5", iconColor)} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-navy-900">
              {notification.title}
            </h4>
            {notification.urgent && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                Urgent
              </span>
            )}
          </div>
          <span className="shrink-0 text-xs text-gray-500">
            {formatRelativeTime(notification.date)}
          </span>
        </div>
        <p className="text-sm text-gray-600">{notification.description}</p>

        {/* Action Button */}
        {notification.actionHref && notification.actionLabel && (
          <Link
            href={notification.actionHref}
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              notification.urgent
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gold-500 text-white hover:bg-gold-600"
            )}
          >
            {notification.actionLabel}
            <ChevronRight className="size-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

export function NotificationsClient({ data }: NotificationsClientProps) {
  const { notifications, unreadCount } = data;

  // Separate urgent and regular notifications
  const urgentNotifications = notifications.filter((n) => n.urgent);
  const regularNotifications = notifications.filter((n) => !n.urgent);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-navy-800">
            Notifications
          </h1>
          <p className="mt-1 text-gray-600">
            {unreadCount > 0 ? (
              <>
                You have{" "}
                <span className="font-medium text-gold-600">
                  {unreadCount} new notification{unreadCount !== 1 ? "s" : ""}
                </span>
              </>
            ) : (
              "You're all caught up!"
            )}
          </p>
        </div>
      </div>

      {/* Urgent Alerts Section */}
      {urgentNotifications.length > 0 && (
        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4">
          <div className="mb-4 flex items-center gap-2">
            <AlertCircle className="size-5 text-red-600" />
            <h2 className="font-semibold text-red-800">
              Action Required ({urgentNotifications.length})
            </h2>
          </div>
          <div className="space-y-3">
            {urgentNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
          </div>
        </div>
      )}

      {/* Job Alert Info Card */}
      {notifications.some((n) => n.type === "job_alert") && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <BellRing className="size-5 shrink-0 text-emerald-600" />
            <div>
              <h3 className="font-medium text-emerald-800">
                Job Alerts
              </h3>
              <p className="mt-1 text-sm text-emerald-700">
                We notify you when new jobs are posted that match your position
                preferences. Update your preferences in{" "}
                <Link href="/crew/preferences" className="underline hover:text-emerald-800">
                  Job Preferences
                </Link>{" "}
                to get relevant alerts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Expiry Info Card */}
      {notifications.some((n) => n.type === "certification") && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <Calendar className="size-5 shrink-0 text-amber-600" />
            <div>
              <h3 className="font-medium text-amber-800">
                Certificate Renewal Reminders
              </h3>
              <p className="mt-1 text-sm text-amber-700">
                We send reminders 90 days and 30 days before your certificates
                expire to help you stay compliant. Keep your documents up to
                date to maintain your profile visibility.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Regular Notifications */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-navy-800">All Notifications</h2>
        </div>

        {notifications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gray-100">
              <CheckCircle className="size-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900">No notifications</h3>
            <p className="mt-1 text-sm text-gray-500">
              You'll see job alerts, certificate expiry reminders, and application updates here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {regularNotifications.length > 0 ? (
              regularNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))
            ) : (
              <div className="px-6 py-8 text-center text-sm text-gray-500">
                No regular notifications - check the urgent section above
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helpful Tips */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-navy-800">
          Keeping Your Profile Current
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-100">
              <Shield className="size-4 text-gold-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-navy-800">
                Update Certificates
              </p>
              <p className="text-xs text-gray-500">
                Upload renewed certificates promptly to maintain visibility
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-100">
              <Calendar className="size-4 text-gold-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-navy-800">
                Set Availability
              </p>
              <p className="text-xs text-gray-500">
                Keep your availability status current for best job matches
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <BellRing className="size-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-navy-800">
                Set Job Preferences
              </p>
              <p className="text-xs text-gray-500">
                Define your preferred positions to receive relevant job alerts
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-100">
              <Briefcase className="size-4 text-gold-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-navy-800">
                Apply Quickly
              </p>
              <p className="text-xs text-gray-500">
                Respond to job alerts fast for the best chance of placement
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
