import type { PublicJob } from "../job-board/JobBoardCard";

interface JobListJsonLdProps {
  jobs: PublicJob[];
  totalCount: number;
  currentPage: number;
  baseUrl?: string;
}

export function JobListJsonLd({
  jobs,
  totalCount,
  currentPage,
  baseUrl = "https://lighthouse-careers.com",
}: JobListJsonLdProps) {
  // ItemList schema for the job listing page
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Luxury Staff Job Listings",
    description: `Browse ${totalCount} open positions in yachting and private households from top agencies worldwide`,
    numberOfItems: totalCount,
    itemListOrder: "https://schema.org/ItemListUnordered",
    itemListElement: jobs.map((job, index) => ({
      "@type": "ListItem",
      position: (currentPage - 1) * jobs.length + index + 1,
      url: `${baseUrl}/job-board/${job.id}`,
      name: job.title,
      item: {
        "@type": "JobPosting",
        title: job.title,
        identifier: {
          "@type": "PropertyValue",
          name: "Lighthouse Careers",
          value: job.id,
        },
        datePosted: job.published_at || job.created_at,
        hiringOrganization: {
          "@type": "Organization",
          name: job.agency_name || "Lighthouse Careers",
        },
        ...(job.primary_region && {
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressRegion: job.primary_region,
            },
          },
        }),
        employmentType: mapContractTypeSimple(job.contract_type),
      },
    })),
  };

  // WebPage schema
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Luxury Staff Jobs | Yacht Crew & Private Household | Lighthouse Careers",
    description:
      "Browse elite positions in yachting and private households. Captain, Chef, Butler, Estate Manager, Nanny roles. Apply directly.",
    url: `${baseUrl}/job-board`,
    isPartOf: {
      "@type": "WebSite",
      name: "Lighthouse Careers",
      url: baseUrl,
    },
    about: {
      "@type": "Thing",
      name: "Luxury Staff Employment",
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Luxury Staff Job Listings",
      numberOfItems: totalCount,
    },
  };

  // CollectionPage schema for better SEO
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Luxury Staff Jobs",
    description: `Discover ${totalCount} yacht crew and private household positions from leading recruitment agencies`,
    url: `${baseUrl}/job-board`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: jobs.slice(0, 10).map((job, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${baseUrl}/job-board/${job.id}`,
      })),
    },
    publisher: {
      "@type": "Organization",
      name: "Lighthouse Careers",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageSchema) }}
      />
    </>
  );
}

// Simple contract type mapping
function mapContractTypeSimple(contractType: string | null): string {
  if (!contractType) return "FULL_TIME";

  const typeMap: Record<string, string> = {
    permanent: "FULL_TIME",
    seasonal: "TEMPORARY",
    temporary: "TEMPORARY",
    rotational: "FULL_TIME",
    freelance: "CONTRACTOR",
  };

  return typeMap[contractType.toLowerCase()] || "FULL_TIME";
}

// Breadcrumb for job list page
export function JobListBreadcrumbJsonLd({
  baseUrl = "https://lighthouse-careers.com",
}: {
  baseUrl?: string;
}) {
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
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
    />
  );
}

// FAQ schema for job board page
export function JobBoardFaqJsonLd({ baseUrl = "https://lighthouse-careers.com" }: { baseUrl?: string }) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What types of positions are available?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We list positions across yacht crew (Captain, Chief Officer, Chief Stew, Stewardess, Chef, Engineer, Deckhand) and private household staff (Butler, Estate Manager, House Manager, Private Chef, Nanny, Housekeeper, Personal Assistant). Positions range from motor yachts to private estates worldwide.",
        },
      },
      {
        "@type": "Question",
        name: "How do I apply for a position?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Browse our job listings, click on a position that interests you, and use the 'Apply' button to submit your application directly to the recruiting agency. Create a profile to track your applications and get matched with suitable opportunities.",
        },
      },
      {
        "@type": "Question",
        name: "Are these jobs verified?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, all job listings come from verified recruitment agencies in our network. Lighthouse Careers connects yacht crew and private household staff with quality opportunities from trusted employers.",
        },
      },
      {
        "@type": "Question",
        name: "What qualifications do I need for yacht crew positions?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Requirements vary by position. Most yacht roles require STCW certification. Deck crew need relevant licenses (OOW, Master), while interior crew benefit from hospitality certifications. Experience on similar-sized vessels is often preferred.",
        },
      },
      {
        "@type": "Question",
        name: "What qualifications do I need for private household staff positions?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Private household positions require relevant experience and references. Butlers often have formal training, Estate Managers need property management experience, Private Chefs require culinary credentials, and Nannies typically hold childcare certifications. Discretion and professionalism are essential for all roles.",
        },
      },
      {
        "@type": "Question",
        name: "Do these positions include accommodation?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Most yacht crew positions include live-aboard accommodation and all meals. Many private household staff positions also include live-in accommodation or housing allowances. Additional benefits often include health insurance, travel allowances, and paid leave. Check individual job listings for specific benefit packages.",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  );
}
