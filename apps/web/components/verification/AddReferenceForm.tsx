"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export interface AddReferenceFormProps {
  candidateId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

const RELATIONSHIP_OPTIONS = [
  { value: "captain", label: "Captain / Direct Supervisor" },
  { value: "chief_officer", label: "Chief Officer" },
  { value: "chief_stew", label: "Chief Stewardess" },
  { value: "head_chef", label: "Head Chef" },
  { value: "chief_engineer", label: "Chief Engineer" },
  { value: "bosun", label: "Bosun" },
  { value: "manager", label: "Manager / Coordinator" },
  { value: "colleague", label: "Colleague / Peer" },
  { value: "owner", label: "Owner / Principal" },
  { value: "other", label: "Other" },
];

export function AddReferenceForm({
  candidateId,
  onSuccess,
  onCancel,
  className,
}: AddReferenceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    refereeName: "",
    relationship: "",
    companyVessel: "",
    datesWorked: "",
    refereeEmail: "",
    refereePhone: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.refereeName.trim()) {
      setError("Reference name is required");
      return false;
    }
    if (!formData.relationship) {
      setError("Relationship is required");
      return false;
    }
    if (!formData.refereeEmail.trim() && !formData.refereePhone.trim()) {
      setError("At least one contact method (email or phone) is required");
      return false;
    }
    if (formData.refereeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.refereeEmail)) {
      setError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/candidates/${candidateId}/references`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referee_name: formData.refereeName.trim(),
          relationship: formData.relationship,
          company_vessel: formData.companyVessel.trim() || null,
          dates_worked: formData.datesWorked.trim() || null,
          referee_email: formData.refereeEmail.trim() || null,
          referee_phone: formData.refereePhone.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add reference");
      }

      // Reset form
      setFormData({
        refereeName: "",
        relationship: "",
        companyVessel: "",
        datesWorked: "",
        refereeEmail: "",
        refereePhone: "",
      });

      onSuccess?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add reference");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white shadow-sm", className)}>
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h3 className="font-serif text-lg font-semibold text-navy-800">Add a Reference</h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {error && (
          <div className="mb-4 rounded-lg bg-error-50 p-3 text-sm text-error-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Reference Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Reference Name <span className="text-error-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.refereeName}
              onChange={(e) => handleChange("refereeName", e.target.value)}
              placeholder="Captain James Wilson"
              disabled={isSubmitting}
            />
          </div>

          {/* Relationship */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Relationship <span className="text-error-500">*</span>
            </label>
            <Select
              value={formData.relationship}
              onValueChange={(value) => handleChange("relationship", value)}
              disabled={isSubmitting}
            >
              <option value="">Select relationship...</option>
              {RELATIONSHIP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Vessel/Company */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Vessel/Company
            </label>
            <Input
              type="text"
              value={formData.companyVessel}
              onChange={(e) => handleChange("companyVessel", e.target.value)}
              placeholder="M/Y Excellence"
              disabled={isSubmitting}
            />
          </div>

          {/* Dates Worked Together */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Dates Worked Together
            </label>
            <Input
              type="text"
              value={formData.datesWorked}
              onChange={(e) => handleChange("datesWorked", e.target.value)}
              placeholder="2022 - 2024"
              disabled={isSubmitting}
            />
          </div>

          {/* Contact Information */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Contact <span className="text-xs text-gray-500">(at least one required)</span>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                type="email"
                value={formData.refereeEmail}
                onChange={(e) => handleChange("refereeEmail", e.target.value)}
                placeholder="Email"
                disabled={isSubmitting}
              />
              <Input
                type="tel"
                value={formData.refereePhone}
                onChange={(e) => handleChange("refereePhone", e.target.value)}
                placeholder="Phone"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Reference"}
          </Button>
        </div>
      </form>
    </div>
  );
}
