"use client";

import * as React from "react";
import {
  Camera,
  Upload,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Eye,
  Save,
  Cloud,
  CloudOff,
  AlertCircle,
  CheckCircle2,
  X,
  Calendar,
  FileText,
  Shield,
  Briefcase,
  User,
  Heart,
  Globe,
  Ship,
  MapPin,
  DollarSign,
  Phone,
  Mail,
  Award,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Types
interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  isComplete: boolean;
  completionPercentage: number;
}

interface Certification {
  id: string;
  name: string;
  issuingAuthority: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate: string;
  document?: File;
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: Date;
}

// Position options
const positionOptions = [
  { value: "", label: "Select position..." },
  { value: "captain", label: "Captain" },
  { value: "first_officer", label: "First Officer" },
  { value: "second_officer", label: "Second Officer" },
  { value: "chief_engineer", label: "Chief Engineer" },
  { value: "second_engineer", label: "2nd Engineer" },
  { value: "third_engineer", label: "3rd Engineer" },
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
  { value: "purser", label: "Purser" },
];

const nationalityOptions = [
  { value: "", label: "Select nationality..." },
  { value: "GB", label: "British" },
  { value: "US", label: "American" },
  { value: "AU", label: "Australian" },
  { value: "NZ", label: "New Zealander" },
  { value: "ZA", label: "South African" },
  { value: "FR", label: "French" },
  { value: "IT", label: "Italian" },
  { value: "ES", label: "Spanish" },
  { value: "NL", label: "Dutch" },
  { value: "DE", label: "German" },
  { value: "HR", label: "Croatian" },
  { value: "PH", label: "Filipino" },
  { value: "UA", label: "Ukrainian" },
  { value: "PL", label: "Polish" },
  { value: "PT", label: "Portuguese" },
  { value: "CA", label: "Canadian" },
  { value: "IE", label: "Irish" },
  { value: "SE", label: "Swedish" },
  { value: "NO", label: "Norwegian" },
];

const yachtTypeOptions = [
  { value: "motor", label: "Motor Yacht" },
  { value: "sailing", label: "Sailing Yacht" },
  { value: "catamaran", label: "Catamaran" },
  { value: "explorer", label: "Explorer Yacht" },
];

const contractTypeOptions = [
  { value: "permanent", label: "Permanent" },
  { value: "rotational", label: "Rotational" },
  { value: "seasonal", label: "Seasonal" },
  { value: "temporary", label: "Temporary" },
];

const cruisingAreaOptions = [
  { value: "mediterranean", label: "Mediterranean" },
  { value: "caribbean", label: "Caribbean" },
  { value: "bahamas", label: "Bahamas" },
  { value: "south_pacific", label: "South Pacific" },
  { value: "indian_ocean", label: "Indian Ocean" },
  { value: "northern_europe", label: "Northern Europe" },
  { value: "alaska", label: "Alaska" },
  { value: "new_england", label: "New England" },
  { value: "australia", label: "Australia / NZ" },
  { value: "worldwide", label: "Worldwide" },
];

const certificationOptions = [
  { value: "stcw", label: "STCW Basic Safety Training" },
  { value: "eng1", label: "ENG1 Medical Certificate" },
  { value: "food_safety_l2", label: "Food Safety Level 2" },
  { value: "food_safety_l3", label: "Food Safety Level 3" },
  { value: "wset_l1", label: "WSET Level 1" },
  { value: "wset_l2", label: "WSET Level 2" },
  { value: "wset_l3", label: "WSET Level 3" },
  { value: "powerboat_l2", label: "Powerboat Level 2" },
  { value: "pwc", label: "PWC License" },
  { value: "padi_ow", label: "PADI Open Water" },
  { value: "padi_dm", label: "PADI Divemaster" },
  { value: "yachtmaster", label: "Yachtmaster" },
  { value: "gmdss", label: "GMDSS" },
  { value: "master_3000gt", label: "Master 3000GT" },
  { value: "oow_3000gt", label: "OOW 3000GT" },
  { value: "y4_engineering", label: "Y4 Engineering" },
  { value: "y3_engineering", label: "Y3 Engineering" },
];

// Helper Components
function FormSection({
  id,
  title,
  icon,
  isOpen,
  isComplete,
  completionPercentage,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  isComplete: boolean;
  completionPercentage: number;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-full",
              isComplete ? "bg-success-100" : "bg-gray-100"
            )}
          >
            {isComplete ? (
              <CheckCircle2 className="size-5 text-success-600" />
            ) : (
              <span className={cn("text-gray-500")}>{icon}</span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-navy-900">{title}</h3>
            <p className="text-sm text-gray-500">
              {isComplete ? "Complete" : `${completionPercentage}% complete`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isComplete && (
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-gold-500 transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          )}
          {isOpen ? (
            <ChevronUp className="size-5 text-gray-400" />
          ) : (
            <ChevronDown className="size-5 text-gray-400" />
          )}
        </div>
      </button>
      {isOpen && <div className="border-t border-gray-100 px-6 py-6">{children}</div>}
    </div>
  );
}

function FormField({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-error-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && (
        <p className="mt-1 flex items-center gap-1 text-xs text-error-600">
          <AlertCircle className="size-3" />
          {error}
        </p>
      )}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  disabled,
  prefix,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  error?: boolean;
  disabled?: boolean;
  prefix?: React.ReactNode;
}) {
  return (
    <div className="relative">
      {prefix && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          {prefix}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "h-10 w-full rounded-lg border bg-white px-3 text-sm transition-colors",
          "placeholder:text-gray-400 focus:outline-none focus:ring-2",
          error
            ? "border-error-300 focus:border-error-500 focus:ring-error-500/20"
            : "border-gray-300 focus:border-gold-500 focus:ring-gold-500/20",
          prefix && "pl-10",
          disabled && "bg-gray-50 text-gray-500"
        )}
      />
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-10 w-full appearance-none rounded-lg border bg-white px-3 text-sm transition-colors",
        "focus:outline-none focus:ring-2",
        error
          ? "border-error-300 focus:border-error-500 focus:ring-error-500/20"
          : "border-gray-300 focus:border-gold-500 focus:ring-gold-500/20"
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function MultiSelect({
  value,
  onChange,
  options,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  options: { value: string; label: string }[];
}) {
  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => toggleOption(option.value)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
            value.includes(option.value)
              ? "border-gold-500 bg-gold-50 text-gold-700"
              : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
          )}
        >
          {value.includes(option.value) && <Check className="mr-1 inline size-3" />}
          {option.label}
        </button>
      ))}
    </div>
  );
}

function RangeSlider({
  min,
  max,
  value,
  onChange,
  formatValue,
  unit,
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatValue?: (val: number) => string;
  unit?: string;
}) {
  const format = formatValue || ((v) => v.toString());

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-medium text-navy-900">
          {format(value[0])}
          {unit}
        </span>
        <span className="text-gray-400">to</span>
        <span className="font-medium text-navy-900">
          {format(value[1])}
          {unit}
        </span>
      </div>
      <div className="relative h-2">
        <div className="absolute inset-0 rounded-full bg-gray-200" />
        <div
          className="absolute h-full rounded-full bg-gold-500"
          style={{
            left: `${((value[0] - min) / (max - min)) * 100}%`,
            right: `${100 - ((value[1] - min) / (max - min)) * 100}%`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value[0]}
          onChange={(e) => onChange([Math.min(Number(e.target.value), value[1] - 1), value[1]])}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gold-500"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value[1]}
          onChange={(e) => onChange([value[0], Math.max(Number(e.target.value), value[0] + 1)])}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gold-500"
        />
      </div>
    </div>
  );
}

function RadioGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
            value === option.value
              ? "border-gold-500 bg-gold-50 text-gold-700"
              : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
          )}
        >
          <input
            type="radio"
            name="radio"
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
          />
          <div
            className={cn(
              "flex size-4 items-center justify-center rounded-full border-2",
              value === option.value ? "border-gold-500" : "border-gray-300"
            )}
          >
            {value === option.value && <div className="size-2 rounded-full bg-gold-500" />}
          </div>
          {option.label}
        </label>
      ))}
    </div>
  );
}

// Main Component
export default function ProfileEditPage() {
  // Section states
  const [openSection, setOpenSection] = React.useState<string>("personal");

  // Auto-save state
  const [saveStatus, setSaveStatus] = React.useState<"saved" | "saving" | "error">("saved");
  const [lastSaved, setLastSaved] = React.useState<Date>(new Date());

  // Form state - Personal Information
  const [firstName, setFirstName] = React.useState("Sarah");
  const [lastName, setLastName] = React.useState("Johnson");
  const [dateOfBirth, setDateOfBirth] = React.useState("1992-06-15");
  const [nationality, setNationality] = React.useState("GB");
  const [secondNationality, setSecondNationality] = React.useState("FR");
  const [gender, setGender] = React.useState("female");
  const [phone, setPhone] = React.useState("+33 6 12 34 56 78");
  const [whatsapp, setWhatsapp] = React.useState("+33 6 12 34 56 78");
  const [email, setEmail] = React.useState("sarah.johnson@email.com");
  const [emailVerified] = React.useState(true);
  const [currentLocation, setCurrentLocation] = React.useState("Antibes, France");

  // Professional Details
  const [primaryPosition, setPrimaryPosition] = React.useState("chief_stewardess");
  const [secondaryPosition, setSecondaryPosition] = React.useState("purser");
  const [yearsExperience, setYearsExperience] = React.useState("8");
  const [yachtTypesWorked, setYachtTypesWorked] = React.useState(["motor", "sailing"]);
  const [yachtSizeExperience, setYachtSizeExperience] = React.useState<[number, number]>([40, 90]);
  const [notableEmployers, setNotableEmployers] = React.useState(
    "M/Y Serenity (72m) - 2 years\nM/Y Azure Dream (55m) - 1.5 years"
  );

  // Work Preferences
  const [contractTypes, setContractTypes] = React.useState(["permanent", "rotational"]);
  const [preferredYachtSize, setPreferredYachtSize] = React.useState<[number, number]>([50, 80]);
  const [preferredYachtType, setPreferredYachtType] = React.useState("motor");
  const [preferredAreas, setPreferredAreas] = React.useState(["mediterranean", "caribbean"]);
  const [salaryCurrency, setSalaryCurrency] = React.useState("EUR");
  const [salaryMin, setSalaryMin] = React.useState("6500");
  const [salaryMax, setSalaryMax] = React.useState("8000");

  // Certifications
  const [certifications, setCertifications] = React.useState<Certification[]>([
    {
      id: "1",
      name: "stcw",
      issuingAuthority: "MCA",
      certificateNumber: "STCW-2020-12345",
      issueDate: "2020-03-10",
      expiryDate: "2025-03-10",
    },
    {
      id: "2",
      name: "eng1",
      issuingAuthority: "MCA",
      certificateNumber: "ENG1-2024-67890",
      issueDate: "2024-01-15",
      expiryDate: "2026-01-15",
    },
  ]);
  const [hasSchengen, setHasSchengen] = React.useState(true);
  const [hasB1B2, setHasB1B2] = React.useState(true);
  const [hasENG1, setHasENG1] = React.useState(true);
  const [eng1Expiry, setEng1Expiry] = React.useState("2026-01-15");

  // Personal Details
  const [smoker, setSmoker] = React.useState("no");
  const [hasTattoos, setHasTattoos] = React.useState("no");
  const [tattooLocation, setTattooLocation] = React.useState("");
  const [maritalStatus, setMaritalStatus] = React.useState("single");
  const [couplePosition, setCouplePosition] = React.useState("no");
  const [partnerName, setPartnerName] = React.useState("");
  const [partnerPosition, setPartnerPosition] = React.useState("");

  // Documents
  const [documents, setDocuments] = React.useState<Document[]>([
    {
      id: "1",
      name: "Sarah_Johnson_CV_2024.pdf",
      type: "CV",
      size: "245 KB",
      uploadDate: new Date("2024-11-01"),
    },
  ]);
  const [isDragging, setIsDragging] = React.useState(false);

  // Calculate section completeness
  const sections: Section[] = [
    {
      id: "personal",
      title: "Personal Information",
      icon: <User className="size-5" />,
      isComplete: Boolean(firstName && lastName && dateOfBirth && nationality && email && phone),
      completionPercentage:
        [firstName, lastName, dateOfBirth, nationality, email, phone, currentLocation].filter(
          Boolean
        ).length * 14,
    },
    {
      id: "professional",
      title: "Professional Details",
      icon: <Briefcase className="size-5" />,
      isComplete: Boolean(primaryPosition && yearsExperience && yachtTypesWorked.length > 0),
      completionPercentage:
        [primaryPosition, yearsExperience, yachtTypesWorked.length > 0, notableEmployers].filter(
          Boolean
        ).length * 25,
    },
    {
      id: "preferences",
      title: "Work Preferences",
      icon: <Ship className="size-5" />,
      isComplete: Boolean(contractTypes.length > 0 && preferredAreas.length > 0 && salaryMin),
      completionPercentage:
        [contractTypes.length > 0, preferredYachtType, preferredAreas.length > 0, salaryMin].filter(
          Boolean
        ).length * 25,
    },
    {
      id: "certifications",
      title: "Certifications & Visas",
      icon: <Award className="size-5" />,
      isComplete: certifications.length > 0 && hasENG1,
      completionPercentage: Math.min(
        100,
        certifications.length * 20 + (hasSchengen ? 20 : 0) + (hasB1B2 ? 20 : 0) + (hasENG1 ? 20 : 0)
      ),
    },
    {
      id: "details",
      title: "Personal Details",
      icon: <Heart className="size-5" />,
      isComplete: Boolean(smoker && hasTattoos),
      completionPercentage: [smoker, hasTattoos, maritalStatus].filter(Boolean).length * 33,
    },
    {
      id: "documents",
      title: "Documents",
      icon: <FileText className="size-5" />,
      isComplete: documents.length > 0,
      completionPercentage: Math.min(100, documents.length * 33),
    },
  ];

  const overallProgress = Math.round(
    sections.reduce((acc, s) => acc + s.completionPercentage, 0) / sections.length
  );

  // Auto-save simulation
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSaveStatus("saving");
      setTimeout(() => {
        setSaveStatus("saved");
        setLastSaved(new Date());
      }, 1000);
    }, 2000);
    return () => clearTimeout(timer);
  }, [
    firstName,
    lastName,
    primaryPosition,
    yearsExperience,
    salaryMin,
    salaryMax,
    smoker,
    hasTattoos,
  ]);

  const addCertification = () => {
    setCertifications([
      ...certifications,
      {
        id: Date.now().toString(),
        name: "",
        issuingAuthority: "",
        certificateNumber: "",
        issueDate: "",
        expiryDate: "",
      },
    ]);
  };

  const removeCertification = (id: string) => {
    setCertifications(certifications.filter((c) => c.id !== id));
  };

  const updateCertification = (id: string, field: keyof Certification, value: string) => {
    setCertifications(
      certifications.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const removeDocument = (id: string) => {
    setDocuments(documents.filter((d) => d.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-serif font-semibold text-navy-800">Edit Profile</h1>
              <p className="text-sm text-gray-500">Complete your profile to get better job matches</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Save Status */}
              <div className="flex items-center gap-2 text-sm">
                {saveStatus === "saved" && (
                  <>
                    <Cloud className="size-4 text-success-500" />
                    <span className="text-gray-500">
                      Saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </>
                )}
                {saveStatus === "saving" && (
                  <>
                    <Cloud className="size-4 animate-pulse text-gold-500" />
                    <span className="text-gold-600">Saving...</span>
                  </>
                )}
                {saveStatus === "error" && (
                  <>
                    <CloudOff className="size-4 text-error-500" />
                    <span className="text-error-600">Error saving</span>
                  </>
                )}
              </div>

              <Button variant="secondary" size="sm" leftIcon={<Eye className="size-4" />}>
                Preview Profile
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-navy-900">Profile Completion</span>
              <span className="font-bold text-gold-600">{overallProgress}%</span>
            </div>
            <div className="flex h-2 gap-1 overflow-hidden rounded-full bg-gray-100">
              {sections.map((section, idx) => (
                <div
                  key={section.id}
                  className="flex-1 overflow-hidden"
                >
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      section.isComplete
                        ? "bg-success-500"
                        : section.completionPercentage > 50
                        ? "bg-gold-500"
                        : section.completionPercentage > 0
                        ? "bg-gold-300"
                        : "bg-gray-200"
                    )}
                    style={{ width: `${section.completionPercentage}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-400">
              {sections.map((section) => (
                <span
                  key={section.id}
                  className={cn(section.isComplete && "text-success-600 font-medium")}
                >
                  {section.isComplete ? "✓" : ""}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-6">
        <div className="space-y-4">
          {/* Personal Information */}
          <FormSection
            id="personal"
            title="Personal Information"
            icon={<User className="size-5" />}
            isOpen={openSection === "personal"}
            isComplete={sections[0].isComplete}
            completionPercentage={sections[0].completionPercentage}
            onToggle={() => setOpenSection(openSection === "personal" ? "" : "personal")}
          >
            {/* Profile Photo */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">Profile Photo</label>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-navy-100 to-navy-200 text-2xl font-bold text-navy-600">
                    {firstName[0]}
                    {lastName[0]}
                  </div>
                  <button className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-gold-500 text-white shadow-md hover:bg-gold-600">
                    <Camera className="size-4" />
                  </button>
                </div>
                <div>
                  <Button variant="secondary" size="sm" leftIcon={<Upload className="size-4" />}>
                    Upload Photo
                  </Button>
                  <p className="mt-2 text-xs text-gray-500">JPG or PNG, max 5MB. Square photos work best.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField label="First Name" required>
                <TextInput
                  value={firstName}
                  onChange={setFirstName}
                  placeholder="Enter first name"
                />
              </FormField>

              <FormField label="Last Name" required>
                <TextInput
                  value={lastName}
                  onChange={setLastName}
                  placeholder="Enter last name"
                />
              </FormField>

              <FormField label="Date of Birth" required>
                <TextInput
                  type="date"
                  value={dateOfBirth}
                  onChange={setDateOfBirth}
                />
              </FormField>

              <FormField label="Gender">
                <SelectInput
                  value={gender}
                  onChange={setGender}
                  options={[
                    { value: "", label: "Select gender..." },
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "other", label: "Other" },
                    { value: "prefer_not", label: "Prefer not to say" },
                  ]}
                />
              </FormField>

              <FormField label="Nationality" required>
                <SelectInput
                  value={nationality}
                  onChange={setNationality}
                  options={nationalityOptions}
                />
              </FormField>

              <FormField label="Second Nationality">
                <SelectInput
                  value={secondNationality}
                  onChange={setSecondNationality}
                  options={[{ value: "", label: "None" }, ...nationalityOptions.slice(1)]}
                />
              </FormField>

              <FormField label="Phone Number" required>
                <TextInput
                  value={phone}
                  onChange={setPhone}
                  placeholder="+1 234 567 8900"
                  prefix={<Phone className="size-4 text-gray-400" />}
                />
              </FormField>

              <FormField label="WhatsApp Number">
                <TextInput
                  value={whatsapp}
                  onChange={setWhatsapp}
                  placeholder="+1 234 567 8900"
                />
              </FormField>

              <FormField label="Email Address" required>
                <div className="relative">
                  <TextInput
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="email@example.com"
                    prefix={<Mail className="size-4 text-gray-400" />}
                  />
                  {emailVerified && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="flex items-center gap-1 rounded-full bg-success-100 px-2 py-0.5 text-xs font-medium text-success-700">
                        <CheckCircle2 className="size-3" />
                        Verified
                      </span>
                    </div>
                  )}
                </div>
              </FormField>

              <FormField label="Current Location">
                <TextInput
                  value={currentLocation}
                  onChange={setCurrentLocation}
                  placeholder="City, Country"
                  prefix={<MapPin className="size-4 text-gray-400" />}
                />
              </FormField>
            </div>
          </FormSection>

          {/* Professional Details */}
          <FormSection
            id="professional"
            title="Professional Details"
            icon={<Briefcase className="size-5" />}
            isOpen={openSection === "professional"}
            isComplete={sections[1].isComplete}
            completionPercentage={sections[1].completionPercentage}
            onToggle={() => setOpenSection(openSection === "professional" ? "" : "professional")}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField label="Primary Position" required>
                  <SelectInput
                    value={primaryPosition}
                    onChange={setPrimaryPosition}
                    options={positionOptions}
                  />
                </FormField>

                <FormField label="Secondary Position">
                  <SelectInput
                    value={secondaryPosition}
                    onChange={setSecondaryPosition}
                    options={positionOptions}
                  />
                </FormField>

                <FormField label="Years of Experience" required>
                  <TextInput
                    type="number"
                    value={yearsExperience}
                    onChange={setYearsExperience}
                    placeholder="e.g. 5"
                  />
                </FormField>
              </div>

              <FormField label="Yacht Types Worked">
                <MultiSelect
                  value={yachtTypesWorked}
                  onChange={setYachtTypesWorked}
                  options={yachtTypeOptions}
                />
              </FormField>

              <FormField label="Yacht Size Experience (meters)">
                <RangeSlider
                  min={20}
                  max={150}
                  value={yachtSizeExperience}
                  onChange={setYachtSizeExperience}
                  unit="m"
                />
              </FormField>

              <FormField label="Notable Yachts / Employers" hint="List your most notable placements">
                <textarea
                  value={notableEmployers}
                  onChange={(e) => setNotableEmployers(e.target.value)}
                  rows={4}
                  placeholder="e.g. M/Y Serenity (72m) - 2 years as Chief Stewardess"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                />
              </FormField>
            </div>
          </FormSection>

          {/* Work Preferences */}
          <FormSection
            id="preferences"
            title="Work Preferences"
            icon={<Ship className="size-5" />}
            isOpen={openSection === "preferences"}
            isComplete={sections[2].isComplete}
            completionPercentage={sections[2].completionPercentage}
            onToggle={() => setOpenSection(openSection === "preferences" ? "" : "preferences")}
          >
            <div className="space-y-6">
              <FormField label="Contract Types">
                <MultiSelect
                  value={contractTypes}
                  onChange={setContractTypes}
                  options={contractTypeOptions}
                />
              </FormField>

              <FormField label="Preferred Yacht Size (meters)">
                <RangeSlider
                  min={20}
                  max={150}
                  value={preferredYachtSize}
                  onChange={setPreferredYachtSize}
                  unit="m"
                />
              </FormField>

              <FormField label="Preferred Yacht Type">
                <SelectInput
                  value={preferredYachtType}
                  onChange={setPreferredYachtType}
                  options={[{ value: "", label: "No preference" }, ...yachtTypeOptions]}
                />
              </FormField>

              <FormField label="Preferred Cruising Areas">
                <MultiSelect
                  value={preferredAreas}
                  onChange={setPreferredAreas}
                  options={cruisingAreaOptions}
                />
              </FormField>

              <FormField label="Salary Expectations (monthly)">
                <div className="flex items-center gap-3">
                  <SelectInput
                    value={salaryCurrency}
                    onChange={setSalaryCurrency}
                    options={[
                      { value: "EUR", label: "EUR €" },
                      { value: "USD", label: "USD $" },
                      { value: "GBP", label: "GBP £" },
                    ]}
                  />
                  <TextInput
                    type="number"
                    value={salaryMin}
                    onChange={setSalaryMin}
                    placeholder="Min"
                    prefix={<DollarSign className="size-4 text-gray-400" />}
                  />
                  <span className="text-gray-400">to</span>
                  <TextInput
                    type="number"
                    value={salaryMax}
                    onChange={setSalaryMax}
                    placeholder="Max"
                    prefix={<DollarSign className="size-4 text-gray-400" />}
                  />
                </div>
              </FormField>
            </div>
          </FormSection>

          {/* Certifications & Visas */}
          <FormSection
            id="certifications"
            title="Certifications & Visas"
            icon={<Award className="size-5" />}
            isOpen={openSection === "certifications"}
            isComplete={sections[3].isComplete}
            completionPercentage={sections[3].completionPercentage}
            onToggle={() => setOpenSection(openSection === "certifications" ? "" : "certifications")}
          >
            <div className="space-y-6">
              {/* Certifications List */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Certifications</label>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Plus className="size-4" />}
                    onClick={addCertification}
                  >
                    Add Certification
                  </Button>
                </div>

                <div className="space-y-4">
                  {certifications.map((cert, index) => (
                    <div key={cert.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-navy-900">
                          Certification {index + 1}
                        </span>
                        <button
                          onClick={() => removeCertification(cert.id)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-error-500"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">Certification Type</label>
                          <SelectInput
                            value={cert.name}
                            onChange={(v) => updateCertification(cert.id, "name", v)}
                            options={[{ value: "", label: "Select..." }, ...certificationOptions]}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">Issuing Authority</label>
                          <TextInput
                            value={cert.issuingAuthority}
                            onChange={(v) => updateCertification(cert.id, "issuingAuthority", v)}
                            placeholder="e.g. MCA"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">Certificate Number</label>
                          <TextInput
                            value={cert.certificateNumber}
                            onChange={(v) => updateCertification(cert.id, "certificateNumber", v)}
                            placeholder="Certificate number"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">Issue Date</label>
                            <TextInput
                              type="date"
                              value={cert.issueDate}
                              onChange={(v) => updateCertification(cert.id, "issueDate", v)}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">Expiry Date</label>
                            <TextInput
                              type="date"
                              value={cert.expiryDate}
                              onChange={(v) => updateCertification(cert.id, "expiryDate", v)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <button className="flex items-center gap-2 text-sm text-gold-600 hover:text-gold-700">
                          <Upload className="size-4" />
                          Upload scan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visas */}
              <div className="border-t border-gray-200 pt-6">
                <label className="mb-4 block text-sm font-medium text-gray-700">Visas & Work Permits</label>
                <div className="space-y-4">
                  <label className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <Globe className="size-5 text-navy-500" />
                      <div>
                        <p className="font-medium text-navy-900">Schengen Visa</p>
                        <p className="text-xs text-gray-500">Valid for EU countries</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setHasSchengen(!hasSchengen)}
                      className={cn(
                        "relative h-6 w-11 rounded-full transition-colors",
                        hasSchengen ? "bg-success-500" : "bg-gray-300"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
                          hasSchengen ? "left-[22px]" : "left-0.5"
                        )}
                      />
                    </button>
                  </label>

                  <label className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <Globe className="size-5 text-navy-500" />
                      <div>
                        <p className="font-medium text-navy-900">B1/B2 Visa (USA)</p>
                        <p className="text-xs text-gray-500">US business/tourist visa</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setHasB1B2(!hasB1B2)}
                      className={cn(
                        "relative h-6 w-11 rounded-full transition-colors",
                        hasB1B2 ? "bg-success-500" : "bg-gray-300"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
                          hasB1B2 ? "left-[22px]" : "left-0.5"
                        )}
                      />
                    </button>
                  </label>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shield className="size-5 text-navy-500" />
                        <div>
                          <p className="font-medium text-navy-900">ENG1 Medical Certificate</p>
                          <p className="text-xs text-gray-500">Maritime medical fitness</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setHasENG1(!hasENG1)}
                        className={cn(
                          "relative h-6 w-11 rounded-full transition-colors",
                          hasENG1 ? "bg-success-500" : "bg-gray-300"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
                            hasENG1 ? "left-[22px]" : "left-0.5"
                          )}
                        />
                      </button>
                    </div>
                    {hasENG1 && (
                      <div className="mt-3 flex items-center gap-3">
                        <label className="text-sm text-gray-500">Expiry Date:</label>
                        <input
                          type="date"
                          value={eng1Expiry}
                          onChange={(e) => setEng1Expiry(e.target.value)}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </FormSection>

          {/* Personal Details */}
          <FormSection
            id="details"
            title="Personal Details"
            icon={<Heart className="size-5" />}
            isOpen={openSection === "details"}
            isComplete={sections[4].isComplete}
            completionPercentage={sections[4].completionPercentage}
            onToggle={() => setOpenSection(openSection === "details" ? "" : "details")}
          >
            <div className="space-y-6">
              <FormField label="Smoker">
                <RadioGroup
                  value={smoker}
                  onChange={setSmoker}
                  options={[
                    { value: "no", label: "No" },
                    { value: "yes", label: "Yes" },
                    { value: "social", label: "Social Only" },
                  ]}
                />
              </FormField>

              <FormField label="Visible Tattoos">
                <RadioGroup
                  value={hasTattoos}
                  onChange={setHasTattoos}
                  options={[
                    { value: "no", label: "No" },
                    { value: "yes", label: "Yes" },
                  ]}
                />
                {hasTattoos === "yes" && (
                  <div className="mt-3">
                    <TextInput
                      value={tattooLocation}
                      onChange={setTattooLocation}
                      placeholder="Location of visible tattoos (e.g. forearm, wrist)"
                    />
                  </div>
                )}
              </FormField>

              <FormField label="Marital Status">
                <SelectInput
                  value={maritalStatus}
                  onChange={setMaritalStatus}
                  options={[
                    { value: "single", label: "Single" },
                    { value: "married", label: "Married" },
                    { value: "divorced", label: "Divorced" },
                    { value: "partnered", label: "In a Relationship" },
                  ]}
                />
              </FormField>

              <FormField label="Couple Position" hint="Are you seeking a position as part of a couple?">
                <RadioGroup
                  value={couplePosition}
                  onChange={setCouplePosition}
                  options={[
                    { value: "no", label: "No" },
                    { value: "yes", label: "Yes" },
                    { value: "flexible", label: "Flexible" },
                  ]}
                />
                {couplePosition === "yes" && (
                  <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">Partner's Name</label>
                      <TextInput
                        value={partnerName}
                        onChange={setPartnerName}
                        placeholder="Partner's full name"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">Partner's Position</label>
                      <SelectInput
                        value={partnerPosition}
                        onChange={setPartnerPosition}
                        options={positionOptions}
                      />
                    </div>
                  </div>
                )}
              </FormField>
            </div>
          </FormSection>

          {/* Documents */}
          <FormSection
            id="documents"
            title="Documents"
            icon={<FileText className="size-5" />}
            isOpen={openSection === "documents"}
            isComplete={sections[5].isComplete}
            completionPercentage={sections[5].completionPercentage}
            onToggle={() => setOpenSection(openSection === "documents" ? "" : "documents")}
          >
            <div className="space-y-6">
              {/* Upload Zone */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  CV / Resume <span className="text-error-500">*</span>
                </label>
                <div
                  onDragEnter={() => setIsDragging(true)}
                  onDragLeave={() => setIsDragging(false)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => setIsDragging(false)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors",
                    isDragging
                      ? "border-gold-500 bg-gold-50"
                      : "border-gray-300 bg-gray-50 hover:border-gray-400"
                  )}
                >
                  <Upload className={cn("size-10", isDragging ? "text-gold-500" : "text-gray-400")} />
                  <p className="mt-3 text-sm font-medium text-gray-700">
                    Drag and drop your CV here, or{" "}
                    <button className="text-gold-600 hover:text-gold-700">browse</button>
                  </p>
                  <p className="mt-1 text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                </div>
              </div>

              {/* Uploaded Documents */}
              {documents.length > 0 && (
                <div>
                  <label className="mb-3 block text-sm font-medium text-gray-700">
                    Uploaded Documents
                  </label>
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-navy-100">
                            <FileText className="size-5 text-navy-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-navy-900">{doc.name}</p>
                            <p className="text-xs text-gray-500">
                              {doc.type} • {doc.size} • Uploaded{" "}
                              {doc.uploadDate.toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                            <Eye className="size-4" />
                          </button>
                          <button
                            onClick={() => removeDocument(doc.id)}
                            className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-error-500"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Documents */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Additional Documents
                </label>
                <p className="mb-3 text-xs text-gray-500">
                  Upload references, certificates, or other supporting documents
                </p>
                <Button variant="secondary" size="sm" leftIcon={<Plus className="size-4" />}>
                  Add Document
                </Button>
              </div>
            </div>
          </FormSection>
        </div>

        {/* Bottom Actions */}
        <div className="mt-6 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {saveStatus === "saved" && (
              <>
                <CheckCircle2 className="size-4 text-success-500" />
                All changes saved
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" leftIcon={<Eye className="size-4" />}>
              Preview Profile
            </Button>
            <Button variant="primary" leftIcon={<Save className="size-4" />}>
              Save & Continue
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
