"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Lock,
  Eye,
  EyeOff,
  Shield,
  Smartphone,
  Key,
  AlertTriangle,
  Check,
  ChevronRight,
  LogOut,
  Monitor,
  Globe,
} from "lucide-react";

// Mock session data
const mockSessions = [
  {
    id: "1",
    device: "MacBook Pro",
    browser: "Chrome 120",
    location: "Monaco",
    ip: "92.184.xxx.xxx",
    lastActive: new Date(Date.now() - 5 * 60 * 1000),
    isCurrent: true,
  },
  {
    id: "2",
    device: "iPhone 15 Pro",
    browser: "Safari Mobile",
    location: "Monaco",
    ip: "92.184.xxx.xxx",
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isCurrent: false,
  },
  {
    id: "3",
    device: "Windows PC",
    browser: "Firefox 121",
    location: "London, UK",
    ip: "185.12.xxx.xxx",
    lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isCurrent: false,
  },
];

export default function AccountSettingsPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);

  const formatLastActive = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 5) return "Just now";
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-serif font-medium text-navy-800">Account Settings</h2>
        <p className="text-sm text-gray-500">Manage your account security and preferences</p>
      </div>

      {/* Change Password */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-navy-100">
            <Lock className="size-5 text-navy-600" />
          </div>
          <div>
            <h3 className="font-semibold text-navy-900">Change Password</h3>
            <p className="text-sm text-gray-500">Update your password regularly for security</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Current Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-12 text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-900">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 py-2.5 px-4 pr-12 text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-900">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2.5 px-4 text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>
          </div>

          <Button variant="primary">Update Password</Button>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-gold-100">
              <Shield className="size-5 text-gold-600" />
            </div>
            <div>
              <h3 className="font-semibold text-navy-900">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-500">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {is2FAEnabled && (
              <span className="flex items-center gap-1 rounded-full bg-success-100 px-2.5 py-1 text-xs font-medium text-success-700">
                <Check className="size-3" />
                Enabled
              </span>
            )}
            <Button
              variant={is2FAEnabled ? "outline" : "primary"}
              size="sm"
              onClick={() => setIs2FAEnabled(!is2FAEnabled)}
            >
              {is2FAEnabled ? "Disable" : "Enable"}
            </Button>
          </div>
        </div>

        {is2FAEnabled && (
          <div className="mt-4 rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <Smartphone className="size-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-navy-900">Authenticator App</p>
                <p className="text-xs text-gray-500">Using Google Authenticator or similar</p>
              </div>
              <button className="ml-auto text-sm font-medium text-gold-600 hover:text-gold-700">
                Change Method
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-navy-100">
              <Monitor className="size-5 text-navy-600" />
            </div>
            <div>
              <h3 className="font-semibold text-navy-900">Active Sessions</h3>
              <p className="text-sm text-gray-500">Manage your logged-in devices</p>
            </div>
          </div>
          <button className="text-sm font-medium text-burgundy-600 hover:text-burgundy-700">
            Sign out all other devices
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {mockSessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-gray-100">
                  <Monitor className="size-5 text-gray-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-navy-900">{session.device}</p>
                    {session.isCurrent && (
                      <span className="rounded bg-success-100 px-1.5 py-0.5 text-xs font-medium text-success-700">
                        This device
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {session.browser} • {session.location}
                  </p>
                  <p className="text-xs text-gray-400">
                    Last active: {formatLastActive(session.lastActive)}
                  </p>
                </div>
              </div>
              {!session.isCurrent && (
                <button className="flex items-center gap-1 text-sm font-medium text-burgundy-600 hover:text-burgundy-700">
                  <LogOut className="size-4" />
                  Sign out
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* API Keys */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-purple-100">
              <Key className="size-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-navy-900">API Keys</h3>
              <p className="text-sm text-gray-500">Manage API access for integrations</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Manage Keys
            <ChevronRight className="ml-1 size-4" />
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-burgundy-200 bg-burgundy-50 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="size-5 shrink-0 text-burgundy-600" />
          <div>
            <h3 className="font-semibold text-burgundy-900">Danger Zone</h3>
            <p className="mb-4 text-sm text-burgundy-700">
              These actions are irreversible. Please proceed with caution.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                className="border-burgundy-300 text-burgundy-700 hover:bg-burgundy-100"
              >
                Export All Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-burgundy-300 text-burgundy-700 hover:bg-burgundy-100"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
