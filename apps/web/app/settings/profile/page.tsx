"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Upload,
  ChevronDown,
  Check,
  Mail,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  Save,
  X,
} from "lucide-react";

// Mock user data
const mockUser = {
  photo: null,
  firstName: "Emma",
  lastName: "Richardson",
  email: "emma@lighthousenetwork.com",
  phone: "+33 6 12 34 56 78",
  role: "Senior Recruitment Consultant",
  company: "Lighthouse Network",
  timezone: "Europe/Paris",
  language: "English",
  bio: "Experienced yacht recruitment consultant specializing in superyacht crew placement across the Mediterranean and Caribbean regions.",
};

const timezones = [
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/Monaco", label: "Monaco (CET)" },
  { value: "America/New_York", label: "New York (EST)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

const languages = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "it", label: "Italian" },
  { value: "de", label: "German" },
];

export default function ProfileSettingsPage() {
  const [user, setUser] = useState(mockUser);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: string) => {
    setUser((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setHasChanges(false);
    }, 1500);
  };

  const initials = `${user.firstName[0]}${user.lastName[0]}`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-medium text-navy-800">Profile Settings</h2>
          <p className="text-sm text-gray-500">
            Update your personal information and preferences
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

      {/* Profile Photo */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold text-navy-900">Profile Photo</h3>
        <div className="flex items-center gap-6">
          <div className="relative">
            {user.photo ? (
              <img
                src={user.photo}
                alt={`${user.firstName} ${user.lastName}`}
                className="size-24 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-navy-500 to-navy-700 text-2xl font-bold text-white">
                {initials}
              </div>
            )}
            <button className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border-2 border-white bg-gold-500 text-white shadow-lg hover:bg-gold-600">
              <Camera className="size-4" />
            </button>
          </div>
          <div>
            <div className="mb-2 flex gap-2">
              <Button variant="outline" size="sm">
                <Upload className="mr-1.5 size-4" />
                Upload Photo
              </Button>
              {user.photo && (
                <Button variant="outline" size="sm" className="text-burgundy-600 hover:text-burgundy-700">
                  <X className="mr-1.5 size-4" />
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500">
              JPG, PNG or GIF. Max size 2MB. Recommended: 400x400px
            </p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold text-navy-900">Personal Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* First Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              First Name
            </label>
            <input
              type="text"
              value={user.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Last Name
            </label>
            <input
              type="text"
              value={user.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={user.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={user.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Professional Information */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold text-navy-900">Professional Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Role */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Role / Title
            </label>
            <div className="relative">
              <Briefcase className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={user.role}
                onChange={(e) => handleChange("role", e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>
          </div>

          {/* Company */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Company / Organization
            </label>
            <input
              type="text"
              value={user.company}
              onChange={(e) => handleChange("company", e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            />
          </div>

          {/* Bio */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Bio
            </label>
            <textarea
              value={user.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              placeholder="Tell us about yourself..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Brief description for your profile. Max 500 characters.
            </p>
          </div>
        </div>
      </div>

      {/* Regional Settings */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold text-navy-900">Regional Settings</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Timezone */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Timezone
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
              <select
                value={user.timezone}
                onChange={(e) => handleChange("timezone", e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-200 py-2.5 pl-10 pr-10 text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Language Preference
            </label>
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
              <select
                value={user.language}
                onChange={(e) => handleChange("language", e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-200 py-2.5 pl-10 pr-10 text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.label}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-burgundy-200 bg-burgundy-50 p-6">
        <h3 className="mb-2 font-semibold text-burgundy-900">Delete Account</h3>
        <p className="mb-4 text-sm text-burgundy-700">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <Button variant="outline" className="border-burgundy-300 text-burgundy-700 hover:bg-burgundy-100">
          Delete Account
        </Button>
      </div>
    </div>
  );
}
