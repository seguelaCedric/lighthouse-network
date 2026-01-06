"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleCard } from "@/components/ui/ToggleCard";
import { TextInput } from "@/components/ui/TextInput";
import {
  CertificationAccordion,
  useAccordionState,
} from "./CertificationAccordion";
import { CertificationCheckbox } from "./CertificationCheckbox";
import {
  getCertificationsForCandidateType,
  getCertificationCategoriesForCandidateType,
  type CandidateType,
} from "./constants";

interface CertificationItem {
  type: string;
  hasIt: boolean;
  expiryDate?: string;
  customName?: string;
}

interface CertificationsFormProps {
  candidateType: CandidateType;
  // STCW Basic Safety
  hasSTCW: string;
  setHasSTCW: (value: string) => void;
  stcwExpiry: string;
  setSTCWExpiry: (value: string) => void;

  // ENG1 Medical
  hasENG1: string;
  setHasENG1: (value: string) => void;
  eng1Expiry: string;
  setENG1Expiry: (value: string) => void;

  // Visas with expiry
  hasSchengen: string;
  setHasSchengen: (value: string) => void;
  schengenExpiry: string;
  setSchengenExpiry: (value: string) => void;
  hasB1B2: string;
  setHasB1B2: (value: string) => void;
  b1b2Expiry: string;
  setB1B2Expiry: (value: string) => void;

  // Certification checklist
  certificationChecklist: CertificationItem[];
  setCertificationChecklist: (value: CertificationItem[]) => void;
  error?: string;
}

export function CertificationsForm({
  candidateType,
  hasSTCW,
  setHasSTCW,
  stcwExpiry,
  setSTCWExpiry,
  hasENG1,
  setHasENG1,
  eng1Expiry,
  setENG1Expiry,
  hasSchengen,
  setHasSchengen,
  schengenExpiry,
  setSchengenExpiry,
  hasB1B2,
  setHasB1B2,
  b1b2Expiry,
  setB1B2Expiry,
  certificationChecklist,
  setCertificationChecklist,
  error,
}: CertificationsFormProps) {
  const showYachtCerts =
    candidateType === "yacht_crew" || candidateType === "both";
  const showEng1 = candidateType === "yacht_crew" || candidateType === "both";
  const title = "Certifications & Visas";
  const subtitle = "Professional certifications, documents, and visa status";

  // Get certifications relevant to this candidate type
  const availableCertifications = React.useMemo(() => {
    return getCertificationsForCandidateType(candidateType);
  }, [candidateType]);

  // Get categories for this candidate type
  const categories = React.useMemo(() => {
    return getCertificationCategoriesForCandidateType(candidateType);
  }, [candidateType]);

  // Group certifications by category
  const certsByCategory = React.useMemo(() => {
    const grouped: Record<string, typeof availableCertifications> = {};
    availableCertifications.forEach((cert) => {
      if (!grouped[cert.category]) {
        grouped[cert.category] = [];
      }
      grouped[cert.category].push(cert);
    });
    return grouped;
  }, [availableCertifications]);

  // Accordion state
  const accordion = useAccordionState(categories);

  // Helper to check if a certification is checked
  const isCertificationChecked = (type: string) => {
    return certificationChecklist.some((c) => c.type === type && c.hasIt);
  };

  // Helper to get expiry date for a certification
  const getCertificationExpiry = (type: string) => {
    const cert = certificationChecklist.find((c) => c.type === type);
    return cert?.expiryDate || "";
  };

  // Helper to get custom name for a certification
  const getCertificationCustomName = (type: string) => {
    const cert = certificationChecklist.find((c) => c.type === type);
    return cert?.customName || "";
  };

  // Count selected certifications in a category
  const getSelectedCountForCategory = (category: string) => {
    const categoryTypes: string[] = certsByCategory[category]?.map((c) => c.type) || [];
    return certificationChecklist.filter(
      (c) => categoryTypes.includes(c.type) && c.hasIt
    ).length;
  };

  // Handle checkbox toggle
  const handleToggleCertification = (type: string, checked: boolean) => {
    const existing = certificationChecklist.find(
      (c: CertificationItem) => c.type === type
    );
    if (checked) {
      // Add or update
      if (existing) {
        setCertificationChecklist(
          certificationChecklist.map((c: CertificationItem) =>
            c.type === type ? { ...c, hasIt: true } : c
          )
        );
      } else {
        setCertificationChecklist([
          ...certificationChecklist,
          { type, hasIt: true },
        ]);
      }
    } else {
      // Remove
      setCertificationChecklist(
        certificationChecklist.filter(
          (c: CertificationItem) => c.type !== type
        )
      );
    }
  };

  // Handle expiry date change
  const handleExpiryChange = (type: string, expiryDate: string) => {
    setCertificationChecklist(
      certificationChecklist.map((c: CertificationItem) =>
        c.type === type ? { ...c, expiryDate } : c
      )
    );
  };

  // Handle custom name change
  const handleCustomNameChange = (type: string, customName: string) => {
    setCertificationChecklist(
      certificationChecklist.map((c: CertificationItem) =>
        c.type === type ? { ...c, customName } : c
      )
    );
  };

  // Get existing custom visas for household staff (dynamic list)
  const customVisas = React.useMemo(() => {
    return certificationChecklist
      .filter((c) => c.type.startsWith("custom_visa_") && c.hasIt)
      .sort((a, b) => {
        const numA = parseInt(a.type.replace("custom_visa_", ""), 10);
        const numB = parseInt(b.type.replace("custom_visa_", ""), 10);
        return numA - numB;
      });
  }, [certificationChecklist]);

  // Add a new custom visa
  const handleAddCustomVisa = () => {
    // Find the next available ID
    const existingIds = certificationChecklist
      .filter((c) => c.type.startsWith("custom_visa_"))
      .map((c) => parseInt(c.type.replace("custom_visa_", ""), 10));
    const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    const newType = `custom_visa_${nextId}`;

    setCertificationChecklist([
      ...certificationChecklist,
      { type: newType, hasIt: true, customName: "", expiryDate: "" },
    ]);
  };

  // Remove a custom visa
  const handleRemoveCustomVisa = (type: string) => {
    setCertificationChecklist(
      certificationChecklist.filter((c) => c.type !== type)
    );
  };

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-navy-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Section A: Essential Documents (Yacht Crew) */}
      {showYachtCerts && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-navy-900">
            Essential Documents
          </h3>
          <p className="text-sm text-gray-500">
            Required documents for yacht crew positions
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <ToggleCard
              title="STCW Basic Safety"
              description="Standards of Training, Certification and Watchkeeping"
              hint="Required for most yacht crew positions"
              checked={hasSTCW === "yes"}
              onChange={(checked) => setHasSTCW(checked ? "yes" : "no")}
              showExpiry
              expiryDate={stcwExpiry}
              onExpiryChange={setSTCWExpiry}
              expiryLabel="STCW Expiry Date"
            />

            {showEng1 && (
              <ToggleCard
                title="ENG1 Medical Certificate"
                description="Seafarer medical fitness certificate"
                hint="Required for UK-flagged vessels"
                checked={hasENG1 === "yes"}
                onChange={(checked) => setHasENG1(checked ? "yes" : "no")}
                showExpiry
                expiryDate={eng1Expiry}
                onExpiryChange={setENG1Expiry}
                expiryLabel="ENG1 Expiry Date"
              />
            )}
          </div>
        </div>
      )}

      {/* Section B: Visas - Only for yacht crew (seaman's visas) */}
      {showYachtCerts && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-navy-900">Visas</h3>
          <p className="text-sm text-gray-500">
            Visa status for international placements
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <ToggleCard
              title="Schengen Visa"
              description="Travel authorization for Schengen area"
              hint="Covers 27 European countries"
              checked={hasSchengen === "yes"}
              onChange={(checked) => setHasSchengen(checked ? "yes" : "no")}
              showExpiry
              expiryDate={schengenExpiry}
              onExpiryChange={setSchengenExpiry}
              expiryLabel="Schengen Expiry Date"
            />

            <ToggleCard
              title="B1/B2 US Visa"
              description="US visitor visa for business/tourism"
              hint="Required for US-based placements"
              checked={hasB1B2 === "yes"}
              onChange={(checked) => setHasB1B2(checked ? "yes" : "no")}
              showExpiry
              expiryDate={b1b2Expiry}
              onExpiryChange={setB1B2Expiry}
              expiryLabel="B1/B2 Expiry Date"
            />
          </div>
        </div>
      )}

      {/* Section B2: Visas - For household staff (dynamic custom visa entry) */}
      {!showYachtCerts && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-navy-900">
            Work Permits & Visas
          </h3>
          <p className="text-sm text-gray-500">
            Add any work permits or visas you hold for international placements
          </p>

          {/* Existing visas */}
          {customVisas.length > 0 && (
            <div className="space-y-3">
              {customVisas.map((visa, index) => (
                <div
                  key={visa.type}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Visa / Permit Name
                        </label>
                        <TextInput
                          type="text"
                          value={visa.customName || ""}
                          onChange={(value) =>
                            handleCustomNameChange(visa.type, value)
                          }
                          placeholder={`e.g., ${index === 0 ? "UK Skilled Worker Visa" : "Schengen Work Permit"}`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Expiry Date
                        </label>
                        <TextInput
                          type="date"
                          value={visa.expiryDate || ""}
                          onChange={(value) =>
                            handleExpiryChange(visa.type, value)
                          }
                          className="max-w-[200px]"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomVisa(visa.type)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      aria-label="Remove visa"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add visa button */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddCustomVisa}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Work Permit / Visa
          </Button>
        </div>
      )}

      {/* Section C: Professional Certifications */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-navy-900">
            Professional Certifications
          </h3>
          <p className="text-sm text-gray-500">
            Select all certifications you hold. Add expiry dates where
            applicable.
          </p>
        </div>

        <div className="space-y-3">
          {categories.map((category) => {
            const certs = certsByCategory[category] || [];
            const selectedCount = getSelectedCountForCategory(category);

            return (
              <CertificationAccordion
                key={category}
                title={category}
                selectedCount={selectedCount}
                totalCount={certs.length}
                isExpanded={accordion.isExpanded(category)}
                onToggle={() => accordion.toggle(category)}
              >
                {certs.map((cert) => {
                  const isChecked = isCertificationChecked(cert.type);
                  const expiryDate = getCertificationExpiry(cert.type);
                  const customName = getCertificationCustomName(cert.type);
                  const allowCustom = "allowCustom" in cert && cert.allowCustom;

                  return (
                    <CertificationCheckbox
                      key={cert.type}
                      id={cert.type}
                      label={cert.label}
                      checked={isChecked}
                      onToggle={(checked) =>
                        handleToggleCertification(cert.type, checked)
                      }
                      expiryDate={expiryDate}
                      onExpiryChange={(date) =>
                        handleExpiryChange(cert.type, date)
                      }
                      allowCustomName={allowCustom}
                      customName={customName}
                      onCustomNameChange={(name) =>
                        handleCustomNameChange(cert.type, name)
                      }
                      customNamePlaceholder="Enter certification name"
                      showExpiryWhenChecked={true}
                    />
                  );
                })}
              </CertificationAccordion>
            );
          })}
        </div>
      </div>
    </div>
  );
}
