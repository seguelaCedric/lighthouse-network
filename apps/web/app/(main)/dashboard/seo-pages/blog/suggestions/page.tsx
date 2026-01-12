"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Plus,
  Check,
  Filter,
  TrendingUp,
  Target,
  Users,
  BarChart3,
  Zap,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { ContentLayout } from "@/components/dashboard/ContentLayout";

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

const FOCUS_OPTIONS = [
  { value: "all", label: "All Factors", icon: BarChart3, description: "Balanced analysis across all factors" },
  { value: "gaps", label: "Content Gaps", icon: Target, description: "Topics missing from your existing content" },
  { value: "trends", label: "Market Trends", icon: TrendingUp, description: "Trending topics in the industry" },
  { value: "competitors", label: "Competitor Analysis", icon: Users, description: "Topics competitors are covering" },
  { value: "keywords", label: "Keyword Opportunities", icon: Zap, description: "High-value SEO keywords to target" },
];

interface ContentIdea {
  position: string;
  location: string;
  content_type: string;
  target_audience: "employer" | "candidate" | "both";
  primary_keyword: string;
  title_suggestion?: string;
  rationale?: string;
  estimated_traffic_potential?: "high" | "medium" | "low";
  priority_score?: number;
}

export default function ContentSuggestionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter state
  const [targetAudience, setTargetAudience] = useState<"employer" | "candidate" | "both">("employer");
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const [focus, setFocus] = useState<"gaps" | "trends" | "competitors" | "keywords" | "all">("all");
  const [maxIdeas, setMaxIdeas] = useState(20);

  // Ideas state
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [selectedIdeas, setSelectedIdeas] = useState<Set<number>>(new Set());

  // Positions and locations from landing pages
  const [positions, setPositions] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  // Fetch positions and locations on mount
  useEffect(() => {
    fetchLandingPageData();
  }, []);

  const fetchLandingPageData = async () => {
    try {
      const response = await fetch("/api/seo-landing-pages?fields=position,country,state,city&limit=1000");
      if (response.ok) {
        const data = await response.json();
        const uniquePositions = [...new Set(data.pages?.map((p: any) => p.position) || [])].filter(Boolean) as string[];
        const uniqueLocations = [...new Set(
          data.pages?.flatMap((p: any) => [p.city, p.state, p.country].filter(Boolean)) || []
        )] as string[];
        setPositions(uniquePositions.sort());
        setLocations(uniqueLocations.sort());
      }
    } catch (err) {
      console.error("Failed to fetch landing page data:", err);
    }
  };

  const availableContentTypes = [
    ...CONTENT_TYPES.employer,
    ...CONTENT_TYPES.candidate,
    ...CONTENT_TYPES.both,
  ].filter((type) => {
    if (targetAudience === "employer") return CONTENT_TYPES.employer.some(t => t.value === type.value) || CONTENT_TYPES.both.some(t => t.value === type.value);
    if (targetAudience === "candidate") return CONTENT_TYPES.candidate.some(t => t.value === type.value) || CONTENT_TYPES.both.some(t => t.value === type.value);
    return true;
  });

  const handleGenerateIdeas = async () => {
    setGenerating(true);
    setError(null);
    setIdeas([]);
    setSelectedIdeas(new Set());

    try {
      const response = await fetch("/api/blog-posts/bulk/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetAudience,
          contentTypes: selectedContentTypes.length > 0 ? selectedContentTypes : undefined,
          positions: selectedPositions.length > 0 ? selectedPositions : undefined,
          locations: selectedLocations.length > 0 ? selectedLocations : undefined,
          maxIdeas,
          focus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate ideas");
      }

      const data = await response.json();
      setIdeas(data.ideas || []);

      if (data.ideas?.length === 0) {
        setSuccess("No new content ideas found. Try adjusting your filters.");
      }
    } catch (err) {
      console.error("Generate ideas error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate ideas");
    } finally {
      setGenerating(false);
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

  const selectAll = () => {
    if (selectedIdeas.size === ideas.length) {
      setSelectedIdeas(new Set());
    } else {
      setSelectedIdeas(new Set(ideas.map((_, i) => i)));
    }
  };

  const handleCreateDrafts = async () => {
    if (selectedIdeas.size === 0) {
      setError("Please select at least one idea");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const itemsToCreate = ideas
        .filter((_, index) => selectedIdeas.has(index))
        .map((idea) => ({
          position: idea.position,
          location: idea.location,
          content_type: idea.content_type,
          target_audience: idea.target_audience,
          primary_keyword: idea.primary_keyword,
          target_word_count: 2000,
          custom_instructions: "",
        }));

      const response = await fetch("/api/blog-posts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToCreate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create posts");
      }

      const data = await response.json();
      setSuccess(`Successfully created ${data.created} draft posts!`);

      // Remove created ideas from the list
      setIdeas(ideas.filter((_, index) => !selectedIdeas.has(index)));
      setSelectedIdeas(new Set());

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error("Create drafts error:", err);
      setError(err instanceof Error ? err.message : "Failed to create posts");
    } finally {
      setCreating(false);
    }
  };

  const handleGenerateNow = async (idea: ContentIdea, index: number) => {
    setLoading(true);
    setError(null);

    try {
      // First create the draft
      const createResponse = await fetch("/api/blog-posts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{
            position: idea.position,
            location: idea.location,
            content_type: idea.content_type,
            target_audience: idea.target_audience,
            primary_keyword: idea.primary_keyword,
            target_word_count: 2000,
            custom_instructions: "",
          }],
        }),
      });

      if (!createResponse.ok) {
        throw new Error("Failed to create draft");
      }

      const createData = await createResponse.json();
      const postId = createData.ids?.[0];

      if (!postId) {
        throw new Error("No post ID returned");
      }

      // Then generate content
      const generateResponse = await fetch(`/api/blog-posts/${postId}/generate`, {
        method: "POST",
      });

      if (!generateResponse.ok) {
        throw new Error("Failed to generate content");
      }

      setSuccess("Post created and content generated! Redirecting...");

      // Remove from ideas list
      setIdeas(ideas.filter((_, i) => i !== index));
      setSelectedIdeas(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });

      setTimeout(() => {
        router.push(`/dashboard/seo-pages/blog/${postId}`);
      }, 1500);
    } catch (err) {
      console.error("Generate now error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate post");
    } finally {
      setLoading(false);
    }
  };

  const getPotentialBadgeColor = (potential?: string) => {
    switch (potential) {
      case "high":
        return "bg-success-100 text-success-700";
      case "medium":
        return "bg-gold-100 text-gold-700";
      case "low":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getContentTypeLabel = (value: string) => {
    const allTypes = [...CONTENT_TYPES.employer, ...CONTENT_TYPES.candidate, ...CONTENT_TYPES.both];
    return allTypes.find((t) => t.value === value)?.label || value;
  };

  return (
    <ContentLayout
      title="Content Suggestions"
      description="AI-powered blog post ideas based on your SEO landing pages and content gaps"
    >
      {/* Toast Notifications */}
      {error && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-lg border border-error-200 bg-error-50 px-4 py-3 shadow-lg">
          <AlertCircle className="h-5 w-5 text-error-600" />
          <p className="text-sm font-medium text-error-800">{error}</p>
          <button onClick={() => setError(null)} className="ml-2 text-error-600 hover:text-error-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-lg border border-success-200 bg-success-50 px-4 py-3 shadow-lg">
          <CheckCircle2 className="h-5 w-5 text-success-600" />
          <p className="text-sm font-medium text-success-800">{success}</p>
          <button onClick={() => setSuccess(null)} className="ml-2 text-success-600 hover:text-success-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* Filters */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-gold-600" />
            <h2 className="text-lg font-semibold text-navy-900">Filters</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Target Audience */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">Target Audience</label>
              <div className="flex gap-2">
                {(["employer", "candidate", "both"] as const).map((audience) => (
                  <button
                    key={audience}
                    onClick={() => {
                      setTargetAudience(audience);
                      setSelectedContentTypes([]);
                    }}
                    className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                      targetAudience === audience
                        ? "border-gold-500 bg-gold-50 text-gold-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {audience.charAt(0).toUpperCase() + audience.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Ideas */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">Number of Ideas</label>
              <select
                value={maxIdeas}
                onChange={(e) => setMaxIdeas(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value={10}>10 ideas</option>
                <option value={20}>20 ideas</option>
                <option value={30}>30 ideas</option>
                <option value={50}>50 ideas (max)</option>
              </select>
            </div>

            {/* Content Types */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">Content Types (optional)</label>
              <div className="flex flex-wrap gap-2">
                {availableContentTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setSelectedContentTypes((prev) =>
                        prev.includes(type.value)
                          ? prev.filter((t) => t !== type.value)
                          : [...prev, type.value]
                      );
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedContentTypes.includes(type.value)
                        ? "bg-gold-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              {selectedContentTypes.length === 0 && (
                <p className="mt-1 text-xs text-gray-500">All content types will be considered</p>
              )}
            </div>

            {/* Positions */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">Positions (optional)</label>
              <div className="max-h-24 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2">
                <div className="flex flex-wrap gap-1">
                  {positions.slice(0, 20).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => {
                        setSelectedPositions((prev) =>
                          prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
                        );
                      }}
                      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                        selectedPositions.includes(pos)
                          ? "bg-navy-500 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
              {selectedPositions.length === 0 && (
                <p className="mt-1 text-xs text-gray-500">All positions will be considered</p>
              )}
            </div>
          </div>

          {/* Focus Strategy */}
          <div className="mt-6">
            <label className="mb-2 block text-sm font-semibold text-gray-900">Focus Strategy</label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {FOCUS_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setFocus(option.value as typeof focus)}
                    className={`flex flex-col items-center rounded-lg border p-4 text-center transition-colors ${
                      focus === option.value
                        ? "border-gold-500 bg-gold-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <Icon className={`mb-2 h-6 w-6 ${focus === option.value ? "text-gold-600" : "text-gray-400"}`} />
                    <span className={`text-sm font-medium ${focus === option.value ? "text-gold-700" : "text-gray-700"}`}>
                      {option.label}
                    </span>
                    <span className="mt-1 text-xs text-gray-500">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generate Button */}
          <div className="mt-6 flex justify-end">
            <Button onClick={handleGenerateIdeas} disabled={generating} variant="primary" size="lg">
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing Content Gaps...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Content Ideas
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Ideas List */}
        {ideas.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-100">
                  <Lightbulb className="h-5 w-5 text-gold-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-navy-900">Generated Ideas ({ideas.length})</h2>
                  <p className="text-sm text-gray-600">Select ideas to create as drafts</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={selectAll}
                  className="text-sm font-medium text-gold-600 hover:text-gold-700"
                >
                  {selectedIdeas.size === ideas.length ? "Deselect All" : "Select All"}
                </button>
                {selectedIdeas.size > 0 && (
                  <Button onClick={handleCreateDrafts} disabled={creating} variant="primary">
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create {selectedIdeas.size} Drafts
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {ideas.map((idea, index) => (
                <div
                  key={index}
                  className={`rounded-lg border p-4 transition-colors ${
                    selectedIdeas.has(index)
                      ? "border-gold-500 bg-gold-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleIdeaSelection(index)}
                      className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                        selectedIdeas.has(index)
                          ? "border-gold-500 bg-gold-500"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {selectedIdeas.has(index) && <Check className="h-3 w-3 text-white" />}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-navy-900">{idea.position || "General"}</span>
                        {idea.location && (
                          <>
                            <span className="text-gray-400">in</span>
                            <span className="text-gray-700">{idea.location}</span>
                          </>
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getPotentialBadgeColor(idea.estimated_traffic_potential)}`}>
                          {idea.estimated_traffic_potential || "unknown"} potential
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="rounded bg-navy-100 px-2 py-1 text-xs font-medium text-navy-700">
                          {getContentTypeLabel(idea.content_type)}
                        </span>
                        <span className="rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-600">
                          {idea.primary_keyword}
                        </span>
                      </div>

                      {idea.title_suggestion && (
                        <p className="mt-2 text-sm font-medium text-gray-800">"{idea.title_suggestion}"</p>
                      )}

                      {idea.rationale && (
                        <p className="mt-1 text-sm text-gray-600">{idea.rationale}</p>
                      )}
                    </div>

                    {/* Quick Action */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleGenerateNow(idea, index)}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Zap className="mr-1 h-4 w-4" />
                          Generate Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!generating && ideas.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <Lightbulb className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-700">No Ideas Generated Yet</h3>
            <p className="mt-2 text-gray-600">
              Configure your filters above and click "Generate Content Ideas" to get AI-powered suggestions.
            </p>
          </div>
        )}
      </div>
    </ContentLayout>
  );
}
