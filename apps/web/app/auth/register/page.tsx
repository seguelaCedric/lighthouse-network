"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signUp } from "@/lib/auth/actions";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  User,
  Phone,
  Briefcase,
  CheckCircle2,
  Check,
  ChevronDown,
  Gift,
  Upload,
  FileText,
  X,
  AlertTriangle,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { nationalityOptions } from "@/components/profile/constants";

// Step indicator component
function StepIndicator({
  currentStep,
}: {
  currentStep: number;
}) {
  const steps = [
    { number: 1, label: "Account" },
    { number: 2, label: "Personal" },
    { number: 3, label: "Professional" },
    { number: 4, label: "CV" },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all",
                  currentStep > step.number
                    ? "border-success-500 bg-success-500 text-white"
                    : currentStep === step.number
                      ? "border-gold-500 bg-gold-500 text-white"
                      : "border-gray-200 bg-white text-gray-400"
                )}
              >
                {currentStep > step.number ? <Check className="size-5" /> : step.number}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium",
                  currentStep >= step.number ? "text-navy-900" : "text-gray-400"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1 transition-colors",
                  currentStep > step.number ? "bg-success-500" : "bg-gray-200"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Step 1: Account Setup
function Step1({
  data,
  onChange,
  errors,
}: {
  data: { email: string; password: string; confirmPassword: string; acceptTerms: boolean };
  onChange: (field: string, value: string | boolean) => void;
  errors: Record<string, string>;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordRequirements = [
    { label: "At least 8 characters", met: data.password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(data.password) },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(data.password) },
    { label: "Contains special character", met: /[!@#$%^&*]/.test(data.password) },
  ];

  return (
    <div className="space-y-4">
      <div className="mb-6 text-center">
        <h2 className="font-serif text-2xl font-medium text-navy-800">Create Your Account</h2>
        <p className="text-sm text-gray-500">Start your journey in yachting or private service</p>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-navy-900">
          Email Address
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
          <input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="you@example.com"
            className={cn(
              "w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-navy-900 placeholder:text-gray-400 focus:outline-none focus:ring-2",
              errors.email
                ? "border-burgundy-300 focus:border-burgundy-500 focus:ring-burgundy-500/20"
                : "border-gray-200 focus:border-gold-500 focus:ring-gold-500/20"
            )}
          />
        </div>
        {errors.email && <p className="mt-1 text-xs text-burgundy-600">{errors.email}</p>}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-navy-900">
          Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={data.password}
            onChange={(e) => onChange("password", e.target.value)}
            placeholder="Create a strong password"
            className={cn(
              "w-full rounded-lg border bg-white py-2.5 pl-10 pr-12 text-navy-900 placeholder:text-gray-400 focus:outline-none focus:ring-2",
              errors.password
                ? "border-burgundy-300 focus:border-burgundy-500 focus:ring-burgundy-500/20"
                : "border-gray-200 focus:border-gold-500 focus:ring-gold-500/20"
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-burgundy-600">{errors.password}</p>}

        {/* Password Requirements */}
        {data.password && (
          <div className="mt-2 grid grid-cols-2 gap-1">
            {passwordRequirements.map((req, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-1.5 text-xs",
                  req.met ? "text-success-600" : "text-gray-400"
                )}
              >
                {req.met ? <CheckCircle2 className="size-3" /> : <div className="size-3 rounded-full border border-gray-300" />}
                {req.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-navy-900">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={data.confirmPassword}
            onChange={(e) => onChange("confirmPassword", e.target.value)}
            placeholder="Confirm your password"
            className={cn(
              "w-full rounded-lg border bg-white py-2.5 pl-10 pr-12 text-navy-900 placeholder:text-gray-400 focus:outline-none focus:ring-2",
              errors.confirmPassword || (data.confirmPassword && data.password !== data.confirmPassword)
                ? "border-burgundy-300 focus:border-burgundy-500 focus:ring-burgundy-500/20"
                : "border-gray-200 focus:border-gold-500 focus:ring-gold-500/20"
            )}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
        {(errors.confirmPassword || (data.confirmPassword && data.password !== data.confirmPassword)) && (
          <p className="mt-1 text-xs text-burgundy-600">{errors.confirmPassword || "Passwords do not match"}</p>
        )}
      </div>

      {/* Terms */}
      <div className="mt-4 rounded-lg bg-gray-50 p-3">
        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            checked={data.acceptTerms}
            onChange={(e) => onChange("acceptTerms", e.target.checked)}
            className="mt-0.5 size-4 rounded border-gray-300 text-gold-600 focus:ring-gold-500"
          />
          <span className="text-xs text-gray-600">
            I agree to the{" "}
            <Link href="/terms" target="_blank" className="font-medium text-navy-600 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" className="font-medium text-navy-600 hover:underline">
              Privacy Policy
            </Link>
          </span>
        </label>
        {errors.acceptTerms && <p className="mt-1 text-xs text-burgundy-600">{errors.acceptTerms}</p>}
      </div>
    </div>
  );
}

// Step 2: Personal Information
function Step2({
  data,
  onChange,
  errors,
}: {
  data: { firstName: string; lastName: string; phone: string; nationality: string };
  onChange: (field: string, value: string) => void;
  errors: Record<string, string>;
}) {
  // Filter out the empty "Select nationality..." option for the registration form
  const selectableNationalities = nationalityOptions.filter(opt => opt.value !== "");

  return (
    <div className="space-y-4">
      <div className="mb-6 text-center">
        <h2 className="font-serif text-2xl font-medium text-navy-800">Personal Information</h2>
        <p className="text-sm text-gray-500">Tell us a bit about yourself</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* First Name */}
        <div>
          <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-navy-900">
            First Name
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
            <input
              id="firstName"
              type="text"
              value={data.firstName}
              onChange={(e) => onChange("firstName", e.target.value)}
              placeholder="John"
              className={cn(
                "w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-navy-900 placeholder:text-gray-400 focus:outline-none focus:ring-2",
                errors.firstName
                  ? "border-burgundy-300 focus:border-burgundy-500 focus:ring-burgundy-500/20"
                  : "border-gray-200 focus:border-gold-500 focus:ring-gold-500/20"
              )}
            />
          </div>
          {errors.firstName && <p className="mt-1 text-xs text-burgundy-600">{errors.firstName}</p>}
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-navy-900">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            value={data.lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
            placeholder="Smith"
            className={cn(
              "w-full rounded-lg border bg-white py-2.5 px-4 text-navy-900 placeholder:text-gray-400 focus:outline-none focus:ring-2",
              errors.lastName
                ? "border-burgundy-300 focus:border-burgundy-500 focus:ring-burgundy-500/20"
                : "border-gray-200 focus:border-gold-500 focus:ring-gold-500/20"
            )}
          />
          {errors.lastName && <p className="mt-1 text-xs text-burgundy-600">{errors.lastName}</p>}
        </div>
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-navy-900">
          Phone Number
        </label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
          <input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="+33 6 12 34 56 78"
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
          />
        </div>
      </div>

      {/* Nationality */}
      <div>
        <label htmlFor="nationality" className="mb-1.5 block text-sm font-medium text-navy-900">
          Nationality
        </label>
        <SearchableSelect
          value={data.nationality}
          onChange={(value) => onChange("nationality", value)}
          options={selectableNationalities}
          placeholder="Select nationality"
          searchPlaceholder="Search nationalities..."
          className="rounded-lg border-gray-200 focus:border-gold-500 focus:ring-gold-500/20"
        />
      </div>
    </div>
  );
}

// Step 3: Professional Information
function Step3({
  data,
  onChange,
  errors,
}: {
  data: {
    candidateType: string;
    primaryPosition: string;
    otherRoleDetails: string;
  };
  onChange: (field: string, value: string) => void;
  errors: Record<string, string>;
}) {
  const roleTypes = [
    {
      value: "yacht_crew",
      label: "Yacht Crew",
      description: "Roles on board yachts and superyachts",
    },
    {
      value: "household_staff",
      label: "Household Staff",
      description: "Private residences, estates, and households",
    },
    {
      value: "both",
      label: "Both",
      description: "Open to yacht and household roles",
    },
    {
      value: "other",
      label: "Other",
      description: "Other roles or industries",
    },
  ];

  const yachtPositions = [
    // Yacht Crew - Deck
    "Captain",
    "Chief Officer",
    "Second Officer",
    "Third Officer",
    "Bosun",
    "Deckhand",
    // Yacht Crew - Engineering
    "Chief Engineer",
    "Second Engineer",
    "ETO",
    // Yacht Crew - Interior
    "Chief Stew",
    "Second Stew",
    "Third Stew",
    "Stew",
    // Culinary
    "Head Chef",
    "Sous Chef",
    "Chef de Partie",
    "Private Chef",
  ];

  const householdPositions = [
    "Estate Manager",
    "House Manager",
    "Butler",
    "Head Housekeeper",
    "Housekeeper",
    "Personal Assistant",
    "Nanny",
    "Governess",
    "Chauffeur",
    "Security / Close Protection",
    "Gardener / Groundskeeper",
    "Maintenance / Handyman",
    "Laundress",
    "Couple (Combined Roles)",
    "Private Chef",
  ];

  const positionsByType: Record<string, string[]> = {
    yacht_crew: yachtPositions,
    household_staff: householdPositions,
    both: [...yachtPositions, ...householdPositions],
    other: ["Other"],
  };

  const positions = data.candidateType
    ? positionsByType[data.candidateType] || []
    : [];

  const showOtherRoleDetails = data.candidateType === "other";

  return (
    <div className="space-y-4">
      <div className="mb-6 text-center">
        <h2 className="font-serif text-2xl font-medium text-navy-800">Professional Background</h2>
        <p className="text-sm text-gray-500">Help us match you with the right opportunities</p>
      </div>

      {/* Role Category */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy-900">
          Role Category
        </label>
        <div className="space-y-2">
          {roleTypes.map((role) => (
            <label
              key={role.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all",
                data.candidateType === role.value
                  ? "border-gold-400 bg-gold-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <input
                type="radio"
                name="candidateType"
                value={role.value}
                checked={data.candidateType === role.value}
                onChange={(e) => onChange("candidateType", e.target.value)}
                className="mt-0.5 size-4 shrink-0 border-gray-300 accent-gold-600 focus:ring-gold-500"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-navy-900 mb-1">
                  {role.label}
                </div>
                <div className="text-xs text-gray-600 leading-relaxed">
                  {role.description}
                </div>
              </div>
            </label>
          ))}
        </div>
        {errors.candidateType && (
          <p className="mt-1 text-xs text-error-600">{errors.candidateType}</p>
        )}
      </div>

      {/* Primary Position */}
      <div>
        <label htmlFor="position" className="mb-1.5 block text-sm font-medium text-navy-900">
          Primary Position
        </label>
        <div className="relative">
          <Briefcase className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
          <select
            id="position"
            value={data.primaryPosition}
            onChange={(e) => onChange("primaryPosition", e.target.value)}
            disabled={!data.candidateType}
            className={cn(
              "w-full appearance-none rounded-lg border bg-white py-2.5 pl-10 pr-10 text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20",
              !data.candidateType && "border-gray-200 text-gray-400"
            )}
          >
            <option value="">
              {data.candidateType ? "Select your primary position" : "Select a role category first"}
            </option>
            {positions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
        </div>
        {errors.primaryPosition && (
          <p className="mt-1 text-xs text-error-600">{errors.primaryPosition}</p>
        )}
      </div>

      {showOtherRoleDetails && (
        <div>
          <label htmlFor="otherRole" className="mb-1.5 block text-sm font-medium text-navy-900">
            Describe Your Role
          </label>
          <textarea
            id="otherRole"
            rows={4}
            value={data.otherRoleDetails}
            onChange={(e) => onChange("otherRoleDetails", e.target.value)}
            placeholder="e.g. Corporate hospitality, private aviation, luxury concierge, etc."
            className="w-full rounded-lg border border-gray-200 bg-white p-3 text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
          />
          {errors.otherRoleDetails && (
            <p className="mt-1 text-xs text-error-600">{errors.otherRoleDetails}</p>
          )}
        </div>
      )}
    </div>
  );
}

// Step 4: CV Upload
function Step4({
  data,
  onChange,
  errors,
}: {
  data: { cvFile: File | null };
  onChange: (field: string, value: File | null) => void;
  errors: Record<string, string>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
  ];

  const maxSize = 10 * 1024 * 1024; // 10MB

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return "File size must be less than 10MB";
    }
    if (!allowedTypes.includes(file.type)) {
      return "Please upload a PDF, Word document, or image file";
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      onChange("cvFile", null);
      // Set error through the parent component
      return;
    }
    onChange("cvFile", file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    onChange("cvFile", null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="mb-6 text-center">
        <h2 className="font-serif text-2xl font-medium text-navy-800">Upload Your CV</h2>
        <p className="text-sm text-gray-500">Help recruiters learn more about your experience</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        className="sr-only"
        id="cv-upload"
      />

      {errors.cvFile && (
        <div className="flex items-start gap-2 rounded-lg border border-burgundy-200 bg-burgundy-50 p-3 text-sm text-burgundy-700">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{errors.cvFile}</span>
        </div>
      )}

      {data.cvFile ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-lg bg-gold-100">
              <FileText className="size-6 text-gold-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-navy-900">{data.cvFile.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(data.cvFile.size)}</p>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
              aria-label="Remove file"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-success-600">
            <CheckCircle2 className="size-4" />
            <span>File ready to upload</span>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200",
            isDragging
              ? "scale-[1.02] border-gold-500 bg-gold-50"
              : "border-gray-300 hover:border-gold-400 hover:bg-gray-50"
          )}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div
            className={cn(
              "mx-auto mb-4 flex size-16 items-center justify-center rounded-full transition-colors",
              isDragging ? "bg-gold-100" : "bg-gray-100"
            )}
          >
            <Upload
              className={cn(
                "size-8 transition-colors",
                isDragging ? "text-gold-600" : "text-gray-400"
              )}
            />
          </div>
          <p
            className={cn(
              "mb-1 text-sm font-medium transition-colors",
              isDragging ? "text-gold-700" : "text-gray-600"
            )}
          >
            {isDragging ? "Drop your CV here" : "Click or drag your CV to upload"}
          </p>
          <p className="text-xs text-gray-400">PDF, Word documents, or images up to 10MB</p>
        </div>
      )}

      <div className="rounded-lg bg-navy-50 p-4">
        <h3 className="mb-2 text-sm font-medium text-navy-900">Why upload your CV?</h3>
        <ul className="space-y-1.5 text-xs text-gray-600">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success-500" />
            <span>Get matched with relevant job opportunities faster</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success-500" />
            <span>Recruiters can better understand your experience</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success-500" />
            <span>Apply to jobs with one click using your uploaded CV</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// Main registration page
function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const redirectParam = searchParams.get("redirect");
  const redirectTo =
    redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : null;

  // Referral tracking state
  const [referralId, setReferralId] = useState<string | null>(null);
  const [referrerName, setReferrerName] = useState<string | null>(null);

  const [step1Data, setStep1Data] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [step2Data, setStep2Data] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    nationality: "",
  });

  const [step3Data, setStep3Data] = useState({
    candidateType: "",
    primaryPosition: "",
    otherRoleDetails: "",
  });

  const [step4Data, setStep4Data] = useState<{ cvFile: File | null }>({
    cvFile: null,
  });

  // Check for referral code on mount
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      // Track the referral click
      fetch("/api/referrals/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: refCode,
          source: searchParams.get("src") || "link",
          utm_campaign: searchParams.get("utm_campaign"),
          utm_source: searchParams.get("utm_source"),
          utm_medium: searchParams.get("utm_medium"),
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.referral_id) {
            setReferralId(data.referral_id);
            setReferrerName(data.referrer_name);
          }
        })
        .catch((err) => {
          console.error("Failed to track referral:", err);
        });
    }
  }, [searchParams]);

  const handleStep1Change = (field: string, value: string | boolean) => {
    setStep1Data((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleStep2Change = (field: string, value: string) => {
    setStep2Data((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleStep3Change = (field: string, value: string) => {
    setStep3Data((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleStep4Change = (field: string, value: File | null) => {
    setStep4Data((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!step1Data.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step1Data.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!step1Data.password) {
      newErrors.password = "Password is required";
    } else if (step1Data.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/\d/.test(step1Data.password)) {
      newErrors.password = "Password must contain at least one number";
    } else if (!/[A-Z]/.test(step1Data.password)) {
      newErrors.password = "Password must contain at least one uppercase letter";
    } else if (!/[!@#$%^&*]/.test(step1Data.password)) {
      newErrors.password = "Password must contain at least one special character";
    }

    if (step1Data.password !== step1Data.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!step1Data.acceptTerms) {
      newErrors.acceptTerms = "You must accept the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!step2Data.firstName) {
      newErrors.firstName = "First name is required";
    }

    if (!step2Data.lastName) {
      newErrors.lastName = "Last name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!step3Data.candidateType) {
      newErrors.candidateType = "Please select a role category";
    }

    if (!step3Data.primaryPosition) {
      newErrors.primaryPosition = "Primary position is required";
    }
    if (step3Data.candidateType === "other" && !step3Data.otherRoleDetails.trim()) {
      newErrors.otherRoleDetails = "Please describe your role";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!step4Data.cvFile) {
      newErrors.cvFile = "Please upload your CV to complete registration";
    } else {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
      ];

      if (step4Data.cvFile.size > maxSize) {
        newErrors.cvFile = "File size must be less than 10MB";
      } else if (!allowedTypes.includes(step4Data.cvFile.type)) {
        newErrors.cvFile = "Please upload a PDF, Word document, or image file";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (currentStep === 1 && !validateStep1()) {
      return;
    }

    if (currentStep === 2 && !validateStep2()) {
      return;
    }

    if (currentStep === 3 && !validateStep3()) {
      return;
    }

    if (currentStep === 4) {
      if (!validateStep4()) {
        return;
      }

      // Submit registration
      setIsLoading(true);

      const result = await signUp(
        step1Data.email,
        step1Data.password,
        {
          first_name: step2Data.firstName,
          last_name: step2Data.lastName,
          full_name: `${step2Data.firstName} ${step2Data.lastName}`,
          phone: step2Data.phone,
          nationality: step2Data.nationality,
          candidate_type: step3Data.candidateType,
          other_role_details: step3Data.otherRoleDetails,
          primary_position: step3Data.primaryPosition,
          // Pass referral ID if present (will be used after email verification)
          referral_id: referralId,
        },
        redirectTo || undefined
      );

      if (!result.success) {
        setIsLoading(false);
        toast.error(result.error || "Failed to create account");
        return;
      }

      // Upload CV after successful registration - wait for completion before redirect
      let cvUploadSuccess = false;
      if (step4Data.cvFile) {
        try {
          // Use candidate ID from signUp response (more reliable than API fetch)
          const candidateId = result.candidateId;

          if (candidateId) {
            const formData = new FormData();
            formData.append("file", step4Data.cvFile);
            formData.append("entityType", "candidate");
            formData.append("entityId", candidateId);
            formData.append("documentType", "cv");

            const uploadResponse = await fetch("/api/documents/upload/", {
              method: "POST",
              body: formData,
              credentials: 'include',
            });

            if (uploadResponse.ok) {
              cvUploadSuccess = true;
            } else {
              console.error("CV upload failed, but registration succeeded");
              toast.error("CV upload failed. You can upload it later from your profile.");
            }
          } else {
            console.error("Could not get candidate ID after registration");
            toast.error("CV upload failed. You can upload it later from your profile.");
          }
        } catch (uploadError) {
          console.error("CV upload error:", uploadError);
          toast.error("CV upload failed. You can upload it later from your profile.");
        }
      }

      setIsLoading(false);

      if (step4Data.cvFile && cvUploadSuccess) {
        toast.success("Account created and CV uploaded! Welcome to Lighthouse Network.");
      } else if (step4Data.cvFile) {
        // CV was provided but upload failed - message already shown above
        toast.success("Account created! Welcome to Lighthouse Network.");
      } else {
        toast.success("Account created! Welcome to Lighthouse Network.");
      }

      // Redirect to dashboard (user is now signed in)
      if (result.redirectTo) {
        router.push(result.redirectTo);
      } else if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.push("/crew/dashboard");
      }
      return;
    }

    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 size-80 rounded-full bg-gold-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 size-80 rounded-full bg-navy-200/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex justify-center">
            <Logo size="xl" />
          </Link>
        </div>

        {/* Referral Banner */}
        {referrerName && (
          <div className="mb-4 rounded-xl border border-gold-200 bg-gold-50 p-3">
            <div className="flex items-center gap-2">
              <Gift className="size-5 text-gold-600" />
              <p className="text-sm text-navy-900">
                <span className="font-medium">{referrerName}</span> invited you to join Lighthouse Network!
              </p>
            </div>
          </div>
        )}

        {/* Registration Card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="p-6">
            {/* Step Indicator */}
            <StepIndicator currentStep={currentStep} />

            {/* Step Content */}
            {currentStep === 1 && (
              <Step1 data={step1Data} onChange={handleStep1Change} errors={errors} />
            )}
            {currentStep === 2 && (
              <Step2 data={step2Data} onChange={handleStep2Change} errors={errors} />
            )}
            {currentStep === 3 && (
              <Step3 data={step3Data} onChange={handleStep3Change} errors={errors} />
            )}
            {currentStep === 4 && (
              <Step4 data={step4Data} onChange={handleStep4Change} errors={errors} />
            )}

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between">
              {currentStep > 1 ? (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="size-4" />
                  Back
                </button>
              ) : (
                <div />
              )}

              <Button
                variant="primary"
                onClick={handleNext}
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="size-4 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    {currentStep === 4 ? "Creating account..." : ""}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    {currentStep === 4 ? "Complete Registration" : "Continue"}
                    <ArrowRight className="size-4" />
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 p-4 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                href={redirectTo ? `/auth/login?redirect=${encodeURIComponent(redirectTo)}` : "/auth/login"}
                className="font-medium text-gold-600 hover:text-gold-700"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Help text */}
        <p className="mt-4 text-center text-xs text-gray-400">
          Need help? Contact{" "}
          <a href="mailto:admin@lighthouse-careers.com" className="text-navy-600 hover:underline">
            admin@lighthouse-careers.com
          </a>
        </p>
      </div>
    </div>
  );
}

function RegisterSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="size-8 animate-spin rounded-full border-2 border-navy-500 border-t-transparent" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterSkeleton />}>
      <RegisterContent />
    </Suspense>
  );
}
