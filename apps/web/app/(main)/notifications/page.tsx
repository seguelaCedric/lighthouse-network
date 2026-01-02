"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Check,
  CheckCheck,
  MessageSquare,
  Briefcase,
  Settings,
  Clock,
  AlertCircle,
  Star,
  Calendar,
  FileText,
  ChevronDown,
  Search,
  Filter,
  X,
  ArrowLeft,
} from "lucide-react";

// Types
interface Notification {
  id: string;
  type: "application" | "message" | "system" | "reminder";
  title: string;
  description: string;
  timestamp: Date;
  isRead: boolean;
  link?: string;
  metadata?: {
    candidateName?: string;
    jobTitle?: string;
    senderPhoto?: string;
  };
}

// Mock data
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "application",
    title: "New Application Received",
    description: "Sarah M. applied for Chief Stewardess position on M/Y Serenity",
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
    isRead: false,
    metadata: { candidateName: "Sarah M.", jobTitle: "Chief Stewardess" },
  },
  {
    id: "2",
    type: "message",
    title: "New Message from Captain Williams",
    description: "Thanks for sending over the crew profiles. I've reviewed them and...",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isRead: false,
    metadata: { senderPhoto: undefined },
  },
  {
    id: "3",
    type: "reminder",
    title: "Interview Reminder",
    description: "You have an interview with Maria C. scheduled in 1 hour",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    isRead: false,
    metadata: { candidateName: "Maria C.", jobTitle: "2nd Stewardess" },
  },
  {
    id: "4",
    type: "system",
    title: "Profile View Milestone",
    description: "Your profile has been viewed 50 times this week!",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    isRead: true,
  },
  {
    id: "5",
    type: "application",
    title: "Application Status Updated",
    description: "Your application for Bosun on M/Y Eclipse has been shortlisted",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    isRead: true,
    metadata: { jobTitle: "Bosun" },
  },
  {
    id: "6",
    type: "message",
    title: "Message from Lighthouse Support",
    description: "Welcome to Lighthouse Network! Here are some tips to get started...",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    isRead: true,
  },
  {
    id: "7",
    type: "system",
    title: "Document Expiring Soon",
    description: "Your ENG1 Medical Certificate expires in 30 days. Please renew.",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    isRead: true,
  },
  {
    id: "8",
    type: "application",
    title: "New Match Found",
    description: "A new job matching your profile has been posted: Head Chef on M/Y Aurora",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    isRead: true,
    metadata: { jobTitle: "Head Chef" },
  },
];

// Notification type icons and colors
const notificationConfig = {
  application: {
    icon: Briefcase,
    color: "text-gold-600",
    bgColor: "bg-gold-100",
  },
  message: {
    icon: MessageSquare,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  system: {
    icon: Settings,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
  reminder: {
    icon: Clock,
    color: "text-burgundy-600",
    bgColor: "bg-burgundy-100",
  },
};

// Format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Group notifications by date
function groupByDate(notifications: Notification[]) {
  const groups: { [key: string]: Notification[] } = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    Earlier: [],
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  notifications.forEach((notification) => {
    const notifDate = new Date(notification.timestamp);
    const notifDay = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());

    if (notifDay.getTime() === today.getTime()) {
      groups.Today.push(notification);
    } else if (notifDay.getTime() === yesterday.getTime()) {
      groups.Yesterday.push(notification);
    } else if (notifDay.getTime() > weekAgo.getTime()) {
      groups["This Week"].push(notification);
    } else {
      groups.Earlier.push(notification);
    }
  });

  return groups;
}

// Notification item component
function NotificationItem({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: () => void;
}) {
  const config = notificationConfig[notification.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl p-4 transition-colors",
        notification.isRead ? "bg-white hover:bg-gray-50" : "bg-gold-50/50 hover:bg-gold-50"
      )}
    >
      {/* Icon */}
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", config.bgColor)}>
        <Icon className={cn("size-5", config.color)} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h4
            className={cn(
              "text-sm",
              notification.isRead ? "font-medium text-navy-900" : "font-semibold text-navy-900"
            )}
          >
            {notification.title}
          </h4>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-gray-500">{formatRelativeTime(notification.timestamp)}</span>
            {!notification.isRead && <div className="size-2 rounded-full bg-gold-500" />}
          </div>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{notification.description}</p>
      </div>

      {/* Mark as read button */}
      {!notification.isRead && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkAsRead();
          }}
          className="shrink-0 self-start rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          title="Mark as read"
        >
          <Check className="size-4" />
        </button>
      )}
    </div>
  );
}

// Notification dropdown component (exported for use in headers)
export function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkAllRead,
  onMarkAsRead,
}: {
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onMarkAsRead: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "mentions" | "updates">("all");

  const tabs = [
    { id: "all" as const, label: "All" },
    { id: "mentions" as const, label: "Mentions" },
    { id: "updates" as const, label: "Updates" },
  ];

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "mentions") return n.type === "message";
    if (activeTab === "updates") return n.type === "system" || n.type === "application";
    return true;
  });

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-burgundy-500 text-xs font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-xl border border-gray-200 bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
              <h3 className="font-semibold text-navy-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="flex items-center gap-1 text-xs font-medium text-gold-600 hover:text-gold-700"
                >
                  <CheckCheck className="size-3.5" />
                  Mark all as read
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 py-2.5 text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "border-b-2 border-gold-500 text-gold-600"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredNotifications.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {filteredNotifications.slice(0, 5).map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={() => onMarkAsRead(notification.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Bell className="mx-auto mb-2 size-8 text-gray-300" />
                  <p className="text-sm text-gray-500">No notifications</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 p-3">
              <a
                href="/notifications"
                className="block rounded-lg bg-gray-50 py-2 text-center text-sm font-medium text-navy-600 hover:bg-gray-100"
              >
                View All Notifications
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Main notifications page
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [activeFilter, setActiveFilter] = useState<"all" | "application" | "message" | "system" | "reminder">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter !== "all" && n.type !== activeFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(query) || n.description.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const groupedNotifications = groupByDate(filteredNotifications);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const filters = [
    { id: "all" as const, label: "All", icon: Bell },
    { id: "application" as const, label: "Applications", icon: Briefcase },
    { id: "message" as const, label: "Messages", icon: MessageSquare },
    { id: "system" as const, label: "System", icon: Settings },
    { id: "reminder" as const, label: "Reminders", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                <ArrowLeft className="size-5" />
              </button>
              <div>
                <h1 className="text-4xl font-serif font-semibold text-navy-800">Notifications</h1>
                <p className="text-sm text-gray-500">
                  {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <Button variant="secondary" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="mr-1.5 size-4" />
                Mark all as read
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {/* Search and Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => {
              const Icon = filter.icon;
              const count =
                filter.id === "all"
                  ? notifications.length
                  : notifications.filter((n) => n.type === filter.id).length;

              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    activeFilter === filter.id
                      ? "bg-navy-900 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <Icon className="size-3.5" />
                  {filter.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-xs",
                      activeFilter === filter.id ? "bg-white/20" : "bg-gray-100"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notification Groups */}
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(
            ([group, items]) =>
              items.length > 0 && (
                <div key={group}>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                    {group}
                  </h3>
                  <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
                    {items.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={() => markAsRead(notification.id)}
                      />
                    ))}
                  </div>
                </div>
              )
          )}
        </div>

        {/* Empty State */}
        {filteredNotifications.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
            <Bell className="mx-auto mb-4 size-12 text-gray-300" />
            <h3 className="mb-2 text-lg font-semibold text-navy-900">No notifications found</h3>
            <p className="text-sm text-gray-500">
              {searchQuery
                ? "Try adjusting your search query"
                : "You're all caught up!"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
