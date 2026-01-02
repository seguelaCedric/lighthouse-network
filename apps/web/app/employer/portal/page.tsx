import Link from "next/link";
import {
  FileText,
  Users,
  Clock,
  ArrowRight,
  Shield,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Plus,
} from "lucide-react";
import { getEmployerSession, getEmployerAccount } from "@/lib/auth/employer-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Stat card component
function StatCard({
  icon: Icon,
  label,
  value,
  href,
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  href?: string;
  disabled?: boolean;
}) {
  const content = (
    <div className={cn(
      "rounded-xl border bg-white p-6 transition-shadow",
      disabled ? "border-gray-200" : "border-gray-200 hover:shadow-md",
      href && !disabled && "cursor-pointer"
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-navy-900">{value}</p>
        </div>
        <div className={cn(
          "flex size-12 items-center justify-center rounded-lg",
          disabled ? "bg-gray-100" : "bg-gold-100"
        )}>
          <Icon className={cn("size-6", disabled ? "text-gray-400" : "text-gold-600")} />
        </div>
      </div>
      {disabled && (
        <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
          <Shield className="size-3" />
          Requires verified account
        </div>
      )}
    </div>
  );

  if (href && !disabled) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

export default async function EmployerDashboardPage() {
  const session = await getEmployerSession();
  if (!session) return null;

  const account = await getEmployerAccount(session.employer_id);
  const isVerified = session.tier !== "basic";

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-semibold text-navy-900">
          Welcome back, {session.contact_name.split(" ")[0]}!
        </h1>
        <p className="mt-1 text-gray-500">
          Here's what's happening with your hiring.
        </p>
      </div>

      {/* Account Status Banner */}
      {session.tier === "basic" && (
        <div className="mb-6 rounded-xl border border-gold-200 bg-gradient-to-r from-gold-50 to-amber-50 p-4">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold-100">
              <Shield className="size-5 text-gold-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-navy-900">
                Unlock Full Access
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Complete a quick verification call to view candidate shortlists,
                full profiles, and schedule interviews.
              </p>
              <Button variant="primary" size="sm" className="mt-3">
                Schedule Verification Call
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {session.vetting_status === "scheduled" && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <Calendar className="size-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-navy-900">
                Verification Call Scheduled
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Your verification call is scheduled. We'll unlock full access after the call.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Active Briefs"
          value={0}
          href="/employer/portal/briefs"
        />
        <StatCard
          icon={Users}
          label="Shortlisted Candidates"
          value={0}
          href="/employer/portal/shortlists"
          disabled={!isVerified}
        />
        <StatCard
          icon={Clock}
          label="Pending Reviews"
          value={0}
          disabled={!isVerified}
        />
        <StatCard
          icon={Calendar}
          label="Interviews Scheduled"
          value={0}
          disabled={!isVerified}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="mb-4 font-serif text-lg font-medium text-navy-900">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/employer/portal/briefs/new"
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex size-12 items-center justify-center rounded-lg bg-gold-100">
              <Plus className="size-6 text-gold-600" />
            </div>
            <div>
              <h3 className="font-medium text-navy-900">Submit New Brief</h3>
              <p className="text-sm text-gray-500">Tell us what you're looking for</p>
            </div>
          </Link>

          {isVerified && (
            <Link
              href="/employer/portal/shortlists"
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex size-12 items-center justify-center rounded-lg bg-navy-100">
                <Users className="size-6 text-navy-600" />
              </div>
              <div>
                <h3 className="font-medium text-navy-900">View Candidates</h3>
                <p className="text-sm text-gray-500">Review your shortlisted candidates</p>
              </div>
            </Link>
          )}

          <Link
            href="/employer/portal/settings"
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex size-12 items-center justify-center rounded-lg bg-gray-100">
              <AlertCircle className="size-6 text-gray-600" />
            </div>
            <div>
              <h3 className="font-medium text-navy-900">Complete Profile</h3>
              <p className="text-sm text-gray-500">Add more details about your needs</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Account Overview */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-serif text-lg font-medium text-navy-900">
          Account Overview
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Contact</h3>
            <p className="mt-1 text-navy-900">{session.contact_name}</p>
            <p className="text-gray-600">{session.email}</p>
          </div>

          {session.company_name && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Company/Vessel</h3>
              <p className="mt-1 text-navy-900">{session.company_name}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-500">Account Status</h3>
            <div className="mt-1 flex items-center gap-2">
              {isVerified ? (
                <>
                  <CheckCircle2 className="size-5 text-success-500" />
                  <span className="text-success-700">Verified</span>
                </>
              ) : (
                <>
                  <Clock className="size-5 text-amber-500" />
                  <span className="text-amber-700">Pending Verification</span>
                </>
              )}
            </div>
          </div>

          {account?.hiring_for && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Hiring For</h3>
              <p className="mt-1 capitalize text-navy-900">
                {account.hiring_for === "both"
                  ? "Yacht Crew & Private Staff"
                  : account.hiring_for === "yacht"
                    ? "Yacht Crew"
                    : "Private Staff"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
