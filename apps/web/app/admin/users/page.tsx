"use client";

import { Button } from "@/components/ui/button";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Mail,
  MoreHorizontal,
} from "lucide-react";

const summaryCards = [
  {
    label: "Total users",
    value: "128",
    helper: "+12 this month",
    icon: Users,
    iconStyle: "bg-navy-50 text-navy-700",
  },
  {
    label: "Admins",
    value: "8",
    helper: "2 pending approvals",
    icon: ShieldCheck,
    iconStyle: "bg-burgundy-50 text-burgundy-700",
  },
  {
    label: "Invitations",
    value: "5",
    helper: "Sent last 7 days",
    icon: Mail,
    iconStyle: "bg-gold-50 text-gold-700",
  },
];

const users = [
  {
    id: "usr_01",
    name: "Emma Richardson",
    email: "emma@lighthousenetwork.com",
    role: "Owner",
    status: "Active",
    lastActive: "5m ago",
  },
  {
    id: "usr_02",
    name: "James Wilson",
    email: "james@lighthousenetwork.com",
    role: "Admin",
    status: "Active",
    lastActive: "2h ago",
  },
  {
    id: "usr_03",
    name: "Sophie Martin",
    email: "sophie@lighthousenetwork.com",
    role: "Recruiter",
    status: "Active",
    lastActive: "1d ago",
  },
  {
    id: "usr_04",
    name: "Michael Chen",
    email: "michael@lighthousenetwork.com",
    role: "Recruiter",
    status: "Invited",
    lastActive: "Pending",
  },
  {
    id: "usr_05",
    name: "Laura Davis",
    email: "laura@lighthousenetwork.com",
    role: "Viewer",
    status: "Inactive",
    lastActive: "30d ago",
  },
];

const statusStyles: Record<string, string> = {
  Active: "bg-success-50 text-success-700 border-success-200",
  Invited: "bg-gold-50 text-gold-700 border-gold-200",
  Inactive: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-navy-900">Users</h2>
          <p className="text-sm text-gray-500">
            Manage agency members, roles, and access.
          </p>
        </div>
        <Button leftIcon={<UserPlus className="size-4" />}>
          Invite user
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-semibold text-navy-900">
                    {card.value}
                  </p>
                  <p className="text-xs text-gray-400">{card.helper}</p>
                </div>
                <div
                  className={`flex size-11 items-center justify-center rounded-xl ${card.iconStyle}`}
                >
                  <Icon className="size-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-navy-900">Team roster</h3>
            <p className="text-sm text-gray-500">
              Recent activity and current access level.
            </p>
          </div>
          <Button variant="secondary" size="sm">
            Export list
          </Button>
        </div>
        <div className="divide-y divide-gray-100">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-navy-900">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium">
                  {user.role}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[user.status]}`}
                >
                  {user.status}
                </span>
                <span className="text-xs text-gray-400">
                  Last active: {user.lastActive}
                </span>
                <button
                  className="inline-flex size-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-50 hover:text-navy-700"
                  aria-label={`More actions for ${user.name}`}
                  type="button"
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
