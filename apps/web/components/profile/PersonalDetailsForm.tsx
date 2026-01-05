"use client";

import * as React from "react";
import { FormField } from "@/components/ui/FormField";
import { TextInput } from "@/components/ui/TextInput";
import { SelectInput } from "@/components/ui/SelectInput";
import { RadioGroup } from "@/components/ui/RadioGroup";

// Position options - will be provided by parent component
interface PositionOption {
  value: string;
  label: string;
}

interface PersonalDetailsFormProps {
  // Personal detail fields
  smoker: string;
  setSmoker: (value: string) => void;
  hasTattoos: string;
  setHasTattoos: (value: string) => void;
  tattooLocation: string;
  setTattooLocation: (value: string) => void;
  maritalStatus: string;
  setMaritalStatus: (value: string) => void;
  couplePosition: string;
  setCouplePosition: (value: string) => void;
  partnerName: string;
  setPartnerName: (value: string) => void;
  partnerPosition: string;
  setPartnerPosition: (value: string) => void;
  positionOptions: PositionOption[];
}

export function PersonalDetailsForm({
  smoker,
  setSmoker,
  hasTattoos,
  setHasTattoos,
  tattooLocation,
  setTattooLocation,
  maritalStatus,
  setMaritalStatus,
  couplePosition,
  setCouplePosition,
  partnerName,
  setPartnerName,
  partnerPosition,
  setPartnerPosition,
  positionOptions,
}: PersonalDetailsFormProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-navy-900">Personal Details</h2>
        <p className="mt-1 text-sm text-gray-500">
          Additional personal information
        </p>
      </div>

      <div className="space-y-6">
        <FormField label="Smoker">
          <RadioGroup
            name="smoker"
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
            name="tattoos"
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
              { value: "", label: "Select..." },
              { value: "single", label: "Single" },
              { value: "married", label: "Married" },
              { value: "divorced", label: "Divorced" },
              { value: "partnered", label: "In a Relationship" },
            ]}
          />
        </FormField>

        <FormField label="Couple Position" hint="Are you seeking a position as part of a couple?">
          <RadioGroup
            name="couple"
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
    </div>
  );
}
