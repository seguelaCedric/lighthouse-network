'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Play,
  Pause,
  CheckCircle,
  Save,
  Trash2,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import type {
  ABExperiment,
  ABVariant,
  ExperimentStatus,
  CTAConfig,
  FormPlacementConfig,
  MatchPreviewConfig,
  HeroLayoutConfig,
} from '@/lib/ab-testing/types';

interface ExperimentWithVariants extends ABExperiment {
  variants: ABVariant[];
}

const statusConfig: Record<
  ExperimentStatus,
  { label: string; color: string }
> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  running: { label: 'Running', color: 'bg-green-100 text-green-800' },
  paused: { label: 'Paused', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800' },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-500' },
};

const testElementLabels: Record<string, string> = {
  cta_text: 'CTA Text & Style',
  form_placement: 'Form Placement',
  match_preview_visibility: 'Match Preview',
  hero_layout: 'Hero Layout',
};

export default function ExperimentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [experiment, setExperiment] = useState<ExperimentWithVariants | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trafficPercentage, setTrafficPercentage] = useState(100);
  const [minimumSampleSize, setMinimumSampleSize] = useState(100);

  useEffect(() => {
    fetchExperiment();
  }, [id]);

  const fetchExperiment = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ab-testing/experiments/${id}`);
      if (response.ok) {
        const data = await response.json();
        setExperiment(data);
        setName(data.name);
        setDescription(data.description || '');
        setTrafficPercentage(data.traffic_percentage);
        setMinimumSampleSize(data.minimum_sample_size);
      } else if (response.status === 404) {
        router.push('/dashboard/experiments');
      }
    } catch (error) {
      console.error('Error fetching experiment:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: ExperimentStatus) => {
    try {
      const response = await fetch(`/api/ab-testing/experiments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchExperiment();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/ab-testing/experiments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          traffic_percentage: trafficPercentage,
          minimum_sample_size: minimumSampleSize,
        }),
      });

      if (response.ok) {
        fetchExperiment();
      }
    } catch (error) {
      console.error('Error saving changes:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteExperiment = async () => {
    try {
      const response = await fetch(`/api/ab-testing/experiments/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard/experiments');
      }
    } catch (error) {
      console.error('Error deleting experiment:', error);
    }
  };

  const renderVariantConfig = (variant: ABVariant) => {
    const config = variant.config;

    switch (experiment?.test_element) {
      case 'cta_text': {
        const ctaConfig = config as CTAConfig;
        return (
          <div className="space-y-1 text-sm">
            <div>
              <span className="text-muted-foreground">Text:</span>{' '}
              {ctaConfig.cta_text}
            </div>
            <div>
              <span className="text-muted-foreground">Color:</span>{' '}
              {ctaConfig.cta_color}
            </div>
            <div>
              <span className="text-muted-foreground">Size:</span>{' '}
              {ctaConfig.cta_size}
            </div>
          </div>
        );
      }

      case 'form_placement': {
        const formConfig = config as FormPlacementConfig;
        return (
          <div className="text-sm">
            <span className="text-muted-foreground">Placement:</span>{' '}
            {formConfig.placement}
          </div>
        );
      }

      case 'match_preview_visibility': {
        const previewConfig = config as MatchPreviewConfig;
        return (
          <div className="space-y-1 text-sm">
            <div>
              <span className="text-muted-foreground">Show:</span>{' '}
              {previewConfig.show ? 'Yes' : 'No'}
            </div>
            {previewConfig.show && (
              <>
                <div>
                  <span className="text-muted-foreground">Count:</span>{' '}
                  {previewConfig.preview_count}
                </div>
                <div>
                  <span className="text-muted-foreground">Position:</span>{' '}
                  {previewConfig.position}
                </div>
              </>
            )}
          </div>
        );
      }

      case 'hero_layout': {
        const heroConfig = config as HeroLayoutConfig;
        return (
          <div className="text-sm">
            <span className="text-muted-foreground">Layout:</span>{' '}
            {heroConfig.layout}
          </div>
        );
      }

      default:
        return (
          <pre className="text-xs bg-muted p-2 rounded">
            {JSON.stringify(config, null, 2)}
          </pre>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!experiment) {
    return null;
  }

  const isEditable = experiment.status === 'draft';
  const hasChanges =
    name !== experiment.name ||
    description !== (experiment.description || '') ||
    trafficPercentage !== experiment.traffic_percentage ||
    minimumSampleSize !== experiment.minimum_sample_size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/experiments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {experiment.name}
              </h1>
              <Badge
                variant="outline"
                className={statusConfig[experiment.status].color}
              >
                {statusConfig[experiment.status].label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {testElementLabels[experiment.test_element]} test
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/experiments/${id}/results`}>
            <Button variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Results
            </Button>
          </Link>
          {experiment.status === 'draft' && (
            <Button onClick={() => updateStatus('running')}>
              <Play className="mr-2 h-4 w-4" />
              Start Experiment
            </Button>
          )}
          {experiment.status === 'running' && (
            <>
              <Button variant="outline" onClick={() => updateStatus('paused')}>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
              <Button onClick={() => updateStatus('completed')}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete
              </Button>
            </>
          )}
          {experiment.status === 'paused' && (
            <Button onClick={() => updateStatus('running')}>
              <Play className="mr-2 h-4 w-4" />
              Resume
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Experiment Settings</CardTitle>
              <CardDescription>
                {isEditable
                  ? 'Configure your experiment before starting'
                  : 'Settings cannot be changed while experiment is active'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isEditable}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!isEditable}
                  rows={2}
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Traffic Allocation</Label>
                  <span className="text-sm font-medium">
                    {trafficPercentage}%
                  </span>
                </div>
                <Slider
                  value={[trafficPercentage]}
                  onValueChange={(v) => setTrafficPercentage(v[0])}
                  min={10}
                  max={100}
                  step={10}
                  disabled={!isEditable}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sampleSize">Minimum Sample Size</Label>
                <Input
                  id="sampleSize"
                  type="number"
                  value={minimumSampleSize}
                  onChange={(e) =>
                    setMinimumSampleSize(parseInt(e.target.value) || 100)
                  }
                  disabled={!isEditable}
                />
              </div>

              {isEditable && hasChanges && (
                <Button onClick={saveChanges} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Variants</CardTitle>
              <CardDescription>
                The different versions being tested
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {experiment.variants?.map((variant) => (
                <Card key={variant.id} className="border-dashed">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{variant.name}</span>
                      {variant.is_control && (
                        <Badge variant="secondary">Control</Badge>
                      )}
                      <Badge variant="outline">Weight: {variant.weight}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>{renderVariantConfig(variant)}</CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Test Element</span>
                <span className="font-medium">
                  {testElementLabels[experiment.test_element]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target Pages</span>
                <span className="font-medium">
                  {experiment.target_page_type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Variants</span>
                <span className="font-medium">
                  {experiment.variants?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">
                  {new Date(experiment.created_at).toLocaleDateString()}
                </span>
              </div>
              {experiment.started_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Started</span>
                  <span className="font-medium">
                    {new Date(experiment.started_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              {experiment.ended_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ended</span>
                  <span className="font-medium">
                    {new Date(experiment.ended_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {experiment.target_positions && experiment.target_positions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Target Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {experiment.target_positions.map((pos) => (
                    <Badge key={pos} variant="outline">
                      {pos}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {experiment.status !== 'running' && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Experiment
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Experiment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. All data including variants,
                        assignments, and conversions will be permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={deleteExperiment}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
