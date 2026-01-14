import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PublicHeader } from "@/components/pricing/PublicHeader";
import { PublicFooter } from "@/components/pricing/PublicFooter";
import { Button } from "@/components/ui/button";
import { LeadCapture } from "@/components/marketing/LeadCapture";
import {
  Ship,
  Users,
  ChefHat,
  Anchor,
  Wrench,
  Sparkles,
  Crown,
  Baby,
  Briefcase,
  DollarSign,
  TrendingUp,
  MapPin,
  Award,
  CheckCircle,
  Download,
  ArrowRight,
  Info,
  Shield,
  HelpCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Free 2026 Salary Guide | Yacht Crew & Private Household Salaries | Lighthouse Careers",
  description:
    "Comprehensive 2026 salary guide for yacht crew and private household staff. Get industry-standard salary ranges by yacht size (24m-100m+) and property type. Includes Captain, Stewardess, Chef, Butler, Estate Manager, Nanny salaries. Based on 300+ real placements.",
  keywords: [
    "yacht crew salary",
    "yacht crew salary guide 2026",
    "private household salary",
    "salary guide 2026",
    "yacht crew pay",
    "stewardess salary",
    "captain salary",
    "butler salary",
    "house manager salary",
    "estate manager salary",
    "nanny salary",
    "private chef salary",
    "yacht engineer salary",
    "chief stewardess salary",
    "superyacht crew salary",
    "private staff salary",
    "household staff salary",
    "family office salary",
    "yacht crew compensation",
    "private household compensation",
  ],
  openGraph: {
    title: "Free 2026 Salary Guide | Yacht Crew & Private Household Salaries",
    description:
      "Know your worth. Comprehensive 2026 salary ranges for yacht crew (by yacht size) and private household staff (by property type). Based on 300+ real placements from Lighthouse Careers.",
    type: "website",
    url: "https://lighthouse-careers.com/salary-guide/",
    siteName: "Lighthouse Careers",
    images: [
      {
        url: "https://lighthouse-careers.com/images/og-salary-guide.jpg",
        width: 1200,
        height: 630,
        alt: "2026 Salary Guide - Yacht Crew & Private Household Salaries",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free 2026 Salary Guide | Yacht Crew & Private Household",
    description: "Know your worth. Get comprehensive 2026 salary ranges for yacht crew and private household positions.",
    images: ["https://lighthouse-careers.com/images/og-salary-guide.jpg"],
  },
  alternates: {
    canonical: "https://lighthouse-careers.com/salary-guide/",
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
};

// Yacht Crew Salary Data - Organized by Yacht Size
const yachtSizeRanges = [
  { label: "24–30m", key: "24-30" },
  { label: "30–40m", key: "30-40" },
  { label: "40–50m", key: "40-50" },
  { label: "50–70m", key: "50-70" },
  { label: "70–80m", key: "70-80" },
  { label: "80–100m", key: "80-100" },
  { label: "100m+", key: "100+" },
];

const deckSalaries = {
  "24-30": {
    Captain: { min: 6000, max: 9500 },
    "Chief Officer / Mate": { min: 3500, max: 5500 },
    "2nd Officer": null,
    "3rd Officer": null,
    Bosun: { min: 3000, max: 4200 },
    Deckhand: { min: 2200, max: 3200 },
  },
  "30-40": {
    Captain: { min: 7500, max: 12000 },
    "Chief Officer / Mate": { min: 4200, max: 6500 },
    "2nd Officer": null,
    "3rd Officer": null,
    Bosun: { min: 3200, max: 4800 },
    Deckhand: { min: 2300, max: 3400 },
  },
  "40-50": {
    Captain: { min: 9000, max: 14000 },
    "Chief Officer / Mate": { min: 5000, max: 7500 },
    "2nd Officer": { min: 3800, max: 5500 },
    "3rd Officer": null,
    Bosun: { min: 3500, max: 5500 },
    Deckhand: { min: 2400, max: 3600 },
  },
  "50-70": {
    Captain: { min: 12000, max: 18000 },
    "Chief Officer / Mate": { min: 6000, max: 9000 },
    "2nd Officer": { min: 4500, max: 6500 },
    "3rd Officer": null,
    Bosun: { min: 4000, max: 6000 },
    Deckhand: { min: 2700, max: 4000 },
  },
  "70-80": {
    Captain: { min: 14000, max: 20000 },
    "Chief Officer / Mate": { min: 7000, max: 10000 },
    "2nd Officer": { min: 5000, max: 7000 },
    "3rd Officer": { min: 4000, max: 5500 },
    Bosun: { min: 4500, max: 6500 },
    Deckhand: { min: 3000, max: 4500 },
  },
  "80-100": {
    Captain: { min: 16000, max: 24000 },
    "Chief Officer / Mate": { min: 8000, max: 12000 },
    "2nd Officer": { min: 5500, max: 8000 },
    "3rd Officer": { min: 4500, max: 6000 },
    Bosun: { min: 5000, max: 7000 },
    Deckhand: { min: 3200, max: 4800 },
  },
  "100+": {
    Captain: { min: 20000, max: 30000 },
    "Chief Officer / Mate": { min: 10000, max: 14000 },
    "2nd Officer": { min: 6500, max: 9000 },
    "3rd Officer": { min: 5000, max: 7000 },
    Bosun: { min: 5500, max: 8000 },
    Deckhand: { min: 3500, max: 5200 },
  },
};

const engineeringSalaries = {
  "30-40": {
    "Chief Engineer": { min: 5500, max: 8000 },
    "2nd Engineer": null,
    "3rd Engineer": null,
    Motorman: null,
    "ETO / AV-IT": null,
  },
  "40-50": {
    "Chief Engineer": { min: 6000, max: 9500 },
    "2nd Engineer": { min: 4500, max: 6000 },
    "3rd Engineer": null,
    Motorman: null,
    "ETO / AV-IT": null,
  },
  "50-70": {
    "Chief Engineer": { min: 7000, max: 11000 },
    "2nd Engineer": { min: 5500, max: 6500 },
    "3rd Engineer": null,
    Motorman: null,
    "ETO / AV-IT": { min: 6000, max: 9000 },
  },
  "70-80": {
    "Chief Engineer": { min: 8000, max: 12000 },
    "2nd Engineer": { min: 6000, max: 8000 },
    "3rd Engineer": { min: 4000, max: 5500 },
    Motorman: null,
    "ETO / AV-IT": { min: 6500, max: 10000 },
  },
  "80-100": {
    "Chief Engineer": { min: 9000, max: 14000 },
    "2nd Engineer": { min: 6500, max: 9000 },
    "3rd Engineer": { min: 4500, max: 6500 },
    Motorman: { min: 3500, max: 5000 },
    "ETO / AV-IT": { min: 7000, max: 11000 },
  },
  "100+": {
    "Chief Engineer": { min: 10000, max: 16000 },
    "2nd Engineer": { min: 7000, max: 10000 },
    "3rd Engineer": { min: 5000, max: 7000 },
    Motorman: { min: 4000, max: 5500 },
    "ETO / AV-IT": { min: 8000, max: 12500 },
  },
};

const interiorSalaries = {
  "24-30": {
    "Chief Stew": null,
    "2nd Stew": null,
    "Junior Stew": null,
    "Solo Stew": { min: 3000, max: 4500 },
    Purser: null,
  },
  "30-40": {
    "Chief Stew": { min: 3800, max: 5500 },
    "2nd Stew": { min: 3200, max: 4500 },
    "Junior Stew": { min: 2400, max: 3400 },
    "Solo Stew": null,
    Purser: null,
  },
  "40-50": {
    "Chief Stew": { min: 4500, max: 6500 },
    "2nd Stew": { min: 3800, max: 5200 },
    "Junior Stew": { min: 2600, max: 3600 },
    "Solo Stew": null,
    Purser: null,
  },
  "50-70": {
    "Chief Stew": { min: 5500, max: 8000 },
    "2nd Stew": { min: 4500, max: 6000 },
    "Junior Stew": { min: 2800, max: 4000 },
    "Solo Stew": null,
    Purser: { min: 6000, max: 8500 },
  },
  "70-80": {
    "Chief Stew": { min: 6500, max: 9500 },
    "2nd Stew": { min: 5000, max: 6500 },
    "Junior Stew": { min: 3000, max: 4200 },
    "Solo Stew": null,
    Purser: { min: 7000, max: 9500 },
  },
  "80-100": {
    "Chief Stew": { min: 7000, max: 10500 },
    "2nd Stew": { min: 5500, max: 7000 },
    "Junior Stew": { min: 3200, max: 4500 },
    "Solo Stew": null,
    Purser: { min: 7500, max: 10500 },
  },
  "100+": {
    "Chief Stew": { min: 8000, max: 12000 },
    "2nd Stew": { min: 6000, max: 8000 },
    "Junior Stew": { min: 3500, max: 5000 },
    "Solo Stew": null,
    Purser: { min: 8000, max: 12000 },
  },
};

const galleySalaries = {
  "24-30": {
    "Head / Exec Chef": null,
    "Sous Chef": null,
    "Crew Chef": null,
    "Chef/Stew": { min: 4000, max: 6000 },
  },
  "30-40": {
    "Head / Exec Chef": { min: 4500, max: 6500 },
    "Sous Chef": null,
    "Crew Chef": null,
    "Chef/Stew": null,
  },
  "40-50": {
    "Head / Exec Chef": { min: 6000, max: 7500 },
    "Sous Chef": null,
    "Crew Chef": null,
    "Chef/Stew": null,
  },
  "50-70": {
    "Head / Exec Chef": { min: 7500, max: 10000 },
    "Sous Chef": { min: 4500, max: 6500 },
    "Crew Chef": null,
    "Chef/Stew": null,
  },
  "70-80": {
    "Head / Exec Chef": { min: 8500, max: 11500 },
    "Sous Chef": { min: 5500, max: 7000 },
    "Crew Chef": { min: 4000, max: 6000 },
    "Chef/Stew": null,
  },
  "80-100": {
    "Head / Exec Chef": { min: 9000, max: 12000 },
    "Sous Chef": { min: 6000, max: 8000 },
    "Crew Chef": { min: 4500, max: 6500 },
    "Chef/Stew": null,
  },
  "100+": {
    "Head / Exec Chef": { min: 10000, max: 14000 },
    "Sous Chef": { min: 6500, max: 9000 },
    "Crew Chef": { min: 5000, max: 7000 },
    "Chef/Stew": null,
  },
};

// Private Household Salary Data - Organized by Category and Property/Service Level
const householdExecutiveSalaries = {
  "Single Residence": {
    "Estate Manager / House Manager": { min: 120000, max: 180000 },
    "Director of Residences": null,
    "Chief of Staff (Private Principal)": { min: 180000, max: 260000 },
    "Family Office COO": null,
    "Lifestyle / Operations Director": { min: 150000, max: 220000 },
  },
  "Multi-Property / Global": {
    "Estate Manager / House Manager": { min: 160000, max: 240000 },
    "Director of Residences": { min: 200000, max: 300000 },
    "Chief of Staff (Private Principal)": { min: 220000, max: 320000 },
    "Family Office COO": { min: 220000, max: 320000 },
    "Lifestyle / Operations Director": { min: 200000, max: 300000 },
  },
  "Family Office / Complex": {
    "Estate Manager / House Manager": { min: 200000, max: 300000 },
    "Director of Residences": { min: 250000, max: 400000 },
    "Chief of Staff (Private Principal)": { min: 300000, max: 450000 },
    "Family Office COO": { min: 280000, max: 450000 },
    "Lifestyle / Operations Director": { min: 260000, max: 400000 },
  },
};

const householdServiceSalaries = {
  "Small Team / Single Home": {
    "Head Butler": { min: 110000, max: 160000 },
    Butler: { min: 80000, max: 120000 },
    "Household Manager": { min: 90000, max: 140000 },
    "Senior Housekeeper": { min: 70000, max: 110000 },
    Housekeeper: { min: 45000, max: 65000 },
  },
  "Large Estate": {
    "Head Butler": { min: 140000, max: 200000 },
    Butler: { min: 100000, max: 150000 },
    "Household Manager": { min: 120000, max: 180000 },
    "Senior Housekeeper": { min: 90000, max: 140000 },
    Housekeeper: { min: 55000, max: 80000 },
  },
  "Multiple Homes": {
    "Head Butler": { min: 180000, max: 250000 },
    Butler: { min: 130000, max: 180000 },
    "Household Manager": { min: 160000, max: 220000 },
    "Senior Housekeeper": { min: 120000, max: 160000 },
    Housekeeper: { min: 65000, max: 95000 },
  },
};

const householdCulinarySalaries = {
  "Standard Residence": {
    "Private Executive Chef": { min: 120000, max: 180000 },
    "Sous Chef": { min: 80000, max: 120000 },
    "Kitchen Assistant": { min: 45000, max: 65000 },
  },
  "Formal / Entertaining": {
    "Private Executive Chef": { min: 160000, max: 240000 },
    "Sous Chef": { min: 100000, max: 150000 },
    "Kitchen Assistant": { min: 55000, max: 80000 },
  },
  "Ultra-Luxury": {
    "Private Executive Chef": { min: 220000, max: 320000 },
    "Sous Chef": { min: 140000, max: 200000 },
    "Kitchen Assistant": { min: 65000, max: 95000 },
  },
};

const householdPersonalSupportSalaries = {
  Standard: {
    "Personal Assistant": { min: 70000, max: 110000 },
    "Executive Assistant": { min: 90000, max: 140000 },
    "Travel / Lifestyle Manager": { min: 90000, max: 140000 },
    "Wardrobe Manager": { min: 70000, max: 110000 },
  },
  "High-Profile": {
    "Personal Assistant": { min: 110000, max: 180000 },
    "Executive Assistant": { min: 140000, max: 220000 },
    "Travel / Lifestyle Manager": { min: 140000, max: 220000 },
    "Wardrobe Manager": { min: 100000, max: 160000 },
  },
  "Global / Travel": {
    "Personal Assistant": { min: 180000, max: 260000 },
    "Executive Assistant": { min: 220000, max: 320000 },
    "Travel / Lifestyle Manager": { min: 200000, max: 300000 },
    "Wardrobe Manager": { min: 140000, max: 200000 },
  },
};

const householdFamilyEducationSalaries = {
  Standard: {
    Nanny: { min: 60000, max: 90000 },
    "Governess / Tutor": { min: 80000, max: 120000 },
    "Wellness / PA Hybrid": { min: 80000, max: 120000 },
    "Private Trainer / Therapist": { min: 70000, max: 120000 },
  },
  Specialist: {
    Nanny: { min: 90000, max: 130000 },
    "Governess / Tutor": { min: 120000, max: 180000 },
    "Wellness / PA Hybrid": { min: 120000, max: 180000 },
    "Private Trainer / Therapist": { min: 120000, max: 180000 },
  },
  "Elite / Diplomatic": {
    Nanny: { min: 140000, max: 200000 },
    "Governess / Tutor": { min: 180000, max: 260000 },
    "Wellness / PA Hybrid": { min: 160000, max: 240000 },
    "Private Trainer / Therapist": { min: 180000, max: 260000 },
  },
};

const householdTransportSecuritySalaries = {
  Standard: {
    Chauffeur: { min: 55000, max: 80000 },
    "Close Protection Officer": { min: 90000, max: 140000 },
    "Security Director": null,
    "Head of Security": null,
    "Cyber / Digital Security": { min: 90000, max: 140000 },
  },
  "High-Security": {
    Chauffeur: { min: 80000, max: 120000 },
    "Close Protection Officer": { min: 140000, max: 220000 },
    "Security Director": { min: 180000, max: 260000 },
    "Head of Security": { min: 200000, max: 300000 },
    "Cyber / Digital Security": { min: 140000, max: 220000 },
  },
  "Global / Multi-Asset": {
    Chauffeur: { min: 120000, max: 160000 },
    "Close Protection Officer": { min: 200000, max: 320000 },
    "Security Director": { min: 250000, max: 400000 },
    "Head of Security": { min: 300000, max: 450000 },
    "Cyber / Digital Security": { min: 220000, max: 320000 },
  },
};

const householdTechnicalSalaries = {
  "Small Estate": {
    "Estate Engineer / Maintenance Manager": { min: 70000, max: 110000 },
    "Grounds Manager": { min: 60000, max: 100000 },
    "Smart Home / IT Manager": { min: 80000, max: 120000 },
    "Facilities Manager": { min: 90000, max: 140000 },
  },
  "Large Estate": {
    "Estate Engineer / Maintenance Manager": { min: 110000, max: 160000 },
    "Grounds Manager": { min: 100000, max: 150000 },
    "Smart Home / IT Manager": { min: 120000, max: 180000 },
    "Facilities Manager": { min: 140000, max: 200000 },
  },
  "Multi-Estate": {
    "Estate Engineer / Maintenance Manager": { min: 150000, max: 220000 },
    "Grounds Manager": { min: 140000, max: 200000 },
    "Smart Home / IT Manager": { min: 180000, max: 260000 },
    "Facilities Manager": { min: 200000, max: 300000 },
  },
};

const householdCategories = [
  { key: "executive", label: "Executive & Operations Management", data: householdExecutiveSalaries, positions: ["Estate Manager / House Manager", "Director of Residences", "Chief of Staff (Private Principal)", "Family Office COO", "Lifestyle / Operations Director"], icon: Briefcase },
  { key: "service", label: "Household Leadership & Service", data: householdServiceSalaries, positions: ["Head Butler", "Butler", "Household Manager", "Senior Housekeeper", "Housekeeper"], icon: Crown },
  { key: "culinary", label: "Culinary (Private)", data: householdCulinarySalaries, positions: ["Private Executive Chef", "Sous Chef", "Kitchen Assistant"], icon: ChefHat },
  { key: "personal", label: "Personal Support & Lifestyle", data: householdPersonalSupportSalaries, positions: ["Personal Assistant", "Executive Assistant", "Travel / Lifestyle Manager", "Wardrobe Manager"], icon: Users },
  { key: "family", label: "Family, Education & Wellness", data: householdFamilyEducationSalaries, positions: ["Nanny", "Governess / Tutor", "Wellness / PA Hybrid", "Private Trainer / Therapist"], icon: Baby },
  { key: "transport", label: "Transport, Security & Technical", data: householdTransportSecuritySalaries, positions: ["Chauffeur", "Close Protection Officer", "Security Director", "Head of Security", "Cyber / Digital Security"], icon: Shield },
  { key: "technical", label: "Technical, Maintenance & Estate Support", data: householdTechnicalSalaries, positions: ["Estate Engineer / Maintenance Manager", "Grounds Manager", "Smart Home / IT Manager", "Facilities Manager"], icon: Wrench },
];

const factors = [
  {
    icon: Ship,
    title: "Yacht Size",
    description: "Larger yachts (70m+) typically offer higher salaries due to increased responsibilities and guest expectations.",
  },
  {
    icon: MapPin,
    title: "Location",
    description: "Mediterranean and Caribbean markets have different salary ranges. Some regions offer higher compensation for seasonal work.",
  },
  {
    icon: Award,
    title: "Experience & Certifications",
    description: "Years of experience, specialized certifications (WSET, MCA licenses), and proven track record significantly impact salary.",
  },
  {
    icon: TrendingUp,
    title: "Contract Type",
    description: "Permanent positions often offer better packages than seasonal. Rotational positions may have different structures.",
  },
];

// Structured Data Schemas for SEO
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Lighthouse Careers",
  url: "https://lighthouse-careers.com",
  logo: "https://lighthouse-careers.com/images/logo.png",
  description: "Premier yacht crew and private staff recruitment agency with over 20 years of industry experience.",
  foundingDate: "2020",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+33-6-52-92-83-60",
    contactType: "customer service",
    availableLanguage: ["English", "French"],
  },
  sameAs: [
    "https://www.linkedin.com/company/lighthouse-careers",
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://lighthouse-careers.com" },
    { "@type": "ListItem", position: 2, name: "Salary Guide", item: "https://lighthouse-careers.com/salary-guide/" },
  ],
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Free 2026 Salary Guide: Yacht Crew & Private Household Salaries",
  description: "Comprehensive 2026 salary guide with industry-standard salary ranges for yacht crew positions (by yacht size) and private household staff (by property type). Based on 300+ real placements.",
  author: {
    "@type": "Organization",
    name: "Lighthouse Careers",
    url: "https://lighthouse-careers.com",
  },
  publisher: {
    "@type": "Organization",
    name: "Lighthouse Careers",
    logo: {
      "@type": "ImageObject",
      url: "https://lighthouse-careers.com/images/logo.png",
    },
  },
  datePublished: "2026-01-01",
  dateModified: new Date().toISOString().split("T")[0],
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": "https://lighthouse-careers.com/salary-guide/",
  },
  image: "https://lighthouse-careers.com/images/og-salary-guide.jpg",
  keywords: "yacht crew salary, private household salary, salary guide 2026, yacht crew pay, stewardess salary, captain salary, butler salary",
  articleSection: "Career Resources",
  inLanguage: "en-US",
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Use the 2026 Salary Guide",
  description: "Learn how to use our comprehensive salary guide to understand salary ranges for yacht crew and private household positions.",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Identify Your Position",
      text: "Find your position category: Yacht Crew (Deck, Engineering, Interior, Galley) or Private Household (Management, Service, Culinary, Personal Support, Family/Education, Security, Technical).",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Determine Yacht Size or Property Type",
      text: "For yacht crew: Identify your yacht size range (24-30m, 30-40m, 40-50m, 50-70m, 70-80m, 80-100m, 100m+). For household staff: Determine property type (Single Residence, Multi-Property, Large Estate, etc.).",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Find Your Salary Range",
      text: "Locate your position in the matrix and find the corresponding salary range for your yacht size or property type. All yacht crew salaries are monthly (€/month), household salaries are annual (€/year).",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Consider Market Adjusters",
      text: "Add 10-30% for UHNWI/public profile principals, roles spanning yacht+jet+residences, on-call/live-in positions, US/Monaco/Switzerland/Middle East locations, or confidentiality requirements.",
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What salary ranges are included in the 2026 salary guide?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The guide includes comprehensive salary ranges for yacht crew positions (Captain, Officers, Engineers, Stewardesses, Chefs) organized by yacht size (24m-100m+), and private household positions (Estate Managers, Butlers, Chefs, Nannies, etc.) organized by property type and service level. All yacht crew salaries are monthly (€/month), while household salaries are annual (€/year).",
      },
    },
    {
      "@type": "Question",
      name: "Are tips and bonuses included in the salary ranges?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. All figures represent base salary only. Tips, bonuses, rotation uplifts (for yacht crew), housing, cars, and schooling (for household staff) are NOT included. These are baseline market bands for private and charter positions.",
      },
    },
    {
      "@type": "Question",
      name: "How do yacht sizes affect salary?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Larger yachts (70m+) typically offer significantly higher salaries due to increased responsibilities, guest expectations, and crew size. For example, a Captain on a 24-30m yacht earns €6,000-9,500/month, while on a 100m+ yacht, the range is €20,000-30,000+/month.",
      },
    },
    {
      "@type": "Question",
      name: "What factors can increase household staff salaries?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Add 10-30% for: UHNWI/public profile principals, roles spanning yacht+jet+residences, on-call/live-in/heavy travel positions, US/Monaco/Switzerland/Middle East jurisdictions, or confidentiality/NDA/diplomatic sensitivity requirements.",
      },
    },
    {
      "@type": "Question",
      name: "Are the salary ranges based on real market data?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. All salary ranges are based on 2026 market data from 300+ real placements by Lighthouse Careers, a premier recruitment agency with over 20 years of industry experience.",
      },
    },
    {
      "@type": "Question",
      name: "Do salaries vary by location?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The guide uses Europe/Monaco/Switzerland/UK as baseline. US and Middle East markets typically offer 15-35% higher salaries. Mediterranean and Caribbean markets also have different salary ranges for seasonal work.",
      },
    },
  ],
};

// Yacht Crew Matrix - Yacht sizes as rows, positions as columns
function YachtSalaryMatrixTable({
  title,
  data,
  positions,
  icon: Icon,
  noteText,
}: {
  title: string;
  data: Record<string, Record<string, { min: number; max: number } | null>>;
  positions: string[];
  icon: any;
  noteText?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100">
          <Icon className="h-6 w-6 text-gold-600" />
        </div>
        <h3 className="font-serif text-2xl font-semibold text-navy-900">{title}</h3>
      </div>
      {noteText && (
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs text-amber-800">{noteText}</p>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b-2 border-gray-300 bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-semibold text-navy-900 sticky left-0 bg-gray-50 z-10">
                Yacht Size
              </th>
              {positions.map((position) => (
                <th key={position} className="px-3 py-3 text-center text-xs font-semibold text-navy-900 whitespace-nowrap">
                  {position}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {yachtSizeRanges
              .filter((size) => data[size.key]) // Only show sizes that have data
              .map((size) => {
                const sizeData = data[size.key];
                return (
                  <tr key={size.key} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-navy-900 sticky left-0 bg-white z-10 whitespace-nowrap">
                      {size.label}
                    </td>
                    {positions.map((position) => {
                      const salary = sizeData[position];
                      return (
                        <td key={position} className="px-3 py-3 text-center text-sm">
                          {salary ? (
                            <span className="font-medium text-navy-900">
                              €{salary.min.toLocaleString()}
                              {salary.max ? `–€${salary.max.toLocaleString()}` : "+"}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Household Matrix - Roles as rows, property/service levels as columns
function HouseholdSalaryMatrixTable({
  title,
  data,
  positions,
  icon: Icon,
}: {
  title: string;
  data: Record<string, Record<string, { min: number; max: number } | null>>;
  positions: string[];
  icon: any;
}) {
  const columnHeaders = Object.keys(data);
  
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100">
          <Icon className="h-6 w-6 text-gold-600" />
        </div>
        <h3 className="font-serif text-2xl font-semibold text-navy-900">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b-2 border-gray-300 bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-semibold text-navy-900 sticky left-0 bg-gray-50 z-10">
                Role
              </th>
              {columnHeaders.map((header) => (
                <th key={header} className="px-3 py-3 text-center text-xs font-semibold text-navy-900 whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {positions.map((position) => (
              <tr key={position} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-navy-900 sticky left-0 bg-white z-10">
                  {position}
                </td>
                {columnHeaders.map((header) => {
                  const salary = data[header]?.[position];
                  return (
                    <td key={header} className="px-3 py-3 text-center text-sm">
                      {salary ? (
                        <span className="font-medium text-navy-900">
                          €{salary.min.toLocaleString()}
                          {salary.max ? `–€${salary.max.toLocaleString()}` : "+"}
                          <span className="text-xs text-gray-500 block mt-1">/year</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SalaryTable({ title, salaries, icon: Icon }: { title: string; salaries: Array<{ position: string; min: number; max: number; notes: string }>; icon: any }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100">
          <Icon className="h-6 w-6 text-gold-600" />
        </div>
        <h3 className="font-serif text-2xl font-semibold text-navy-900">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-sm font-semibold text-navy-900">Position</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-navy-900">Monthly Salary (€)</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-navy-900">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {salaries.map((role, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-navy-900">{role.position}</td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-navy-900">
                    €{role.min.toLocaleString()}
                    {role.max ? ` - €${role.max.toLocaleString()}` : "+"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{role.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface SalaryGuidePageProps {
  searchParams?: { print?: string };
}

export default function SalaryGuidePage({ searchParams }: SalaryGuidePageProps) {
  const isPrintView = searchParams?.print === "true";

  return (
    <div className="min-h-screen bg-white print:bg-white">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {!isPrintView && <PublicHeader />}

      {/* Hero Section */}
      <section className={`relative overflow-hidden ${isPrintView ? 'bg-white' : 'min-h-[70vh]'}`}>
        {!isPrintView && (
          <>
            {/* Rich navy gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-navy-800 via-navy-900 to-[#0c1525]" />

            {/* Warm champagne ambient light from top */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(195,165,120,0.15),transparent_60%)]" />

            {/* Subtle side accents for depth */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_0%_50%,rgba(195,165,120,0.06),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_100%_50%,rgba(195,165,120,0.06),transparent_50%)]" />

            {/* Art Deco sunburst pattern */}
            <div className="absolute inset-0 opacity-[0.15]">
              <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <radialGradient id="sunburst-fade" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#C3A578" stopOpacity="1"/>
                    <stop offset="100%" stopColor="#C3A578" stopOpacity="0.3"/>
                  </radialGradient>
                </defs>
                <g stroke="url(#sunburst-fade)" strokeWidth="0.5" fill="none">
                  {/* Radiating lines from center */}
                  {[...Array(36)].map((_, i) => {
                    const angle = (i * 10) * (Math.PI / 180);
                    const x2 = Math.round((50 + 70 * Math.cos(angle)) * 100) / 100;
                    const y2 = Math.round((50 + 70 * Math.sin(angle)) * 100) / 100;
                    return <line key={i} x1="50%" y1="50%" x2={`${x2}%`} y2={`${y2}%`} />;
                  })}
                </g>
                {/* Concentric arcs */}
                <circle cx="50%" cy="50%" r="15%" fill="none" stroke="#C3A578" strokeWidth="0.3" opacity="0.5"/>
                <circle cx="50%" cy="50%" r="30%" fill="none" stroke="#C3A578" strokeWidth="0.3" opacity="0.4"/>
                <circle cx="50%" cy="50%" r="45%" fill="none" stroke="#C3A578" strokeWidth="0.3" opacity="0.3"/>
              </svg>
            </div>
          </>
        )}

        <div className={`relative mx-auto ${isPrintView ? 'max-w-6xl px-4 py-20 text-center sm:px-6' : 'flex min-h-[70vh] max-w-6xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6'}`}>
          <div className={`mb-6 inline-flex items-center rounded-full border ${isPrintView ? 'border-gold-600 bg-gold-100 text-gold-800' : 'border-gold-500/30 bg-gold-500/10 text-gold-300 backdrop-blur-sm'} px-5 py-2 text-sm font-medium`}>
            <DollarSign className="mr-2 h-4 w-4" />
            Free 2026 Salary Guide
          </div>

          <h1 className={`font-serif text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl ${isPrintView ? 'text-navy-900' : 'text-white'}`}>
            Free 2026 Salary Guide: Yacht Crew & Private Household Salaries
          </h1>

          <p className={`mx-auto mt-6 max-w-2xl text-lg sm:text-xl ${isPrintView ? '!text-gray-700' : 'text-gray-300'}`}>
            Know your worth. Get comprehensive industry-standard salary ranges for yacht crew positions (by yacht size) and private household staff (by property type). Based on 300+ real placements from Lighthouse Careers.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="#yacht-salaries">
              <Button size="lg" className="min-w-[200px]">
                <Ship className="mr-2 h-5 w-5" />
                Yacht Crew Salaries
              </Button>
            </a>
            {!isPrintView && (
              <>
                <a href="#household-salaries">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="min-w-[200px] border-white/20 text-white hover:bg-white/10"
                  >
                    <Users className="mr-2 h-5 w-5" />
                    Household Salaries
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Info Banner */}
      <section className="border-b border-gray-200 bg-gray-50 py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Info className="h-5 w-5 text-gold-600" />
              <span className="font-medium">Yacht crew: €/month | Household: €/year</span>
            </div>
            <div className="hidden h-4 w-px bg-gray-300 sm:block" />
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Based on 2026 market data from 300+ placements</span>
            </div>
          </div>
        </div>
      </section>

      {/* Yacht Crew Salaries */}
      <section id="yacht-salaries" className="py-20 sm:py-28" itemScope itemType="https://schema.org/Article">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              Yacht Crew Salary Ranges 2026: Complete Guide by Yacht Size
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Comprehensive salary data organized by yacht size (24m-100m+). Salaries vary significantly based on vessel size, with larger yachts (70m+) offering higher compensation due to increased responsibilities and guest expectations. All salaries shown in EUR per month. For more information about yacht crew positions, visit our <Link href="/yacht-crew" className="text-gold-600 hover:text-gold-700 underline">yacht crew recruitment page</Link>.
            </p>
          </div>

          <div className="space-y-8">
            <YachtSalaryMatrixTable
              title="Bridge / Deck"
              data={deckSalaries}
              positions={["Captain", "Chief Officer / Mate", "2nd Officer", "3rd Officer", "Bosun", "Deckhand"]}
              icon={Anchor}
              noteText="All figures = base salary €/month (2026 realistic hiring ranges). Tips, bonuses, rotation uplifts NOT included. Private & charter baseline market bands."
            />
            <YachtSalaryMatrixTable
              title="Engineering / Technical"
              data={engineeringSalaries}
              positions={["Chief Engineer", "2nd Engineer", "3rd Engineer", "Motorman", "ETO / AV-IT"]}
              icon={Wrench}
            />
            <YachtSalaryMatrixTable
              title="Interior / Administration"
              data={interiorSalaries}
              positions={["Chief Stew", "2nd Stew", "Junior Stew", "Solo Stew", "Purser"]}
              icon={Sparkles}
            />
            <YachtSalaryMatrixTable
              title="Galley"
              data={galleySalaries}
              positions={["Head / Exec Chef", "Sous Chef", "Crew Chef", "Chef/Stew"]}
              icon={ChefHat}
            />
          </div>
        </div>
      </section>

      {/* Private Household Salaries */}
      <section id="household-salaries" className="bg-gray-50 py-20 sm:py-28" itemScope itemType="https://schema.org/Article">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              Private Household & Family Office Salary Ranges 2026: Complete Guide
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Comprehensive salary data organized by role category and property/service level. Salaries vary significantly based on residence type (Single Residence, Multi-Property, Large Estate), service level (Standard, High-Profile, Ultra-Luxury), and geographic location. All salaries shown in EUR per year. Learn more about <Link href="/private-staff" className="text-gold-600 hover:text-gold-700 underline">private household staff recruitment</Link>.
            </p>
          </div>

          <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> All figures = base salary per year (EUR, net-to-gross varies by country). Bonuses, housing, cars, schooling not included. Europe / Monaco / Switzerland / UK baseline (US & Middle East usually +15–35%).
            </p>
          </div>

          <div className="space-y-8">
            {householdCategories.map((category) => {
              const Icon = category.icon;
              return (
                <HouseholdSalaryMatrixTable
                  key={category.key}
                  title={category.label}
                  data={category.data}
                  positions={category.positions}
                  icon={Icon}
                />
              );
            })}
          </div>

          {/* Market Reality Adjusters */}
          <div className="mt-12 rounded-2xl border border-gold-200 bg-gold-50 p-6">
            <h3 className="mb-4 font-serif text-xl font-semibold text-navy-900">
              2026 Market Reality Adjusters
            </h3>
            <p className="mb-4 text-sm text-gray-700">
              Add <strong>+10–30%</strong> when:
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-gold-600 flex-shrink-0" />
                <span>Principal is <strong>UHNWI / public profile</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-gold-600 flex-shrink-0" />
                <span>Role spans <strong>yacht + jet + residences</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-gold-600 flex-shrink-0" />
                <span>Staff is <strong>on-call / live-in / heavy travel</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-gold-600 flex-shrink-0" />
                <span>Jurisdiction is <strong>US, Monaco, Switzerland, Middle East</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-gold-600 flex-shrink-0" />
                <span><strong>Confidentiality, NDAs, or diplomatic sensitivity</strong> applies</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Factors Affecting Salary */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              Key Factors That Affect Salary in 2026
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Understanding what influences compensation in yacht crew and private household positions. These factors can significantly impact your earning potential.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {factors.map((factor, index) => {
              const Icon = factor.icon;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gold-100">
                    <Icon className="h-6 w-6 text-gold-600" />
                  </div>
                  <h3 className="mb-2 font-semibold text-navy-900">{factor.title}</h3>
                  <p className="text-sm text-gray-600">{factor.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Lead Capture Section */}
      <LeadCapture />

      {/* Call-to-Action Section for PDF */}
      <section className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 py-16 print:bg-white print:py-12 print:break-inside-avoid">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="rounded-3xl border-2 border-gold-500/30 bg-gradient-to-br from-gold-500/10 to-gold-500/5 p-10 print:border-2 print:border-gold-600 print:bg-white print:shadow-xl print:p-12">
            <div className="text-center print:mb-10">
              <h2 className="font-serif text-4xl font-semibold text-white print:text-4xl print:text-navy-900 sm:text-5xl">
                Ready to Take the Next Step?
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-300 print:text-lg print:text-gray-700">
                Whether you're looking for your next role or need to hire exceptional talent, Lighthouse Careers is here to help.
              </p>
            </div>

            <div className="mt-10 grid gap-8 sm:grid-cols-2 print:grid-cols-2 print:gap-8">
              {/* For Candidates */}
              <div className="flex flex-col p-2 print:border-2 print:border-gray-200 print:bg-white print:shadow-lg print:p-8 print:rounded-2xl">
                <div className="mb-4 flex items-center gap-4 print:mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/20 print:bg-gold-100 print:h-16 print:w-16">
                    <Users className="h-6 w-6 text-gold-300 print:text-gold-600 print:h-8 print:w-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-white print:text-xl print:text-navy-900">For Candidates</h3>
                </div>
                <p className="mb-6 flex-grow text-base leading-relaxed text-gray-300 print:text-base print:text-gray-700">
                  Create your profile and get matched with opportunities that fit your experience and salary expectations.
                </p>
                <div className="space-y-3 print:space-y-3">
                  <Link
                    href="/auth/register"
                    className="block rounded-lg bg-gold-500 px-6 py-3.5 text-center text-base font-semibold text-navy-900 transition-colors hover:bg-gold-400 print:border-2 print:border-gold-600 print:bg-white print:py-3 print:text-gold-700 print:hover:bg-gold-50"
                  >
                    Create Your Profile →
                  </Link>
                  <Link
                    href="/job-board"
                    className="block rounded-lg bg-white/10 px-6 py-3.5 text-center text-base font-semibold text-white transition-colors hover:bg-white/20 print:border-2 print:border-gray-300 print:bg-white print:text-navy-900 print:hover:bg-gray-50"
                  >
                    Browse Open Positions →
                  </Link>
                </div>
              </div>

              {/* For Employers */}
              <div className="flex flex-col p-2 print:border-2 print:border-gray-200 print:bg-white print:shadow-lg print:p-8 print:rounded-2xl">
                <div className="mb-4 flex items-center gap-4 print:mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/20 print:bg-gold-100 print:h-16 print:w-16">
                    <Briefcase className="h-6 w-6 text-gold-300 print:text-gold-600 print:h-8 print:w-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-white print:text-xl print:text-navy-900">For Employers</h3>
                </div>
                <p className="mb-6 flex-grow text-base leading-relaxed text-gray-300 print:text-base print:text-gray-700">
                  Looking to hire yacht crew or private household staff? Get in touch with our team.
                </p>
                <div className="space-y-3 print:space-y-3">
                  <Link
                    href="/contact"
                    className="block rounded-lg bg-gold-500 px-6 py-3.5 text-center text-base font-semibold text-navy-900 transition-colors hover:bg-gold-400 print:border-2 print:border-gold-600 print:bg-white print:py-3 print:text-gold-700 print:hover:bg-gold-50"
                  >
                    Contact Us →
                  </Link>
                  <Link
                    href="/hire"
                    className="block rounded-lg bg-white/10 px-6 py-3.5 text-center text-base font-semibold text-white transition-colors hover:bg-white/20 print:border-2 print:border-gray-300 print:bg-white print:text-navy-900 print:hover:bg-gray-50"
                  >
                    Register as Employer →
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center print:mt-8">
              <p className="text-base text-gray-400 print:text-base print:text-gray-700">
                Questions?{" "}
                <a href="tel:+33652928360" className="font-semibold text-gold-300 hover:text-gold-200 print:text-gold-600">
                  Call us
                </a>
                {" "}or{" "}
                <a href="mailto:admin@lighthouse-careers.com" className="font-semibold text-gold-300 hover:text-gold-200 print:text-gold-600">
                  send an email
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section for SEO */}
      <section className="py-20 sm:py-28 bg-white" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 id="faq-heading" className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              Frequently Asked Questions About 2026 Salaries
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Common questions about yacht crew and private household salary ranges.
            </p>
          </div>
          <div className="space-y-4">
            {faqSchema.mainEntity.map((faq, index) => (
              <details
                key={index}
                className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg"
              >
                <summary className="flex cursor-pointer items-center justify-between font-semibold text-navy-900 text-lg list-none">
                  <span className="pr-4">{faq.name}</span>
                  <HelpCircle className="h-5 w-5 flex-shrink-0 text-gold-600 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-4 prose prose-sm max-w-none text-gray-700">
                  {faq.acceptedAnswer.text}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Resources */}
      <section className="bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              Ready to Find Your Next Role?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Browse open positions or get matched to roles that fit your experience and salary expectations. Lighthouse Careers places 300+ candidates per year in yacht crew and private household positions worldwide.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/job-board">
              <Button size="lg" className="min-w-[220px]">
                Browse Open Positions
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="secondary" size="lg" className="min-w-[220px]">
                Create Your Profile
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {!isPrintView && <PublicFooter />}
    </div>
  );
}

