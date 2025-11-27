"use client";

import * as React from "react";
import {
  Briefcase,
  Users,
  FileText,
  LayoutDashboard,
  Building2,
  Settings,
  HelpCircle,
  Anchor,
} from "lucide-react";
import { Sidebar, NavItem } from "@/components/ui/sidebar";
import { TopBar } from "@/components/ui/top-bar";
import { cn } from "@/lib/utils";

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded bg-gray-200", className)} />
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-300/60 bg-white p-6 shadow-[0px_2px_4px_rgba(26,24,22,0.06)]">
      <div className="mb-4 flex items-center justify-between">
        <SkeletonPulse className="size-10 rounded-lg" />
        <SkeletonPulse className="h-6 w-16 rounded-full" />
      </div>
      <div>
        <SkeletonPulse className="h-9 w-20" />
        <SkeletonPulse className="mt-2 h-4 w-24" />
      </div>
    </div>
  );
}

function BriefInboxSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <SkeletonPulse className="h-8 w-32" />
          <SkeletonPulse className="h-8 w-20" />
        </div>
        <div className="mt-3 flex gap-2">
          <SkeletonPulse className="h-8 w-16 rounded-full" />
          <SkeletonPulse className="h-8 w-16 rounded-full" />
          <SkeletonPulse className="h-8 w-24 rounded-full" />
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4">
            <div className="flex items-center gap-2">
              <SkeletonPulse className="size-5" />
              <SkeletonPulse className="h-5 w-32" />
              <SkeletonPulse className="h-5 w-16 rounded-full" />
            </div>
            <div className="mt-2 flex items-center gap-3">
              <SkeletonPulse className="h-4 w-24" />
              <SkeletonPulse className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function JobsNeedingAttentionSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SkeletonPulse className="h-8 w-48" />
            <SkeletonPulse className="h-5 w-16 rounded-full" />
          </div>
          <SkeletonPulse className="h-8 w-20" />
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <SkeletonPulse className="h-5 w-40" />
                <SkeletonPulse className="mt-1 h-4 w-24" />
                <div className="mt-2 flex items-center gap-3">
                  <SkeletonPulse className="h-4 w-28" />
                  <SkeletonPulse className="h-4 w-24" />
                  <SkeletonPulse className="h-4 w-20" />
                </div>
              </div>
              <SkeletonPulse className="h-8 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickActionsSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <SkeletonPulse className="h-8 w-32 mb-4" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonPulse key={i} className="h-10 w-full rounded" />
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const navItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-5" />, active: true },
    { id: "briefs", label: "Briefs", icon: <FileText className="size-5" /> },
    { id: "jobs", label: "Jobs", icon: <Briefcase className="size-5" /> },
    { id: "candidates", label: "Candidates", icon: <Users className="size-5" /> },
    { id: "clients", label: "Clients", icon: <Building2 className="size-5" /> },
  ];

  const bottomNavItems: NavItem[] = [
    { id: "settings", label: "Settings", icon: <Settings className="size-5" /> },
    { id: "help", label: "Help & Support", icon: <HelpCircle className="size-5" /> },
  ];

  const user = {
    name: "Loading...",
    email: "",
    avatar: undefined,
  };

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
        user={user}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        onLogout={() => {}}
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
          user={user}
          notificationCount={0}
          searchValue=""
          searchPlaceholder="Search candidates, jobs, clients..."
          onSearchChange={() => {}}
          onNotificationsClick={() => {}}
          onProfileClick={() => {}}
          onSettingsClick={() => {}}
          onLogout={() => {}}
        />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <SkeletonPulse className="h-10 w-64" />
                <SkeletonPulse className="mt-2 h-5 w-96" />
              </div>
              <div className="flex flex-wrap gap-2">
                <SkeletonPulse className="h-10 w-28 rounded" />
                <SkeletonPulse className="h-10 w-36 rounded" />
                <SkeletonPulse className="h-10 w-32 rounded" />
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                <BriefInboxSkeleton />
                <JobsNeedingAttentionSkeleton />
              </div>

              {/* Right Column */}
              <div className="lg:col-span-1">
                <QuickActionsSkeleton />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
