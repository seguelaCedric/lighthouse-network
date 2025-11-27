"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Anchor,
  Ship,
  LayoutDashboard,
  FileText,
  Users,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  MessageSquare,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { clientSignOut, type ClientSession } from "@/lib/auth/client-actions";
import { cn } from "@/lib/utils";

interface ClientPortalLayoutProps {
  children: React.ReactNode;
  session: ClientSession;
}

const navItems = [
  {
    label: "Dashboard",
    href: "/client/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Submit Brief",
    href: "/client/briefs/new",
    icon: FileText,
  },
  {
    label: "My Searches",
    href: "/client/searches",
    icon: Users,
  },
  {
    label: "Interviews",
    href: "/client/interviews",
    icon: Calendar,
  },
  {
    label: "Placements",
    href: "/client/placements",
    icon: Trophy,
  },
];

export function ClientPortalLayout({ children, session }: ClientPortalLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async () => {
    await clientSignOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo & Mobile Menu */}
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
              >
                {mobileMenuOpen ? (
                  <X className="size-6" />
                ) : (
                  <Menu className="size-6" />
                )}
              </button>

              {/* Logo */}
              <Link href="/client/dashboard" className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-gold-400 to-gold-600">
                  <Anchor className="size-5 text-white" />
                </div>
                <span className="hidden font-serif text-xl font-semibold text-navy-900 sm:block">
                  Lighthouse
                </span>
              </Link>

              {/* Client Name Badge */}
              <div className="hidden items-center gap-2 rounded-full bg-navy-100 px-3 py-1 lg:flex">
                <Ship className="size-4 text-navy-600" />
                <span className="text-sm font-medium text-navy-700">
                  {session.clientName}
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex lg:items-center lg:gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-gold-100 text-gold-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-navy-900"
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                <Bell className="size-5" />
                <span className="absolute right-1 top-1 flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-gold-500" />
                </span>
              </button>

              {/* Messages */}
              <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                <MessageSquare className="size-5" />
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100"
                >
                  <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-navy-600 to-navy-800 text-sm font-semibold text-white">
                    {session.primaryContactName
                      ? getInitials(session.primaryContactName)
                      : getInitials(session.clientName)}
                  </div>
                  <ChevronDown className="size-4 text-gray-500" />
                </button>

                {/* Dropdown Menu */}
                {profileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setProfileMenuOpen(false)}
                    />
                    <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
                      <div className="border-b border-gray-100 px-4 py-3">
                        <p className="font-medium text-navy-900">
                          {session.primaryContactName || "Client User"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {session.primaryContactEmail || session.clientName}
                        </p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/client/settings"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Settings className="size-4" />
                          Settings
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <LogOut className="size-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/20"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-[85vw] max-w-72 bg-white shadow-xl">
            <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-4">
              <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-gold-400 to-gold-600">
                <Anchor className="size-5 text-white" />
              </div>
              <span className="font-serif text-xl font-semibold text-navy-900">
                Lighthouse
              </span>
            </div>

            {/* Client Info */}
            <div className="border-b border-gray-100 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-navy-600 to-navy-800 text-sm font-semibold text-white">
                  {session.primaryContactName
                    ? getInitials(session.primaryContactName)
                    : getInitials(session.clientName)}
                </div>
                <div>
                  <p className="font-medium text-navy-900">
                    {session.primaryContactName || "Client User"}
                  </p>
                  <p className="text-sm text-gray-500">{session.clientName}</p>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="p-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-gold-100 text-gold-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-navy-900"
                    )}
                  >
                    <Icon className="size-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Sign Out */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 p-4 pb-safe">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="size-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
