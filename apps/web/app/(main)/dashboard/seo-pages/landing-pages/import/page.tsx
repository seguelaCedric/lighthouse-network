"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Loader2, CheckCircle2, AlertCircle, X, FileSpreadsheet, Trash2, Download } from "lucide-react";
import Link from "next/link";

interface BulkItem {
  url: string;
  position: string;
  country: string;
  state: string;
  city: string;
}

interface ImportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_items: number;
  processed_items: number;
  created_pages: number;
  failed_items: number;
  generate_ai_content: boolean;
  ai_generated_count: number;
  ai_pending_count: number;
  errors?: Array<{ index: number; error: string }>;
  progress: number;
}

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

  // Bulk import state
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkGenerateAi, setBulkGenerateAi] = useState(false);
  const [activeJob, setActiveJob] = useState<ImportJob | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        setError("CSV file must have a header row and at least one data row");
        setTimeout(() => setError(null), 5000);
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const parsedItems: BulkItem[] = [];

      for (let i = 1; i < lines.length; i++) {
        // Handle quoted CSV values
        const values: string[] = [];
        let current = "";
        let inQuotes = false;

        for (const char of lines[i]) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        const item: Partial<BulkItem> = {
          url: "",
          position: "",
          country: "",
          state: "",
          city: "",
        };

        headers.forEach((header, idx) => {
          const value = values[idx] || "";
          if (header === "url") item.url = value;
          if (header === "position") item.position = value;
          if (header === "country") item.country = value;
          if (header === "state") item.state = value;
          if (header === "city") item.city = value;
        });

        // Only add items that have either URL or position+country
        if (item.url || (item.position && item.country)) {
          parsedItems.push(item as BulkItem);
        }
      }

      if (parsedItems.length === 0) {
        setError("No valid rows found. Each row needs either a URL or position + country");
        setTimeout(() => setError(null), 5000);
        return;
      }

      setBulkItems([...bulkItems, ...parsedItems]);
      setSuccess(`Added ${parsedItems.length} items from CSV`);
      setTimeout(() => setSuccess(null), 3000);
    };
    reader.readAsText(file);

    // Reset the input so the same file can be uploaded again
    event.target.value = "";
  };

  const updateBulkItem = (index: number, field: keyof BulkItem, value: string) => {
    const newItems = [...bulkItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setBulkItems(newItems);
  };

  const removeBulkItem = (index: number) => {
    setBulkItems(bulkItems.filter((_, i) => i !== index));
  };

  const clearBulkItems = () => {
    setBulkItems([]);
    setActiveJob(null);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const downloadTemplate = () => {
    const template = "url,position,country,state,city\nhttps://www.lighthouse-careers.com/hire-a-butler-australia/new-south-wales/sydney-2/,,,,\n,Butler,France,Provence,Nice";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "landing-pages-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Poll job status
  const pollJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`/api/seo-pages/bulk-import/${jobId}`);
      if (!response.ok) return;

      const job: ImportJob = await response.json();
      setActiveJob(job);

      // Stop polling when job is complete
      if (job.status === 'completed' || job.status === 'failed') {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        setBulkLoading(false);

        if (job.status === 'completed') {
          setSuccess(`Successfully imported ${job.created_pages} landing page${job.created_pages !== 1 ? "s" : ""}!${job.generate_ai_content ? ' AI content generation is running in the background.' : ''}`);
          setBulkItems([]);
        } else {
          setError('Import job failed');
        }
      }
    } catch (err) {
      console.error('Failed to poll job status:', err);
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const handleBulkImport = async () => {
    if (bulkItems.length === 0) {
      setError("Please add at least one item to import");
      setTimeout(() => setError(null), 5000);
      return;
    }

    setBulkLoading(true);
    setError(null);
    setActiveJob(null);

    try {
      const response = await fetch("/api/seo-pages/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: bulkItems,
          generate_ai_content: bulkGenerateAi,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start bulk import");
      }

      // Start polling for job status
      const jobId = data.job_id;
      setActiveJob({
        id: jobId,
        status: 'pending',
        total_items: data.total_items,
        processed_items: 0,
        created_pages: 0,
        failed_items: 0,
        generate_ai_content: bulkGenerateAi,
        ai_generated_count: 0,
        ai_pending_count: 0,
        progress: 0,
      });

      // Poll every 2 seconds
      pollingRef.current = setInterval(() => pollJobStatus(jobId), 2000);
      // Also poll immediately
      pollJobStatus(jobId);
    } catch (error) {
      console.error("Bulk import error:", error);
      setError(error instanceof Error ? error.message : "Failed to start bulk import");
      setBulkLoading(false);
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

      {/* Bulk Import Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-100">
            <FileSpreadsheet className="h-5 w-5 text-gold-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-navy-900">Bulk Import from CSV</h2>
            <p className="text-sm text-gray-600">Import multiple landing pages at once</p>
          </div>
          <Button variant="ghost" size="sm" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Template
          </Button>
        </div>

        <div className="space-y-4">
          {/* CSV Upload */}
          <div>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-gold-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gold-700 hover:file:bg-gold-200"
              disabled={bulkLoading}
            />
            <p className="mt-2 text-xs text-gray-500">
              CSV columns: url, position, country, state, city. Each row needs either a URL or position + country.
            </p>
          </div>

          {/* AI Generation Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="bulkGenerateAi"
              checked={bulkGenerateAi}
              onChange={(e) => setBulkGenerateAi(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-gold-600 focus:ring-gold-500"
              disabled={bulkLoading}
            />
            <label htmlFor="bulkGenerateAi" className="text-sm text-gray-700">
              Generate SEO-optimized content with AI (slower, processes sequentially)
            </label>
          </div>

          {/* Preview Table */}
          {bulkItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">
                  {bulkItems.length} item{bulkItems.length !== 1 ? "s" : ""} to import
                </span>
                <Button variant="ghost" size="sm" onClick={clearBulkItems}>
                  Clear All
                </Button>
              </div>
              <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">URL / Position</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Country</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">State</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">City</th>
                      <th className="px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {bulkItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          {item.url ? (
                            <span className="text-xs font-mono text-gray-600 truncate block max-w-xs" title={item.url}>
                              {item.url.replace(/^https?:\/\/[^/]+\//, "/")}
                            </span>
                          ) : (
                            <input
                              type="text"
                              value={item.position}
                              onChange={(e) => updateBulkItem(index, "position", e.target.value)}
                              className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-gold-500 focus:outline-none"
                              placeholder="Position"
                            />
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.country}
                            onChange={(e) => updateBulkItem(index, "country", e.target.value)}
                            className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-gold-500 focus:outline-none"
                            placeholder="Country"
                            disabled={!!item.url}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.state}
                            onChange={(e) => updateBulkItem(index, "state", e.target.value)}
                            className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-gold-500 focus:outline-none"
                            placeholder="State"
                            disabled={!!item.url}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.city}
                            onChange={(e) => updateBulkItem(index, "city", e.target.value)}
                            className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-gold-500 focus:outline-none"
                            placeholder="City"
                            disabled={!!item.url}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => removeBulkItem(index)}
                            className="text-gray-400 hover:text-error-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button
                onClick={handleBulkImport}
                disabled={bulkLoading || bulkItems.length === 0}
                variant="primary"
                className="w-full"
              >
                {bulkLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing {bulkItems.length} page{bulkItems.length !== 1 ? "s" : ""}...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import {bulkItems.length} Page{bulkItems.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Job Progress */}
          {activeJob && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  {activeJob.status === 'completed' ? 'Import Complete' :
                   activeJob.status === 'failed' ? 'Import Failed' :
                   'Importing...'}
                </h3>
                <span className="text-xs text-gray-500">
                  {activeJob.processed_items} / {activeJob.total_items} items
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeJob.status === 'completed' ? 'bg-success-500' :
                    activeJob.status === 'failed' ? 'bg-error-500' :
                    'bg-gold-500'
                  }`}
                  style={{ width: `${activeJob.progress}%` }}
                />
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-sm">
                <span className="text-success-600">
                  <CheckCircle2 className="inline h-4 w-4 mr-1" />
                  {activeJob.created_pages} created
                </span>
                {activeJob.failed_items > 0 && (
                  <span className="text-error-600">
                    <AlertCircle className="inline h-4 w-4 mr-1" />
                    {activeJob.failed_items} failed
                  </span>
                )}
              </div>

              {/* AI Generation Status */}
              {activeJob.generate_ai_content && activeJob.status === 'completed' && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin text-gold-500" />
                    <span>
                      AI content generation running in background
                      {activeJob.ai_pending_count > 0 && ` (${activeJob.ai_pending_count} pending)`}
                    </span>
                  </div>
                </div>
              )}

              {/* Errors */}
              {activeJob.errors && activeJob.errors.length > 0 && (
                <div className="mt-2 text-xs text-error-600">
                  {activeJob.errors.slice(0, 5).map((err, i) => (
                    <div key={i}>Row {err.index + 1}: {err.error}</div>
                  ))}
                  {activeJob.errors.length > 5 && (
                    <div>...and {activeJob.errors.length - 5} more errors</div>
                  )}
                </div>
              )}

              {/* View imported pages link */}
              {activeJob.status === 'completed' && activeJob.created_pages > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <Link href="/dashboard/seo-pages/landing-pages">
                    <Button variant="secondary" size="sm">
                      View Imported Pages
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
