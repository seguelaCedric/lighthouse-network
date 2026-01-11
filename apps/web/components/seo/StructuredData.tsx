interface FAQItem {
  question: string;
  answer: string;
}

interface Testimonial {
  name: string;
  role?: string;
  company?: string;
  quote: string;
  rating?: number;
  photo_url?: string;
}

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
  about_position?: string | null;
  location_info?: string | null;
  service_description?: string | null;
  faq_content?: FAQItem[];
  testimonials?: Testimonial[];
  // Answer capsule fields for AI/LLM optimization
  answer_capsule?: string | null;
  answer_capsule_question?: string | null;
  key_facts?: string[] | null;
  last_reviewed_at?: string | null;
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
    description: data.service_description
      ? data.service_description.replace(/<[^>]*>/g, '').substring(0, 500)
      : data.meta_description,
    provider: {
      "@type": "Organization",
      name: "Lighthouse Careers",
      url: "https://lighthouse-careers.com",
      foundingDate: "2002",
      description:
        "Premium yacht crew and private household staffing agency with 500+ satisfied clients",
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
    // Enhanced for AI/LLM search
    category: `${data.position} Recruitment`,
    keywords: `${data.position}, hire ${data.position}, ${data.position} ${locationString}, ${data.position} recruitment, ${data.position} placement, ${data.position} agency`,
    audience: {
      "@type": "Audience",
      audienceType: "Employers seeking professional staff",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${data.position} Placement Services`,
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: `Permanent ${data.position} Placement`,
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: `Temporary ${data.position} Placement`,
          },
        },
      ],
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
      "Premium yacht crew and private household staffing agency with 500+ satisfied clients, connecting verified candidates with discerning clients worldwide.",
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

  // FAQ Schema - Enhanced for AI/LLM consumption (use page FAQs if available, otherwise default)
  const faqItems = data.faq_content && data.faq_content.length > 0
    ? data.faq_content.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer.replace(/<[^>]*>/g, ''), // Strip HTML for structured data
        },
      }))
    : [
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
          text: `Typically 2-4 weeks from initial brief to placement, depending on specific requirements and availability. With 300+ placements per year, we can often present qualified shortlists within 48 hours.`,
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
      {
        "@type": "Question",
        name: `What qualifications should I look for in a ${data.position}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `For ${data.position} roles, we look for relevant experience, professional certifications, strong references, and cultural fit. Specific requirements vary by role level and client needs. Our consultants can help identify the ideal candidate profile for your specific situation.`,
        },
      },
      {
        "@type": "Question",
        name: `Can you help with temporary ${data.position} placements?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes, Lighthouse Careers provides both permanent and temporary ${data.position} placements. We have a network of professionals available for short-term assignments, seasonal positions, and temporary coverage needs.`,
        },
      },
      {
        "@type": "Question",
        name: `What is the typical salary range for a ${data.position} in ${locationString}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Salary ranges for ${data.position} positions vary based on experience level, responsibilities, and location. Market rates in ${locationString} typically range from entry-level to senior positions. Contact us for current market insights and salary guidance specific to your requirements.`,
        },
      },
      {
        "@type": "Question",
        name: `Do you provide ${data.position} candidates who speak multiple languages?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes, many of our ${data.position} candidates are multilingual. We can match candidates based on specific language requirements including English, French, Spanish, Italian, German, and other languages depending on your needs.`,
        },
      },
      {
        "@type": "Question",
        name: `What happens if a ${data.position} candidate doesn't work out?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `We offer replacement guarantees for permanent placements. If a candidate doesn't meet expectations within the guarantee period, we'll find a replacement at no additional cost. Our goal is ensuring the right fit for both client and candidate.`,
        },
      },
      {
        "@type": "Question",
        name: `How do you verify ${data.position} candidate references?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `We conduct comprehensive reference checks with previous employers, verifying employment dates, responsibilities, performance, and character. All references are verified directly with the source before candidates are presented to clients.`,
        },
      },
      {
        "@type": "Question",
        name: `Can you help with urgent ${data.position} hiring needs?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes, we specialize in urgent placements and can often present qualified ${data.position} candidates within 24-48 hours for immediate start positions. Our extensive network and pre-vetted candidate database enable fast turnaround times.`,
        },
      },
      {
        "@type": "Question",
        name: `What makes Lighthouse Careers different from other ${data.position} recruitment agencies?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Lighthouse Careers combines 20+ years of industry expertise with AI-powered matching technology. We have 500+ satisfied clients, 300+ placements per year, and a rigorous vetting process. Our success-fee model means we only succeed when you do.`,
        },
      },
      {
        "@type": "Question",
        name: `Do you provide ${data.position} candidates for both yacht and household positions?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes, Lighthouse Careers specializes in both yacht crew and private household staffing. Many ${data.position} professionals have experience in both environments, and we can match candidates based on your specific context and requirements.`,
        },
      },
      {
        "@type": "Question",
        name: `What background checks do you perform on ${data.position} candidates?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `We conduct comprehensive background checks including criminal record verification, employment history verification, education verification, and identity checks. All checks are performed by certified third-party providers following industry best practices.`,
        },
      },
      {
        "@type": "Question",
        name: `How do I get started hiring a ${data.position} through Lighthouse Careers?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Getting started is simple: contact us with your requirements, timeline, and any specific needs. We'll schedule a consultation to understand your needs, then search our network and present matched candidates. The process typically begins with a brief discussion of your requirements.`,
        },
      },
    ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    about: {
      "@type": "Thing",
      name: `${data.position} Recruitment Services in ${locationString}`,
    },
    mainEntity: faqItems,
  };

  // HowTo Schema - Hiring Process
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to Hire a ${data.position.charAt(0).toUpperCase() + data.position.slice(1)} in ${locationString}`,
    description: `Step-by-step guide to hiring a ${data.position} in ${locationString} through Lighthouse Careers`,
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Share Your Requirements",
        text: `Contact Lighthouse Careers and provide details about your ${data.position} position including role responsibilities, experience level needed, timeline, location (${locationString}), and any specific requirements such as languages, certifications, or special skills.`,
        url: `https://lighthouse-careers.com/${data.original_url_path}`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Review Matched Candidates",
        text: `Our AI-powered matching system searches our network of pre-vetted ${data.position} professionals. We present a shortlist of candidates matching your requirements, typically within 48 hours. Each candidate profile includes experience, qualifications, and why they're a good fit.`,
        url: `https://lighthouse-careers.com/${data.original_url_path}`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Interview & Select",
        text: `Review candidate profiles, conduct interviews, and check references. Our consultants provide full support throughout the interview process, including scheduling assistance and candidate background information.`,
        url: `https://lighthouse-careers.com/${data.original_url_path}`,
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Placement & Onboarding",
        text: `Once you've selected your ${data.position}, we assist with contract negotiation, onboarding support, and ensure a smooth transition. We offer replacement guarantees to ensure the right fit.`,
        url: `https://lighthouse-careers.com/${data.original_url_path}`,
      },
    ],
    totalTime: "P2W", // 2 weeks typical timeline
  };

  // Review Schema - Client Testimonials (use page testimonials if available)
  const reviewSchemas = data.testimonials && data.testimonials.length > 0
    ? data.testimonials.map((testimonial) => ({
        "@context": "https://schema.org",
        "@type": "Review",
        itemReviewed: {
          "@type": "Service",
          name: `${data.position} Placement Services in ${locationString}`,
          provider: {
            "@type": "Organization",
            name: "Lighthouse Careers",
          },
        },
        author: {
          "@type": "Person",
          name: testimonial.name,
          ...(testimonial.role && { jobTitle: testimonial.role }),
          ...(testimonial.company && { affiliation: { "@type": "Organization", name: testimonial.company } }),
        },
        reviewRating: {
          "@type": "Rating",
          ratingValue: String(testimonial.rating || 5),
          bestRating: "5",
          worstRating: "1",
        },
        reviewBody: testimonial.quote.replace(/<[^>]*>/g, ''), // Strip HTML
        datePublished: new Date().toISOString().split('T')[0],
      }))
    : [
        {
          "@context": "https://schema.org",
          "@type": "Review",
          itemReviewed: {
            "@type": "Service",
            name: `${data.position} Placement Services in ${locationString}`,
            provider: {
              "@type": "Organization",
              name: "Lighthouse Careers",
            },
          },
          author: {
            "@type": "Organization",
            name: "Lighthouse Careers Clients",
          },
          reviewRating: {
            "@type": "Rating",
            ratingValue: "4.9",
            bestRating: "5",
            worstRating: "1",
          },
          reviewBody: `Lighthouse Careers has successfully placed ${data.position} professionals in ${locationString} for hundreds of satisfied clients. Our clients consistently rate our service highly for professionalism, candidate quality, and personalized attention.`,
          datePublished: "2024-01-01",
        },
      ];

  // Article Schema - For blog content links (will be populated dynamically)
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Hiring a ${data.position.charAt(0).toUpperCase() + data.position.slice(1)} in ${locationString}: Complete Guide`,
    description: `Comprehensive guide to hiring a ${data.position} in ${locationString}, including salary ranges, qualifications, interview questions, and best practices.`,
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
    datePublished: new Date().toISOString().split('T')[0],
    dateModified: new Date().toISOString().split('T')[0],
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://lighthouse-careers.com/${data.original_url_path}`,
    },
  };

  // Answer Capsule Schema - Critical for AI/LLM Citations
  // When answer_capsule is available, create a dedicated Question/Answer schema
  // This appears at the top of the page and is designed to be easily extracted by AI systems
  const answerCapsuleSchema = data.answer_capsule
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name:
              data.answer_capsule_question ||
              `How do I hire a ${data.position} in ${locationString}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: data.answer_capsule,
              // Include date for freshness signal
              ...(data.last_reviewed_at && {
                dateModified: data.last_reviewed_at.split("T")[0],
              }),
            },
          },
        ],
        // Add key facts as additional structured context
        ...(data.key_facts &&
          data.key_facts.length > 0 && {
            about: {
              "@type": "Thing",
              name: `Hiring a ${data.position} in ${locationString}`,
              description: data.key_facts.join(". "),
            },
          }),
      }
    : null;

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      {reviewSchemas.map((review, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(review) }}
        />
      ))}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Answer Capsule Schema - Only rendered when answer_capsule is available */}
      {answerCapsuleSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(answerCapsuleSchema) }}
        />
      )}
    </>
  );
}
