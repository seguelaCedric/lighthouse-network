"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { ProfessionalDetailsForm } from "@/components/profile/ProfessionalDetailsForm";
import { CertificationsForm } from "@/components/profile/CertificationsForm";
import { PersonalDetailsForm } from "@/components/profile/PersonalDetailsForm";
import { ProfileCompletionCard } from "@/components/profile/ProfileCompletionCard";

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
export function ProfileEditClient({ data }: { data: ProfileData }) {
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

  // Auto-save state
  const [saveStatus, setSaveStatus] = React.useState<"saved" | "saving" | "error">("saved");
  const [lastSaved, setLastSaved] = React.useState<Date>(new Date());
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = React.useRef<string>("");

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
  const [currentLocation, setCurrentLocation] = React.useState(candidate.currentLocation || "");

  // Professional Details
  const [candidateType, setCandidateType] = React.useState<CandidateType>(initialCandidateType);
  const [primaryPosition, setPrimaryPosition] = React.useState(candidate.primaryPosition || "");
  const [secondaryPositions, setSecondaryPositions] = React.useState<string[]>(
    candidate.secondaryPositions || []
  );
  const [jobSearchNotes, setJobSearchNotes] = React.useState(candidate.jobSearchNotes || "");
  const [highestLicense, setHighestLicense] = React.useState(candidate.highestLicense || "");
  const [secondaryLicense, setSecondaryLicense] = React.useState(""); // TODO: Add to database schema in Phase 3

  const currentPositionOptions = React.useMemo(
    () => positionOptionsByType[candidateType],
    [candidateType]
  );

  React.useEffect(() => {
    const allowedValues = new Set(currentPositionOptions.map((option) => option.value));

    if (primaryPosition && !allowedValues.has(primaryPosition)) {
      setPrimaryPosition("");
    }

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

  // Load existing certifications from database
  React.useEffect(() => {
    async function loadCertifications() {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: candidate } = await supabase
        .from("candidates")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!candidate) return;

      const { data: certifications } = await supabase
        .from("candidate_certifications")
        .select("*")
        .eq("candidate_id", candidate.id);

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

  // Auto-save function
  const autoSave = React.useCallback(
    async (sectionToSave: string) => {
      setSaveStatus("saving");

      try {
        let result: { success: boolean; error?: string };

        switch (sectionToSave) {
          case "personal":
            result = await updatePersonalInfo({
              firstName,
              lastName,
              email: email || undefined,
              phone: phone || undefined,
              whatsapp: whatsapp || undefined,
              dateOfBirth: dateOfBirth || undefined,
              gender: gender || undefined,
              nationality: nationality || undefined,
              secondNationality: secondNationality || undefined,
              currentLocation: currentLocation || undefined,
            });
            break;

          case "professional":
            result = await updateProfessionalDetails({
              candidateType: candidateType || undefined,
              primaryPosition: primaryPosition || undefined,
              secondaryPositions: secondaryPositions.length > 0 ? secondaryPositions : undefined,
              highestLicense: highestLicense || undefined,
              jobSearchNotes: jobSearchNotes || undefined,
            });
            break;

          case "certifications":
            // Save STCW and visas to candidates table (convert strings to booleans)
            result = await updateCertificationStatus({
              hasStcw: hasSTCW === "yes" ? true : hasSTCW === "no" ? false : undefined,
              stcwExpiry: stcwExpiry || undefined,
              hasEng1: hasENG1 === "yes" ? true : hasENG1 === "no" ? false : undefined,
              eng1Expiry: eng1Expiry || undefined,
              hasSchengen: hasSchengen === "yes" ? true : hasSchengen === "no" ? false : undefined,
              hasB1B2: hasB1B2 === "yes" ? true : hasB1B2 === "no" ? false : undefined,
            });

            // Save certification checklist to candidate_certifications table
            if (result.success && certificationChecklist.length > 0) {
              result = await updateCertificationChecklist({
                certifications: certificationChecklist,
              });
            }
            break;

          case "details":
            result = await updateSpecialCircumstances({
              isSmoker: smoker === "yes" ? true : smoker === "no" ? false : undefined,
              hasTattoos: hasTattoos === "yes" ? true : hasTattoos === "no" ? false : undefined,
              tattooDescription: tattooLocation || undefined,
              maritalStatus: maritalStatus || undefined,
              isCouplePosition:
                couplePosition === "yes" ? true : couplePosition === "no" ? false : undefined,
              partnerName: partnerName || undefined,
              partnerPosition: partnerPosition || undefined,
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
    [
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
      hasSTCW,
      stcwExpiry,
      hasENG1,
      eng1Expiry,
      hasSchengen,
      hasB1B2,
      smoker,
      hasTattoos,
      tattooLocation,
      maritalStatus,
      couplePosition,
      partnerName,
      partnerPosition,
    ]
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
      // Certifications fields
      hasSTCW,
      stcwExpiry,
      hasENG1,
      eng1Expiry,
      hasSchengen,
      hasB1B2,
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
    // Certifications fields
    hasSTCW,
    stcwExpiry,
    hasENG1,
    eng1Expiry,
    hasSchengen,
    hasB1B2,
    certificationChecklist,
    // Details fields
    smoker,
    hasTattoos,
    tattooLocation,
    maritalStatus,
    couplePosition,
    partnerName,
    partnerPosition,
    autoSave,
  ]);

  // Save before navigate - called when user clicks a wizard step
  const handleStepClick = React.useCallback(
    async (targetStep: ProfileStep) => {
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

        // Update last saved snapshot
        const currentDataString = JSON.stringify({
          firstName, lastName, email, phone, whatsapp, dateOfBirth, gender,
          nationality, secondNationality, currentLocation,
          candidateType,
          primaryPosition, secondaryPositions, jobSearchNotes,
          highestLicense,
          hasSTCW, stcwExpiry, hasENG1, eng1Expiry, hasSchengen, hasB1B2,
          smoker, hasTattoos, tattooLocation, maritalStatus, couplePosition,
          partnerName, partnerPosition,
        });
        lastSavedDataRef.current = currentDataString;

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
      firstName, lastName, email, phone, whatsapp, dateOfBirth, gender,
      nationality, secondNationality, currentLocation,
      candidateType,
      primaryPosition, secondaryPositions, jobSearchNotes,
      highestLicense,
      hasSTCW, stcwExpiry, hasENG1, eng1Expiry, hasSchengen, hasB1B2,
      smoker, hasTattoos, tattooLocation, maritalStatus, couplePosition,
      partnerName, partnerPosition,
    ]
  );

  // Calculate overall profile completion percentage
  const overallProgress = React.useMemo(() => {
    const requiredFields = [
      firstName, lastName, dateOfBirth, nationality, email, phone,
      candidateType, primaryPosition,
      candidateType === "other" ? jobSearchNotes : true,
    ];
    const optionalFields = [
      gender, secondNationality, whatsapp, currentLocation,
      secondaryPositions.length > 0,
      hasSchengen,
      candidateType !== "household_staff" ? hasB1B2 : null,
      candidateType === "yacht_crew" || candidateType === "both" ? hasSTCW : null,
      candidateType === "yacht_crew" || candidateType === "both" ? hasENG1 : null,
      smoker, hasTattoos, maritalStatus,
    ];

    const filledRequired = requiredFields.filter(Boolean).length;
    const filledOptional = optionalFields.filter(Boolean).length;

    // Weight: 70% required, 30% optional
    return Math.round(
      (filledRequired / requiredFields.length) * 70 +
      (filledOptional / optionalFields.length) * 30
    );
  }, [
    firstName, lastName, dateOfBirth, nationality, email, phone,
    candidateType, primaryPosition, gender, secondNationality, whatsapp,
    currentLocation, secondaryPositions, hasSchengen, hasB1B2,
    hasSTCW, hasENG1, smoker, hasTattoos, maritalStatus
  ]);

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
    currentLocation,
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
    hasB1B2: hasB1B2 === "yes" ? true : hasB1B2 === "no" ? false : undefined,
    smoker: smoker === "yes" ? true : smoker === "no" ? false : null,
    hasTattoos: hasTattoos === "yes" ? true : hasTattoos === "no" ? false : null,
    maritalStatus,
    isCouple: couplePosition === "yes",
    partnerName,
    partnerPosition,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-navy-900">Edit Profile</h1>
                <p className="mt-1 text-sm text-gray-500">
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
            certificationChecklist={certificationChecklist}
            setCertificationChecklist={setCertificationChecklist}
            hasSchengen={hasSchengen}
            setHasSchengen={setHasSchengen}
            hasB1B2={hasB1B2}
            setHasB1B2={setHasB1B2}
            hasENG1={hasENG1}
            setHasENG1={setHasENG1}
            eng1Expiry={eng1Expiry}
            setENG1Expiry={setEng1Expiry}
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
        />
      )}

      {/* Step 5: Complete */}
      {currentStep === "complete" && (
        <ProfileCompletionCard
          overallProgress={overallProgress}
          onEditProfile={() => setCurrentStep("personal")}
          onBackToDashboard={() => router.push("/crew/dashboard")}
          hasJobPreferences={false}
          jobPreferencesCount={0}
          documentCount={0}
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
                setCurrentStep(steps[currentIndex - 1]);
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
                setCurrentStep(steps[currentIndex + 1]);
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
