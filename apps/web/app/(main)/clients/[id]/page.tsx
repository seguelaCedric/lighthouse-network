"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  User,
  Ship,
  Phone,
  Mail,
  Briefcase,
  TrendingUp,
  Clock,
  MapPin,
  Flag,
  Calendar,
  Edit2,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Plus,
  Globe,
  Send,
  KeyRound,
  Users,
  Anchor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClient, useUpdateClient } from "@/hooks/useClients";
import { cn } from "@/lib/utils";
import type { ClientType, ClientStatus, UpdateClientInput } from "@/lib/validations/client";
import { toast } from "sonner";

// Client type icons
const typeIcons: Record<ClientType, React.ReactNode> = {
  yacht: <Anchor className="size-5" />,
  management_co: <Building2 className="size-5" />,
  private_owner: <User className="size-5" />,
  charter_co: <Ship className="size-5" />,
};

const typeLabels: Record<ClientType, string> = {
  yacht: "Yacht",
  management_co: "Management Company",
  private_owner: "Private Owner",
  charter_co: "Charter Company",
};

const statusConfig: Record<ClientStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  active: { label: "Active", color: "text-success-700", bgColor: "bg-success-100", icon: <CheckCircle2 className="size-4" /> },
  inactive: { label: "Inactive", color: "text-gray-600", bgColor: "bg-gray-100", icon: <XCircle className="size-4" /> },
  prospect: { label: "Prospect", color: "text-amber-700", bgColor: "bg-amber-100", icon: <AlertCircle className="size-4" /> },
};

const jobStatusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: "Draft", color: "text-gray-700", bgColor: "bg-gray-100" },
  open: { label: "Open", color: "text-blue-700", bgColor: "bg-blue-100" },
  shortlisting: { label: "Shortlisting", color: "text-purple-700", bgColor: "bg-purple-100" },
  interviewing: { label: "Interviewing", color: "text-amber-700", bgColor: "bg-amber-100" },
  offer: { label: "Offer", color: "text-orange-700", bgColor: "bg-orange-100" },
  filled: { label: "Filled", color: "text-success-700", bgColor: "bg-success-100" },
  cancelled: { label: "Cancelled", color: "text-error-700", bgColor: "bg-error-100" },
  on_hold: { label: "On Hold", color: "text-gray-600", bgColor: "bg-gray-100" },
};

// Helper functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffDays < 1) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? "s" : ""} ago`;
}

// Portal Access Section Component
function PortalAccessSection({
  client,
  onUpdate
}: {
  client: any;
  onUpdate: () => void;
}) {
  const [isEnabling, setIsEnabling] = React.useState(false);
  const [isSendingInvite, setIsSendingInvite] = React.useState(false);
  const updateClient = useUpdateClient();

  const enablePortal = async () => {
    const email = client.primary_contact_email;

    if (!email) {
      toast.error("Client needs an email address to enable portal access");
      return;
    }

    setIsEnabling(true);

    try {
      await updateClient.mutateAsync({
        id: client.id,
        data: {
          portal_enabled: true,
          portal_email: email,
        },
      });

      toast.success("Portal access enabled");
      onUpdate();
    } catch {
      toast.error("Failed to enable portal access");
    } finally {
      setIsEnabling(false);
    }
  };

  const disablePortal = async () => {
    if (!confirm("Are you sure you want to disable portal access? The client will no longer be able to log in.")) {
      return;
    }

    try {
      await updateClient.mutateAsync({
        id: client.id,
        data: {
          portal_enabled: false,
        },
      });

      toast.success("Portal access disabled");
      onUpdate();
    } catch {
      toast.error("Failed to disable portal access");
    }
  };

  const sendInvite = async () => {
    setIsSendingInvite(true);

    try {
      const response = await fetch(`/api/clients/${client.id}/invite`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to send invite");
      }

      toast.success("Invitation email sent!");
    } catch {
      toast.error("Failed to send invitation email");
    } finally {
      setIsSendingInvite(false);
    }
  };

  if (client.portal_enabled) {
    return (
      <div className="rounded-xl border border-success-200 bg-success-50 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-success-100">
              <Globe className="size-5 text-success-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-success-800">Portal Active</h3>
                <span className="flex size-2 rounded-full bg-success-500" />
              </div>
              <p className="mt-1 text-sm text-success-700">
                {client.portal_email}
              </p>
              {client.portal_last_login && (
                <p className="mt-1 text-xs text-success-600">
                  Last login: {formatTimeAgo(client.portal_last_login)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={sendInvite}
              disabled={isSendingInvite}
              leftIcon={isSendingInvite ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            >
              {isSendingInvite ? "Sending..." : "Resend Invite"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={disablePortal}
              className="text-gray-500 hover:text-error-600"
            >
              Disable
            </Button>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/60 px-3 py-2 text-sm text-success-700">
          <KeyRound className="size-4" />
          <span>Client can access their portal at</span>
          <a
            href={`${window.location.origin}/client/auth/login`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2 hover:text-success-800"
          >
            {window.location.origin}/client
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-gray-200">
            <Globe className="size-5 text-gray-500" />
          </div>
          <div>
            <h3 className="font-semibold text-navy-900">Client Portal</h3>
            <p className="mt-1 text-sm text-gray-600">
              Allow this client to submit briefs, view shortlists, and schedule interviews
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={enablePortal}
          disabled={isEnabling || !client.primary_contact_email}
          leftIcon={isEnabling ? <Loader2 className="size-4 animate-spin" /> : <Globe className="size-4" />}
        >
          {isEnabling ? "Enabling..." : "Enable Portal"}
        </Button>
      </div>
      {!client.primary_contact_email && (
        <p className="mt-3 flex items-center gap-2 text-sm text-amber-600">
          <AlertCircle className="size-4" />
          Add a contact email first to enable portal access
        </p>
      )}
    </div>
  );
}

// Tab components
type TabId = "overview" | "jobs" | "placements" | "notes";

function OverviewTab({ client, onUpdate }: { client: any; onUpdate: () => void }) {
  const status = statusConfig[client.status as ClientStatus];
  const isYacht = client.type === "yacht";

  return (
    <div className="space-y-6">
      {/* Portal Access Section */}
      <PortalAccessSection client={client} onUpdate={onUpdate} />

      {/* Status & Basic Info */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold text-navy-900">Client Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Type</label>
            <p className="mt-1 flex items-center gap-2 text-navy-900">
              {typeIcons[client.type as ClientType]}
              {typeLabels[client.type as ClientType]}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Status</label>
            <p className="mt-1">
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium", status.bgColor, status.color)}>
                {status.icon}
                {status.label}
              </span>
            </p>
          </div>
          {client.source && (
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Source</label>
              <p className="mt-1 capitalize text-navy-900">{client.source.replace("_", " ")}</p>
            </div>
          )}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Client Since</label>
            <p className="mt-1 text-navy-900">{formatDate(client.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Vessel Info (for yachts) */}
      {isYacht && (client.vessel_type || client.vessel_size || client.vessel_flag || client.vessel_build_year) && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 font-semibold text-navy-900">Vessel Information</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {client.vessel_type && (
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Type</label>
                <p className="mt-1 flex items-center gap-2 capitalize text-navy-900">
                  <Ship className="size-4 text-gray-400" />
                  {client.vessel_type} Yacht
                </p>
              </div>
            )}
            {client.vessel_size && (
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Size</label>
                <p className="mt-1 text-navy-900">{client.vessel_size}m</p>
              </div>
            )}
            {client.vessel_flag && (
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Flag</label>
                <p className="mt-1 flex items-center gap-2 text-navy-900">
                  <Flag className="size-4 text-gray-400" />
                  {client.vessel_flag}
                </p>
              </div>
            )}
            {client.vessel_build_year && (
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Build Year</label>
                <p className="mt-1 flex items-center gap-2 text-navy-900">
                  <Calendar className="size-4 text-gray-400" />
                  {client.vessel_build_year}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact Info */}
      {(client.primary_contact_name || client.primary_contact_email || client.primary_contact_phone) && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 font-semibold text-navy-900">Primary Contact</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {client.primary_contact_name && (
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Name</label>
                <p className="mt-1 flex items-center gap-2 text-navy-900">
                  <User className="size-4 text-gray-400" />
                  {client.primary_contact_name}
                  {client.primary_contact_role && (
                    <span className="text-gray-500">({client.primary_contact_role})</span>
                  )}
                </p>
              </div>
            )}
            {client.primary_contact_email && (
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Email</label>
                <a
                  href={`mailto:${client.primary_contact_email}`}
                  className="mt-1 flex items-center gap-2 text-navy-600 hover:text-navy-800"
                >
                  <Mail className="size-4" />
                  {client.primary_contact_email}
                </a>
              </div>
            )}
            {client.primary_contact_phone && (
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Phone</label>
                <a
                  href={`tel:${client.primary_contact_phone}`}
                  className="mt-1 flex items-center gap-2 text-navy-600 hover:text-navy-800"
                >
                  <Phone className="size-4" />
                  {client.primary_contact_phone}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Performance Stats */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold text-navy-900">Performance</h3>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="text-center">
            <p className="text-3xl font-bold text-navy-900">{client.total_jobs}</p>
            <p className="mt-1 text-sm text-gray-500">Total Jobs</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-navy-900">{client.total_placements}</p>
            <p className="mt-1 text-sm text-gray-500">Placements</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gold-600">{formatCurrency(client.total_revenue)}</p>
            <p className="mt-1 text-sm text-gray-500">Revenue</p>
          </div>
        </div>
        {client.last_placement_at && (
          <p className="mt-4 text-center text-sm text-gray-500">
            Last placement: {formatTimeAgo(client.last_placement_at)}
          </p>
        )}
      </div>
    </div>
  );
}

function JobsTab({ jobs }: { jobs: any[] }) {
  const router = useRouter();

  if (!jobs || jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center">
        <Briefcase className="size-12 text-gray-300" />
        <h3 className="mt-4 font-semibold text-navy-900">No jobs yet</h3>
        <p className="mt-1 text-sm text-gray-500">Create a job for this client to get started.</p>
        <Button variant="primary" className="mt-4" leftIcon={<Plus className="size-4" />}>
          Create Job
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job: any) => {
        const status = jobStatusConfig[job.status] || jobStatusConfig.draft;
        return (
          <div
            key={job.id}
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-navy-900">{job.title}</h4>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", status.bgColor, status.color)}>
                  {status.label}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                <span>{formatDate(job.created_at)}</span>
                <span>{job.submissions_count || 0} submissions</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/jobs/${job.id}`)}
              rightIcon={<ExternalLink className="size-4" />}
            >
              View
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function PlacementsTab({ placements }: { placements: any[] }) {
  if (!placements || placements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center">
        <Users className="size-12 text-gray-300" />
        <h3 className="mt-4 font-semibold text-navy-900">No placements yet</h3>
        <p className="mt-1 text-sm text-gray-500">Successful placements will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {placements.map((placement: any) => (
        <div
          key={placement.id}
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-navy-900">
                {placement.candidate?.first_name} {placement.candidate?.last_name}
              </h4>
              <span className="rounded-full bg-success-100 px-2 py-0.5 text-xs font-medium text-success-700">
                Placed
              </span>
            </div>
            <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
              <span>{placement.job?.title || "Unknown role"}</span>
              <span>{formatDate(placement.start_date)}</span>
              {placement.total_fee && (
                <span className="font-medium text-gold-600">{formatCurrency(placement.total_fee)} fee</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function NotesTab({ notes }: { notes: string | null }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="mb-4 font-semibold text-navy-900">Internal Notes</h3>
      {notes ? (
        <p className="whitespace-pre-wrap text-gray-700">{notes}</p>
      ) : (
        <p className="text-gray-500 italic">No notes added yet.</p>
      )}
    </div>
  );
}

// Main Component
function ClientDetailContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const clientId = params.id as string;
  const isEditMode = searchParams.get("edit") === "true";

  const [activeTab, setActiveTab] = React.useState<TabId>("overview");

  const { data: client, isLoading, error, refetch } = useClient(clientId);

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "jobs", label: `Jobs (${client?.jobs?.length || 0})` },
    { id: "placements", label: `Placements (${client?.placements?.length || 0})` },
    { id: "notes", label: "Notes" },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <Loader2 className="size-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50">
        <Building2 className="size-12 text-gray-300" />
        <h2 className="mt-4 text-lg font-semibold text-navy-900">Client not found</h2>
        <p className="mt-1 text-gray-500">The client you're looking for doesn't exist or you don't have access.</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push("/clients")}>
          Back to Clients
        </Button>
      </div>
    );
  }

  const status = statusConfig[client.status as ClientStatus];

  return (
    <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl p-6">
            {/* Back Button */}
            <button
              onClick={() => router.push("/clients")}
              className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-navy-900"
            >
              <ArrowLeft className="size-4" />
              Back to Clients
            </button>

            {/* Header */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-navy-100 text-navy-600">
                    {typeIcons[client.type as ClientType]}
                  </div>
                  <div>
                    <h1 className="font-serif text-3xl font-semibold text-navy-900">{client.name}</h1>
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                      <span>{typeLabels[client.type as ClientType]}</span>
                      {client.vessel_size && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span>{client.vessel_size}m</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium", status.bgColor, status.color)}>
                  {status.icon}
                  {status.label}
                </span>
                <Button variant="secondary" leftIcon={<Edit2 className="size-4" />}>
                  Edit
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="-mb-px flex gap-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "border-b-2 pb-3 text-sm font-medium transition-colors",
                      activeTab === tab.id
                        ? "border-gold-500 text-navy-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && <OverviewTab client={client} onUpdate={refetch} />}
            {activeTab === "jobs" && <JobsTab jobs={client.jobs || []} />}
            {activeTab === "placements" && <PlacementsTab placements={client.placements || []} />}
            {activeTab === "notes" && <NotesTab notes={client.notes} />}
          </div>
        </main>
  );
}

function ClientDetailSkeleton() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
    </div>
  );
}

export default function ClientDetailPage() {
  return (
    <Suspense fallback={<ClientDetailSkeleton />}>
      <ClientDetailContent />
    </Suspense>
  );
}
