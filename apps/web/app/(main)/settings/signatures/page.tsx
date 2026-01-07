"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { UploadCloud, Save } from "lucide-react";

interface SignatureSettings {
  logo_url: string | null;
  logo_width: number;
  template: string;
}

export default function SignatureSettingsPage() {
  const [settings, setSettings] = useState<SignatureSettings>({
    logo_url: null,
    logo_width: 140,
    template: "classic",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/signature-settings", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load signature settings");
      }

      setSettings(payload.settings);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load settings";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaved(false);

      const response = await fetch("/api/admin/signature-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logo_url: settings.logo_url,
          logo_width: settings.logo_width,
          template: settings.template,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to save settings");
      }

      setSettings(payload.settings);
      setSaved(true);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Failed to save settings";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!file || uploading) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setError(null);
      const response = await fetch("/api/admin/signature-settings/logo", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to upload logo");
      }

      setSettings((prev) => ({
        ...prev,
        logo_url: payload.logoUrl,
      }));
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Failed to upload logo";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-navy-900">Email Signatures</h2>
          <p className="text-sm text-gray-500">
            Manage the logo and default signature layout.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || loading}>
          <Save className="mr-2 size-4" />
          {saving ? "Saving..." : "Save settings"}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {saved && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Signature settings saved.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Company logo</label>
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-40 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  {settings.logo_url && (
                    <Image
                      src={settings.logo_url}
                      alt="Company logo"
                      fill
                      className="object-contain"
                    />
                  )}
                </div>
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    value={settings.logo_url ?? ""}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, logo_url: event.target.value }))
                    }
                    placeholder="Paste logo URL or upload"
                  />
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
                    <UploadCloud className="size-4" />
                    {uploading ? "Uploading..." : "Upload"}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void handleUpload(file);
                        }
                      }}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Recommended: transparent PNG or SVG, max width 200px.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Logo width (px)</label>
              <Input
                type="number"
                min={80}
                max={240}
                value={settings.logo_width}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    logo_width: Number(event.target.value || 140),
                  }))
                }
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-navy-900">Preview</h3>
          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-4">
              {settings.logo_url && (
                <img
                  src={settings.logo_url}
                  alt="Logo"
                  width={settings.logo_width}
                  style={{ maxWidth: settings.logo_width }}
                />
              )}
              <div className={cn("text-sm", !settings.logo_url && "text-gray-500")}>
                {settings.logo_url ? "Logo preview" : "Upload a logo to preview"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
