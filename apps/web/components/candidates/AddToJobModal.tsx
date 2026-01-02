"use client";

import * as React from "react";
import { Search, Briefcase, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useJobs, useAddCandidateToJob } from "@/hooks/useJobs";
import { cn } from "@/lib/utils";
import type { Job } from "@lighthouse/database";

interface AddToJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  candidateName: string;
}

export function AddToJobModal({
  open,
  onOpenChange,
  candidateId,
  candidateName,
}: AddToJobModalProps) {
  const [search, setSearch] = React.useState("");
  const [selectedJobId, setSelectedJobId] = React.useState<string | null>(null);

  const { data: jobsData, isLoading: isLoadingJobs } = useJobs({
    search: search || undefined,
    status: "open",
    limit: 20,
  });

  const addToJob = useAddCandidateToJob();

  const handleSubmit = async () => {
    if (!selectedJobId) return;

    try {
      await addToJob.mutateAsync({
        jobId: selectedJobId,
        candidateId,
      });
      toast.success(`${candidateName} added to job`);
      onOpenChange(false);
      setSelectedJobId(null);
      setSearch("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add candidate to job"
      );
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedJobId(null);
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Job</DialogTitle>
          <DialogDescription>
            Select a job to add {candidateName} to the candidate pipeline.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs..."
              className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>

          {/* Job List */}
          <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
            {isLoadingJobs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-gray-400" />
              </div>
            ) : jobsData?.data && jobsData.data.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {jobsData.data.map((job: Job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => setSelectedJobId(job.id)}
                    className={cn(
                      "flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-gray-50",
                      selectedJobId === job.id && "bg-gold-50"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                        selectedJobId === job.id
                          ? "bg-gold-500 text-white"
                          : "bg-gray-100 text-gray-500"
                      )}
                    >
                      <Briefcase className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-navy-900">
                        {job.title}
                      </p>
                      <p className="truncate text-sm text-gray-500">
                        {job.vessel_name || "No vessel"} &middot;{" "}
                        {job.primary_region || "Location TBD"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-gray-500">
                {search ? "No jobs found matching your search" : "No open jobs"}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!selectedJobId || addToJob.isPending}
          >
            {addToJob.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add to Job"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
