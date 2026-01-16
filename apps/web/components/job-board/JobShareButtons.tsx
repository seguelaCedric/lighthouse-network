"use client";

import * as React from "react";
import { useState } from "react";
import { Share2, Bookmark, Check, Copy } from "lucide-react";
import { toast } from "sonner";

interface JobShareButtonsProps {
  jobId: string;
  jobTitle: string;
}

export function JobShareButtons({ jobId, jobTitle }: JobShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const jobUrl = `${window.location.origin}/job-board/${jobId}`;
    const shareText = `Check out this job: ${jobTitle}`;

    // Use Web Share API if available (mobile devices)
    if (navigator.share) {
      try {
        await navigator.share({
          title: jobTitle,
          text: shareText,
          url: jobUrl,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fall back to clipboard
        if ((err as Error).name === "AbortError") {
          return; // User cancelled, do nothing
        }
      }
    }

    // Fall back to copying link to clipboard
    try {
      await navigator.clipboard.writeText(jobUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleSave = () => {
    toast.info("Sign in to save jobs to your profile");
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleSave}
        className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <Bookmark className="h-4 w-4" />
        Save
      </button>
      <button
        onClick={handleShare}
        className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-500" />
            Copied!
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" />
            Share
          </>
        )}
      </button>
    </div>
  );
}
