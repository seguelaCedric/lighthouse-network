"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { signOut } from "@/lib/auth/actions";

export function AuthMenu() {
  const { user, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  // If user is signed in, show profile menu
  if (user) {
    const userEmail = user.email || "";
    const initials = userEmail
      .split("@")[0]
      .slice(0, 2)
      .toUpperCase()
      .padEnd(2, "?");

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-50 transition-colors"
        >
          <div className="flex size-8 items-center justify-center rounded-full bg-gold-100 text-gold-600 text-sm font-semibold">
            {initials}
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-gray-500 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="font-medium text-navy-900">
                  {userEmail.split("@")[0]}
                </p>
                <p className="text-sm text-gray-500 truncate">{userEmail}</p>
              </div>
              <div className="py-1">
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Dashboard
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
    );
  }

  // If user is not signed in, show sign in and sign up buttons
  return (
    <div className="flex items-center gap-2">
      <Link href="/auth/login">
        <Button variant="ghost" size="sm">
          Log in
        </Button>
      </Link>
      <Link href="/auth/register">
        <Button variant="primary" size="sm">
          Register
        </Button>
      </Link>
    </div>
  );
}

