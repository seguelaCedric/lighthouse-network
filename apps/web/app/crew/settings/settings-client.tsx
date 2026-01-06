"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Lock,
  Eye,
  Trash2,
  Mail,
  Briefcase,
  Shield,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CandidateSettings,
  updateNotificationSettings,
  updatePrivacySettings,
  changePassword,
  requestAccountDeletion,
} from "./actions";

interface SettingsClientProps {
  initialSettings: CandidateSettings;
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteReason, setDeleteReason] = useState("");

  const showMessage = (type: "success" | "error", message: string) => {
    if (type === "success") {
      setSuccess(message);
      setError(null);
    } else {
      setError(message);
      setSuccess(null);
    }
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 3000);
  };

  const handleNotificationToggle = async (
    key: "emailNotifications" | "jobAlerts" | "marketingEmails"
  ) => {
    const newValue = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: newValue }));
    setSaving(key);

    const result = await updateNotificationSettings({ [key]: newValue });

    setSaving(null);
    if (result.success) {
      showMessage("success", "Settings updated");
    } else {
      // Revert on error
      setSettings((prev) => ({ ...prev, [key]: !newValue }));
      showMessage("error", result.error || "Failed to update");
    }
  };

  const handlePrivacyChange = async (
    visibility: "public" | "agencies_only" | "private"
  ) => {
    const oldValue = settings.profileVisibility;
    setSettings((prev) => ({ ...prev, profileVisibility: visibility }));
    setSaving("privacy");

    const result = await updatePrivacySettings({ profileVisibility: visibility });

    setSaving(null);
    if (result.success) {
      showMessage("success", "Privacy settings updated");
    } else {
      // Revert on error
      setSettings((prev) => ({ ...prev, profileVisibility: oldValue }));
      showMessage("error", result.error || "Failed to update");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage("error", "New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      showMessage("error", "Password must be at least 8 characters");
      return;
    }

    setSaving("password");

    const result = await changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });

    setSaving(null);

    if (result.success) {
      showMessage("success", "Password changed successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordForm(false);
    } else {
      showMessage("error", result.error || "Failed to change password");
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showMessage("error", "Please enter your password to confirm");
      return;
    }

    setSaving("delete");

    const result = await requestAccountDeletion({
      password: deletePassword,
      reason: deleteReason,
    });

    setSaving(null);

    if (result.success) {
      router.push("/crew/auth/login?message=account_deleted");
    } else {
      showMessage("error", result.error || "Failed to delete account");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="flex items-center gap-3 font-serif text-3xl font-semibold text-navy-800">
          <Shield className="size-7 text-gold-500" />
          Settings
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your account preferences and security
        </p>
      </div>

      {/* Status Messages */}
      {(success || error) && (
        <div
          className={cn(
            "rounded-lg px-4 py-3 text-sm font-medium",
            success
              ? "bg-success-100 text-success-700"
              : "bg-red-100 text-red-700"
          )}
        >
          <div className="flex items-center gap-2">
            {success ? (
              <Check className="size-4" />
            ) : (
              <AlertTriangle className="size-4" />
            )}
            {success || error}
          </div>
        </div>
      )}

      {/* Notification Preferences */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gold-100">
              <Bell className="size-5 text-gold-600" />
            </div>
            <div>
              <h2 className="font-semibold text-navy-800">Notifications</h2>
              <p className="text-sm text-gray-500">
                Control how we communicate with you
              </p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          <ToggleRow
            label="Email Notifications"
            description="Receive important updates about your applications"
            icon={<Mail className="size-4" />}
            checked={settings.emailNotifications}
            loading={saving === "emailNotifications"}
            onChange={() => handleNotificationToggle("emailNotifications")}
          />
          <ToggleRow
            label="Job Alerts"
            description="Get notified when new jobs match your profile"
            icon={<Briefcase className="size-4" />}
            checked={settings.jobAlerts}
            loading={saving === "jobAlerts"}
            onChange={() => handleNotificationToggle("jobAlerts")}
          />
          <ToggleRow
            label="Marketing Emails"
            description="Receive tips, industry news, and special offers"
            icon={<Mail className="size-4" />}
            checked={settings.marketingEmails}
            loading={saving === "marketingEmails"}
            onChange={() => handleNotificationToggle("marketingEmails")}
          />
        </div>
      </section>

      {/* Privacy Settings */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100">
              <Eye className="size-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-navy-800">Privacy</h2>
              <p className="text-sm text-gray-500">
                Control who can see your profile
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            <PrivacyOption
              value="public"
              label="Public"
              description="Your profile is visible to all recruiters and agencies"
              selected={settings.profileVisibility === "public"}
              loading={saving === "privacy"}
              onChange={() => handlePrivacyChange("public")}
            />
            <PrivacyOption
              value="agencies_only"
              label="Agencies Only"
              description="Only verified recruitment agencies can view your profile"
              selected={settings.profileVisibility === "agencies_only"}
              loading={saving === "privacy"}
              onChange={() => handlePrivacyChange("agencies_only")}
            />
            <PrivacyOption
              value="private"
              label="Private"
              description="Hidden from searches. Only visible when you apply to a job."
              selected={settings.profileVisibility === "private"}
              loading={saving === "privacy"}
              onChange={() => handlePrivacyChange("private")}
            />
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-green-100">
              <Shield className="size-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-navy-800">Security</h2>
              <p className="text-sm text-gray-500">
                Manage your password and account security
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-navy-800">Password</p>
              <p className="text-sm text-gray-500">
                Change your account password
              </p>
            </div>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Lock className="mr-2 inline-block size-4" />
              Change Password
            </button>
          </div>

          {showPasswordForm && (
            <form onSubmit={handlePasswordChange} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  minLength={8}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  minLength={8}
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving === "password"}
                  className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-600 disabled:opacity-50"
                >
                  {saving === "password" && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  Update Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordForm({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Account */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gray-100">
              <Mail className="size-5 text-gray-600" />
            </div>
            <div>
              <h2 className="font-semibold text-navy-800">Account</h2>
              <p className="text-sm text-gray-500">
                Your account email: {settings.email}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="rounded-xl border border-red-200 bg-white shadow-sm">
        <div className="border-b border-red-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-red-100">
              <Trash2 className="size-5 text-red-600" />
            </div>
            <div>
              <h2 className="font-semibold text-red-800">Danger Zone</h2>
              <p className="text-sm text-red-600">
                Irreversible actions for your account
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-navy-800">Delete Account</p>
              <p className="text-sm text-gray-500">
                Permanently delete your account and all associated data
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
            >
              Delete Account
            </button>
          </div>

          {showDeleteConfirm && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 flex-shrink-0 text-red-600" />
                <div className="flex-1">
                  <p className="font-medium text-red-800">
                    Are you sure you want to delete your account?
                  </p>
                  <p className="mt-1 text-sm text-red-600">
                    This action cannot be undone. All your data, applications,
                    and profile information will be permanently removed.
                  </p>
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Reason for leaving (optional)
                      </label>
                      <input
                        type="text"
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        placeholder="Help us improve..."
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Enter your password to confirm
                      </label>
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        required
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={saving === "delete" || !deletePassword}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {saving === "delete" && (
                          <Loader2 className="size-4 animate-spin" />
                        )}
                        Yes, Delete My Account
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeletePassword("");
                          setDeleteReason("");
                        }}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  icon,
  checked,
  loading,
  onChange,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  checked: boolean;
  loading: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-gray-400">{icon}</div>
        <div>
          <p className="font-medium text-navy-800">{label}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <button
        onClick={onChange}
        disabled={loading}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-gold-500" : "bg-gray-300",
          loading && "opacity-50"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5"
          )}
        />
        {loading && (
          <Loader2 className="absolute inset-0 m-auto size-4 animate-spin text-white" />
        )}
      </button>
    </div>
  );
}

function PrivacyOption({
  value,
  label,
  description,
  selected,
  loading,
  onChange,
}: {
  value: string;
  label: string;
  description: string;
  selected: boolean;
  loading: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      disabled={loading}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors",
        selected
          ? "border-gold-500 bg-gold-50 ring-1 ring-gold-500"
          : "border-gray-200 hover:bg-gray-50",
        loading && "opacity-50"
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex size-5 items-center justify-center rounded-full border-2",
          selected ? "border-gold-500 bg-gold-500" : "border-gray-300"
        )}
      >
        {selected && <Check className="size-3 text-white" />}
      </div>
      <div>
        <p className="font-medium text-navy-800">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </button>
  );
}
