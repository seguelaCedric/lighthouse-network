"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Briefcase,
  Calendar,
  FileText,
  AlertCircle,
  ChevronDown,
  Save,
  Check,
} from "lucide-react";

// Types
interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
  icon: React.ElementType;
}

// Mock settings
const initialSettings: NotificationSetting[] = [
  {
    id: "applications",
    label: "Applications",
    description: "New applications, status changes, and shortlist updates",
    email: true,
    push: true,
    icon: Briefcase,
  },
  {
    id: "messages",
    label: "Messages",
    description: "Direct messages from candidates, clients, and team members",
    email: true,
    push: true,
    icon: MessageSquare,
  },
  {
    id: "interviews",
    label: "Interviews",
    description: "Interview requests, reminders, and schedule changes",
    email: true,
    push: true,
    icon: Calendar,
  },
  {
    id: "documents",
    label: "Documents",
    description: "Document uploads, verifications, and expiry reminders",
    email: true,
    push: false,
    icon: FileText,
  },
  {
    id: "system",
    label: "System Updates",
    description: "Platform updates, maintenance notices, and security alerts",
    email: false,
    push: true,
    icon: AlertCircle,
  },
  {
    id: "marketing",
    label: "News & Tips",
    description: "Industry news, recruitment tips, and product updates",
    email: false,
    push: false,
    icon: Bell,
  },
];

// Toggle switch component
function Toggle({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2",
        enabled ? "bg-gold-500" : "bg-gray-200"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
          enabled ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState(initialSettings);
  const [digestFrequency, setDigestFrequency] = useState("immediate");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleToggle = (id: string, type: "email" | "push", value: boolean) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [type]: value } : s))
    );
    setHasChanges(true);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setHasChanges(false);
    }, 1500);
  };

  const enableAllEmail = () => {
    setSettings((prev) => prev.map((s) => ({ ...s, email: true })));
    setHasChanges(true);
  };

  const disableAllEmail = () => {
    setSettings((prev) => prev.map((s) => ({ ...s, email: false })));
    setHasChanges(true);
  };

  const enableAllPush = () => {
    setSettings((prev) => prev.map((s) => ({ ...s, push: true })));
    setHasChanges(true);
  };

  const disableAllPush = () => {
    setSettings((prev) => prev.map((s) => ({ ...s, push: false })));
    setHasChanges(true);
  };

  const allEmailEnabled = settings.every((s) => s.email);
  const allPushEnabled = settings.every((s) => s.push);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-medium text-navy-800">Notification Settings</h2>
          <p className="text-sm text-gray-500">
            Choose how you want to be notified about activity
          </p>
        </div>
        {hasChanges && (
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <span className="flex items-center gap-2">
                <svg className="size-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="size-4" />
                Save Changes
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Email Digest Frequency */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-gold-100">
            <Mail className="size-5 text-gold-600" />
          </div>
          <div>
            <h3 className="font-semibold text-navy-900">Email Digest Frequency</h3>
            <p className="text-sm text-gray-500">How often would you like to receive email digests?</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { value: "immediate", label: "Immediate", description: "Get notified right away" },
            { value: "daily", label: "Daily Digest", description: "Once per day summary" },
            { value: "weekly", label: "Weekly Digest", description: "Once per week summary" },
          ].map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                digestFrequency === option.value
                  ? "border-gold-400 bg-gold-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <input
                type="radio"
                name="digest"
                value={option.value}
                checked={digestFrequency === option.value}
                onChange={(e) => {
                  setDigestFrequency(e.target.value);
                  setHasChanges(true);
                }}
                className="mt-0.5 size-4 border-gray-300 text-gold-600 focus:ring-gold-500"
              />
              <div>
                <p className="font-medium text-navy-900">{option.label}</p>
                <p className="text-xs text-gray-500">{option.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Notification Categories */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h3 className="font-semibold text-navy-900">Notification Categories</h3>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-gray-400" />
              <span className="text-gray-600">Email</span>
              <button
                onClick={allEmailEnabled ? disableAllEmail : enableAllEmail}
                className="text-xs font-medium text-gold-600 hover:text-gold-700"
              >
                {allEmailEnabled ? "Disable all" : "Enable all"}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="size-4 text-gray-400" />
              <span className="text-gray-600">Push</span>
              <button
                onClick={allPushEnabled ? disableAllPush : enableAllPush}
                className="text-xs font-medium text-gold-600 hover:text-gold-700"
              >
                {allPushEnabled ? "Disable all" : "Enable all"}
              </button>
            </div>
          </div>
        </div>

        {/* Settings List */}
        <div className="divide-y divide-gray-100">
          {settings.map((setting) => {
            const Icon = setting.icon;
            return (
              <div
                key={setting.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-gray-100">
                    <Icon className="size-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-navy-900">{setting.label}</p>
                    <p className="text-sm text-gray-500">{setting.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <Toggle
                    enabled={setting.email}
                    onChange={(value) => handleToggle(setting.id, "email", value)}
                    label={`Email notifications for ${setting.label}`}
                  />
                  <Toggle
                    enabled={setting.push}
                    onChange={(value) => handleToggle(setting.id, "push", value)}
                    label={`Push notifications for ${setting.label}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Push Notification Setup */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-navy-100">
            <Smartphone className="size-5 text-navy-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-navy-900">Push Notifications</h3>
            <p className="mb-3 text-sm text-gray-500">
              Enable push notifications to receive real-time updates on your device.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full bg-success-100 px-3 py-1">
                <Check className="size-4 text-success-600" />
                <span className="text-sm font-medium text-success-700">Enabled on this browser</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4">
          <h3 className="font-semibold text-navy-900">Quiet Hours</h3>
          <p className="text-sm text-gray-500">
            Pause notifications during specific hours
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">From</label>
              <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20">
                <option>10:00 PM</option>
                <option>11:00 PM</option>
                <option>12:00 AM</option>
              </select>
            </div>
            <span className="mt-5 text-gray-400">to</span>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Until</label>
              <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20">
                <option>7:00 AM</option>
                <option>8:00 AM</option>
                <option>9:00 AM</option>
              </select>
            </div>
          </div>
          <Toggle enabled={true} onChange={() => {}} label="Enable quiet hours" />
        </div>
      </div>
    </div>
  );
}
