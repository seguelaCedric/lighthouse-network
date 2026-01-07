import { Metadata } from "next";
import { PublicHeader } from "@/components/pricing/PublicHeader";
import { PublicFooter } from "@/components/pricing/PublicFooter";
import {
  Shield,
  FileText,
  Users,
  Building2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Scale,
  Globe,
  Award,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Maritime Labour Convention (MLC) | Lighthouse Careers",
  description:
    "Lighthouse Careers is committed to MLC 2006 compliance, ensuring the welfare of seafarers and ethical recruitment practices in yacht crew placement.",
};

export default function MLCPage() {
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
            MLC 2006 Compliant
          </div>

          <h1 className="font-serif text-4xl font-semibold text-white sm:text-5xl lg:text-6xl">
            Our Commitment
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg text-gray-300 sm:text-xl">
            Lighthouse Careers is committed to the welfare of seafarers, ensuring
            compliance with the Maritime Labour Convention 2006 (MLC).
          </p>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-navy-50 to-white p-8 sm:p-12">
            <p className="text-lg leading-relaxed text-gray-700">
              For all recruitment agencies operating within the UK and EU, adherence
              to the Maritime Labour Convention, 2006 (MLC 2006) is not just best
              practice – it&apos;s a fundamental requirement. Compliant companies
              like Lighthouse Careers embrace the responsibilities outlined by this
              crucial legislation.
            </p>
            <p className="mt-6 text-lg leading-relaxed text-gray-700">
              This includes conducting thorough due diligence on yacht owners and
              management companies to ensure they uphold seafarers&apos; rights,
              maintaining transparent and ethical recruitment practices, and being
              subject to regular audits and inspections to verify their compliance.
            </p>
            <p className="mt-6 text-lg leading-relaxed text-gray-700">
              We strongly advise all clients and crew to familiarise themselves with
              the MLC to fully understand the obligations and rights of yacht owners,
              crewing agencies, and seafarers. For comprehensive information about
              MLC 2006, visit the{" "}
              <a
                href="https://www.ilo.org/global/standards/maritime-labour-convention/lang--en/index.htm"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gold-600 hover:text-gold-700 hover:underline"
              >
                International Labour Organisation (ILO) website
                <ExternalLink className="ml-1 inline h-4 w-4" />
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* What is MLC Section */}
      <section className="bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold-100">
              <Scale className="h-8 w-8 text-gold-600" />
            </div>
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              What is the MLC 2006?
            </h2>
          </div>

          <div className="mx-auto max-w-4xl space-y-6 text-lg text-gray-700">
            <p>
              The International Labour Organization&apos;s (ILO) Maritime Labour
              Convention 2006 (MLC 2006) is a vital international law that guarantees
              comprehensive rights and protection at work for the world&apos;s
              seafarers.
            </p>
            <p>
              This convention aims to ensure fair working conditions for crew members
              while also supporting fair competition for quality yacht owners. It
              brings together and updates over 68 previous international labour
              standards for the maritime sector, established over the past eight
              decades.
            </p>
            <p>
              Designed to be a universally applicable, easily understandable, and
              consistently enforced global standard, the MLC 2006 is considered a
              cornerstone of the international regulatory framework for quality
              shipping, alongside the key conventions of the International Maritime
              Organization (IMO).
            </p>
            <p>
              Its creation was driven by the recognition that the global shipping
              industry demands a unified international approach to ensure decent work
              for seafarers across the board.
            </p>
          </div>
        </div>
      </section>

      {/* What does this mean for crew */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-navy-100">
              <Users className="h-8 w-8 text-navy-600" />
            </div>
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              What does this mean for crew?
            </h2>
          </div>

          <div className="mx-auto max-w-4xl">
            <p className="mb-8 text-lg text-gray-700">
              As a crew-focussed and MLC compliant organisation we ensure all crew
              are informed of their rights and duties under their employment
              agreements.
            </p>
            <p className="mb-8 text-lg text-gray-700">
              We are an introductory agent only and urge all crew members to ensure
              they have a signed seafarer&apos;s contract before joining any yacht.
            </p>

            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h3 className="mb-6 font-serif text-2xl font-semibold text-navy-900">
                When working with us you can expect:
              </h3>
              <ul className="space-y-4">
                {[
                  "To receive contact from our staff wherever possible and appropriate.",
                  "To be treated as an individual.",
                  "To be shortlisted for roles based on your skills and experience.",
                  "To have your registration documents stored securely and not disclosed to third parties without consent.",
                  "Not to be submitted for any positions without a full preliminary interview.",
                  "To be handpicked for positions that we feel suit your skills and personality.",
                  "No blacklists or other mechanisms are used to prevent candidates from gaining employment for which they are qualified.",
                  "No fees or charges are made to the candidate in exchange for providing employment, as stated in the MLC 2006 convention, A.1.4.5.b",
                ].map((item, index) => (
                  <li key={index} className="flex gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold-600" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What does this mean for clients */}
      <section className="bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold-100">
              <Building2 className="h-8 w-8 text-gold-600" />
            </div>
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              What does this mean for clients?
            </h2>
          </div>

          <div className="mx-auto max-w-4xl space-y-6">
            <p className="text-lg text-gray-700">
              Lighthouse Careers is an introductory agent only and is not involved in
              contracts or payroll.
            </p>
            <p className="text-lg text-gray-700">
              All clients engaging with Lighthouse Careers agree to our Terms &
              Conditions, which are provided upon initial contact for our services.
            </p>

            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h3 className="mb-6 font-serif text-xl font-semibold text-navy-900">
                We will ask you for several supporting documents in order to allow us
                to do the work we are contracted to do, and these will vary from
                position to position:
              </h3>
              <ul className="space-y-3">
                {[
                  "A copy of the yachts manning model (a detailed organigram of the internal management structure)",
                  "A detailed job description",
                  "A copy of the Yacht's Standing Orders",
                  "A copy of the individual's future contract",
                ].map((item, index) => (
                  <li key={index} className="flex gap-3">
                    <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-gold-600" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 rounded-lg border-l-4 border-gold-500 bg-gold-50 p-6">
              <p className="font-semibold text-navy-900">Introductory agent only.</p>
              <p className="mt-2 text-gray-700">
                The process can take a little as two weeks for Junior crew but in
                most cases for mid / senior / rotational crew the process can take
                between 1-3 months.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Code of Conduct */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-navy-100">
              <Award className="h-8 w-8 text-navy-600" />
            </div>
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              Code of Conduct
            </h2>
          </div>

          <div className="mx-auto max-w-4xl">
            <p className="mb-8 text-lg text-gray-700">
              At Lighthouse Careers, we are bound by our ethical code of conduct. So,
              you can rest assured our team consistently act with the highest
              integrity, honesty and professionalism.
            </p>

            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <p className="mb-6 text-lg font-semibold text-navy-900">
                In addition to compliance with all legal and diversity requirements,
                the key principles to which we abide include:
              </p>
              <ul className="space-y-4">
                {[
                  "To conduct business dealings and build relationships with the highest degree of professionalism, honesty and integrity",
                  "Ensure that headhunters do not act in any way which will damage their reputation, the reputation of Lighthouse Careers, or the wider industry",
                  "All dealings with clients and candidates are documented ensuring a robust audit trail of activity at every stage of the process.",
                  "Provide accurate, honest information and constructive feedback to clients and candidates throughout",
                  "Ensure the best available candidates are proposed for relevant roles, with the required work permits, visas, experience or yachting qualifications (legally or otherwise)",
                  "Maintain confidentiality for both client and candidate, only disclosing confidential information with explicit consent or if required to do so by law",
                ].map((item, index) => (
                  <li key={index} className="flex gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold-600" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Complaints Procedure */}
      <section className="bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold-100">
              <AlertCircle className="h-8 w-8 text-gold-600" />
            </div>
            <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
              Complaints Procedure
            </h2>
          </div>

          <div className="mx-auto max-w-4xl space-y-6">
            <p className="text-lg text-gray-700">
              In line with MLC Standard A1.4, Lighthouse Careers will review and
              address any complaint related to our services and inform the relevant
              authority of unresolved complaints.
            </p>

            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h3 className="mb-6 font-serif text-xl font-semibold text-navy-900">
                If you need to lodge a complaint against a service provided by
                Lighthouse Careers, clients and seafarers can do so verbally or via
                email by contacting{" "}
                <a
                  href="mailto:admin@lighthouse-careers.com"
                  className="text-gold-600 hover:text-gold-700 hover:underline"
                >
                  admin@lighthouse-careers.com
                </a>
                .
              </h3>

              <div className="space-y-6">
                <div>
                  <h4 className="mb-2 font-semibold text-navy-900">
                    Upon receiving your complaint:
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex gap-3">
                      <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-gold-600" />
                      <span className="text-gray-700">
                        Lighthouse Careers will acknowledge your complaint via letter
                        or email, confirming its receipt within seven working days.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-gold-600" />
                      <span className="text-gray-700">
                        We will then document your complaint and initiate an
                        investigation.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-gold-600" />
                      <span className="text-gray-700">
                        Our goal is to investigate and resolve all complaints within
                        14 working days of receipt.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border-l-4 border-navy-500 bg-navy-50 p-6">
                  <p className="text-gray-700">
                    Lighthouse Careers is confident in addressing and resolving most
                    complaints. However, if you feel your complaint hasn&apos;t been
                    adequately addressed or remains unresolved, please contact the
                    relevant authority.
                  </p>
                  <p className="mt-3 text-gray-700">
                    Complaints regarding working or living conditions on board should
                    be directed to the yacht&apos;s management company or flag
                    administration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-navy-900 py-20 sm:py-28">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-gold-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
            Questions About MLC Compliance?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-400">
            Our team is here to help you understand your rights and obligations under
            the Maritime Labour Convention.
          </p>
          <div className="mt-8">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-gold-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-gold-700"
            >
              Contact Us
              <ExternalLink className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}


