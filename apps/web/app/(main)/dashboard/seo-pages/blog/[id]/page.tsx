"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Save,
  Eye,
  Send,
  Loader2,
  CheckCircle,
  Clock,
  FileText,
  Search,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
} from "lucide-react";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  status: string;
  content_type: string | null;
  target_audience: string;
  target_position: string | null;
  target_location: string | null;
  primary_keyword: string | null;
  target_keywords: string[] | null;
  related_landing_page_urls: string[] | null;
  scheduled_generate_at: string | null;
  scheduled_publish_at: string | null;
  // Answer capsule fields for AI/LLM optimization
  answer_capsule: string | null;
  answer_capsule_question: string | null;
  key_facts: string[] | null;
  last_updated_display: string | null;
}

export default function BlogEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [postId, setPostId] = useState<string | null>(null);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    meta_title: "",
    meta_description: "",
    status: "draft",
    primary_keyword: "",
    scheduled_generate_at: "",
    scheduled_publish_at: "",
    // Answer capsule fields for AI/LLM optimization
    answer_capsule: "",
    answer_capsule_question: "",
    key_facts: [] as string[],
    last_updated_display: "",
  });

  useEffect(() => {
    params.then((p) => {
      setPostId(p.id);
      fetchPost(p.id);
    });
  }, [params]);

  const fetchPost = async (id: string) => {
    try {
      const response = await fetch(`/api/blog-posts/${id}`);
      const data = await response.json();
      setPost(data);
      setFormData({
        title: data.title || "",
        slug: data.slug || "",
        excerpt: data.excerpt || "",
        content: data.content || "",
        meta_title: data.meta_title || data.title || "",
        meta_description: data.meta_description || data.excerpt || "",
        status: data.status || "draft",
        primary_keyword: data.primary_keyword || "",
        scheduled_generate_at: data.scheduled_generate_at
          ? new Date(data.scheduled_generate_at).toISOString().slice(0, 16)
          : "",
        scheduled_publish_at: data.scheduled_publish_at
          ? new Date(data.scheduled_publish_at).toISOString().slice(0, 16)
          : "",
        // Answer capsule fields for AI/LLM optimization
        answer_capsule: data.answer_capsule || "",
        answer_capsule_question: data.answer_capsule_question || "",
        key_facts: data.key_facts || [],
        last_updated_display: data.last_updated_display
          ? new Date(data.last_updated_display).toISOString().slice(0, 16)
          : "",
      });
    } catch (error) {
      console.error("Failed to fetch post:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!postId) return;

    setSaving(true);
    setError(null);
    try {
      // Convert datetime-local strings to ISO strings for API
      const saveData = {
        ...formData,
        scheduled_generate_at: formData.scheduled_generate_at
          ? new Date(formData.scheduled_generate_at).toISOString()
          : null,
        scheduled_publish_at: formData.scheduled_publish_at
          ? new Date(formData.scheduled_publish_at).toISOString()
          : null,
        last_updated_display: formData.last_updated_display
          ? new Date(formData.last_updated_display).toISOString()
          : null,
        key_facts: formData.key_facts.length > 0 ? formData.key_facts : null,
      };

      const response = await fetch(`/api/blog-posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveData),
      });

      if (!response.ok) throw new Error("Failed to save");

      const updated = await response.json();
      setPost(updated);
      setSuccess("Post saved successfully!");
      setTimeout(() => setSuccess(null), 5000);
    } catch (error) {
      console.error("Save error:", error);
      setError("Failed to save post. Please try again.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!postId) return;

    setPublishing(true);
    try {
      const response = await fetch(`/api/blog-posts/${postId}/publish`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to publish");

      setSuccess("Post published successfully!");
      setTimeout(() => {
        router.push("/dashboard/seo-pages/blog");
      }, 1500);
    } catch (error) {
      console.error("Publish error:", error);
      setError("Failed to publish post. Please try again.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setPublishing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { icon: FileText, color: "bg-gray-100 text-gray-700", label: "Draft" },
      ai_generated: { icon: Clock, color: "bg-blue-100 text-blue-700", label: "AI Generated" },
      needs_review: { icon: Clock, color: "bg-yellow-100 text-yellow-700", label: "Needs Review" },
      in_editing: { icon: FileText, color: "bg-purple-100 text-purple-700", label: "In Editing" },
      approved: { icon: CheckCircle, color: "bg-green-100 text-green-700", label: "Approved" },
      published: { icon: CheckCircle, color: "bg-emerald-100 text-emerald-700", label: "Published" },
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

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold-600" />
          <p className="mt-4 text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-navy-900">Post not found</h3>
          <p className="mt-2 text-gray-600">The blog post you're looking for doesn't exist.</p>
          <Link href="/dashboard/seo-pages/blog" className="mt-4 inline-block">
            <Button variant="secondary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog Posts
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl space-y-6">
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/seo-pages/blog">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-serif font-semibold text-navy-800">Edit Blog Post</h1>
              <p className="mt-1 text-gray-600">Edit and manage your blog post content</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(post.status)}
            {post.status === "published" && (
              <Link href={`/blog/${post.slug}`} target="_blank">
                <Button variant="secondary">
                  <Eye className="mr-2 h-4 w-4" />
                  View Live
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <label className="block text-sm font-semibold text-gray-900">Title</label>
              <p className="mt-0.5 mb-3 text-xs text-gray-500">The main headline for your blog post</p>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-lg font-semibold focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                placeholder="Enter blog post title..."
              />
            </div>

            {/* Slug */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <label className="block text-sm font-semibold text-gray-900">Slug</label>
              <p className="mt-0.5 mb-3 text-xs text-gray-500">URL-friendly version of the title</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">/blog/</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                  placeholder="blog-post-slug"
                />
              </div>
            </div>

            {/* Excerpt */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <label className="block text-sm font-semibold text-gray-900">Excerpt</label>
              <p className="mt-0.5 mb-3 text-xs text-gray-500">Brief summary shown in listings (150-160 characters)</p>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                placeholder="Brief summary of the post..."
              />
              <p className="mt-1 text-xs text-gray-500">{formData.excerpt.length}/160 characters</p>
            </div>

            {/* Answer Capsule - Critical for AI/LLM Citations */}
            <div className="rounded-xl border-2 border-gold-200 bg-gold-50/30 p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-100">
                  <CheckCircle2 className="h-4 w-4 text-gold-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Answer Capsule</h3>
                  <p className="text-xs text-gray-500">Critical for AI/LLM search citations (ChatGPT, Perplexity, etc.)</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Question */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900">Question</label>
                  <p className="mt-0.5 mb-2 text-xs text-gray-500">The main question this article answers</p>
                  <input
                    type="text"
                    value={formData.answer_capsule_question}
                    onChange={(e) => setFormData({ ...formData, answer_capsule_question: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                    placeholder="e.g., How much does a butler earn in London?"
                  />
                </div>

                {/* Answer */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900">Direct Answer</label>
                  <p className="mt-0.5 mb-2 text-xs text-gray-500">2-3 sentences, under 100 words. NO LINKS - must be quotable.</p>
                  <textarea
                    value={formData.answer_capsule}
                    onChange={(e) => setFormData({ ...formData, answer_capsule: e.target.value })}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                    placeholder="A butler in London typically earns between £45,000 and £80,000 per year, depending on experience and the employer. Senior butlers at prestigious estates can earn over £100,000 annually."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.answer_capsule.split(/\s+/).filter(Boolean).length} words (aim for under 100)
                  </p>
                </div>

                {/* Key Facts */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900">Key Facts</label>
                  <p className="mt-0.5 mb-2 text-xs text-gray-500">3-5 bullet points for quick scanning (one per line)</p>
                  <textarea
                    value={formData.key_facts.join("\n")}
                    onChange={(e) => setFormData({
                      ...formData,
                      key_facts: e.target.value.split("\n").filter(line => line.trim())
                    })}
                    rows={5}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                    placeholder="Entry-level butlers earn £35,000-45,000&#10;Experienced butlers earn £50,000-70,000&#10;Top estates pay £80,000-100,000+&#10;Live-in positions include accommodation&#10;London salaries are 20% higher than average"
                  />
                  <p className="mt-1 text-xs text-gray-500">{formData.key_facts.length}/5 facts</p>
                </div>

                {/* Last Updated */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900">Last Updated Display</label>
                  <p className="mt-0.5 mb-2 text-xs text-gray-500">Visible freshness date - critical for AI citations</p>
                  <input
                    type="datetime-local"
                    value={formData.last_updated_display}
                    onChange={(e) => setFormData({ ...formData, last_updated_display: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      last_updated_display: new Date().toISOString().slice(0, 16)
                    })}
                    className="mt-2 text-xs text-gold-600 hover:text-gold-700"
                  >
                    Set to now
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <label className="block text-sm font-semibold text-gray-900">Content</label>
                  <p className="mt-0.5 text-xs text-gray-500">Write your content in Markdown format</p>
                </div>
                <span className="text-xs text-gray-500">
                  {formData.content.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={25}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 font-mono text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                placeholder="Write your content in Markdown..."
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* SEO Preview */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-100">
                  <Search className="h-4 w-4 text-gold-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">SEO Preview</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Meta Title</label>
                  <p className="mb-2 text-xs text-gray-500">Appears in search results (60 chars)</p>
                  <input
                    type="text"
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                    maxLength={60}
                  />
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-xs text-gray-500">{formData.meta_title.length}/60</p>
                    {formData.meta_title.length > 60 && (
                      <p className="text-xs text-error-600">Too long</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Meta Description</label>
                  <p className="mb-2 text-xs text-gray-500">Search result snippet (160 chars)</p>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                    maxLength={160}
                  />
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-xs text-gray-500">{formData.meta_description.length}/160</p>
                    {formData.meta_description.length > 160 && (
                      <p className="text-xs text-error-600">Too long</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Primary Keyword</label>
                  <p className="mb-2 text-xs text-gray-500">Main SEO keyword</p>
                  <input
                    type="text"
                    value={formData.primary_keyword}
                    onChange={(e) => setFormData({ ...formData, primary_keyword: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                    placeholder="e.g., hire butler sydney"
                  />
                </div>
              </div>
            </div>

            {/* Status & Actions */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-100">
                  <FileText className="h-4 w-4 text-navy-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">Status & Actions</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="ai_generated">AI Generated</option>
                    <option value="needs_review">Needs Review</option>
                    <option value="in_editing">In Editing</option>
                    <option value="approved">Approved</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Schedule Generation</label>
                  <p className="mb-2 text-xs text-gray-500">Auto-generate content at this time</p>
                  <input
                    type="datetime-local"
                    value={formData.scheduled_generate_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_generate_at: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                  {formData.scheduled_generate_at && (
                    <button
                      onClick={() => setFormData({ ...formData, scheduled_generate_at: "" })}
                      className="mt-1 text-xs text-error-600 hover:text-error-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Schedule Publishing</label>
                  <p className="mb-2 text-xs text-gray-500">Auto-publish at this time</p>
                  <input
                    type="datetime-local"
                    value={formData.scheduled_publish_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_publish_at: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                  {formData.scheduled_publish_at && (
                    <button
                      onClick={() => setFormData({ ...formData, scheduled_publish_at: "" })}
                      className="mt-1 text-xs text-error-600 hover:text-error-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2 pt-2">
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
                  {formData.status !== "published" && (
                    <Button
                      onClick={handlePublish}
                      disabled={publishing}
                      variant="primary"
                      className="w-full"
                    >
                      {publishing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Publish
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Post Info */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-burgundy-100">
                  <FileText className="h-4 w-4 text-burgundy-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">Post Information</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium text-navy-900">
                    {post.content_type ? post.content_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Audience:</span>
                  <span className="font-medium capitalize text-navy-900">{post.target_audience}</span>
                </div>
                {post.target_position && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Position:</span>
                    <span className="font-medium text-navy-900">{post.target_position}</span>
                  </div>
                )}
                {post.target_location && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium text-navy-900">{post.target_location}</span>
                  </div>
                )}
                {post.related_landing_page_urls && post.related_landing_page_urls.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Linked Pages:</span>
                    <span className="font-medium text-navy-900">{post.related_landing_page_urls.length}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
