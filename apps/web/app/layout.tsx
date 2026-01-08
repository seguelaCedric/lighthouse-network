import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Cormorant_Garamond } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { GlobalStructuredData } from "@/components/seo/GlobalStructuredData";
import "./globals.css";

// Sans-serif: Primary UI font
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// Serif: Editorial/luxury headings
const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

// Monospace: Code and data
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Lighthouse Careers | Premium Yacht Crew & Private Household Staff Recruitment",
    template: "%s | Lighthouse Careers",
  },
  description:
    "Premium yacht crew and private household staffing agency with 500+ satisfied clients. Connecting verified candidates with discerning clients worldwide since 2002. Browse jobs, find candidates, and connect with verified professionals.",
  keywords: [
    "yacht crew recruitment",
    "private household staff",
    "superyacht jobs",
    "butler recruitment",
    "estate manager",
    "luxury staffing",
    "yacht jobs",
    "private staff agency",
  ],
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://lighthouse-careers.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://lighthouse-careers.com",
    siteName: "Lighthouse Careers",
    title: "Lighthouse Careers | Premium Yacht Crew & Private Household Staff Recruitment",
    description:
      "Premium yacht crew and private household staffing agency with 500+ satisfied clients. Connecting verified candidates with discerning clients worldwide.",
    images: [
      {
        url: "/images/og-default.jpg",
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
    images: ["/images/og-default.jpg"],
    creator: "@lighthousecareers",
    site: "@lighthousecareers",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || "https://lighthouse-careers.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} ${cormorantGaramond.variable} ${jetbrainsMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <GlobalStructuredData />
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
