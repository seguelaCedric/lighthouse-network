"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Gift, ArrowRight, Info, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ShareReferralCard,
  ReferralStats,
  ReferralList,
  PayoutRequestModal,
} from "@/components/referrals";
import { cn } from "@/lib/utils";

interface ReferralCodeData {
  code: string;
  link: string;
  qr_code_url: string;
}

interface StatsData {
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

interface ReferralData {
  id: string;
  referred_name: string;
  referred_photo: string | null;
  status: "pending" | "signed_up" | "applied" | "placed" | "expired" | "invalid";
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

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default function CrewReferralsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [codeData, setCodeData] = useState<ReferralCodeData | null>(null);
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [rewardsData, setRewardsData] = useState<RewardsData | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [codeRes, statsRes, referralsRes, rewardsRes] = await Promise.all([
        fetch("/api/referrals/code"),
        fetch("/api/referrals/stats"),
        fetch("/api/referrals"),
        fetch("/api/referrals/rewards"),
      ]);

      // Check for auth errors
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
      if (stats.stats) setStatsData(stats);
      if (referralsData.referrals) setReferrals(referralsData.referrals);
      if (rewards.totals) setRewardsData(rewards);
    } catch (err) {
      console.error("Failed to fetch referral data:", err);
      setError("Failed to load referral data. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
          <Button variant="outline" onClick={fetchData} className="mt-4">
            <RefreshCw className="mr-2 size-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const availableBalance = rewardsData?.totals.available || 0;
  const minPayout = statsData?.program?.min_payout || 5000;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-3 font-serif text-3xl font-semibold text-navy-800">
            <Gift className="size-8 text-gold-500" />
            Refer Friends, Earn Rewards
          </h1>
          <p className="mt-2 text-gray-600">
            Share your link with fellow crew members and earn rewards when they
            join and find work.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          className="hidden sm:flex"
        >
          <RefreshCw className="mr-2 size-4" />
          Refresh
        </Button>
      </div>

      {/* Share Card */}
      {codeData && (
        <ShareReferralCard
          code={codeData.code}
          link={codeData.link}
          qrCodeUrl={codeData.qr_code_url}
        />
      )}

      {/* Stats */}
      {statsData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-medium text-navy-800">
              Your Earnings
            </h2>
            {availableBalance >= minPayout && (
              <Button variant="primary" onClick={() => setShowPayoutModal(true)}>
                Request Payout
                <ArrowRight className="ml-2 size-4" />
              </Button>
            )}
          </div>

          <ReferralStats
            totalEarned={statsData.stats.total_earned}
            availableBalance={availableBalance}
            pendingRewards={statsData.stats.pending_rewards}
            totalReferrals={statsData.stats.total_referrals}
            signedUp={statsData.stats.signed_up}
            applied={statsData.stats.applied}
            placed={statsData.stats.placed}
          />
        </div>
      )}

      {/* Referrals List */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl font-medium text-navy-800">
          Your Referrals ({referrals.length})
        </h2>
        <ReferralList referrals={referrals} />
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
                You earn {formatCurrency(statsData?.program?.application_reward || 1000)}{" "}
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
                You earn {formatCurrency(statsData?.program?.placement_reward || 5000)}{" "}
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

      {/* Payout Modal */}
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
