"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Anchor, Menu, X, Phone, MessageCircle, Building2, Briefcase, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInDropdown } from "@/components/auth/SignInDropdown";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/job-board", label: "Find Jobs" },
  { href: "/yacht-crew", label: "Yacht Crew" },
  { href: "/private-staff", label: "Private Staff" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      {/* Top bar with contact info - Desktop only */}
      <div className="hidden gradient-gold-shimmer sm:block">
        <div className="mx-auto flex h-8 max-w-6xl items-center justify-end gap-4 px-4 text-xs sm:px-6">
          <a
            href="tel:+33451088780"
            className="flex items-center gap-1.5 text-navy-900 hover:text-navy-700"
          >
            <Phone className="h-3 w-3" />
            <span>+33 451 088 780</span>
          </a>
          <span className="text-navy-600">|</span>
          <a
            href="https://wa.me/33451088780"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-navy-900 hover:text-navy-700"
          >
            <MessageCircle className="h-3 w-3" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-navy-800">
            <Anchor className="size-5 text-gold-400" />
          </div>
          <span className="font-serif text-xl font-semibold text-navy-800">
            Lighthouse
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                pathname === item.href
                  ? "text-navy-800 bg-gray-100"
                  : "text-gray-600 hover:text-navy-800 hover:bg-gray-50"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 sm:flex">
          <Link
            href="/hire"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-navy-800"
          >
            <Building2 className="h-4 w-4" />
            For Employers
          </Link>
          <SignInDropdown />
          <Link href="/join">
            <Button variant="primary" size="sm">
              Find Work
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 sm:hidden"
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 sm:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  pathname === item.href
                    ? "text-navy-800 bg-gray-100"
                    : "text-gray-600 hover:text-navy-800 hover:bg-gray-50"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4">
            {/* Sign In Options */}
            <p className="px-4 text-xs font-medium uppercase tracking-wider text-gray-400">Sign In</p>
            <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Briefcase className="h-4 w-4 text-gold-600" />
                I'm looking for work
              </Button>
            </Link>
            <Link href="/employer/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Users className="h-4 w-4 text-navy-600" />
                I'm hiring staff
              </Button>
            </Link>

            {/* CTA Buttons */}
            <div className="mt-2 flex flex-col gap-2 border-t border-gray-100 pt-4">
              <Link href="/join" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full">
                  Find Work
                </Button>
              </Link>
              <Link href="/hire" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="secondary" className="w-full">
                  Hire Staff
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
