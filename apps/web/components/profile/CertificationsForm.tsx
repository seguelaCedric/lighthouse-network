"use client";

import * as React from "react";
import { FormField } from "@/components/ui/FormField";
import { TextInput } from "@/components/ui/TextInput";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { certificationChecklistOptions, type CandidateType } from "./constants";

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

  // Certification checklist
  certificationChecklist: CertificationItem[];
  setCertificationChecklist: (value: CertificationItem[]) => void;

  // Visas
  hasSchengen: string;
  setHasSchengen: (value: string) => void;
  hasB1B2: string;
  setHasB1B2: (value: string) => void;
  hasENG1: string;
  setHasENG1: (value: string) => void;
  eng1Expiry: string;
  setENG1Expiry: (value: string) => void;
}

export function CertificationsForm({
  candidateType,
  hasSTCW,
  setHasSTCW,
  stcwExpiry,
  setSTCWExpiry,
  certificationChecklist,
  setCertificationChecklist,
  hasSchengen,
  setHasSchengen,
  hasB1B2,
  setHasB1B2,
  hasENG1,
  setHasENG1,
  eng1Expiry,
  setENG1Expiry,
}: CertificationsFormProps) {
  const showYachtCerts = candidateType === "yacht_crew" || candidateType === "both";
  const showB1B2 = candidateType !== "household_staff";
  const showEng1 = candidateType === "yacht_crew" || candidateType === "both";
  const title = showYachtCerts ? "Certifications & Visas" : "Visas";
  const subtitle = showYachtCerts
    ? "Professional certifications and visa status"
    : "Visa status for international placements";

  // Type for certification option
  type CertOption = (typeof certificationChecklistOptions)[number];

  // Group certifications by category
  const certsByCategory = React.useMemo(() => {
    const grouped: Record<string, CertOption[]> = {};
    certificationChecklistOptions.forEach((cert) => {
      if (!grouped[cert.category]) {
        grouped[cert.category] = [];
      }
      grouped[cert.category].push(cert);
    });
    return grouped;
  }, []);

  const categories = Object.keys(certsByCategory);

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

  // Handle checkbox toggle
  const handleToggleCertification = (type: string, checked: boolean) => {
    const existing = certificationChecklist.find((c: CertificationItem) => c.type === type);
    if (checked) {
      // Add or update
      if (existing) {
        setCertificationChecklist(
          certificationChecklist.map((c: CertificationItem) =>
            c.type === type ? { ...c, hasIt: true } : c
          )
        );
      } else {
        setCertificationChecklist([...certificationChecklist, { type, hasIt: true }]);
      }
    } else {
      // Remove
      setCertificationChecklist(
        certificationChecklist.filter((c: CertificationItem) => c.type !== type)
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

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-navy-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>

      {/* Section A: STCW Basic Safety */}
      {showYachtCerts && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
          <FormField label="STCW Basic Safety" hint="Required for most yacht crew positions">
            <RadioGroup
              name="stcw"
              value={hasSTCW}
              onChange={setHasSTCW}
              options={[
                { value: "no", label: "No" },
                { value: "yes", label: "Yes" },
              ]}
            />
            {hasSTCW === "yes" && (
              <div className="mt-3">
                <label className="mb-1 block text-xs text-gray-500">Expiry Date (optional)</label>
                <TextInput type="date" value={stcwExpiry} onChange={setSTCWExpiry} />
              </div>
            )}
          </FormField>
        </div>
      )}

      {/* Section B: Certification Checklist */}
      {showYachtCerts && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-navy-900">Professional Certifications</h3>
            <p className="mt-1 text-sm text-gray-500">
              Select all certifications you hold. Add expiry dates where applicable.
            </p>
          </div>

          {categories.map((category) => (
            <div key={category} className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">{category}</h4>
              <div className="space-y-3">
                {certsByCategory[category].map((cert) => {
                  const isChecked = isCertificationChecked(cert.type);
                  const expiryDate = getCertificationExpiry(cert.type);
                  const customName = getCertificationCustomName(cert.type);

                  return (
                    <div key={cert.type} className="space-y-2">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isChecked}
                          onChange={(checked) =>
                            handleToggleCertification(cert.type, checked)
                          }
                          id={`cert-${cert.type}`}
                        />
                        <label
                          htmlFor={`cert-${cert.type}`}
                          className="flex-1 cursor-pointer text-sm text-gray-700"
                        >
                          {cert.label}
                        </label>
                      </div>

                      {isChecked && (
                        <div className="ml-7 space-y-2">
                          {"allowCustom" in cert && cert.allowCustom && (
                            <div>
                              <label className="mb-1 block text-xs text-gray-500">
                                Certification Name
                              </label>
                              <TextInput
                                value={customName}
                                onChange={(value) => handleCustomNameChange(cert.type, value)}
                                placeholder="e.g. Wine Sommelier Level 4"
                              />
                            </div>
                          )}
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">
                              Expiry Date (optional)
                            </label>
                            <TextInput
                              type="date"
                              value={expiryDate}
                              onChange={(value) => handleExpiryChange(cert.type, value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section C: Visas & Medical */}
      <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h3 className="text-lg font-semibold text-navy-900">Visas & Medical</h3>

        <FormField label="Schengen Visa">
          <RadioGroup
            name="schengen"
            value={hasSchengen}
            onChange={setHasSchengen}
            options={[
              { value: "no", label: "No" },
              { value: "yes", label: "Yes" },
            ]}
          />
        </FormField>

        {showB1B2 && (
          <FormField label="B1/B2 US Visa">
            <RadioGroup
              name="b1b2"
              value={hasB1B2}
              onChange={setHasB1B2}
              options={[
                { value: "no", label: "No" },
                { value: "yes", label: "Yes" },
              ]}
            />
          </FormField>
        )}

        {showEng1 && (
          <FormField label="ENG1 Medical Certificate" hint="Required for yacht crew">
            <RadioGroup
              name="eng1"
              value={hasENG1}
              onChange={setHasENG1}
              options={[
                { value: "no", label: "No" },
                { value: "yes", label: "Yes" },
              ]}
            />
            {hasENG1 === "yes" && (
              <div className="mt-3">
                <label className="mb-1 block text-xs text-gray-500">Expiry Date</label>
                <TextInput type="date" value={eng1Expiry} onChange={setENG1Expiry} />
              </div>
            )}
          </FormField>
        )}
      </div>
    </div>
  );
}
