import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { getPopularPositions } from "@/lib/navigation/nav-data";

export function PublicFooter() {
  const popularPositions = getPopularPositions();

  return (
    <footer className="border-t border-gray-100 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {/* Main Footer Content - 3 Columns */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Column 1: Services */}
          <div>
            <h3 className="font-semibold text-navy-800 mb-4">Services</h3>
            <nav className="flex flex-col gap-2 text-sm">
              <Link href="/hire" className="text-gray-600 hover:text-burgundy-700">
                Hire Staff
              </Link>
              <Link href="/yacht-crew" className="text-gray-600 hover:text-burgundy-700">
                Yacht Crew Recruitment
              </Link>
              <Link href="/private-staff" className="text-gray-600 hover:text-burgundy-700">
                Household Staff Recruitment
              </Link>
              <Link href="/job-board" className="text-gray-600 hover:text-burgundy-700">
                Job Board
              </Link>
              <Link href="/salary-guide" className="text-gray-600 hover:text-burgundy-700">
                Salary Guides
              </Link>
            </nav>
          </div>

          {/* Column 2: Resources */}
          <div>
            <h3 className="font-semibold text-navy-800 mb-4">Resources</h3>
            <nav className="flex flex-col gap-2 text-sm">
              <Link href="/blog" className="text-gray-600 hover:text-burgundy-700">
                Blog
              </Link>
              <Link
                href="/blog?content_type=hiring_guide&audience=employer"
                className="text-gray-600 hover:text-burgundy-700"
              >
                Hiring Guides
              </Link>
              <Link
                href="/blog?audience=candidate"
                className="text-gray-600 hover:text-burgundy-700"
              >
                Career Resources
              </Link>
              <Link
                href="/blog?content_type=case_study"
                className="text-gray-600 hover:text-burgundy-700"
              >
                Case Studies
              </Link>
              <Link href="/testimonials" className="text-gray-600 hover:text-burgundy-700">
                Testimonials
              </Link>
            </nav>
          </div>

          {/* Column 3: Company */}
          <div>
            <h3 className="font-semibold text-navy-800 mb-4">Company</h3>
            <nav className="flex flex-col gap-2 text-sm">
              <Link href="/about" className="text-gray-600 hover:text-burgundy-700">
                About
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-burgundy-700">
                Contact
              </Link>
              <Link href="/privacy" className="text-gray-600 hover:text-burgundy-700">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-600 hover:text-burgundy-700">
                Terms of Service
              </Link>
              <Link href="/mlc" className="text-gray-600 hover:text-burgundy-700">
                MLC Compliance
              </Link>
              <Link href="/affiliates-pccp" className="text-gray-600 hover:text-burgundy-700">
                Affiliates/PCCP
              </Link>
            </nav>
          </div>
        </div>

        {/* Popular Positions Row */}
        <div className="mt-8 border-t border-gray-200 pt-8">
          <h3 className="font-semibold text-navy-800 mb-4 text-sm">Popular Positions</h3>
          <nav className="flex flex-wrap gap-3">
            {popularPositions.map((position) => (
              <Link
                key={position.slug}
                href={`/hire-a-${position.slug}`}
                className="inline-flex items-center rounded-md bg-white border border-gray-200 px-3 py-1 text-sm text-gray-700 hover:border-burgundy-700 hover:bg-burgundy-50 transition-colors"
              >
                {position.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 sm:flex-row">
          <Logo size="sm" />

          <p className="text-sm text-gray-500">
            Questions?{" "}
            <a
              href="mailto:info@lighthouse-careers.com"
              className="text-burgundy-700 hover:underline"
            >
              info@lighthouse-careers.com
            </a>
          </p>

          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Lighthouse Careers
          </p>
        </div>
      </div>
    </footer>
  );
}
