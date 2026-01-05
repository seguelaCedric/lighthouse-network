"use client";

import * as React from "react";
import {
  Cigarette,
  CigaretteOff,
  Coffee,
  Sparkles,
  Heart,
  Users,
  User,
  UserCheck,
  HelpCircle,
  Check,
} from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import { TextInput } from "@/components/ui/TextInput";
import { SelectInput } from "@/components/ui/SelectInput";
import { cn } from "@/lib/utils";

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

// Custom toggle button component for better visual design
function ToggleOption({
  selected,
  onClick,
  icon: Icon,
  label,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
        "hover:border-gold-300 hover:bg-gold-50/50",
        selected
          ? "border-gold-500 bg-gold-50 shadow-sm"
          : "border-gray-200 bg-white"
      )}
    >
      {selected && (
        <div className="absolute right-2 top-2">
          <Check className="size-4 text-gold-600" />
        </div>
      )}
      {Icon && (
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-full",
            selected ? "bg-gold-100 text-gold-600" : "bg-gray-100 text-gray-500"
          )}
        >
          <Icon className="size-5" />
        </div>
      )}
      <span
        className={cn(
          "text-sm font-medium",
          selected ? "text-gold-700" : "text-gray-700"
        )}
      >
        {label}
      </span>
      {description && (
        <span className="text-xs text-gray-500">{description}</span>
      )}
    </button>
  );
}

// Section card wrapper for visual grouping
function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/50 px-5 py-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-navy-100 text-navy-600">
          <Icon className="size-5" />
        </div>
        <div>
          <h3 className="font-medium text-navy-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
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
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-xl font-semibold text-navy-900">Personal Details</h2>
        <p className="mt-1 text-sm text-gray-500">
          Additional information that helps match you with the right opportunities
        </p>
      </div>

      {/* Lifestyle Section */}
      <SectionCard
        title="Lifestyle"
        description="Preferences that may affect placement"
        icon={Coffee}
      >
        <div className="space-y-6">
          {/* Smoker */}
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-700">
              Smoking Status
            </label>
            <div className="grid grid-cols-3 gap-3">
              <ToggleOption
                selected={smoker === "no"}
                onClick={() => setSmoker("no")}
                icon={CigaretteOff}
                label="Non-Smoker"
              />
              <ToggleOption
                selected={smoker === "social"}
                onClick={() => setSmoker("social")}
                icon={Coffee}
                label="Social Only"
              />
              <ToggleOption
                selected={smoker === "yes"}
                onClick={() => setSmoker("yes")}
                icon={Cigarette}
                label="Smoker"
              />
            </div>
          </div>

          {/* Tattoos */}
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-700">
              Visible Tattoos
            </label>
            <div className="grid grid-cols-2 gap-3">
              <ToggleOption
                selected={hasTattoos === "no"}
                onClick={() => setHasTattoos("no")}
                icon={UserCheck}
                label="No Visible Tattoos"
              />
              <ToggleOption
                selected={hasTattoos === "yes"}
                onClick={() => setHasTattoos("yes")}
                icon={Sparkles}
                label="Has Visible Tattoos"
              />
            </div>
            {hasTattoos === "yes" && (
              <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
                <label className="mb-2 block text-sm font-medium text-amber-800">
                  Please describe location(s)
                </label>
                <TextInput
                  value={tattooLocation}
                  onChange={setTattooLocation}
                  placeholder="e.g., Small tattoo on forearm, wrist tattoo"
                />
                <p className="mt-2 text-xs text-amber-600">
                  This information helps us find placements where visible tattoos are acceptable.
                </p>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Relationship Status Section */}
      <SectionCard
        title="Relationship Status"
        description="For couple placements and household positions"
        icon={Heart}
      >
        <div className="space-y-6">
          {/* Marital Status */}
          <FormField label="Current Status">
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "single", label: "Single", icon: User },
                { value: "partnered", label: "In Relationship", icon: Heart },
                { value: "married", label: "Married", icon: Users },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMaritalStatus(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all",
                    "hover:border-gold-300 hover:bg-gold-50/50",
                    maritalStatus === option.value
                      ? "border-gold-500 bg-gold-50"
                      : "border-gray-200 bg-white"
                  )}
                >
                  <option.icon
                    className={cn(
                      "size-5",
                      maritalStatus === option.value
                        ? "text-gold-600"
                        : "text-gray-400"
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs font-medium",
                      maritalStatus === option.value
                        ? "text-gold-700"
                        : "text-gray-600"
                    )}
                  >
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </FormField>

          {/* Couple Position */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Seeking Couple Position?
              </label>
              <div className="group relative">
                <HelpCircle className="size-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 mb-2 hidden w-64 -translate-x-1/2 rounded-lg bg-navy-900 p-3 text-xs text-white shadow-lg group-hover:block z-10">
                  A couple position means you and your partner would both be employed by the same principal/yacht.
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <ToggleOption
                selected={couplePosition === "no"}
                onClick={() => setCouplePosition("no")}
                icon={User}
                label="Individual Only"
              />
              <ToggleOption
                selected={couplePosition === "yes"}
                onClick={() => setCouplePosition("yes")}
                icon={Users}
                label="As a Couple"
              />
              <ToggleOption
                selected={couplePosition === "flexible"}
                onClick={() => setCouplePosition("flexible")}
                icon={HelpCircle}
                label="Flexible"
              />
            </div>

            {/* Partner Details */}
            {couplePosition === "yes" && (
              <div className="mt-4 rounded-xl border border-gold-200 bg-gradient-to-br from-gold-50 to-amber-50 p-5">
                <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gold-800">
                  <Users className="size-4" />
                  Partner Information
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gold-800">
                      Partner's Name
                    </label>
                    <TextInput
                      value={partnerName}
                      onChange={setPartnerName}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gold-800">
                      Partner's Position
                    </label>
                    <SelectInput
                      value={partnerPosition}
                      onChange={setPartnerPosition}
                      options={positionOptions}
                    />
                  </div>
                </div>
                <p className="mt-3 text-xs text-gold-600">
                  We'll match you both to opportunities that accommodate couples.
                </p>
              </div>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
