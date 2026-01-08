import { Metadata } from "next";
import { PublicHeader } from "@/components/pricing/PublicHeader";
import { PublicFooter } from "@/components/pricing/PublicFooter";
import { Shield, FileText, Lock, Eye, UserCheck, Mail } from "lucide-react";

import { generateMetadata as genMeta } from "@/lib/seo/metadata";

export const metadata: Metadata = genMeta({
  title: "Privacy Policy | Lighthouse Careers",
  description:
    "Privacy Policy for Lighthouse Careers. Learn how we collect, use, and protect your personal information in compliance with GDPR and French data protection laws.",
  keywords: ["privacy policy", "data protection", "GDPR", "privacy", "data security"],
  canonical: "https://lighthouse-careers.com/privacy",
  robots: {
    index: true,
    follow: true,
  },
});

export default function PrivacyPage() {
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
            <Shield className="mr-2 h-4 w-4" />
            Your Privacy Matters
          </div>

          <h1 className="font-serif text-4xl font-semibold text-white sm:text-5xl">
            Privacy Policy
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
            We are committed to protecting your personal data and respecting your privacy.
            This policy explains how we collect, use, and safeguard your information.
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

            {/* Data Controller */}
            <div className="mb-12">
              <h2 className="mb-4 flex items-center gap-3 font-serif text-2xl font-semibold text-navy-900">
                <UserCheck className="h-6 w-6 text-gold-600" />
                1. Data Controller
              </h2>
              <p className="mb-4 text-gray-700">
                Lighthouse Careers, with the company details listed above, is the data controller
                responsible for processing your personal data in accordance with the General Data
                Protection Regulation (GDPR) and French data protection laws (Loi Informatique et Libertés).
              </p>
            </div>

            {/* Information We Collect */}
            <div className="mb-12">
              <h2 className="mb-4 flex items-center gap-3 font-serif text-2xl font-semibold text-navy-900">
                <FileText className="h-6 w-6 text-gold-600" />
                2. Information We Collect
              </h2>
              <p className="mb-4 text-gray-700">
                We collect and process the following categories of personal data:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
                <li>
                  <strong>Identity Data:</strong> Name, title, date of birth, nationality
                </li>
                <li>
                  <strong>Contact Data:</strong> Email address, telephone number, postal address
                </li>
                <li>
                  <strong>Professional Data:</strong> CV/resume, work history, qualifications, certifications,
                  references, salary expectations, availability
                </li>
                <li>
                  <strong>Technical Data:</strong> IP address, browser type, device information, usage data
                </li>
                <li>
                  <strong>Marketing Data:</strong> Preferences for receiving marketing communications
                </li>
                <li>
                  <strong>Financial Data:</strong> Payment information (processed securely through third-party
                  payment processors)
                </li>
              </ul>
            </div>

            {/* How We Use Your Information */}
            <div className="mb-12">
              <h2 className="mb-4 flex items-center gap-3 font-serif text-2xl font-semibold text-navy-900">
                <Eye className="h-6 w-6 text-gold-600" />
                3. How We Use Your Information
              </h2>
              <p className="mb-4 text-gray-700">
                We use your personal data for the following purposes:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
                <li>
                  <strong>Recruitment Services:</strong> To match candidates with job opportunities and assist
                  employers in finding suitable candidates
                </li>
                <li>
                  <strong>Communication:</strong> To respond to your inquiries, send job alerts, and provide
                  updates about our services
                </li>
                <li>
                  <strong>Service Improvement:</strong> To analyze usage patterns and improve our platform
                </li>
                <li>
                  <strong>Legal Compliance:</strong> To comply with legal obligations, including employment law
                  and data protection regulations
                </li>
                <li>
                  <strong>Marketing:</strong> To send you relevant information about our services (with your
                  consent where required)
                </li>
                <li>
                  <strong>Fraud Prevention:</strong> To detect and prevent fraudulent activity
                </li>
              </ul>
            </div>

            {/* Legal Basis */}
            <div className="mb-12">
              <h2 className="mb-4 font-serif text-2xl font-semibold text-navy-900">
                4. Legal Basis for Processing
              </h2>
              <p className="mb-4 text-gray-700">
                We process your personal data based on the following legal grounds:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
                <li>
                  <strong>Consent:</strong> When you have given clear consent for us to process your data for
                  specific purposes
                </li>
                <li>
                  <strong>Contract:</strong> To perform our contractual obligations to you
                </li>
                <li>
                  <strong>Legal Obligation:</strong> To comply with legal requirements
                </li>
                <li>
                  <strong>Legitimate Interests:</strong> For our legitimate business interests, such as improving
                  our services and preventing fraud
                </li>
              </ul>
            </div>

            {/* Data Sharing */}
            <div className="mb-12">
              <h2 className="mb-4 font-serif text-2xl font-semibold text-navy-900">
                5. Data Sharing and Disclosure
              </h2>
              <p className="mb-4 text-gray-700">
                We may share your personal data with:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
                <li>
                  <strong>Employers and Clients:</strong> Potential employers who are looking for candidates
                  matching your profile (with your explicit consent)
                </li>
                <li>
                  <strong>Service Providers:</strong> Third-party service providers who assist us in operating
                  our platform (e.g., cloud hosting, payment processing, email services)
                </li>
                <li>
                  <strong>Legal Authorities:</strong> When required by law or to protect our legal rights
                </li>
                <li>
                  <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets
                </li>
              </ul>
              <p className="text-gray-700">
                We do not sell your personal data to third parties.
              </p>
            </div>

            {/* Data Security */}
            <div className="mb-12">
              <h2 className="mb-4 flex items-center gap-3 font-serif text-2xl font-semibold text-navy-900">
                <Lock className="h-6 w-6 text-gold-600" />
                6. Data Security
              </h2>
              <p className="mb-4 text-gray-700">
                We implement appropriate technical and organizational measures to protect your personal data
                against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Staff training on data protection</li>
                <li>Secure data storage and backup procedures</li>
              </ul>
            </div>

            {/* Data Retention */}
            <div className="mb-12">
              <h2 className="mb-4 font-serif text-2xl font-semibold text-navy-900">
                7. Data Retention
              </h2>
              <p className="mb-4 text-gray-700">
                We retain your personal data only for as long as necessary to fulfill the purposes outlined in
                this policy, unless a longer retention period is required or permitted by law. Generally:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
                <li>Active candidate profiles are retained while you are actively using our services</li>
                <li>Inactive profiles may be retained for up to 3 years for potential future opportunities</li>
                <li>Financial records are retained for 7 years as required by French law</li>
                <li>Marketing consent data is retained until you withdraw consent</li>
              </ul>
            </div>

            {/* Your Rights */}
            <div className="mb-12">
              <h2 className="mb-4 font-serif text-2xl font-semibold text-navy-900">
                8. Your Rights
              </h2>
              <p className="mb-4 text-gray-700">
                Under GDPR and French data protection law, you have the following rights:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
                <li>
                  <strong>Right of Access:</strong> You can request a copy of the personal data we hold about you
                </li>
                <li>
                  <strong>Right to Rectification:</strong> You can request correction of inaccurate or incomplete
                  data
                </li>
                <li>
                  <strong>Right to Erasure:</strong> You can request deletion of your personal data in certain
                  circumstances
                </li>
                <li>
                  <strong>Right to Restrict Processing:</strong> You can request that we limit how we use your
                  data
                </li>
                <li>
                  <strong>Right to Data Portability:</strong> You can request transfer of your data to another
                  service provider
                </li>
                <li>
                  <strong>Right to Object:</strong> You can object to processing based on legitimate interests
                </li>
                <li>
                  <strong>Right to Withdraw Consent:</strong> Where processing is based on consent, you can
                  withdraw it at any time
                </li>
              </ul>
              <p className="mb-4 text-gray-700">
                To exercise these rights, please contact us at{" "}
                <a
                  href="mailto:admin@lighthouse-careers.com"
                  className="text-gold-600 hover:underline"
                >
                  admin@lighthouse-careers.com
                </a>
                . We will respond to your request within one month.
              </p>
            </div>

            {/* Cookies */}
            <div className="mb-12">
              <h2 className="mb-4 font-serif text-2xl font-semibold text-navy-900">
                9. Cookies and Tracking Technologies
              </h2>
              <p className="mb-4 text-gray-700">
                We use cookies and similar tracking technologies to enhance your experience on our website.
                You can control cookie preferences through your browser settings. For more information, please
                see our Cookie Policy (if applicable).
              </p>
            </div>

            {/* International Transfers */}
            <div className="mb-12">
              <h2 className="mb-4 font-serif text-2xl font-semibold text-navy-900">
                10. International Data Transfers
              </h2>
              <p className="mb-4 text-gray-700">
                Your personal data may be transferred to and processed in countries outside the European
                Economic Area (EEA). When we do so, we ensure appropriate safeguards are in place, such as
                Standard Contractual Clauses approved by the European Commission, to protect your data in
                accordance with GDPR requirements.
              </p>
            </div>

            {/* Children's Privacy */}
            <div className="mb-12">
              <h2 className="mb-4 font-serif text-2xl font-semibold text-navy-900">
                11. Children&apos;s Privacy
              </h2>
              <p className="mb-4 text-gray-700">
                Our services are not intended for individuals under the age of 18. We do not knowingly collect
                personal data from children. If you believe we have collected data from a child, please contact
                us immediately.
              </p>
            </div>

            {/* Changes to Policy */}
            <div className="mb-12">
              <h2 className="mb-4 font-serif text-2xl font-semibold text-navy-900">
                12. Changes to This Policy
              </h2>
              <p className="mb-4 text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of any material changes
                by posting the new policy on this page and updating the &quot;Last updated&quot; date. We
                encourage you to review this policy periodically.
              </p>
            </div>

            {/* Contact */}
            <div className="mb-12 rounded-2xl border border-gray-200 bg-gold-50 p-8">
              <h2 className="mb-4 flex items-center gap-3 font-serif text-2xl font-semibold text-navy-900">
                <Mail className="h-6 w-6 text-gold-600" />
                13. Contact Us
              </h2>
              <p className="mb-4 text-gray-700">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data
                processing practices, please contact us:
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
              </div>
              <p className="mt-4 text-gray-700">
                You also have the right to lodge a complaint with the French data protection authority (CNIL)
                if you believe we have not addressed your concerns adequately. CNIL can be contacted at{" "}
                <a
                  href="https://www.cnil.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold-600 hover:underline"
                >
                  www.cnil.fr
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}


