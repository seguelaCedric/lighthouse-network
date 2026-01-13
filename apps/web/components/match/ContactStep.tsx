"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  User,
  Building2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  FileText,
} from "lucide-react";

interface ContactData {
  name: string;
  email: string;
  phone: string;
  company: string;
}

interface ContactStepProps {
  requirements: string;
  contactData: ContactData;
  onContactChange: (data: ContactData) => void;
  onSubmit: () => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
  submitError?: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

// Format phone number as user types (basic international format)
const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters except +
  let cleaned = value.replace(/[^\d+]/g, "");

  // Ensure it starts with + if it doesn't already
  if (cleaned.length > 0 && !cleaned.startsWith("+")) {
    cleaned = `+${cleaned}`;
  }

  // Limit length to reasonable international format
  if (cleaned.length > 20) {
    return cleaned.slice(0, 20);
  }

  return cleaned;
};

// Validate phone number format (matches API validation)
const validatePhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
  return /^\+[1-9]\d{7,19}$/.test(cleaned);
};

export function ContactStep({
  requirements,
  contactData,
  onContactChange,
  onSubmit,
  onBack,
  isSubmitting,
  submitError,
}: ContactStepProps) {
  const [errors, setErrors] = useState<FormErrors>({});

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onContactChange({ ...contactData, phone: formatted });
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!contactData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!contactData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!contactData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhoneNumber(contactData.phone)) {
      newErrors.phone =
        "Please enter a valid phone number with country code (e.g., +33 6 12 34 56 78)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit();
  };

  // Truncate requirements for display
  const truncatedRequirements =
    requirements.length > 150
      ? requirements.slice(0, 150) + "..."
      : requirements;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-navy-900 mb-2">
          Your contact details
        </h2>
        <p className="text-gray-600">
          So our consultants can get back to you with suitable candidates
        </p>
      </div>

      {/* Requirements Preview */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-gold-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 mb-1">
              Your Requirements:
            </p>
            <p className="text-sm text-gray-600 italic">
              &ldquo;{truncatedRequirements}&rdquo;
            </p>
          </div>
          <button
            onClick={onBack}
            className="text-sm text-gold-600 hover:text-gold-700 font-medium flex-shrink-0"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Contact Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="name"
              type="text"
              value={contactData.name}
              onChange={(e) => {
                onContactChange({ ...contactData, name: e.target.value });
                if (errors.name) {
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
              placeholder="John Smith"
              className={`w-full rounded-lg border pl-10 pr-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                errors.name
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  : "border-gray-300 focus:border-gold-500 focus:ring-gold-500/20"
              }`}
            />
          </div>
          {errors.name && (
            <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="email"
              type="email"
              value={contactData.email}
              onChange={(e) => {
                onContactChange({ ...contactData, email: e.target.value });
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              placeholder="you@company.com"
              className={`w-full rounded-lg border pl-10 pr-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                errors.email
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  : "border-gray-300 focus:border-gold-500 focus:ring-gold-500/20"
              }`}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="phone"
              type="tel"
              value={contactData.phone}
              onChange={handlePhoneChange}
              placeholder="+33 6 12 34 56 78"
              className={`w-full rounded-lg border pl-10 pr-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                errors.phone
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  : "border-gray-300 focus:border-gold-500 focus:ring-gold-500/20"
              }`}
            />
          </div>
          {errors.phone && (
            <p className="mt-1.5 text-sm text-red-600">{errors.phone}</p>
          )}
          <p className="mt-1.5 text-xs text-gray-500">
            Include country code (e.g., +33 for France)
          </p>
        </div>

        {/* Company (Optional) */}
        <div>
          <label
            htmlFor="company"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Company/Organization{" "}
            <span className="text-gray-400 text-xs font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="company"
              type="text"
              value={contactData.company}
              onChange={(e) =>
                onContactChange({ ...contactData, company: e.target.value })
              }
              placeholder="Your Company Name"
              className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-colors"
            />
          </div>
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}

        {/* Trust Elements */}
        <div className="bg-gradient-to-br from-gold-50 to-gold-100/50 rounded-xl border border-gold-200 p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="h-4 w-4 text-gold-600" />
              <span>A dedicated consultant will review your requirements</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="h-4 w-4 text-gold-600" />
              <span>Receive curated profiles within 24 hours</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="h-4 w-4 text-gold-600" />
              <span>300+ successful placements per year</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-shrink-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 px-6 rounded-lg gradient-gold text-white font-medium shadow-md hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Brief
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-gray-500">
          Your information is kept confidential. No spam, ever.
        </p>
      </form>
    </div>
  );
}
