'use client';

import { Info, MessageCircle, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchQualityBannerProps {
  query?: string;
  bestScore?: number;
  onContactClick?: () => void;
  onRefineSearch?: () => void;
  className?: string;
}

export function SearchQualityBanner({
  query,
  bestScore,
  onContactClick,
  onRefineSearch,
  className,
}: SearchQualityBannerProps) {
  const roleText = query ? 'this search' : 'your specific requirements';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-warning-200',
        'bg-gradient-to-br from-warning-50 via-warning-100/80 to-warning-50',
        'p-6 md:p-8',
        className
      )}
    >
      {/* Decorative accent */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-warning-400 to-warning-600" />

      <div className="flex flex-col md:flex-row md:items-start gap-6">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-warning-200 flex items-center justify-center">
            <Info className="h-6 w-6 text-warning-600" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="font-cormorant text-xl md:text-2xl font-semibold text-navy-800 mb-2">
              We Found Candidates Worth Considering
            </h3>
            <p className="font-inter text-sm md:text-base text-navy-600 leading-relaxed">
              While we didn&apos;t find an exact fit for {roleText}, these
              professionals have relevant experience that may suit your needs.
              {bestScore && bestScore >= 55 && (
                <span className="text-warning-700 font-medium">
                  {' '}
                  Our top candidate fits {Math.round(bestScore)}% of your
                  criteria.
                </span>
              )}
            </p>
          </div>

          {/* Helpful context */}
          <div className="bg-white/60 rounded-lg p-4 border border-warning-200">
            <p className="font-inter text-xs text-navy-500 leading-relaxed">
              <span className="text-warning-700 font-medium">Why this happens:</span>{' '}
              Niche roles or highly specific requirements can limit exact matches.
              Our consultants often find the perfect candidate through their
              network beyond our database.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {onContactClick && (
              <Button
                onClick={onContactClick}
                className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-white font-inter font-medium"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Speak with a Consultant
              </Button>
            )}
            {onRefineSearch && (
              <Button
                onClick={onRefineSearch}
                variant="secondary"
                className="border-warning-300 text-warning-700 hover:bg-warning-100 hover:text-warning-800 font-inter"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Refine Search Criteria
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
