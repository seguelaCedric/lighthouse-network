'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Trash2, FlaskConical } from 'lucide-react';
import Link from 'next/link';
import type {
  TestElement,
  PageType,
  CreateVariantInput,
  VariantConfig,
  CTAConfig,
  FormPlacementConfig,
  MatchPreviewConfig,
  HeroLayoutConfig,
} from '@/lib/ab-testing/types';

interface VariantForm extends CreateVariantInput {
  id: string;
}

const testElementOptions: { value: TestElement; label: string; description: string }[] = [
  {
    value: 'cta_text',
    label: 'CTA Text & Style',
    description: 'Test different call-to-action button text, colors, and sizes',
  },
  {
    value: 'form_placement',
    label: 'Form Placement',
    description: 'Test where the enquiry form appears on the page',
  },
  {
    value: 'match_preview_visibility',
    label: 'Match Preview',
    description: 'Test showing/hiding candidate match previews',
  },
  {
    value: 'hero_layout',
    label: 'Hero Layout',
    description: 'Test different hero section layouts',
  },
];

const pageTypeOptions = [
  { value: 'hire_landing', label: 'Hire Landing Pages' },
  { value: 'job_listing', label: 'Job Listings' },
  { value: 'all', label: 'All Pages' },
];

const ctaColorOptions = [
  { value: 'primary', label: 'Primary (Gold)' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'accent', label: 'Accent' },
];

const ctaSizeOptions = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
];

const formPlacementOptions = [
  { value: 'hero', label: 'Hero Section' },
  { value: 'after_benefits', label: 'After Benefits' },
  { value: 'sidebar', label: 'Sidebar' },
  { value: 'sticky', label: 'Sticky Bottom' },
];

const previewPositionOptions = [
  { value: 'hero', label: 'In Hero' },
  { value: 'benefits', label: 'After Benefits' },
];

const heroLayoutOptions = [
  { value: 'centered', label: 'Centered' },
  { value: 'split', label: 'Split (Image + Content)' },
  { value: 'full_width', label: 'Full Width' },
];

function getDefaultConfig(testElement: TestElement): VariantConfig {
  switch (testElement) {
    case 'cta_text':
      return { cta_text: 'Get Started', cta_color: 'primary', cta_size: 'lg' };
    case 'form_placement':
      return { placement: 'hero' };
    case 'match_preview_visibility':
      return { show: true, preview_count: 3, position: 'hero' };
    case 'hero_layout':
      return { layout: 'centered' };
  }
}

function generateVariantKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

export default function NewExperimentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [testElement, setTestElement] = useState<TestElement>('cta_text');
  const [pageType, setPageType] = useState<PageType>('hire_landing');
  const [trafficPercentage, setTrafficPercentage] = useState(100);
  const [minimumSampleSize, setMinimumSampleSize] = useState(100);
  const [variants, setVariants] = useState<VariantForm[]>([
    {
      id: '1',
      name: 'Control',
      variant_key: 'control',
      is_control: true,
      config: getDefaultConfig('cta_text'),
      weight: 1,
    },
    {
      id: '2',
      name: 'Variant A',
      variant_key: 'variant_a',
      is_control: false,
      config: getDefaultConfig('cta_text'),
      weight: 1,
    },
  ]);

  const handleTestElementChange = (value: TestElement) => {
    setTestElement(value);
    // Update variant configs
    setVariants((prev) =>
      prev.map((v) => ({ ...v, config: getDefaultConfig(value) }))
    );
  };

  const addVariant = () => {
    const newId = String(Date.now());
    const newName = `Variant ${String.fromCharCode(64 + variants.length)}`;
    setVariants([
      ...variants,
      {
        id: newId,
        name: newName,
        variant_key: generateVariantKey(newName),
        is_control: false,
        config: getDefaultConfig(testElement),
        weight: 1,
      },
    ]);
  };

  const removeVariant = (id: string) => {
    if (variants.length <= 2) return;
    setVariants(variants.filter((v) => v.id !== id));
  };

  const updateVariant = (id: string, updates: Partial<VariantForm>) => {
    setVariants(
      variants.map((v) => {
        if (v.id !== id) return v;
        const updated = { ...v, ...updates };
        // Auto-update variant_key when name changes
        if (updates.name) {
          updated.variant_key = generateVariantKey(updates.name);
        }
        return updated;
      })
    );
  };

  const updateVariantConfig = (
    id: string,
    configKey: string,
    value: unknown
  ) => {
    setVariants(
      variants.map((v) => {
        if (v.id !== id) return v;
        return {
          ...v,
          config: { ...v.config, [configKey]: value },
        };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter an experiment name');
      return;
    }

    if (variants.length < 2) {
      alert('You need at least 2 variants');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/ab-testing/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          test_element: testElement,
          target_page_type: pageType,
          traffic_percentage: trafficPercentage,
          minimum_sample_size: minimumSampleSize,
          variants: variants.map(({ id, ...v }) => v),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/dashboard/experiments/${data.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create experiment');
      }
    } catch (error) {
      console.error('Error creating experiment:', error);
      alert('Failed to create experiment');
    } finally {
      setLoading(false);
    }
  };

  const renderVariantConfig = (variant: VariantForm) => {
    const config = variant.config;

    switch (testElement) {
      case 'cta_text': {
        const ctaConfig = config as CTAConfig;
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Button Text</Label>
              <Input
                value={ctaConfig.cta_text || ''}
                onChange={(e) =>
                  updateVariantConfig(variant.id, 'cta_text', e.target.value)
                }
                placeholder="e.g., Get Matched Now"
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Color"
                options={ctaColorOptions}
                value={ctaConfig.cta_color || 'primary'}
                onChange={(e) =>
                  updateVariantConfig(variant.id, 'cta_color', e.target.value)
                }
              />
              <Select
                label="Size"
                options={ctaSizeOptions}
                value={ctaConfig.cta_size || 'lg'}
                onChange={(e) =>
                  updateVariantConfig(variant.id, 'cta_size', e.target.value)
                }
              />
            </div>
          </div>
        );
      }

      case 'form_placement': {
        const formConfig = config as FormPlacementConfig;
        return (
          <Select
            label="Form Placement"
            options={formPlacementOptions}
            value={formConfig.placement || 'hero'}
            onChange={(e) =>
              updateVariantConfig(variant.id, 'placement', e.target.value)
            }
          />
        );
      }

      case 'match_preview_visibility': {
        const previewConfig = config as MatchPreviewConfig;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Show Match Preview</Label>
                <p className="text-xs text-gray-500 mt-0.5">Display candidate previews on the page</p>
              </div>
              <Switch
                checked={previewConfig.show ?? true}
                onCheckedChange={(v) =>
                  updateVariantConfig(variant.id, 'show', v)
                }
              />
            </div>
            {previewConfig.show !== false && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Preview Count</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={previewConfig.preview_count || 3}
                    onChange={(e) =>
                      updateVariantConfig(
                        variant.id,
                        'preview_count',
                        parseInt(e.target.value) || 3
                      )
                    }
                    className="mt-1.5"
                  />
                </div>
                <Select
                  label="Position"
                  options={previewPositionOptions}
                  value={previewConfig.position || 'hero'}
                  onChange={(e) =>
                    updateVariantConfig(variant.id, 'position', e.target.value)
                  }
                />
              </div>
            )}
          </div>
        );
      }

      case 'hero_layout': {
        const heroConfig = config as HeroLayoutConfig;
        return (
          <Select
            label="Hero Layout"
            options={heroLayoutOptions}
            value={heroConfig.layout || 'centered'}
            onChange={(e) =>
              updateVariantConfig(variant.id, 'layout', e.target.value)
            }
          />
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/experiments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Create New Experiment
          </h1>
          <p className="text-gray-500">
            Set up an A/B test to optimize your landing pages
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Define what you want to test and where
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Experiment Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., CTA Button Text Test"
                  className="mt-1.5"
                  required
                />
              </div>
              <Select
                label="Target Pages"
                options={pageTypeOptions}
                value={pageType}
                onChange={(e) => setPageType(e.target.value as PageType)}
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you're testing and why (optional)"
                rows={2}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Test Element
              </Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {testElementOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleTestElementChange(opt.value)}
                    className={`p-4 text-left border-2 rounded-xl transition-all ${
                      testElement === opt.value
                        ? 'border-gold-500 bg-gold-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`font-semibold ${testElement === opt.value ? 'text-gold-700' : 'text-gray-900'}`}>
                      {opt.label}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {opt.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Traffic & Sample Size */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic & Sample Size</CardTitle>
            <CardDescription>
              Configure how much traffic to include and when to conclude
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-3">
                <Label className="text-sm font-medium text-gray-700">Traffic Allocation</Label>
                <span className="text-sm font-bold text-gold-600 bg-gold-50 px-2 py-0.5 rounded">
                  {trafficPercentage}%
                </span>
              </div>
              <Slider
                value={[trafficPercentage]}
                onValueChange={(v) => setTrafficPercentage(v[0])}
                min={10}
                max={100}
                step={10}
              />
              <p className="text-sm text-gray-500 mt-2">
                Percentage of visitors who will be part of this experiment
              </p>
            </div>

            <div>
              <Label htmlFor="sampleSize" className="text-sm font-medium text-gray-700">
                Minimum Sample Size (per variant)
              </Label>
              <Input
                id="sampleSize"
                type="number"
                min={50}
                max={10000}
                value={minimumSampleSize}
                onChange={(e) =>
                  setMinimumSampleSize(parseInt(e.target.value) || 100)
                }
                className="mt-1.5 max-w-xs"
              />
              <p className="text-sm text-gray-500 mt-2">
                The experiment needs at least{' '}
                <span className="font-semibold text-gray-700">{(minimumSampleSize * variants.length).toLocaleString()}</span>{' '}
                total visitors for statistical significance
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Variants */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Variants</CardTitle>
                <CardDescription>
                  Configure the different versions to test
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addVariant}
                disabled={variants.length >= 4}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Variant
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {variants.map((variant) => (
              <div
                key={variant.id}
                className={`rounded-xl border-2 p-5 ${
                  variant.is_control
                    ? 'border-navy-200 bg-navy-50/50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Input
                      value={variant.name}
                      onChange={(e) =>
                        updateVariant(variant.id, { name: e.target.value })
                      }
                      className="w-40 font-semibold"
                    />
                    {variant.is_control && (
                      <span className="text-xs bg-navy-100 text-navy-700 px-2.5 py-1 rounded-full font-medium">
                        Control
                      </span>
                    )}
                  </div>
                  {variants.length > 2 && !variant.is_control && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVariant(variant.id)}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {renderVariantConfig(variant)}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t">
          <Link href="/dashboard/experiments">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <FlaskConical className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <FlaskConical className="mr-2 h-4 w-4" />
                Create Experiment
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
