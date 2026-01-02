import Link from "next/link";
import { Anchor } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 pb-24 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-navy-800">
              <Anchor className="size-4 text-gold-400" />
            </div>
            <span className="font-serif text-lg font-semibold text-navy-800">
              Lighthouse Careers
            </span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/yacht-crew" className="text-gray-500 hover:text-navy-800">
              Yacht Crew
            </Link>
            <Link href="/private-staff" className="text-gray-500 hover:text-navy-800">
              Private Staff
            </Link>
            <Link href="/about" className="text-gray-500 hover:text-navy-800">
              About
            </Link>
            <Link href="/contact" className="text-gray-500 hover:text-navy-800">
              Contact
            </Link>
            <Link href="/privacy" className="text-gray-500 hover:text-navy-800">
              Privacy
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-navy-800">
              Terms
            </Link>
          </nav>

          {/* Contact */}
          <p className="text-sm text-gray-500">
            Questions?{" "}
            <a
              href="mailto:info@lighthouse-careers.com"
              className="text-gold-600 hover:underline"
            >
              info@lighthouse-careers.com
            </a>
          </p>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-8 text-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Lighthouse Careers. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
