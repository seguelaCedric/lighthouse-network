"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileText,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Plus,
  Trash2,
  Lightbulb,
  Check,
} from "lucide-react";
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

interface BulkItem {
  position: string;
  location: string;
  content_type: string;
  target_audience: "employer" | "candidate" | "both";
  primary_keyword: string;
  target_word_count: number;
  custom_instructions: string;
}

export default function BulkBlogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [items, setItems] = useState<BulkItem[]>([]);
  const [targetAudience, setTargetAudience] = useState<"employer" | "candidate" | "both">("employer");
  const [contentType, setContentType] = useState<string>("hiring_guide");
  const [generatingIdeas, setGeneratingIdeas] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<Array<BulkItem & { rationale?: string; estimated_traffic_potential?: string }>>([]);
  const [selectedIdeas, setSelectedIdeas] = useState<Set<number>>(new Set());
  const [ideaFocus, setIdeaFocus] = useState<"gaps" | "trends" | "competitors" | "keywords" | "all">("all");

  const availableContentTypes = CONTENT_TYPES[targetAudience] || CONTENT_TYPES.employer;

  const addItem = () => {
    setItems([
      ...items,
      {
        position: "",
        location: "",
        content_type: contentType,
        target_audience: targetAudience,
        primary_keyword: "",
        target_word_count: 2000,
        custom_instructions: "",
      },
    ]);
  };

  const updateItem = (index: number, field: keyof BulkItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

      const parsedItems: BulkItem[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        const item: Partial<BulkItem> = {};

        headers.forEach((header, idx) => {
          const value = values[idx] || "";
          if (header.includes("position")) item.position = value;
          if (header.includes("location")) item.location = value;
          if (header.includes("content") || header.includes("type"))
            item.content_type = value || contentType;
          if (header.includes("audience"))
            item.target_audience = (value as any) || targetAudience;
          if (header.includes("keyword") || header.includes("primary"))
            item.primary_keyword = value;
          if (header.includes("word") || header.includes("count"))
            item.target_word_count = parseInt(value) || 2000;
          if (header.includes("instruction") || header.includes("custom"))
            item.custom_instructions = value;
        });

        if (item.primary_keyword) {
          parsedItems.push({
            position: item.position || "",
            location: item.location || "",
            content_type: item.content_type || contentType,
            target_audience: item.target_audience || targetAudience,
            primary_keyword: item.primary_keyword,
            target_word_count: item.target_word_count || 2000,
            custom_instructions: item.custom_instructions || "",
          });
        }
      }

      setItems([...items, ...parsedItems]);
    };
    reader.readAsText(file);
  };

  const handleGenerateIdeas = async () => {
    setGeneratingIdeas(true);
    setError(null);
    try {
      const response = await fetch("/api/blog-posts/bulk/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetAudience,
          contentTypes: [contentType],
          maxIdeas: 20,
          focus: ideaFocus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate ideas");
      }

      const data = await response.json();
      const ideasAsItems: BulkItem[] = data.ideas.map((idea: any) => ({
        position: idea.position || "",
        location: idea.location || "",
        content_type: idea.content_type || contentType,
        target_audience: idea.target_audience || targetAudience,
        primary_keyword: idea.primary_keyword || "",
        target_word_count: 2000,
        custom_instructions: "",
        rationale: idea.rationale,
        estimated_traffic_potential: idea.estimated_traffic_potential,
      }));

      setGeneratedIdeas(ideasAsItems);
      setSelectedIdeas(new Set());
    } catch (error) {
      console.error("Generate ideas error:", error);
      setError(error instanceof Error ? error.message : "Failed to generate ideas. Please try again.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setGeneratingIdeas(false);
    }
  };

  const toggleIdeaSelection = (index: number) => {
    const newSelected = new Set(selectedIdeas);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIdeas(newSelected);
  };

  const addSelectedIdeas = () => {
    const ideasToAdd = generatedIdeas.filter((_, index) => selectedIdeas.has(index));
    setItems([...items, ...ideasToAdd.map(({ rationale, estimated_traffic_potential, ...item }) => item)]);
    setGeneratedIdeas([]);
    setSelectedIdeas(new Set());
    setSuccess(`Added ${ideasToAdd.length} ideas to your queue!`);
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      setError("Please add at least one item to create");
      setTimeout(() => setError(null), 5000);
      return;
    }

    // Validate all items have required fields
    const invalidItems = items.filter((item) => !item.primary_keyword);
    if (invalidItems.length > 0) {
      setError("All items must have a primary keyword");
      setTimeout(() => setError(null), 5000);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/blog-posts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create posts");
      }

      const data = await response.json();
      setSuccess(`Successfully created ${data.created} draft posts!`);
      setTimeout(() => {
        router.push("/dashboard/seo-pages/blog");
      }, 2000);
    } catch (error) {
      console.error("Bulk create error:", error);
      setError(error instanceof Error ? error.message : "Failed to create posts. Please try again.");
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
            <h1 className="text-4xl font-serif font-semibold text-navy-800">Bulk Create Blog Posts</h1>
            <p className="mt-1 text-gray-600">Create multiple blog posts at once</p>
          </div>
        </div>

        {/* CSV Upload */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-100">
              <Upload className="h-5 w-5 text-gold-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-navy-900">CSV Upload</h2>
              <p className="text-sm text-gray-600">Upload a CSV file with blog post data</p>
            </div>
          </div>
          <div className="space-y-2">
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-gold-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gold-700 hover:file:bg-gold-200"
            />
            <p className="text-xs text-gray-500">
              CSV columns: position, location, content_type, target_audience, primary_keyword,
              target_word_count, custom_instructions
            </p>
          </div>
        </div>

        {/* AI Idea Generation */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-100">
              <Lightbulb className="h-5 w-5 text-gold-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-navy-900">AI Content Idea Generation</h2>
              <p className="text-sm text-gray-600">Let AI suggest blog post ideas based on your landing pages and content gaps</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-900">Target Audience</label>
                <select
                  value={targetAudience}
                  onChange={(e) => {
                    setTargetAudience(e.target.value as any);
                    setContentType(CONTENT_TYPES[e.target.value as keyof typeof CONTENT_TYPES]?.[0]?.value || "hiring_guide");
                  }}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                >
                  <option value="employer">Employer</option>
                  <option value="candidate">Candidate</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900">Focus Strategy</label>
                <select
                  value={ideaFocus}
                  onChange={(e) => setIdeaFocus(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                >
                  <option value="all">All Factors</option>
                  <option value="gaps">Content Gaps</option>
                  <option value="trends">Market Trends</option>
                  <option value="competitors">Competitor Analysis</option>
                  <option value="keywords">Keyword Opportunities</option>
                </select>
              </div>
            </div>
            <Button
              onClick={handleGenerateIdeas}
              disabled={generatingIdeas}
              variant="primary"
              className="w-full"
            >
              {generatingIdeas ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Ideas...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Content Ideas
                </>
              )}
            </Button>
          </div>

          {/* Generated Ideas */}
          {generatedIdeas.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  Generated Ideas ({generatedIdeas.length})
                </h3>
                {selectedIdeas.size > 0 && (
                  <Button variant="secondary" size="sm" onClick={addSelectedIdeas}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add {selectedIdeas.size} Selected
                  </Button>
                )}
              </div>
              <div className="max-h-96 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4">
                {generatedIdeas.map((idea, index) => (
                  <div
                    key={index}
                    className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                      selectedIdeas.has(index)
                        ? "border-gold-500 bg-gold-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                    onClick={() => toggleIdeaSelection(index)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          selectedIdeas.has(index)
                            ? "border-gold-500 bg-gold-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedIdeas.has(index) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-navy-900">{idea.position}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600">{idea.location}</span>
                          {idea.estimated_traffic_potential && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span
                                className={`text-xs font-medium ${
                                  idea.estimated_traffic_potential === "high"
                                    ? "text-success-600"
                                    : idea.estimated_traffic_potential === "medium"
                                    ? "text-gold-600"
                                    : "text-gray-600"
                                }`}
                              >
                                {idea.estimated_traffic_potential} potential
                              </span>
                            </>
                          )}
                        </div>
                        <div className="mt-1 text-sm font-medium text-gold-600">{idea.primary_keyword}</div>
                        {idea.rationale && (
                          <p className="mt-1 text-xs text-gray-600">{idea.rationale}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Default Settings */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-navy-900">Default Settings</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-900">Target Audience</label>
              <select
                value={targetAudience}
                onChange={(e) => {
                  setTargetAudience(e.target.value as any);
                  setContentType(CONTENT_TYPES[e.target.value as keyof typeof CONTENT_TYPES]?.[0]?.value || "hiring_guide");
                }}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="employer">Employer</option>
                <option value="candidate">Candidate</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900">Content Type</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                {availableContentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy-900">
              Blog Posts to Create ({items.length})
            </h2>
            <Button variant="secondary" size="sm" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-600">No items added yet. Click "Add Item" or upload a CSV.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-navy-900">Item {index + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700">Position</label>
                      <input
                        type="text"
                        value={item.position}
                        onChange={(e) => updateItem(index, "position", e.target.value)}
                        placeholder="Butler"
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700">Location</label>
                      <input
                        type="text"
                        value={item.location}
                        onChange={(e) => updateItem(index, "location", e.target.value)}
                        placeholder="Sydney"
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700">
                        Primary Keyword <span className="text-error-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.primary_keyword}
                        onChange={(e) => updateItem(index, "primary_keyword", e.target.value)}
                        placeholder="hire butler sydney"
                        required
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={loading || items.length === 0}
            size="lg"
            variant="primary"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Create {items.length} Draft Posts
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
