import Link from 'next/link';
import { PublicHeader } from '@/components/pricing/PublicHeader';
import { PublicFooter } from '@/components/pricing/PublicFooter';
import { Home, Briefcase, Users, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:px-6">
        <div className="max-w-2xl text-center">
          {/* 404 Number */}
          <div className="mb-8">
            <h1 className="font-serif text-9xl font-bold text-navy-900 opacity-10">
              404
            </h1>
            <div className="-mt-20">
              <h2 className="font-serif text-4xl font-semibold text-navy-900 sm:text-5xl">
                Page Not Found
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                We couldn't find the page you're looking for. It may have been moved or doesn't exist.
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <Link href="/">
              <Button variant="outline" className="w-full group">
                <Home className="h-4 w-4 mr-2 group-hover:text-gold-600 transition-colors" />
                Back to Home
              </Button>
            </Link>
            <Link href="/job-board">
              <Button variant="outline" className="w-full group">
                <Briefcase className="h-4 w-4 mr-2 group-hover:text-gold-600 transition-colors" />
                Browse Jobs
              </Button>
            </Link>
            <Link href="/yacht-crew">
              <Button variant="outline" className="w-full group">
                <Users className="h-4 w-4 mr-2 group-hover:text-gold-600 transition-colors" />
                Yacht Crew
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="w-full group">
                <Phone className="h-4 w-4 mr-2 group-hover:text-gold-600 transition-colors" />
                Contact Us
              </Button>
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-12 rounded-lg border border-gray-200 bg-gray-50 p-6">
            <p className="text-sm text-gray-600">
              Need help? Call us at{' '}
              <a
                href="tel:+33676410299"
                className="font-medium text-gold-600 hover:text-gold-700 transition-colors"
              >
                +33 6 76 41 02 99
              </a>
              {' '}or email{' '}
              <a
                href="mailto:info@lighthouse-careers.com"
                className="font-medium text-gold-600 hover:text-gold-700 transition-colors"
              >
                info@lighthouse-careers.com
              </a>
            </p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
