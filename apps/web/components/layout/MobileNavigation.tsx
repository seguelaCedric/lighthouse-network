"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Search,
  Briefcase,
  MessageSquare,
  User,
  Menu,
  X,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Calendar,
  Building2,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

// Bottom tab items
const bottomTabs = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/candidates/search", label: "Search", icon: Search },
  { href: "/jobs/pipeline", label: "Jobs", icon: Briefcase },
  { href: "/messages", label: "Messages", icon: MessageSquare, badge: 3 },
  { href: "/crew/profile/edit", label: "Profile", icon: User },
];

// Hamburger menu sections
const menuSections = [
  {
    title: "Main",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: Home },
      { href: "/candidates/search", label: "Candidate Search", icon: Search },
      { href: "/jobs/pipeline", label: "Job Pipeline", icon: Briefcase },
      { href: "/clients", label: "Clients", icon: Building2 },
      { href: "/messages", label: "Messages", icon: MessageSquare },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/calendar", label: "Calendar", icon: Calendar },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/settings/profile", label: "Settings", icon: Settings },
      { href: "/help", label: "Help & Support", icon: HelpCircle },
    ],
  },
];

// Bottom Tab Bar Component
export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white pb-safe sm:hidden">
      <div className="flex items-center justify-around">
        {bottomTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors",
                isActive ? "text-gold-600" : "text-gray-500"
              )}
            >
              <div className="relative">
                <Icon className={cn("size-6", isActive && "text-gold-600")} />
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -right-1.5 -top-1 flex size-4 items-center justify-center rounded-full bg-burgundy-500 text-[10px] font-bold text-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span>{tab.label}</span>
              {isActive && (
                <div className="absolute -top-px left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-gold-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Mobile Header with Hamburger Menu
export function MobileHeader({
  title,
  showBack = false,
  onBack,
}: {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:hidden">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={onBack}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            >
              <ChevronRight className="size-5 rotate-180" />
            </button>
          ) : (
            <button
              onClick={() => setIsMenuOpen(true)}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            >
              <Menu className="size-5" />
            </button>
          )}
          {title ? (
            <h1 className="text-2xl font-serif font-semibold text-navy-800">{title}</h1>
          ) : (
            <Logo size="sm" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className="relative rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <Bell className="size-5" />
            <span className="absolute right-1 top-1 size-2 rounded-full bg-burgundy-500" />
          </Link>
        </div>
      </header>

      {/* Hamburger Menu Overlay */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 sm:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-white shadow-xl sm:hidden">
            {/* Menu Header */}
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <Logo size="lg" />
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* User Info */}
            <div className="border-b border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-navy-100 font-semibold text-navy-600">
                  ER
                </div>
                <div>
                  <p className="font-medium text-navy-900">Emma Richardson</p>
                  <p className="text-sm text-gray-500">Senior Recruiter</p>
                </div>
              </div>
            </div>

            {/* Menu Sections */}
            <div className="flex-1 overflow-y-auto p-4">
              {menuSections.map((section) => (
                <div key={section.title} className="mb-6">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {section.title}
                  </p>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-gold-50 text-gold-700"
                              : "text-gray-600 hover:bg-gray-50"
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
                </div>
              ))}
            </div>

            {/* Logout */}
            <div className="border-t border-gray-100 p-4">
              <button
                onClick={async () => {
                  const { signOut } = await import("@/lib/auth/actions");
                  await signOut();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-burgundy-600 hover:bg-burgundy-50"
              >
                <LogOut className="size-5" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Floating Action Button Component
export function FloatingActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-gold-500 px-4 py-3 font-medium text-white shadow-lg transition-transform hover:bg-gold-600 active:scale-95 sm:hidden"
    >
      <Icon className="size-5" />
      {label}
    </button>
  );
}

// Mobile Save Footer
export function MobileSaveFooter({
  onSave,
  onCancel,
  isSaving = false,
  hasChanges = true,
}: {
  onSave: () => void;
  onCancel?: () => void;
  isSaving?: boolean;
  hasChanges?: boolean;
}) {
  if (!hasChanges) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white p-4 pb-safe sm:hidden">
      <div className="flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-200 py-3 font-medium text-gray-600"
          >
            Cancel
          </button>
        )}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gold-500 py-3 font-medium text-white disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <svg className="size-4 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
}
