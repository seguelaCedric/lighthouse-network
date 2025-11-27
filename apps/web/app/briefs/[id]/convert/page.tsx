"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Loader2,
  Ship,
  MapPin,
  Calendar,
  DollarSign,
  User,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  Building2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  Brief,
  BriefParsedData,
  PositionCategory,
  ContractType,
} from "../../../../../../../packages/database/types";

// Position category options
const positionCategories: { value: PositionCategory; label: string }[] = [
  { value: "captain", label: "Captain" },
  { value: "deck", label: "Deck" },
  { value: "engineering", label: "Engineering" },
  { value: "interior", label: "Interior" },
  { value: "galley", label: "Galley" },
  { value: "other", label: "Other" },
];

// Contract type options
const contractTypes: { value: ContractType; label: string }[] = [
  { value: "permanent", label: "Permanent" },
  { value: "rotational", label: "Rotational" },
  { value: "seasonal", label: "Seasonal" },
  { value: "temporary", label: "Temporary" },
];

// Currency options
const currencies = [
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
];

interface Client {
  id: string;
  name: string;
  vessel_name?: string;
}

interface FormData {
  title: string;
  position_category: PositionCategory;
  vessel_name: string;
  vessel_type: string;
  vessel_size_meters: string;
  contract_type: ContractType | "";
  start_date: string;
  rotation_schedule: string;
  primary_region: string;
  itinerary: string;
  salary_min: string;
  salary_max: string;
  salary_currency: string;
  requirements_text: string;
  certifications: string[];
  languages: string[];
  experience_years_min: string;
  client_id: string;
  status: "draft" | "open";
  visibility: "private" | "network" | "public";
}

export default function BriefConvertPage() {
  const params = useParams();
  const router = useRouter();
  const briefId = params.id as string;

  // State
  const [brief, setBrief] = React.useState<Brief | null>(null);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [step, setStep] = React.useState<1 | 2>(1); // Step 1: Edit, Step 2: Review

  // Form data
  const [formData, setFormData] = React.useState<FormData>({
    title: "",
    position_category: "other",
    vessel_name: "",
    vessel_type: "",
    vessel_size_meters: "",
    contract_type: "",
    start_date: "",
    rotation_schedule: "",
    primary_region: "",
    itinerary: "",
    salary_min: "",
    salary_max: "",
    salary_currency: "EUR",
    requirements_text: "",
    certifications: [],
    languages: [],
    experience_years_min: "",
    client_id: "",
    status: "draft",
    visibility: "private",
  });

  // Fetch brief and clients
  React.useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch brief and clients in parallel
        const [briefRes, clientsRes] = await Promise.all([
          fetch(`/api/briefs/${briefId}`),
          fetch("/api/clients?limit=100"),
        ]);

        if (!briefRes.ok) {
          throw new Error("Failed to fetch brief");
        }

        const briefData = await briefRes.json();
        const brief = briefData.data as Brief;

        if (brief.status === "converted") {
          throw new Error("This brief has already been converted to a job");
        }

        if (!brief.parsed_data) {
          throw new Error("Brief must be parsed before conversion");
        }

        setBrief(brief);

        // Set clients if fetched successfully
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          setClients(clientsData.data || []);
        }

        // Pre-fill form from parsed data
        const parsed = brief.parsed_data as BriefParsedData;
        const categoryMap: Record<string, PositionCategory> = {
          deck: "deck",
          interior: "interior",
          galley: "galley",
          engineering: "engineering",
          captain: "captain",
          other: "other",
        };

        setFormData({
          title: parsed.position || "",
          position_category: categoryMap[parsed.positionCategory] || "other",
          vessel_name: parsed.vessel.name || "",
          vessel_type: parsed.vessel.type || "",
          vessel_size_meters: parsed.vessel.sizeMeters?.toString() || "",
          contract_type: (parsed.contract.type as ContractType) || "",
          start_date: parsed.contract.startDate || "",
          rotation_schedule: parsed.contract.rotation || "",
          primary_region:
            parsed.location.cruisingAreas[0] || parsed.location.base || "",
          itinerary: parsed.location.cruisingAreas.join(", "),
          salary_min: parsed.compensation.salaryMin?.toString() || "",
          salary_max: parsed.compensation.salaryMax?.toString() || "",
          salary_currency: parsed.compensation.currency || "EUR",
          requirements_text: parsed.requirements.other.join("\n"),
          certifications: parsed.requirements.certifications,
          languages: parsed.requirements.languages,
          experience_years_min:
            parsed.requirements.minExperience?.toString() || "",
          client_id: brief.client_id || "",
          status: "draft",
          visibility: "private",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    if (briefId) {
      fetchData();
    }
  }, [briefId]);

  // Handle form input change
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle certification/language tag input
  const handleTagAdd = (field: "certifications" | "languages", value: string) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], value.trim()],
      }));
    }
  };

  const handleTagRemove = (field: "certifications" | "languages", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  // Submit conversion
  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/briefs/${briefId}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title || undefined,
          client_id: formData.client_id || undefined,
          status: formData.status,
          visibility: formData.visibility,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to convert brief");
      }

      const data = await response.json();
      router.push(`/jobs/${data.data.job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert brief");
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-8 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading brief...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !brief) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="size-12 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-navy-900 mb-2">
            Cannot Convert Brief
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href={`/briefs/${briefId}`}>
            <Button variant="secondary">Back to Brief</Button>
          </Link>
        </div>
      </div>
    );
  }

  const parsedData = brief?.parsed_data as BriefParsedData | undefined;
  const currencySymbol =
    currencies.find((c) => c.value === formData.salary_currency)?.symbol || "€";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <Link
            href={`/briefs/${briefId}`}
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-navy-800 mb-4"
          >
            <ChevronLeft className="size-4" />
            Back to Brief
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-semibold text-navy-900">
                Convert to Job
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Review and edit the job details before creating
              </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                  step === 1
                    ? "bg-gold-100 text-gold-800"
                    : "bg-gray-100 text-gray-600"
                )}
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-current/20 text-xs">
                  1
                </span>
                Edit Details
              </div>
              <div className="w-8 h-px bg-gray-300" />
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                  step === 2
                    ? "bg-gold-100 text-gold-800"
                    : "bg-gray-100 text-gray-600"
                )}
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-current/20 text-xs">
                  2
                </span>
                Review & Create
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="mx-auto max-w-4xl px-6 py-4">
          <div className="rounded-lg border border-error-200 bg-error-50 p-4 flex items-center gap-3">
            <AlertTriangle className="size-5 text-error-600 shrink-0" />
            <p className="text-sm text-error-800">{error}</p>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-4xl px-6 py-8">
        {step === 1 ? (
          /* Step 1: Edit Form */
          <div className="space-y-8">
            {/* Basic Info */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
                <Briefcase className="size-5 text-gold-500" />
                Job Details
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Chief Stewardess"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position Category
                  </label>
                  <select
                    name="position_category"
                    value={formData.position_category}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  >
                    {positionCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client
                  </label>
                  <select
                    name="client_id"
                    value={formData.client_id}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  >
                    <option value="">Select a client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                        {client.vessel_name && ` (${client.vessel_name})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Vessel Info */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
                <Ship className="size-5 text-gold-500" />
                Vessel Information
              </h2>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vessel Name
                  </label>
                  <input
                    type="text"
                    name="vessel_name"
                    value={formData.vessel_name}
                    onChange={handleChange}
                    placeholder="M/Y Example"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vessel Type
                  </label>
                  <input
                    type="text"
                    name="vessel_type"
                    value={formData.vessel_type}
                    onChange={handleChange}
                    placeholder="Motor Yacht"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Size (meters)
                  </label>
                  <input
                    type="number"
                    name="vessel_size_meters"
                    value={formData.vessel_size_meters}
                    onChange={handleChange}
                    placeholder="60"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>
              </div>
            </section>

            {/* Contract & Location */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
                <Calendar className="size-5 text-gold-500" />
                Contract & Location
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contract Type
                  </label>
                  <select
                    name="contract_type"
                    value={formData.contract_type}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  >
                    <option value="">Select...</option>
                    {contractTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="text"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    placeholder="ASAP or specific date"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Region
                  </label>
                  <input
                    type="text"
                    name="primary_region"
                    value={formData.primary_region}
                    onChange={handleChange}
                    placeholder="Mediterranean"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rotation Schedule
                  </label>
                  <input
                    type="text"
                    name="rotation_schedule"
                    value={formData.rotation_schedule}
                    onChange={handleChange}
                    placeholder="2 months on / 1 month off"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Itinerary / Cruising Areas
                  </label>
                  <input
                    type="text"
                    name="itinerary"
                    value={formData.itinerary}
                    onChange={handleChange}
                    placeholder="Mediterranean, Caribbean"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>
              </div>
            </section>

            {/* Compensation */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
                <DollarSign className="size-5 text-gold-500" />
                Compensation
              </h2>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    name="salary_currency"
                    value={formData.salary_currency}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  >
                    {currencies.map((cur) => (
                      <option key={cur.value} value={cur.value}>
                        {cur.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Salary (monthly)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      name="salary_min"
                      value={formData.salary_min}
                      onChange={handleChange}
                      placeholder="4000"
                      className="w-full rounded-lg border border-gray-300 pl-8 pr-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Salary (monthly)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      name="salary_max"
                      value={formData.salary_max}
                      onChange={handleChange}
                      placeholder="5000"
                      className="w-full rounded-lg border border-gray-300 pl-8 pr-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Requirements */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
                <FileText className="size-5 text-gold-500" />
                Requirements
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Experience (years)
                  </label>
                  <input
                    type="number"
                    name="experience_years_min"
                    value={formData.experience_years_min}
                    onChange={handleChange}
                    placeholder="3"
                    className="w-32 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>

                {/* Certifications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Required Certifications
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.certifications.map((cert, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-full bg-success-100 px-3 py-1 text-sm text-success-700"
                      >
                        {cert}
                        <button
                          type="button"
                          onClick={() => handleTagRemove("certifications", i)}
                          className="ml-1 hover:text-success-900"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Type and press Enter to add..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleTagAdd("certifications", e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </div>

                {/* Languages */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Required Languages
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.languages.map((lang, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                      >
                        {lang}
                        <button
                          type="button"
                          onClick={() => handleTagRemove("languages", i)}
                          className="ml-1 hover:text-blue-900"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Type and press Enter to add..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleTagAdd("languages", e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </div>

                {/* Other requirements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Other Requirements
                  </label>
                  <textarea
                    name="requirements_text"
                    value={formData.requirements_text}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Any other requirements..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>
              </div>
            </section>

            {/* Job Settings */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
                <Building2 className="size-5 text-gold-500" />
                Job Settings
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  >
                    <option value="draft">Draft (not visible)</option>
                    <option value="open">Open (accepting candidates)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Visibility
                  </label>
                  <select
                    name="visibility"
                    value={formData.visibility}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  >
                    <option value="private">Private (only my agency)</option>
                    <option value="network">Network (partner agencies)</option>
                    <option value="public">Public (all agencies)</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <Link href={`/briefs/${briefId}`}>
                <Button variant="ghost">Cancel</Button>
              </Link>
              <Button variant="primary" onClick={() => setStep(2)}>
                Review & Create
              </Button>
            </div>
          </div>
        ) : (
          /* Step 2: Review */
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-navy-900 mb-6">
                Review Job Details
              </h2>

              {/* Summary */}
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50">
                  <Briefcase className="size-5 text-gold-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-navy-900">
                      {formData.title || "Untitled Position"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {positionCategories.find(
                        (c) => c.value === formData.position_category
                      )?.label || "Other"}{" "}
                      •{" "}
                      {contractTypes.find(
                        (c) => c.value === formData.contract_type
                      )?.label || "Not specified"}
                    </p>
                  </div>
                </div>

                {formData.vessel_name && (
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50">
                    <Ship className="size-5 text-gold-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-navy-900">
                        {formData.vessel_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formData.vessel_type}
                        {formData.vessel_size_meters &&
                          ` • ${formData.vessel_size_meters}m`}
                      </p>
                    </div>
                  </div>
                )}

                {formData.primary_region && (
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50">
                    <MapPin className="size-5 text-gold-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-navy-900">
                        {formData.primary_region}
                      </h3>
                      {formData.itinerary && (
                        <p className="text-sm text-gray-600">
                          {formData.itinerary}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {(formData.salary_min || formData.salary_max) && (
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50">
                    <DollarSign className="size-5 text-gold-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-navy-900">
                        {currencySymbol}
                        {parseInt(formData.salary_min || "0").toLocaleString()}
                        {formData.salary_max &&
                          formData.salary_max !== formData.salary_min && (
                            <>
                              {" "}
                              - {currencySymbol}
                              {parseInt(formData.salary_max).toLocaleString()}
                            </>
                          )}
                        <span className="font-normal text-gray-600">
                          {" "}
                          /month
                        </span>
                      </h3>
                    </div>
                  </div>
                )}

                {/* Requirements summary */}
                {(formData.certifications.length > 0 ||
                  formData.languages.length > 0) && (
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50">
                    <FileText className="size-5 text-gold-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-navy-900 mb-2">
                        Requirements
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {formData.certifications.map((cert, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-success-100 px-2 py-0.5 text-xs text-success-700"
                          >
                            {cert}
                          </span>
                        ))}
                        {formData.languages.map((lang, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Status & Visibility */}
                <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50">
                  <Building2 className="size-5 text-gold-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-navy-900">
                      {formData.status === "draft" ? "Draft" : "Open"} •{" "}
                      {formData.visibility === "private"
                        ? "Private"
                        : formData.visibility === "network"
                        ? "Network"
                        : "Public"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formData.status === "draft"
                        ? "Job will be saved as draft"
                        : "Job will be immediately visible"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirmation note */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> After conversion, the original brief will
                be marked as &ldquo;Converted&rdquo; and linked to this job. You
                can edit the job details at any time.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back to Edit
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={submitting}
                leftIcon={
                  submitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )
                }
              >
                {submitting ? "Creating Job..." : "Create Job"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
