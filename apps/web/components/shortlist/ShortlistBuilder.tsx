"use client";

import * as React from "react";
import Link from "next/link";
import {
  GripVertical,
  X,
  Eye,
  Send,
  Download,
  ChevronUp,
  ChevronDown,
  User,
  Mail,
  Phone,
  MessageSquare,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerificationBadge, type VerificationTier } from "@/components/ui/verification-badge";
import { AvailabilityBadge, type AvailabilityStatus } from "@/components/ui/availability-badge";
import { cn } from "@/lib/utils";

// Types
export interface ShortlistCandidate {
  id: string;
  applicationId: string;
  name: string;
  photo?: string;
  position: string;
  email?: string;
  phone?: string;
  yearsExperience?: number;
  nationality?: string;
  verificationTier: VerificationTier;
  availability: AvailabilityStatus;
  notes?: string;
  ranking?: number;
}

interface ShortlistBuilderProps {
  jobId: string;
  jobTitle: string;
  candidates: ShortlistCandidate[];
  onReorder: (candidates: ShortlistCandidate[]) => void;
  onRemove: (candidateId: string) => void;
  onUpdateNotes: (candidateId: string, notes: string) => void;
  onSubmitToClient: (candidateIds: string[]) => Promise<void>;
  onExportPDF?: (candidateIds: string[]) => void;
  isSubmitting?: boolean;
}

// Drag-and-drop item component
function DraggableCandidate({
  candidate,
  index,
  totalCount,
  onMoveUp,
  onMoveDown,
  onRemove,
  onUpdateNotes,
  onViewProfile,
  isDragging,
  dragHandleProps,
}: {
  candidate: ShortlistCandidate;
  index: number;
  totalCount: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onUpdateNotes: (notes: string) => void;
  onViewProfile: () => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [localNotes, setLocalNotes] = React.useState(candidate.notes || "");

  const initials = candidate.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "rounded-lg border bg-white transition-all",
        isDragging ? "shadow-lg border-gold-400 opacity-90" : "border-gray-200"
      )}
    >
      {/* Main Row */}
      <div className="p-4 flex items-center gap-4">
        {/* Drag Handle */}
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="size-5" />
        </div>

        {/* Ranking */}
        <div className="flex flex-col items-center gap-0.5">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronUp className="size-4 text-gray-500" />
          </button>
          <span className="flex size-7 items-center justify-center rounded-full bg-navy-100 text-sm font-semibold text-navy-700">
            {index + 1}
          </span>
          <button
            onClick={onMoveDown}
            disabled={index === totalCount - 1}
            className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronDown className="size-4 text-gray-500" />
          </button>
        </div>

        {/* Photo */}
        <div className="relative shrink-0">
          {candidate.photo ? (
            <img
              src={candidate.photo}
              alt={candidate.name}
              className="size-12 rounded-full object-cover ring-2 ring-gray-100"
            />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-navy-100 to-navy-200 text-sm font-semibold text-navy-600 ring-2 ring-gray-100">
              {initials}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1">
            <VerificationBadge tier={candidate.verificationTier} size="sm" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-navy-900 truncate">{candidate.name}</h4>
            <AvailabilityBadge status={candidate.availability} size="sm" />
          </div>
          <p className="text-sm text-gray-600">{candidate.position}</p>
          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
            {candidate.nationality && <span>{candidate.nationality}</span>}
            {candidate.yearsExperience && (
              <span>{candidate.yearsExperience} years exp</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            title={isExpanded ? "Collapse" : "Add notes"}
          >
            <MessageSquare className="size-4" />
          </button>
          <button
            onClick={onViewProfile}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            title="View profile"
          >
            <Eye className="size-4" />
          </button>
          <button
            onClick={onRemove}
            className="p-2 rounded-lg hover:bg-error-50 text-gray-400 hover:text-error-600"
            title="Remove from shortlist"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Expanded Notes Section */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes for client
          </label>
          <textarea
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            onBlur={() => onUpdateNotes(localNotes)}
            placeholder="Add notes about this candidate for the client..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
          />
          {/* Quick contact info */}
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {candidate.email && (
              <a
                href={`mailto:${candidate.email}`}
                className="inline-flex items-center gap-1 text-navy-600 hover:text-navy-800"
              >
                <Mail className="size-3.5" />
                {candidate.email}
              </a>
            )}
            {candidate.phone && (
              <a
                href={`tel:${candidate.phone}`}
                className="inline-flex items-center gap-1 text-navy-600 hover:text-navy-800"
              >
                <Phone className="size-3.5" />
                {candidate.phone}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Main Component
export function ShortlistBuilder({
  jobId,
  jobTitle,
  candidates,
  onReorder,
  onRemove,
  onUpdateNotes,
  onSubmitToClient,
  onExportPDF,
  isSubmitting = false,
}: ShortlistBuilderProps) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    new Set(candidates.map((c) => c.id))
  );
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);

  // Handle move up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newCandidates = [...candidates];
    [newCandidates[index - 1], newCandidates[index]] = [
      newCandidates[index],
      newCandidates[index - 1],
    ];
    onReorder(newCandidates);
  };

  // Handle move down
  const handleMoveDown = (index: number) => {
    if (index === candidates.length - 1) return;
    const newCandidates = [...candidates];
    [newCandidates[index], newCandidates[index + 1]] = [
      newCandidates[index + 1],
      newCandidates[index],
    ];
    onReorder(newCandidates);
  };

  // Handle drag start
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newCandidates = [...candidates];
    const draggedItem = newCandidates[draggedIndex];
    newCandidates.splice(draggedIndex, 1);
    newCandidates.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    onReorder(newCandidates);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Handle selection toggle
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedIds.size === candidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(candidates.map((c) => c.id)));
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    const orderedSelectedIds = candidates
      .filter((c) => selectedIds.has(c.id))
      .map((c) => c.id);
    await onSubmitToClient(orderedSelectedIds);
  };

  // Handle export
  const handleExport = () => {
    if (onExportPDF) {
      const orderedSelectedIds = candidates
        .filter((c) => selectedIds.has(c.id))
        .map((c) => c.id);
      onExportPDF(orderedSelectedIds);
    }
  };

  if (candidates.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
        <User className="mx-auto size-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-navy-900 mb-2">
          No candidates in shortlist
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Run AI matching or search for candidates to add to the shortlist
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href={`/jobs/match?jobId=${jobId}`}>
            <Button variant="primary">Run AI Match</Button>
          </Link>
          <Link href="/candidates/search">
            <Button variant="secondary">Search Candidates</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy-900">
            Shortlist for {jobTitle}
          </h2>
          <p className="text-sm text-gray-600">
            {candidates.length} candidate{candidates.length !== 1 && "s"} •{" "}
            {selectedIds.size} selected
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
          >
            {selectedIds.size === candidates.length ? "Deselect All" : "Select All"}
          </Button>
        </div>
      </div>

      {/* Candidate List */}
      <div className="space-y-2">
        {candidates.map((candidate, index) => (
          <div
            key={candidate.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
          >
            <div className="flex items-center gap-2">
              {/* Selection checkbox */}
              <button
                onClick={() => toggleSelection(candidate.id)}
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
                  selectedIds.has(candidate.id)
                    ? "border-gold-500 bg-gold-500 text-white"
                    : "border-gray-300 bg-white hover:border-gray-400"
                )}
              >
                {selectedIds.has(candidate.id) && (
                  <CheckCircle2 className="size-3" />
                )}
              </button>

              {/* Candidate card */}
              <div className="flex-1">
                <DraggableCandidate
                  candidate={candidate}
                  index={index}
                  totalCount={candidates.length}
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
                  onRemove={() => onRemove(candidate.id)}
                  onUpdateNotes={(notes) => onUpdateNotes(candidate.id, notes)}
                  onViewProfile={() => window.open(`/candidates/${candidate.id}`, "_blank")}
                  isDragging={draggedIndex === index}
                  dragHandleProps={{
                    onMouseDown: (e) => e.stopPropagation(),
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {selectedIds.size > 0 ? (
            <span>
              {selectedIds.size} candidate{selectedIds.size !== 1 && "s"} ready to send
            </span>
          ) : (
            <span className="text-warning-600 flex items-center gap-1">
              <AlertTriangle className="size-4" />
              Select candidates to submit
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onExportPDF && (
            <Button
              variant="ghost"
              onClick={handleExport}
              disabled={selectedIds.size === 0}
              leftIcon={<Download className="size-4" />}
            >
              Export PDF
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={selectedIds.size === 0 || isSubmitting}
            leftIcon={
              isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )
            }
          >
            {isSubmitting ? "Sending..." : "Submit to Client"}
          </Button>
        </div>
      </div>
    </div>
  );
}
