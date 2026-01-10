'use client';

import { useState, useEffect } from 'react';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FlaskConical,
  Plus,
  MoreVertical,
  Play,
  Pause,
  CheckCircle,
  Archive,
  BarChart3,
  Eye,
  Trash2,
} from 'lucide-react';
import type { ABExperiment, ABVariant, ExperimentStatus } from '@/lib/ab-testing/types';

interface ExperimentWithVariants extends ABExperiment {
  variants: ABVariant[];
}

const statusConfig: Record<
  ExperimentStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-800',
    icon: <Eye className="h-3 w-3" />,
  },
  running: {
    label: 'Running',
    color: 'bg-green-100 text-green-800',
    icon: <Play className="h-3 w-3" />,
  },
  paused: {
    label: 'Paused',
    color: 'bg-yellow-100 text-yellow-800',
    icon: <Pause className="h-3 w-3" />,
  },
  completed: {
    label: 'Completed',
    color: 'bg-blue-100 text-blue-800',
    icon: <CheckCircle className="h-3 w-3" />,
  },
  archived: {
    label: 'Archived',
    color: 'bg-gray-100 text-gray-500',
    icon: <Archive className="h-3 w-3" />,
  },
};

const testElementLabels: Record<string, string> = {
  cta_text: 'CTA Text & Style',
  form_placement: 'Form Placement',
  match_preview_visibility: 'Match Preview',
  hero_layout: 'Hero Layout',
};

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<ExperimentWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchExperiments();
  }, []);

  const fetchExperiments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ab-testing/experiments');
      if (response.ok) {
        const data = await response.json();
        setExperiments(data);
      }
    } catch (error) {
      console.error('Error fetching experiments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: ExperimentStatus) => {
    try {
      const response = await fetch(`/api/ab-testing/experiments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchExperiments();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteExperiment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experiment?')) return;

    try {
      const response = await fetch(`/api/ab-testing/experiments/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchExperiments();
      }
    } catch (error) {
      console.error('Error deleting experiment:', error);
    }
  };

  const filteredExperiments = experiments.filter((exp) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return exp.status === 'running';
    if (activeTab === 'draft') return exp.status === 'draft';
    if (activeTab === 'completed')
      return exp.status === 'completed' || exp.status === 'archived';
    return true;
  });

  const counts = {
    all: experiments.length,
    active: experiments.filter((e) => e.status === 'running').length,
    draft: experiments.filter((e) => e.status === 'draft').length,
    completed: experiments.filter(
      (e) => e.status === 'completed' || e.status === 'archived'
    ).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">A/B Experiments</h1>
          <p className="text-muted-foreground">
            Test and optimize your landing pages
          </p>
        </div>
        <Link href="/dashboard/experiments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Experiment
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="active">Running ({counts.active})</TabsTrigger>
          <TabsTrigger value="draft">Drafts ({counts.draft})</TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({counts.completed})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredExperiments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No experiments found</h3>
                <p className="text-muted-foreground mb-4">
                  {activeTab === 'all'
                    ? 'Create your first A/B test to optimize conversions'
                    : `No ${activeTab} experiments`}
                </p>
                {activeTab === 'all' && (
                  <Link href="/dashboard/experiments/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Experiment
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredExperiments.map((experiment) => (
                <Card key={experiment.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {experiment.name}
                        </CardTitle>
                        <CardDescription>
                          {experiment.description || 'No description'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={statusConfig[experiment.status].color}
                        >
                          {statusConfig[experiment.status].icon}
                          <span className="ml-1">
                            {statusConfig[experiment.status].label}
                          </span>
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/experiments/${experiment.id}`}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/experiments/${experiment.id}/results`}
                              >
                                <BarChart3 className="mr-2 h-4 w-4" />
                                View Results
                              </Link>
                            </DropdownMenuItem>
                            {experiment.status === 'draft' && (
                              <DropdownMenuItem
                                onClick={() =>
                                  updateStatus(experiment.id, 'running')
                                }
                              >
                                <Play className="mr-2 h-4 w-4" />
                                Start Experiment
                              </DropdownMenuItem>
                            )}
                            {experiment.status === 'running' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatus(experiment.id, 'paused')
                                  }
                                >
                                  <Pause className="mr-2 h-4 w-4" />
                                  Pause
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatus(experiment.id, 'completed')
                                  }
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Complete
                                </DropdownMenuItem>
                              </>
                            )}
                            {experiment.status === 'paused' && (
                              <DropdownMenuItem
                                onClick={() =>
                                  updateStatus(experiment.id, 'running')
                                }
                              >
                                <Play className="mr-2 h-4 w-4" />
                                Resume
                              </DropdownMenuItem>
                            )}
                            {experiment.status !== 'running' && (
                              <DropdownMenuItem
                                onClick={() => deleteExperiment(experiment.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Test Element:
                        </span>{' '}
                        <span className="font-medium">
                          {testElementLabels[experiment.test_element] ||
                            experiment.test_element}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Variants:</span>{' '}
                        <span className="font-medium">
                          {experiment.variants?.length || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Traffic:</span>{' '}
                        <span className="font-medium">
                          {experiment.traffic_percentage}%
                        </span>
                      </div>
                      {experiment.started_at && (
                        <div>
                          <span className="text-muted-foreground">
                            Started:
                          </span>{' '}
                          <span className="font-medium">
                            {new Date(experiment.started_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    {experiment.variants && experiment.variants.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {experiment.variants.map((variant) => (
                          <Badge
                            key={variant.id}
                            variant={variant.is_control ? 'default' : 'secondary'}
                          >
                            {variant.name}
                            {variant.is_control && ' (Control)'}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
