"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  MoreHorizontal,
  Building2,
} from "lucide-react";

interface PlacementFee {
  id: string;
  placement_id: string;
  agency_id: string;
  invoice_id: string | null;
  placement_value: number;
  fee_percent: number;
  platform_fee: number;
  currency: string;
  status: "pending" | "invoiced" | "paid" | "waived";
  placement_date: string;
  invoiced_at: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  placement?: {
    id: string;
    candidate?: { first_name: string; last_name: string };
    job?: { title: string };
    client?: { name: string };
  };
  agency?: { name: string };
  invoice?: { invoice_number: string; status: string };
}

interface FeeStats {
  pending_count: number;
  pending_amount: number;
  invoiced_count: number;
  invoiced_amount: number;
  paid_count: number;
  paid_amount: number;
}

const statusConfig = {
  pending: {
    label: "Pending",
    bg: "bg-gold-100",
    text: "text-gold-700",
    icon: Clock,
  },
  invoiced: {
    label: "Invoiced",
    bg: "bg-blue-100",
    text: "text-blue-700",
    icon: FileText,
  },
  paid: {
    label: "Paid",
    bg: "bg-success-100",
    text: "text-success-700",
    icon: CheckCircle2,
  },
  waived: {
    label: "Waived",
    bg: "bg-gray-100",
    text: "text-gray-500",
    icon: XCircle,
  },
};

function formatCurrency(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminBillingPage() {
  const [fees, setFees] = useState<PlacementFee[]>([]);
  const [stats, setStats] = useState<FeeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [selectedFees, setSelectedFees] = useState<Set<string>>(new Set());
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const limit = 20;

  const fetchFees = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const res = await fetch(`/api/admin/billing/placement-fees?${params}`);
      const data = await res.json();

      if (res.ok) {
        setFees(data.fees || []);
        setTotal(data.total || 0);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error("Error fetching fees:", error);
    } finally {
      setIsLoading(false);
    }
  }, [offset, statusFilter]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  const handleSelectFee = (feeId: string) => {
    const newSelected = new Set(selectedFees);
    if (newSelected.has(feeId)) {
      newSelected.delete(feeId);
    } else {
      newSelected.add(feeId);
    }
    setSelectedFees(newSelected);
  };

  const handleSelectAllPending = () => {
    const pendingFees = fees.filter((f) => f.status === "pending");
    if (pendingFees.every((f) => selectedFees.has(f.id))) {
      // Deselect all
      setSelectedFees(new Set());
    } else {
      // Select all pending
      setSelectedFees(new Set(pendingFees.map((f) => f.id)));
    }
  };

  const handleCreateInvoice = async () => {
    if (selectedFees.size === 0) return;

    // Group fees by agency
    const feesByAgency = new Map<string, string[]>();
    for (const feeId of selectedFees) {
      const fee = fees.find((f) => f.id === feeId);
      if (fee && fee.status === "pending") {
        const existing = feesByAgency.get(fee.agency_id) || [];
        existing.push(feeId);
        feesByAgency.set(fee.agency_id, existing);
      }
    }

    if (feesByAgency.size === 0) {
      alert("No pending fees selected");
      return;
    }

    if (feesByAgency.size > 1) {
      alert("Please select fees from only one agency at a time");
      return;
    }

    setIsCreatingInvoice(true);
    try {
      const [agencyId, feeIds] = [...feesByAgency.entries()][0];

      const res = await fetch("/api/admin/billing/placement-fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agency_id: agencyId,
          fee_ids: feeIds,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Invoice created! Total: ${formatCurrency(data.total)}`);
        setSelectedFees(new Set());
        fetchFees();
      } else {
        alert(data.error || "Failed to create invoice");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      alert("Failed to create invoice");
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const hasPrevious = offset > 0;
  const hasNext = total > offset + fees.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            Billing & Placement Fees
          </h1>
          <p className="mt-1 text-gray-500">
            Manage placement fees and generate invoices for agencies
          </p>
        </div>
        <Button variant="secondary" onClick={fetchFees} disabled={isLoading}>
          <RefreshCw
            className={cn("mr-2 size-4", isLoading && "animate-spin")}
          />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gold-100">
              <Clock className="size-5 text-gold-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Fees</p>
              <p className="text-2xl font-bold text-navy-900">
                {formatCurrency(stats?.pending_amount || 0)}
              </p>
              <p className="text-xs text-gray-400">
                {stats?.pending_count || 0} placements
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100">
              <FileText className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Invoiced</p>
              <p className="text-2xl font-bold text-navy-900">
                {formatCurrency(stats?.invoiced_amount || 0)}
              </p>
              <p className="text-xs text-gray-400">
                {stats?.invoiced_count || 0} invoices
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-success-100">
              <CheckCircle2 className="size-5 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Collected</p>
              <p className="text-2xl font-bold text-navy-900">
                {formatCurrency(stats?.paid_amount || 0)}
              </p>
              <p className="text-xs text-gray-400">
                {stats?.paid_count || 0} paid
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-navy-100">
              <TrendingUp className="size-5 text-navy-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-navy-900">
                {formatCurrency(
                  (stats?.paid_amount || 0) + (stats?.invoiced_amount || 0)
                )}
              </p>
              <p className="text-xs text-gray-400">All time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <Filter className="size-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setOffset(0);
            }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="invoiced">Invoiced</option>
            <option value="paid">Paid</option>
            <option value="waived">Waived</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {selectedFees.size > 0 && (
            <span className="mr-2 text-sm text-gray-500">
              {selectedFees.size} selected
            </span>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateInvoice}
            disabled={selectedFees.size === 0 || isCreatingInvoice}
          >
            {isCreatingInvoice ? (
              <>
                <RefreshCw className="mr-2 size-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <FileText className="mr-2 size-4" />
                Create Invoice
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Fees Table */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="p-8">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="size-5 rounded bg-gray-200" />
                  <div className="h-4 w-24 rounded bg-gray-200" />
                  <div className="h-4 w-32 rounded bg-gray-200" />
                  <div className="h-4 w-20 rounded bg-gray-200" />
                  <div className="h-4 w-16 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        ) : fees.length === 0 ? (
          <div className="p-8 text-center">
            <CreditCard className="mx-auto size-12 text-gray-300" />
            <h3 className="mt-4 font-medium text-navy-900">
              No placement fees found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Fees will appear here when placements are confirmed
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-4 text-xs font-medium uppercase text-gray-500">
                <div className="w-8">
                  <input
                    type="checkbox"
                    checked={
                      fees.filter((f) => f.status === "pending").length > 0 &&
                      fees
                        .filter((f) => f.status === "pending")
                        .every((f) => selectedFees.has(f.id))
                    }
                    onChange={handleSelectAllPending}
                    className="size-4 rounded border-gray-300"
                  />
                </div>
                <div className="w-36">Agency</div>
                <div className="flex-1">Placement</div>
                <div className="w-28 text-right">Value</div>
                <div className="w-24 text-right">Fee</div>
                <div className="w-20">Status</div>
                <div className="w-24">Date</div>
                <div className="w-8" />
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {fees.map((fee) => {
                const status = statusConfig[fee.status];
                const StatusIcon = status.icon;
                const isPending = fee.status === "pending";

                return (
                  <div
                    key={fee.id}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 hover:bg-gray-50",
                      selectedFees.has(fee.id) && "bg-gold-50"
                    )}
                  >
                    <div className="w-8">
                      {isPending ? (
                        <input
                          type="checkbox"
                          checked={selectedFees.has(fee.id)}
                          onChange={() => handleSelectFee(fee.id)}
                          className="size-4 rounded border-gray-300"
                        />
                      ) : (
                        <span className="size-4" />
                      )}
                    </div>

                    <div className="w-36">
                      <div className="flex items-center gap-2">
                        <Building2 className="size-4 text-gray-400" />
                        <span className="text-sm font-medium text-navy-900 truncate">
                          {fee.agency?.name || "Unknown"}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy-900 truncate">
                        {fee.placement?.candidate?.first_name}{" "}
                        {fee.placement?.candidate?.last_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {fee.placement?.job?.title} •{" "}
                        {fee.placement?.client?.name}
                      </p>
                    </div>

                    <div className="w-28 text-right">
                      <p className="text-sm text-gray-600">
                        {formatCurrency(fee.placement_value, fee.currency)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {fee.fee_percent}% fee
                      </p>
                    </div>

                    <div className="w-24 text-right">
                      <p className="text-sm font-semibold text-navy-900">
                        {formatCurrency(fee.platform_fee, fee.currency)}
                      </p>
                    </div>

                    <div className="w-20">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          status.bg,
                          status.text
                        )}
                      >
                        <StatusIcon className="size-3" />
                        {status.label}
                      </span>
                    </div>

                    <div className="w-24">
                      <p className="text-xs text-gray-500">
                        {formatDate(fee.placement_date)}
                      </p>
                      {fee.invoice?.invoice_number && (
                        <p className="text-xs text-blue-600">
                          {fee.invoice.invoice_number}
                        </p>
                      )}
                    </div>

                    <div className="w-8">
                      <button className="rounded p-1 hover:bg-gray-100">
                        <MoreHorizontal className="size-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                <p className="text-sm text-gray-500">
                  Showing {offset + 1}-{Math.min(offset + fees.length, total)}{" "}
                  of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={!hasPrevious}
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  <span className="px-2 text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setOffset(offset + limit)}
                    disabled={!hasNext}
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
