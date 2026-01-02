"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Check,
  X,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Clock,
  Plug,
  Settings,
  ChevronRight,
} from "lucide-react";

// Types
interface Integration {
  id: string;
  name: string;
  description: string;
  logo: string;
  category: "crm" | "communication" | "calendar" | "storage";
  isConnected: boolean;
  lastSync?: Date;
  syncStatus?: "synced" | "syncing" | "error";
  features: string[];
}

// Mock integrations
const mockIntegrations: Integration[] = [
  {
    id: "vincere",
    name: "Vincere",
    description: "ATS & CRM for recruitment agencies. Sync candidates, jobs, and placements.",
    logo: "/integrations/vincere.svg",
    category: "crm",
    isConnected: true,
    lastSync: new Date(Date.now() - 15 * 60 * 1000),
    syncStatus: "synced",
    features: ["Candidate sync", "Job sync", "Placement tracking", "Activity logging"],
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Connect your Gmail account for seamless email communication.",
    logo: "/integrations/gmail.svg",
    category: "communication",
    isConnected: true,
    lastSync: new Date(Date.now() - 5 * 60 * 1000),
    syncStatus: "synced",
    features: ["Send emails", "Email tracking", "Template sync", "Signature support"],
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Message candidates and clients directly via WhatsApp.",
    logo: "/integrations/whatsapp.svg",
    category: "communication",
    isConnected: false,
    features: ["Direct messaging", "Message templates", "Read receipts", "Media sharing"],
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Sync interviews and meetings with your Google Calendar.",
    logo: "/integrations/google-calendar.svg",
    category: "calendar",
    isConnected: true,
    lastSync: new Date(Date.now() - 2 * 60 * 1000),
    syncStatus: "syncing",
    features: ["Event sync", "Availability check", "Meeting invites", "Reminders"],
  },
  {
    id: "outlook",
    name: "Microsoft Outlook",
    description: "Connect Outlook for email and calendar integration.",
    logo: "/integrations/outlook.svg",
    category: "calendar",
    isConnected: false,
    features: ["Email sync", "Calendar sync", "Contact sync", "Teams meetings"],
  },
  {
    id: "dropbox",
    name: "Dropbox",
    description: "Store and share documents securely with Dropbox.",
    logo: "/integrations/dropbox.svg",
    category: "storage",
    isConnected: false,
    features: ["File storage", "Document sharing", "CV backup", "Team folders"],
  },
];

// Status indicator component
function SyncStatus({ status, lastSync }: { status?: string; lastSync?: Date }) {
  if (!status) return null;

  const formatLastSync = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center gap-2">
      {status === "synced" && (
        <>
          <div className="flex items-center gap-1 text-success-600">
            <Check className="size-4" />
            <span className="text-sm font-medium">Synced</span>
          </div>
          {lastSync && (
            <span className="text-xs text-gray-500">• {formatLastSync(lastSync)}</span>
          )}
        </>
      )}
      {status === "syncing" && (
        <div className="flex items-center gap-1 text-gold-600">
          <RefreshCw className="size-4 animate-spin" />
          <span className="text-sm font-medium">Syncing...</span>
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-1 text-burgundy-600">
          <AlertCircle className="size-4" />
          <span className="text-sm font-medium">Sync error</span>
        </div>
      )}
    </div>
  );
}

// Integration card component
function IntegrationCard({
  integration,
  onConnect,
  onDisconnect,
  onSync,
  onSettings,
}: {
  integration: Integration;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync: () => void;
  onSettings: () => void;
}) {
  const getLogoPlaceholder = (name: string) => {
    const colors: { [key: string]: string } = {
      vincere: "bg-purple-100 text-purple-600",
      gmail: "bg-error-100 text-error-600",
      whatsapp: "bg-success-100 text-success-600",
      "google-calendar": "bg-blue-100 text-blue-600",
      outlook: "bg-blue-100 text-blue-600",
      dropbox: "bg-blue-100 text-blue-600",
    };
    return colors[integration.id] || "bg-gray-100 text-gray-600";
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-5 transition-all",
        integration.isConnected ? "border-success-200" : "border-gray-200"
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-12 items-center justify-center rounded-xl text-lg font-bold",
              getLogoPlaceholder(integration.name)
            )}
          >
            {integration.name[0]}
          </div>
          <div>
            <h3 className="font-semibold text-navy-900">{integration.name}</h3>
            <p className="text-sm text-gray-500">{integration.description}</p>
          </div>
        </div>
        {integration.isConnected && (
          <div className="flex items-center gap-1 rounded-full bg-success-100 px-2.5 py-1">
            <Check className="size-3.5 text-success-600" />
            <span className="text-xs font-medium text-success-700">Connected</span>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-1.5">
          {integration.features.map((feature) => (
            <span
              key={feature}
              className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>

      {/* Sync Status */}
      {integration.isConnected && (
        <div className="mb-4">
          <SyncStatus status={integration.syncStatus} lastSync={integration.lastSync} />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {integration.isConnected ? (
          <>
            <Button variant="secondary" size="sm" onClick={onSync}>
              <RefreshCw className="mr-1.5 size-4" />
              Sync Now
            </Button>
            <Button variant="secondary" size="sm" onClick={onSettings}>
              <Settings className="mr-1.5 size-4" />
              Settings
            </Button>
            <button
              onClick={onDisconnect}
              className="ml-auto text-sm font-medium text-burgundy-600 hover:text-burgundy-700"
            >
              Disconnect
            </button>
          </>
        ) : (
          <Button variant="primary" size="sm" onClick={onConnect}>
            <Plug className="mr-1.5 size-4" />
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}

export default function IntegrationsSettingsPage() {
  const [integrations, setIntegrations] = useState(mockIntegrations);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "All" },
    { id: "crm", label: "CRM & ATS" },
    { id: "communication", label: "Communication" },
    { id: "calendar", label: "Calendar" },
    { id: "storage", label: "Storage" },
  ];

  const filteredIntegrations =
    activeCategory === "all"
      ? integrations
      : integrations.filter((i) => i.category === activeCategory);

  const connectedCount = integrations.filter((i) => i.isConnected).length;

  const handleConnect = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, isConnected: true, syncStatus: "syncing" as const, lastSync: new Date() }
          : i
      )
    );
    // Simulate sync completion
    setTimeout(() => {
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, syncStatus: "synced" as const } : i
        )
      );
    }, 2000);
  };

  const handleDisconnect = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, isConnected: false, syncStatus: undefined, lastSync: undefined }
          : i
      )
    );
  };

  const handleSync = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, syncStatus: "syncing" as const } : i
      )
    );
    setTimeout(() => {
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, syncStatus: "synced" as const, lastSync: new Date() }
            : i
        )
      );
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-serif font-medium text-navy-800">Integrations</h2>
        <p className="text-sm text-gray-500">
          Connect third-party services to enhance your workflow
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 rounded-xl bg-navy-50 p-4">
        <div className="flex size-12 items-center justify-center rounded-full bg-navy-100">
          <Plug className="size-6 text-navy-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-navy-900">{connectedCount}</p>
          <p className="text-sm text-navy-600">Connected integrations</p>
        </div>
        <div className="ml-auto">
          <a
            href="#"
            className="flex items-center gap-1 text-sm font-medium text-navy-600 hover:text-navy-700"
          >
            View API Docs
            <ExternalLink className="size-4" />
          </a>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              activeCategory === category.id
                ? "bg-navy-900 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            )}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {filteredIntegrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onConnect={() => handleConnect(integration.id)}
            onDisconnect={() => handleDisconnect(integration.id)}
            onSync={() => handleSync(integration.id)}
            onSettings={() => console.log("Settings:", integration.id)}
          />
        ))}
      </div>

      {/* Request Integration */}
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <Plug className="mx-auto mb-3 size-10 text-gray-400" />
        <h3 className="mb-1 font-semibold text-navy-900">Need another integration?</h3>
        <p className="mb-4 text-sm text-gray-500">
          Let us know which tools you'd like to connect with Lighthouse Network.
        </p>
        <Button variant="secondary">
          Request Integration
          <ChevronRight className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  );
}
