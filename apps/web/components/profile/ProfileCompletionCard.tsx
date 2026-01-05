"use client";

import * as React from "react";
import { CheckCircle2, ArrowRight, FileText, Settings, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProfileCompletionCardProps {
  overallProgress: number;
  onEditProfile: () => void;
  onBackToDashboard: () => void;
  // Job Preferences data
  hasJobPreferences?: boolean;
  jobPreferencesCount?: number;
  // Documents data
  documentCount?: number;
}

export function ProfileCompletionCard({
  overallProgress,
  onEditProfile,
  onBackToDashboard,
  hasJobPreferences = false,
  jobPreferencesCount = 0,
  documentCount = 0,
}: ProfileCompletionCardProps) {
  const isProfileComplete = overallProgress >= 90;

  return (
    <div className="space-y-8">
      {/* Success Message with Progress Circle */}
      <div className="text-center">
        <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-success-100">
          <CheckCircle2 className="size-12 text-success-600" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-navy-900">
          {isProfileComplete ? "Profile Complete!" : "Great Progress!"}
        </h2>
        <p className="text-gray-600">
          {isProfileComplete
            ? "Your profile is looking excellent. You're ready to start applying for positions."
            : `You've completed ${overallProgress}% of your profile. Keep going to maximize your visibility.`}
        </p>

        {/* Progress Circle */}
        <div className="mx-auto mt-6 w-fit">
          <div className="relative size-32">
            <svg className="size-32 -rotate-90 transform" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={isProfileComplete ? "#10b981" : "#d4af37"}
                strokeWidth="8"
                strokeDasharray={`${overallProgress * 2.827} 283`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-navy-900">{overallProgress}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-navy-900">Next Steps</h3>

        {/* Job Preferences Card */}
        <a
          href="/crew/preferences"
          className="block rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-gold-500 hover:shadow-md"
        >
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-gold-100">
              <Settings className="size-6 text-gold-600" />
            </div>
            <div className="flex-1">
              <h4 className="mb-1 text-base font-semibold text-navy-900">
                Set Job Preferences
              </h4>
              <p className="mb-2 text-sm text-gray-600">
                Define your ideal role, location, and salary expectations
              </p>
              <div className="flex items-center gap-2">
                {hasJobPreferences ? (
                  <>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-success-600">
                      <CheckCircle2 className="size-3" />
                      {jobPreferencesCount} preference{jobPreferencesCount !== 1 ? "s" : ""} set
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-medium text-gray-500">Not started</span>
                )}
              </div>
            </div>
            <ArrowRight className="size-5 shrink-0 text-gray-400" />
          </div>
        </a>

        {/* Documents Card */}
        <a
          href="/crew/documents"
          className="block rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-gold-500 hover:shadow-md"
        >
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-navy-100">
              <FileText className="size-6 text-navy-600" />
            </div>
            <div className="flex-1">
              <h4 className="mb-1 text-base font-semibold text-navy-900">
                Manage Documents
              </h4>
              <p className="mb-2 text-sm text-gray-600">
                Upload your CV, certificates, and other required documents
              </p>
              <div className="flex items-center gap-2">
                {documentCount > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-success-600">
                    <CheckCircle2 className="size-3" />
                    {documentCount} document{documentCount !== 1 ? "s" : ""} uploaded
                  </span>
                ) : (
                  <span className="text-xs font-medium text-gray-500">No documents yet</span>
                )}
              </div>
            </div>
            <ArrowRight className="size-5 shrink-0 text-gray-400" />
          </div>
        </a>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button variant="secondary" onClick={onEditProfile} leftIcon={<Eye className="size-4" />}>
          Edit Profile
        </Button>
        <Button onClick={onBackToDashboard} rightIcon={<ArrowRight className="size-4" />}>
          Back to Dashboard
        </Button>
      </div>

      {/* Completion Tips (if not 100%) */}
      {!isProfileComplete && (
        <div className="rounded-lg border border-gold-200 bg-gold-50 p-4">
          <h4 className="mb-2 text-sm font-semibold text-gold-900">
            Tips to Complete Your Profile
          </h4>
          <ul className="space-y-1 text-sm text-gold-800">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-gold-600">•</span>
              <span>Fill in all required fields marked with an asterisk (*)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-gold-600">•</span>
              <span>Add your certifications and licenses to stand out</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-gold-600">•</span>
              <span>Provide as much detail as possible to increase visibility</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
