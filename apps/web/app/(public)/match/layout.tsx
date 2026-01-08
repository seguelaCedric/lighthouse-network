import { Metadata } from "next";
import { generateMetadata as genMeta } from "@/lib/seo/metadata";

export const metadata: Metadata = genMeta({
  title: "AI-Powered Candidate Matching | Lighthouse Careers",
  description:
    "Find the perfect candidate match using our AI-powered search. Search by skills, experience, location, and more. Get instant results with match quality scores. Free for employers.",
  keywords: [
    "candidate matching",
    "AI recruitment",
    "find candidates",
    "candidate search",
    "recruitment matching",
    "talent search",
    "candidate database",
  ],
  canonical: "https://lighthouse-careers.com/match",
  openGraph: {
    title: "AI-Powered Candidate Matching | Lighthouse Careers",
    description:
      "Find the perfect candidate match using our AI-powered search. Get instant results with match quality scores.",
    type: "website",
    url: "https://lighthouse-careers.com/match",
    images: [
      {
        url: "https://lighthouse-careers.com/images/og-match.jpg",
        width: 1200,
        height: 630,
        alt: "AI-Powered Candidate Matching",
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

