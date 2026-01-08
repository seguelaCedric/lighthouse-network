"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  content_type: string | null;
  target_audience: string;
  target_position: string | null;
  target_location: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  view_count: number;
}

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [audienceFilter, setAudienceFilter] = useState<string>("all");
  const [contentTypeFilter, setContentTypeFilter] = useState<string>("all");

  useEffect(() => {
    fetchPosts();
  }, [statusFilter, audienceFilter, contentTypeFilter, search]);

  const fetchPosts = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (audienceFilter !== "all") params.set("target_audience", audienceFilter);
      if (contentTypeFilter !== "all") params.set("content_type", contentTypeFilter);
      if (search) params.set("search", search);

      const response = await fetch(`/api/blog-posts?${params.toString()}`);
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { icon: FileText, color: "bg-gray-100 text-gray-700", label: "Draft" },
      ai_generated: { icon: Clock, color: "bg-blue-100 text-blue-700", label: "AI Generated" },
      needs_review: { icon: Clock, color: "bg-yellow-100 text-yellow-700", label: "Needs Review" },
      in_editing: { icon: Edit, color: "bg-purple-100 text-purple-700", label: "In Editing" },
      approved: { icon: CheckCircle, color: "bg-green-100 text-green-700", label: "Approved" },
      published: { icon: Eye, color: "bg-emerald-100 text-emerald-700", label: "Published" },
      archived: { icon: XCircle, color: "bg-gray-100 text-gray-700", label: "Archived" },
    };
    const badge = badges[status as keyof typeof badges] || badges.draft;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </span>
    );
  };

  const getAudienceBadge = (audience: string) => {
    const colors = {
      employer: "bg-gold-100 text-gold-700",
      candidate: "bg-navy-100 text-navy-700",
      both: "bg-burgundy-100 text-burgundy-700",
    };
    return (
      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${colors[audience as keyof typeof colors] || colors.both}`}>
        {audience}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold-600" />
          <p className="mt-4 text-gray-600">Loading blog posts...</p>
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
            <h1 className="text-4xl font-serif font-semibold text-navy-800">Blog Posts</h1>
            <p className="mt-1 text-gray-600">
              Manage AI-generated blog content for SEO and lead generation
            </p>
          </div>
          <Link href="/dashboard/seo-pages/blog/new">
            <Button variant="primary" leftIcon={<Sparkles className="size-4" />}>
              Generate New Post
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts by title, content, or keywords..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 pl-10 pr-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="ai_generated">AI Generated</option>
                <option value="needs_review">Needs Review</option>
                <option value="in_editing">In Editing</option>
                <option value="approved">Approved</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <select
                value={audienceFilter}
                onChange={(e) => setAudienceFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="all">All Audiences</option>
                <option value="employer">Employer</option>
                <option value="candidate">Candidate</option>
                <option value="both">Both</option>
              </select>
              <select
                value={contentTypeFilter}
                onChange={(e) => setContentTypeFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="all">All Types</option>
                <option value="hiring_guide">Hiring Guide</option>
                <option value="salary_guide">Salary Guide</option>
                <option value="interview_questions">Interview Questions</option>
                <option value="position_overview">Position Overview</option>
                <option value="career_path">Career Path</option>
              </select>
            </div>
          </div>
        </div>

        {/* Posts Table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Audience
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Target
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Views
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Updated
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="mx-auto max-w-md">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold-100">
                          <FileText className="h-8 w-8 text-gold-600" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-navy-900">No blog posts found</h3>
                        <p className="mb-6 text-gray-600">
                          {search || statusFilter !== "all" || audienceFilter !== "all" || contentTypeFilter !== "all"
                            ? "Try adjusting your filters to see more results."
                            : "Get started by generating your first AI-powered blog post."}
                        </p>
                        {!search && statusFilter === "all" && audienceFilter === "all" && contentTypeFilter === "all" && (
                          <Link href="/dashboard/seo-pages/blog/new">
                            <Button variant="primary" leftIcon={<Sparkles className="size-4" />}>
                              Generate Your First Post
                            </Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-navy-900">{post.title}</div>
                        <div className="mt-1 font-mono text-xs text-gray-500">/{post.slug}</div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(post.status)}</td>
                      <td className="px-6 py-4">{getAudienceBadge(post.target_audience)}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {post.target_position && (
                            <div className="font-medium text-navy-900">{post.target_position}</div>
                          )}
                          {post.target_location && (
                            <div className="text-gray-600">{post.target_location}</div>
                          )}
                          {!post.target_position && !post.target_location && (
                            <span className="text-gray-400">General</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Eye className="h-4 w-4" />
                          <span className="font-medium">{post.view_count || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <time dateTime={post.updated_at}>
                            {new Date(post.updated_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </time>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {post.status === "published" && (
                            <Link href={`/blog/${post.slug}`} target="_blank" title="View live">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          <Link href={`/dashboard/seo-pages/blog/${post.id}`} title="Edit">
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
      </div>
    </div>
  );
}
