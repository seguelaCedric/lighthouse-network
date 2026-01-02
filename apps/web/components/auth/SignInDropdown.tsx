"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Briefcase, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const signInOptions = [
  {
    href: "/auth/login",
    icon: Briefcase,
    label: "I'm looking for work",
    description: "Yacht crew & private staff",
    iconBg: "bg-gold-100",
    iconColor: "text-gold-600",
  },
  {
    href: "/employer/login",
    icon: Users,
    label: "I'm hiring staff",
    description: "Yacht owners, captains & households",
    iconBg: "bg-navy-100",
    iconColor: "text-navy-600",
  },
];

export function SignInDropdown() {
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

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1"
      >
        Sign In
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
          {signInOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Link
                key={option.href}
                href={option.href}
                onClick={() => setIsOpen(false)}
                className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
              >
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", option.iconBg)}>
                  <Icon className={cn("h-4 w-4", option.iconColor)} />
                </div>
                <div>
                  <div className="text-sm font-medium text-navy-900">
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
