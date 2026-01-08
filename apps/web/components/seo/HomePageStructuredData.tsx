/**
 * Home page specific structured data for SEO and AI/LLM discoverability
 * Complements GlobalStructuredData with page-specific schemas
 */

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lighthouse-careers.com";

interface Testimonial {
  readonly quote: string;
  readonly name: string;
  readonly role: string;
  readonly image: string;
  readonly type: "client" | "candidate";
}

interface HomePageStructuredDataProps {
  testimonials: readonly Testimonial[];
}

export function HomePageStructuredData({ testimonials }: HomePageStructuredDataProps) {
  // WebPage Schema - Identifies the page type for search engines and LLMs
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${baseUrl}#webpage`,
    url: baseUrl,
    name: "Lighthouse Careers - Premium Yacht Crew & Private Household Staff Recruitment",
    description:
      "Premium yacht crew and private household staffing agency with 500+ satisfied clients. Connecting verified candidates with discerning clients worldwide since 2002. No upfront fees, same-day candidates, free replacement guarantee.",
    datePublished: "2002-01-01",
    dateModified: new Date().toISOString().split("T")[0],
    isPartOf: {
      "@id": `${baseUrl}#website`,
    },
    about: {
      "@id": `${baseUrl}#organization`,
    },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: `${baseUrl}/images/og-home.jpg`,
      width: 1200,
      height: 630,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: baseUrl,
        },
      ],
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["#hero-heading", "#about-heading", "#services-heading"],
    },
    mainEntity: {
      "@id": `${baseUrl}#organization`,
    },
  };

  // FAQPage Schema - Highly valuable for AI/LLM search
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${baseUrl}#faq`,
    mainEntity: [
      {
        "@type": "Question",
        name: "How much does yacht crew recruitment cost?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Lighthouse Careers operates on a success-fee basis - you only pay when we successfully place a candidate. There are no upfront costs, retainers, or advertising fees. Our fee is typically a percentage of the candidate's annual salary, which varies based on the position level and complexity of the search.",
        },
      },
      {
        "@type": "Question",
        name: "How quickly can you find yacht crew or private staff?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We typically present initial candidate shortlists within 48 hours of receiving your brief. The full recruitment process from brief to placement usually takes 2-4 weeks, depending on the position's requirements and availability of suitable candidates. For urgent needs, we offer expedited searches.",
        },
      },
      {
        "@type": "Question",
        name: "Do you provide temporary or rotational staff?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, we provide both permanent placements and temporary/rotational staffing solutions. This includes seasonal yacht crew for charter seasons, temporary cover for crew on leave, and rotational positions where crew work on a schedule such as 2 months on/2 months off.",
        },
      },
      {
        "@type": "Question",
        name: "What is your replacement guarantee?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We offer a free replacement guarantee on all placements. If a candidate leaves or doesn't work out within the agreed guarantee period (typically 3-6 months depending on position type), we will find a replacement at no additional cost to you.",
        },
      },
      {
        "@type": "Question",
        name: "What yacht crew positions do you recruit for?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We recruit for all yacht crew positions including: Captains, Chief Officers, Engineers (Chief, 2nd, 3rd), Chief Stewardesses, Stewardesses, Pursers, Deckhands, Bosuns, Yacht Chefs, AV/IT Engineers, Security Officers, Spa Therapists, and more. We specialize in superyachts 40m and above.",
        },
      },
      {
        "@type": "Question",
        name: "What private household staff do you place?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We place all types of private household staff including: Butlers, House Managers, Estate Managers, Housekeepers, Nannies, Governesses, Personal Assistants, Private Chefs, Chauffeurs, Security Personnel, Couples (Butler/Housekeeper combinations), and Property Caretakers for estates and private islands.",
        },
      },
      {
        "@type": "Question",
        name: "How do you vet candidates?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our vetting process includes: Initial application screening, video or phone interviews, skills assessment, background checks, minimum 2 professional reference verifications, identity verification, and certification validation (MCA/STCW for yacht crew, relevant qualifications for household staff). We only present candidates who meet our rigorous standards.",
        },
      },
      {
        "@type": "Question",
        name: "What areas do you cover?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We operate globally with particular expertise in the Mediterranean (France, Monaco, Spain, Italy), Caribbean, United States (Florida, California), United Kingdom, Australia, Middle East (Dubai, Abu Dhabi), and Southeast Asia. Our candidates and clients come from over 50 countries worldwide.",
        },
      },
    ],
  };

  // Service Schema - Describes what services are offered
  const servicesSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${baseUrl}#services`,
    name: "Lighthouse Careers Recruitment Services",
    description: "Premium recruitment services for yacht crew and private household staff",
    itemListElement: [
      {
        "@type": "Service",
        position: 1,
        name: "Yacht Crew Recruitment",
        description:
          "Specialist recruitment for superyacht crew positions including Captains, Engineers, Chief Stewardesses, Deckhands, Chefs, and all yacht departments. We focus on vessels 40m+ and provide both permanent and rotational placements.",
        provider: {
          "@id": `${baseUrl}#organization`,
        },
        serviceType: "Recruitment Agency",
        areaServed: "Worldwide",
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Yacht Crew Positions",
          itemListElement: [
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Captain Recruitment" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Chief Officer Recruitment" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Engineer Recruitment" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Chief Stewardess Recruitment" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Yacht Chef Recruitment" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Deckhand Recruitment" } },
          ],
        },
      },
      {
        "@type": "Service",
        position: 2,
        name: "Private Household Staff Placement",
        description:
          "Discreet placement services for private household staff including Butlers, Estate Managers, Housekeepers, Nannies, Private Chefs, and Chauffeurs for UHNW families and private estates worldwide.",
        provider: {
          "@id": `${baseUrl}#organization`,
        },
        serviceType: "Recruitment Agency",
        areaServed: "Worldwide",
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Private Staff Positions",
          itemListElement: [
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Butler Recruitment" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Estate Manager Recruitment" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Housekeeper Recruitment" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Nanny Recruitment" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Private Chef Recruitment" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Chauffeur Recruitment" } },
          ],
        },
      },
    ],
  };

  // Review/Testimonials Schema - Social proof for AI understanding
  const reviewsSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${baseUrl}#reviews`,
    name: "Client Testimonials",
    description: "Reviews from yacht captains, crew, and private clients",
    numberOfItems: testimonials.length,
    itemListElement: testimonials.slice(0, 10).map((testimonial, index) => ({
      "@type": "Review",
      position: index + 1,
      author: {
        "@type": "Person",
        name: testimonial.name,
        jobTitle: testimonial.role,
      },
      reviewBody: testimonial.quote,
      reviewRating: {
        "@type": "Rating",
        ratingValue: 5,
        bestRating: 5,
        worstRating: 1,
      },
      itemReviewed: {
        "@id": `${baseUrl}#organization`,
      },
      publisher: {
        "@id": `${baseUrl}#organization`,
      },
    })),
  };

  // HowTo Schema - Process explanation for AI
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${baseUrl}#hiring-process`,
    name: "How to Hire Yacht Crew or Private Staff with Lighthouse Careers",
    description:
      "Step-by-step guide to using Lighthouse Careers for your recruitment needs",
    totalTime: "P14D",
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "EUR",
      value: "0",
      description: "No upfront costs - success fee only on placement",
    },
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Submit Your Brief",
        text: "Contact us with your staffing requirements. We'll discuss the position, ideal candidate profile, start date, and any specific preferences you have.",
        url: `${baseUrl}/contact`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Receive Candidate Shortlist",
        text: "Within 48 hours, we present a shortlist of pre-screened, vetted candidates who match your requirements. Each candidate profile includes their CV, references, and our assessment.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Interview Candidates",
        text: "Review the candidates and conduct interviews. We can arrange video calls or in-person meetings and provide guidance throughout the selection process.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Make Your Hire",
        text: "Select your preferred candidate. We assist with offer negotiation, contract preparation, and onboarding. Our fee is only due upon successful placement.",
      },
    ],
  };

  // AggregateRating Schema - Prominent rating display
  const aggregateRatingSchema = {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    "@id": `${baseUrl}#rating`,
    itemReviewed: {
      "@id": `${baseUrl}#organization`,
    },
    ratingValue: "4.9",
    bestRating: "5",
    worstRating: "1",
    ratingCount: "500",
    reviewCount: "500",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewsSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateRatingSchema) }}
      />
    </>
  );
}
