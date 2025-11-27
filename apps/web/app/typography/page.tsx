"use client";

import { cn } from "@/lib/utils";
import {
  DisplayHero,
  DisplayXL,
  DisplayLG,
  HeadingH1,
  HeadingH2,
  HeadingH3,
  HeadingH4,
  HeadingH5,
  HeadingH6,
  BodyXL,
  BodyLG,
  BodyMD,
  BodySM,
  BodyXS,
  LabelLG,
  LabelMD,
  LabelSM,
  Quote,
  StatNumber,
  Price,
  Code,
  TextLink,
  Text,
} from "@/components/ui/Typography";

// Style showcase card component
function StyleCard({
  name,
  specs,
  children,
  className,
}: {
  name: string;
  specs: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white p-6", className)}>
      <div className="mb-4 flex items-baseline justify-between border-b border-gray-100 pb-3">
        <span className="font-mono text-sm font-medium text-navy-600">{name}</span>
        <span className="text-xs text-gray-400">{specs}</span>
      </div>
      {children}
    </div>
  );
}

export default function TypographyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <header className="bg-gradient-to-b from-navy-900 to-navy-800 py-16 text-center">
        <div className="mx-auto max-w-4xl px-4">
          <p className="label-lg mb-4 text-gold-400">Typography System</p>
          <h1 className="display-xl mb-4 !text-white">Lighthouse Network</h1>
          <p className="body-lg mx-auto max-w-2xl !text-gray-300">
            A refined, editorial typography system designed for luxury yacht recruitment.
            Combining elegant serifs with clean sans-serif for a premium experience.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12">
        {/* Font Families Section */}
        <section className="mb-16">
          <LabelMD className="mb-2 !text-gold-600">Font Families</LabelMD>
          <HeadingH2 className="mb-8">Three Distinct Personalities</HeadingH2>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Cormorant Garamond */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <p className="label-sm mb-3 !text-gold-600">Primary - Headings</p>
              <h3 className="font-cormorant mb-2 text-4xl font-semibold text-navy-800">
                Cormorant Garamond
              </h3>
              <p className="body-sm mb-4">
                Elegant serif typeface for headlines and display text. Refined, editorial feel.
              </p>
              <div className="font-cormorant space-y-1 text-navy-700">
                <p className="text-lg">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                <p className="text-lg">abcdefghijklmnopqrstuvwxyz</p>
                <p className="text-lg">1234567890</p>
              </div>
            </div>

            {/* Inter */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <p className="label-sm mb-3 !text-gold-600">Secondary - UI & Body</p>
              <h3 className="font-inter mb-2 text-4xl font-semibold text-navy-800">Inter</h3>
              <p className="body-sm mb-4">
                Clean, highly legible sans-serif for body text, UI elements, and buttons.
              </p>
              <div className="font-inter space-y-1 text-navy-700">
                <p className="text-lg">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                <p className="text-lg">abcdefghijklmnopqrstuvwxyz</p>
                <p className="text-lg">1234567890</p>
              </div>
            </div>

            {/* JetBrains Mono */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <p className="label-sm mb-3 !text-gold-600">Monospace - Code</p>
              <h3 className="font-mono mb-2 text-4xl font-medium text-navy-800">JetBrains Mono</h3>
              <p className="body-sm mb-4">
                Monospace font for code snippets, IDs, and technical content.
              </p>
              <div className="font-mono space-y-1 text-navy-700">
                <p className="text-lg">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                <p className="text-lg">abcdefghijklmnopqrstuvwxyz</p>
                <p className="text-lg">1234567890</p>
              </div>
            </div>
          </div>
        </section>

        {/* Display Styles Section */}
        <section className="mb-16">
          <LabelMD className="mb-2 !text-gold-600">Display Styles</LabelMD>
          <HeadingH2 className="mb-8">Cormorant Garamond - For Impact</HeadingH2>

          <div className="space-y-6">
            <StyleCard name="display-hero" specs="80px / 88px / -0.02em / SemiBold">
              <DisplayHero>Excellence in Crew Recruitment</DisplayHero>
            </StyleCard>

            <StyleCard name="display-xl" specs="64px / 72px / -0.02em / SemiBold">
              <DisplayXL>Find Your Next Opportunity</DisplayXL>
            </StyleCard>

            <StyleCard name="display-lg" specs="48px / 56px / -0.01em / Medium">
              <DisplayLG>Premium Yacht Positions</DisplayLG>
            </StyleCard>
          </div>
        </section>

        {/* Heading Styles Section */}
        <section className="mb-16">
          <LabelMD className="mb-2 !text-gold-600">Heading Styles</LabelMD>
          <HeadingH2 className="mb-8">Mixed Serif & Sans-Serif</HeadingH2>

          <div className="grid gap-6 lg:grid-cols-2">
            <StyleCard name="heading-h1" specs="36px / 44px / Cormorant SemiBold">
              <HeadingH1>Chief Stewardess Position</HeadingH1>
            </StyleCard>

            <StyleCard name="heading-h2" specs="30px / 38px / Cormorant Medium">
              <HeadingH2>About This Opportunity</HeadingH2>
            </StyleCard>

            <StyleCard name="heading-h3" specs="24px / 32px / Inter SemiBold">
              <HeadingH3>Requirements & Qualifications</HeadingH3>
            </StyleCard>

            <StyleCard name="heading-h4" specs="20px / 28px / Inter Medium">
              <HeadingH4>Key Responsibilities</HeadingH4>
            </StyleCard>

            <StyleCard name="heading-h5" specs="18px / 26px / Inter Medium">
              <HeadingH5>Professional Experience</HeadingH5>
            </StyleCard>

            <StyleCard name="heading-h6" specs="16px / 24px / Inter Medium">
              <HeadingH6>Additional Skills</HeadingH6>
            </StyleCard>
          </div>
        </section>

        {/* Body Styles Section */}
        <section className="mb-16">
          <LabelMD className="mb-2 !text-gold-600">Body Styles</LabelMD>
          <HeadingH2 className="mb-8">Inter - For Readability</HeadingH2>

          <div className="space-y-6">
            <StyleCard name="body-xl" specs="20px / 32px / Regular">
              <BodyXL>
                We are seeking an exceptional Chief Stewardess to join our prestigious 65-meter
                motor yacht. The ideal candidate will bring years of experience in luxury
                hospitality, impeccable attention to detail, and a passion for creating
                unforgettable guest experiences.
              </BodyXL>
            </StyleCard>

            <StyleCard name="body-lg" specs="18px / 28px / Regular">
              <BodyLG>
                Our yacht operates year-round in the Mediterranean and Caribbean, hosting discerning
                guests who expect nothing but the finest service. You'll lead a team of four
                interior crew members and work closely with the Captain and Chef.
              </BodyLG>
            </StyleCard>

            <StyleCard name="body-md" specs="16px / 26px / Regular">
              <BodyMD>
                The successful candidate will have a minimum of three years' experience as Chief
                Stewardess on yachts of similar size. STCW certification and valid ENG1 medical are
                required. Fluency in English is essential; additional languages are a plus.
              </BodyMD>
            </StyleCard>

            <StyleCard name="body-sm" specs="14px / 22px / Regular">
              <BodySM>
                Applications close on February 15, 2024. Only shortlisted candidates will be
                contacted. Please ensure your profile is complete and includes all relevant
                certifications before applying.
              </BodySM>
            </StyleCard>

            <StyleCard name="body-xs" specs="12px / 18px / Regular">
              <BodyXS>
                Posted 3 days ago • 23 applicants • Position ID: JOB-2024-0142 • Reference required
              </BodyXS>
            </StyleCard>
          </div>
        </section>

        {/* Label Styles Section */}
        <section className="mb-16">
          <LabelMD className="mb-2 !text-gold-600">Label Styles</LabelMD>
          <HeadingH2 className="mb-8">Uppercase - For Hierarchy</HeadingH2>

          <div className="grid gap-6 md:grid-cols-3">
            <StyleCard name="label-lg" specs="14px / uppercase / 0.08em">
              <LabelLG>Featured Position</LabelLG>
            </StyleCard>

            <StyleCard name="label-md" specs="12px / uppercase / 0.08em">
              <LabelMD>Premium Verified</LabelMD>
            </StyleCard>

            <StyleCard name="label-sm" specs="10px / uppercase / 0.1em">
              <LabelSM>Available Now</LabelSM>
            </StyleCard>
          </div>
        </section>

        {/* Special Styles Section */}
        <section className="mb-16">
          <LabelMD className="mb-2 !text-gold-600">Special Styles</LabelMD>
          <HeadingH2 className="mb-8">Purpose-Built Typography</HeadingH2>

          <div className="grid gap-6 lg:grid-cols-2">
            <StyleCard name="quote" specs="24px / 36px / Cormorant Italic">
              <Quote>
                "Working with Lighthouse Network transformed our recruitment process. Their
                attention to detail and understanding of the yachting industry is unparalleled."
              </Quote>
              <BodySM className="mt-4">— Captain James Williams, M/Y Serenity</BodySM>
            </StyleCard>

            <StyleCard name="stat-number" specs="48px / 1 / Inter Bold / -0.02em">
              <div className="flex items-baseline gap-2">
                <StatNumber>2,847</StatNumber>
                <BodyMD>Active candidates</BodyMD>
              </div>
            </StyleCard>

            <StyleCard name="price" specs="24px / 1.2 / Inter SemiBold">
              <div className="flex items-baseline gap-2">
                <Price>€6,500 - €7,500</Price>
                <BodySM>/month</BodySM>
              </div>
            </StyleCard>

            <StyleCard name="code" specs="14px / JetBrains Mono">
              <div className="space-y-2">
                <p className="body-sm">Candidate ID:</p>
                <Code>CND-2024-00847</Code>
              </div>
            </StyleCard>
          </div>
        </section>

        {/* Text Colors Section */}
        <section className="mb-16">
          <LabelMD className="mb-2 !text-gold-600">Text Colors</LabelMD>
          <HeadingH2 className="mb-8">Semantic Color System</HeadingH2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Primary Text", color: "text-navy-800", bg: "bg-white", value: "#111827" },
              { name: "Secondary Text", color: "text-gray-500", bg: "bg-white", value: "#7D796F" },
              { name: "Tertiary Text", color: "text-gray-400", bg: "bg-white", value: "#A8A49B" },
              { name: "Inverse Text", color: "text-gray-50", bg: "bg-navy-900", value: "#FAFAF8" },
              { name: "Link Text", color: "text-gold-600", bg: "bg-white", value: "#9A7F45" },
              { name: "Link Hover", color: "text-gold-700", bg: "bg-white", value: "#7D6636" },
            ].map((item) => (
              <div
                key={item.name}
                className={cn(
                  "flex items-center justify-between rounded-lg border border-gray-200 p-4",
                  item.bg
                )}
              >
                <span className={cn("font-medium", item.color)}>{item.name}</span>
                <code className="font-mono text-xs text-gray-400">{item.value}</code>
              </div>
            ))}
          </div>
        </section>

        {/* Pairing Example Section */}
        <section className="mb-16">
          <LabelMD className="mb-2 !text-gold-600">In Practice</LabelMD>
          <HeadingH2 className="mb-8">Serif & Sans-Serif Pairing</HeadingH2>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 md:p-12">
            <LabelMD className="mb-4 !text-gold-600">Featured Opportunity</LabelMD>
            <HeadingH1 className="mb-4">Chief Stewardess</HeadingH1>
            <HeadingH2 className="mb-6 !text-gray-500">M/Y Serenity • 65m Motor Yacht</HeadingH2>

            <BodyXL className="mb-8">
              An exceptional opportunity to join one of the most prestigious yachts in the
              Mediterranean fleet. We're seeking a seasoned professional with impeccable service
              standards and natural leadership abilities.
            </BodyXL>

            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <HeadingH4 className="mb-3">Requirements</HeadingH4>
                <ul className="space-y-2">
                  <li className="body-md flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold-500" />
                    Minimum 3 years as Chief Stewardess
                  </li>
                  <li className="body-md flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold-500" />
                    Experience on 50m+ motor yachts
                  </li>
                  <li className="body-md flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold-500" />
                    Valid STCW and ENG1 certifications
                  </li>
                </ul>
              </div>

              <div>
                <HeadingH4 className="mb-3">Compensation</HeadingH4>
                <div className="mb-2 flex items-baseline gap-2">
                  <Price>€6,500 - €7,500</Price>
                  <BodySM>/month</BodySM>
                </div>
                <BodySM>
                  Plus tips, medical insurance, and crew travel allowance. Permanent position with
                  rotation schedule.
                </BodySM>
              </div>
            </div>

            <div className="mt-8 border-t border-gray-100 pt-6">
              <Quote className="mb-4">
                "The best crew I've ever worked with. Professional, dedicated, and truly passionate
                about hospitality."
              </Quote>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-navy-100 font-semibold text-navy-600">
                  JW
                </div>
                <div>
                  <BodySM className="font-medium !text-navy-800">Captain James Williams</BodySM>
                  <BodyXS>M/Y Serenity</BodyXS>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Text Component Demo */}
        <section className="mb-16">
          <LabelMD className="mb-2 !text-gold-600">Component API</LabelMD>
          <HeadingH2 className="mb-8">Unified Text Component</HeadingH2>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="body-sm mb-4 text-gray-500">
              Use the unified <Code>Text</Code> component with variant prop for flexibility:
            </p>
            <div className="space-y-4 rounded-lg bg-gray-50 p-4 font-mono text-sm">
              <p>
                <span className="text-purple-600">{'<Text'}</span>
                <span className="text-navy-600">{' variant='}</span>
                <span className="text-success-600">"h1"</span>
                <span className="text-purple-600">{'>'}</span>
                Page Title
                <span className="text-purple-600">{'</Text>'}</span>
              </p>
              <p>
                <span className="text-purple-600">{'<Text'}</span>
                <span className="text-navy-600">{' variant='}</span>
                <span className="text-success-600">"body-lg"</span>
                <span className="text-purple-600">{'>'}</span>
                Body text...
                <span className="text-purple-600">{'</Text>'}</span>
              </p>
              <p>
                <span className="text-purple-600">{'<Text'}</span>
                <span className="text-navy-600">{' variant='}</span>
                <span className="text-success-600">"label-md"</span>
                <span className="text-purple-600">{'>'}</span>
                Section Label
                <span className="text-purple-600">{'</Text>'}</span>
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <Text variant="h1">Using Text Component - H1</Text>
              <Text variant="body-lg">This is body-lg variant using the unified Text component.</Text>
              <Text variant="label-md">Label via Text Component</Text>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 text-center">
        <BodySM>
          Lighthouse Network Typography System • Designed for luxury yacht crew recruitment
        </BodySM>
      </footer>
    </div>
  );
}
