import { Metadata } from "next";
import { generateMetadata as genMeta } from "@/lib/seo/metadata";

export const metadata: Metadata = genMeta({
  title: "Join Lighthouse Careers | Candidate Registration",
  description:
    "Join Lighthouse Careers to access elite yacht crew and private household staff positions. Create your profile, browse verified job listings, and get matched with top employers worldwide. Free to join.",
  keywords: [
    "join lighthouse careers",
    "candidate registration",
    "yacht crew jobs",
    "private household jobs",
    "create profile",
    "job board sign up",
    "yacht crew application",
  ],
  canonical: "https://lighthouse-careers.com/join",
  openGraph: {
    title: "Join Lighthouse Careers | Candidate Registration",
    description:
      "Join Lighthouse Careers to access elite yacht crew and private household staff positions. Create your profile and get matched with top employers worldwide.",
    type: "website",
    url: "https://lighthouse-careers.com/join",
    images: [
      {
        url: "https://lighthouse-careers.com/images/og-join.jpg",
        width: 1200,
        height: 630,
        alt: "Join Lighthouse Careers",
      },
    ],
  },
});

export default function JoinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

