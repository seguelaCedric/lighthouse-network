"use client";

import { Button } from "@/components/ui/button";
import {
  Shield,
  Mail,
  Bell,
  KeyRound,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

const settings = [
  {
    title: "Access control",
    description: "Require admin approval for new agency accounts.",
    icon: Shield,
    enabled: true,
  },
  {
    title: "Email summaries",
    description: "Send weekly platform reports to owners.",
    icon: Mail,
    enabled: true,
  },
  {
    title: "Alerts",
    description: "Notify admins for high-value placements.",
    icon: Bell,
    enabled: false,
  },
  {
    title: "API keys",
    description: "Rotate integration keys every 90 days.",
    icon: KeyRound,
    enabled: false,
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-navy-900">Settings</h2>
          <p className="text-sm text-gray-500">
            Configure platform-level admin controls.
          </p>
        </div>
        <Button variant="secondary" size="sm">
          Save changes
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {settings.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
                    <Icon className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-navy-900">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.description}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500"
                  aria-label={`Toggle ${item.title}`}
                >
                  {item.enabled ? (
                    <>
                      Enabled
                      <ToggleRight className="size-4 text-success-600" />
                    </>
                  ) : (
                    <>
                      Disabled
                      <ToggleLeft className="size-4 text-gray-400" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
