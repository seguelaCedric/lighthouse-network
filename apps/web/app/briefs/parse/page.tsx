"use client";

import * as React from "react";
import {
  Mail,
  MessageCircle,
  Phone,
  FileText,
  Download,
  Send,
  AlertTriangle,
  HelpCircle,
  Check,
  ChevronLeft,
  Paperclip,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { DatePicker } from "@/components/ui/date-picker";
import { ConfidenceGauge } from "@/components/ui/confidence-gauge";
import { cn } from "@/lib/utils";

// Types
type BriefSource = "email" | "whatsapp" | "chat" | "form";

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface Ambiguity {
  id: string;
  field: string;
  message: string;
  values?: string[];
}

interface SuggestedClarification {
  id: string;
  question: string;
  selected: boolean;
}

interface ParsedBrief {
  position: string;
  vesselType: string;
  vesselSize: string;
  contractType: string;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  startDate: Date | null;
  requirements: string;
  languages: string[];
}

// Mock Data
const mockBrief = {
  id: "brief-001",
  clientName: "M/Y Serenity",
  clientEmail: "captain@myserenity.com",
  receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  source: "email" as BriefSource,
  rawContent: `Hi,

We're looking for a Chief Stewardess for our 62m motor yacht M/Y Serenity.

The position is permanent, starting ASAP or within the next 2-3 weeks if possible.

Requirements:
- Minimum 5 years experience as Chief Stew on 50m+ vessels
- STCW, ENG1, valid passport
- Fluent English, French or Spanish would be beneficial
- Strong wine knowledge
- Silver service trained
- Team management experience (4+ crew)

Salary somewhere between €5000-€6000/month depending on experience, plus benefits.

We're currently in the Med and will be doing the Caribbean season Nov-April.

Please send suitable candidates.

Best regards,
Captain James Miller
M/Y Serenity`,
  attachments: [
    { id: "1", name: "MY_Serenity_Crew_Manual.pdf", size: 2450000, type: "application/pdf", url: "#" },
    { id: "2", name: "Position_Description.docx", size: 45000, type: "application/docx", url: "#" },
  ] as Attachment[],
  confidenceScore: 72,
};

const mockAmbiguities: Ambiguity[] = [
  {
    id: "1",
    field: "salary",
    message: "Salary range detected but values may vary",
    values: ["€5,000", "€6,000"],
  },
  {
    id: "2",
    field: "startDate",
    message: "Start date ambiguous - 'ASAP' and '2-3 weeks' both mentioned",
    values: ["ASAP", "2-3 weeks"],
  },
  {
    id: "3",
    field: "languages",
    message: "Language requirements unclear - 'beneficial' suggests optional",
    values: ["French (optional?)", "Spanish (optional?)"],
  },
];

const mockClarifications: SuggestedClarification[] = [
  { id: "1", question: "What is the exact start date? Is there flexibility if a candidate needs to give notice?", selected: true },
  { id: "2", question: "Is the salary negotiable for candidates with exceptional experience?", selected: false },
  { id: "3", question: "Are French and Spanish required or just preferred?", selected: true },
  { id: "4", question: "What are the specific benefits included (flights, insurance, etc.)?", selected: false },
];

const mockParsedData: ParsedBrief = {
  position: "chief_stewardess",
  vesselType: "motor",
  vesselSize: "62",
  contractType: "permanent",
  salaryMin: "5000",
  salaryMax: "6000",
  salaryCurrency: "EUR",
  startDate: null,
  requirements: `- Minimum 5 years experience as Chief Stew on 50m+ vessels
- STCW, ENG1, valid passport
- Fluent English, French or Spanish would be beneficial
- Strong wine knowledge
- Silver service trained
- Team management experience (4+ crew)`,
  languages: ["english"],
};

// Options
const positionOptions = [
  { value: "captain", label: "Captain" },
  { value: "first_officer", label: "First Officer" },
  { value: "second_officer", label: "Second Officer" },
  { value: "chief_engineer", label: "Chief Engineer" },
  { value: "second_engineer", label: "2nd Engineer" },
  { value: "eto", label: "ETO" },
  { value: "bosun", label: "Bosun" },
  { value: "lead_deckhand", label: "Lead Deckhand" },
  { value: "deckhand", label: "Deckhand" },
  { value: "chief_stewardess", label: "Chief Stewardess" },
  { value: "second_stewardess", label: "2nd Stewardess" },
  { value: "third_stewardess", label: "3rd Stewardess" },
  { value: "stewardess", label: "Stewardess" },
  { value: "head_chef", label: "Head Chef" },
  { value: "sous_chef", label: "Sous Chef" },
  { value: "chef", label: "Chef" },
];

const vesselTypeOptions = [
  { value: "motor", label: "Motor Yacht" },
  { value: "sailing", label: "Sailing Yacht" },
  { value: "catamaran", label: "Catamaran" },
  { value: "explorer", label: "Explorer" },
];

const contractTypeOptions = [
  { value: "permanent", label: "Permanent" },
  { value: "rotational", label: "Rotational" },
  { value: "seasonal", label: "Seasonal" },
  { value: "temporary", label: "Temporary" },
];

const currencyOptions = [
  { value: "EUR", label: "€ EUR" },
  { value: "USD", label: "$ USD" },
  { value: "GBP", label: "£ GBP" },
];

const languageOptions = [
  { value: "english", label: "English" },
  { value: "french", label: "French" },
  { value: "spanish", label: "Spanish" },
  { value: "italian", label: "Italian" },
  { value: "german", label: "German" },
  { value: "portuguese", label: "Portuguese" },
  { value: "russian", label: "Russian" },
  { value: "mandarin", label: "Mandarin" },
  { value: "arabic", label: "Arabic" },
];

// Source Icon Component
function SourceIcon({ source }: { source: BriefSource }) {
  const icons: Record<BriefSource, { icon: React.ElementType; label: string; color: string }> = {
    email: { icon: Mail, label: "Email", color: "text-blue-600 bg-blue-100" },
    whatsapp: { icon: MessageCircle, label: "WhatsApp", color: "text-success-600 bg-success-100" },
    chat: { icon: Globe, label: "Chat", color: "text-purple-600 bg-purple-100" },
    form: { icon: FileText, label: "Form", color: "text-gold-600 bg-gold-100" },
  };
  const config = icons[source];
  const Icon = config.icon;

  return (
    <div className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", config.color)}>
      <Icon className="size-3.5" />
      {config.label}
    </div>
  );
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// Format date
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Main Component
export default function BriefParsePage() {
  const [parsedData, setParsedData] = React.useState<ParsedBrief>(mockParsedData);
  const [clarifications, setClarifications] = React.useState(mockClarifications);
  const [isSaving, setIsSaving] = React.useState(false);

  const confidenceScore = mockBrief.confidenceScore;
  const canCreateJob = confidenceScore >= 60;

  const handleFieldChange = <K extends keyof ParsedBrief>(
    field: K,
    value: ParsedBrief[K]
  ) => {
    setParsedData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleClarification = (id: string) => {
    setClarifications((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" leftIcon={<ChevronLeft className="size-4" />}>
            Back to Briefs
          </Button>
          <div className="h-6 w-px bg-gray-200" />
          <h1 className="text-4xl font-serif font-semibold text-navy-800">Parse Brief</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Original Brief (40%) */}
        <div className="flex w-2/5 flex-col border-r border-gray-200 bg-white">
          {/* Panel Header */}
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-navy-900">Original Brief</h2>
              <SourceIcon source={mockBrief.source} />
            </div>
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
              <span className="font-medium text-navy-800">{mockBrief.clientName}</span>
              <span>•</span>
              <span>{formatDate(mockBrief.receivedAt)}</span>
            </div>
          </div>

          {/* Raw Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                {mockBrief.rawContent}
              </pre>
            </div>

            {/* Attachments */}
            {mockBrief.attachments.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-navy-900">
                  <Paperclip className="size-4" />
                  Attachments ({mockBrief.attachments.length})
                </h3>
                <div className="space-y-2">
                  {mockBrief.attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-navy-100">
                          <FileText className="size-5 text-navy-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-navy-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" leftIcon={<Download className="size-4" />}>
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Send Clarification Button */}
          <div className="border-t border-gray-100 p-4">
            <Button
              variant="secondary"
              className="w-full"
              leftIcon={<Send className="size-4" />}
            >
              Send Clarification
            </Button>
          </div>
        </div>

        {/* Right Panel - Parsed Brief (60%) */}
        <div className="flex w-3/5 flex-col overflow-hidden">
          {/* Panel Header with Confidence */}
          <div className="border-b border-gray-100 bg-white px-6 py-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-navy-900">Parsed Brief</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Review and edit the extracted information
                </p>
              </div>
              <ConfidenceGauge value={confidenceScore} size="md" />
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Ambiguity Alerts */}
            {mockAmbiguities.length > 0 && (
              <div className="mb-6 space-y-3">
                {mockAmbiguities.map((ambiguity) => (
                  <div
                    key={ambiguity.id}
                    className="flex items-start gap-3 rounded-lg border border-warning-200 bg-warning-50 p-4"
                  >
                    <AlertTriangle className="size-5 shrink-0 text-warning-600" />
                    <div>
                      <p className="text-sm font-medium text-warning-800">
                        {ambiguity.message}
                      </p>
                      {ambiguity.values && (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {ambiguity.values.map((val, i) => (
                            <span
                              key={i}
                              className="rounded bg-warning-200 px-2 py-0.5 text-xs font-medium text-warning-800"
                            >
                              {val}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Parsed Fields Form */}
            <div className="space-y-6">
              {/* Position & Vessel Row */}
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Position"
                  options={positionOptions}
                  value={parsedData.position}
                  onChange={(e) => handleFieldChange("position", e.target.value)}
                  placeholder="Select position..."
                />
                <Select
                  label="Vessel Type"
                  options={vesselTypeOptions}
                  value={parsedData.vesselType}
                  onChange={(e) => handleFieldChange("vesselType", e.target.value)}
                  placeholder="Select vessel type..."
                />
              </div>

              {/* Vessel Size & Contract Type */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Vessel Size (meters)"
                  type="number"
                  value={parsedData.vesselSize}
                  onChange={(e) => handleFieldChange("vesselSize", e.target.value)}
                  placeholder="e.g. 50"
                />
                <Select
                  label="Contract Type"
                  options={contractTypeOptions}
                  value={parsedData.contractType}
                  onChange={(e) => handleFieldChange("contractType", e.target.value)}
                  placeholder="Select contract type..."
                />
              </div>

              {/* Salary Range */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy-700">
                  Salary Range
                </label>
                <div className="flex items-center gap-3">
                  <Select
                    options={currencyOptions}
                    value={parsedData.salaryCurrency}
                    onChange={(e) => handleFieldChange("salaryCurrency", e.target.value)}
                    className="w-28"
                  />
                  <Input
                    type="number"
                    value={parsedData.salaryMin}
                    onChange={(e) => handleFieldChange("salaryMin", e.target.value)}
                    placeholder="Min"
                  />
                  <span className="text-gray-400">—</span>
                  <Input
                    type="number"
                    value={parsedData.salaryMax}
                    onChange={(e) => handleFieldChange("salaryMax", e.target.value)}
                    placeholder="Max"
                  />
                  <span className="text-sm text-gray-500">/month</span>
                </div>
              </div>

              {/* Start Date */}
              <DatePicker
                label="Start Date"
                value={parsedData.startDate}
                onChange={(date) => handleFieldChange("startDate", date)}
                placeholder="Select start date..."
                helperText="Leave empty if ASAP"
              />

              {/* Languages */}
              <MultiSelect
                label="Languages"
                options={languageOptions}
                value={parsedData.languages}
                onChange={(values) => handleFieldChange("languages", values)}
                placeholder="Select required languages..."
              />

              {/* Requirements */}
              <Textarea
                label="Requirements"
                value={parsedData.requirements}
                onChange={(e) => handleFieldChange("requirements", e.target.value)}
                placeholder="Enter position requirements..."
                rows={6}
              />

              {/* Suggested Clarifications */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <HelpCircle className="size-5 text-navy-600" />
                  <h3 className="font-medium text-navy-900">Suggested Clarifications</h3>
                </div>
                <p className="mb-4 text-sm text-gray-600">
                  Select questions to include when sending a clarification request to the client.
                </p>
                <div className="space-y-3">
                  {clarifications.map((clarification) => (
                    <label
                      key={clarification.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                        clarification.selected
                          ? "border-gold-400 bg-gold-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleClarification(clarification.id)}
                        className={cn(
                          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
                          clarification.selected
                            ? "border-gold-500 bg-gold-500 text-white"
                            : "border-gray-300 bg-white"
                        )}
                      >
                        {clarification.selected && <Check className="size-3" />}
                      </button>
                      <span className="text-sm text-navy-800">{clarification.question}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {!canCreateJob && (
                  <span className="flex items-center gap-1.5 text-warning-600">
                    <AlertTriangle className="size-4" />
                    Confidence too low to create job automatically
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={handleSaveDraft}
                  loading={isSaving}
                >
                  Save Draft
                </Button>
                <Button
                  variant="primary"
                  disabled={!canCreateJob}
                  leftIcon={<Check className="size-4" />}
                >
                  Create Job
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
