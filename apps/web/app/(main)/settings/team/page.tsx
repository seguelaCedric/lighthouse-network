"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Mail,
  Shield,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  X,
  ChevronDown,
  Check,
  Clock,
  Crown,
  Eye,
  FileText,
  Briefcase,
  Settings,
} from "lucide-react";

// Types
interface TeamMember {
  id: string;
  name: string;
  email: string;
  photo: string | null;
  role: "owner" | "admin" | "recruiter" | "viewer";
  status: "active" | "pending" | "inactive";
  lastActive?: Date;
  invitedAt?: Date;
}

// Mock team members
const mockTeamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Emma Richardson",
    email: "emma@lighthousenetwork.com",
    photo: null,
    role: "owner",
    status: "active",
    lastActive: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: "2",
    name: "James Wilson",
    email: "james@lighthousenetwork.com",
    photo: null,
    role: "admin",
    status: "active",
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "3",
    name: "Sophie Martin",
    email: "sophie@lighthousenetwork.com",
    photo: null,
    role: "recruiter",
    status: "active",
    lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: "4",
    name: "Michael Chen",
    email: "michael@lighthousenetwork.com",
    photo: null,
    role: "recruiter",
    status: "pending",
    invitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "5",
    name: "Laura Davis",
    email: "laura@lighthousenetwork.com",
    photo: null,
    role: "viewer",
    status: "inactive",
    lastActive: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
];

// Role permissions
const rolePermissions = {
  owner: {
    label: "Owner",
    description: "Full access to all features and settings",
    icon: Crown,
    color: "text-gold-600 bg-gold-100",
  },
  admin: {
    label: "Admin",
    description: "Manage team members and most settings",
    icon: Shield,
    color: "text-purple-600 bg-purple-100",
  },
  recruiter: {
    label: "Recruiter",
    description: "Full access to candidates and jobs",
    icon: Briefcase,
    color: "text-blue-600 bg-blue-100",
  },
  viewer: {
    label: "Viewer",
    description: "Read-only access to data",
    icon: Eye,
    color: "text-gray-600 bg-gray-100",
  },
};

// Permission matrix
const permissionMatrix = [
  { feature: "View Candidates", owner: true, admin: true, recruiter: true, viewer: true },
  { feature: "Edit Candidates", owner: true, admin: true, recruiter: true, viewer: false },
  { feature: "View Jobs", owner: true, admin: true, recruiter: true, viewer: true },
  { feature: "Create/Edit Jobs", owner: true, admin: true, recruiter: true, viewer: false },
  { feature: "Manage Shortlists", owner: true, admin: true, recruiter: true, viewer: false },
  { feature: "Send Messages", owner: true, admin: true, recruiter: true, viewer: false },
  { feature: "View Reports", owner: true, admin: true, recruiter: true, viewer: true },
  { feature: "Export Data", owner: true, admin: true, recruiter: false, viewer: false },
  { feature: "Manage Team", owner: true, admin: true, recruiter: false, viewer: false },
  { feature: "Billing & Settings", owner: true, admin: false, recruiter: false, viewer: false },
];

// Invite modal component
function InviteModal({ onClose, onInvite }: { onClose: () => void; onInvite: (email: string, role: string) => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("recruiter");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      onInvite(email, role);
      setIsLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h3 className="font-semibold text-navy-900">Invite Team Member</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-navy-900">Role</label>
            <div className="space-y-2">
              {(["admin", "recruiter", "viewer"] as const).map((r) => {
                const roleInfo = rolePermissions[r];
                const Icon = roleInfo.icon;
                return (
                  <label
                    key={r}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                      role === r
                        ? "border-gold-400 bg-gold-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={role === r}
                      onChange={(e) => setRole(e.target.value)}
                      className="sr-only"
                    />
                    <div className={cn("flex size-8 items-center justify-center rounded-full", roleInfo.color)}>
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-navy-900">{roleInfo.label}</p>
                      <p className="text-xs text-gray-500">{roleInfo.description}</p>
                    </div>
                    {role === r && <Check className="size-5 text-gold-600" />}
                  </label>
                );
              })}
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="size-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending Invite...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Mail className="size-4" />
                Send Invitation
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

// Team member row component
function TeamMemberRow({
  member,
  onEdit,
  onRemove,
  onResendInvite,
}: {
  member: TeamMember;
  onEdit: () => void;
  onRemove: () => void;
  onResendInvite: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const roleInfo = rolePermissions[member.role];
  const Icon = roleInfo.icon;
  const initials = member.name.split(" ").map((n) => n[0]).join("");

  const formatLastActive = (date?: Date) => {
    if (!date) return "Never";
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 5) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-4 pl-4 pr-3">
        <div className="flex items-center gap-3">
          {member.photo ? (
            <img src={member.photo} alt={member.name} className="size-10 rounded-full object-cover" />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-full bg-navy-100 font-semibold text-navy-600">
              {initials}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-navy-900">{member.name}</p>
              {member.role === "owner" && (
                <span className="rounded bg-gold-100 px-1.5 py-0.5 text-xs font-medium text-gold-700">
                  You
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{member.email}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-4">
        <div className="flex items-center gap-2">
          <div className={cn("flex size-6 items-center justify-center rounded-full", roleInfo.color)}>
            <Icon className="size-3" />
          </div>
          <span className="text-sm font-medium text-navy-900">{roleInfo.label}</span>
        </div>
      </td>
      <td className="px-3 py-4">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
            member.status === "active"
              ? "bg-success-100 text-success-700"
              : member.status === "pending"
                ? "bg-gold-100 text-gold-700"
                : "bg-gray-100 text-gray-600"
          )}
        >
          {member.status === "active" && <UserCheck className="size-3" />}
          {member.status === "pending" && <Clock className="size-3" />}
          {member.status === "inactive" && <UserX className="size-3" />}
          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
        </span>
      </td>
      <td className="px-3 py-4">
        <span className="text-sm text-gray-500">
          {member.status === "pending"
            ? `Invited ${formatLastActive(member.invitedAt)}`
            : formatLastActive(member.lastActive)}
        </span>
      </td>
      <td className="py-4 pl-3 pr-4">
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            disabled={member.role === "owner"}
          >
            <MoreVertical className="size-4" />
          </button>
          {showMenu && member.role !== "owner" && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                {member.status === "pending" ? (
                  <button
                    onClick={() => {
                      onResendInvite();
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Mail className="size-4" />
                    Resend Invite
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onEdit();
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit className="size-4" />
                    Edit Role
                  </button>
                )}
                <button
                  onClick={() => {
                    onRemove();
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-burgundy-600 hover:bg-burgundy-50"
                >
                  <Trash2 className="size-4" />
                  Remove
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function TeamSettingsPage() {
  const [members, setMembers] = useState(mockTeamMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInvite = (email: string, role: string) => {
    const newMember: TeamMember = {
      id: `new-${Date.now()}`,
      name: email.split("@")[0],
      email,
      photo: null,
      role: role as TeamMember["role"],
      status: "pending",
      invitedAt: new Date(),
    };
    setMembers((prev) => [...prev, newMember]);
  };

  const handleRemove = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const activeCount = members.filter((m) => m.status === "active").length;
  const pendingCount = members.filter((m) => m.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-medium text-navy-800">Team Management</h2>
          <p className="text-sm text-gray-500">
            Manage your team members and their permissions
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowInviteModal(true)}>
          <Plus className="mr-1.5 size-4" />
          Invite Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-navy-100">
              <Users className="size-5 text-navy-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{members.length}</p>
              <p className="text-sm text-gray-500">Total Members</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-success-100">
              <UserCheck className="size-5 text-success-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{activeCount}</p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-gold-100">
              <Clock className="size-5 text-gold-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{pendingCount}</p>
              <p className="text-sm text-gray-500">Pending Invites</p>
            </div>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {/* Table Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team members..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            />
          </div>
          <button
            onClick={() => setShowPermissions(!showPermissions)}
            className="flex items-center gap-1.5 text-sm font-medium text-gold-600 hover:text-gold-700"
          >
            <Shield className="size-4" />
            {showPermissions ? "Hide" : "View"} Permissions
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="py-3 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Member
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Role
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Last Active
                </th>
                <th className="py-3 pl-3 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <TeamMemberRow
                  key={member.id}
                  member={member}
                  onEdit={() => console.log("Edit:", member.id)}
                  onRemove={() => handleRemove(member.id)}
                  onResendInvite={() => console.log("Resend:", member.id)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {filteredMembers.length === 0 && (
          <div className="py-8 text-center">
            <Users className="mx-auto mb-2 size-8 text-gray-300" />
            <p className="text-sm text-gray-500">No team members found</p>
          </div>
        )}
      </div>

      {/* Permissions Matrix */}
      {showPermissions && (
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 p-4">
            <h3 className="font-semibold text-navy-900">Role Permissions Matrix</h3>
            <p className="text-sm text-gray-500">Overview of what each role can do</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="py-3 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Feature
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Owner
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Admin
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Recruiter
                  </th>
                  <th className="py-3 pl-3 pr-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Viewer
                  </th>
                </tr>
              </thead>
              <tbody>
                {permissionMatrix.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 pl-4 pr-3 text-sm text-navy-900">{row.feature}</td>
                    <td className="px-3 py-3 text-center">
                      {row.owner ? (
                        <Check className="mx-auto size-4 text-success-600" />
                      ) : (
                        <X className="mx-auto size-4 text-gray-300" />
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {row.admin ? (
                        <Check className="mx-auto size-4 text-success-600" />
                      ) : (
                        <X className="mx-auto size-4 text-gray-300" />
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {row.recruiter ? (
                        <Check className="mx-auto size-4 text-success-600" />
                      ) : (
                        <X className="mx-auto size-4 text-gray-300" />
                      )}
                    </td>
                    <td className="py-3 pl-3 pr-4 text-center">
                      {row.viewer ? (
                        <Check className="mx-auto size-4 text-success-600" />
                      ) : (
                        <X className="mx-auto size-4 text-gray-300" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal onClose={() => setShowInviteModal(false)} onInvite={handleInvite} />
      )}
    </div>
  );
}
