'use client';

import { Award, Target, TrendingUp, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MatchTier = 'excellent' | 'strong' | 'moderate' | 'limited';

interface MatchQualityBadgeProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

interface TierConfig {
  tier: MatchTier;
  label: string;
  Icon: typeof Award;
  gradient: string;
  iconColor: string;
  textOpacity: string;
}

function getTierConfig(score: number): TierConfig {
  if (score >= 85) {
    return {
      tier: 'excellent',
      label: 'Excellent Fit',
      Icon: Award,
      gradient: 'from-success-500 to-success-600',
      iconColor: 'text-emerald-300',
      textOpacity: 'text-white',
    };
  }
  if (score >= 70) {
    return {
      tier: 'strong',
      label: 'Strong Fit',
      Icon: Target,
      gradient: 'from-gold-500 to-gold-600',
      iconColor: 'text-gold-300',
      textOpacity: 'text-white',
    };
  }
  if (score >= 55) {
    return {
      tier: 'moderate',
      label: 'Partial Fit',
      Icon: TrendingUp,
      gradient: 'from-warning-400 to-warning-500',
      iconColor: 'text-amber-200',
      textOpacity: 'text-white',
    };
  }
  return {
    tier: 'limited',
    label: 'Worth Exploring',
    Icon: Search,
    gradient: 'from-navy-400 to-navy-500',
    iconColor: 'text-navy-200',
    textOpacity: 'text-white/80',
  };
}

const sizeClasses = {
  sm: {
    container: 'px-3 py-2 rounded-lg',
    icon: 'h-4 w-4',
    score: 'text-xl font-bold',
    label: 'text-[8px]',
  },
  md: {
    container: 'px-5 py-3 rounded-xl',
    icon: 'h-5 w-5',
    score: 'text-3xl font-bold',
    label: 'text-[10px]',
  },
  lg: {
    container: 'px-6 py-4 rounded-2xl',
    icon: 'h-6 w-6',
    score: 'text-4xl font-bold',
    label: 'text-xs',
  },
};

export function MatchQualityBadge({
  score,
  size = 'md',
  showLabel = true,
  className,
}: MatchQualityBadgeProps) {
  const config = getTierConfig(score);
  const sizeConfig = sizeClasses[size];
  const Icon = config.Icon;

  return (
    <div
      className={cn(
        'inline-flex flex-col items-end backdrop-blur-sm border border-white/10',
        `bg-gradient-to-r ${config.gradient}`,
        sizeConfig.container,
        className
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn(sizeConfig.icon, config.iconColor)} />
        <span
          className={cn(
            'font-inter tracking-tight',
            sizeConfig.score,
            config.textOpacity
          )}
        >
          {score}%
        </span>
      </div>
      {showLabel && (
        <p
          className={cn(
            'font-inter font-medium uppercase tracking-widest',
            sizeConfig.label,
            config.textOpacity,
            'opacity-90'
          )}
        >
          {config.label}
        </p>
      )}
    </div>
  );
}

// Export helper for use in conditional rendering
export function getMatchTier(score: number): MatchTier {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'strong';
  if (score >= 55) return 'moderate';
  return 'limited';
}

// Export tier label for use elsewhere
export function getMatchTierLabel(score: number): string {
  return getTierConfig(score).label;
}
