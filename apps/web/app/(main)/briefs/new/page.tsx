"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  MessageSquare,
  ClipboardPaste,
  Clock,
  Upload,
  Send,
  Sparkles,
  Check,
  Edit3,
  X,
  Paperclip,
  CheckCircle2,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Types
type InputMethod = "form" | "chat" | "paste";

interface ParsedBrief {
  position: string;
  yachtName: string;
  yachtType: string;
  yachtSize: string;
  contractType: string;
  startDate: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  location: string;
  requirements: string[];
  notes: string;
  confidence: number;
}

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  options?: string[];
}

// Position options
const positionOptions = [
  { value: "", label: "Select position..." },
  { value: "captain", label: "Captain" },
  { value: "chief_officer", label: "Chief Officer" },
  { value: "second_officer", label: "Second Officer" },
  { value: "third_officer", label: "Third Officer" },
  { value: "chief_engineer", label: "Chief Engineer" },
  { value: "second_engineer", label: "Second Engineer" },
  { value: "eto", label: "ETO" },
  { value: "bosun", label: "Bosun" },
  { value: "lead_deckhand", label: "Lead Deckhand" },
  { value: "deckhand", label: "Deckhand" },
  { value: "chief_stewardess", label: "Chief Stew" },
  { value: "second_stewardess", label: "Second Stew" },
  { value: "third_stewardess", label: "Third Stew" },
  { value: "stewardess", label: "Stew" },
  { value: "head_chef", label: "Head Chef" },
  { value: "sous_chef", label: "Sous Chef" },
  { value: "chef", label: "Chef" },
];

const yachtTypeOptions = [
  { value: "", label: "Select type..." },
  { value: "motor", label: "Motor Yacht" },
  { value: "sailing", label: "Sailing Yacht" },
  { value: "catamaran", label: "Catamaran" },
  { value: "explorer", label: "Explorer Yacht" },
];

const contractTypeOptions = [
  { value: "", label: "Select contract..." },
  { value: "permanent", label: "Permanent" },
  { value: "rotational", label: "Rotational" },
  { value: "seasonal", label: "Seasonal" },
  { value: "temporary", label: "Temporary" },
];

const commonRequirements = [
  { value: "stcw", label: "STCW Certified" },
  { value: "eng1", label: "ENG1 Medical" },
  { value: "charter_exp", label: "Charter Experience" },
  { value: "private_exp", label: "Private Experience" },
  { value: "5_years", label: "5+ Years Experience" },
  { value: "references", label: "Strong References" },
  { value: "food_safety", label: "Food Safety Certified" },
  { value: "wine_knowledge", label: "Wine Knowledge" },
];

// Initial chat messages
const initialChatMessages: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hello! I'm here to help you create a crew brief. Let's start with the basics.\n\n**What position are you looking to fill?**",
    options: ["Captain", "Chief Stew", "Chef", "Engineer", "Deckhand", "Other"],
  },
];

// Helper Components
function InputMethodCard({
  icon,
  title,
  description,
  isSelected,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-center rounded-xl border-2 p-6 text-center transition-all",
        isSelected
          ? "border-gold-500 bg-gold-50"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
      )}
    >
      <div
        className={cn(
          "flex size-12 items-center justify-center rounded-full",
          isSelected ? "bg-gold-500 text-white" : "bg-gray-100 text-gray-500"
        )}
      >
        {icon}
      </div>
      <h3 className={cn("mt-4 font-semibold", isSelected ? "text-gold-700" : "text-navy-900")}>
        {title}
      </h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </button>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-error-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function CheckboxGroup({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
            selected.includes(option.value)
              ? "border-gold-500 bg-gold-50 text-gold-700"
              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
          )}
        >
          <div
            className={cn(
              "flex size-4 items-center justify-center rounded border",
              selected.includes(option.value)
                ? "border-gold-500 bg-gold-500"
                : "border-gray-300 bg-white"
            )}
          >
            {selected.includes(option.value) && <Check className="size-3 text-white" />}
          </div>
          {option.label}
        </label>
      ))}
    </div>
  );
}

function ParsedBriefPreview({
  brief,
  onEdit,
}: {
  brief: ParsedBrief;
  onEdit: () => void;
}) {
  const hasContent = brief.position || brief.yachtName || brief.contractType;

  if (!hasContent) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <FileText className="mx-auto size-10 text-gray-300" />
        <p className="mt-3 text-sm text-gray-500">
          Your brief details will appear here as you fill them in
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-navy-900">Brief Preview</h3>
          {brief.confidence > 0 && (
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                brief.confidence >= 80
                  ? "bg-success-100 text-success-700"
                  : brief.confidence >= 50
                  ? "bg-warning-100 text-warning-700"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              <Sparkles className="size-3" />
              {brief.confidence}% confidence
            </span>
          )}
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-sm font-medium text-gold-600 hover:text-gold-700"
        >
          <Edit3 className="size-4" />
          Edit Details
        </button>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {brief.position && (
            <div>
              <p className="text-xs text-gray-500">Position</p>
              <p className="font-medium text-navy-900">{brief.position}</p>
            </div>
          )}
          {brief.yachtName && (
            <div>
              <p className="text-xs text-gray-500">Yacht</p>
              <p className="font-medium text-navy-900">{brief.yachtName}</p>
            </div>
          )}
          {brief.yachtType && (
            <div>
              <p className="text-xs text-gray-500">Type</p>
              <p className="font-medium text-navy-900">{brief.yachtType}</p>
            </div>
          )}
          {brief.yachtSize && (
            <div>
              <p className="text-xs text-gray-500">Size</p>
              <p className="font-medium text-navy-900">{brief.yachtSize}m</p>
            </div>
          )}
          {brief.contractType && (
            <div>
              <p className="text-xs text-gray-500">Contract</p>
              <p className="font-medium capitalize text-navy-900">{brief.contractType}</p>
            </div>
          )}
          {brief.startDate && (
            <div>
              <p className="text-xs text-gray-500">Start Date</p>
              <p className="font-medium text-navy-900">{brief.startDate}</p>
            </div>
          )}
          {(brief.salaryMin || brief.salaryMax) && (
            <div>
              <p className="text-xs text-gray-500">Salary Range</p>
              <p className="font-medium text-navy-900">
                {brief.currency} {brief.salaryMin || "0"} - {brief.salaryMax || "0"}/mo
              </p>
            </div>
          )}
          {brief.location && (
            <div>
              <p className="text-xs text-gray-500">Location</p>
              <p className="font-medium text-navy-900">{brief.location}</p>
            </div>
          )}
        </div>

        {brief.requirements.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs text-gray-500">Requirements</p>
            <div className="flex flex-wrap gap-2">
              {brief.requirements.map((req) => (
                <span
                  key={req}
                  className="rounded-full bg-navy-100 px-2.5 py-1 text-xs font-medium text-navy-700"
                >
                  {req}
                </span>
              ))}
            </div>
          </div>
        )}

        {brief.notes && (
          <div className="mt-4">
            <p className="mb-1 text-xs text-gray-500">Additional Notes</p>
            <p className="text-sm text-gray-600">{brief.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Component
export default function NewBriefPage() {
  const router = useRouter();
  const [inputMethod, setInputMethod] = useState<InputMethod>("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    position: "",
    yachtName: "",
    yachtType: "",
    yachtSize: "",
    contractType: "",
    startDate: "",
    salaryMin: "",
    salaryMax: "",
    currency: "EUR",
    requirements: [] as string[],
    notes: "",
  });
  const [attachments, setAttachments] = useState<File[]>([]);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Paste state
  const [pastedText, setPastedText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedFromPaste, setParsedFromPaste] = useState<ParsedBrief | null>(null);

  // Build parsed brief from form data
  const parsedBrief: ParsedBrief = React.useMemo(() => {
    if (inputMethod === "paste" && parsedFromPaste) {
      return parsedFromPaste;
    }

    const positionLabel = positionOptions.find((p) => p.value === formData.position)?.label || "";
    const yachtTypeLabel = yachtTypeOptions.find((t) => t.value === formData.yachtType)?.label || "";
    const contractLabel = contractTypeOptions.find((c) => c.value === formData.contractType)?.label || "";
    const reqLabels = commonRequirements
      .filter((r) => formData.requirements.includes(r.value))
      .map((r) => r.label);

    return {
      position: positionLabel,
      yachtName: formData.yachtName,
      yachtType: yachtTypeLabel,
      yachtSize: formData.yachtSize,
      contractType: contractLabel,
      startDate: formData.startDate,
      salaryMin: formData.salaryMin,
      salaryMax: formData.salaryMax,
      currency: formData.currency,
      location: "",
      requirements: reqLabels,
      notes: formData.notes,
      confidence: 100,
    };
  }, [formData, inputMethod, parsedFromPaste]);

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      setAttachments([...attachments, ...Array.from(files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
    };
    setChatMessages([...chatMessages, userMessage]);
    setChatInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        {
          content: "Great choice! **What's the name and size of your yacht?**\n\nFor example: \"M/Y Eclipse, 72m\"",
        },
        {
          content: "Perfect! **What type of contract are you offering?**",
          options: ["Permanent", "Rotational", "Seasonal", "Temporary"],
        },
        {
          content: "**When do you need them to start?**\n\nYou can give me an approximate date or timeframe.",
        },
        {
          content: "**What salary range are you offering?**\n\nFor example: \"€6,500 - €8,000 per month\"",
        },
        {
          content: "Excellent! I've captured all the key details. **Is there anything else you'd like to add?**\n\nFeel free to mention specific requirements, preferences, or any other details that would help us find the perfect candidate.",
        },
      ];

      const nextResponse = responses[Math.min(chatMessages.length - 1, responses.length - 1)];
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: nextResponse.content,
        options: nextResponse.options,
      };
      setChatMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleChatOption = (option: string) => {
    setChatInput(option);
    setTimeout(() => handleChatSend(), 100);
  };

  const handleParseBrief = () => {
    if (!pastedText.trim()) return;
    setIsParsing(true);

    // Simulate AI parsing
    setTimeout(() => {
      setParsedFromPaste({
        position: "Chief Stew",
        yachtName: "M/Y Eclipse",
        yachtType: "Motor Yacht",
        yachtSize: "72",
        contractType: "Permanent",
        startDate: "January 2025",
        salaryMin: "6500",
        salaryMax: "8000",
        currency: "EUR",
        location: "Mediterranean",
        requirements: ["Charter Experience", "5+ Years Experience", "STCW Certified", "ENG1 Medical"],
        notes: "Looking for an experienced Chief Stew to join our team. Must have excellent leadership skills and be comfortable managing a team of 4 interior crew.",
        confidence: 87,
      });
      setIsParsing(false);
    }, 2000);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const positionLabel = positionOptions.find((p) => p.value === formData.position)?.label || formData.position;

      const response = await fetch("/api/briefs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          position: positionLabel || parsedBrief.position,
          positionCategory: formData.position,
          yachtName: formData.yachtName || parsedBrief.yachtName,
          yachtType: formData.yachtType || undefined,
          yachtSize: formData.yachtSize ? parseInt(formData.yachtSize) : undefined,
          contractType: formData.contractType || undefined,
          startDate: formData.startDate || parsedBrief.startDate || undefined,
          salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
          salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
          salaryCurrency: formData.currency,
          requirements: parsedBrief.requirements,
          notes: formData.notes || parsedBrief.notes,
          rawText: inputMethod === "paste" ? pastedText : undefined,
          inputMethod,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit brief");
      }

      setSubmitSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (submitSuccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-success-100">
            <CheckCircle2 className="size-8 text-success-600" />
          </div>
          <h1 className="mb-2 font-serif text-3xl font-semibold text-navy-900">
            Brief Submitted!
          </h1>
          <p className="mb-8 text-gray-600">
            We've received your brief and will review it shortly. You'll receive
            shortlisted candidates within 24 hours.
          </p>
          <div className="space-y-3">
            <Link href="/briefs">
              <Button variant="primary" className="w-full">
                Back to Briefs
              </Button>
            </Link>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setSubmitSuccess(false);
                setFormData({
                  position: "",
                  yachtName: "",
                  yachtType: "",
                  yachtSize: "",
                  contractType: "",
                  startDate: "",
                  salaryMin: "",
                  salaryMax: "",
                  currency: "EUR",
                  requirements: [],
                  notes: "",
                });
                setPastedText("");
                setParsedFromPaste(null);
              }}
            >
              Submit Another Brief
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 pb-12">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <Link
            href="/briefs"
            className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy-600"
          >
            <ArrowLeft className="size-4" />
            Back to Briefs
          </Link>
          <h1 className="text-4xl font-serif font-semibold text-navy-800">Create New Brief</h1>
          <p className="mt-2 text-gray-600">
            Tell us what you need and we'll find the right candidates
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Input Method Selection */}
        <div className="mb-8">
          <p className="mb-4 text-center text-sm font-medium text-gray-500">
            Choose how you'd like to submit your brief
          </p>
          <div className="flex gap-4">
            <InputMethodCard
              icon={<FileText className="size-6" />}
              title="Structured Form"
              description="Fill out a detailed form"
              isSelected={inputMethod === "form"}
              onClick={() => setInputMethod("form")}
            />
            <InputMethodCard
              icon={<MessageSquare className="size-6" />}
              title="Chat with AI"
              description="Answer questions naturally"
              isSelected={inputMethod === "chat"}
              onClick={() => setInputMethod("chat")}
            />
            <InputMethodCard
              icon={<ClipboardPaste className="size-6" />}
              title="Paste Brief"
              description="Copy & paste existing text"
              isSelected={inputMethod === "paste"}
              onClick={() => setInputMethod("paste")}
            />
          </div>
        </div>

        {/* Input Method Content */}
        <div className="mb-8">
          {/* Structured Form */}
          {inputMethod === "form" && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="space-y-6">
                {/* Position */}
                <FormField label="Position Needed" required>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="h-12 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  >
                    {positionOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* Yacht Details */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormField label="Yacht Name" required>
                    <input
                      type="text"
                      value={formData.yachtName}
                      onChange={(e) => setFormData({ ...formData, yachtName: e.target.value })}
                      placeholder="e.g. M/Y Eclipse"
                      className="h-12 w-full rounded-lg border border-gray-300 px-3 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                    />
                  </FormField>
                  <FormField label="Yacht Type">
                    <select
                      value={formData.yachtType}
                      onChange={(e) => setFormData({ ...formData, yachtType: e.target.value })}
                      className="h-12 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                    >
                      {yachtTypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Size (meters)">
                    <input
                      type="number"
                      value={formData.yachtSize}
                      onChange={(e) => setFormData({ ...formData, yachtSize: e.target.value })}
                      placeholder="e.g. 72"
                      className="h-12 w-full rounded-lg border border-gray-300 px-3 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                    />
                  </FormField>
                </div>

                {/* Contract & Dates */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Contract Type" required>
                    <select
                      value={formData.contractType}
                      onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                      className="h-12 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                    >
                      {contractTypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Start Date">
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="h-12 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                    />
                  </FormField>
                </div>

                {/* Salary Range */}
                <FormField label="Salary Range (monthly)">
                  <div className="flex items-center gap-3">
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="h-12 w-24 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                    >
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                    </select>
                    <input
                      type="number"
                      value={formData.salaryMin}
                      onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                      placeholder="Min"
                      className="h-12 flex-1 rounded-lg border border-gray-300 px-3 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="number"
                      value={formData.salaryMax}
                      onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                      placeholder="Max"
                      className="h-12 flex-1 rounded-lg border border-gray-300 px-3 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                    />
                  </div>
                </FormField>

                {/* Requirements */}
                <FormField label="Key Requirements">
                  <CheckboxGroup
                    options={commonRequirements}
                    selected={formData.requirements}
                    onChange={(reqs) => setFormData({ ...formData, requirements: reqs })}
                  />
                </FormField>

                {/* Additional Notes */}
                <FormField label="Additional Notes">
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    placeholder="Any specific requirements, preferences, or details about the role..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </FormField>

                {/* Attachments */}
                <FormField label="Attachments">
                  <div className="space-y-3">
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500 transition-colors hover:border-gray-400 hover:bg-gray-100">
                      <Upload className="size-5" />
                      <span>Click to upload or drag and drop</span>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => handleFileUpload(e.target.files)}
                        className="hidden"
                      />
                    </label>
                    {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-sm"
                          >
                            <Paperclip className="size-4 text-gray-500" />
                            <span className="max-w-[150px] truncate">{file.name}</span>
                            <button
                              onClick={() => removeAttachment(index)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="size-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </FormField>
              </div>
            </div>
          )}

          {/* Chat Interface */}
          {inputMethod === "chat" && (
            <div className="rounded-xl border border-gray-200 bg-white">
              {/* Chat Messages */}
              <div className="h-[400px] overflow-y-auto p-4">
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-3",
                          message.role === "user"
                            ? "bg-gold-500 text-white"
                            : "bg-gray-100 text-gray-800"
                        )}
                      >
                        {message.role === "assistant" && (
                          <div className="mb-2 flex items-center gap-2">
                            <div className="flex size-6 items-center justify-center rounded-full bg-navy-600">
                              <Sparkles className="size-3 text-white" />
                            </div>
                            <span className="text-xs font-medium text-navy-600">Lighthouse AI</span>
                          </div>
                        )}
                        <div
                          className="text-sm leading-relaxed [&_strong]:font-semibold"
                          dangerouslySetInnerHTML={{
                            __html: message.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>"),
                          }}
                        />
                        {message.options && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.options.map((option) => (
                              <button
                                key={option}
                                onClick={() => handleChatOption(option)}
                                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:border-gold-500 hover:bg-gold-50"
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl bg-gray-100 px-4 py-3">
                        <div className="flex items-center gap-1">
                          <div className="size-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
                          <div className="size-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
                          <div className="size-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
                    placeholder="Type your response..."
                    className="h-12 flex-1 rounded-lg border border-gray-300 px-4 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                  <Button
                    variant="primary"
                    onClick={handleChatSend}
                    disabled={!chatInput.trim()}
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Paste Interface */}
          {inputMethod === "paste" && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Paste your brief, email, or requirements here
                  </label>
                  <textarea
                    value={pastedText}
                    onChange={(e) => {
                      setPastedText(e.target.value);
                      setParsedFromPaste(null);
                    }}
                    rows={10}
                    placeholder={`Example:

We're looking for an experienced Chief Stew to join M/Y Eclipse (72m motor yacht) for the Mediterranean season.

Requirements:
- 5+ years experience in a similar role
- Previous charter experience required
- STCW and ENG1 must be current
- Strong leadership and team management skills

Contract: Permanent
Start date: January 2025
Salary: €6,500 - €8,000 per month

Please send suitable candidates ASAP.`}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    <Sparkles className="mr-1 inline size-4 text-gold-500" />
                    Our AI will automatically extract the key details
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleParseBrief}
                    disabled={!pastedText.trim() || isParsing}
                    leftIcon={
                      isParsing ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Sparkles className="size-4" />
                      )
                    }
                  >
                    {isParsing ? "Parsing..." : "Parse Brief"}
                  </Button>
                </div>

                {parsedFromPaste && (
                  <div className="mt-4 rounded-lg border border-success-200 bg-success-50 p-4">
                    <div className="flex items-center gap-2 text-success-700">
                      <CheckCircle2 className="size-5" />
                      <span className="font-medium">Brief parsed successfully!</span>
                    </div>
                    <p className="mt-1 text-sm text-success-600">
                      We've extracted the key details below. Please review and edit if needed.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Parsed Brief Preview */}
        <div className="mb-8">
          <ParsedBriefPreview
            brief={parsedBrief}
            onEdit={() => setInputMethod("form")}
          />
        </div>

        {/* Error Message */}
        {submitError && (
          <div className="mb-4 rounded-lg border border-error-200 bg-error-50 p-4 text-error-700">
            {submitError}
          </div>
        )}

        {/* Submit Footer */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="size-4" />
              <span>Expected response: <span className="font-medium text-navy-900">Within 24 hours</span></span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary">Save as Draft</Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={isSubmitting || !parsedBrief.position}
                leftIcon={
                  isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )
                }
              >
                {isSubmitting ? "Submitting..." : "Submit Brief"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
