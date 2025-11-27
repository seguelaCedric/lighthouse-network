"use client";

import { useState } from "react";
import {
  MobileHeader,
  BottomTabBar,
  FloatingActionButton,
} from "@/components/layout/MobileNavigation";
import {
  SwipeableCard,
  MobileCandidateCard,
  CollapsibleStatCard,
} from "@/components/ui/SwipeableCard";
import { cn } from "@/lib/utils";
import {
  Users,
  Briefcase,
  TrendingUp,
  Clock,
  Plus,
  ChevronRight,
  Star,
  MapPin,
  Calendar,
  ArrowRight,
} from "lucide-react";

// Mock data
const mockCandidates = [
  {
    id: "1",
    name: "Sarah Mitchell",
    photo: null,
    position: "Chief Stewardess",
    experience: "8 years",
    location: "Monaco",
    matchPercentage: 96,
    isVerified: true,
    summary: "Experienced Chief Stewardess with extensive background in 50m+ motor yachts. Known for exceptional service standards and team leadership.",
    skills: ["Silver Service", "Wine Expert", "Team Management", "Event Planning"],
  },
  {
    id: "2",
    name: "Maria Costa",
    photo: null,
    position: "2nd Stewardess",
    experience: "5 years",
    location: "Barcelona",
    matchPercentage: 89,
    isVerified: true,
    summary: "Detail-oriented professional with strong charter experience and excellent guest relations skills.",
    skills: ["Housekeeping", "Laundry", "Guest Service", "STCW"],
  },
  {
    id: "3",
    name: "Elena Rodriguez",
    photo: null,
    position: "Chief Stewardess",
    experience: "10 years",
    location: "Antibes",
    matchPercentage: 94,
    isVerified: false,
    summary: "Seasoned interior professional with Michelin-star restaurant background and expertise in fine dining service.",
    skills: ["Fine Dining", "Crew Training", "Inventory Management", "French Fluent"],
  },
];

const mockJobs = [
  {
    id: "1",
    title: "Chief Stewardess",
    yacht: "M/Y Serenity",
    location: "Monaco",
    salary: "€6,500 - €7,500",
    matchPercentage: 94,
    isNew: true,
  },
  {
    id: "2",
    title: "2nd Stewardess",
    yacht: "S/Y Aurora",
    location: "Palma",
    salary: "€4,000 - €4,500",
    matchPercentage: 87,
    isNew: false,
  },
  {
    id: "3",
    title: "Head Chef",
    yacht: "M/Y Eclipse",
    location: "Antibes",
    salary: "€7,000 - €8,500",
    matchPercentage: 82,
    isNew: true,
  },
];

export default function MobileDemoPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "candidates" | "jobs">("dashboard");
  const [candidates, setCandidates] = useState(mockCandidates);

  const handleShortlist = (id: string) => {
    console.log("Shortlisted:", id);
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  };

  const handleReject = (id: string) => {
    console.log("Rejected:", id);
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <MobileHeader />

      {/* Demo Tabs - to switch between views */}
      <div className="sticky top-14 z-30 border-b border-gray-200 bg-white sm:top-0">
        <div className="flex">
          {[
            { id: "dashboard" as const, label: "Dashboard" },
            { id: "candidates" as const, label: "Candidates" },
            { id: "jobs" as const, label: "Jobs" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-b-2 border-gold-500 text-gold-600"
                  : "text-gray-500"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="px-4 py-4">
        {/* Dashboard View */}
        {activeTab === "dashboard" && (
          <div className="space-y-4">
            {/* Welcome */}
            <div className="rounded-xl bg-gradient-to-r from-navy-800 to-navy-900 p-4 text-white">
              <p className="text-sm text-gray-300">Good morning,</p>
              <h1 className="mb-2 text-4xl font-serif font-semibold text-navy-800">Emma Richardson</h1>
              <p className="text-sm text-gray-300">
                You have <span className="font-semibold text-gold-400">5 new matches</span> today
              </p>
            </div>

            {/* Collapsible Stats */}
            <div className="space-y-3">
              <CollapsibleStatCard
                title="Active Candidates"
                value={342}
                icon={Users}
                trend={{ value: 12, isPositive: true }}
                details={[
                  { label: "Available Now", value: 89 },
                  { label: "In Interview", value: 23 },
                  { label: "Placed This Month", value: 8 },
                ]}
                color="bg-navy-100 text-navy-600"
              />

              <CollapsibleStatCard
                title="Open Positions"
                value={24}
                icon={Briefcase}
                trend={{ value: 3, isPositive: true }}
                details={[
                  { label: "Interior", value: 12 },
                  { label: "Deck", value: 8 },
                  { label: "Engineering", value: 4 },
                ]}
                color="bg-gold-100 text-gold-600"
              />

              <CollapsibleStatCard
                title="Placements YTD"
                value={67}
                icon={TrendingUp}
                trend={{ value: 8, isPositive: true }}
                color="bg-success-100 text-success-600"
              />

              <CollapsibleStatCard
                title="Avg. Time to Fill"
                value="12 days"
                icon={Clock}
                trend={{ value: -2, isPositive: true }}
                color="bg-purple-100 text-purple-600"
              />
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="mb-3 font-semibold text-navy-900">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center gap-2 rounded-lg bg-gold-50 p-3 text-left">
                  <Plus className="size-5 text-gold-600" />
                  <span className="text-sm font-medium text-gold-700">Add Candidate</span>
                </button>
                <button className="flex items-center gap-2 rounded-lg bg-navy-50 p-3 text-left">
                  <Briefcase className="size-5 text-navy-600" />
                  <span className="text-sm font-medium text-navy-700">Post Job</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-100 p-4">
                <h2 className="font-semibold text-navy-900">Recent Activity</h2>
                <button className="text-sm font-medium text-gold-600">View All</button>
              </div>
              <div className="divide-y divide-gray-100">
                {[
                  { text: "Sarah M. applied for Chief Stew", time: "2 min ago" },
                  { text: "Interview scheduled with Maria C.", time: "1 hour ago" },
                  { text: "New job posted: Head Chef", time: "3 hours ago" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4">
                    <p className="text-sm text-gray-700">{item.text}</p>
                    <span className="text-xs text-gray-400">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Candidates View with Swipeable Cards */}
        {activeTab === "candidates" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gold-50 p-3 text-center">
              <p className="text-sm text-gold-700">
                <span className="font-semibold">{candidates.length} candidates</span> to review.
                Swipe right to shortlist, left to reject.
              </p>
            </div>

            {candidates.length > 0 ? (
              <div className="space-y-4">
                {candidates.map((candidate) => (
                  <MobileCandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onShortlist={() => handleShortlist(candidate.id)}
                    onReject={() => handleReject(candidate.id)}
                    onViewProfile={() => console.log("View profile:", candidate.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
                <Users className="mx-auto mb-3 size-10 text-gray-300" />
                <h3 className="mb-1 font-semibold text-navy-900">All caught up!</h3>
                <p className="text-sm text-gray-500">You've reviewed all candidates</p>
              </div>
            )}
          </div>
        )}

        {/* Jobs View */}
        {activeTab === "jobs" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-navy-50 p-3 text-center">
              <p className="text-sm text-navy-700">
                <span className="font-semibold">{mockJobs.length} jobs</span> matching your profile
              </p>
            </div>

            {mockJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-xl border border-gray-200 bg-white p-4 transition-colors active:bg-gray-50"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="font-semibold text-navy-900">{job.title}</h3>
                      {job.isNew && (
                        <span className="rounded-full bg-gold-100 px-2 py-0.5 text-xs font-bold text-gold-700">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{job.yacht}</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-success-100 px-2 py-0.5">
                    <Star className="size-3 fill-success-600 text-success-600" />
                    <span className="text-xs font-bold text-success-700">{job.matchPercentage}%</span>
                  </div>
                </div>

                <div className="mb-3 flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    ASAP
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="font-semibold text-navy-900">{job.salary}</p>
                  <button className="flex items-center gap-1 text-sm font-medium text-gold-600">
                    View Details
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton
        icon={Plus}
        label="Add New"
        onClick={() => console.log("FAB clicked")}
      />

      {/* Bottom Tab Bar */}
      <BottomTabBar />
    </div>
  );
}
