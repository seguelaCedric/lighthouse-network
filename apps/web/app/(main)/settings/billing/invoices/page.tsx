"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { InvoiceTable } from "@/components/billing";
import { ArrowLeft, Filter } from "lucide-react";
import type { Invoice, InvoiceStatus } from "@lighthouse/database";

interface InvoicesData {
  invoices: Invoice[];
  total: number;
  limit: number;
  offset: number;
}

const statusFilters: { value: InvoiceStatus | "all"; label: string }[] = [
  { value: "all", label: "All Invoices" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "draft", label: "Draft" },
  { value: "void", label: "Void" },
];

export default function InvoicesPage() {
  const [invoicesData, setInvoicesData] = useState<InvoicesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">(
    "all"
  );
  const [offset, setOffset] = useState(0);
  const limit = 10;

  // Fetch invoices
  useEffect(() => {
    async function fetchInvoices() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          limit: String(limit),
          offset: String(offset),
        });
        if (statusFilter !== "all") {
          params.set("status", statusFilter);
        }

        const res = await fetch(`/api/billing/invoices?${params}`);
        if (res.ok) {
          const data = await res.json();
          setInvoicesData(data);
        }
      } catch (error) {
        console.error("Failed to fetch invoices:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInvoices();
  }, [statusFilter, offset]);

  // Reset offset when filter changes
  useEffect(() => {
    setOffset(0);
  }, [statusFilter]);

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

  // Handle page change
  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset);
  };

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/settings/billing"
            className="flex size-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-serif font-medium text-navy-800">
              Invoice History
            </h2>
            <p className="text-sm text-gray-500">
              View and download your past invoices
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === filter.value
                  ? "bg-navy-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Table */}
      <InvoiceTable
        invoices={invoicesData?.invoices || []}
        total={invoicesData?.total || 0}
        limit={limit}
        offset={offset}
        onPageChange={handlePageChange}
        onDownload={handleDownloadInvoice}
        onViewOnline={handleViewInvoice}
        isLoading={isLoading}
      />

      {/* Summary stats */}
      {invoicesData && invoicesData.total > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 font-semibold text-navy-900">Summary</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-navy-800">
                {invoicesData.total}
              </p>
            </div>
            <div className="rounded-lg bg-success-50 p-4">
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-success-700">
                {invoicesData.invoices.filter((i) => i.status === "paid").length}
              </p>
            </div>
            <div className="rounded-lg bg-gold-50 p-4">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gold-700">
                {
                  invoicesData.invoices.filter((i) => i.status === "pending")
                    .length
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
