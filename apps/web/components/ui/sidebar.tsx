"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
  active?: boolean;
  section?: string;
}

export interface SidebarProps {
  logo: React.ReactNode;
  logoCollapsed?: React.ReactNode;
  navItems: NavItem[];
  bottomNavItems?: NavItem[];
  user?: {
    name: string;
    email?: string;
    avatar?: string;
  };
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onLogout?: () => void;
  onUserClick?: () => void;
  variant?: "light" | "dark";
  className?: string;
}

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  (
    {
      logo,
      logoCollapsed,
      navItems,
      bottomNavItems,
      user,
      collapsed = false,
      onCollapsedChange,
      onLogout,
      onUserClick,
      variant = "light",
      className,
    },
    ref
  ) => {
    const isDark = variant === "dark";

    const initials = user?.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return (
      <aside
        ref={ref}
        className={cn(
          "fixed flex h-screen flex-col transition-all duration-300",
          collapsed ? "w-16" : "w-[260px]",
          isDark
            ? "bg-navy-800"
            : "bg-white border-r border-gray-200",
          className
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex h-16 items-center px-4",
          isDark ? "" : "border-b border-gray-100"
        )}>
          {collapsed ? logoCollapsed || logo : logo}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {(() => {
            const sections: { [key: string]: NavItem[] } = {};
            const noSection: NavItem[] = [];

            navItems.forEach((item) => {
              if (item.section) {
                if (!sections[item.section]) {
                  sections[item.section] = [];
                }
                sections[item.section].push(item);
              } else {
                noSection.push(item);
              }
            });

            const renderNavItem = (item: NavItem) => (
              <li key={item.id}>
                <a
                  href={item.href}
                  onClick={item.onClick}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-md px-4 text-sm font-medium transition-all duration-200",
                    item.active
                      ? isDark
                        ? "bg-gold-gradient text-gray-900 [&_svg]:text-gray-900"
                        : "bg-gold-100 text-gold-800"
                      : isDark
                        ? "text-gray-300 [&_svg]:text-gray-400 hover:bg-white/5 hover:text-gray-200"
                        : "text-gray-600 hover:bg-gray-100 hover:text-navy-900",
                    collapsed && "justify-center px-0"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          item.active && isDark
                            ? "bg-navy-800/20 text-navy-800"
                            : isDark
                              ? "bg-gold-500 text-navy-900"
                              : "bg-gold-500 text-navy-900"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </a>
              </li>
            );

            return (
              <>
                {noSection.length > 0 && (
                  <ul className="space-y-1">
                    {noSection.map(renderNavItem)}
                  </ul>
                )}
                {Object.entries(sections).map(([sectionName, items]) => (
                  <div key={sectionName} className={noSection.length > 0 || Object.keys(sections).indexOf(sectionName) > 0 ? "mt-6" : ""}>
                    {!collapsed && (
                      <p className={cn(
                        "mb-2 px-4 text-[10px] font-medium uppercase tracking-[0.1em]",
                        isDark ? "text-gray-500" : "text-gray-400"
                      )}>
                        {sectionName}
                      </p>
                    )}
                    <ul className="space-y-1">
                      {items.map(renderNavItem)}
                    </ul>
                  </div>
                ))}
              </>
            );
          })()}

          {bottomNavItems && bottomNavItems.length > 0 && (
            <>
              <div className={cn(
                "my-4 border-t",
                isDark ? "border-white/10" : "border-gray-100"
              )} />
              <ul className="space-y-1">
                {bottomNavItems.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.href}
                      onClick={item.onClick}
                      className={cn(
                        "flex h-11 items-center gap-3 rounded-md px-4 text-sm font-medium transition-all duration-200",
                        item.active
                          ? isDark
                            ? "bg-gold-gradient text-gray-900 [&_svg]:text-gray-900"
                            : "bg-gold-100 text-gold-800"
                          : isDark
                            ? "text-gray-300 [&_svg]:text-gray-400 hover:bg-white/5 hover:text-gray-200"
                            : "text-gray-600 hover:bg-gray-100 hover:text-navy-900",
                        collapsed && "justify-center px-0"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      {!collapsed && (
                        <span className="flex-1 truncate">{item.label}</span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>

        {/* Collapse Toggle */}
        {onCollapsedChange && (
          <div className={cn(
            "border-t px-3 py-3",
            isDark ? "border-white/10" : "border-gray-100"
          )}>
            <button
              onClick={() => onCollapsedChange(!collapsed)}
              className={cn(
                "flex h-11 w-full items-center gap-3 rounded-md px-4 text-sm font-medium transition-all duration-200",
                isDark
                  ? "text-gray-300 [&_svg]:text-gray-400 hover:bg-white/5 hover:text-gray-200"
                  : "text-gray-600 hover:bg-gray-100 hover:text-navy-900",
                collapsed && "justify-center px-0"
              )}
            >
              {collapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <>
                  <ChevronLeft className="size-4" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* User Profile */}
        {user && (
          <div className={cn(
            "border-t px-3 py-3",
            isDark ? "border-white/10" : "border-gray-100"
          )}>
            <div
              className={cn(
                "flex items-center gap-3 rounded-md p-2 transition-all duration-200",
                onUserClick && (isDark ? "cursor-pointer hover:bg-white/5" : "cursor-pointer hover:bg-gray-50"),
                collapsed && "justify-center"
              )}
              onClick={onUserClick}
              role={onUserClick ? "button" : undefined}
              tabIndex={onUserClick ? 0 : undefined}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className={cn(
                    "size-9 rounded-full object-cover ring-2",
                    isDark ? "ring-gold-500/30" : "ring-gray-100"
                  )}
                />
              ) : (
                <div className={cn(
                  "flex size-9 items-center justify-center rounded-full text-sm font-semibold",
                  isDark
                    ? "bg-gold-500 text-navy-900"
                    : "bg-navy-100 text-navy-600"
                )}>
                  {initials}
                </div>
              )}
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "truncate text-sm font-medium",
                    isDark ? "text-gray-100" : "text-navy-900"
                  )}>
                    {user.name}
                  </p>
                  {user.email && (
                    <p className={cn(
                      "truncate text-xs",
                      isDark ? "text-gray-500" : "text-gray-500"
                    )}>{user.email}</p>
                  )}
                </div>
              )}
              {!collapsed && onLogout && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLogout();
                  }}
                  className={cn(
                    "rounded-md p-1.5 transition-colors",
                    isDark
                      ? "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                      : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  )}
                  title="Logout"
                >
                  <LogOut className="size-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </aside>
    );
  }
);
Sidebar.displayName = "Sidebar";

export { Sidebar };
