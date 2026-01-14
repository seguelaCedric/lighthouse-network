"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Users,
  BarChart3,
  Settings,
  ArrowLeft,
  Shield,
  MessageSquare,
} from "lucide-react";

const navItems = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/enquiries", label: "Enquiries", icon: MessageSquare },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-navy-900">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg p-2 text-gray-400 hover:bg-navy-800 hover:text-white"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-burgundy-600">
                <Shield className="size-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Admin Dashboard</h1>
                <p className="text-sm text-gray-400">Platform administration</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar Navigation */}
          <nav className="w-full shrink-0 lg:w-64">
            <div className="rounded-xl border border-gray-200 bg-white p-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname?.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-burgundy-50 text-burgundy-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-navy-900"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-5",
                        isActive ? "text-burgundy-600" : "text-gray-400"
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Main Content */}
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
