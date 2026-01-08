import type { PublicJob } from "../job-board/JobBoardCard";

interface JobPostingJsonLdProps {
  job: PublicJob;
  baseUrl?: string;
}

// Determine industry based on position and vessel type
function determineIndustry(positionCategory: string | null, vesselType: string | null): string {
  // If there's a vessel type, it's a yacht position
  if (vesselType) {
    return "Maritime / Superyacht";
  }

  // Check position category for yacht-specific roles
  const yachtPositions = [
    "captain", "officer", "bosun", "deckhand", "engineer", "eto",
    "chief_stew", "stewardess", "purser"
  ];

  if (positionCategory) {
    const posLower = positionCategory.toLowerCase();
    if (yachtPositions.some(p => posLower.includes(p))) {
      return "Maritime / Superyacht";
    }
  }

  // Default to private household/hospitality
  return "Private Household / Luxury Hospitality";
}

// Map contract types to schema.org employment types
function mapContractType(contractType: string | null): string {
  if (!contractType) return "FULL_TIME";

  const typeMap: Record<string, string> = {
    permanent: "FULL_TIME",
    full_time: "FULL_TIME",
    part_time: "PART_TIME",
    seasonal: "TEMPORARY",
    temporary: "TEMPORARY",
    rotational: "FULL_TIME",
    freelance: "CONTRACTOR",
    contract: "CONTRACTOR",
    intern: "INTERN",
    volunteer: "VOLUNTEER",
  };

  return typeMap[contractType.toLowerCase()] || "FULL_TIME";
}

// Format date to ISO 8601
function formatDateISO(dateString: string | null): string | undefined {
  if (!dateString) return undefined;
  try {
    return new Date(dateString).toISOString().split("T")[0];
  } catch {
    return undefined;
  }
}

// Calculate valid through date (default 60 days from now if not specified)
function getValidThrough(deadline: string | null): string {
  if (deadline) {
    return new Date(deadline).toISOString();
  }
  const defaultExpiry = new Date();
  defaultExpiry.setDate(defaultExpiry.getDate() + 60);
  return defaultExpiry.toISOString();
}

export function JobPostingJsonLd({ job, baseUrl = "https://lighthouse-careers.com" }: JobPostingJsonLdProps) {
  // Build the structured data object - Enhanced for AI/LLM consumption
  const jobPostingSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description || `${job.title} position available`,
    identifier: {
      "@type": "PropertyValue",
      name: "Lighthouse Careers",
      value: job.id,
    },
    datePosted: formatDateISO(job.published_at || job.created_at),
    validThrough: getValidThrough(job.apply_deadline),
    employmentType: mapContractType(job.contract_type),

    // Hiring organization - Enhanced with more context
    hiringOrganization: {
      "@type": "Organization",
      name: job.agency_name || "Lighthouse Careers",
      sameAs: baseUrl,
      logo: `${baseUrl}/logo.png`,
      description: job.agency_name
        ? `${job.agency_name} - Verified recruitment agency partner of Lighthouse Careers`
        : "Lighthouse Careers - Premium yacht crew and private household staffing agency",
    },

    // Industry-specific - handle both yacht and land-based positions
    industry: determineIndustry(job.position_category, job.vessel_type),
    occupationalCategory: job.position_category || "Luxury Hospitality",
    workHours: job.contract_type === "rotational" ? "Rotational schedule" : "Full-time",
    
    // Additional context for AI/LLM
    jobLocationType: job.vessel_type ? "On-site (Vessel)" : "On-site",
    specialCommitments: job.is_urgent ? "Urgent hire - immediate start preferred" : undefined,

    // Direct Apply
    directApply: true,

    // Job URL
    url: `${baseUrl}/job-board/${job.id}`,
    
    // Application instructions
    applicationContact: {
      "@type": "ContactPoint",
      contactType: "Application",
      url: `${baseUrl}/job-board/${job.id}`,
      email: "admin@lighthouse-careers.com",
    },
  };

  // Add job location if available
  if (job.primary_region) {
    jobPostingSchema.jobLocation = {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressRegion: job.primary_region,
      },
    };
  }

  // Add salary if available
  if (job.salary_min || job.salary_max) {
    const salaryPeriod =
      job.salary_period === "yearly"
        ? "YEAR"
        : job.salary_period === "daily"
          ? "DAY"
          : "MONTH";

    jobPostingSchema.baseSalary = {
      "@type": "MonetaryAmount",
      currency: job.salary_currency || "EUR",
      value: {
        "@type": "QuantitativeValue",
        ...(job.salary_min && job.salary_max
          ? {
              minValue: job.salary_min,
              maxValue: job.salary_max,
              unitText: salaryPeriod,
            }
          : job.salary_min
            ? {
                value: job.salary_min,
                unitText: salaryPeriod,
              }
            : {
                value: job.salary_max,
                unitText: salaryPeriod,
              }),
      },
    };
  }

  // Add start date if available
  if (job.start_date) {
    jobPostingSchema.jobStartDate = formatDateISO(job.start_date);
  }

  // Add benefits
  const benefits: string[] = [];
  if (job.holiday_days) {
    benefits.push(`${job.holiday_days} days annual leave`);
  }
  if (job.rotation_schedule) {
    benefits.push(`Rotation: ${job.rotation_schedule}`);
  }
  if (job.benefits && job.benefits.length > 0) {
    benefits.push(...job.benefits);
  }
  if (benefits.length > 0) {
    jobPostingSchema.jobBenefits = benefits.join(", ");
  }

  // Add requirements/qualifications
  if (job.requirements && job.requirements.length > 0) {
    jobPostingSchema.qualifications = job.requirements.join(", ");
  }

  // Add vessel information to description
  if (job.vessel_type || job.vessel_size_meters) {
    const vesselInfo = [
      job.vessel_type,
      job.vessel_size_meters ? `${job.vessel_size_meters}m` : null,
    ]
      .filter(Boolean)
      .join(" ");

    jobPostingSchema.description =
      `${job.description || ""}\n\nVessel: ${vesselInfo}`.trim();
  }

  // Urgent jobs
  if (job.is_urgent) {
    jobPostingSchema.specialCommitments = "Urgent hire - immediate start preferred";
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }}
    />
  );
}

// Breadcrumb JSON-LD for job detail page
interface JobBreadcrumbJsonLdProps {
  jobTitle: string;
  jobId: string;
  baseUrl?: string;
}

export function JobBreadcrumbJsonLd({
  jobTitle,
  jobId,
  baseUrl = "https://lighthouse-careers.com",
}: JobBreadcrumbJsonLdProps) {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Jobs",
        item: `${baseUrl}/job-board`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: jobTitle,
        item: `${baseUrl}/job-board/${jobId}`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
    />
  );
}
