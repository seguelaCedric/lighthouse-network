import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private Household Staff Recruitment | Butlers, Estate Managers, Nannies | Lighthouse",
  description: "Find exceptional private household staff within 48 hours. Butlers, Estate Managers, Housekeepers, Nannies - 14+ years matching rare talents with luxury households worldwide. No upfront fees.",
  keywords: [
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
  ],
  openGraph: {
    title: "Private Household Staff Recruitment | Lighthouse Careers",
    description: "Find vetted private staff in 48 hours. Butlers, Estate Managers, Nannies for luxury households worldwide. No upfront fees.",
    type: "website",
    url: "https://lighthouse-careers.com/private-staff/",
    siteName: "Lighthouse Careers",
    locale: "en_US",
    images: [
      {
        url: "https://lighthouse-careers.com/images/og-private-staff.jpg",
        width: 1200,
        height: 630,
        alt: "Lighthouse Careers - Private Household Staff Recruitment",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Private Household Staff Recruitment | Lighthouse",
    description: "Find vetted private staff in 48 hours. No upfront fees.",
    images: ["https://lighthouse-careers.com/images/og-private-staff.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://lighthouse-careers.com/private-staff/",
  },
};

export default function PrivateStaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
