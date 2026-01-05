"use client";

import * as React from "react";
import { Anchor, Home, Briefcase } from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import { SelectInput } from "@/components/ui/SelectInput";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { licenseOptions, type CandidateType } from "./constants";

// Position options - will be provided by parent component
interface PositionOption {
  value: string;
  label: string;
}

// Vessel/Property type options
const vesselPropertyTypeOptions = [
  { value: "motor_yacht", label: "Motor Yacht" },
  { value: "sailing_yacht", label: "Sailing Yacht" },
  { value: "explorer_yacht", label: "Explorer Yacht" },
  { value: "classic_yacht", label: "Classic Yacht" },
  { value: "superyacht", label: "Superyacht (100m+)" },
  { value: "private_estate", label: "Private Estate" },
  { value: "city_residence", label: "City Residence" },
  { value: "country_house", label: "Country House" },
  { value: "ski_chalet", label: "Ski Chalet" },
  { value: "beach_villa", label: "Beach Villa" },
];

interface ProfessionalDetailsFormProps {
  candidateType: CandidateType;
  setCandidateType: (value: CandidateType) => void;
  // Position fields
  primaryPosition: string;
  setPrimaryPosition: (value: string) => void;
  positionOptions: PositionOption[];
  secondaryPositions: string[];
  setSecondaryPositions: (value: string[]) => void;

  // License fields
  highestLicense: string;
  setHighestLicense: (value: string) => void;
  secondaryLicense: string;
  setSecondaryLicense: (value: string) => void;

  // Other role details
  otherRoleDetails: string;
  setOtherRoleDetails: (value: string) => void;
}

export function ProfessionalDetailsForm({
  candidateType,
  setCandidateType,
  primaryPosition,
  setPrimaryPosition,
  positionOptions,
  secondaryPositions,
  setSecondaryPositions,
  highestLicense,
  setHighestLicense,
  secondaryLicense,
  setSecondaryLicense,
  otherRoleDetails,
  setOtherRoleDetails,
}: ProfessionalDetailsFormProps) {
  const showLicenses = candidateType === "yacht_crew" || candidateType === "both";
  const showOtherRole = candidateType === "other";
  const roleCards = [
    {
      value: "yacht_crew",
      label: "Yacht Crew",
      description: "Onboard deck, interior, engineering, and galley roles",
      Icon: Anchor,
    },
    {
      value: "household_staff",
      label: "Household Staff",
      description: "Private residences, estates, and family offices",
      Icon: Home,
    },
    {
      value: "both",
      label: "Both",
      description: "Open to yacht and household roles",
      Icon: Anchor,
    },
    {
      value: "other",
      label: "Other",
      description: "Other roles or adjacent industries",
      Icon: Briefcase,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-navy-900">Professional Details</h2>
        <p className="mt-1 text-sm text-gray-500">
          Your role category, position, and licenses
        </p>
      </div>

      <FormField label="Role Category" required>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          {roleCards.map(({ value, label, description, Icon }) => {
            const isSelected = candidateType === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setCandidateType(value as CandidateType)}
                className={[
                  "flex w-full flex-col gap-2 rounded-xl border p-4 text-left transition-all",
                  isSelected
                    ? "border-gold-400 bg-gold-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm",
                ].join(" ")}
                aria-pressed={isSelected}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={[
                      "flex size-9 items-center justify-center rounded-full",
                      isSelected ? "bg-gold-500 text-white" : "bg-gray-100 text-gray-500",
                    ].join(" ")}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="text-sm font-semibold text-navy-900">{label}</span>
                </div>
                <p className="text-xs text-gray-500">{description}</p>
              </button>
            );
          })}
        </div>
      </FormField>

      {/* Primary Position */}
      <FormField label="Primary Position" required>
        <SelectInput
          value={primaryPosition}
          onChange={setPrimaryPosition}
          options={positionOptions}
        />
      </FormField>

      {showOtherRole && (
        <FormField
          label="Describe Your Role"
          hint="Tell us what you do so we can route you to the right opportunities"
          required
        >
          <textarea
            value={otherRoleDetails}
            onChange={(e) => setOtherRoleDetails(e.target.value)}
            rows={4}
            placeholder="e.g. Corporate hospitality, private aviation, luxury concierge, etc."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
          />
        </FormField>
      )}

      {/* Secondary Positions - Full width for better spacing */}
      {!showOtherRole && (
        <FormField
          label="Secondary Positions"
          hint="Select additional positions you can work in"
        >
          <MultiSelect
            value={secondaryPositions}
            onChange={setSecondaryPositions}
            options={positionOptions.filter(
              (p) => p.value !== "" && p.value !== primaryPosition
            )}
          />
        </FormField>
      )}

      {/* License fields in 2-column grid */}
      {showLicenses && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField label="Highest Licence">
            <SelectInput
              value={highestLicense}
              onChange={setHighestLicense}
              options={licenseOptions}
            />
          </FormField>

          <FormField label="Secondary Licence">
            <SelectInput
              value={secondaryLicense}
              onChange={setSecondaryLicense}
              options={licenseOptions}
            />
          </FormField>
        </div>
      )}
    </div>
  );
}
