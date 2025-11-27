"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  ChevronRight,
  AlertCircle,
  Building2,
} from "lucide-react";
import type { PaymentMethodDetails } from "@lighthouse/database";

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethodDetails | null;
  onUpdate: () => void;
  isLoading?: boolean;
}

// Card brand icons/colors
const cardBrandStyles: Record<
  string,
  { bg: string; text: string; name: string }
> = {
  visa: { bg: "bg-[#1A1F71]", text: "text-white", name: "Visa" },
  mastercard: { bg: "bg-[#EB001B]", text: "text-white", name: "Mastercard" },
  amex: { bg: "bg-[#006FCF]", text: "text-white", name: "Amex" },
  discover: { bg: "bg-[#FF6600]", text: "text-white", name: "Discover" },
  default: { bg: "bg-navy-900", text: "text-white", name: "Card" },
};

export function PaymentMethodCard({
  paymentMethod,
  onUpdate,
  isLoading,
}: PaymentMethodCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 animate-pulse">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-5 w-32 rounded bg-gray-200" />
          <div className="h-4 w-24 rounded bg-gray-200" />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-lg bg-gray-200" />
            <div className="space-y-2">
              <div className="h-5 w-36 rounded bg-gray-200" />
              <div className="h-4 w-24 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No payment method
  if (!paymentMethod) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-navy-900">Payment Method</h3>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="flex size-12 items-center justify-center rounded-lg border border-gray-200 bg-white">
              <CreditCard className="size-6 text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-navy-900">No payment method</p>
              <p className="text-sm text-gray-500">
                Add a card to upgrade your plan
              </p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={onUpdate}>
            Add Card
          </Button>
        </div>
      </div>
    );
  }

  // Determine if card or SEPA
  const isCard = paymentMethod.last4 && paymentMethod.brand;
  const isSepa = paymentMethod.iban_last4;

  const brandStyle = isCard
    ? cardBrandStyles[paymentMethod.brand?.toLowerCase() || "default"] ||
      cardBrandStyles.default
    : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-navy-900">Payment Method</h3>
        <button
          onClick={onUpdate}
          className="flex items-center gap-1 text-sm font-medium text-gold-600 hover:text-gold-700"
        >
          Update
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-4">
          {isCard && brandStyle && (
            <div
              className={cn(
                "flex size-12 items-center justify-center rounded-lg",
                brandStyle.bg
              )}
            >
              <CreditCard className={cn("size-6", brandStyle.text)} />
            </div>
          )}
          {isSepa && (
            <div className="flex size-12 items-center justify-center rounded-lg bg-blue-600">
              <Building2 className="size-6 text-white" />
            </div>
          )}

          <div>
            {isCard && (
              <>
                <p className="font-medium text-navy-900">
                  {brandStyle?.name || "Card"} ending in {paymentMethod.last4}
                </p>
                {paymentMethod.exp_month && paymentMethod.exp_year && (
                  <p className="text-sm text-gray-500">
                    Expires {String(paymentMethod.exp_month).padStart(2, "0")}/
                    {paymentMethod.exp_year}
                  </p>
                )}
              </>
            )}
            {isSepa && (
              <>
                <p className="font-medium text-navy-900">
                  {paymentMethod.bank_name || "Bank account"} ending in{" "}
                  {paymentMethod.iban_last4}
                </p>
                <p className="text-sm text-gray-500">SEPA Direct Debit</p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-success-100 px-2.5 py-0.5 text-xs font-medium text-success-700">
            Default
          </span>
        </div>
      </div>

      {/* Expiring soon warning */}
      {isCard &&
        paymentMethod.exp_year &&
        paymentMethod.exp_month &&
        isExpiringSoon(paymentMethod.exp_year, paymentMethod.exp_month) && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-gold-50 px-3 py-2 text-sm text-gold-700">
            <AlertCircle className="size-4" />
            Your card expires soon. Please update your payment method.
          </div>
        )}
    </div>
  );
}

function isExpiringSoon(year: number, month: number): boolean {
  const now = new Date();
  const expiryDate = new Date(year, month - 1); // month is 0-indexed
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

  return expiryDate <= threeMonthsFromNow;
}
