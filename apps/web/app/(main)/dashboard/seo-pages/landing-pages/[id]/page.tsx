"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Save,
  Eye,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Globe,
  Plus,
  GripVertical,
  Star,
  HelpCircle,
  MessageSquare,
  Briefcase,
  FileText as FileTextIcon,
  Sparkles,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ContentLayout } from "@/components/dashboard/ContentLayout";
import { DashboardBreadcrumbs, getLandingPageBreadcrumbs } from "@/components/dashboard/DashboardBreadcrumbs";

interface FAQItem {
  question: string;
  answer: string;
}

interface Testimonial {
  name: string;
  role?: string;
  company?: string;
  quote: string;
  rating?: number;
  photo_url?: string;
}

interface CaseStudy {
  title: string;
  challenge: string;
  solution: string;
  result: string;
  metrics?: string;
}

interface ContentSection {
  heading: string;
  content: string;
  type: string;
  order: number;
}

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
  canonical_url: string | null;
  hero_headline: string;
  hero_subheadline: string | null;
  intro_content: string | null;
  benefits: string[];
  form_heading: string;
  cta_text: string;
  is_active: boolean;
  inquiry_count: number;
  // Rich content fields
  about_position?: string | null;
  location_info?: string | null;
  service_description?: string | null;
  process_details?: string | null;
  faq_content?: FAQItem[];
  testimonials?: Testimonial[];
  case_studies?: CaseStudy[];
  content_sections?: ContentSection[];
  primary_keywords?: string[];
  secondary_keywords?: string[];
  content_score?: number;
  variant_name?: string | null;
  conversion_goal?: string | null;
}

// Keyword Input Component
function KeywordInput({
  keywords,
  onAdd,
  onRemove,
  placeholder,
}: {
  keywords: string[];
  onAdd: (keyword: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
}) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue.trim());
      setInputValue("");
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
        />
        <Button type="button" variant="secondary" size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {keywords.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-3 py-1 text-xs font-medium text-gold-800"
            >
              {keyword}
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="text-gold-600 hover:text-gold-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SeoLandingPageEdit({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [pageId, setPageId] = useState<string | null>(null);
  const [page, setPage] = useState<SeoLandingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    meta_title: "",
    meta_description: "",
    canonical_url: "",
    hero_headline: "",
    hero_subheadline: "",
    intro_content: "",
    benefits: [] as string[],
    form_heading: "",
    cta_text: "",
    is_active: true,
    // Rich content fields
    about_position: "",
    location_info: "",
    service_description: "",
    process_details: "",
    faq_content: [] as FAQItem[],
    testimonials: [] as Testimonial[],
    case_studies: [] as CaseStudy[],
    content_sections: [] as ContentSection[],
    primary_keywords: [] as string[],
    secondary_keywords: [] as string[],
    content_score: 0,
    variant_name: "",
    conversion_goal: "",
  });

  useEffect(() => {
    params.then((p) => {
      setPageId(p.id);
      fetchPage(p.id);
    });
  }, [params]);

  const fetchPage = async (id: string) => {
    try {
      const response = await fetch(`/api/seo-pages/${id}`);
      const data = await response.json();
      setPage(data);
      setFormData({
        meta_title: data.meta_title || "",
        meta_description: data.meta_description || "",
        canonical_url: data.canonical_url || "",
        hero_headline: data.hero_headline || "",
        hero_subheadline: data.hero_subheadline || "",
        intro_content: data.intro_content || "",
        benefits: data.benefits || [],
        form_heading: data.form_heading || "",
        cta_text: data.cta_text || "",
        is_active: data.is_active !== false,
        // Rich content fields
        about_position: data.about_position || "",
        location_info: data.location_info || "",
        service_description: data.service_description || "",
        process_details: data.process_details || "",
        faq_content: data.faq_content || [],
        testimonials: data.testimonials || [],
        case_studies: data.case_studies || [],
        content_sections: data.content_sections || [],
        primary_keywords: data.primary_keywords || [],
        secondary_keywords: data.secondary_keywords || [],
        content_score: data.content_score || 0,
        variant_name: data.variant_name || "",
        conversion_goal: data.conversion_goal || "",
      });
    } catch (error) {
      console.error("Failed to fetch page:", error);
      setError("Failed to load page");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!pageId) return;

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/seo-pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save");

      const updated = await response.json();
      setPage(updated);
      setSuccess("Page saved successfully!");
      setTimeout(() => setSuccess(null), 5000);
    } catch (error) {
      console.error("Save error:", error);
      setError("Failed to save page. Please try again.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const addBenefit = () => {
    setFormData({
      ...formData,
      benefits: [...formData.benefits, ""],
    });
  };

  const updateBenefit = (index: number, value: string) => {
    const newBenefits = [...formData.benefits];
    newBenefits[index] = value;
    setFormData({ ...formData, benefits: newBenefits });
  };

  const removeBenefit = (index: number) => {
    const newBenefits = formData.benefits.filter((_, i) => i !== index);
    setFormData({ ...formData, benefits: newBenefits });
  };

  // FAQ Management
  const addFAQ = () => {
    setFormData({
      ...formData,
      faq_content: [...formData.faq_content, { question: "", answer: "" }],
    });
  };

  const updateFAQ = (index: number, field: keyof FAQItem, value: string) => {
    const newFAQs = [...formData.faq_content];
    newFAQs[index] = { ...newFAQs[index], [field]: value };
    setFormData({ ...formData, faq_content: newFAQs });
  };

  const removeFAQ = (index: number) => {
    setFormData({
      ...formData,
      faq_content: formData.faq_content.filter((_, i) => i !== index),
    });
  };

  // Testimonial Management
  const addTestimonial = () => {
    setFormData({
      ...formData,
      testimonials: [
        ...formData.testimonials,
        { name: "", quote: "", rating: 5 },
      ],
    });
  };

  const updateTestimonial = (
    index: number,
    field: keyof Testimonial,
    value: string | number
  ) => {
    const newTestimonials = [...formData.testimonials];
    newTestimonials[index] = { ...newTestimonials[index], [field]: value };
    setFormData({ ...formData, testimonials: newTestimonials });
  };

  const removeTestimonial = (index: number) => {
    setFormData({
      ...formData,
      testimonials: formData.testimonials.filter((_, i) => i !== index),
    });
  };

  // Case Study Management
  const addCaseStudy = () => {
    setFormData({
      ...formData,
      case_studies: [
        ...formData.case_studies,
        { title: "", challenge: "", solution: "", result: "" },
      ],
    });
  };

  const updateCaseStudy = (
    index: number,
    field: keyof CaseStudy,
    value: string
  ) => {
    const newCaseStudies = [...formData.case_studies];
    newCaseStudies[index] = { ...newCaseStudies[index], [field]: value };
    setFormData({ ...formData, case_studies: newCaseStudies });
  };

  const removeCaseStudy = (index: number) => {
    setFormData({
      ...formData,
      case_studies: formData.case_studies.filter((_, i) => i !== index),
    });
  };

  // Content Section Management
  const addContentSection = () => {
    setFormData({
      ...formData,
      content_sections: [
        ...formData.content_sections,
        {
          heading: "",
          content: "",
          type: "text",
          order: formData.content_sections.length,
        },
      ],
    });
  };

  const updateContentSection = (
    index: number,
    field: keyof ContentSection,
    value: string | number
  ) => {
    const newSections = [...formData.content_sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setFormData({ ...formData, content_sections: newSections });
  };

  const removeContentSection = (index: number) => {
    setFormData({
      ...formData,
      content_sections: formData.content_sections.filter((_, i) => i !== index),
    });
  };

  // Keyword Management
  const addPrimaryKeyword = (keyword: string) => {
    if (keyword.trim() && !formData.primary_keywords.includes(keyword.trim())) {
      setFormData({
        ...formData,
        primary_keywords: [...formData.primary_keywords, keyword.trim()],
      });
    }
  };

  const removePrimaryKeyword = (index: number) => {
    setFormData({
      ...formData,
      primary_keywords: formData.primary_keywords.filter((_, i) => i !== index),
    });
  };

  const addSecondaryKeyword = (keyword: string) => {
    if (
      keyword.trim() &&
      !formData.secondary_keywords.includes(keyword.trim())
    ) {
      setFormData({
        ...formData,
        secondary_keywords: [...formData.secondary_keywords, keyword.trim()],
      });
    }
  };

  const removeSecondaryKeyword = (index: number) => {
    setFormData({
      ...formData,
      secondary_keywords: formData.secondary_keywords.filter(
        (_, i) => i !== index
      ),
    });
  };

  // AI Content Generation
  const handleGenerateContent = async () => {
    if (!pageId) return;

    setGenerating(true);
    setError(null);
    try {
      const response = await fetch(`/api/seo-pages/${pageId}/generate-content`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details || data.error || 'Failed to generate content';
        const stack = data.stack ? `\n\nStack: ${data.stack}` : '';
        throw new Error(errorMsg + stack);
      }

      if (!data.content) {
        throw new Error('No content returned from API');
      }
      
      // Update form data with generated content
      setFormData({
        ...formData,
        about_position: data.content.about_position || formData.about_position,
        location_info: data.content.location_info || formData.location_info,
        service_description: data.content.service_description || formData.service_description,
        process_details: data.content.process_details || formData.process_details,
        faq_content: data.content.faq_content || formData.faq_content,
        primary_keywords: data.content.primary_keywords || formData.primary_keywords,
        secondary_keywords: data.content.secondary_keywords || formData.secondary_keywords,
      });

      setSuccess('Content generated successfully! Review and save when ready.');
      setTimeout(() => setSuccess(null), 10000);
    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate content. Please try again.';
      setError(errorMessage);
      setTimeout(() => setError(null), 10000);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold-600" />
          <p className="mt-4 text-gray-600">Loading page...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Globe className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-navy-900">Page not found</h3>
          <p className="mt-2 text-gray-600">The landing page you're looking for doesn't exist.</p>
          <Link href="/dashboard/seo-pages/landing-pages" className="mt-4 inline-block">
            <Button variant="secondary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Landing Pages
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const pageTitle = `${page.position} in ${[page.city, page.state, page.country].filter(Boolean).join(", ")}`;

  return (
    <ContentLayout
      title={`Edit: ${pageTitle}`}
      description="Edit landing page content and SEO settings"
      actions={
        <>
            <Button
              variant="secondary"
              onClick={handleGenerateContent}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Content with AI
                </>
              )}
            </Button>
            <Link href={`/${page.original_url_path}`} target="_blank">
              <Button variant="secondary">
                <Eye className="mr-2 h-4 w-4" />
                View Live
              </Button>
            </Link>
            <Link href={`/dashboard/seo-pages/landing-pages/${page.id}/inquiries`}>
              <Button variant="secondary">
                <FileText className="mr-2 h-4 w-4" />
                Inquiries ({page.inquiry_count || 0})
              </Button>
            </Link>
        </>
      }
    >
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

      {/* Breadcrumbs */}
      <DashboardBreadcrumbs items={getLandingPageBreadcrumbs(pageTitle)} />

      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* SEO Metadata */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-100">
                  <Globe className="h-4 w-4 text-gold-600" />
                </div>
                <h2 className="text-lg font-semibold text-navy-900">SEO Metadata</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900">Meta Title</label>
                  <p className="mb-2 text-xs text-gray-500">Appears in search results (60 chars)</p>
                  <input
                    type="text"
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                    maxLength={60}
                  />
                  <p className="mt-1 text-xs text-gray-500">{formData.meta_title.length}/60</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900">Meta Description</label>
                  <p className="mb-2 text-xs text-gray-500">Search result snippet (160 chars)</p>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                    maxLength={160}
                  />
                  <p className="mt-1 text-xs text-gray-500">{formData.meta_description.length}/160</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900">Canonical URL</label>
                  <p className="mb-2 text-xs text-gray-500">Optional canonical URL</p>
                  <input
                    type="text"
                    value={formData.canonical_url}
                    onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                    placeholder="https://example.com/page"
                  />
                </div>
              </div>
            </div>

            {/* Hero Section */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-navy-900">Hero Section</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900">Headline</label>
                  <input
                    type="text"
                    value={formData.hero_headline}
                    onChange={(e) => setFormData({ ...formData, hero_headline: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-lg font-semibold focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900">Subheadline</label>
                  <input
                    type="text"
                    value={formData.hero_subheadline}
                    onChange={(e) => setFormData({ ...formData, hero_subheadline: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900">Intro Content</label>
                  <textarea
                    value={formData.intro_content}
                    onChange={(e) => setFormData({ ...formData, intro_content: e.target.value })}
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-navy-900">Benefits</h2>
                <Button variant="secondary" size="sm" onClick={addBenefit}>
                  Add Benefit
                </Button>
              </div>
              <div className="space-y-2">
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={benefit}
                      onChange={(e) => updateBenefit(index, e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                      placeholder="Enter a benefit..."
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBenefit(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {formData.benefits.length === 0 && (
                  <p className="text-sm text-gray-500">No benefits added yet. Click "Add Benefit" to add one.</p>
                )}
              </div>
            </div>

            {/* Form Section */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-navy-900">Lead Form</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900">Form Heading</label>
                  <input
                    type="text"
                    value={formData.form_heading}
                    onChange={(e) => setFormData({ ...formData, form_heading: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900">CTA Button Text</label>
                  <input
                    type="text"
                    value={formData.cta_text}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
              </div>
            </div>

            {/* About Position Section */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Briefcase className="h-5 w-5 text-gold-600" />
                <h2 className="text-lg font-semibold text-navy-900">About Position</h2>
              </div>
              <p className="mb-4 text-xs text-gray-500">
                Detailed description of the position/service (300-500 words recommended for SEO)
              </p>
              <RichTextEditor
                content={formData.about_position}
                onChange={(content) =>
                  setFormData({ ...formData, about_position: content })
                }
                placeholder="Describe the position, responsibilities, qualifications, and value proposition..."
                minHeight="300px"
              />
            </div>

            {/* Location Information Section */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Globe className="h-5 w-5 text-gold-600" />
                <h2 className="text-lg font-semibold text-navy-900">Location Information</h2>
              </div>
              <p className="mb-4 text-xs text-gray-500">
                Location-specific information, market insights, salary ranges, demand (200-300 words)
              </p>
              <RichTextEditor
                content={formData.location_info}
                onChange={(content) =>
                  setFormData({ ...formData, location_info: content })
                }
                placeholder="Provide location-specific insights, market information, salary ranges, and demand..."
                minHeight="250px"
              />
            </div>

            {/* Service Description Section */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                <FileTextIcon className="h-5 w-5 text-gold-600" />
                <h2 className="text-lg font-semibold text-navy-900">Service Description</h2>
              </div>
              <p className="mb-4 text-xs text-gray-500">
                Detailed service offering, what's included, pricing model, guarantees (200-300 words)
              </p>
              <RichTextEditor
                content={formData.service_description}
                onChange={(content) =>
                  setFormData({ ...formData, service_description: content })
                }
                placeholder="Describe your service offering, what's included, pricing model, and guarantees..."
                minHeight="250px"
              />
            </div>

            {/* Process Details Section */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                <FileTextIcon className="h-5 w-5 text-gold-600" />
                <h2 className="text-lg font-semibold text-navy-900">Process Details</h2>
              </div>
              <p className="mb-4 text-xs text-gray-500">
                Expanded process explanation (200-300 words)
              </p>
              <RichTextEditor
                content={formData.process_details}
                onChange={(content) =>
                  setFormData({ ...formData, process_details: content })
                }
                placeholder="Explain the hiring process in detail, step by step..."
                minHeight="250px"
              />
            </div>

            {/* FAQ Management */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-gold-600" />
                  <h2 className="text-lg font-semibold text-navy-900">FAQ Content</h2>
                </div>
                <Button variant="secondary" size="sm" onClick={addFAQ}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add FAQ
                </Button>
              </div>
              <div className="space-y-4">
                {formData.faq_content.map((faq, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">
                        FAQ #{index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFAQ(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Question
                        </label>
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) =>
                            updateFAQ(index, "question", e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                          placeholder="Enter question..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Answer
                        </label>
                        <RichTextEditor
                          content={faq.answer}
                          onChange={(content) =>
                            updateFAQ(index, "answer", content)
                          }
                          placeholder="Enter answer..."
                          minHeight="150px"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {formData.faq_content.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No FAQs added yet. Click "Add FAQ" to add one.
                  </p>
                )}
              </div>
            </div>

            {/* Testimonials Management */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-gold-600" />
                  <h2 className="text-lg font-semibold text-navy-900">Testimonials</h2>
                </div>
                <Button variant="secondary" size="sm" onClick={addTestimonial}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Testimonial
                </Button>
              </div>
              <div className="space-y-4">
                {formData.testimonials.map((testimonial, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">
                        Testimonial #{index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTestimonial(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={testimonial.name}
                          onChange={(e) =>
                            updateTestimonial(index, "name", e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Role
                        </label>
                        <input
                          type="text"
                          value={testimonial.role || ""}
                          onChange={(e) =>
                            updateTestimonial(index, "role", e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Company
                        </label>
                        <input
                          type="text"
                          value={testimonial.company || ""}
                          onChange={(e) =>
                            updateTestimonial(index, "company", e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Rating (1-5)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={testimonial.rating || 5}
                          onChange={(e) =>
                            updateTestimonial(
                              index,
                              "rating",
                              parseInt(e.target.value) || 5
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Quote *
                        </label>
                        <RichTextEditor
                          content={testimonial.quote}
                          onChange={(content) =>
                            updateTestimonial(index, "quote", content)
                          }
                          placeholder="Enter testimonial quote..."
                          minHeight="120px"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Photo URL (optional)
                        </label>
                        <input
                          type="url"
                          value={testimonial.photo_url || ""}
                          onChange={(e) =>
                            updateTestimonial(index, "photo_url", e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {formData.testimonials.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No testimonials added yet. Click "Add Testimonial" to add one.
                  </p>
                )}
              </div>
            </div>

            {/* Case Studies Management */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-gold-600" />
                  <h2 className="text-lg font-semibold text-navy-900">Case Studies</h2>
                </div>
                <Button variant="secondary" size="sm" onClick={addCaseStudy}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Case Study
                </Button>
              </div>
              <div className="space-y-4">
                {formData.case_studies.map((caseStudy, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">
                        Case Study #{index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCaseStudy(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={caseStudy.title}
                          onChange={(e) =>
                            updateCaseStudy(index, "title", e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Challenge *
                        </label>
                        <textarea
                          value={caseStudy.challenge}
                          onChange={(e) =>
                            updateCaseStudy(index, "challenge", e.target.value)
                          }
                          rows={2}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Solution *
                        </label>
                        <textarea
                          value={caseStudy.solution}
                          onChange={(e) =>
                            updateCaseStudy(index, "solution", e.target.value)
                          }
                          rows={2}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Result *
                        </label>
                        <textarea
                          value={caseStudy.result}
                          onChange={(e) =>
                            updateCaseStudy(index, "result", e.target.value)
                          }
                          rows={2}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Metrics (optional)
                        </label>
                        <input
                          type="text"
                          value={caseStudy.metrics || ""}
                          onChange={(e) =>
                            updateCaseStudy(index, "metrics", e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                          placeholder="e.g., 50% reduction in time-to-hire"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {formData.case_studies.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No case studies added yet. Click "Add Case Study" to add one.
                  </p>
                )}
              </div>
            </div>

            {/* SEO Keywords */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Sparkles className="h-5 w-5 text-gold-600" />
                <h2 className="text-lg font-semibold text-navy-900">SEO Keywords</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Primary Keywords
                  </label>
                  <KeywordInput
                    keywords={formData.primary_keywords}
                    onAdd={(keyword) => addPrimaryKeyword(keyword)}
                    onRemove={removePrimaryKeyword}
                    placeholder="Add primary keyword..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Secondary Keywords
                  </label>
                  <KeywordInput
                    keywords={formData.secondary_keywords}
                    onAdd={(keyword) => addSecondaryKeyword(keyword)}
                    onRemove={removeSecondaryKeyword}
                    placeholder="Add secondary keyword..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Page Info */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Page Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Position:</span>
                  <span className="font-medium text-navy-900">{page.position}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium text-navy-900">
                    {[page.city, page.state, page.country].filter(Boolean).join(", ")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">URL Path:</span>
                  <span className="font-mono text-xs text-navy-900">/{page.original_url_path}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Inquiries:</span>
                  <Link
                    href={`/dashboard/seo-pages/landing-pages/${page.id}/inquiries`}
                    className="font-medium text-gold-600 hover:text-gold-700"
                  >
                    {page.inquiry_count || 0}
                  </Link>
                </div>
              </div>
            </div>

            {/* Content Score */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Content Score</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">SEO Quality:</span>
                  <span className="text-lg font-bold text-gold-600">
                    {formData.content_score}/100
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-gold-500 transition-all"
                    style={{ width: `${formData.content_score}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Based on word count, keyword usage, heading structure, and internal links
                </p>
              </div>
            </div>

            {/* Status & Actions */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Status & Actions</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Active Status</label>
                  <select
                    value={formData.is_active ? "true" : "false"}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Variant Name (A/B Testing)
                  </label>
                  <input
                    type="text"
                    value={formData.variant_name}
                    onChange={(e) =>
                      setFormData({ ...formData, variant_name: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                    placeholder="e.g., variant-a"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Conversion Goal
                  </label>
                  <input
                    type="text"
                    value={formData.conversion_goal}
                    onChange={(e) =>
                      setFormData({ ...formData, conversion_goal: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                    placeholder="e.g., form_submission"
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
    </ContentLayout>
  );
}
