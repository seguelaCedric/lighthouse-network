"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthMenu } from "@/components/auth/AuthMenu";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";

const navItems = [
  { href: "/about", label: "About" },
  { href: "/yacht-crew", label: "Yacht Crew" },
  { href: "/private-staff", label: "Private Staff" },
  { href: "/job-board", label: "Job Board" },
  { href: "/blog", label: "Resources" },
  { href: "/contact", label: "Contact" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      {/* Top bar with contact info - Desktop only */}
      <div className="hidden gradient-gold-shimmer sm:block">
        <div className="mx-auto flex h-8 max-w-6xl items-center justify-end gap-4 px-4 text-xs sm:px-6">
          <a
            href="tel:+33676410299"
            className="flex items-center gap-1.5 text-navy-900 hover:text-navy-700"
          >
            <Phone className="h-3 w-3" />
            <span>+33 6 76 41 02 99</span>
          </a>
          <span className="text-navy-600">|</span>
          <a
            href="https://wa.me/33676410299"
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
        <Link href="/">
          <Logo size="md" />
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
          <AuthMenu />
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
            {loading ? (
              <div className="px-4 py-2">
                <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
              </div>
            ) : user ? (
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full">
                    Log in
                  </Button>
                </Link>
                <Link href="/join" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
