import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Bell,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { getEmployerSession, signOutEmployer } from "@/lib/auth/employer-actions";
import { cn } from "@/lib/utils";

// Navigation items
const navItems = [
  {
    href: "/employer/portal",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/employer/portal/briefs",
    icon: FileText,
    label: "Hiring Briefs",
  },
  {
    href: "/employer/portal/shortlists",
    icon: Users,
    label: "Shortlists",
    requiresVerified: true,
  },
  {
    href: "/employer/portal/settings",
    icon: Settings,
    label: "Settings",
  },
];

// Tier badge component
function TierBadge({ tier }: { tier: string }) {
  const styles = {
    basic: "bg-gray-100 text-gray-700",
    verified: "bg-success-100 text-success-700",
    premium: "bg-gold-100 text-gold-700",
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
      styles[tier as keyof typeof styles] || styles.basic
    )}>
      {tier === "verified" || tier === "premium" ? (
        <Shield className="size-3" />
      ) : null}
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </span>
  );
}

export default async function EmployerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getEmployerSession();

  if (!session) {
    redirect("/employer/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <Link href="/">
            <Logo size="sm" />
          </Link>
        </div>

        {/* User Info */}
        <div className="border-b border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-navy-100 font-medium text-navy-600">
              {session.contact_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className="flex-1 truncate">
              <p className="truncate font-medium text-navy-900">
                {session.contact_name}
              </p>
              <TierBadge tier={session.tier} />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isDisabled = item.requiresVerified && session.tier === "basic";
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={isDisabled ? "#" : item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isDisabled
                    ? "cursor-not-allowed text-gray-400"
                    : "text-gray-600 hover:bg-gray-100 hover:text-navy-800"
                )}
                title={isDisabled ? "Requires verified account" : undefined}
              >
                <Icon className="size-5" />
                {item.label}
                {isDisabled && (
                  <Shield className="ml-auto size-4 text-gray-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="border-t border-gray-200 p-4">
          <form action={signOutEmployer}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-navy-800"
            >
              <LogOut className="size-5" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Header - Mobile */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
          <Link href="/">
            <Logo size="sm" />
          </Link>

          {/* Mobile menu button - would need client component for toggle */}
          <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
            <Menu className="size-5" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
