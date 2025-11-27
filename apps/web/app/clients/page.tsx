"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Plus,
  Building2,
  Anchor,
  User,
  Ship,
  Phone,
  Mail,
  Briefcase,
  TrendingUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Loader2,
  Filter,
  X,
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar, NavItem } from "@/components/ui/sidebar";
import { TopBar } from "@/components/ui/top-bar";
import { AddClientModal } from "@/components/clients/AddClientModal";
import { useClients } from "@/hooks/useClients";
import { cn } from "@/lib/utils";
import type { Client, ClientType, ClientStatus } from "@/lib/validations/client";

// Client type icons
const typeIcons: Record<ClientType, React.ReactNode> = {
  yacht: <Anchor className="size-4" />,
  management_co: <Building2 className="size-4" />,
  private_owner: <User className="size-4" />,
  charter_co: <Ship className="size-4" />,
};

const typeLabels: Record<ClientType, string> = {
  yacht: "Yacht",
  management_co: "Management Co.",
  private_owner: "Private Owner",
  charter_co: "Charter Co.",
};

const statusConfig: Record<ClientStatus, { label: string; color: string; bgColor: string }> = {
  active: { label: "Active", color: "text-success-700", bgColor: "bg-success-100" },
  inactive: { label: "Inactive", color: "text-gray-600", bgColor: "bg-gray-100" },
  prospect: { label: "Prospect", color: "text-amber-700", bgColor: "bg-amber-100" },
};

// Helper functions
function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `€${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `€${(amount / 1000).toFixed(0)}k`;
  }
  return `€${amount.toFixed(0)}`;
}

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffDays < 1) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
  return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
}

// Client Card Component
function ClientCard({ client, onView, onEdit }: { client: Client; onView: () => void; onEdit: () => void }) {
  const status = statusConfig[client.status];
  const isYacht = client.type === "yacht";

  return (
    <div
      className="group rounded-xl border bg-white p-5 transition-all hover:shadow-md"
      style={{ borderColor: "rgba(212, 209, 202, 0.6)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg font-semibold text-navy-900 truncate">
              {client.name}
            </h3>
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", status.bgColor, status.color)}>
              {status.label}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
            {typeIcons[client.type]}
            <span>{typeLabels[client.type]}</span>
            {isYacht && client.vessel_size && (
              <>
                <span className="text-gray-300">•</span>
                <span>{client.vessel_size}m {client.vessel_type ? `${client.vessel_type.charAt(0).toUpperCase() + client.vessel_type.slice(1)} Yacht` : ""}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Contact Info */}
      {client.primary_contact_name && (
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-gray-700">
            <User className="size-3.5 text-gray-400" />
            {client.primary_contact_name}
            {client.primary_contact_role && (
              <span className="text-gray-400">({client.primary_contact_role})</span>
            )}
          </span>
          {client.primary_contact_phone && (
            <a
              href={`tel:${client.primary_contact_phone}`}
              className="flex items-center gap-1.5 text-navy-600 hover:text-navy-800"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="size-3.5" />
              {client.primary_contact_phone}
            </a>
          )}
          {client.primary_contact_email && (
            <a
              href={`mailto:${client.primary_contact_email}`}
              className="flex items-center gap-1.5 text-navy-600 hover:text-navy-800"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="size-3.5" />
              {client.primary_contact_email}
            </a>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4">
        <span className="flex items-center gap-1.5 text-sm text-gray-600">
          <Briefcase className="size-4 text-gray-400" />
          <span className="font-medium text-navy-900">{client.total_jobs}</span> Jobs
        </span>
        <span className="flex items-center gap-1.5 text-sm text-gray-600">
          <Users className="size-4 text-gray-400" />
          <span className="font-medium text-navy-900">{client.total_placements}</span> Placements
        </span>
        <span className="flex items-center gap-1.5 text-sm">
          <TrendingUp className="size-4 text-gold-500" />
          <span className="font-semibold text-gold-600">{formatCurrency(client.total_revenue)}</span>
          <span className="text-gray-500">Revenue</span>
        </span>
        {client.last_placement_at && (
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <Clock className="size-4" />
            Last placement: {formatTimeAgo(client.last_placement_at)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="secondary" size="sm" onClick={onView} leftIcon={<Eye className="size-4" />}>
          View
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit} leftIcon={<Edit2 className="size-4" />}>
          Edit
        </Button>
      </div>
    </div>
  );
}

// Filter options
const typeOptions: { value: ClientType | ""; label: string }[] = [
  { value: "", label: "All Types" },
  { value: "yacht", label: "Yacht" },
  { value: "management_co", label: "Management Co." },
  { value: "private_owner", label: "Private Owner" },
  { value: "charter_co", label: "Charter Co." },
];

const statusOptions: { value: ClientStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "prospect", label: "Prospect" },
  { value: "inactive", label: "Inactive" },
];

// Main Component
export default function ClientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL params
  const urlSearch = searchParams.get("q") || "";
  const urlType = (searchParams.get("type") as ClientType) || "";
  const urlStatus = (searchParams.get("status") as ClientStatus) || "";
  const urlPage = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;

  // State
  const [searchQuery, setSearchQuery] = React.useState(urlSearch);
  const [typeFilter, setTypeFilter] = React.useState<ClientType | "">(urlType);
  const [statusFilter, setStatusFilter] = React.useState<ClientStatus | "">(urlStatus);
  const [currentPage, setCurrentPage] = React.useState(urlPage);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [topBarSearch, setTopBarSearch] = React.useState("");

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = React.useState(searchQuery);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch clients
  const { data: clientsData, isLoading, isFetching } = useClients({
    search: debouncedSearch || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    page: currentPage,
    limit: 20,
    sortBy: "created_at",
    sortOrder: "desc",
  });

  const clients = clientsData?.data ?? [];
  const totalClients = clientsData?.total ?? 0;
  const totalPages = clientsData?.total_pages ?? 1;

  // Update URL when filters change
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (currentPage > 1) params.set("page", String(currentPage));

    const newUrl = params.toString() ? `?${params.toString()}` : "/clients";
    router.replace(newUrl, { scroll: false });
  }, [debouncedSearch, typeFilter, statusFilter, currentPage, router]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, typeFilter, statusFilter]);

  // Navigation
  const navItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-5" />, href: "/dashboard" },
    { id: "briefs", label: "Briefs", icon: <FileText className="size-5" />, href: "/briefs" },
    { id: "jobs", label: "Jobs", icon: <Briefcase className="size-5" />, href: "/jobs" },
    { id: "candidates", label: "Candidates", icon: <Users className="size-5" />, href: "/candidates" },
    { id: "clients", label: "Clients", icon: <Building2 className="size-5" />, href: "/clients", active: true },
  ];

  const bottomNavItems: NavItem[] = [
    { id: "settings", label: "Settings", icon: <Settings className="size-5" />, href: "/settings" },
    { id: "help", label: "Help & Support", icon: <HelpCircle className="size-5" />, href: "/help" },
  ];

  const handleViewClient = (clientId: string) => {
    router.push(`/clients/${clientId}`);
  };

  const handleEditClient = (clientId: string) => {
    router.push(`/clients/${clientId}?edit=true`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("");
    setStatusFilter("");
  };

  const hasActiveFilters = searchQuery || typeFilter || statusFilter;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        logo={
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gold-500">
              <Anchor className="size-5 text-navy-900" />
            </div>
            <span className="font-semibold text-white">Lighthouse</span>
          </div>
        }
        logoCollapsed={
          <div className="flex size-8 items-center justify-center rounded-lg bg-gold-500">
            <Anchor className="size-5 text-navy-900" />
          </div>
        }
        navItems={navItems}
        bottomNavItems={bottomNavItems}
        user={{ name: "Recruiter", email: "recruiter@lighthouse.crew" }}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        onLogout={() => console.log("Logout")}
        variant="dark"
      />

      {/* Main Content */}
      <div
        className={cn(
          "flex flex-1 flex-col overflow-hidden transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-[260px]"
        )}
      >
        {/* Top Bar */}
        <TopBar
          user={{ name: "Recruiter" }}
          notificationCount={0}
          searchValue={topBarSearch}
          searchPlaceholder="Search..."
          onSearchChange={setTopBarSearch}
          onNotificationsClick={() => {}}
          onProfileClick={() => {}}
          onSettingsClick={() => router.push("/settings")}
          onLogout={() => {}}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="font-serif text-4xl font-semibold text-navy-800">Clients</h1>
                <p className="mt-1 text-gray-600">
                  Manage your yacht clients and relationships
                </p>
              </div>
              <Button
                variant="primary"
                leftIcon={<Plus className="size-4" />}
                onClick={() => setAddModalOpen(true)}
              >
                Add Client
              </Button>
            </div>

            {/* Search and Filters */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search clients..."
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as ClientType | "")}
                  className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ClientStatus | "")}
                  className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  >
                    <X className="size-4" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              <span className="font-semibold text-navy-900">{totalClients}</span>
              client{totalClients !== 1 ? "s" : ""}
              {isFetching && !isLoading && (
                <Loader2 className="size-4 animate-spin text-gray-400" />
              )}
            </div>

            {/* Client List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="size-8 animate-spin text-gray-400" />
              </div>
            ) : clients.length > 0 ? (
              <div className="space-y-4">
                {clients.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onView={() => handleViewClient(client.id)}
                    onEdit={() => handleEditClient(client.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-20 text-center">
                <Building2 className="size-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-semibold text-navy-900">No clients found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {hasActiveFilters
                    ? "Try adjusting your filters to find more clients."
                    : "Get started by adding your first client."}
                </p>
                {hasActiveFilters ? (
                  <Button variant="secondary" className="mt-4" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    className="mt-4"
                    leftIcon={<Plus className="size-4" />}
                    onClick={() => setAddModalOpen(true)}
                  >
                    Add Client
                  </Button>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    leftIcon={<ChevronLeft className="size-4" />}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    rightIcon={<ChevronRight className="size-4" />}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Client Modal */}
      <AddClientModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
      />
    </div>
  );
}
