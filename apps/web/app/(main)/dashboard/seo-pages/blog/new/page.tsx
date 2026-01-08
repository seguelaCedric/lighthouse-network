"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, ArrowRight, Eye, ArrowLeft, CheckCircle2, AlertCircle, X } from "lucide-react";
import Link from "next/link";

const CONTENT_TYPES = {
  employer: [
    { value: "hiring_guide", label: "Hiring Guide" },
    { value: "salary_guide", label: "Salary Guide" },
    { value: "interview_questions", label: "Interview Questions" },
    { value: "what_to_look_for", label: "What to Look For" },
    { value: "onboarding_guide", label: "Onboarding Guide" },
    { value: "retention_strategy", label: "Retention Strategy" },
    { value: "legal_requirements", label: "Legal Requirements" },
  ],
  candidate: [
    { value: "position_overview", label: "Position Overview" },
    { value: "career_path", label: "Career Path" },
    { value: "skills_required", label: "Skills Required" },
    { value: "certifications", label: "Certifications" },
  ],
  both: [
    { value: "location_insights", label: "Location Insights" },
    { value: "case_study", label: "Case Study" },
    { value: "faq_expansion", label: "FAQ Expansion" },
  ],
};

export default function BlogGeneratorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    targetAudience: "employer" as "employer" | "candidate" | "both",
    contentType: "hiring_guide",
    position: "",
    location: "",
    primaryKeyword: "",
    targetWordCount: 2000,
    customInstructions: "",
  });

  const availableContentTypes = CONTENT_TYPES[formData.targetAudience] || CONTENT_TYPES.employer;

  const handleGenerate = async () => {
    if (!formData.primaryKeyword) {
      setError("Please enter a primary keyword");
      setTimeout(() => setError(null), 5000);
      return;
    }

    setGenerating(true);
    setError(null);
    try {
      // First create a draft post
      const createResponse = await fetch("/api/blog-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Draft - " + formData.primaryKeyword,
          slug: formData.primaryKeyword.toLowerCase().replace(/\s+/g, "-"),
          content: "Generating...",
          content_type: formData.contentType,
          target_audience: formData.targetAudience,
          target_position: formData.position || null,
          target_location: formData.location || null,
          primary_keyword: formData.primaryKeyword,
          status: "draft",
        }),
      });

      const newPost = await createResponse.json();

      // Then generate content
      const generateResponse = await fetch(`/api/blog-posts/${newPost.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: formData.contentType,
          targetAudience: formData.targetAudience,
          position: formData.position || undefined,
          location: formData.location || undefined,
          primaryKeyword: formData.primaryKeyword,
          targetWordCount: formData.targetWordCount,
          customInstructions: formData.customInstructions || undefined,
        }),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.error || "Failed to generate content");
      }

      const generated = await generateResponse.json();
      setPreview(generated);
      setSuccess("Blog post generated successfully!");
      setTimeout(() => setSuccess(null), 5000);
    } catch (error) {
      console.error("Generation error:", error);
      setError(error instanceof Error ? error.message : "Failed to generate blog post. Please try again.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/blog-posts/${preview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "ai_generated",
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      router.push(`/dashboard/seo-pages/blog/${preview.id}`);
    } catch (error) {
      console.error("Save error:", error);
      setError("Failed to save blog post. Please try again.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

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
        <div className="flex items-center gap-4">
          <Link href="/dashboard/seo-pages/blog">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-serif font-semibold text-navy-800">Generate Blog Post with AI</h1>
            <p className="mt-1 text-gray-600">Create SEO-optimized blog content using AI templates</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-100">
                <Sparkles className="h-5 w-5 text-gold-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-navy-900">Generation Settings</h2>
                <p className="text-sm text-gray-600">Configure your blog post parameters</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900">Target Audience</label>
              <p className="mt-0.5 mb-2 text-xs text-gray-500">Who is this content for?</p>
              <select
                value={formData.targetAudience}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetAudience: e.target.value as "employer" | "candidate" | "both",
                    contentType: CONTENT_TYPES[e.target.value as keyof typeof CONTENT_TYPES]?.[0]?.value || "hiring_guide",
                  })
                }
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="employer">Employer</option>
                <option value="candidate">Candidate</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">Content Type</label>
              <p className="mt-0.5 mb-2 text-xs text-gray-500">Select the type of content to generate</p>
              <select
                value={formData.contentType}
                onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                {availableContentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-900">Position (Optional)</label>
                <p className="mt-0.5 mb-2 text-xs text-gray-500">e.g., Butler, Chef</p>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Butler"
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900">Location (Optional)</label>
                <p className="mt-0.5 mb-2 text-xs text-gray-500">e.g., Sydney, New York</p>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Sydney"
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">
                Primary Keyword <span className="text-error-500">*</span>
              </label>
              <p className="mt-0.5 mb-2 text-xs text-gray-500">Main SEO keyword for this post</p>
              <input
                type="text"
                value={formData.primaryKeyword}
                onChange={(e) => setFormData({ ...formData, primaryKeyword: e.target.value })}
                placeholder="e.g., hire butler sydney"
                required
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-900">Target Word Count</label>
                <span className="text-sm font-medium text-gold-600">{formData.targetWordCount.toLocaleString()} words</span>
              </div>
              <input
                type="range"
                min="1000"
                max="5000"
                step="100"
                value={formData.targetWordCount}
                onChange={(e) => setFormData({ ...formData, targetWordCount: parseInt(e.target.value) })}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-gold-500"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>1,000</span>
                <span>3,000</span>
                <span>5,000</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">Custom Instructions (Optional)</label>
              <p className="mt-0.5 mb-2 text-xs text-gray-500">Additional guidance for AI generation</p>
              <textarea
                value={formData.customInstructions}
                onChange={(e) => setFormData({ ...formData, customInstructions: e.target.value })}
                placeholder="E.g., Focus on luxury market, include salary ranges, emphasize experience requirements..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating || !formData.primaryKeyword}
              className="w-full"
              size="lg"
              variant="primary"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate with AI
                </>
              )}
            </Button>
          </div>

          {/* Preview */}
          <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-100">
                <Eye className="h-5 w-5 text-navy-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-navy-900">Preview</h2>
                <p className="text-sm text-gray-600">Review generated content</p>
              </div>
            </div>
            {preview ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-xl font-semibold text-navy-900">{preview.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{preview.excerpt}</p>
                </div>
                <div className="rounded-lg border border-gold-200 bg-gold-50 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-gold-900">SEO Preview</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gold-800">Meta Title:</span>
                      <p className="mt-1 text-gold-700">{preview.meta_title || preview.title}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gold-800">Meta Description:</span>
                      <p className="mt-1 text-gold-700">{preview.meta_description || preview.excerpt}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} disabled={loading} className="flex-1" variant="primary">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Save & Edit
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => router.push(`/dashboard/seo-pages/blog/${preview.id}`)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Full
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
                <Sparkles className="mb-3 h-12 w-12 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">Generated content will appear here</p>
                <p className="mt-1 text-xs text-gray-400">Fill out the form and click "Generate with AI"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
