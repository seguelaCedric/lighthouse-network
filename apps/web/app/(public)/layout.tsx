import { Metadata } from "next";
import { generateMetadata as genMeta } from "@/lib/seo/metadata";

export const metadata: Metadata = genMeta({
  title: "Lighthouse Careers | Premium Yacht Crew & Private Household Staff Recruitment",
  description:
    "Premium yacht crew and private household staffing agency with 500+ satisfied clients. Browse jobs, find candidates, and connect with verified professionals worldwide. No upfront fees, same-day candidates, 20+ years of trust.",
  keywords: [
    "yacht crew recruitment",
    "private household staff",
    "superyacht jobs",
    "butler recruitment",
    "estate manager",
    "luxury staffing",
    "yacht jobs",
    "private staff agency",
    "yacht crew agency",
    "household staff placement",
  ],
  canonical: "https://lighthouse-careers.com",
  openGraph: {
    title: "Lighthouse Careers | Premium Yacht Crew & Private Household Staff Recruitment",
    description:
      "Premium yacht crew and private household staffing agency with 500+ satisfied clients. Browse jobs, find candidates, and connect with verified professionals worldwide.",
    type: "website",
    url: "https://lighthouse-careers.com",
    images: [
      {
        url: "https://lighthouse-careers.com/images/og-home.jpg",
        width: 1200,
        height: 630,
        alt: "Lighthouse Careers - Premium Recruitment Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lighthouse Careers | Premium Yacht Crew & Private Household Staff Recruitment",
    description:
      "Premium yacht crew and private household staffing agency with 500+ satisfied clients worldwide.",
    images: ["https://lighthouse-careers.com/images/og-home.jpg"],
  },
});

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

