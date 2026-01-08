"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import Link from "next/link";

export default function ImportPagePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [showManualFields, setShowManualFields] = useState(false);
  const [generateAiContent, setGenerateAiContent] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [manualFields, setManualFields] = useState({
    position: "",
    position_slug: "",
    country: "",
    country_slug: "",
    state: "",
    state_slug: "",
    city: "",
    city_slug: "",
    original_url_path: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importedPage, setImportedPage] = useState<any>(null);

  const handleImport = async () => {
    if (!url.trim() && !(manualFields.position && manualFields.country)) {
      setError("Please enter a URL or fill in position and country manually");
      setTimeout(() => setError(null), 5000);
      return;
    }

    setLoading(true);
    setGenerating(generateAiContent);
    setError(null);
    setSuccess(null);
    setImportedPage(null);

    try {
      const requestBody: any = {
        generate_ai_content: generateAiContent,
      };
      
      if (url.trim()) {
        requestBody.url = url.trim();
      }
      
      // Add manual fields if provided
      if (manualFields.position) requestBody.position = manualFields.position;
      if (manualFields.position_slug) requestBody.position_slug = manualFields.position_slug;
      if (manualFields.country) requestBody.country = manualFields.country;
      if (manualFields.country_slug) requestBody.country_slug = manualFields.country_slug;
      if (manualFields.state) requestBody.state = manualFields.state;
      if (manualFields.state_slug) requestBody.state_slug = manualFields.state_slug;
      if (manualFields.city) requestBody.city = manualFields.city;
      if (manualFields.city_slug) requestBody.city_slug = manualFields.city_slug;
      if (manualFields.original_url_path) requestBody.original_url_path = manualFields.original_url_path;

      const response = await fetch("/api/seo-pages/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || "Failed to import page";
        const details = data.details ? `\n\nDetails: ${data.details}` : "";
        throw new Error(errorMsg + details);
      }

      setImportedPage(data.page);
      setSuccess(
        data.ai_generated
          ? `Page imported and AI content generated successfully!`
          : `Page imported successfully!`
      );
      setUrl("");
    } catch (error) {
      console.error("Import error:", error);
      setError(error instanceof Error ? error.message : "Failed to import page. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/seo-pages/landing-pages">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-serif font-semibold text-navy-800">Import Landing Page</h1>
          <p className="mt-1 text-gray-600">Import a single WordPress landing page by URL</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 p-4">
          <AlertCircle className="h-5 w-5 text-error-600" />
          <p className="text-sm font-medium text-error-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-error-600 hover:text-error-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-success-200 bg-success-50 p-4">
          <CheckCircle2 className="h-5 w-5 text-success-600" />
          <p className="text-sm font-medium text-success-800">{success}</p>
          <button
            onClick={() => setSuccess(null)}
            className="ml-auto text-success-600 hover:text-success-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Import Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-100">
            <Upload className="h-5 w-5 text-gold-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-navy-900">Import from URL</h2>
            <p className="text-sm text-gray-600">Enter the full WordPress URL to import</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              WordPress URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.lighthouse-careers.com/hire-a-butler-australia/new-south-wale/sydney-2/"
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
              disabled={loading}
            />
            <p className="mt-2 text-xs text-gray-500">
              Supported formats: hire-a-[position]-[country]/[state]/[city], [position]-[country]/[state]/[city], or [position]/[location]
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="generateAi"
                checked={generateAiContent}
                onChange={(e) => setGenerateAiContent(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-gold-600 focus:ring-gold-500"
                disabled={loading}
              />
              <label htmlFor="generateAi" className="text-sm text-gray-700">
                Generate SEO-optimized content with AI
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showManual"
                checked={showManualFields}
                onChange={(e) => setShowManualFields(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-gold-600 focus:ring-gold-500"
                disabled={loading}
              />
              <label htmlFor="showManual" className="text-sm text-gray-700">
                Manually specify page details (override URL parsing)
              </label>
            </div>
          </div>

          {/* Manual Fields */}
          {showManualFields && (
            <div className="mt-4 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900">Manual Page Details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Position *
                  </label>
                  <input
                    type="text"
                    value={manualFields.position}
                    onChange={(e) => {
                      setManualFields({
                        ...manualFields,
                        position: e.target.value,
                        position_slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                      });
                    }}
                    placeholder="Butler"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Position Slug
                  </label>
                  <input
                    type="text"
                    value={manualFields.position_slug}
                    onChange={(e) => setManualFields({ ...manualFields, position_slug: e.target.value })}
                    placeholder="butler"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    value={manualFields.country}
                    onChange={(e) => {
                      setManualFields({
                        ...manualFields,
                        country: e.target.value,
                        country_slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                      });
                    }}
                    placeholder="Australia"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Country Slug
                  </label>
                  <input
                    type="text"
                    value={manualFields.country_slug}
                    onChange={(e) => setManualFields({ ...manualFields, country_slug: e.target.value })}
                    placeholder="australia"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={manualFields.state}
                    onChange={(e) => {
                      setManualFields({
                        ...manualFields,
                        state: e.target.value,
                        state_slug: e.target.value ? e.target.value.toLowerCase().replace(/\s+/g, '-') : '',
                      });
                    }}
                    placeholder="New South Wales"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    State Slug
                  </label>
                  <input
                    type="text"
                    value={manualFields.state_slug}
                    onChange={(e) => setManualFields({ ...manualFields, state_slug: e.target.value })}
                    placeholder="new-south-wales"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={manualFields.city}
                    onChange={(e) => {
                      setManualFields({
                        ...manualFields,
                        city: e.target.value,
                        city_slug: e.target.value ? e.target.value.toLowerCase().replace(/\s+/g, '-') : '',
                      });
                    }}
                    placeholder="Sydney"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    City Slug
                  </label>
                  <input
                    type="text"
                    value={manualFields.city_slug}
                    onChange={(e) => setManualFields({ ...manualFields, city_slug: e.target.value })}
                    placeholder="sydney"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Original URL Path (optional - auto-generated if not provided)
                  </label>
                  <input
                    type="text"
                    value={manualFields.original_url_path}
                    onChange={(e) => setManualFields({ ...manualFields, original_url_path: e.target.value })}
                    placeholder="hire-a-butler-australia/new-south-wale/sydney-2"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={loading || (!url.trim() && !(manualFields.position && manualFields.country))}
            variant="primary"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {generating ? "Importing & Generating Content..." : "Importing..."}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import Page
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Imported Page Details */}
      {importedPage && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-navy-900">Imported Page Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex">
              <span className="font-semibold text-gray-700 w-32">Position:</span>
              <span className="text-gray-900">{importedPage.position}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-32">Location:</span>
              <span className="text-gray-900">
                {[importedPage.city, importedPage.state, importedPage.country]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-32">URL Path:</span>
              <span className="text-gray-900 font-mono text-xs">{importedPage.original_url_path}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-32">Headline:</span>
              <span className="text-gray-900">{importedPage.hero_headline}</span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link href={`/dashboard/seo-pages/landing-pages/${importedPage.id}`}>
                <Button variant="secondary" size="sm">
                  Edit Page
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
