import { Metadata } from "next";
import { generateMetadata as genMeta } from "@/lib/seo/metadata";

export const metadata: Metadata = genMeta({
  title: "AI-Powered Candidate Search | Lighthouse Careers",
  description:
    "Find the perfect candidate using our AI-powered search. Search by skills, experience, location, and more. Get instant results with fit scores. Free for employers.",
  keywords: [
    "candidate search",
    "AI recruitment",
    "find candidates",
    "candidate database",
    "recruitment search",
    "talent search",
    "candidate fit",
  ],
  canonical: "https://lighthouse-careers.com/match",
  openGraph: {
    title: "AI-Powered Candidate Search | Lighthouse Careers",
    description:
      "Find the perfect candidate using our AI-powered search. Get instant results with fit scores.",
    type: "website",
    url: "https://lighthouse-careers.com/match",
    images: [
      {
        url: "https://lighthouse-careers.com/images/og-match.jpg",
        width: 1200,
        height: 630,
        alt: "AI-Powered Candidate Search",
      },
    ],
  },
});

export default function MatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

