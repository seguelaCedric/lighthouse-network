"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Save,
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Globe,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import Link from "next/link";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  position_needed: string | null;
  location: string | null;
  message: string | null;
  status: string;
  notes: string | null;
  source_url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  landing_page_id: string | null;
  landing_page: {
    id: string;
    position: string;
    country: string;
    state: string | null;
    city: string | null;
    original_url_path: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export default function InquiryDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [inquiryId, setInquiryId] = useState<string | null>(null);
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    status: "new" as string,
    notes: "",
  });

  useEffect(() => {
    params.then((p) => {
      setInquiryId(p.id);
      fetchInquiry(p.id);
    });
  }, [params]);

  const fetchInquiry = async (id: string) => {
    try {
      const response = await fetch(`/api/inquiries/${id}`);
      const data = await response.json();
      setInquiry(data);
      setFormData({
        status: data.status || "new",
        notes: data.notes || "",
      });
    } catch (error) {
      console.error("Failed to fetch inquiry:", error);
      setError("Failed to load inquiry");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!inquiryId) return;

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save");

      const updated = await response.json();
      setInquiry(updated);
      setSuccess("Inquiry updated successfully!");
      setTimeout(() => setSuccess(null), 5000);
    } catch (error) {
      console.error("Save error:", error);
      setError("Failed to update inquiry. Please try again.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold-600" />
          <p className="mt-4 text-gray-600">Loading inquiry...</p>
        </div>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-navy-900">Inquiry not found</h3>
          <p className="mt-2 text-gray-600">The inquiry you're looking for doesn't exist.</p>
          <Link href="/dashboard/seo-pages/inquiries" className="mt-4 inline-block">
            <Button variant="secondary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Inquiries
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Toast Notifications */}
        {error && (
          <div className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-lg border border-error-200 bg-error-50 px-4 py-3 shadow-lg">
            <AlertCircle className="h-5 w-5 text-error-600" />
            <p className="text-sm font-medium text-error-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-error-600 hover:text-error-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {success && (
          <div className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-lg border border-success-200 bg-success-50 px-4 py-3 shadow-lg">
            <CheckCircle2 className="h-5 w-5 text-success-600" />
            <p className="text-sm font-medium text-success-800">{success}</p>
            <button
              onClick={() => setSuccess(null)}
              className="ml-2 text-success-600 hover:text-success-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/seo-pages/inquiries">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-serif font-semibold text-navy-800">Inquiry Details</h1>
            <p className="mt-1 text-gray-600">View and manage inquiry information</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-navy-900">Contact Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Name</label>
                  <p className="mt-1 text-lg font-semibold text-navy-900">{inquiry.name}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Email</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a href={`mailto:${inquiry.email}`} className="text-navy-900 hover:text-gold-600">
                      {inquiry.email}
                    </a>
                  </div>
                </div>
                {inquiry.phone && (
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Phone</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${inquiry.phone}`} className="text-navy-900 hover:text-gold-600">
                        {inquiry.phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Inquiry Details */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-navy-900">Inquiry Details</h2>
              <div className="space-y-3">
                {inquiry.position_needed && (
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Position Needed</label>
                    <p className="mt-1 text-navy-900">{inquiry.position_needed}</p>
                  </div>
                )}
                {inquiry.location && (
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Location</label>
                    <div className="mt-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <p className="text-navy-900">{inquiry.location}</p>
                    </div>
                  </div>
                )}
                {inquiry.message && (
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Message</label>
                    <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="whitespace-pre-wrap text-sm text-gray-700">{inquiry.message}</p>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-gray-600">Submitted</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <time dateTime={inquiry.created_at} className="text-navy-900">
                      {new Date(inquiry.created_at).toLocaleString()}
                    </time>
                  </div>
                </div>
              </div>
            </div>

            {/* Source Information */}
            {(inquiry.utm_source || inquiry.utm_medium || inquiry.utm_campaign || inquiry.source_url) && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-navy-900">Source Information</h2>
                <div className="space-y-2 text-sm">
                  {inquiry.source_url && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Source URL:</span>
                      <span className="font-mono text-xs text-navy-900">{inquiry.source_url}</span>
                    </div>
                  )}
                  {inquiry.utm_source && (
                    <div>
                      <span className="text-gray-600">UTM Source:</span>{" "}
                      <span className="font-medium text-navy-900">{inquiry.utm_source}</span>
                    </div>
                  )}
                  {inquiry.utm_medium && (
                    <div>
                      <span className="text-gray-600">UTM Medium:</span>{" "}
                      <span className="font-medium text-navy-900">{inquiry.utm_medium}</span>
                    </div>
                  )}
                  {inquiry.utm_campaign && (
                    <div>
                      <span className="text-gray-600">UTM Campaign:</span>{" "}
                      <span className="font-medium text-navy-900">{inquiry.utm_campaign}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Landing Page Link */}
            {inquiry.landing_page && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-navy-900">Source Landing Page</h2>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    {inquiry.landing_page.position} in{" "}
                    {[inquiry.landing_page.city, inquiry.landing_page.state, inquiry.landing_page.country]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <Link
                    href={`/dashboard/seo-pages/landing-pages/${inquiry.landing_page.id}`}
                    className="text-sm text-gold-600 hover:text-gold-700"
                  >
                    View Landing Page →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Notes */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Status & Notes</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Converted</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={6}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                    placeholder="Add notes about this inquiry..."
                  />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full" variant="primary">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
