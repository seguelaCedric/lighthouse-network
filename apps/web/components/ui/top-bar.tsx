"use client";

import * as React from "react";
import { Bell, ChevronDown, LogOut, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchInput } from "./search-input";

export interface TopBarProps {
  user?: {
    name: string;
    email?: string;
    avatar?: string;
  };
  notificationCount?: number;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onLogout?: () => void;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string;
}

const TopBar = React.forwardRef<HTMLElement, TopBarProps>(
  (
    {
      user,
      notificationCount = 0,
      searchValue,
      searchPlaceholder = "Search...",
      onSearchChange,
      onSearchSubmit,
      onNotificationsClick,
      onProfileClick,
      onSettingsClick,
      onLogout,
      leftContent,
      rightContent,
      className,
    },
    ref
  ) => {
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const [localSearchValue, setLocalSearchValue] = React.useState(searchValue || "");
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    const initials = user?.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsDropdownOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSearchSubmit?.(localSearchValue);
    };

    return (
      <header
        ref={ref}
        className={cn(
          "flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white px-6",
          className
        )}
      >
        {/* Left Section */}
        <div className="flex flex-1 items-center gap-4">
          {leftContent}
          {onSearchChange && (
            <form onSubmit={handleSearchSubmit} className="w-full max-w-md">
              <SearchInput
                value={searchValue !== undefined ? searchValue : localSearchValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setLocalSearchValue(value);
                  onSearchChange(value);
                }}
                onClear={() => {
                  setLocalSearchValue("");
                  onSearchChange("");
                }}
                placeholder={searchPlaceholder}
              />
            </form>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {rightContent}

          {/* Notifications */}
          {onNotificationsClick && (
            <button
              onClick={onNotificationsClick}
              className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-navy-900 transition-colors"
            >
              <Bell className="size-5" />
              {notificationCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-error-500 text-[10px] font-bold text-white">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </button>
          )}

          {/* User Dropdown */}
          {user && (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={cn(
                  "flex items-center gap-2 rounded-lg p-1.5 transition-colors",
                  isDropdownOpen
                    ? "bg-gray-100"
                    : "hover:bg-gray-50"
                )}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="size-8 rounded-full object-cover ring-2 ring-gray-100"
                  />
                ) : (
                  <div className="flex size-8 items-center justify-center rounded-full bg-navy-100 text-sm font-semibold text-navy-600">
                    {initials}
                  </div>
                )}
                <ChevronDown
                  className={cn(
                    "size-4 text-gray-400 transition-transform",
                    isDropdownOpen && "rotate-180"
                  )}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="text-sm font-medium text-navy-900">{user.name}</p>
                    {user.email && (
                      <p className="truncate text-xs text-gray-500">{user.email}</p>
                    )}
                  </div>
                  <ul className="py-1">
                    {onProfileClick && (
                      <li>
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            onProfileClick();
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <User className="size-4" />
                          Profile
                        </button>
                      </li>
                    )}
                    {onSettingsClick && (
                      <li>
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            onSettingsClick();
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Settings className="size-4" />
                          Settings
                        </button>
                      </li>
                    )}
                    {onLogout && (
                      <li>
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            onLogout();
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-error-600 hover:bg-error-50"
                        >
                          <LogOut className="size-4" />
                          Logout
                        </button>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    );
  }
);
TopBar.displayName = "TopBar";

export { TopBar };
