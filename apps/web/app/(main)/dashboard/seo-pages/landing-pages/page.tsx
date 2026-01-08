"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  Edit,
  Eye,
  Globe,
  MapPin,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface SeoLandingPage {
  id: string;
  position: string;
  position_slug: string;
  country: string;
  country_slug: string;
  state: string | null;
  state_slug: string | null;
  city: string | null;
  city_slug: string | null;
  original_url_path: string;
  meta_title: string;
  meta_description: string;
  hero_headline: string;
  is_active: boolean;
  inquiry_count: number;
  updated_at: string;
}

export default function SeoLandingPagesPage() {
  const [pages, setPages] = useState<SeoLandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(50);
  const [uniquePositions, setUniquePositions] = useState<string[]>([]);
  const [uniqueCountries, setUniqueCountries] = useState<string[]>([]);

  useEffect(() => {
    fetchPages();
    fetchFilters();
  }, [offset, positionFilter, countryFilter, activeFilter, search]);

  const fetchFilters = async () => {
    try {
      const response = await fetch("/api/seo-pages?limit=1000");
      const data = await response.json();
      const allPages = data.pages || [];

      const positions = [...new Set(allPages.map((p: SeoLandingPage) => p.position))].sort() as string[];
      const countries = [...new Set(allPages.map((p: SeoLandingPage) => p.country))].sort() as string[];

      setUniquePositions(positions);
      setUniqueCountries(countries);
    } catch (error) {
      console.error("Failed to fetch filters:", error);
    }
  };

  const fetchPages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (positionFilter !== "all") params.set("position", positionFilter);
      if (countryFilter !== "all") params.set("country", countryFilter);
      if (activeFilter !== "all") params.set("is_active", activeFilter);
      if (search) params.set("search", search);
      params.set("limit", limit.toString());
      params.set("offset", offset.toString());

      const response = await fetch(`/api/seo-pages?${params.toString()}`);
      const data = await response.json();
      setPages(data.pages || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch pages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading && pages.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold-600" />
          <p className="mt-4 text-gray-600">Loading landing pages...</p>
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
            <h1 className="text-4xl font-serif font-semibold text-navy-800">SEO Landing Pages</h1>
            <p className="mt-1 text-gray-600">Manage lead generation pages and track inquiries</p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by position, location, or URL..."
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
                value={positionFilter}
                onChange={(e) => {
                  setPositionFilter(e.target.value);
                  setOffset(0);
                }}
                className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="all">All Positions</option>
                {uniquePositions.map((pos) => (
                  <option key={pos} value={pos.toLowerCase().replace(/\s+/g, "-")}>
                    {pos}
                  </option>
                ))}
              </select>
              <select
                value={countryFilter}
                onChange={(e) => {
                  setCountryFilter(e.target.value);
                  setOffset(0);
                }}
                className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="all">All Countries</option>
                {uniqueCountries.map((country) => (
                  <option key={country} value={country.toLowerCase().replace(/\s+/g, "-")}>
                    {country}
                  </option>
                ))}
              </select>
              <select
                value={activeFilter}
                onChange={(e) => {
                  setActiveFilter(e.target.value);
                  setOffset(0);
                }}
                className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="all">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          Showing {pages.length} of {total} pages
        </div>

        {/* Pages Table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Position & Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    URL Path
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Headline
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Inquiries
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {pages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="mx-auto max-w-md">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold-100">
                          <Globe className="h-8 w-8 text-gold-600" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-navy-900">No landing pages found</h3>
                        <p className="text-gray-600">
                          {search || positionFilter !== "all" || countryFilter !== "all"
                            ? "Try adjusting your filters to see more results."
                            : "No SEO landing pages have been imported yet."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pages.map((page) => (
                    <tr key={page.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-navy-900">{page.position}</div>
                        <div className="mt-1 flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {[page.city, page.state, page.country].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs text-gray-500">/{page.original_url_path}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-md truncate text-sm text-gray-900">{page.hero_headline}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/seo-pages/landing-pages/${page.id}/inquiries`}
                          className="flex items-center gap-1.5 text-sm font-medium text-navy-900 hover:text-gold-600"
                        >
                          <FileText className="h-4 w-4" />
                          {page.inquiry_count || 0}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                            page.is_active
                              ? "bg-success-100 text-success-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {page.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/${page.original_url_path}`}
                            target="_blank"
                            title="View live"
                          >
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/seo-pages/landing-pages/${page.id}`} title="Edit">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
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
              Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} pages
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(Math.max(0, offset - limit))}
                disabled={offset === 0}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(offset + limit)}
                disabled={offset + limit >= total}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
