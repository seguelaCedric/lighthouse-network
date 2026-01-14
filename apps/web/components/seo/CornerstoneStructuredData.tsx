interface FAQItem {
  question: string;
  answer: string;
}

interface CornerstonePageData {
  id: string;
  position: string;
  position_slug: string;
  url_path: string;
  meta_title: string;
  meta_description: string;
  hero_headline: string;
  hero_subheadline: string | null;
  service_description: string | null;
  faq_content: FAQItem[] | null;
  last_reviewed_at: string | null;
  updated_at: string | null;
}

interface Props {
  data: CornerstonePageData;
}

export function CornerstoneStructuredData({ data }: Props) {
  // Use last_reviewed_at if available, otherwise fall back to updated_at or current date
  const lastModified = data.last_reviewed_at || data.updated_at || new Date().toISOString();
  const lastModifiedDate = lastModified.split('T')[0];

  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Lighthouse Careers",
    alternateName: "Lighthouse",
    url: "https://lighthouse-careers.com",
    logo: "https://lighthouse-careers.com/logo.png",
    foundingDate: "2020",
    description:
      "Premium yacht crew and private household staffing agency with 500+ satisfied clients, connecting verified candidates with discerning clients worldwide.",
    address: {
      "@type": "PostalAddress",
      addressCountry: "FR",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+33-6-52-92-83-60",
        contactType: "customer service",
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
  };

  // Service Schema for the cornerstone page
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${data.position.charAt(0).toUpperCase() + data.position.slice(1)} Recruitment Services`,
    description: data.service_description
      ? data.service_description.replace(/<[^>]*>/g, '').substring(0, 500)
      : data.meta_description,
    provider: {
      "@type": "Organization",
      name: "Lighthouse Careers",
      url: "https://lighthouse-careers.com",
      foundingDate: "2020",
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
      "@type": "Place",
      name: "Worldwide",
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

  // FAQ Schema from page data
  const faqSchema = data.faq_content && data.faq_content.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: data.faq_content.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer.replace(/<[^>]*>/g, ''), // Strip HTML
          },
        })),
      }
    : null;

  // HowTo Schema
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to Hire a ${data.position.charAt(0).toUpperCase() + data.position.slice(1)}`,
    description: `Step-by-step guide to hiring a ${data.position} through Lighthouse Careers`,
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Share Your Requirements",
        text: `Contact Lighthouse Careers and provide details about your ${data.position} position including role responsibilities, experience level needed, and specific requirements.`,
        url: `https://lighthouse-careers.com/hire-a-${data.position_slug}/`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Review Matched Candidates",
        text: `Our AI-powered matching system searches our network of pre-vetted ${data.position} professionals. We present a shortlist of candidates matching your requirements, typically within 24 hours.`,
        url: `https://lighthouse-careers.com/hire-a-${data.position_slug}/`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Interview & Select",
        text: "Review candidate profiles, conduct interviews, and check references. Our consultants provide full support throughout the interview process.",
        url: `https://lighthouse-careers.com/hire-a-${data.position_slug}/`,
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Placement & Onboarding",
        text: `Once you've selected your ${data.position}, we assist with contract negotiation, onboarding support, and ensure a smooth transition.`,
        url: `https://lighthouse-careers.com/hire-a-${data.position_slug}/`,
      },
    ],
    totalTime: "P2W",
  };

  // Article Schema with freshness date
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.meta_title,
    description: data.meta_description,
    author: {
      "@type": "Organization",
      name: "Lighthouse Careers",
    },
    publisher: {
      "@type": "Organization",
      name: "Lighthouse Careers",
      logo: {
        "@type": "ImageObject",
        url: "https://lighthouse-careers.com/logo.png",
      },
    },
    datePublished: "2024-01-01",
    dateModified: lastModifiedDate, // Uses last_reviewed_at for freshness
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://lighthouse-careers.com/hire-a-${data.position_slug}/`,
    },
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
        item: `https://lighthouse-careers.com/hire-a-${data.position_slug}/`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
