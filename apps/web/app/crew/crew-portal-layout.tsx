"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Anchor,
  User,
  Briefcase,
  Search,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Shield,
  FileText,
  UserCircle,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutCandidate } from "@/lib/auth/candidate-actions";

export interface CrewUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  primaryPosition: string | null;
  profilePhotoUrl: string | null;
  availabilityStatus: string | null;
}

interface CrewPortalLayoutProps {
  children: React.ReactNode;
  user: CrewUser;
}

const navItems = [
  { href: "/crew/dashboard", label: "Dashboard", icon: User },
  { href: "/crew/jobs", label: "Browse Jobs", icon: Search },
  { href: "/crew/applications", label: "My Applications", icon: Briefcase },
  { href: "/crew/verification", label: "Verification", icon: Shield },
  { href: "/crew/referrals", label: "Referrals", icon: Gift },
];

export function CrewPortalLayout({ children, user }: CrewPortalLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const isAvailable =
    user.availabilityStatus === "available" ||
    user.availabilityStatus === "actively_looking";

  const handleSignOut = async () => {
    await signOutCandidate();
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gold-200/30 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Mobile Menu */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-navy-600 hover:bg-navy-50 md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="size-6" />
              ) : (
                <Menu className="size-6" />
              )}
            </button>

            {/* Logo */}
            <Link href="/crew/dashboard" className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-navy-800">
                <Anchor className="size-5 text-gold-400" />
              </div>
              <span className="hidden font-serif text-xl font-semibold text-navy-800 sm:block">
                Lighthouse
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-gold-100 text-gold-700"
                      : "text-navy-600 hover:bg-navy-50 hover:text-navy-800"
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Availability Status - Desktop only */}
            <div
              className={cn(
                "hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium sm:flex",
                isAvailable
                  ? "bg-success-100 text-success-700"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  isAvailable ? "animate-pulse bg-success-500" : "bg-gray-400"
                )}
              />
              {isAvailable ? "Available" : "Not Looking"}
            </div>

            {/* Notifications */}
            <Link
              href="/crew/notifications"
              className="relative rounded-lg p-2 text-navy-600 transition-colors hover:bg-navy-50"
            >
              <Bell className="size-5" />
            </Link>

            {/* Profile Dropdown - Desktop */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-navy-50"
              >
                {user.profilePhotoUrl ? (
                  <img
                    src={user.profilePhotoUrl}
                    alt=""
                    className="size-8 rounded-full object-cover ring-2 ring-gold-200"
                  />
                ) : (
                  <div className="flex size-8 items-center justify-center rounded-full bg-gold-100 text-gold-600 ring-2 ring-gold-200">
                    <span className="text-sm font-semibold">
                      {user.firstName?.[0]}
                      {user.lastName?.[0]}
                    </span>
                  </div>
                )}
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
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm capitalize text-gray-500">
                        {user.primaryPosition?.replace(/_/g, " ") || "Yacht Crew"}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/crew/profile"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <UserCircle className="size-4" />
                        My Profile
                      </Link>
                      <Link
                        href="/crew/settings"
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
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-black/20"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-[85vw] max-w-72 bg-white shadow-xl">
            {/* Header */}
            <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-4">
              <div className="flex size-9 items-center justify-center rounded-lg bg-navy-800">
                <Anchor className="size-5 text-gold-400" />
              </div>
              <span className="font-serif text-xl font-semibold text-navy-800">
                Lighthouse
              </span>
            </div>

            {/* User Info */}
            <div className="border-b border-gray-100 px-4 py-4">
              <div className="flex items-center gap-3">
                {user.profilePhotoUrl ? (
                  <img
                    src={user.profilePhotoUrl}
                    alt=""
                    className="size-12 rounded-full object-cover ring-2 ring-gold-200"
                  />
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-full bg-gold-100 text-gold-600 ring-2 ring-gold-200">
                    <span className="text-lg font-semibold">
                      {user.firstName?.[0]}
                      {user.lastName?.[0]}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-navy-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="truncate text-sm capitalize text-gray-500">
                    {user.primaryPosition?.replace(/_/g, " ") || "Yacht Crew"}
                  </p>
                </div>
              </div>

              {/* Availability Status */}
              <div
                className={cn(
                  "mt-3 flex w-full items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium",
                  isAvailable
                    ? "bg-success-100 text-success-700"
                    : "bg-gray-100 text-gray-600"
                )}
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    isAvailable ? "animate-pulse bg-success-500" : "bg-gray-400"
                  )}
                />
                {isAvailable ? "Available for Work" : "Not Looking"}
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="p-4">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
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

              <div className="my-2 border-t border-gray-100" />

              <Link
                href="/crew/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-navy-900"
              >
                <UserCircle className="size-5" />
                My Profile
              </Link>
              <Link
                href="/crew/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-navy-900"
              >
                <Settings className="size-5" />
                Settings
              </Link>
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
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gold-200/30 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Lighthouse Crew Network
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-sm text-gray-500 hover:text-navy-600"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-gray-500 hover:text-navy-600"
              >
                Terms
              </Link>
              <Link
                href="/contact"
                className="text-sm text-gray-500 hover:text-navy-600"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
