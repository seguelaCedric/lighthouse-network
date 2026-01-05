export type ProfileCompletionAction = {
  id: "basic-info" | "professional" | "cv" | "photo" | "certs" | "preferences";
  label: string;
  percentageBoost: number;
  completed: boolean;
  href: string;
};

export type ProfileCompletionInput = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  currentLocation?: string | null;
  candidateType?: string | null;
  primaryPosition?: string | null;
  avatarUrl?: string | null;
  hasStcw?: boolean;
  hasEng1?: boolean;
  industryPreference?: string | null;
  verificationTier?: string | null;
  documents?: Array<{ type: string }>;
};

export type ProfileCompletionResult = {
  score: number;
  actions: ProfileCompletionAction[];
  isIdentityVerified: boolean;
};

const identityVerificationTiers = new Set(["identity", "verified", "premium"]);

const hasValue = (value: string | null | undefined): boolean =>
  typeof value === "string" ? value.trim().length > 0 : Boolean(value);

export function calculateProfileCompletion(
  input: ProfileCompletionInput
): ProfileCompletionResult {
  const actions: ProfileCompletionAction[] = [];
  let score = 0;

  const basicInfoComplete =
    hasValue(input.firstName) &&
    hasValue(input.lastName) &&
    hasValue(input.email) &&
    hasValue(input.phone) &&
    hasValue(input.dateOfBirth) &&
    hasValue(input.nationality) &&
    hasValue(input.currentLocation);

  if (basicInfoComplete) {
    score += 15;
  } else {
    actions.push({
      id: "basic-info",
      label: "Complete personal details",
      percentageBoost: 15,
      completed: false,
      href: "/crew/profile/edit#personal",
    });
  }

  const professionalComplete =
    hasValue(input.primaryPosition) && hasValue(input.candidateType);
  if (professionalComplete) {
    score += 20;
  } else {
    actions.push({
      id: "professional",
      label: "Add professional details",
      percentageBoost: 20,
      completed: false,
      href: "/crew/profile/edit#professional",
    });
  }

  const hasCv = (input.documents || []).some((doc) => doc.type === "cv");
  if (hasCv) {
    score += 20;
  } else {
    actions.push({
      id: "cv",
      label: "Upload your CV",
      percentageBoost: 20,
      completed: false,
      href: "/crew/documents#cv",
    });
  }

  if (hasValue(input.avatarUrl)) {
    score += 10;
  } else {
    actions.push({
      id: "photo",
      label: "Add profile photo",
      percentageBoost: 10,
      completed: false,
      href: "/crew/profile/edit#photo",
    });
  }

  const needsYachtCerts =
    input.candidateType === "yacht_crew" || input.candidateType === "both";
  const hasCerts = needsYachtCerts ? input.hasStcw || input.hasEng1 : true;
  if (hasCerts) {
    score += 20;
  } else {
    actions.push({
      id: "certs",
      label: "Add certifications",
      percentageBoost: 20,
      completed: false,
      href: "/crew/documents#certificates",
    });
  }

  const hasPrefs = hasValue(input.industryPreference);
  if (hasPrefs) {
    score += 10;
  } else {
    actions.push({
      id: "preferences",
      label: "Set job preferences",
      percentageBoost: 10,
      completed: false,
      href: "/crew/preferences",
    });
  }

  const isIdentityVerified = identityVerificationTiers.has(
    input.verificationTier || ""
  );
  if (isIdentityVerified) {
    score += 5;
  }

  return { score, actions, isIdentityVerified };
}
