interface SeoLandingPageData {
  id: string;
  position: string;
  position_slug: string;
  country: string;
  country_slug: string;
  state: string | null;
  state_slug: string | null;
  city: string | null;
  city_slug: string | null;
  original_url_path: string;
  meta_title: string;
  meta_description: string;
  hero_headline: string;
  hero_subheadline: string | null;
  intro_content: string | null;
}

interface Props {
  data: SeoLandingPageData;
}

export function StructuredData({ data }: Props) {
  const locationString = [data.city, data.state, data.country]
    .filter(Boolean)
    .join(", ");

  // Service Schema
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${data.position.charAt(0).toUpperCase() + data.position.slice(1)} Hiring Services in ${data.city || data.country}`,
    description: data.meta_description,
    provider: {
      "@type": "Organization",
      name: "Lighthouse Careers",
      url: "https://lighthouse-careers.com",
      foundingDate: "2002",
      description:
        "Premium yacht crew and private household staffing agency with 20+ years experience",
      logo: "https://lighthouse-careers.com/logo.png",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+33-6-76-41-02-99",
        contactType: "customer service",
        email: "admin@lighthouse-careers.com",
        availableLanguage: ["English", "French"],
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "500",
        bestRating: "5",
        worstRating: "1",
      },
    },
    serviceType: `${data.position.charAt(0).toUpperCase() + data.position.slice(1)} Placement`,
    areaServed: {
      "@type": data.city ? "City" : data.state ? "State" : "Country",
      name: data.city || data.state || data.country,
      ...(data.city && data.state
        ? {
            containedInPlace: {
              "@type": "State",
              name: data.state,
              containedInPlace: {
                "@type": "Country",
                name: data.country,
              },
            },
          }
        : data.state
          ? {
              containedInPlace: {
                "@type": "Country",
                name: data.country,
              },
            }
          : {}),
    },
    offers: {
      "@type": "Offer",
      description: "Success-fee based placement with no upfront costs",
      priceSpecification: {
        "@type": "PriceSpecification",
        priceCurrency: "USD",
        description: "Fee calculated as percentage of annual salary upon successful placement",
      },
    },
  };

  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Lighthouse Careers",
    alternateName: "Lighthouse Crew Network",
    url: "https://lighthouse-careers.com",
    logo: "https://lighthouse-careers.com/logo.png",
    foundingDate: "2002",
    description:
      "Premium yacht crew and private household staffing agency with over 20 years of experience, connecting verified candidates with discerning clients worldwide.",
    address: {
      "@type": "PostalAddress",
      addressCountry: "FR",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+33-6-76-41-02-99",
        contactType: "customer service",
        email: "admin@lighthouse-careers.com",
        availableLanguage: ["English", "French"],
      },
    ],
    sameAs: [
      "https://www.linkedin.com/company/lighthouse-careers",
      "https://www.facebook.com/lighthousecareers",
    ],
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
    ],
  };

  // FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How much does it cost to hire a ${data.position} in ${data.city || data.country}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Lighthouse Careers operates on a success-fee model - you only pay when we successfully place a candidate. There are no upfront costs. Contact us for current rates specific to ${data.position} placements in ${locationString}.`,
        },
      },
      {
        "@type": "Question",
        name: `How long does it take to hire a ${data.position}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Typically 2-4 weeks from initial brief to placement, depending on specific requirements and availability. With our network of 22,000+ candidates, we can often present qualified shortlists within 48 hours.`,
        },
      },
      {
        "@type": "Question",
        name: `Are your ${data.position} candidates vetted?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes, all candidates undergo rigorous vetting including background checks, reference verification, skill assessments, and identity verification. We've been trusted by discerning clients for over 20 years.`,
        },
      },
      {
        "@type": "Question",
        name: `Do you provide ${data.position} candidates in ${locationString}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes, Lighthouse Careers provides ${data.position} placement services in ${locationString} and throughout ${data.country}. We have local market expertise and candidates available for both permanent and temporary positions.`,
        },
      },
    ],
  };

  // BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://lighthouse-careers.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: `Hire a ${data.position.charAt(0).toUpperCase() + data.position.slice(1)}`,
        item: `https://lighthouse-careers.com/hire-a-${data.position_slug}`,
      },
      ...(data.country
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: data.country,
              item: `https://lighthouse-careers.com/hire-a-${data.position_slug}-${data.country_slug}`,
            },
          ]
        : []),
      ...(data.state
        ? [
            {
              "@type": "ListItem",
              position: 4,
              name: data.state,
              item: `https://lighthouse-careers.com/hire-a-${data.position_slug}-${data.country_slug}/${data.state_slug}`,
            },
          ]
        : []),
      ...(data.city
        ? [
            {
              "@type": "ListItem",
              position: 5,
              name: data.city,
              item: `https://lighthouse-careers.com/${data.original_url_path}`,
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
