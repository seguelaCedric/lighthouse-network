"use client";

import * as React from "react";
import { useState } from "react";
import { X, CreditCard, Wallet, AlertCircle, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PayoutRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  minPayoutAmount: number;
  onSuccess?: () => void;
}

type PayoutMethod = "bank_transfer" | "paypal" | "revolut" | "wise";

interface PayoutDetails {
  method: PayoutMethod;
  // Bank transfer
  account_name?: string;
  iban?: string;
  bic?: string;
  bank_name?: string;
  // PayPal/Revolut/Wise
  email?: string;
  phone?: string;
  notes?: string;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function PayoutRequestModal({
  isOpen,
  onClose,
  availableBalance,
  minPayoutAmount,
  onSuccess,
}: PayoutRequestModalProps) {
  const [method, setMethod] = useState<PayoutMethod>("bank_transfer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    account_name: "",
    iban: "",
    bic: "",
    bank_name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const canPayout = availableBalance >= minPayoutAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canPayout) {
      toast.error(`Minimum payout amount is ${formatCurrency(minPayoutAmount)}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/referrals/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          details: formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to request payout");
      }

      toast.success("Payout request submitted successfully!");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to request payout");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="font-serif text-xl font-medium text-navy-800">
            Request Payout
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <X className="size-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Balance Info */}
          <div className="mb-6 rounded-lg bg-gold-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gold-700">Available balance</span>
              <span className="text-2xl font-bold text-gold-800">
                {formatCurrency(availableBalance)}
              </span>
            </div>
            <p className="mt-1 text-xs text-gold-600">
              Minimum payout: {formatCurrency(minPayoutAmount)}
            </p>
          </div>

          {!canPayout && (
            <div className="mb-6 flex items-start gap-3 rounded-lg bg-error-50 p-4">
              <AlertCircle className="size-5 shrink-0 text-error-500" />
              <div>
                <p className="text-sm font-medium text-error-700">
                  Insufficient balance
                </p>
                <p className="text-xs text-error-600">
                  You need at least {formatCurrency(minPayoutAmount)} to request a payout.
                </p>
              </div>
            </div>
          )}

          {/* Payout Method */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-navy-900">
              Payout Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod("bank_transfer")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors",
                  method === "bank_transfer"
                    ? "border-gold-400 bg-gold-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <CreditCard
                  className={cn(
                    "size-6",
                    method === "bank_transfer" ? "text-gold-600" : "text-gray-400"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    method === "bank_transfer" ? "text-gold-700" : "text-gray-600"
                  )}
                >
                  Bank Transfer
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMethod("paypal")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors",
                  method === "paypal"
                    ? "border-gold-400 bg-gold-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <Wallet
                  className={cn(
                    "size-6",
                    method === "paypal" ? "text-gold-600" : "text-gray-400"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    method === "paypal" ? "text-gold-700" : "text-gray-600"
                  )}
                >
                  PayPal
                </span>
              </button>
            </div>
          </div>

          {/* Bank Transfer Form */}
          {method === "bank_transfer" && (
            <div className="mb-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-900">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.account_name}
                  onChange={(e) =>
                    setFormData({ ...formData, account_name: e.target.value })
                  }
                  placeholder="John Smith"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-navy-900">
                  IBAN *
                </label>
                <input
                  type="text"
                  required
                  value={formData.iban}
                  onChange={(e) =>
                    setFormData({ ...formData, iban: e.target.value.toUpperCase() })
                  }
                  placeholder="FR76 1234 5678 9012 3456 7890 123"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 font-mono text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-900">
                    BIC/SWIFT
                  </label>
                  <input
                    type="text"
                    value={formData.bic}
                    onChange={(e) =>
                      setFormData({ ...formData, bic: e.target.value.toUpperCase() })
                    }
                    placeholder="BNPAFRPP"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 font-mono text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-900">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) =>
                      setFormData({ ...formData, bank_name: e.target.value })
                    }
                    placeholder="BNP Paribas"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PayPal Form */}
          {method === "paypal" && (
            <div className="mb-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-900">
                  PayPal Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-navy-900">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={2}
              placeholder="Any additional information..."
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            />
          </div>

          {/* Info */}
          <p className="mb-6 text-xs text-gray-500">
            Payouts are processed within 5 business days. You'll receive a
            confirmation email once the transfer is complete.
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!canPayout || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Requesting...
                </>
              ) : (
                <>
                  <Check className="mr-2 size-4" />
                  Request Payout
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
