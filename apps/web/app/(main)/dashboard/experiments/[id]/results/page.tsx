'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Target,
  Trophy,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type { ExperimentStats, VariantStats } from '@/lib/ab-testing/types';
import {
  formatPercentage,
  formatLift,
  getConfidenceLabel,
} from '@/lib/ab-testing/statistics';

interface ResultsData extends ExperimentStats {
  daily_visitors: number;
  estimated_days_remaining: number | null;
}

const confidenceColors = {
  low: 'text-gray-500',
  medium: 'text-yellow-600',
  high: 'text-green-600',
  very_high: 'text-green-700',
};

const confidenceLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High (95%+)',
  very_high: 'Very High (99%+)',
};

export default function ExperimentResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [results, setResults] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchResults();
  }, [id]);

  const fetchResults = async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch(
        `/api/ab-testing/experiments/${id}/results`,
        { method: refresh ? 'POST' : 'GET' }
      );

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getLiftIcon = (variant: VariantStats, controlRate: number) => {
    if (variant.is_control) return <Minus className="h-4 w-4 text-gray-400" />;

    const diff = variant.conversion_rate - controlRate;
    if (Math.abs(diff) < 0.1) {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
    if (diff > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/experiments/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Experiment Results</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No results data available yet
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const controlVariant = results.variants.find((v) => v.is_control);
  const controlRate = controlVariant?.conversion_rate || 0;
  const totalVisitors = results.variants.reduce((sum, v) => sum + v.visitors, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/experiments/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {results.experiment_name}
            </h1>
            <p className="text-muted-foreground">Experiment Results</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchResults(true)}
          disabled={refreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Visitors</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              {totalVisitors.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sample Size Reached</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              {results.sample_size_reached ? (
                <Badge className="bg-green-100 text-green-800">Yes</Badge>
              ) : (
                <Badge variant="outline">Not Yet</Badge>
              )}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Statistical Significance</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Trophy className="h-5 w-5 text-muted-foreground" />
              {results.is_significant ? (
                <Badge className="bg-green-100 text-green-800">
                  Significant
                </Badge>
              ) : (
                <Badge variant="outline">Not Significant</Badge>
              )}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Days Remaining</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              {results.estimated_days_remaining !== null
                ? results.estimated_days_remaining === 0
                  ? 'Complete'
                  : `~${results.estimated_days_remaining} days`
                : 'Unknown'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Winner Banner */}
      {results.winner && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-green-600" />
              <div>
                <CardTitle className="text-green-800">
                  Winner: {results.winner.variant_name}
                </CardTitle>
                <CardDescription className="text-green-700">
                  {formatLift(results.winner.lift)} lift with{' '}
                  {formatPercentage(results.winner.confidence * 100, 1)}{' '}
                  confidence
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Variant Results */}
      <Card>
        <CardHeader>
          <CardTitle>Variant Performance</CardTitle>
          <CardDescription>
            Conversion rates and confidence intervals for each variant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {results.variants.map((variant) => {
              const lift =
                controlRate > 0 && !variant.is_control
                  ? ((variant.conversion_rate - controlRate) / controlRate) * 100
                  : 0;

              return (
                <div key={variant.variant_id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{variant.variant_name}</span>
                      {variant.is_control && (
                        <Badge variant="secondary">Control</Badge>
                      )}
                      {results.winner?.variant_id === variant.variant_id && (
                        <Badge className="bg-green-100 text-green-800">
                          Winner
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {!variant.is_control && (
                        <div className="flex items-center gap-1">
                          {getLiftIcon(variant, controlRate)}
                          <span
                            className={
                              lift > 0
                                ? 'text-green-600'
                                : lift < 0
                                  ? 'text-red-600'
                                  : ''
                            }
                          >
                            {formatLift(lift)}
                          </span>
                        </div>
                      )}
                      <span className="text-muted-foreground">
                        {variant.visitors.toLocaleString()} visitors
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Conversion Rate</span>
                      <span className="font-medium">
                        {formatPercentage(variant.conversion_rate)}
                      </span>
                    </div>
                    <Progress
                      value={variant.conversion_rate}
                      max={Math.max(
                        ...results.variants.map((v) => v.conversion_rate),
                        10
                      )}
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {variant.conversions} / {variant.visitors} converted
                      </span>
                      <span>
                        95% CI: [{formatPercentage(variant.confidence_interval[0])}
                        , {formatPercentage(variant.confidence_interval[1])}]
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Daily Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">
                Average Daily Visitors
              </div>
              <div className="text-2xl font-bold">
                {results.daily_visitors.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                Total Conversions
              </div>
              <div className="text-2xl font-bold">
                {results.variants
                  .reduce((sum, v) => sum + v.conversions, 0)
                  .toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guidance */}
      {!results.is_significant && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Not Yet Conclusive
            </CardTitle>
          </CardHeader>
          <CardContent className="text-yellow-700">
            <p>
              The experiment has not reached statistical significance yet.
              {!results.sample_size_reached && (
                <span>
                  {' '}
                  Continue running until you reach the minimum sample size.
                </span>
              )}
              {results.sample_size_reached && (
                <span>
                  {' '}
                  Even with sufficient sample size, the difference between
                  variants may be too small to detect confidently.
                </span>
              )}
            </p>
            {results.estimated_days_remaining !== null &&
              results.estimated_days_remaining > 0 && (
                <p className="mt-2">
                  Estimated time to reach minimum sample size:{' '}
                  <strong>{results.estimated_days_remaining} days</strong>
                </p>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
