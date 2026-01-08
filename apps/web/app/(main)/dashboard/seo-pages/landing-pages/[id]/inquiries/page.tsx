"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
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
  source_url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
}

export default function LandingPageInquiries({ params }: { params: Promise<{ id: string }> }) {
  const [pageId, setPageId] = useState<string | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageInfo, setPageInfo] = useState<any>(null);

  useEffect(() => {
    params.then((p) => {
      setPageId(p.id);
      fetchPageInfo(p.id);
      fetchInquiries(p.id);
    });
  }, [params]);

  const fetchPageInfo = async (id: string) => {
    try {
      const response = await fetch(`/api/seo-pages/${id}`);
      const data = await response.json();
      setPageInfo(data);
    } catch (error) {
      console.error("Failed to fetch page info:", error);
    }
  };

  const fetchInquiries = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/seo-pages/${id}/inquiries`);
      const data = await response.json();
      setInquiries(data.inquiries || []);
    } catch (error) {
      console.error("Failed to fetch inquiries:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      new: { icon: Clock, color: "bg-blue-100 text-blue-700", label: "New" },
      contacted: { icon: CheckCircle, color: "bg-yellow-100 text-yellow-700", label: "Contacted" },
      qualified: { icon: CheckCircle, color: "bg-purple-100 text-purple-700", label: "Qualified" },
      converted: { icon: CheckCircle, color: "bg-success-100 text-success-700", label: "Converted" },
      closed: { icon: XCircle, color: "bg-gray-100 text-gray-700", label: "Closed" },
    };
    const badge = badges[status as keyof typeof badges] || badges.new;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold-600" />
          <p className="mt-4 text-gray-600">Loading inquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/seo-pages/landing-pages/${pageId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-serif font-semibold text-navy-800">Inquiries</h1>
            <p className="mt-1 text-gray-600">
              {pageInfo && (
                <>
                  {pageInfo.position} in {[pageInfo.city, pageInfo.state, pageInfo.country].filter(Boolean).join(", ")}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Inquiries List */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {inquiries.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-semibold text-navy-900">No inquiries yet</h3>
              <p className="mt-2 text-gray-600">Inquiries from this landing page will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {inquiries.map((inquiry) => (
                <div key={inquiry.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-navy-900">{inquiry.name}</h3>
                        {getStatusBadge(inquiry.status)}
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <a href={`mailto:${inquiry.email}`} className="hover:text-gold-600">
                            {inquiry.email}
                          </a>
                        </div>
                        {inquiry.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <a href={`tel:${inquiry.phone}`} className="hover:text-gold-600">
                              {inquiry.phone}
                            </a>
                          </div>
                        )}
                        {inquiry.position_needed && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>Position: {inquiry.position_needed}</span>
                          </div>
                        )}
                        {inquiry.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>Location: {inquiry.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <time dateTime={inquiry.created_at}>
                            {new Date(inquiry.created_at).toLocaleString()}
                          </time>
                        </div>
                      </div>
                      {inquiry.message && (
                        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                          <p className="text-sm text-gray-700">{inquiry.message}</p>
                        </div>
                      )}
                      {(inquiry.utm_source || inquiry.utm_medium || inquiry.utm_campaign) && (
                        <div className="mt-2 flex gap-2 text-xs text-gray-500">
                          {inquiry.utm_source && <span>Source: {inquiry.utm_source}</span>}
                          {inquiry.utm_medium && <span>Medium: {inquiry.utm_medium}</span>}
                          {inquiry.utm_campaign && <span>Campaign: {inquiry.utm_campaign}</span>}
                        </div>
                      )}
                    </div>
                    <Link href={`/dashboard/seo-pages/inquiries/${inquiry.id}`}>
                      <Button variant="secondary" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
