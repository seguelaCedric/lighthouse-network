import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agency Partner Program - Lighthouse Crew Network",
  description:
    "Join the network of elite yacht crew recruitment agencies. AI-powered matching, collaboration exchange, and timestamp authority. Currently in private beta.",
  keywords: [
    "yacht crew recruitment",
    "crew agency network",
    "recruitment collaboration",
    "yacht recruitment platform",
  ],
  openGraph: {
    title: "Agency Partner Program - Lighthouse Crew Network",
    description:
      "Join the network of elite yacht crew recruitment agencies. Currently in private beta.",
    type: "website",
  },
};

export default function AgencyProgramLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
