"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Users,
  Building2,
  Settings,
  HelpCircle,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Shield,
  Globe,
  BookOpen,
  Mail,
  BarChart3,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth/actions";

interface AppShellProps {
  children: React.ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

const mainNavItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-5" />, href: "/dashboard" },
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="size-5" />, href: "/dashboard/analytics" },
  { id: "briefs", label: "Briefs", icon: <FileText className="size-5" />, href: "/briefs" },
  { id: "jobs", label: "Jobs", icon: <Briefcase className="size-5" />, href: "/jobs" },
  { id: "candidates", label: "Candidates", icon: <Users className="size-5" />, href: "/candidates" },
  { id: "clients", label: "Clients", icon: <Building2 className="size-5" />, href: "/clients" },
  { id: "seo-blog", label: "SEO & Blog", icon: <BookOpen className="size-5" />, href: "/dashboard/seo-pages/blog" },
  { id: "seo-pages", label: "Landing Pages", icon: <Globe className="size-5" />, href: "/dashboard/seo-pages/landing-pages" },
  { id: "inquiries", label: "Inquiries", icon: <Mail className="size-5" />, href: "/dashboard/seo-pages/inquiries" },
];

const bottomNavItems: NavItem[] = [
  { id: "admin", label: "Admin", icon: <Shield className="size-5" />, href: "/admin/users" },
  { id: "settings", label: "Settings", icon: <Settings className="size-5" />, href: "/settings" },
  { id: "help", label: "Help & Support", icon: <HelpCircle className="size-5" />, href: "/help" },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  // Mock user - in production this would come from auth context
  const user = {
    name: "Recruiter",
    email: "user@lighthouse.crew",
    initials: "LH",
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    if (href === "/dashboard/analytics") {
      return pathname.startsWith("/dashboard/analytics");
    }
    if (href.startsWith("/admin")) {
      return pathname.startsWith("/admin");
    }
    // Special handling for SEO pages to highlight the correct section
    if (href === "/dashboard/seo-pages/landing-pages") {
      return pathname.startsWith("/dashboard/seo-pages/landing-pages");
    }
    if (href === "/dashboard/seo-pages/inquiries") {
      return pathname.startsWith("/dashboard/seo-pages/inquiries");
    }
    if (href.startsWith("/dashboard/seo-pages")) {
      return pathname.startsWith("/dashboard/seo-pages");
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-navy-900 transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-[260px]"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-navy-700 px-4">
          {sidebarCollapsed ? (
            <Logo size="xs" className="mx-auto" variant="light" />
          ) : (
            <Logo size="sm" variant="light" />
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              "rounded-md p-1 text-navy-400 hover:bg-navy-800 hover:text-white transition-colors",
              sidebarCollapsed && "mx-auto"
            )}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {mainNavItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-navy-800 text-white"
                  : "text-navy-300 hover:bg-navy-800 hover:text-white",
                sidebarCollapsed && "justify-center px-2"
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {item.icon}
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-navy-700 p-3">
          {bottomNavItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-navy-800 text-white"
                  : "text-navy-300 hover:bg-navy-800 hover:text-white",
                sidebarCollapsed && "justify-center px-2"
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {item.icon}
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </div>

        {/* User Section */}
        <div className="border-t border-navy-700 p-3">
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5",
              sidebarCollapsed && "justify-center px-2"
            )}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-500 text-xs font-semibold text-navy-900">
              {user.initials}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{user.name}</p>
                <p className="truncate text-xs text-navy-400">{user.email}</p>
              </div>
            )}
          </div>
          {/* Logout Button */}
          <button
            onClick={() => signOut()}
            className={cn(
              "mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-300 transition-colors hover:bg-navy-800 hover:text-white",
              sidebarCollapsed && "justify-center px-2"
            )}
            title={sidebarCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="size-5" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-[260px]"
        )}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search..."
              className="h-9 w-full rounded-lg border border-gray-300 bg-gray-50 pl-9 pr-4 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
              <Bell className="size-5" />
              <span className="absolute right-1 top-1 size-2 rounded-full bg-error-500" />
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <button className="flex items-center gap-2 rounded-lg p-2 text-gray-700 hover:bg-gray-100">
              <div className="flex size-8 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy-700">
                {user.initials}
              </div>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
