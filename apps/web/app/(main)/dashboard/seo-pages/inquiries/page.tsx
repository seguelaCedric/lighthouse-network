"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  FileText,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  MapPin,
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
  landing_page_id: string | null;
  created_at: string;
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(50);

  useEffect(() => {
    fetchInquiries();
  }, [offset, statusFilter, search]);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      params.set("limit", limit.toString());
      params.set("offset", offset.toString());

      const response = await fetch(`/api/inquiries?${params.toString()}`);
      const data = await response.json();
      setInquiries(data.inquiries || []);
      setTotal(data.total || 0);
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

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Phone", "Position", "Location", "Status", "Date", "Source"];
    const rows = inquiries.map((inq) => [
      inq.name,
      inq.email,
      inq.phone || "",
      inq.position_needed || "",
      inq.location || "",
      inq.status,
      new Date(inq.created_at).toLocaleDateString(),
      inq.source_url || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inquiries-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && inquiries.length === 0) {
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-serif font-semibold text-navy-800">Inquiries</h1>
            <p className="mt-1 text-gray-600">Manage and track lead submissions from landing pages</p>
          </div>
          {inquiries.length > 0 && (
            <Button variant="secondary" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or message..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setOffset(0);
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 pl-10 pr-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setOffset(0);
                }}
                className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          Showing {inquiries.length} of {total} inquiries
        </div>

        {/* Inquiries Table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {inquiries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="mx-auto max-w-md">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold-100">
                          <FileText className="h-8 w-8 text-gold-600" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-navy-900">No inquiries found</h3>
                        <p className="text-gray-600">
                          {search || statusFilter !== "all"
                            ? "Try adjusting your filters to see more results."
                            : "Inquiries from landing pages will appear here."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  inquiries.map((inquiry) => (
                    <tr key={inquiry.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-navy-900">{inquiry.name}</div>
                        <div className="mt-1 space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3" />
                            <a href={`mailto:${inquiry.email}`} className="hover:text-gold-600">
                              {inquiry.email}
                            </a>
                          </div>
                          {inquiry.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3" />
                              <a href={`tel:${inquiry.phone}`} className="hover:text-gold-600">
                                {inquiry.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm">
                          {inquiry.position_needed && (
                            <div className="font-medium text-navy-900">{inquiry.position_needed}</div>
                          )}
                          {inquiry.location && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <MapPin className="h-3 w-3" />
                              {inquiry.location}
                            </div>
                          )}
                          {inquiry.message && (
                            <div className="mt-2 max-w-md truncate text-xs text-gray-500">
                              {inquiry.message}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(inquiry.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <time dateTime={inquiry.created_at}>
                            {new Date(inquiry.created_at).toLocaleDateString()}
                          </time>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {inquiry.landing_page_id && (
                            <Link
                              href={`/dashboard/seo-pages/landing-pages/${inquiry.landing_page_id}`}
                              title="View landing page"
                            >
                              <Button variant="ghost" size="sm">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          <Link href={`/dashboard/seo-pages/inquiries/${inquiry.id}`} title="View details">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} inquiries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
