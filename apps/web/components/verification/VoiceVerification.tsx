"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Phone,
  CheckCircle2,
  Clock,
  Mic,
  PhoneCall,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type VoiceStatus = "not_started" | "in_progress" | "completed" | "failed";

export interface VoiceVerificationProps {
  candidateId: string;
  status: VoiceStatus;
  verificationId?: string | null;
  onStartCall?: () => void;
  className?: string;
}

const STATUS_CONFIG: Record<
  VoiceStatus,
  {
    label: string;
    description: string;
    icon: React.ElementType;
    className: string;
    bgClassName: string;
  }
> = {
  not_started: {
    label: "Not Started",
    description: "Complete a brief voice verification call to unlock Premium status",
    icon: Mic,
    className: "text-gray-600",
    bgClassName: "bg-gray-50 border-gray-200",
  },
  in_progress: {
    label: "In Progress",
    description: "Voice verification call in progress...",
    icon: PhoneCall,
    className: "text-gold-600",
    bgClassName: "bg-gold-50 border-gold-200",
  },
  completed: {
    label: "Completed",
    description: "Your voice has been verified successfully",
    icon: CheckCircle2,
    className: "text-success-600",
    bgClassName: "bg-success-50 border-success-200",
  },
  failed: {
    label: "Failed",
    description: "Voice verification was not successful. Please try again.",
    icon: XCircle,
    className: "text-error-600",
    bgClassName: "bg-error-50 border-error-200",
  },
};

export function VoiceVerification({
  candidateId,
  status,
  verificationId,
  onStartCall,
  className,
}: VoiceVerificationProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;
  const canStart = status === "not_started" || status === "failed";

  const handleStartCall = async () => {
    setIsStarting(true);
    setError(null);

    try {
      const response = await fetch(`/api/candidates/${candidateId}/voice-verification`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to start voice verification");
      }

      const data = await response.json();

      // If we get a phone URL, open it (for Vapi web calls)
      if (data.data?.webCallUrl) {
        window.open(data.data.webCallUrl, "_blank");
      }

      onStartCall?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start call");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white shadow-sm", className)} id="voice">
      <div className="border-b border-gray-100 px-6 py-4">
        <h3 className="font-serif text-lg font-semibold text-navy-800">
          Voice Verification
        </h3>
        <p className="mt-0.5 text-sm text-gray-500">
          Complete a brief call to verify your identity
        </p>
      </div>

      <div className="p-6">
        {/* Status Banner */}
        <div
          className={cn(
            "mb-6 flex items-start gap-3 rounded-lg border p-4",
            config.bgClassName
          )}
        >
          <StatusIcon className={cn("mt-0.5 size-5", config.className)} />
          <div>
            <p className={cn("font-medium", config.className)}>{config.label}</p>
            <p className="mt-0.5 text-sm text-gray-600">{config.description}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-error-50 p-3 text-sm text-error-700">
            <AlertTriangle className="size-4" />
            {error}
          </div>
        )}

        {/* Call to Action */}
        {canStart && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gradient-to-br from-gold-50 to-gold-100/50 p-6 text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gold-200">
                <Phone className="size-8 text-gold-700" />
              </div>
              <h4 className="mb-2 font-semibold text-gold-900">
                Ready to verify your voice?
              </h4>
              <p className="mb-4 text-sm text-gold-800">
                This quick call takes about 2 minutes. We'll verify your identity
                and answer any questions you have.
              </p>
              <Button
                onClick={handleStartCall}
                disabled={isStarting}
                className="bg-gold-600 hover:bg-gold-700"
              >
                <PhoneCall className="mr-2 size-4" />
                {isStarting ? "Starting Call..." : "Start Voice Verification"}
              </Button>
            </div>

            <div className="rounded-lg bg-navy-50 p-4">
              <h4 className="mb-2 text-sm font-semibold text-navy-800">What to expect:</h4>
              <ul className="space-y-1 text-sm text-navy-700">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 size-1 rounded-full bg-navy-400" />
                  Brief automated call (2-3 minutes)
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 size-1 rounded-full bg-navy-400" />
                  Simple verification questions
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 size-1 rounded-full bg-navy-400" />
                  Confirms details from your profile
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 size-1 rounded-full bg-navy-400" />
                  Available 24/7
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Completed state */}
        {status === "completed" && (
          <div className="rounded-lg bg-success-50 p-6 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-success-200">
              <CheckCircle2 className="size-8 text-success-700" />
            </div>
            <h4 className="mb-2 font-semibold text-success-900">
              Voice Verification Complete!
            </h4>
            <p className="text-sm text-success-800">
              Congratulations! You've completed all verification steps and achieved Premium status.
            </p>
          </div>
        )}

        {/* In progress state */}
        {status === "in_progress" && (
          <div className="rounded-lg bg-gold-50 p-6 text-center">
            <div className="mx-auto mb-4 flex size-16 animate-pulse items-center justify-center rounded-full bg-gold-200">
              <PhoneCall className="size-8 text-gold-700" />
            </div>
            <h4 className="mb-2 font-semibold text-gold-900">
              Verification in Progress
            </h4>
            <p className="text-sm text-gold-800">
              Please complete the call. This page will update automatically once done.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
