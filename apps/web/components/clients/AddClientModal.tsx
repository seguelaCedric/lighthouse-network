"use client";

import * as React from "react";
import { Loader2, Building2, Anchor, User, Ship } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCreateClient } from "@/hooks/useClients";
import { cn } from "@/lib/utils";
import type { ClientType, ClientStatus, VesselType, SourceType } from "@/lib/validations/client";

interface AddClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const clientTypes: { value: ClientType; label: string; icon: React.ReactNode }[] = [
  { value: "yacht", label: "Yacht", icon: <Anchor className="size-4" /> },
  { value: "management_co", label: "Management Company", icon: <Building2 className="size-4" /> },
  { value: "private_owner", label: "Private Owner", icon: <User className="size-4" /> },
  { value: "charter_co", label: "Charter Company", icon: <Ship className="size-4" /> },
];

const vesselTypes: { value: VesselType; label: string }[] = [
  { value: "motor", label: "Motor Yacht" },
  { value: "sailing", label: "Sailing Yacht" },
  { value: "catamaran", label: "Catamaran" },
  { value: "explorer", label: "Explorer" },
  { value: "expedition", label: "Expedition" },
  { value: "classic", label: "Classic" },
];

const statusOptions: { value: ClientStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "prospect", label: "Prospect" },
  { value: "inactive", label: "Inactive" },
];

const sourceOptions: { value: SourceType; label: string }[] = [
  { value: "referral", label: "Referral" },
  { value: "website", label: "Website" },
  { value: "event", label: "Event / Show" },
  { value: "cold_outreach", label: "Cold Outreach" },
  { value: "social_media", label: "Social Media" },
  { value: "other", label: "Other" },
];

export function AddClientModal({ open, onOpenChange, onSuccess }: AddClientModalProps) {
  const createClient = useCreateClient();

  const [formData, setFormData] = React.useState({
    name: "",
    type: "yacht" as ClientType,
    primary_contact_name: "",
    primary_contact_email: "",
    primary_contact_phone: "",
    primary_contact_role: "",
    vessel_name: "",
    vessel_type: "" as VesselType | "",
    vessel_size: "",
    vessel_flag: "",
    vessel_build_year: "",
    status: "active" as ClientStatus,
    source: "" as SourceType | "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (type: ClientType) => {
    setFormData((prev) => ({ ...prev, type }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Client name is required");
      return;
    }

    try {
      await createClient.mutateAsync({
        name: formData.name,
        type: formData.type,
        primary_contact_name: formData.primary_contact_name || null,
        primary_contact_email: formData.primary_contact_email || null,
        primary_contact_phone: formData.primary_contact_phone || null,
        primary_contact_role: formData.primary_contact_role || null,
        vessel_name: formData.vessel_name || null,
        vessel_type: (formData.vessel_type as VesselType) || null,
        vessel_size: formData.vessel_size ? parseInt(formData.vessel_size, 10) : null,
        vessel_flag: formData.vessel_flag || null,
        vessel_build_year: formData.vessel_build_year
          ? parseInt(formData.vessel_build_year, 10)
          : null,
        status: formData.status,
        source: (formData.source as SourceType) || null,
        notes: formData.notes || null,
      });

      toast.success("Client created successfully");
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create client");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "yacht",
      primary_contact_name: "",
      primary_contact_email: "",
      primary_contact_phone: "",
      primary_contact_role: "",
      vessel_name: "",
      vessel_type: "",
      vessel_size: "",
      vessel_flag: "",
      vessel_build_year: "",
      status: "active",
      source: "",
      notes: "",
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const isYacht = formData.type === "yacht";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Add New Client</DialogTitle>
          <DialogDescription>
            Add a new yacht or management company to your client list.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          {/* Client Type Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Client Type</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {clientTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleTypeChange(type.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-3 transition-all",
                    formData.type === type.value
                      ? "border-gold-500 bg-gold-50 text-gold-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  {type.icon}
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                {isYacht ? "Yacht Name" : "Company Name"} *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={isYacht ? "M/Y Excellence" : "Blue Marine Management"}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="source" className="mb-1 block text-sm font-medium text-gray-700">
                  Source
                </label>
                <select
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                >
                  <option value="">Select source...</option>
                  {sourceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Vessel Info (only for yachts) */}
          {isYacht && (
            <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-navy-800">Vessel Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="vessel_type"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Vessel Type
                  </label>
                  <select
                    id="vessel_type"
                    name="vessel_type"
                    value={formData.vessel_type}
                    onChange={handleChange}
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  >
                    <option value="">Select type...</option>
                    {vesselTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="vessel_size"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Size (meters)
                  </label>
                  <input
                    type="number"
                    id="vessel_size"
                    name="vessel_size"
                    value={formData.vessel_size}
                    onChange={handleChange}
                    placeholder="65"
                    min="1"
                    max="200"
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="vessel_flag"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Flag
                  </label>
                  <input
                    type="text"
                    id="vessel_flag"
                    name="vessel_flag"
                    value={formData.vessel_flag}
                    onChange={handleChange}
                    placeholder="Cayman Islands"
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="vessel_build_year"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Build Year
                  </label>
                  <input
                    type="number"
                    id="vessel_build_year"
                    name="vessel_build_year"
                    value={formData.vessel_build_year}
                    onChange={handleChange}
                    placeholder="2022"
                    min="1900"
                    max={new Date().getFullYear() + 5}
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Primary Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-navy-800">Primary Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="primary_contact_name"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Contact Name
                </label>
                <input
                  type="text"
                  id="primary_contact_name"
                  name="primary_contact_name"
                  value={formData.primary_contact_name}
                  onChange={handleChange}
                  placeholder="Captain Mike"
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
              <div>
                <label
                  htmlFor="primary_contact_role"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Role
                </label>
                <input
                  type="text"
                  id="primary_contact_role"
                  name="primary_contact_role"
                  value={formData.primary_contact_role}
                  onChange={handleChange}
                  placeholder="Captain, Fleet Manager..."
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
              <div>
                <label
                  htmlFor="primary_contact_email"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="primary_contact_email"
                  name="primary_contact_email"
                  value={formData.primary_contact_email}
                  onChange={handleChange}
                  placeholder="captain@yacht.com"
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
              <div>
                <label
                  htmlFor="primary_contact_phone"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Phone
                </label>
                <input
                  type="tel"
                  id="primary_contact_phone"
                  name="primary_contact_phone"
                  value={formData.primary_contact_phone}
                  onChange={handleChange}
                  placeholder="+33 6 12 34 56 78"
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional notes about this client..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={createClient.isPending}>
              {createClient.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Client"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
