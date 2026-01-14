"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  User,
  Building2,
  Loader2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  FileText,
  Sparkles,
} from "lucide-react";

interface LeadCaptureFormProps {
  initialQuery?: string;
  matchedCount?: number;
  onClose?: () => void;
  variant?: "modal" | "inline";
}

interface FormData {
  // Contact
  name: string;
  email: string;
  phone: string;
  company?: string;
  
  // Brief
  query: string;
  position?: string;
  location?: string;
  timeline?: string;
  budget?: string;
  additional_notes?: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  query?: string;
}

export function LeadCaptureForm({
  initialQuery = "",
  matchedCount = 0,
  onClose,
  variant = "modal",
}: LeadCaptureFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    query: initialQuery,
    position: "",
    location: "",
    timeline: "",
    budget: "",
    additional_notes: "",
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStructuredFields, setShowStructuredFields] = useState(false);

  // Format phone number as user types (basic international format)
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters except +
    let cleaned = value.replace(/[^\d+]/g, "");
    
    // Ensure it starts with + if it doesn't already
    if (cleaned.length > 0 && !cleaned.startsWith("+")) {
      // If it starts with a digit, add + (user can edit)
      cleaned = `+${cleaned}`;
    }
    
    // Limit length to reasonable international format
    if (cleaned.length > 20) {
      return cleaned.slice(0, 20);
    }
    
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData((prev) => ({ ...prev, phone: formatted }));
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  // Validate phone number format (matches API validation)
  const validatePhoneNumber = (phone: string): boolean => {
    // Remove spaces and common formatting characters for validation
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
    // Should start with + and have at least 8 digits after
    return /^\+[1-9]\d{7,19}$/.test(cleaned);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhoneNumber(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number with country code (e.g., +33 6 12 34 56 78)";
    }
    
    if (!formData.query.trim()) {
      newErrors.query = "Please describe what you're looking for";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Get UTM parameters from URL
      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get("utm_source");
      const utmMedium = urlParams.get("utm_medium");
      const utmCampaign = urlParams.get("utm_campaign");

      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "brief_match",
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          company: formData.company?.trim() || undefined,
          brief: {
            query: formData.query.trim(),
            position: formData.position?.trim() || undefined,
            location: formData.location?.trim() || undefined,
            timeline: formData.timeline?.trim() || undefined,
            budget: formData.budget?.trim() || undefined,
            additional_notes: formData.additional_notes?.trim() || undefined,
            matched_count: matchedCount,
          },
          source_url: window.location.href,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to submit inquiry");
      }

      const data = await response.json();
      
      // Store query in sessionStorage for thank you page
      if (formData.query) {
        sessionStorage.setItem("match_query", formData.query);
      }
      
      // Preserve UTM parameters for attribution
      const thankYouParams = new URLSearchParams();
      if (data.id) {
        thankYouParams.set("id", data.id);
      }
      if (utmSource) thankYouParams.set("utm_source", utmSource);
      if (utmMedium) thankYouParams.set("utm_medium", utmMedium);
      if (utmCampaign) thankYouParams.set("utm_campaign", utmCampaign);
      
      // Redirect to thank you page with inquiry ID and UTM params
      const thankYouUrl = `/match/thank-you${thankYouParams.toString() ? `?${thankYouParams.toString()}` : ""}`;
      router.push(thankYouUrl);
    } catch (error) {
      console.error("Form submission error:", error);
      setErrors({
        email: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerClasses = variant === "modal"
    ? "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    : "relative";

  const contentClasses = variant === "modal"
    ? "bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
    : "bg-white rounded-2xl border border-gray-200 shadow-xl";

  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        {/* Header */}
        <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 px-6 py-5 sticky top-0 z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold-500/10 via-transparent to-transparent" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500/20 ring-1 ring-gold-500/30">
                <Sparkles className="h-5 w-5 text-gold-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Get Full Candidate Profiles</h3>
                <p className="text-sm text-gray-300">We&apos;ll send detailed CVs within 24 hours</p>
              </div>
            </div>
            {variant === "modal" && onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Contact Information Section */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <User className="h-5 w-5 text-gold-600" />
              <h4 className="text-sm font-semibold text-navy-900">Contact Information</h4>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, name: e.target.value }));
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
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
              </div>
              {errors.name && (
                <p id="name-error" className="mt-1.5 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, email: e.target.value }));
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
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="mt-1.5 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="+33 6 12 34 56 78"
                  className={`w-full rounded-lg border pl-10 pr-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                    errors.phone
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-300 focus:border-gold-500 focus:ring-gold-500/20"
                  }`}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                />
              </div>
              {errors.phone && (
                <p id="phone-error" className="mt-1.5 text-sm text-red-600">{errors.phone}</p>
              )}
              <p className="mt-1.5 text-xs text-gray-500">Include country code (e.g., +33 for France)</p>
            </div>

            {/* Company (Optional) */}
            <div>
              <label htmlFor="company" className="block text-sm font-semibold text-gray-700 mb-2">
                Company/Organization <span className="text-gray-400 text-xs font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                  placeholder="Your Company Name"
                  className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Job Brief Section */}
          <div className="space-y-5 pt-5 border-t border-gray-200">
            <div className="flex items-center gap-2 pb-2">
              <Briefcase className="h-5 w-5 text-gold-600" />
              <h4 className="text-sm font-semibold text-navy-900">Job Brief Details</h4>
            </div>

            {/* Main Query Textarea */}
            <div>
              <label htmlFor="query" className="block text-sm font-semibold text-gray-700 mb-2">
                Describe what you&apos;re looking for <span className="text-red-500">*</span>
              </label>
              <textarea
                id="query"
                value={formData.query}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, query: e.target.value }));
                  if (errors.query) {
                    setErrors((prev) => ({ ...prev, query: undefined }));
                  }
                }}
                placeholder="e.g., Chief Stewardess, female, can make cocktails, Monaco, available immediately"
                rows={6}
                className={`w-full rounded-lg border px-4 py-3 text-gray-900 bg-gray-50/50 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 transition-all resize-none text-sm ${
                  errors.query
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    : "border-gray-300 focus:border-gold-500 focus:ring-gold-500/20"
                }`}
                aria-invalid={!!errors.query}
                aria-describedby={errors.query ? "query-error" : undefined}
              />
              {errors.query && (
                <p id="query-error" className="mt-1.5 text-sm text-red-600">{errors.query}</p>
              )}
              <p className="mt-1.5 text-xs text-gray-500">
                Include role, location, timeline, requirements, skills, or any other details
              </p>
            </div>

            {/* Progressive Disclosure: Structured Fields */}
            <div>
              <button
                type="button"
                onClick={() => setShowStructuredFields(!showStructuredFields)}
                className="flex items-center gap-2 text-sm font-medium text-gold-600 hover:text-gold-700 transition-colors"
              >
                {showStructuredFields ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide Additional Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Add More Details (Optional)
                  </>
                )}
              </button>

              {showStructuredFields && (
                <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {/* Position */}
                  <div>
                    <label htmlFor="position" className="block text-xs font-medium text-gray-700 mb-1.5">
                      Position/Role
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        id="position"
                        type="text"
                        value={formData.position}
                        onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
                        placeholder="e.g., Butler, Estate Manager"
                        className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label htmlFor="location" className="block text-xs font-medium text-gray-700 mb-1.5">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        id="location"
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                        placeholder="e.g., Monaco, London, New York"
                        className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <label htmlFor="timeline" className="block text-xs font-medium text-gray-700 mb-1.5">
                      Timeline/Urgency
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        id="timeline"
                        type="text"
                        value={formData.timeline}
                        onChange={(e) => setFormData((prev) => ({ ...prev, timeline: e.target.value }))}
                        placeholder="e.g., ASAP, Within 2 weeks, Flexible"
                        className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Budget (Optional) */}
                  <div>
                    <label htmlFor="budget" className="block text-xs font-medium text-gray-700 mb-1.5">
                      Budget/Salary Range <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        id="budget"
                        type="text"
                        value={formData.budget}
                        onChange={(e) => setFormData((prev) => ({ ...prev, budget: e.target.value }))}
                        placeholder="e.g., €5,000-7,000/month"
                        className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label htmlFor="additional_notes" className="block text-xs font-medium text-gray-700 mb-1.5">
                      Additional Notes
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <textarea
                        id="additional_notes"
                        value={formData.additional_notes}
                        onChange={(e) => setFormData((prev) => ({ ...prev, additional_notes: e.target.value }))}
                        placeholder="Any other requirements, preferences, or details..."
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-200">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full shadow-lg shadow-gold-500/20"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Inquiry
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            <p className="mt-4 text-center text-xs text-gray-500">
              No spam, ever. Your information is kept confidential. Join 500+ satisfied clients.
            </p>

            {/* Direct Contact Option */}
            <div className="mt-4 pt-4 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-2">
                Prefer to speak directly?
              </p>
              <a
                href="tel:+33652928360"
                className="inline-flex items-center gap-2 text-gold-600 hover:text-gold-700 font-medium transition-colors"
              >
                <Phone className="h-4 w-4" />
                +33 6 52 92 83 60
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

