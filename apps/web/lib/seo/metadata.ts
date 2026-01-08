import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lighthouse-careers.com";
const siteName = "Lighthouse Careers";
const defaultDescription =
  "Premium yacht crew and private household staffing agency with 500+ satisfied clients. Connecting verified candidates with discerning clients worldwide since 2002.";

export interface SEOConfig {
  title: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  openGraph?: {
    title?: string;
    description?: string;
    type?: "website" | "article" | "profile";
    url?: string;
    images?: Array<{
      url: string;
      width?: number;
      height?: number;
      alt?: string;
    }>;
    locale?: string;
  };
  twitter?: {
    card?: "summary" | "summary_large_image" | "app" | "player";
    title?: string;
    description?: string;
    images?: string[];
    creator?: string;
    site?: string;
  };
  robots?: {
    index?: boolean;
    follow?: boolean;
    googleBot?: {
      index?: boolean;
      follow?: boolean;
      "max-snippet"?: number;
      "max-image-preview"?: "none" | "standard" | "large";
      "max-video-preview"?: number;
    };
  };
  noindex?: boolean;
  nofollow?: boolean;
}

/**
 * Generate comprehensive Next.js Metadata object from SEO config
 * Optimized for search engines and AI/LLM consumption
 */
export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description = defaultDescription,
    keywords = [],
    canonical,
    openGraph,
    twitter,
    robots,
    noindex = false,
    nofollow = false,
  } = config;

  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const canonicalUrl = canonical || baseUrl;
  const ogUrl = openGraph?.url || canonicalUrl;

  // Default Open Graph image
  const defaultOGImage = {
    url: `${baseUrl}/images/og-default.jpg`,
    width: 1200,
    height: 630,
    alt: `${siteName} - ${title}`,
  };

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: openGraph?.title || fullTitle,
      description: openGraph?.description || description,
      type: openGraph?.type || "website",
      url: ogUrl,
      siteName,
      locale: openGraph?.locale || "en_US",
      images: openGraph?.images || [defaultOGImage],
    },
    twitter: {
      card: twitter?.card || "summary_large_image",
      title: twitter?.title || fullTitle,
      description: twitter?.description || description,
      images: twitter?.images || [defaultOGImage.url],
      creator: twitter?.creator || "@lighthousecareers",
      site: twitter?.site || "@lighthousecareers",
    },
    robots: robots || {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
    metadataBase: new URL(baseUrl),
    applicationName: siteName,
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
  };

  return metadata;
}

/**
 * Common SEO keywords for yacht crew recruitment
 */
export const yachtCrewKeywords = [
  "yacht crew recruitment",
  "yacht crew agency",
  "superyacht crew",
  "yacht jobs",
  "yacht crew positions",
  "captain recruitment",
  "yacht stewardess",
  "yacht chef recruitment",
  "yacht engineer jobs",
  "deckhand jobs",
  "chief stew jobs",
  "yacht crew placement",
  "superyacht jobs",
  "luxury yacht crew",
];

/**
 * Common SEO keywords for private household staff
 */
export const privateStaffKeywords = [
  "private staff recruitment",
  "butler recruitment",
  "estate manager recruitment",
  "private household staff",
  "luxury household staff",
  "nanny recruitment",
  "housekeeper recruitment",
  "private chef recruitment",
  "household manager",
  "personal assistant recruitment",
  "domestic staff agency",
  "UHNW household staff",
  "private staff agency",
  "luxury hospitality jobs",
];

/**
 * Combined keywords for general pages
 */
export const generalKeywords = [
  ...yachtCrewKeywords,
  ...privateStaffKeywords,
  "recruitment agency",
  "staffing agency",
  "luxury recruitment",
  "premium staffing",
  "verified candidates",
  "vetted staff",
];

