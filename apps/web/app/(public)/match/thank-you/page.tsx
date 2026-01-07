"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PublicHeader } from "@/components/pricing/PublicHeader";
import { PublicFooter } from "@/components/pricing/PublicFooter";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Clock,
  Mail,
  Phone,
  ArrowRight,
  FileText,
  Users,
  Sparkles,
  Loader2,
  Search,
} from "lucide-react";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const inquiryId = searchParams.get("id");
  const [originalQuery, setOriginalQuery] = useState<string | null>(null);

  useEffect(() => {
    // Try to get the original query from sessionStorage if available
    const storedQuery = sessionStorage.getItem("match_query");
    if (storedQuery) {
      setOriginalQuery(storedQuery);
    }
  }, []);

  const handleReturnToSearch = () => {
    if (originalQuery) {
      router.push(`/match?query=${encodeURIComponent(originalQuery)}`);
    } else {
      router.push("/match");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <PublicHeader />

      {/* Success Section */}
      <section className="relative overflow-hidden pt-28 pb-16">
        {/* Rich navy gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-800 via-navy-900 to-[#0c1525]" />
        
        {/* Warm champagne ambient light */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(195,165,120,0.15),transparent_60%)]" />

        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto mb-8 relative">
              <div className="absolute inset-0 bg-green-400/20 rounded-full blur-2xl scale-150"></div>
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/30 mx-auto">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
            </div>

            {/* Thank You Message */}
            <h1 className="font-cormorant text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-6">
              Thank You!
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/90 sm:text-xl mb-4">
              We&apos;ve received your inquiry and our team is already reviewing your requirements.
            </p>
            {inquiryId && (
              <p className="text-sm text-gray-400 mb-8">
                Reference: {inquiryId.slice(0, 8)}...
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* What Happens Next - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Next Steps Timeline */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500/10 ring-1 ring-gold-500/20">
                    <Clock className="h-5 w-5 text-gold-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-navy-900">What Happens Next?</h2>
                </div>

                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500 text-white font-semibold text-sm">
                        1
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="font-semibold text-navy-900 mb-1">We Review Your Requirements</h3>
                      <p className="text-gray-600 text-sm">
                        Our recruitment specialists analyze your brief and match it against our database of 44,000+ professionals.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500 text-white font-semibold text-sm">
                        2
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="font-semibold text-navy-900 mb-1">We Prepare Detailed Profiles</h3>
                      <p className="text-gray-600 text-sm">
                        Within 24 hours, you&apos;ll receive comprehensive candidate profiles with CVs, references, and contact details.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500 text-white font-semibold text-sm">
                        3
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="font-semibold text-navy-900 mb-1">We Connect You</h3>
                      <p className="text-gray-600 text-sm">
                        A dedicated consultant will reach out to discuss your needs and answer any questions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-gold-50 rounded-lg border border-gold-200">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-gold-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gold-900 mb-1">Immediate Response</p>
                      <p className="text-sm text-gold-700">
                        Since you provided your phone number, our team will contact you immediately. You&apos;ll receive comprehensive candidate profiles with CVs, references, and contact details.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Value-Add Content */}
              <div className="bg-gradient-to-br from-navy-50 to-navy-100 rounded-2xl border border-navy-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-500/10 ring-1 ring-navy-500/20">
                    <Sparkles className="h-5 w-5 text-navy-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-navy-900">While You Wait</h2>
                </div>

                <div className="space-y-4">
                  <Link
                    href={originalQuery ? `/match?query=${encodeURIComponent(originalQuery)}` : "/match"}
                    className="flex items-center gap-4 p-4 bg-white rounded-lg border border-navy-200 hover:border-gold-500 hover:shadow-md transition-all group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold-500/10">
                      <Search className="h-6 w-6 text-gold-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-navy-900 mb-1 group-hover:text-gold-700 transition-colors">
                        Browse More Candidates
                      </h3>
                      <p className="text-sm text-gray-600">
                        Continue exploring our database of vetted professionals
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gold-600 transition-colors" />
                  </Link>

                  <div className="p-4 bg-white rounded-lg border border-navy-200">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy-500/10 flex-shrink-0">
                        <FileText className="h-6 w-6 text-navy-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-navy-900 mb-1">
                          Hiring Guide for Private Staff
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          Download our comprehensive guide to hiring exceptional private household staff
                        </p>
                        <Button variant="secondary" size="sm" asChild>
                          <a href="/resources/hiring-guide" target="_blank" rel="noopener noreferrer">
                            Download Guide
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Contact & Social Proof */}
            <div className="space-y-6">
              {/* Contact Card */}
              <div className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-gold-500/20 via-transparent to-transparent" />
                <div className="relative">
                  <h3 className="font-semibold mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/20 ring-1 ring-gold-500/30">
                      <Phone className="h-4 w-4 text-gold-400" />
                    </div>
                    Need Immediate Assistance?
                  </h3>
                  <p className="text-sm text-gray-300 mb-4">
                    For urgent requirements or questions, contact us directly:
                  </p>
                  <div className="space-y-3">
                    <a
                      href="tel:+33676410299"
                      className="flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors group"
                    >
                      <Phone className="h-5 w-5 text-gold-400 group-hover:text-gold-300" />
                      <span className="font-medium">+33 6 76 41 02 99</span>
                    </a>
                    <a
                      href="mailto:admin@lighthouse-careers.com"
                      className="flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors group"
                    >
                      <Mail className="h-5 w-5 text-gold-400 group-hover:text-gold-300" />
                      <span className="font-medium text-sm">admin@lighthouse-careers.com</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Social Proof */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100">
                    <Users className="h-5 w-5 text-success-600" />
                  </div>
                  <h3 className="font-semibold text-navy-900">Trusted by 450+ Clients</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Join hundreds of satisfied employers who have found exceptional talent through our network.
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-8 w-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 border-2 border-white ring-1 ring-gray-200"
                      />
                    ))}
                  </div>
                  <span className="text-gray-500">and counting...</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleReturnToSearch}
                  className="w-full"
                  size="lg"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Browse More Candidates
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  size="lg"
                  asChild
                >
                  <Link href="/private-staff">
                    Learn More About Our Services
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}

