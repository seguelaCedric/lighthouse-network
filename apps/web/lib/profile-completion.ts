export type ProfileCompletionAction = {
  id: string;
  label: string;
  percentageBoost: number;
  completed: boolean;
  href: string;
  field?: string; // Optional field name for granular tracking
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
  yachtPrimaryPosition?: string | null;
  householdPrimaryPosition?: string | null;
  availabilityStatus?: string | null;
  avatarUrl?: string | null;
  hasStcw?: boolean;
  hasEng1?: boolean;
  industryPreference?: string | null;
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

const hasNumericValue = (value: number | null | undefined): boolean =>
  value !== null && value !== undefined && !isNaN(value);

export function calculateProfileCompletion(
  input: ProfileCompletionInput
): ProfileCompletionResult {
  const actions: ProfileCompletionAction[] = [];
  let score = 0;

  // Personal Info (20%): 4% per field (5 fields = 20%)
  const personalFields = [
    { field: "firstName", value: input.firstName, label: "First name", points: 4 },
    { field: "lastName", value: input.lastName, label: "Last name", points: 4 },
    { field: "email", value: input.email, label: "Email", points: 4 },
    { field: "phone", value: input.phone, label: "Phone", points: 4 },
    { field: "nationality", value: input.nationality, label: "Nationality", points: 4 },
  ];

  personalFields.forEach(({ field, value, label, points }) => {
    if (hasValue(value)) {
      score += points;
    } else {
      actions.push({
        id: `personal-${field}`,
        label: `Add ${label.toLowerCase()}`,
        percentageBoost: points,
        completed: false,
        href: "/crew/profile/edit#personal",
        field,
      });
    }
  });

  // Professional Info (25%): candidateType (10%), primaryPosition (15%)
  if (hasValue(input.candidateType)) {
    score += 10;
  } else {
    actions.push({
      id: "professional-candidateType",
      label: "Select role category",
      percentageBoost: 10,
      completed: false,
      href: "/crew/profile/edit#professional",
      field: "candidateType",
    });
  }

  const hasPosition = hasValue(input.primaryPosition) ||
    hasValue(input.yachtPrimaryPosition) ||
    hasValue(input.householdPrimaryPosition);

  if (hasPosition) {
    score += 15;
  } else {
    actions.push({
      id: "professional-position",
      label: "Add primary position",
      percentageBoost: 15,
      completed: false,
      href: "/crew/profile/edit#professional",
      field: "primaryPosition",
    });
  }

  // Availability (10%): availability_status
  if (hasValue(input.availabilityStatus)) {
    score += 10;
  } else {
    actions.push({
      id: "availability-status",
      label: "Set availability status",
      percentageBoost: 10,
      completed: false,
      href: "/crew/profile/edit#professional",
      field: "availabilityStatus",
    });
  }

  // Documents (20%): CV upload
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
      field: "cv",
    });
  }

  // Enhancement Fields (10%): dateOfBirth (2%), currentLocation (3%), avatarUrl (5%)
  // These are optional and only shown as actions if core profile is not yet complete
  const coreScore = score; // Score before enhancement fields
  const enhancementActions: ProfileCompletionAction[] = [];

  if (hasValue(input.dateOfBirth)) {
    score += 2;
  } else {
    enhancementActions.push({
      id: "enhancement-dateOfBirth",
      label: "Add date of birth",
      percentageBoost: 2,
      completed: false,
      href: "/crew/profile/edit#personal",
      field: "dateOfBirth",
    });
  }

  if (hasValue(input.currentLocation)) {
    score += 3;
  } else {
    enhancementActions.push({
      id: "enhancement-currentLocation",
      label: "Add current location",
      percentageBoost: 3,
      completed: false,
      href: "/crew/profile/edit#personal",
      field: "currentLocation",
    });
  }

  if (hasValue(input.avatarUrl)) {
    score += 5;
  } else {
    enhancementActions.push({
      id: "enhancement-photo",
      label: "Add profile photo",
      percentageBoost: 5,
      completed: false,
      href: "/crew/profile/edit#photo",
      field: "avatarUrl",
    });
  }

  // Only add enhancement actions if core profile is not complete
  // Enhancement fields are optional and shouldn't show as required when core is done
  // Core required: Personal (20) + Professional (25) + Availability (10) + Documents (20) + Certifications (10) + Preferences (15) = 100%
  const coreRequiredScore = 100;
  if (coreScore < coreRequiredScore) {
    actions.push(...enhancementActions);
  }

  // Certifications (10%): STCW/ENG1 for yacht crew
  const needsYachtCerts =
    input.candidateType === "yacht_crew" || input.candidateType === "both";
  if (needsYachtCerts) {
    const hasCerts = input.hasStcw || input.hasEng1;
    if (hasCerts) {
      score += 10;
    } else {
      actions.push({
        id: "certs",
        label: "Add certifications (STCW or ENG1)",
        percentageBoost: 10,
        completed: false,
        href: "/crew/documents#certificates",
        field: "certifications",
      });
    }
  } else {
    // Household staff don't need yacht certifications
    score += 10;
  }

  // Preferences (15%): industryPreference (increased from 5% to compensate for removed years_experience)
  if (hasValue(input.industryPreference)) {
    score += 15;
  } else {
    actions.push({
      id: "preferences",
      label: "Set job preferences",
      percentageBoost: 15,
      completed: false,
      href: "/crew/preferences",
      field: "industryPreference",
    });
  }

  // Cap score at 100%
  score = Math.min(100, score);

  // Filter out actions if score is already 100%
  // If profile is complete, don't show enhancement field suggestions
  const filteredActions = score >= 100 ? [] : actions;

  // Note: Verification tier is excluded as it's not candidate-controlled
  // We still check it for display purposes but don't include in score
  const isIdentityVerified = false; // Will be set by caller if needed

  return { score, actions: filteredActions, isIdentityVerified };
}
