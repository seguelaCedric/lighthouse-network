"use client";

import * as React from "react";
import { Lock, Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrivateNotesEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function PrivateNotesEditor({
  value,
  onChange,
  disabled = false,
  className,
}: PrivateNotesEditorProps) {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-navy-900">
          <Lock className="size-4 text-gray-500" />
          Private Recruiter Notes
          <span className="inline-flex items-center gap-1 rounded-full bg-navy-100 px-2 py-0.5 text-xs font-medium text-navy-700">
            <Lock className="size-3" />
            Agency Only
          </span>
        </label>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 p-3">
        <Info className="size-4 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-xs text-blue-800">
          <p className="font-medium mb-1">These notes are confidential</p>
          <ul className="space-y-0.5 text-blue-700">
            <li className="flex items-center gap-1">
              <Sparkles className="size-3" />
              Used by AI for smarter candidate matching
            </li>
            <li>Never shown to clients or candidates</li>
            <li>Only visible to your agency team</li>
          </ul>
        </div>
      </div>

      {/* Textarea */}
      <div
        className={cn(
          "relative rounded-lg border transition-colors",
          isFocused
            ? "border-gold-400 ring-2 ring-gold-400/20"
            : "border-gray-300",
          disabled && "opacity-50"
        )}
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder="Add confidential notes for your team...

Examples:
- Client prefers non-smokers (not in job listing)
- Budget flexible up to 10% for right candidate
- Previous chef had personality conflicts, need someone diplomatic
- Captain prefers European candidates
- Looking for someone who can also help with admin"
          rows={6}
          className={cn(
            "w-full rounded-lg px-3 py-2 text-sm text-navy-900 placeholder-gray-400",
            "focus:outline-none resize-none",
            "bg-white"
          )}
        />

        {/* Character count */}
        {value.length > 0 && (
          <div className="absolute bottom-2 right-3 text-xs text-gray-400">
            {value.length} characters
          </div>
        )}
      </div>

      {/* Hint */}
      <p className="text-xs text-gray-500">
        Include client preferences, personality fit requirements, budget flexibility,
        or any context that helps find the perfect match but shouldn&apos;t be public.
      </p>
    </div>
  );
}
