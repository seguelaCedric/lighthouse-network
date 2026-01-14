import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { getPopularPositions } from "@/lib/navigation/nav-data";

export function PublicFooter() {
  const popularPositions = getPopularPositions();

  return (
    <>
      {/* Popular Positions Section - Above Footer */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h3 className="text-sm font-semibold text-navy-900 uppercase tracking-wider mb-4">
            Popular Positions
          </h3>
          <nav className="flex flex-wrap gap-2">
            {popularPositions.map((position) => (
              <Link
                key={position.slug}
                href={`/hire-a-${position.slug}`}
                className="inline-flex items-center rounded-full bg-white border border-gray-200 px-3 py-1.5 text-xs sm:text-sm sm:px-4 text-gray-700 hover:border-burgundy-600 hover:bg-burgundy-50 hover:text-burgundy-700 transition-colors"
              >
                {position.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white pb-24">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Top Section - Logo and Description */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <Logo size="md" />
            <p className="mt-4 text-sm text-gray-600 max-w-sm">
              Premium yacht crew and private household staff recruitment.
              Trusted by 500+ clients worldwide.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Questions?{" "}
              <a
                href="mailto:admin@lighthouse-careers.com"
                className="text-burgundy-700 hover:underline font-medium"
              >
                admin@lighthouse-careers.com
              </a>
            </p>
            <p className="mt-6 text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Lighthouse Careers. All rights reserved.
            </p>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {/* Column 1: Services */}
              <div>
                <h3 className="text-sm font-semibold text-navy-900 uppercase tracking-wider">
                  Services
                </h3>
                <nav className="mt-4 flex flex-col gap-3">
                  <Link href="/hire" className="text-sm text-gray-600 hover:text-burgundy-700 transition-colors">
                    Hire Staff
                  </Link>
                  <Link href="/yacht-crew" className="text-sm text-gray-600 hover:text-burgundy-700 transition-colors">
                    Yacht Crew Recruitment
                  </Link>
                  <Link href="/private-staff" className="text-sm text-gray-600 hover:text-burgundy-700 transition-colors">
                    Household Staff Recruitment
                  </Link>
                  <Link href="/job-board" className="text-sm text-gray-600 hover:text-burgundy-700 transition-colors">
                    Job Board
                  </Link>
                  <Link href="/salary-guide" className="text-sm text-gray-600 hover:text-burgundy-700 transition-colors">
                    Salary Guides
                  </Link>
                </nav>
              </div>

              {/* Column 2: Resources */}
              <div>
                <h3 className="text-sm font-semibold text-navy-900 uppercase tracking-wider">
                  Resources
                </h3>
                <nav className="mt-4 flex flex-col gap-3">
                  <Link href="/blog" className="text-sm text-gray-600 hover:text-burgundy-700 transition-colors">
                    Blog
                  </Link>
                  <Link
                    href="/blog?content_type=hiring_guide&audience=employer"
                    className="text-sm text-gray-600 hover:text-burgundy-700 transition-colors"
                  >
                    Hiring Guides
                  </Link>
                  <Link
                    href="/blog?audience=candidate"
                    className="text-sm text-gray-600 hover:text-burgundy-700 transition-colors"
                  >
                    Career Resources
                  </Link>
                  <Link
                    href="/blog?content_type=case_study"
                    className="text-sm text-gray-600 hover:text-burgundy-700 transition-colors"
                  >
                    Case Studies
                  </Link>
                  <Link href="/testimonials" className="text-sm text-gray-600 hover:text-burgundy-700 transition-colors">
                    Testimonials
                  </Link>
                </nav>
              </div>

              {/* Column 3: Company */}
              <div>
                <h3 className="text-sm font-semibold text-navy-900 uppercase tracking-wider">
                  Company
                </h3>
                <nav className="mt-4 flex flex-col gap-3">
                  <Link href="/about" className="text-sm text-gray-600 hover:text-burgundy-700 transition-colors">
                    About
                  </Link>
                  <Link href="/contact" className="text-sm text-gray-600 hover:text-burgundy-700 transition-colors">
                    Contact
                  </Link>
                  <Link href="/privacy" className="text-sm text-gray-600 hover:text-burgundy-700 transition-colors">
                    Privacy Policy
                  </Link>
                  <Link href="/terms" className="text-sm text-gray-600 hover:text-burgundy-700 transition-colors">
                    Terms of Service
                  </Link>
                  <Link href="/mlc" className="text-sm text-gray-600 hover:text-burgundy-700 transition-colors">
                    MLC Compliance
                  </Link>
                  <Link href="/affiliates-pccp" className="text-sm text-gray-600 hover:text-burgundy-700 transition-colors">
                    Affiliates/PCCP
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        </div>

      </div>
    </footer>
    </>
  );
}
