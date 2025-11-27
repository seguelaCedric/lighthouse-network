"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CurrentPlanCard,
  UsageCard,
  PaymentMethodCard,
  InvoiceTable,
  CancelSubscriptionModal,
} from "@/components/billing";
import type {
  AgencySubscriptionWithPlan,
  SubscriptionPlan,
  SubscriptionUsage,
  Invoice,
  PaymentMethodDetails,
} from "@lighthouse/database";

interface BillingData {
  subscription: AgencySubscriptionWithPlan | null;
  plan: SubscriptionPlan | null;
  usage: SubscriptionUsage;
  is_on_free_plan: boolean;
}

interface InvoicesData {
  invoices: Invoice[];
  total: number;
}

export default function BillingSettingsPage() {
  const router = useRouter();
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [invoicesData, setInvoicesData] = useState<InvoicesData | null>(null);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodDetails | null>(null);
  const [pendingFees, setPendingFees] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Fetch billing data
  useEffect(() => {
    async function fetchData() {
      try {
        const [subscriptionRes, invoicesRes, paymentRes] = await Promise.all([
          fetch("/api/billing/subscription"),
          fetch("/api/billing/invoices?limit=5"),
          fetch("/api/billing/payment-method"),
        ]);

        if (subscriptionRes.ok) {
          const data = await subscriptionRes.json();
          setBillingData(data);
          // Calculate pending fees from placement fee percent
          if (data.usage?.placements_this_month?.used > 0 && data.plan) {
            // This is a rough estimate - actual pending fees would come from placement_fees table
            setPendingFees(0); // Would be calculated from actual placements
          }
        }

        if (invoicesRes.ok) {
          const data = await invoicesRes.json();
          setInvoicesData(data);
        }

        if (paymentRes.ok) {
          const data = await paymentRes.json();
          setPaymentMethod(data.payment_method || null);
        }
      } catch (error) {
        console.error("Failed to fetch billing data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Handle navigation to plans page
  const handleUpgrade = () => {
    router.push("/settings/billing/plans");
  };

  const handleChangePlan = () => {
    router.push("/settings/billing/plans");
  };

  // Handle cancel subscription
  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async (
    immediately: boolean,
    reason?: string
  ): Promise<void> => {
    const res = await fetch("/api/billing/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cancel_immediately: immediately,
        cancellation_reason: reason,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to cancel subscription");
    }

    // Refresh billing data
    const subscriptionRes = await fetch("/api/billing/subscription");
    if (subscriptionRes.ok) {
      setBillingData(await subscriptionRes.json());
    }
  };

  // Handle payment method update (opens Stripe portal)
  const handleUpdatePaymentMethod = async () => {
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ return_url: window.location.href }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch (error) {
      console.error("Failed to open billing portal:", error);
    }
  };

  // Handle invoice download
  const handleDownloadInvoice = (invoice: Invoice) => {
    if (invoice.invoice_pdf_url) {
      window.open(invoice.invoice_pdf_url, "_blank");
    }
  };

  // Handle view invoice online
  const handleViewInvoice = (invoice: Invoice) => {
    if (invoice.hosted_invoice_url) {
      window.open(invoice.hosted_invoice_url, "_blank");
    }
  };

  // Handle view all invoices
  const handleViewAllInvoices = () => {
    router.push("/settings/billing/invoices");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-serif font-medium text-navy-800">
          Billing & Subscription
        </h2>
        <p className="text-sm text-gray-500">
          Manage your subscription and payment methods
        </p>
      </div>

      {/* Current Plan */}
      <CurrentPlanCard
        subscription={billingData?.subscription || null}
        plan={billingData?.plan || null}
        onUpgrade={handleUpgrade}
        onCancel={handleCancel}
        onChangePlan={handleChangePlan}
        isLoading={isLoading}
      />

      {/* Usage Stats */}
      <UsageCard
        usage={billingData?.usage || null}
        pendingFees={pendingFees}
        placementFeePercent={billingData?.plan?.placement_fee_percent || 10}
        isLoading={isLoading}
      />

      {/* Payment Method */}
      <PaymentMethodCard
        paymentMethod={paymentMethod}
        onUpdate={handleUpdatePaymentMethod}
        isLoading={isLoading}
      />

      {/* Invoice History */}
      <InvoiceTable
        invoices={invoicesData?.invoices || []}
        onDownload={handleDownloadInvoice}
        onViewOnline={handleViewInvoice}
        showViewAll={(invoicesData?.total || 0) > 5}
        onViewAll={handleViewAllInvoices}
        isLoading={isLoading}
        compact
      />

      {/* Cancel Subscription Modal */}
      {billingData?.plan && !billingData.is_on_free_plan && (
        <CancelSubscriptionModal
          open={showCancelModal}
          onOpenChange={setShowCancelModal}
          plan={billingData.plan}
          periodEndDate={billingData.subscription?.current_period_end || null}
          onConfirm={handleConfirmCancel}
        />
      )}
    </div>
  );
}
