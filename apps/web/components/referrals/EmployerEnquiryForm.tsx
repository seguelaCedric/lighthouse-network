"use client";

import * as React from "react";
import { useState } from "react";
import { Building2, User, Mail, Phone, FileText, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EmployerEnquiryFormProps {
  onSuccess?: () => void;
  canSubmit: boolean;
  reason?: string;
  enquiriesThisMonth: number;
  className?: string;
}

export function EmployerEnquiryForm({
  onSuccess,
  canSubmit,
  reason,
  enquiriesThisMonth,
  className,
}: EmployerEnquiryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      toast.error(reason || "Cannot submit at this time");
      return;
    }

    if (!formData.company_name.trim()) {
      toast.error("Please enter the company or yacht name");
      return;
    }

    if (!formData.contact_name.trim()) {
      toast.error("Please enter the contact person's name");
      return;
    }

    if (!formData.contact_email.trim() && !formData.contact_phone.trim()) {
      toast.error("Please provide at least one contact method (email or phone)");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/referrals/employer-enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit");
      }

      toast.success("Employer lead submitted! We'll review it shortly.");
      setFormData({
        company_name: "",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        notes: "",
      });
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-6",
        className
      )}
    >
      <div className="mb-6">
        <h3 className="font-serif text-lg font-medium text-navy-800">
          Submit an Employer Lead
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Know someone looking to hire yacht crew or household staff? Submit
          their details and earn <strong>€200</strong> for each placement.
          Plus, new clients get <strong>15% off</strong> their first placement!
        </p>
      </div>

      {!canSubmit && reason && (
        <div className="mb-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          {reason}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Company Name */}
        <div>
          <label
            htmlFor="company_name"
            className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            <Building2 className="size-4 text-gray-400" />
            Company / Yacht Name *
          </label>
          <input
            type="text"
            id="company_name"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            placeholder="e.g., M/Y Serenity, Private Estate Management"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
            disabled={!canSubmit || isSubmitting}
          />
        </div>

        {/* Contact Name */}
        <div>
          <label
            htmlFor="contact_name"
            className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            <User className="size-4 text-gray-400" />
            Contact Person *
          </label>
          <input
            type="text"
            id="contact_name"
            name="contact_name"
            value={formData.contact_name}
            onChange={handleChange}
            placeholder="e.g., Captain John Smith, Mrs. Sarah Johnson"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
            disabled={!canSubmit || isSubmitting}
          />
        </div>

        {/* Contact Email & Phone */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="contact_email"
              className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <Mail className="size-4 text-gray-400" />
              Email
            </label>
            <input
              type="email"
              id="contact_email"
              name="contact_email"
              value={formData.contact_email}
              onChange={handleChange}
              placeholder="captain@yacht.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
              disabled={!canSubmit || isSubmitting}
            />
          </div>

          <div>
            <label
              htmlFor="contact_phone"
              className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <Phone className="size-4 text-gray-400" />
              Phone
            </label>
            <input
              type="tel"
              id="contact_phone"
              name="contact_phone"
              value={formData.contact_phone}
              onChange={handleChange}
              placeholder="+33 6 12 34 56 78"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
              disabled={!canSubmit || isSubmitting}
            />
          </div>
        </div>

        <p className="text-xs text-gray-500">
          * At least one contact method (email or phone) is required
        </p>

        {/* Notes */}
        <div>
          <label
            htmlFor="notes"
            className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            <FileText className="size-4 text-gray-400" />
            Additional Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            placeholder="What positions are they looking for? Any other helpful details..."
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
            disabled={!canSubmit || isSubmitting}
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">
            {enquiriesThisMonth} leads submitted this month
          </p>
          <Button
            type="submit"
            variant="primary"
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 size-4" />
                Submit Lead
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
