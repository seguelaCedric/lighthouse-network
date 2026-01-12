'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Briefcase, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingCTAProps {
  text: string;
  href: string;
  variant: 'employer' | 'candidate';
}

interface FloatingDualCTAProps {
  employerText?: string;
  candidateText?: string;
}

export function FloatingCTA({ text, href, variant }: FloatingCTAProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if user dismissed this session
    const dismissed = sessionStorage.getItem(`blog-cta-dismissed-${variant}`);
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show CTA after user scrolls 50% down the page
    const handleScroll = () => {
      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      setIsVisible(scrollPercentage > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, [variant]);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem(`blog-cta-dismissed-${variant}`, 'true');
  };

  if (!mounted || !isVisible || isDismissed) return null;

  const Icon = variant === 'employer' ? Briefcase : Search;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 shadow-lg backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        {/* Message */}
        <div className="hidden flex-1 text-sm font-medium text-navy-900 sm:block">
          {text}
        </div>

        {/* CTA */}
        <div className="flex flex-1 items-center justify-center sm:flex-none">
          <Link href={href}>
            <Button size="sm">
              <Icon className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">{variant === 'employer' ? 'Find Candidates' : 'Find a Job'}</span>
              <span className="sm:hidden">{variant === 'employer' ? 'Hire' : 'Jobs'}</span>
            </Button>
          </Link>
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function FloatingDualCTA({
  employerText = 'Ready to hire staff or find your next role?',
  candidateText,
}: FloatingDualCTAProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if user dismissed this session
    const dismissed = sessionStorage.getItem('blog-cta-dismissed-dual');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show CTA after user scrolls 50% down the page
    const handleScroll = () => {
      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      setIsVisible(scrollPercentage > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('blog-cta-dismissed-dual', 'true');
  };

  if (!mounted || !isVisible || isDismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 shadow-lg backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Message */}
        <div className="hidden text-sm font-medium text-navy-900 sm:block">
          {employerText}
        </div>

        {/* CTAs */}
        <div className="flex flex-1 items-center justify-center gap-3 sm:flex-none sm:justify-end">
          <Link href="/match" className="flex-1 sm:flex-none">
            <Button size="sm" className="w-full sm:w-auto">
              <Briefcase className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Hire Staff</span>
              <span className="sm:hidden">Hire</span>
            </Button>
          </Link>
          <Link href="/job-board" className="flex-1 sm:flex-none">
            <Button variant="secondary" size="sm" className="w-full sm:w-auto">
              <Search className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Find Jobs</span>
              <span className="sm:hidden">Jobs</span>
            </Button>
          </Link>
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="ml-2 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
