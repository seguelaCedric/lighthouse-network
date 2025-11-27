"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Phone,
  X,
  User,
  Clock,
  MessageSquare,
  FileText,
  Check,
} from "lucide-react";

interface PhoneNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType?: "candidate" | "client";
  entityId?: string;
  entityName?: string;
  onSave?: (note: PhoneNoteData) => Promise<void>;
}

export interface PhoneNoteData {
  entityType: "candidate" | "client" | "general";
  entityId?: string;
  entityName?: string;
  callType: "incoming" | "outgoing" | "missed";
  duration?: number;
  summary: string;
  nextAction?: string;
  followUpDate?: string;
  isBrief?: boolean;
  briefContent?: string;
}

const QUICK_NOTES = [
  "Discussed availability",
  "Scheduled interview",
  "Updated contact info",
  "Left voicemail",
  "Confirmed for position",
  "Not interested",
  "Call back requested",
];

export function PhoneNoteModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName,
  onSave,
}: PhoneNoteModalProps) {
  const [callType, setCallType] = useState<"incoming" | "outgoing" | "missed">(
    "outgoing"
  );
  const [minutes, setMinutes] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [summary, setSummary] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [isBrief, setIsBrief] = useState(false);
  const [briefContent, setBriefContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const summaryRef = useRef<HTMLTextAreaElement>(null);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Format timer display
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Auto-focus summary field when modal opens
  useEffect(() => {
    if (isOpen && summaryRef.current) {
      setTimeout(() => summaryRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCallType("outgoing");
      setMinutes(0);
      setSeconds(0);
      setSummary("");
      setNextAction("");
      setFollowUpDate("");
      setIsBrief(false);
      setBriefContent("");
      setTimerRunning(false);
      setTimerSeconds(0);
      setShowTimer(false);
    }
  }, [isOpen]);

  const handleQuickNote = (note: string) => {
    setSummary((prev) => (prev ? `${prev}. ${note}` : note));
  };

  const handleSave = async () => {
    if (!summary.trim()) return;

    setIsSaving(true);
    try {
      const noteData: PhoneNoteData = {
        entityType: entityType || "general",
        entityId,
        entityName,
        callType,
        duration: timerSeconds || minutes * 60 + seconds || undefined,
        summary: summary.trim(),
        nextAction: nextAction.trim() || undefined,
        followUpDate: followUpDate || undefined,
        isBrief,
        briefContent: isBrief ? briefContent.trim() : undefined,
      };

      if (onSave) {
        await onSave(noteData);
      }

      onClose();
    } catch (error) {
      console.error("Failed to save phone note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Ctrl/Cmd + Enter to save
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }

      // Escape to close
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, summary]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-gold-200/20 bg-navy-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-gold-500/10">
              <Phone className="size-5 text-gold-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Log Phone Call
              </h2>
              {entityName && (
                <p className="text-sm text-slate-400">with {entityName}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Call Type Selection */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Call Type
          </label>
          <div className="flex gap-2">
            {(["outgoing", "incoming", "missed"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setCallType(type)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  callType === type
                    ? "bg-gold-500 text-navy-900"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            <Clock className="mr-1 inline size-4" />
            Duration
          </label>
          <div className="flex items-center gap-2">
            {showTimer ? (
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl text-white">
                  {formatTimer(timerSeconds)}
                </span>
                <Button
                  size="sm"
                  variant={timerRunning ? "outline" : "primary"}
                  onClick={() => setTimerRunning(!timerRunning)}
                >
                  {timerRunning ? "Stop" : "Start"}
                </Button>
              </div>
            ) : (
              <>
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={minutes}
                  onChange={(e) =>
                    setMinutes(Math.max(0, parseInt(e.target.value) || 0))
                  }
                  className="w-16 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-white focus:border-gold-500 focus:outline-none"
                  placeholder="0"
                />
                <span className="text-slate-400">min</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={(e) =>
                    setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))
                  }
                  className="w-16 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-white focus:border-gold-500 focus:outline-none"
                  placeholder="0"
                />
                <span className="text-slate-400">sec</span>
                <button
                  onClick={() => setShowTimer(true)}
                  className="ml-2 text-xs text-gold-500 hover:text-gold-400"
                >
                  Use timer
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Notes */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Quick Notes
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_NOTES.map((note) => (
              <button
                key={note}
                onClick={() => handleQuickNote(note)}
                className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                {note}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            <MessageSquare className="mr-1 inline size-4" />
            Call Summary *
          </label>
          <textarea
            ref={summaryRef}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-slate-500 focus:border-gold-500 focus:outline-none"
            placeholder="What was discussed..."
          />
        </div>

        {/* Brief Toggle */}
        <div className="mb-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={isBrief}
              onChange={(e) => setIsBrief(e.target.checked)}
              className="size-4 rounded border-white/20 bg-white/5 text-gold-500 focus:ring-gold-500/20"
            />
            <span className="text-sm text-slate-300">
              <FileText className="mr-1 inline size-4" />
              This call contains a new job brief
            </span>
          </label>
        </div>

        {/* Brief Content (conditional) */}
        {isBrief && (
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Brief Details
            </label>
            <textarea
              value={briefContent}
              onChange={(e) => setBriefContent(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border border-gold-500/30 bg-gold-500/5 px-3 py-2 text-white placeholder:text-slate-500 focus:border-gold-500 focus:outline-none"
              placeholder="Paste or type the job requirements..."
            />
            <p className="mt-1 text-xs text-gold-500">
              A new brief will be created from this content
            </p>
          </div>
        )}

        {/* Next Action */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Next Action
          </label>
          <input
            type="text"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-slate-500 focus:border-gold-500 focus:outline-none"
            placeholder="e.g., Send CV, Schedule interview..."
          />
        </div>

        {/* Follow-up Date */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Follow-up Date
          </label>
          <input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-gold-500 focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!summary.trim() || isSaving}
            leftIcon={<Check className="size-4" />}
          >
            {isSaving ? "Saving..." : "Save Note"}
          </Button>
        </div>

        {/* Keyboard shortcut hint */}
        <div className="mt-3 text-center">
          <span className="text-xs text-slate-500">
            Press{" "}
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">
              Ctrl
            </kbd>{" "}
            +{" "}
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">
              Enter
            </kbd>{" "}
            to save
          </span>
        </div>
      </div>
    </div>
  );
}

// Hook for using the phone note modal
export function usePhoneNoteModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [entityData, setEntityData] = useState<{
    entityType?: "candidate" | "client";
    entityId?: string;
    entityName?: string;
  }>({});

  const openPhoneNote = (data?: {
    entityType?: "candidate" | "client";
    entityId?: string;
    entityName?: string;
  }) => {
    setEntityData(data || {});
    setIsOpen(true);
  };

  const closePhoneNote = () => {
    setIsOpen(false);
    setEntityData({});
  };

  return {
    isOpen,
    entityData,
    openPhoneNote,
    closePhoneNote,
  };
}
