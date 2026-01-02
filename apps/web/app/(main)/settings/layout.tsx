"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  User,
  Settings,
  Bell,
  Plug,
  CreditCard,
  Users,
  ArrowLeft,
  Anchor,
} from "lucide-react";

const navItems = [
  { href: "/settings/profile", label: "Profile", icon: User },
  { href: "/settings/account", label: "Account", icon: Settings },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/integrations", label: "Integrations", icon: Plug },
  { href: "/settings/billing", label: "Billing", icon: CreditCard },
  { href: "/settings/team", label: "Team", icon: Users },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-navy-900">
            <Anchor className="size-5 text-gold-400" />
          </div>
          <div>
            <h1 className="text-4xl font-serif font-semibold text-navy-800">Settings</h1>
            <p className="text-sm text-gray-500">Manage your account and preferences</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar Navigation */}
          <nav className="w-full shrink-0 lg:w-64">
            <div className="rounded-xl border border-gray-200 bg-white p-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-gold-50 text-gold-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-navy-900"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-5",
                        isActive ? "text-gold-600" : "text-gray-400"
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Main Content */}
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
