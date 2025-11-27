import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Shield,
  CheckCircle2,
  Circle,
  Upload,
  Mail,
  FileText,
  User,
  Users,
  Mic,
  ChevronRight,
  AlertCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Verification | Lighthouse Crew Network",
  description: "Verify your identity and build trust with employers",
};

type VerificationTier = "unverified" | "basic" | "verified" | "premium";

interface VerificationCheck {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  pending?: boolean;
  icon: React.ReactNode;
  action?: {
    label: string;
    href: string;
  };
}

async function getVerificationData(candidateId: string) {
  const supabase = await createClient();

  const { data: candidate } = await supabase
    .from("candidates")
    .select(`
      id,
      email_verified_at,
      id_verified_at,
      id_document_url,
      voice_verified_at,
      cv_url,
      verification_tier
    `)
    .eq("id", candidateId)
    .single();

  if (!candidate) return null;

  // Get documents count
  const { count: documentsCount } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("entity_type", "candidate")
    .eq("entity_id", candidateId)
    .is("deleted_at", null);

  // Get verified references count
  const { data: references } = await supabase
    .from("candidate_references")
    .select("id, status, is_verified")
    .eq("candidate_id", candidateId);

  const verifiedRefsCount = (references || []).filter(
    (r) => r.status === "verified" || r.is_verified === true
  ).length;

  return {
    candidate,
    documentsCount: documentsCount || 0,
    referencesCount: references?.length || 0,
    verifiedRefsCount,
  };
}

function calculateTier(checks: {
  emailVerified: boolean;
  cvUploaded: boolean;
  idVerified: boolean;
  voiceVerified: boolean;
  referencesVerified: number;
}): VerificationTier {
  const { emailVerified, cvUploaded, idVerified, voiceVerified, referencesVerified } = checks;

  if (voiceVerified && idVerified && referencesVerified >= 2) {
    return "premium";
  }
  if (idVerified && cvUploaded) {
    return "verified";
  }
  if (emailVerified && cvUploaded) {
    return "basic";
  }
  return "unverified";
}

const TIER_CONFIG: Record<
  VerificationTier,
  { label: string; color: string; bgColor: string; description: string }
> = {
  unverified: {
    label: "Unverified",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    description: "Complete verification steps to build trust with employers",
  },
  basic: {
    label: "Basic",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    description: "Email verified and CV uploaded",
  },
  verified: {
    label: "Verified",
    color: "text-gold-700",
    bgColor: "bg-gold-100",
    description: "Identity verified - trusted by employers",
  },
  premium: {
    label: "Premium",
    color: "text-success-700",
    bgColor: "bg-success-100",
    description: "Fully verified with references - top tier candidate",
  },
};

export default async function CrewVerificationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/crew/verification");
  }

  // Get user record
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!userData) {
    redirect("/auth/login?redirect=/crew/verification");
  }

  // Get candidate profile
  const { data: candidateBasic } = await supabase
    .from("candidates")
    .select("id")
    .eq("user_id", userData.id)
    .single();

  if (!candidateBasic) {
    redirect("/crew/register");
  }

  const data = await getVerificationData(candidateBasic.id);
  if (!data) {
    redirect("/crew/register");
  }

  const { candidate, documentsCount, referencesCount, verifiedRefsCount } = data;

  const emailVerified = !!candidate.email_verified_at;
  const cvUploaded = !!candidate.cv_url || documentsCount > 0;
  const idVerified = !!candidate.id_verified_at;
  const idPending = !!candidate.id_document_url && !candidate.id_verified_at;
  const voiceVerified = !!candidate.voice_verified_at;

  const currentTier = calculateTier({
    emailVerified,
    cvUploaded,
    idVerified,
    voiceVerified,
    referencesVerified: verifiedRefsCount,
  });

  const tierConfig = TIER_CONFIG[currentTier];

  const verificationChecks: VerificationCheck[] = [
    {
      id: "email",
      label: "Email Verified",
      description: "Confirm your email address",
      completed: emailVerified,
      icon: <Mail className="size-5" />,
      action: !emailVerified
        ? { label: "Verify Email", href: "/crew/profile/edit" }
        : undefined,
    },
    {
      id: "cv",
      label: "CV Uploaded",
      description: "Upload your latest CV or resume",
      completed: cvUploaded,
      icon: <FileText className="size-5" />,
      action: !cvUploaded
        ? { label: "Upload CV", href: "/crew/profile/edit" }
        : undefined,
    },
    {
      id: "id",
      label: "ID Verified",
      description: "Verify your identity with a government ID",
      completed: idVerified,
      pending: idPending,
      icon: <User className="size-5" />,
      action: !idVerified && !idPending
        ? { label: "Verify ID", href: "/crew/profile/edit" }
        : undefined,
    },
    {
      id: "voice",
      label: "Voice Verified",
      description: "Complete a short voice verification call",
      completed: voiceVerified,
      icon: <Mic className="size-5" />,
      action: !voiceVerified
        ? { label: "Schedule Call", href: "/crew/verification/voice" }
        : undefined,
    },
    {
      id: "references",
      label: "References Verified",
      description: `${verifiedRefsCount} of ${Math.max(referencesCount, 2)} references verified`,
      completed: verifiedRefsCount >= 2,
      icon: <Users className="size-5" />,
      action: verifiedRefsCount < 2
        ? { label: "Add References", href: "/crew/profile/edit#references" }
        : undefined,
    },
  ];

  const completedCount = verificationChecks.filter((c) => c.completed).length;
  const progress = Math.round((completedCount / verificationChecks.length) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-navy-800">
          Verification Status
        </h1>
        <p className="mt-1 text-gray-600">
          Build trust with employers by verifying your profile
        </p>
      </div>

      {/* Current Tier Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex size-16 items-center justify-center rounded-full",
                tierConfig.bgColor
              )}
            >
              <Shield className={cn("size-8", tierConfig.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-navy-800">
                  {tierConfig.label} Status
                </h2>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    tierConfig.bgColor,
                    tierConfig.color
                  )}
                >
                  {currentTier.toUpperCase()}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{tierConfig.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-navy-800">{progress}%</p>
            <p className="text-sm text-gray-500">Complete</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                currentTier === "premium"
                  ? "bg-success-500"
                  : currentTier === "verified"
                  ? "bg-gold-500"
                  : currentTier === "basic"
                  ? "bg-blue-500"
                  : "bg-gray-400"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Verification Checklist */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-serif text-lg font-semibold text-navy-800">
            Verification Checklist
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {verificationChecks.map((check) => (
            <div
              key={check.id}
              className="flex items-center justify-between px-6 py-4"
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full",
                    check.completed
                      ? "bg-success-100 text-success-600"
                      : check.pending
                      ? "bg-warning-100 text-warning-600"
                      : "bg-gray-100 text-gray-400"
                  )}
                >
                  {check.completed ? (
                    <CheckCircle2 className="size-5" />
                  ) : check.pending ? (
                    <Clock className="size-5" />
                  ) : (
                    check.icon
                  )}
                </div>
                <div>
                  <h3
                    className={cn(
                      "font-medium",
                      check.completed ? "text-success-700" : "text-navy-800"
                    )}
                  >
                    {check.label}
                    {check.pending && (
                      <span className="ml-2 text-xs font-normal text-warning-600">
                        (Pending Review)
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">{check.description}</p>
                </div>
              </div>
              {check.action && (
                <Link href={check.action.href}>
                  <Button variant="secondary" size="sm">
                    {check.action.label}
                    <ChevronRight className="ml-1 size-4" />
                  </Button>
                </Link>
              )}
              {check.completed && (
                <span className="flex items-center gap-1 text-sm font-medium text-success-600">
                  <CheckCircle2 className="size-4" />
                  Complete
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Info */}
      <div className="rounded-xl border border-gold-200 bg-gold-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="size-5 text-gold-600" />
          <div>
            <h3 className="font-medium text-gold-800">
              Why verify your profile?
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-gold-700">
              <li>- Verified profiles get 3x more views from employers</li>
              <li>- Priority placement in job matching</li>
              <li>- Access to premium job listings</li>
              <li>- Build trust with yacht owners and captains</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
