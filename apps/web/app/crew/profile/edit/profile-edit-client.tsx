"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Cloud,
  CloudOff,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Sliders,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  type ProfileData,
  type CertificationData,
  updatePersonalInfo,
  updateProfessionalDetails,
  updateSpecialCircumstances,
  updateCertificationStatus,
  updateCertificationChecklist,
} from "../actions";
import { StepNavigator } from "@/components/profile/StepNavigator";
import { type ProfileStep, type CandidateType, profileSteps, nationalityOptions } from "@/components/profile/constants";
import { PersonalInfoForm } from "@/components/profile/PersonalInfoForm";
import { type LocationData, parseLocationString } from "@/components/ui/LocationInput";
import { ProfessionalDetailsForm } from "@/components/profile/ProfessionalDetailsForm";
import { CertificationsForm } from "@/components/profile/CertificationsForm";
import { PersonalDetailsForm } from "@/components/profile/PersonalDetailsForm";
import { ProfileCompletionCard } from "@/components/profile/ProfileCompletionCard";
import { calculateProfileCompletion } from "@/lib/profile-completion";

// Position options by candidate type
const basePositionOption = { value: "", label: "Select position..." };

const yachtCrewPositions = [
  // Yacht Crew - Deck
  { value: "captain", label: "Captain" },
  { value: "first_officer", label: "First Officer" },
  { value: "second_officer", label: "Second Officer" },
  { value: "bosun", label: "Bosun" },
  { value: "lead_deckhand", label: "Lead Deckhand" },
  { value: "deckhand", label: "Deckhand" },
  // Yacht Crew - Engineering
  { value: "chief_engineer", label: "Chief Engineer" },
  { value: "second_engineer", label: "2nd Engineer" },
  { value: "third_engineer", label: "3rd Engineer" },
  { value: "eto", label: "ETO" },
  // Yacht Crew - Interior
  { value: "chief_stewardess", label: "Chief Stewardess" },
  { value: "second_stewardess", label: "2nd Stewardess" },
  { value: "third_stewardess", label: "3rd Stewardess" },
  { value: "stewardess", label: "Stewardess" },
  { value: "purser", label: "Purser" },
];

const culinaryPositions = [
  { value: "head_chef", label: "Head Chef" },
  { value: "sous_chef", label: "Sous Chef" },
  { value: "chef", label: "Chef" },
  { value: "private_chef", label: "Private Chef" },
];

const householdPositions = [
  { value: "estate_manager", label: "Estate Manager" },
  { value: "house_manager", label: "House Manager" },
  { value: "butler", label: "Butler" },
  { value: "head_housekeeper", label: "Head Housekeeper" },
  { value: "housekeeper", label: "Housekeeper" },
  { value: "personal_assistant", label: "Personal Assistant" },
  { value: "nanny", label: "Nanny" },
  { value: "governess", label: "Governess" },
  { value: "chauffeur", label: "Chauffeur" },
  { value: "security", label: "Security / Close Protection" },
  { value: "gardener", label: "Gardener / Groundskeeper" },
  { value: "maintenance", label: "Maintenance / Handyman" },
  { value: "laundress", label: "Laundress" },
  { value: "couple", label: "Couple (Combined Roles)" },
];

const otherPositions = [{ value: "other", label: "Other" }];

const positionOptionsByType: Record<CandidateType, { value: string; label: string }[]> = {
  yacht_crew: [basePositionOption, ...yachtCrewPositions, ...culinaryPositions],
  household_staff: [basePositionOption, ...householdPositions, ...culinaryPositions],
  both: [basePositionOption, ...yachtCrewPositions, ...culinaryPositions, ...householdPositions],
  other: [basePositionOption, ...otherPositions],
};

// Vessel & Property Type options
const vesselPropertyTypeOptions = [
  // Yacht Types
  { value: "motor", label: "Motor Yacht" },
  { value: "sailing", label: "Sailing Yacht" },
  { value: "catamaran", label: "Catamaran" },
  { value: "explorer", label: "Explorer Yacht" },
  // Property Types
  { value: "private_estate", label: "Private Estate" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse / Apartment" },
  { value: "chalet", label: "Ski Chalet" },
  { value: "country_house", label: "Country House" },
  { value: "city_residence", label: "City Residence" },
];

const licenceOptions = [
  { value: "", label: "Select licence..." },
  { value: "yachtmaster_offshore", label: "Yachtmaster Offshore" },
  { value: "yachtmaster_ocean", label: "Yachtmaster Ocean" },
  { value: "master_200gt", label: "Master 200GT" },
  { value: "master_500gt", label: "Master 500GT" },
  { value: "master_3000gt", label: "Master 3000GT" },
  { value: "master_unlimited", label: "Master Unlimited" },
  { value: "oow_500gt", label: "OOW 500GT" },
  { value: "oow_3000gt", label: "OOW 3000GT" },
  { value: "oow_unlimited", label: "OOW Unlimited" },
  { value: "y4_engineer", label: "Y4 Engineer" },
  { value: "y3_engineer", label: "Y3 Engineer" },
  { value: "y2_engineer", label: "Y2 Engineer" },
  { value: "y1_engineer", label: "Y1 Engineer" },
  { value: "eoow", label: "EOOW" },
  { value: "chief_engineer_3000kw", label: "Chief Engineer 3000kW" },
  { value: "chief_engineer_unlimited", label: "Chief Engineer Unlimited" },
  { value: "powerboat_l2", label: "Powerboat Level 2" },
  { value: "jetski", label: "Jetski License" },
  { value: "none", label: "No formal licence" },
];

// Helper Components
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
  unit,
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  unit?: string;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-medium text-navy-900">
          {value[0]}
          {unit}
        </span>
        <span className="text-gray-400">to</span>
        <span className="font-medium text-navy-900">
          {value[1]}
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
  name,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  name: string;
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
            name={name}
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
type PersonalStepErrors = Partial<{
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  phone: string;
  email: string;
}>;

type ProfessionalStepErrors = Partial<{
  candidateType: string;
  primaryPosition: string;
  otherRoleDetails: string;
}>;

export function ProfileEditClient({
  data,
  redirectTo,
}: {
  data: ProfileData;
  redirectTo?: string;
}) {
  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : null;
  const { candidate, documents } = data;
  const initialCandidateType: CandidateType =
    candidate.candidateType === "household_staff" ||
    candidate.candidateType === "both" ||
    candidate.candidateType === "other"
      ? candidate.candidateType
      : "yacht_crew";

  // Wizard state
  const [currentStep, setCurrentStep] = React.useState<ProfileStep>("personal");
  const router = useRouter();
  const steps = profileSteps;
  const [stepErrors, setStepErrors] = React.useState<{
    personal: PersonalStepErrors;
    professional: ProfessionalStepErrors;
    certifications: string;
    details: string;
  }>({
    personal: {},
    professional: {},
    certifications: "",
    details: "",
  });

  // Auto-save state
  const [saveStatus, setSaveStatus] = React.useState<"saved" | "saving" | "error">("saved");
  const [lastSaved, setLastSaved] = React.useState<Date>(new Date());
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  // Initialize with a marker to skip first save on mount
  const lastSavedDataRef = React.useRef<string>("__INITIAL_MOUNT__");

  // Refs to hold current form values for auto-save (avoids recreating callback on every state change)
  const formValuesRef = React.useRef({
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    email: candidate.email || "",
    phone: candidate.phone || "",
    whatsapp: candidate.whatsapp || "",
    dateOfBirth: candidate.dateOfBirth || "",
    gender: candidate.gender || "",
    nationality: candidate.nationality || "",
    secondNationality: candidate.secondNationality || "",
    currentLocation: candidate.currentLocation ? parseLocationString(candidate.currentLocation) : null as LocationData | null,
    candidateType: initialCandidateType as CandidateType,
    primaryPosition: candidate.primaryPosition || "",
    secondaryPositions: candidate.secondaryPositions || [] as string[],
    jobSearchNotes: candidate.jobSearchNotes || "",
    highestLicense: candidate.highestLicense || "",
    secondaryLicense: candidate.secondaryLicense || "",
    hasSTCW: candidate.hasStcw === true ? "yes" : candidate.hasStcw === false ? "no" : "",
    stcwExpiry: candidate.stcwExpiry || "",
    hasENG1: candidate.hasEng1 === true ? "yes" : candidate.hasEng1 === false ? "no" : "",
    eng1Expiry: candidate.eng1Expiry || "",
    hasSchengen: candidate.hasSchengen === true ? "yes" : candidate.hasSchengen === false ? "no" : "",
    schengenExpiry: candidate.schengenExpiry || "",
    hasB1B2: candidate.hasB1B2 === true ? "yes" : candidate.hasB1B2 === false ? "no" : "",
    b1b2Expiry: candidate.b1b2Expiry || "",
    certificationChecklist: [] as Array<{ type: string; hasIt: boolean; expiryDate?: string; customName?: string }>,
    smoker: candidate.isSmoker === true ? "yes" : candidate.isSmoker === false ? "no" : "",
    hasTattoos: candidate.hasTattoos === true ? "yes" : candidate.hasTattoos === false ? "no" : "",
    tattooLocation: candidate.tattooDescription || "",
    maritalStatus: candidate.maritalStatus || "",
    couplePosition: candidate.isCouplePosition === true ? "yes" : candidate.isCouplePosition === false ? "no" : "",
    partnerName: candidate.partnerName || "",
    partnerPosition: candidate.partnerPosition || "",
  });

  // Profile photo state (separate from form to allow instant UI update)
  const [profilePhotoUrl, setProfilePhotoUrl] = React.useState(candidate.profilePhotoUrl || "");

  // Form state - Personal Information
  const [firstName, setFirstName] = React.useState(candidate.firstName);
  const [lastName, setLastName] = React.useState(candidate.lastName);
  const [dateOfBirth, setDateOfBirth] = React.useState(candidate.dateOfBirth || "");
  const [nationality, setNationality] = React.useState(candidate.nationality || "");
  const [secondNationality, setSecondNationality] = React.useState(candidate.secondNationality || "");
  const [gender, setGender] = React.useState(candidate.gender || "");
  const [phone, setPhone] = React.useState(candidate.phone || "");
  const [whatsapp, setWhatsapp] = React.useState(candidate.whatsapp || "");
  const [email, setEmail] = React.useState(candidate.email || "");
  const [currentLocation, setCurrentLocation] = React.useState<LocationData | null>(
    candidate.currentLocation ? parseLocationString(candidate.currentLocation) : null
  );

  // Professional Details
  const [candidateType, setCandidateType] = React.useState<CandidateType>(initialCandidateType);
  const [primaryPosition, setPrimaryPosition] = React.useState(candidate.primaryPosition || "");
  const [secondaryPositions, setSecondaryPositions] = React.useState<string[]>(
    candidate.secondaryPositions || []
  );
  const [jobSearchNotes, setJobSearchNotes] = React.useState(candidate.jobSearchNotes || "");
  const [highestLicense, setHighestLicense] = React.useState(candidate.highestLicense || "");
  const [secondaryLicense, setSecondaryLicense] = React.useState(candidate.secondaryLicense || "");

  const currentPositionOptions = React.useMemo(
    () => positionOptionsByType[candidateType],
    [candidateType]
  );

  // Track the original primary position from database to preserve it
  const originalPrimaryPosition = React.useRef(candidate.primaryPosition || "");
  const isInitialMount = React.useRef(true);

  React.useEffect(() => {
    const allowedValues = new Set(currentPositionOptions.map((option) => option.value));

    // On initial mount, always preserve the position from database
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // If position exists in database, keep it even if not in current candidate type options
      // The position is valid - candidate type might just need to match
      return;
    }

    // After initial mount, only validate if user manually changes candidate type
    // Don't clear the position if it's the original from database
    if (primaryPosition && !allowedValues.has(primaryPosition)) {
      // Only clear if this is NOT the original position from registration/database
      if (primaryPosition !== originalPrimaryPosition.current) {
        setPrimaryPosition("");
      }
    }

    // Always filter secondary positions to match current candidate type
    setSecondaryPositions((prev) => prev.filter((value) => allowedValues.has(value)));
  }, [candidateType, currentPositionOptions, primaryPosition]);

  // Certification checklist (new pattern)
  const [certificationChecklist, setCertificationChecklist] = React.useState<
    Array<{
      type: string;
      hasIt: boolean;
      expiryDate?: string;
      customName?: string;
    }>
  >([]);

  // STCW and Visas (converted to string format for RadioGroup)
  const [hasSchengen, setHasSchengen] = React.useState(
    candidate.hasSchengen === true ? "yes" : candidate.hasSchengen === false ? "no" : ""
  );
  const [hasB1B2, setHasB1B2] = React.useState(
    candidate.hasB1B2 === true ? "yes" : candidate.hasB1B2 === false ? "no" : ""
  );
  const [hasENG1, setHasENG1] = React.useState(
    candidate.hasEng1 === true ? "yes" : candidate.hasEng1 === false ? "no" : ""
  );
  const [eng1Expiry, setEng1Expiry] = React.useState(candidate.eng1Expiry || "");
  const [hasSTCW, setHasSTCW] = React.useState(
    candidate.hasStcw === true ? "yes" : candidate.hasStcw === false ? "no" : ""
  );
  const [stcwExpiry, setStcwExpiry] = React.useState(candidate.stcwExpiry || "");
  const [schengenExpiry, setSchengenExpiry] = React.useState(candidate.schengenExpiry || "");
  const [b1b2Expiry, setB1b2Expiry] = React.useState(candidate.b1b2Expiry || "");

  // Personal Details
  const [smoker, setSmoker] = React.useState(
    candidate.isSmoker === true ? "yes" : candidate.isSmoker === false ? "no" : ""
  );
  const [hasTattoos, setHasTattoos] = React.useState(
    candidate.hasTattoos === true ? "yes" : candidate.hasTattoos === false ? "no" : ""
  );
  const [tattooLocation, setTattooLocation] = React.useState(candidate.tattooDescription || "");
  const [maritalStatus, setMaritalStatus] = React.useState(candidate.maritalStatus || "");
  const [couplePosition, setCouplePosition] = React.useState(
    candidate.isCouplePosition === true ? "yes" : candidate.isCouplePosition === false ? "no" : ""
  );
  const [partnerName, setPartnerName] = React.useState(candidate.partnerName || "");
  const [partnerPosition, setPartnerPosition] = React.useState(candidate.partnerPosition || "");

  // Documents
  const [isDragging, setIsDragging] = React.useState(false);

  const validateStep = React.useCallback(
    (step: ProfileStep) => {
      if (step === "personal") {
        const errors: PersonalStepErrors = {};
        if (!firstName.trim()) errors.firstName = "First name is required.";
        if (!lastName.trim()) errors.lastName = "Last name is required.";
        if (!dateOfBirth) errors.dateOfBirth = "Date of birth is required.";
        if (!nationality) errors.nationality = "Nationality is required.";
        if (!phone.trim()) errors.phone = "Phone number is required.";
        if (!email.trim()) errors.email = "Email address is required.";
        return { isValid: Object.keys(errors).length === 0, errors };
      }

      if (step === "professional") {
        const errors: ProfessionalStepErrors = {};
        if (!candidateType) errors.candidateType = "Role category is required.";
        if (!primaryPosition) errors.primaryPosition = "Primary position is required.";
        if (candidateType === "other" && !jobSearchNotes.trim()) {
          errors.otherRoleDetails = "Please describe your role.";
        }
        return { isValid: Object.keys(errors).length === 0, errors };
      }

      if (step === "certifications") {
        const isAnswered = (value: string) => value === "yes" || value === "no";
        let message = "";

        if (candidateType === "household_staff") {
          if (!isAnswered(hasSchengen)) {
            message = "Please confirm your Schengen visa status before continuing.";
          }
        } else if (candidateType === "other") {
          if (!isAnswered(hasSchengen) || !isAnswered(hasB1B2)) {
            message = "Please confirm your Schengen and B1/B2 visa status before continuing.";
          }
        } else if (candidateType === "yacht_crew" || candidateType === "both") {
          if (
            !isAnswered(hasSTCW) ||
            !isAnswered(hasENG1) ||
            !isAnswered(hasSchengen) ||
            !isAnswered(hasB1B2)
          ) {
            message =
              "Please confirm your STCW, ENG1, Schengen, and B1/B2 status before continuing.";
          }
        }

        return { isValid: message === "", message };
      }

      if (step === "details") {
        const filledFields =
          (smoker ? 1 : 0) +
          (hasTattoos ? 1 : 0) +
          (maritalStatus ? 1 : 0);
        if (filledFields < 2) {
          return {
            isValid: false,
            message: "Please complete at least two fields in this section before continuing.",
          };
        }
        return { isValid: true, message: "" };
      }

      return { isValid: true };
    },
    [
      firstName,
      lastName,
      dateOfBirth,
      nationality,
      phone,
      email,
      candidateType,
      primaryPosition,
      jobSearchNotes,
      hasSTCW,
      hasENG1,
      hasSchengen,
      hasB1B2,
      smoker,
      hasTattoos,
      maritalStatus,
    ]
  );

  // Load existing certifications from database
  React.useEffect(() => {
    async function loadCertifications() {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Three-tier candidate lookup pattern:
      // 1. Look up users table by auth_id to get internal user ID
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();

      let candidateId: string | null = null;

      // 2. If user found, look up candidate by user_id
      if (userData) {
        const { data: candidateByUserId } = await supabase
          .from("candidates")
          .select("id")
          .eq("user_id", userData.id)
          .maybeSingle();

        if (candidateByUserId) {
          candidateId = candidateByUserId.id;
        }
      }

      // 3. Fallback: look up candidate by email (for Vincere-imported candidates)
      if (!candidateId && user.email) {
        const { data: candidateByEmail } = await supabase
          .from("candidates")
          .select("id")
          .eq("email", user.email)
          .maybeSingle();

        if (candidateByEmail) {
          candidateId = candidateByEmail.id;
        }
      }

      if (!candidateId) return;

      const { data: certifications } = await supabase
        .from("candidate_certifications")
        .select("*")
        .eq("candidate_id", candidateId);

      if (certifications && certifications.length > 0) {
        setCertificationChecklist(
          certifications.map(c => ({
            type: c.certification_type,
            hasIt: c.has_certification,
            expiryDate: c.expiry_date || undefined,
            customName: c.custom_name || undefined,
          }))
        );
      }
    }

    loadCertifications();
  }, []); // Run once on mount

  // Keep formValuesRef in sync with state
  React.useEffect(() => {
    formValuesRef.current = {
      firstName,
      lastName,
      email,
      phone,
      whatsapp,
      dateOfBirth,
      gender,
      nationality,
      secondNationality,
      currentLocation,
      candidateType,
      primaryPosition,
      secondaryPositions,
      jobSearchNotes,
      highestLicense,
      secondaryLicense,
      hasSTCW,
      stcwExpiry,
      hasENG1,
      eng1Expiry,
      hasSchengen,
      schengenExpiry,
      hasB1B2,
      b1b2Expiry,
      certificationChecklist,
      smoker,
      hasTattoos,
      tattooLocation,
      maritalStatus,
      couplePosition,
      partnerName,
      partnerPosition,
    };
  });

  // Auto-save function - uses ref to avoid recreating on every state change
  const autoSave = React.useCallback(
    async (sectionToSave: string) => {
      const vals = formValuesRef.current;
      setSaveStatus("saving");

      try {
        let result: { success: boolean; error?: string };

        switch (sectionToSave) {
          case "personal":
            console.log(`[autoSave] Calling updatePersonalInfo with phone: ${vals.phone} type: ${typeof vals.phone}`);
            result = await updatePersonalInfo({
              firstName: vals.firstName,
              lastName: vals.lastName,
              email: vals.email || undefined,
              phone: vals.phone,
              whatsapp: vals.whatsapp || undefined,
              dateOfBirth: vals.dateOfBirth || undefined,
              gender: vals.gender || undefined,
              nationality: vals.nationality || undefined,
              secondNationality: vals.secondNationality || undefined,
              currentLocation: vals.currentLocation || undefined,
            });
            console.log(`[autoSave] updatePersonalInfo result:`, result);
            break;

          case "professional":
            result = await updateProfessionalDetails({
              candidateType: vals.candidateType || undefined,
              primaryPosition: vals.primaryPosition || undefined,
              secondaryPositions: vals.secondaryPositions.length > 0 ? vals.secondaryPositions : undefined,
              highestLicense: vals.highestLicense || undefined,
              secondaryLicense: vals.secondaryLicense || undefined,
              jobSearchNotes: vals.jobSearchNotes || undefined,
            });
            break;

          case "certifications":
            // Save STCW and visas to candidates table (convert strings to booleans)
            result = await updateCertificationStatus({
              hasStcw: vals.hasSTCW === "yes" ? true : vals.hasSTCW === "no" ? false : undefined,
              stcwExpiry: vals.stcwExpiry || undefined,
              hasEng1: vals.hasENG1 === "yes" ? true : vals.hasENG1 === "no" ? false : undefined,
              eng1Expiry: vals.eng1Expiry || undefined,
              hasSchengen: vals.hasSchengen === "yes" ? true : vals.hasSchengen === "no" ? false : undefined,
              schengenExpiry: vals.schengenExpiry || undefined,
              hasB1B2: vals.hasB1B2 === "yes" ? true : vals.hasB1B2 === "no" ? false : undefined,
              b1b2Expiry: vals.b1b2Expiry || undefined,
            });

            // Save certification checklist to candidate_certifications table
            if (result.success && vals.certificationChecklist.length > 0) {
              result = await updateCertificationChecklist({
                certifications: vals.certificationChecklist,
              });
            }
            break;

          case "details":
            result = await updateSpecialCircumstances({
              isSmoker: vals.smoker === "yes" ? true : vals.smoker === "no" ? false : undefined,
              hasTattoos: vals.hasTattoos === "yes" ? true : vals.hasTattoos === "no" ? false : undefined,
              tattooDescription: vals.tattooLocation || undefined,
              maritalStatus: vals.maritalStatus || undefined,
              isCouplePosition:
                vals.couplePosition === "yes" ? true : vals.couplePosition === "no" ? false : undefined,
              partnerName: vals.partnerName || undefined,
              partnerPosition: vals.partnerPosition || undefined,
            });
            break;

          default:
            result = { success: true };
        }

        if (result.success) {
          setSaveStatus("saved");
          setLastSaved(new Date());
        } else {
          setSaveStatus("error");
        }
      } catch (error) {
        console.error("Auto-save error:", error);
        setSaveStatus("error");
      }
    },
    [] // No dependencies - uses ref for current values
  );

  // Consolidated auto-save with 1.5s debounce
  React.useEffect(() => {
    const currentDataString = JSON.stringify({
      // Personal fields
      firstName,
      lastName,
      email,
      phone,
      whatsapp,
      dateOfBirth,
      gender,
      nationality,
      secondNationality,
      currentLocation,
      // Professional fields
      candidateType,
      primaryPosition,
      secondaryPositions,
      jobSearchNotes,
      highestLicense,
      secondaryLicense,
      // Certifications fields
      hasSTCW,
      stcwExpiry,
      hasENG1,
      eng1Expiry,
      hasSchengen,
      schengenExpiry,
      hasB1B2,
      b1b2Expiry,
      certificationChecklist,
      // Details fields
      smoker,
      hasTattoos,
      tattooLocation,
      maritalStatus,
      couplePosition,
      partnerName,
      partnerPosition,
    });

    // Skip save on initial mount - set the initial snapshot without saving
    if (lastSavedDataRef.current === "__INITIAL_MOUNT__") {
      lastSavedDataRef.current = currentDataString;
      return;
    }

    // Skip save if data hasn't changed
    if (currentDataString === lastSavedDataRef.current) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for 1.5s debounce
    saveTimeoutRef.current = setTimeout(async () => {
      await Promise.all([
        autoSave("personal"),
        autoSave("professional"),
        autoSave("certifications"),
        autoSave("details"),
      ]);
      lastSavedDataRef.current = currentDataString;
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    // Personal fields
    firstName,
    lastName,
    email,
    phone,
    whatsapp,
    dateOfBirth,
    gender,
    nationality,
    secondNationality,
    currentLocation,
    // Professional fields
    candidateType,
    primaryPosition,
    secondaryPositions,
    jobSearchNotes,
    highestLicense,
    secondaryLicense,
    // Certifications fields
    hasSTCW,
    stcwExpiry,
    hasENG1,
    eng1Expiry,
    hasSchengen,
    schengenExpiry,
    hasB1B2,
    b1b2Expiry,
    certificationChecklist,
    // Details fields
    smoker,
    hasTattoos,
    tattooLocation,
    maritalStatus,
    couplePosition,
    partnerName,
    partnerPosition,
    // Note: autoSave removed - it uses refs internally so doesn't need to be a dependency
  ]);

  // Save before navigate - called when user clicks a wizard step
  const handleStepClick = React.useCallback(
    async (targetStep: ProfileStep) => {
      const currentIndex = profileSteps.indexOf(currentStep);
      const targetIndex = profileSteps.indexOf(targetStep);

      if (targetIndex > currentIndex) {
        const validation = validateStep(currentStep);
        if (!validation.isValid) {
          setStepErrors((prev) => ({
            ...prev,
            personal:
              currentStep === "personal"
                ? ((validation.errors as PersonalStepErrors | undefined) || {})
                : prev.personal,
            professional:
              currentStep === "professional"
                ? ((validation.errors as ProfessionalStepErrors | undefined) || {})
                : prev.professional,
            certifications:
              currentStep === "certifications"
                ? (validation.message || "Please complete the required fields.")
                : prev.certifications,
            details:
              currentStep === "details"
                ? (validation.message || "Please complete the required fields.")
                : prev.details,
          }));
          return;
        }
        setStepErrors((prev) => ({
          ...prev,
          personal: currentStep === "personal" ? {} : prev.personal,
          professional: currentStep === "professional" ? {} : prev.professional,
          certifications: currentStep === "certifications" ? "" : prev.certifications,
          details: currentStep === "details" ? "" : prev.details,
        }));
      }

      // 1. Clear debounce timeout to prevent duplicate saves
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // 2. Save immediately before navigation
      setSaveStatus("saving");
      try {
        await Promise.all([
          autoSave("personal"),
          autoSave("professional"),
          autoSave("certifications"),
          autoSave("details"),
        ]);

        // Update last saved snapshot using current ref values
        lastSavedDataRef.current = JSON.stringify(formValuesRef.current);

        setSaveStatus("saved");
        setLastSaved(new Date());
      } catch (error) {
        console.error("Save before navigate error:", error);
        setSaveStatus("error");
      }

      // 3. Navigate to target step
      setCurrentStep(targetStep);

      // 4. Scroll to top on mobile
      if (window.innerWidth < 768) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [
      autoSave,
      currentStep,
      validateStep,
      // Note: form values are accessed via formValuesRef in autoSave, so they don't need to be dependencies
      // We only need currentStep for navigation logic and validateStep for validation
    ]
  );

  // Clear personal errors when validation passes
  // Using functional update to avoid stepErrors in dependency array (prevents infinite loop)
  React.useEffect(() => {
    const validation = validateStep("personal");
    if (validation.isValid) {
      setStepErrors((prev) => {
        if (Object.keys(prev.personal).length === 0) return prev; // No change needed
        return { ...prev, personal: {} };
      });
    }
  }, [firstName, lastName, dateOfBirth, nationality, phone, email, validateStep]);

  // Clear professional errors when validation passes
  React.useEffect(() => {
    const validation = validateStep("professional");
    if (validation.isValid) {
      setStepErrors((prev) => {
        if (Object.keys(prev.professional).length === 0) return prev; // No change needed
        return { ...prev, professional: {} };
      });
    }
  }, [candidateType, primaryPosition, jobSearchNotes, validateStep]);

  // Clear certifications errors when validation passes
  React.useEffect(() => {
    const validation = validateStep("certifications");
    if (validation.isValid) {
      setStepErrors((prev) => {
        if (!prev.certifications) return prev; // No change needed
        return { ...prev, certifications: "" };
      });
    }
  }, [candidateType, hasSTCW, hasENG1, hasSchengen, hasB1B2, validateStep]);

  // Clear details errors when validation passes
  React.useEffect(() => {
    const validation = validateStep("details");
    if (validation.isValid) {
      setStepErrors((prev) => {
        if (!prev.details) return prev; // No change needed
        return { ...prev, details: "" };
      });
    }
  }, [smoker, hasTattoos, maritalStatus, validateStep]);

  const profileCompletion = React.useMemo(() => {
    return calculateProfileCompletion({
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      nationality,
      currentLocation: currentLocation?.displayName || null,
      candidateType,
      primaryPosition,
      avatarUrl: profilePhotoUrl,
      hasStcw: hasSTCW === "yes",
      hasEng1: hasENG1 === "yes",
      industryPreference: candidate.industryPreference,
      verificationTier: candidate.verificationTier,
      documents,
    });
  }, [
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth,
    nationality,
    currentLocation,
    candidateType,
    primaryPosition,
    profilePhotoUrl,
    hasSTCW,
    hasENG1,
    candidate.industryPreference,
    candidate.verificationTier,
    documents,
  ]);

  const overallProgress = profileCompletion.score;

  // Helper functions for wizard navigation
  const currentStepIndex = profileSteps.indexOf(currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === profileSteps.length - 1;

  const goToPreviousStep = () => {
    if (!isFirstStep) {
      handleStepClick(profileSteps[currentStepIndex - 1]);
    }
  };

  const goToNextStep = () => {
    if (!isLastStep) {
      handleStepClick(profileSteps[currentStepIndex + 1]);
    }
  };

  // Prepare formData for StepNavigator
  const formData = {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    nationality,
    secondNationality,
    phone,
    whatsapp,
    email,
    currentLocation: currentLocation?.displayName || "",
    candidateType,
    primaryPosition,
    otherRoleDetails: jobSearchNotes,
    secondaryPositions,
    highestLicense,
    hasSTCW: hasSTCW === "yes" ? true : hasSTCW === "no" ? false : undefined,
    stcwExpiryDate: stcwExpiry,
    hasENG1: hasENG1 === "yes" ? true : hasENG1 === "no" ? false : undefined,
    eng1ExpiryDate: eng1Expiry,
    hasSchengen: hasSchengen === "yes" ? true : hasSchengen === "no" ? false : undefined,
    schengenExpiryDate: schengenExpiry,
    hasB1B2: hasB1B2 === "yes" ? true : hasB1B2 === "no" ? false : undefined,
    b1b2ExpiryDate: b1b2Expiry,
    smoker: smoker === "yes" ? true : smoker === "no" ? false : null,
    hasTattoos: hasTattoos === "yes" ? true : hasTattoos === "no" ? false : null,
    maritalStatus,
    isCouple: couplePosition === "yes",
    partnerName,
    partnerPosition,
  };

  const jobPreferencesCount = React.useMemo(() => {
    let count = 0;
    if (candidate.industryPreference) count += 1;
    if (candidate.yachtPrimaryPosition || candidate.householdPrimaryPosition) {
      count += 1;
    }
    if (
      (candidate.preferredRegions?.length || 0) > 0 ||
      (candidate.householdLocations?.length || 0) > 0
    ) {
      count += 1;
    }
    return count;
  }, [
    candidate.industryPreference,
    candidate.yachtPrimaryPosition,
    candidate.householdPrimaryPosition,
    candidate.preferredRegions,
    candidate.householdLocations,
  ]);

  const hasJobPreferences = Boolean(candidate.industryPreference);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          {/* Desktop: Sticky sidebar */}
          <div className="hidden md:block md:w-[280px] md:shrink-0">
            <StepNavigator
              variant="sidebar"
              steps={profileSteps}
              currentStep={currentStep}
              formData={formData}
              onStepClick={handleStepClick}
            />
          </div>

          <div className="flex-1">
            {/* Mobile: Horizontal stepper */}
            <div className="block md:hidden mb-6">
              <StepNavigator
                variant="horizontal"
                steps={profileSteps}
                currentStep={currentStep}
                formData={formData}
                onStepClick={handleStepClick}
              />
            </div>

            {/* Header: Save status */}
            <div className="mb-2 flex flex-wrap items-center gap-4">
              <Link
                href="/crew/dashboard"
                className="inline-flex items-center gap-2 text-sm font-medium text-gold-600 hover:text-gold-700"
              >
                <ChevronLeft className="size-4" />
                Back to dashboard
              </Link>
              {safeRedirect && (
                <Link
                  href={safeRedirect}
                  className="inline-flex items-center gap-2 text-sm font-medium text-gold-600 hover:text-gold-700"
                >
                  <ChevronLeft className="size-4" />
                  Back to job
                </Link>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="flex items-center gap-3 font-serif text-3xl font-semibold text-navy-800">
                  <UserCircle className="size-7 text-gold-500" />
                  Edit Profile
                </h1>
                <p className="mt-2 text-gray-600">
                  Keep your profile up to date to get the best opportunities
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {saveStatus === "saved" && (
                  <>
                    <Cloud className="size-4 text-success-500" />
                    <span className="text-gray-500" suppressHydrationWarning>
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
            </div>
            <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-navy-900">Profile completion</span>
                <span className="text-gray-500">{overallProgress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-500 transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            {/* Step content */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
              {currentStep === "personal" && (
                <PersonalInfoForm
                  profilePhotoUrl={profilePhotoUrl || undefined}
                  onPhotoChange={setProfilePhotoUrl}
                  firstName={firstName}
                  setFirstName={setFirstName}
                  lastName={lastName}
                  setLastName={setLastName}
                  dateOfBirth={dateOfBirth}
                  setDateOfBirth={setDateOfBirth}
                  gender={gender}
                  setGender={setGender}
                  nationality={nationality}
                  setNationality={setNationality}
                  secondNationality={secondNationality}
                  setSecondNationality={setSecondNationality}
                  phone={phone}
                  setPhone={setPhone}
                  whatsapp={whatsapp}
                  setWhatsapp={setWhatsapp}
                  email={email}
                  setEmail={setEmail}
                  currentLocation={currentLocation}
                  setCurrentLocation={setCurrentLocation}
                  errors={stepErrors.personal}
                />
              )}

        {/* Professional Details */}
        {currentStep === "professional" && (
          <ProfessionalDetailsForm
            candidateType={candidateType}
            setCandidateType={setCandidateType}
            primaryPosition={primaryPosition}
            setPrimaryPosition={setPrimaryPosition}
            positionOptions={currentPositionOptions}
            secondaryPositions={secondaryPositions}
            setSecondaryPositions={setSecondaryPositions}
            highestLicense={highestLicense}
            setHighestLicense={setHighestLicense}
            secondaryLicense={secondaryLicense}
            setSecondaryLicense={setSecondaryLicense}
            otherRoleDetails={jobSearchNotes}
            setOtherRoleDetails={setJobSearchNotes}
            errors={stepErrors.professional}
          />
        )}
        {/* Step 3: Certifications & Visas */}
        {currentStep === "certifications" && (
          <CertificationsForm
            candidateType={candidateType}
            hasSTCW={hasSTCW}
            setHasSTCW={setHasSTCW}
            stcwExpiry={stcwExpiry}
            setSTCWExpiry={setStcwExpiry}
            hasENG1={hasENG1}
            setHasENG1={setHasENG1}
            eng1Expiry={eng1Expiry}
            setENG1Expiry={setEng1Expiry}
            hasSchengen={hasSchengen}
            setHasSchengen={setHasSchengen}
            schengenExpiry={schengenExpiry}
            setSchengenExpiry={setSchengenExpiry}
            hasB1B2={hasB1B2}
            setHasB1B2={setHasB1B2}
            b1b2Expiry={b1b2Expiry}
            setB1B2Expiry={setB1b2Expiry}
            certificationChecklist={certificationChecklist}
            setCertificationChecklist={setCertificationChecklist}
            error={stepErrors.certifications}
          />
        )}

      {/* Step 4: Personal Details */}
      {currentStep === "details" && (
        <PersonalDetailsForm
          smoker={smoker}
          setSmoker={setSmoker}
          hasTattoos={hasTattoos}
          setHasTattoos={setHasTattoos}
          tattooLocation={tattooLocation}
          setTattooLocation={setTattooLocation}
          maritalStatus={maritalStatus}
          setMaritalStatus={setMaritalStatus}
          couplePosition={couplePosition}
          setCouplePosition={setCouplePosition}
          partnerName={partnerName}
          setPartnerName={setPartnerName}
          partnerPosition={partnerPosition}
          setPartnerPosition={setPartnerPosition}
          positionOptions={currentPositionOptions}
          error={stepErrors.details}
        />
      )}

      {/* Step 5: Complete */}
      {currentStep === "complete" && (
        <ProfileCompletionCard
          overallProgress={overallProgress}
          onEditProfile={() => setCurrentStep("personal")}
          onBackToDashboard={() => router.push("/crew/dashboard")}
          hasJobPreferences={hasJobPreferences}
          jobPreferencesCount={jobPreferencesCount}
          documentCount={documents.length}
          actions={profileCompletion.actions}
          isIdentityVerified={profileCompletion.isIdentityVerified}
        />
      )}
            </div>

      {/* Wizard Navigation Buttons */}
      {currentStep !== "complete" && (
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="secondary"
            leftIcon={<ChevronLeft className="size-4" />}
            onClick={() => {
              const currentIndex = steps.indexOf(currentStep);
              if (currentIndex > 0) {
                handleStepClick(steps[currentIndex - 1]);
              }
            }}
            disabled={steps.indexOf(currentStep) === 0}
          >
            Back
          </Button>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {saveStatus === "saved" && (
              <>
                <CheckCircle2 className="size-4 text-success-500" />
                All changes saved
              </>
            )}
          </div>
          <Button
            variant="primary"
            rightIcon={<ChevronRight className="size-4" />}
            onClick={() => {
              const currentIndex = steps.indexOf(currentStep);
              if (currentIndex < steps.length - 1) {
                handleStepClick(steps[currentIndex + 1]);
              }
            }}
          >
            {steps.indexOf(currentStep) === steps.length - 2 ? "Complete" : "Continue"}
          </Button>
        </div>
      )}
        </div>
      </div>
    </div>
    </div>
  );
}
