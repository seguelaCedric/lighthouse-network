/**
 * Global structured data that should appear on every page
 * Provides comprehensive organization and website information for SEO and AI/LLM consumption
 */

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lighthouse-careers.com";

export function GlobalStructuredData() {
  // Organization Schema - Comprehensive business information
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}#organization`,
    name: "Lighthouse Careers",
    alternateName: ["Lighthouse Crew Network", "Lighthouse"],
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}/logo.png`,
      width: 512,
      height: 512,
    },
    foundingDate: "2002",
    description:
      "Premium yacht crew and private household staffing agency with 500+ satisfied clients. Connecting verified candidates with discerning clients worldwide. Specializing in superyacht crew recruitment and luxury private household staff placement.",
    address: {
      "@type": "PostalAddress",
      addressCountry: "FR",
      addressLocality: "Antibes",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+33-6-52-92-83-60",
        contactType: "customer service",
        email: "admin@lighthouse-careers.com",
        availableLanguage: ["English", "French"],
        areaServed: "Worldwide",
      },
      {
        "@type": "ContactPoint",
        telephone: "+33-6-52-92-83-60",
        contactType: "sales",
        email: "admin@lighthouse-careers.com",
        availableLanguage: ["English", "French"],
      },
    ],
    sameAs: [
      "https://www.linkedin.com/company/lighthouse-careers",
      "https://www.facebook.com/lighthousecareers",
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "500",
      bestRating: "5",
      worstRating: "1",
    },
    numberOfEmployees: {
      "@type": "QuantitativeValue",
      value: "50+",
    },
    knowsAbout: [
      "Yacht crew recruitment",
      "Private household staffing",
      "Butler placement",
      "Estate manager recruitment",
      "Superyacht crew",
      "Luxury hospitality",
      "Private chef recruitment",
      "Nanny placement",
      "Housekeeper recruitment",
      "Captain recruitment",
      "Chief stewardess recruitment",
      "Yacht engineer recruitment",
      "Deckhand recruitment",
    ],
    areaServed: {
      "@type": "Place",
      name: "Worldwide",
    },
    serviceType: [
      "Yacht Crew Recruitment",
      "Private Household Staff Placement",
      "Executive Search",
      "Temporary Staffing",
      "Permanent Placement",
    ],
    priceRange: "$$$",
    foundingLocation: {
      "@type": "Place",
      name: "Antibes, France",
    },
  };

  // WebSite Schema - Site-wide search and navigation
  const siteName = "Lighthouse Careers";
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}#website`,
    name: siteName,
    url: baseUrl,
    description:
      "Lighthouse Careers - Premium yacht crew and private household staffing agency. Browse jobs, find candidates, and connect with verified professionals worldwide.",
    publisher: {
      "@id": `${baseUrl}#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/job-board?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: ["en", "fr"],
    copyrightYear: new Date().getFullYear(),
    copyrightHolder: {
      "@id": `${baseUrl}#organization`,
    },
  };

  // LocalBusiness Schema - For local SEO
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${baseUrl}#business`,
    name: "Lighthouse Careers",
    image: `${baseUrl}/logo.png`,
    url: baseUrl,
    telephone: "+33-6-52-92-83-60",
    email: "admin@lighthouse-careers.com",
    address: {
      "@type": "PostalAddress",
      addressCountry: "FR",
      addressLocality: "Antibes",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "43.5804",
      longitude: "7.1233",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
      timeZone: "Europe/Paris",
    },
    priceRange: "$$$",
    areaServed: {
      "@type": "Place",
      name: "Worldwide",
    },
    serviceArea: {
      "@type": "Place",
      name: "Worldwide",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Recruitment Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Yacht Crew Recruitment",
            description: "Recruitment services for superyacht crew positions",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Private Household Staff Placement",
            description: "Placement services for private household staff",
          },
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
    </>
  );
}

