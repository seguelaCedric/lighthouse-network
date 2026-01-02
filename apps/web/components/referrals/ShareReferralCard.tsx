"use client";

import * as React from "react";
import { useState } from "react";
import {
  Copy,
  Check,
  MessageCircle,
  Mail,
  QrCode,
  Linkedin,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ShareReferralCardProps {
  code: string;
  link: string;
  qrCodeUrl: string;
  className?: string;
}

export function ShareReferralCard({
  code,
  link,
  qrCodeUrl,
  className,
}: ShareReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(
      `Hey! I've been using Lighthouse Crew Network for yacht crew jobs and thought you might be interested. Sign up with my link and we both benefit: ${link}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent("Join Lighthouse Crew Network");
    const body = encodeURIComponent(
      `Hey!\n\nI've been using Lighthouse Crew Network to find yacht crew positions and thought you might be interested.\n\nSign up with my referral link:\n${link}\n\nYou'll get €25 when you land your first placement, and I'll earn rewards too!\n\nLet me know if you have any questions.`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleLinkedInShare = () => {
    const url = encodeURIComponent(link);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      "_blank"
    );
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-6",
        className
      )}
    >
      <h3 className="mb-4 font-serif text-lg font-medium text-navy-800">
        Your Referral Link
      </h3>

      {/* Link Display */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex-1 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="truncate font-mono text-sm text-navy-900">{link}</p>
        </div>
        <Button
          variant={copied ? "primary" : "secondary"}
          size="sm"
          onClick={handleCopy}
          className="shrink-0"
        >
          {copied ? (
            <>
              <Check className="mr-1 size-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="mr-1 size-4" />
              Copy
            </>
          )}
        </Button>
      </div>

      {/* Referral Code Display */}
      <div className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-gold-50 p-3">
        <span className="text-sm text-gold-700">Your code:</span>
        <span className="font-mono font-bold text-gold-800">{code}</span>
      </div>

      {/* Share Buttons */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          onClick={handleWhatsAppShare}
          className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-3 transition-colors hover:border-green-300 hover:bg-green-50"
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-green-100">
            <MessageCircle className="size-5 text-green-600" />
          </div>
          <span className="text-xs font-medium text-gray-700">WhatsApp</span>
        </button>

        <button
          onClick={handleEmailShare}
          className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-3 transition-colors hover:border-blue-300 hover:bg-blue-50"
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-blue-100">
            <Mail className="size-5 text-blue-600" />
          </div>
          <span className="text-xs font-medium text-gray-700">Email</span>
        </button>

        <button
          onClick={handleLinkedInShare}
          className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-3 transition-colors hover:border-blue-400 hover:bg-blue-50"
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-blue-100">
            <Linkedin className="size-5 text-blue-700" />
          </div>
          <span className="text-xs font-medium text-gray-700">LinkedIn</span>
        </button>

        <button
          onClick={() => setShowQR(true)}
          className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-3 transition-colors hover:border-navy-300 hover:bg-navy-50"
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-navy-100">
            <QrCode className="size-5 text-navy-600" />
          </div>
          <span className="text-xs font-medium text-gray-700">QR Code</span>
        </button>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-sm rounded-xl bg-white p-6">
            <button
              onClick={() => setShowQR(false)}
              className="absolute right-4 top-4 rounded-full p-1 hover:bg-gray-100"
            >
              <X className="size-5 text-gray-500" />
            </button>

            <h4 className="mb-4 text-center font-serif text-lg font-medium text-navy-800">
              Scan to Join
            </h4>

            <div className="mb-4 flex justify-center">
              <img
                src={qrCodeUrl}
                alt="Referral QR Code"
                className="size-64 rounded-lg border border-gray-200"
              />
            </div>

            <p className="text-center text-sm text-gray-500">
              Share this QR code with friends to invite them
            </p>

            <div className="mt-4 flex justify-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowQR(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = qrCodeUrl;
                  a.download = `lighthouse-referral-${code}.png`;
                  a.click();
                }}
              >
                Download
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
