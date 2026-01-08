import { Metadata } from "next";
import { PublicHeader } from "@/components/pricing/PublicHeader";
import { PublicFooter } from "@/components/pricing/PublicFooter";
import { FileText, Scale, AlertCircle, CheckCircle, XCircle, Mail } from "lucide-react";

import { generateMetadata as genMeta } from "@/lib/seo/metadata";

export const metadata: Metadata = genMeta({
  title: "Terms of Service | Lighthouse Careers",
  description:
    "Terms of Service for Lighthouse Careers. Read our terms and conditions for using our recruitment platform and services.",
  keywords: ["terms of service", "terms and conditions", "user agreement", "legal"],
  canonical: "https://lighthouse-careers.com/terms",
  robots: {
    index: true,
    follow: true,
  },
});

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        {/* Rich navy gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-800 via-navy-900 to-[#0c1525]" />

        {/* Warm champagne ambient light from top */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(195,165,120,0.15),transparent_60%)]" />

        {/* Subtle side accents for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_0%_50%,rgba(195,165,120,0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_100%_50%,rgba(195,165,120,0.06),transparent_50%)]" />

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="mb-6 inline-flex items-center rounded-full border border-gold-500/30 bg-gold-500/10 px-5 py-2 text-sm font-medium text-gold-300">
            <Scale className="mr-2 h-4 w-4" />
            Legal Terms
          </div>

          <h1 className="font-serif text-4xl font-semibold text-white sm:text-5xl">
            Terms of Service
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
            Please read these terms carefully before using our services. By using Lighthouse Careers,
            you agree to be bound by these terms and conditions.
          </p>

          <p className="mx-auto mt-4 text-sm text-gray-400">
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="prose prose-lg max-w-none">
            {/* Company Information */}
            <div className="mb-12 rounded-2xl border border-gray-200 bg-gray-50 p-8">
              <h2 className="mb-6 font-serif text-2xl font-semibold text-navy-900">
                Company Information
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Company Name:</strong> Lighthouse Careers
                </p>
                <p>
                  <strong>SIREN:</strong> 879 999 779
                </p>
                <p>
                  <strong>SIRET du Siège Social:</strong> 879 999 779 00033
                </p>
                <p>
                  <strong>Numéro de TVA:</strong> FR13879999779
                </p>
                <p>
                  <strong>Date de Création:</strong> 20 décembre 2019
                </p>
                <p>
                  <strong>Activité (NAF / APE):</strong> Activités des agences de placement de main-d&apos;oeuvre - 7810Z
                </p>
                <p>
                  <strong>Adresse:</strong> 6 B CHEMIN DES COUGOULINS, 06600 ANTIBES, France
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:admin@lighthouse-careers.com"
                    className="text-gold-600 hover:underline"
                  >
                    admin@lighthouse-careers.com
                  </a>
                </p>
              </div>
            </div>

            {/* Acceptance of Terms */}
            <div className="mb-12">
              <h2 className="mb-4 flex items-center gap-3 font-serif text-2xl font-semibold text-navy-900">
                <CheckCircle className="h-6 w-6 text-gold-600" />
                1. Acceptance of Terms
              </h2>
              <p className="mb-4 text-gray-700">
                By accessing or using the Lighthouse Careers website and services (the &quot;Service&quot;),
                you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to
                these Terms, you may not use our Service.
              </p>
              <p className="text-gray-700">
                These Terms apply to all users of the Service, including candidates, employers, and visitors
                to our website.
              </p>
            </div>

            {/* Description of Service */}
            <div className="mb-12">
              <h2 className="mb-4 flex items-center gap-3 font-serif text-2xl font-semibold text-navy-900">
                <FileText className="h-6 w-6 text-gold-600" />
                2. Description of Service
              </h2>
              <p className="mb-4 text-gray-700">
                Lighthouse Careers is a recruitment agency specializing in yacht crew and private household
                staff placement. Our Service includes:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
                <li>Job board and candidate matching platform</li>
                <li>Recruitment and placement services for employers</li>
                <li>Career services and job search assistance for candidates</li>
                <li>CV/resume hosting and profile management</li>
                <li>Communication tools between candidates and employers</li>
              </ul>
            </div>

            {/* User Accounts */}
            <div className="mb-12">
              <h2 className="mb-4 font-serif text-2xl font-semibold text-navy-900">
                3. User Accounts
              </h2>
              <p className="mb-4 text-gray-700">
                To use certain features of our Service, you must create an account. You agree to:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information to keep it accurate</li>
                <li>Maintain the security of your account credentials</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
              <p className="text-gray-700">
                We reserve the right to suspend or terminate accounts that violate these Terms or engage in
                fraudulent, abusive, or illegal activity.
              </p>
            </div>

            {/* User Obligations */}
            <div className="mb-12">
              <h2 className="mb-4 font-serif text-2xl font-semibold text-navy-900">
                4. User Obligations
              </h2>
              <p className="mb-4 text-gray-700">You agree not to:</p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
                <li>Provide false, misleading, or fraudulent information</li>
                <li>Impersonate any person or entity</li>
                <li>Upload or transmit any malicious code, viruses, or harmful content</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon intellectual property rights</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Collect or harvest information about other users without consent</li>
              </ul>
            </div>

            {/* Candidate Terms */}
            <div className="mb-12">
              <h2 className="mb-4 font-serif text-2xl font-semibold text-navy-900">
                5. Terms for Candidates
              </h2>
              <p className="mb-4 text-gray-700">
                As a candidate using our Service, you acknowledge and agree that:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
                <li>
                  You are responsible for the accuracy and completeness of your profile, CV, and all
                  information you provide
                </li>
                <li>
                  We may share your profile and information with potential employers who match your criteria
                </li>
                <li>
                  You grant us permission to use your information for recruitment purposes
                </li>
                <li>
                  We do not guarantee job placement or employment opportunities
                </li>
                <li>
                  You are responsible for verifying the legitimacy of employers and job opportunities
                </li>
                <li>
                  You will not contact employers directly to circumvent our service fees
                </li>
              </ul>
            </div>

            {/* Employer Terms */}
            <div className="mb-12">
              <h2 className="mb-4 font-serif text-2xl font-semibold text-navy-900">
                6. Terms for Employers
              </h2>
              <p className="mb-4 text-gray-700">
                As an employer using our Service, you acknowledge and agree that:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
                <li>
                  You will provide accurate job descriptions and requirements
                </li>
                <li>
                  You will comply with all applicable employment laws and regulations
                </li>
                <li>
                  You will treat candidate information confidentially and use it solely for recruitment purposes
                </li>
                <li>
                  You will not discriminate against candidates based on protected characteristics
                </li>
                <li>
                  Placement fees are due upon successful placement, as agreed in separate service agreements
                </li>
                <li>
                  You will not contact candidates directly to circumvent our service fees
                </li>
                <li>
                  You are responsible for conducting your own due diligence on candidates
                </li>
              </ul>
            </div>

            {/* Fees and Payment */}
            <div className="mb-12">
              <h2 className="mb-4 font-serif text-2xl font-semibold text-navy-900">
                7. Fees and Payment
              </h2>
              <p className="mb-4 text-gray-700">
                Our fee structure is as follows:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
                <li>
                  <strong>Candidates:</strong> Our services are free for candidates. We do not charge fees
                  for job seekers to use our platform.
                </li>
                <li>
                  <strong>Employers:</strong> Placement fees are charged to employers upon successful placement
                  of a candidate. Fees are specified in separate service agreements.
                </li>
                <li>
                  All fees are exclusive of applicable taxes (VAT, etc.) unless otherwise stated.
                </li>
                <li>
                  Payment terms and conditions are specified in individual service agreements.
                </li>
              </ul>
            </div>

            {/* Intellectual Property */}
            <div className="mb-12">
              <h2 className="mb-4 font-serif text-2xl font-semibold text-navy-900">
                8. Intellectual Property
              </h2>
              <p className="mb-4 text-gray-700">
                The Service, including its content, features, and functionality, is owned by Lighthouse Careers
                and is protected by French and international copyright, trademark, and other intellectual
                property laws.
              </p>
              <p className="mb-4 text-gray-700">
                You retain ownership of content you submit to the Service (such as your CV or profile
                information). However, by submitting content, you grant us a worldwide, non-exclusive,
                royalty-free license to use, reproduce, modify, and distribute your content for the purpose
                of providing our recruitment services.
              </p>
            </div>

            {/* Disclaimers */}
            <div className="mb-12">
              <h2 className="mb-4 flex items-center gap-3 font-serif text-2xl font-semibold text-navy-900">
                <AlertCircle className="h-6 w-6 text-gold-600" />
                9. Disclaimers
              </h2>
              <p className="mb-4 text-gray-700">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
                EITHER EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
                <li>Warranties of merchantability and fitness for a particular purpose</li>
                <li>Warranties that the Service will be uninterrupted, secure, or error-free</li>
                <li>Warranties regarding the accuracy, reliability, or completeness of information</li>
                <li>Warranties that we will successfully place candidates or find employment</li>
              </ul>
              <p className="text-gray-700">
                We do not guarantee job placement, employment, or specific outcomes. We are not responsible
                for the actions, conduct, or information of users or third parties.
              </p>
            </div>

            {/* Limitation of Liability */}
            <div className="mb-12">
              <h2 className="mb-4 font-serif text-2xl font-semibold text-navy-900">
                10. Limitation of Liability
              </h2>
              <p className="mb-4 text-gray-700">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, LIGHTHOUSE CAREERS SHALL NOT BE LIABLE FOR ANY
                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR
                REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR
                OTHER INTANGIBLE LOSSES.
              </p>
              <p className="mb-4 text-gray-700">
                Our total liability for any claims arising from or related to the Service shall not exceed
                the amount you paid to us in the twelve (12) months preceding the claim, or €100, whichever
                is greater.
              </p>
              <p className="text-gray-700">
                Nothing in these Terms excludes or limits our liability for death or personal injury caused
                by our negligence, fraud, or any other liability that cannot be excluded or limited under
                applicable law.
              </p>
            </div>

            {/* Indemnification */}
            <div className="mb-12">
              <h2 className="mb-4 font-serif text-2xl font-semibold text-navy-900">
                11. Indemnification
              </h2>
              <p className="mb-4 text-gray-700">
                You agree to indemnify, defend, and hold harmless Lighthouse Careers, its officers, directors,
                employees, and agents from and against any claims, liabilities, damages, losses, and expenses,
                including reasonable attorneys&apos; fees, arising out of or in any way connected with:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another party</li>
                <li>Your violation of any applicable laws or regulations</li>
              </ul>
            </div>

            {/* Termination */}
            <div className="mb-12">
              <h2 className="mb-4 flex items-center gap-3 font-serif text-2xl font-semibold text-navy-900">
                <XCircle className="h-6 w-6 text-gold-600" />
                12. Termination
              </h2>
              <p className="mb-4 text-gray-700">
                We may terminate or suspend your account and access to the Service immediately, without prior
                notice, for any reason, including if you breach these Terms.
              </p>
              <p className="mb-4 text-gray-700">
                You may terminate your account at any time by contacting us or using account deletion
                features (where available).
              </p>
              <p className="text-gray-700">
                Upon termination, your right to use the Service will cease immediately. Provisions of these
                Terms that by their nature should survive termination shall survive, including ownership
                provisions, warranty disclaimers, and limitations of liability.
              </p>
            </div>

            {/* Governing Law */}
            <div className="mb-12">
              <h2 className="mb-4 font-serif text-2xl font-semibold text-navy-900">
                13. Governing Law and Jurisdiction
              </h2>
              <p className="mb-4 text-gray-700">
                These Terms shall be governed by and construed in accordance with the laws of France, without
                regard to its conflict of law provisions.
              </p>
              <p className="text-gray-700">
                Any disputes arising out of or relating to these Terms or the Service shall be subject to the
                exclusive jurisdiction of the courts of Nice, France.
              </p>
            </div>

            {/* Changes to Terms */}
            <div className="mb-12">
              <h2 className="mb-4 font-serif text-2xl font-semibold text-navy-900">
                14. Changes to Terms
              </h2>
              <p className="mb-4 text-gray-700">
                We reserve the right to modify these Terms at any time. We will notify users of material
                changes by posting the updated Terms on this page and updating the &quot;Last updated&quot; date.
                Your continued use of the Service after such changes constitutes acceptance of the modified
                Terms.
              </p>
              <p className="text-gray-700">
                If you do not agree to the modified Terms, you must stop using the Service and may terminate
                your account.
              </p>
            </div>

            {/* Severability */}
            <div className="mb-12">
              <h2 className="mb-4 font-serif text-2xl font-semibold text-navy-900">
                15. Severability
              </h2>
              <p className="mb-4 text-gray-700">
                If any provision of these Terms is found to be unenforceable or invalid, that provision shall
                be limited or eliminated to the minimum extent necessary, and the remaining provisions shall
                remain in full force and effect.
              </p>
            </div>

            {/* Entire Agreement */}
            <div className="mb-12">
              <h2 className="mb-4 font-serif text-2xl font-semibold text-navy-900">
                16. Entire Agreement
              </h2>
              <p className="mb-4 text-gray-700">
                These Terms, together with our Privacy Policy and any separate service agreements, constitute
                the entire agreement between you and Lighthouse Careers regarding the Service and supersede
                all prior agreements and understandings.
              </p>
            </div>

            {/* Contact */}
            <div className="mb-12 rounded-2xl border border-gray-200 bg-gold-50 p-8">
              <h2 className="mb-4 flex items-center gap-3 font-serif text-2xl font-semibold text-navy-900">
                <Mail className="h-6 w-6 text-gold-600" />
                17. Contact Us
              </h2>
              <p className="mb-4 text-gray-700">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="space-y-2 text-gray-700">
                <p>
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:admin@lighthouse-careers.com"
                    className="text-gold-600 hover:underline"
                  >
                    admin@lighthouse-careers.com
                  </a>
                </p>
                <p>
                  <strong>Address:</strong> 6 B CHEMIN DES COUGOULINS, 06600 ANTIBES, France
                </p>
                <p>
                  <strong>Phone:</strong> +33 6 76 41 02 99
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}


