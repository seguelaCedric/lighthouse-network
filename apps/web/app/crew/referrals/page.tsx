"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
  Gift,
  ArrowRight,
  Info,
  RefreshCw,
  Loader2,
  Users,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ShareReferralCard,
  ReferralStats,
  ReferralList,
  PayoutRequestModal,
  EmployerEnquiryForm,
  EmployerEnquiryList,
  EmployerEnquiryStats,
} from "@/components/referrals";
import { cn } from "@/lib/utils";

// Types for crew referrals
interface ReferralCodeData {
  code: string;
  link: string;
  qr_code_url: string;
}

interface CrewStatsData {
  stats: {
    total_referrals: number;
    signed_up: number;
    applied: number;
    placed: number;
    pending_rewards: number;
    approved_rewards: number;
    total_earned: number;
    referral_code: string | null;
  };
  eligibility: {
    eligible: boolean;
    reason?: string;
  };
  program: {
    active: boolean;
    application_reward: number;
    placement_reward: number;
    min_payout: number;
  } | null;
}

interface CrewReferralData {
  id: string;
  referred_name: string;
  referred_photo: string | null;
  status:
    | "pending"
    | "signed_up"
    | "applied"
    | "placed"
    | "expired"
    | "invalid";
  clicked_at: string;
  signed_up_at: string | null;
  applied_at: string | null;
  placed_at: string | null;
  source: string;
  expires_at: string;
  rewards_pending: number;
  rewards_earned: number;
}

interface RewardsData {
  totals: {
    pending: number;
    approved: number;
    paid: number;
    available: number;
  };
}

// Types for employer enquiries
interface EmployerEnquiry {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  status: "submitted" | "under_review" | "verified" | "invalid" | "duplicate";
  submitted_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
}

interface EmployerStatsData {
  stats: {
    total_enquiries: number;
    submitted: number;
    under_review: number;
    verified: number;
    invalid: number;
    total_jobs_created: number;
    total_placements: number;
    pending_rewards: number;
    approved_rewards: number;
    total_earned: number;
  };
  eligibility: {
    can_submit: boolean;
    reason?: string;
    enquiries_this_month: number;
    monthly_limit: number;
  };
  program: {
    program_active: boolean;
    placement_reward: number;
    max_enquiries_per_month: number;
  };
}

type TabType = "crew" | "employers";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default function CrewReferralsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("employers");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Crew referral state
  const [codeData, setCodeData] = useState<ReferralCodeData | null>(null);
  const [crewStatsData, setCrewStatsData] = useState<CrewStatsData | null>(
    null
  );
  const [crewReferrals, setCrewReferrals] = useState<CrewReferralData[]>([]);
  const [rewardsData, setRewardsData] = useState<RewardsData | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  // Employer enquiry state
  const [employerStatsData, setEmployerStatsData] =
    useState<EmployerStatsData | null>(null);
  const [employerEnquiries, setEmployerEnquiries] = useState<EmployerEnquiry[]>(
    []
  );

  const fetchCrewData = async () => {
    try {
      const [codeRes, statsRes, referralsRes, rewardsRes] = await Promise.all([
        fetch("/api/referrals/code"),
        fetch("/api/referrals/stats"),
        fetch("/api/referrals"),
        fetch("/api/referrals/rewards"),
      ]);

      if (codeRes.status === 401 || statsRes.status === 401) {
        setError("Please log in to view your referrals");
        return;
      }

      const [code, stats, referralsData, rewards] = await Promise.all([
        codeRes.json(),
        statsRes.json(),
        referralsRes.json(),
        rewardsRes.json(),
      ]);

      if (code.code) setCodeData(code);
      if (stats.stats) setCrewStatsData(stats);
      if (referralsData.referrals) setCrewReferrals(referralsData.referrals);
      if (rewards.totals) setRewardsData(rewards);
    } catch (err) {
      console.error("Failed to fetch crew referral data:", err);
    }
  };

  const fetchEmployerData = async () => {
    try {
      const [statsRes, enquiriesRes] = await Promise.all([
        fetch("/api/referrals/employer-enquiries/stats"),
        fetch("/api/referrals/employer-enquiries"),
      ]);

      if (statsRes.status === 401) {
        setError("Please log in to view your referrals");
        return;
      }

      const [stats, enquiriesData] = await Promise.all([
        statsRes.json(),
        enquiriesRes.json(),
      ]);

      if (stats.stats) setEmployerStatsData(stats);
      if (enquiriesData.enquiries)
        setEmployerEnquiries(enquiriesData.enquiries);
    } catch (err) {
      console.error("Failed to fetch employer enquiry data:", err);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    await Promise.all([fetchCrewData(), fetchEmployerData()]);

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto size-10 animate-spin text-gold-500" />
          <p className="mt-3 text-gray-500">Loading referrals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-error-600">{error}</p>
          <Button variant="secondary" onClick={fetchData} className="mt-4">
            <RefreshCw className="mr-2 size-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const availableBalance = rewardsData?.totals.available || 0;
  const minPayout = crewStatsData?.program?.min_payout || 5000;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="flex items-center gap-3 font-serif text-3xl font-semibold text-navy-800">
            <Gift className="size-7 text-gold-500" />
            Referrals & Rewards
          </h1>
          <p className="mt-2 text-gray-600">
            Refer crew members or employers to earn rewards.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={fetchData}
          className="hidden sm:flex"
        >
          <RefreshCw className="mr-2 size-4" />
          Refresh
        </Button>
      </div>

      {/* Tabs - Crew referrals tab hidden for now, will be enabled later */}
      {/* <div className="border-b border-gray-200">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("crew")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === "crew"
                ? "border-b-2 border-gold-500 text-gold-700"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Users className="size-4" />
            Refer Crew Members
          </button>
          <button
            onClick={() => setActiveTab("employers")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === "employers"
                ? "border-b-2 border-gold-500 text-gold-700"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Building2 className="size-4" />
            Refer Employers
            <span className="rounded bg-gold-100 px-1.5 py-0.5 text-xs font-semibold text-gold-700">
              €200
            </span>
          </button>
        </div>
      </div> */}

      {/* Crew Referrals Tab */}
      {activeTab === "crew" && (
        <div className="space-y-8">
          {/* Share Card */}
          {codeData && (
            <ShareReferralCard
              code={codeData.code}
              link={codeData.link}
              qrCodeUrl={codeData.qr_code_url}
            />
          )}

          {/* Stats */}
          {crewStatsData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-medium text-navy-800">
                  Your Earnings
                </h2>
                {availableBalance >= minPayout && (
                  <Button
                    variant="primary"
                    onClick={() => setShowPayoutModal(true)}
                  >
                    Request Payout
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                )}
              </div>

              <ReferralStats
                totalEarned={crewStatsData.stats.total_earned}
                availableBalance={availableBalance}
                pendingRewards={crewStatsData.stats.pending_rewards}
                totalReferrals={crewStatsData.stats.total_referrals}
                signedUp={crewStatsData.stats.signed_up}
                applied={crewStatsData.stats.applied}
                placed={crewStatsData.stats.placed}
              />
            </div>
          )}

          {/* Referrals List */}
          <div className="space-y-4">
            <h2 className="font-serif text-xl font-medium text-navy-800">
              Your Referrals ({crewReferrals.length})
            </h2>
            <ReferralList referrals={crewReferrals} />
          </div>

          {/* How It Works */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="mb-4 flex items-center gap-2 font-serif text-lg font-medium text-navy-800">
              <Info className="size-5 text-gold-500" />
              How It Works
            </h3>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-100 text-sm font-bold text-gold-700">
                  1
                </div>
                <div>
                  <p className="font-medium text-navy-900">Share your link</p>
                  <p className="text-sm text-gray-500">
                    Send to friends via WhatsApp, email, or LinkedIn
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-100 text-sm font-bold text-gold-700">
                  2
                </div>
                <div>
                  <p className="font-medium text-navy-900">They sign up</p>
                  <p className="text-sm text-gray-500">
                    Your friend creates their profile on Lighthouse
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-100 text-sm font-bold text-gold-700">
                  3
                </div>
                <div>
                  <p className="font-medium text-navy-900">They apply</p>
                  <p className="text-sm text-gray-500">
                    You earn{" "}
                    {formatCurrency(
                      crewStatsData?.program?.application_reward || 1000
                    )}{" "}
                    when they submit their first application
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-100 text-sm font-bold text-success-700">
                  4
                </div>
                <div>
                  <p className="font-medium text-navy-900">They get placed</p>
                  <p className="text-sm text-gray-500">
                    You earn{" "}
                    {formatCurrency(
                      crewStatsData?.program?.placement_reward || 5000
                    )}{" "}
                    when they land a job!
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-gold-50 p-4">
              <p className="text-sm text-gold-800">
                <strong>Bonus:</strong> Your friend also receives{" "}
                <strong>€25</strong> as a welcome bonus when they get placed!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Employer Referrals Tab */}
      {activeTab === "employers" && (
        <div className="space-y-8">
          {/* Submit Form */}
          <EmployerEnquiryForm
            onSuccess={fetchEmployerData}
            canSubmit={employerStatsData?.eligibility?.can_submit ?? true}
            reason={employerStatsData?.eligibility?.reason}
            enquiriesThisMonth={
              employerStatsData?.eligibility?.enquiries_this_month ?? 0
            }
          />

          {/* Stats */}
          {employerStatsData && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-medium text-navy-800">
                Your Employer Referral Stats
              </h2>
              <EmployerEnquiryStats
                totalEnquiries={employerStatsData.stats.total_enquiries}
                verified={employerStatsData.stats.verified}
                totalPlacements={employerStatsData.stats.total_placements}
                pendingRewards={employerStatsData.stats.pending_rewards}
                totalEarned={employerStatsData.stats.total_earned}
                placementReward={employerStatsData.program.placement_reward}
              />
            </div>
          )}

          {/* Enquiries List */}
          <div className="space-y-4">
            <h2 className="font-serif text-xl font-medium text-navy-800">
              Your Submitted Leads ({employerEnquiries.length})
            </h2>
            <EmployerEnquiryList enquiries={employerEnquiries} />
          </div>

          {/* How It Works */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="mb-4 flex items-center gap-2 font-serif text-lg font-medium text-navy-800">
              <Info className="size-5 text-gold-500" />
              How Employer Referrals Work
            </h3>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-100 text-sm font-bold text-gold-700">
                  1
                </div>
                <div>
                  <p className="font-medium text-navy-900">Submit a lead</p>
                  <p className="text-sm text-gray-500">
                    Know a captain, yacht manager, or principal looking for
                    staff? Submit their details above.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-100 text-sm font-bold text-gold-700">
                  2
                </div>
                <div>
                  <p className="font-medium text-navy-900">We verify</p>
                  <p className="text-sm text-gray-500">
                    Our team reaches out to the employer and confirms the
                    hiring need.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-100 text-sm font-bold text-gold-700">
                  3
                </div>
                <div>
                  <p className="font-medium text-navy-900">Jobs created</p>
                  <p className="text-sm text-gray-500">
                    If genuine, we create job listings and start matching
                    candidates.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-100 text-sm font-bold text-success-700">
                  4
                </div>
                <div>
                  <p className="font-medium text-navy-900">Everyone wins</p>
                  <p className="text-sm text-gray-500">
                    You earn <strong>€200</strong> and new clients get{" "}
                    <strong>15% off</strong> their first placement!
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-gold-50 p-4">
                <p className="text-sm font-medium text-gold-800">
                  Your Reward
                </p>
                <p className="mt-1 text-2xl font-bold text-gold-700">€200</p>
                <p className="text-xs text-gold-600">
                  Per successful placement from your referral
                </p>
              </div>
              <div className="rounded-lg bg-success-50 p-4">
                <p className="text-sm font-medium text-success-800">
                  Client Benefit
                </p>
                <p className="mt-1 text-2xl font-bold text-success-700">15% Off</p>
                <p className="text-xs text-success-600">
                  New clients save on their first placement
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                <strong>No limits:</strong> Refer as many employers as you like.
                The more quality leads you submit, the more you can earn!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payout Modal (shared) */}
      <PayoutRequestModal
        isOpen={showPayoutModal}
        onClose={() => setShowPayoutModal(false)}
        availableBalance={availableBalance}
        minPayoutAmount={minPayout}
        onSuccess={fetchData}
      />
    </div>
  );
}
