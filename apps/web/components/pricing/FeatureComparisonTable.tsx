"use client";

import { Check, X, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
  name: string;
  category: string;
  starter: string | boolean;
  pro: string | boolean;
  enterprise: string | boolean;
}

const features: Feature[] = [
  // Candidate Management
  { name: "Candidate profiles", category: "Candidate Management", starter: "50", pro: "Unlimited", enterprise: "Unlimited" },
  { name: "Active job postings", category: "Candidate Management", starter: "5", pro: "Unlimited", enterprise: "Unlimited" },
  { name: "CV parsing & upload", category: "Candidate Management", starter: true, pro: true, enterprise: true },
  { name: "Candidate search", category: "Candidate Management", starter: "Basic", pro: "Advanced", enterprise: "Advanced" },
  { name: "Saved searches", category: "Candidate Management", starter: "3", pro: "Unlimited", enterprise: "Unlimited" },

  // AI Features
  { name: "AI brief parsing", category: "AI Features", starter: false, pro: true, enterprise: true },
  { name: "AI candidate matching", category: "AI Features", starter: false, pro: true, enterprise: true },
  { name: "Match scoring & ranking", category: "AI Features", starter: false, pro: true, enterprise: true },
  { name: "AI-generated summaries", category: "AI Features", starter: false, pro: true, enterprise: true },

  // Client Management
  { name: "Client portal access", category: "Client Management", starter: false, pro: true, enterprise: true },
  { name: "Shortlist sharing", category: "Client Management", starter: "Email only", pro: "Portal + Email", enterprise: "Portal + Email" },
  { name: "Client feedback collection", category: "Client Management", starter: false, pro: true, enterprise: true },
  { name: "Interview scheduling", category: "Client Management", starter: false, pro: true, enterprise: true },

  // Communication
  { name: "WhatsApp integration", category: "Communication", starter: false, pro: true, enterprise: true },
  { name: "Email integration", category: "Communication", starter: true, pro: true, enterprise: true },
  { name: "In-app messaging", category: "Communication", starter: true, pro: true, enterprise: true },
  { name: "Bulk messaging", category: "Communication", starter: false, pro: true, enterprise: true },

  // Integrations & API
  { name: "API access", category: "Integrations & API", starter: false, pro: false, enterprise: true },
  { name: "Webhook integrations", category: "Integrations & API", starter: false, pro: false, enterprise: true },
  { name: "White-label portal", category: "Integrations & API", starter: false, pro: false, enterprise: true },
  { name: "Custom integrations", category: "Integrations & API", starter: false, pro: false, enterprise: true },

  // Support
  { name: "Email support", category: "Support", starter: true, pro: true, enterprise: true },
  { name: "Priority support", category: "Support", starter: false, pro: true, enterprise: true },
  { name: "Dedicated account manager", category: "Support", starter: false, pro: false, enterprise: true },
  { name: "Onboarding assistance", category: "Support", starter: false, pro: true, enterprise: true },
  { name: "Training sessions", category: "Support", starter: false, pro: false, enterprise: true },
];

// Group features by category
function groupFeaturesByCategory(features: Feature[]): Record<string, Feature[]> {
  return features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, Feature[]>);
}

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto size-5 text-success-500" />
    ) : (
      <X className="mx-auto size-5 text-gray-300" />
    );
  }
  return <span className="text-sm text-gray-700">{value}</span>;
}

export function FeatureComparisonTable() {
  const groupedFeatures = groupFeaturesByCategory(features);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-4 text-left text-sm font-semibold text-navy-800">
              Feature
            </th>
            <th className="w-[140px] py-4 text-center text-sm font-semibold text-navy-800">
              Starter
            </th>
            <th className="w-[140px] py-4 text-center text-sm font-semibold text-navy-800">
              <span className="inline-flex items-center gap-1">
                Pro
                <span className="rounded bg-gold-100 px-1.5 py-0.5 text-xs text-gold-700">
                  Popular
                </span>
              </span>
            </th>
            <th className="w-[140px] py-4 text-center text-sm font-semibold text-navy-800">
              Enterprise
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
            <>
              {/* Category Header */}
              <tr key={`category-${category}`}>
                <td
                  colSpan={4}
                  className="bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500"
                >
                  {category}
                </td>
              </tr>
              {/* Features in Category */}
              {categoryFeatures.map((feature, index) => (
                <tr
                  key={`${category}-${feature.name}`}
                  className={cn(
                    "border-b border-gray-100",
                    index === categoryFeatures.length - 1 && "border-gray-200"
                  )}
                >
                  <td className="py-3.5 text-sm text-gray-700">{feature.name}</td>
                  <td className="py-3.5 text-center">
                    <FeatureValue value={feature.starter} />
                  </td>
                  <td className="py-3.5 text-center bg-gold-50/30">
                    <FeatureValue value={feature.pro} />
                  </td>
                  <td className="py-3.5 text-center">
                    <FeatureValue value={feature.enterprise} />
                  </td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
