import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const BulkImportItemSchema = z.object({
  url: z.string().optional(),
  position: z.string().optional(),
  position_slug: z.string().optional(),
  country: z.string().optional(),
  country_slug: z.string().optional(),
  state: z.string().optional(),
  state_slug: z.string().optional(),
  city: z.string().optional(),
  city_slug: z.string().optional(),
});

const BulkImportSchema = z.object({
  items: z.array(BulkImportItemSchema).min(1).max(5000),
  generate_ai_content: z.boolean().default(false),
});

// POST - Create a bulk import job
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const parseResult = BulkImportSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({
        error: 'Invalid request body',
        details: parseResult.error.issues
      }, { status: 400 });
    }

    const { items, generate_ai_content } = parseResult.data;

    // Validate items - each needs either URL or position+country
    const validItems = items.filter(item => item.url || (item.position && item.country));
    if (validItems.length === 0) {
      return NextResponse.json({
        error: 'No valid items found. Each row needs either a URL or position + country'
      }, { status: 400 });
    }

    // Create the import job
    const { data: job, error: jobError } = await supabase
      .from('seo_import_jobs')
      .insert({
        user_id: user.id,
        status: 'pending',
        total_items: validItems.length,
        processed_items: 0,
        created_pages: 0,
        failed_items: 0,
        generate_ai_content,
        ai_generated_count: 0,
        ai_pending_count: generate_ai_content ? validItems.length : 0,
        items: validItems,
        errors: [],
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('Failed to create import job:', jobError);
      return NextResponse.json({ error: 'Failed to create import job' }, { status: 500 });
    }

    // Start processing immediately in the background (fire and forget)
    // We don't await this - it runs async
    processImportJob(job.id).catch(err => {
      console.error(`Background job ${job.id} failed:`, err);
    });

    return NextResponse.json({
      success: true,
      job_id: job.id,
      total_items: validItems.length,
      message: `Import job created. Processing ${validItems.length} items...`
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create import job' },
      { status: 500 }
    );
  }
}

// Background processing function
async function processImportJob(jobId: string) {
  const { createClient: createServiceClient } = await import('@supabase/supabase-js');

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get the job
  const { data: job, error: fetchError } = await supabase
    .from('seo_import_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (fetchError || !job) {
    console.error('Failed to fetch job:', fetchError);
    return;
  }

  // Update status to processing
  await supabase
    .from('seo_import_jobs')
    .update({ status: 'processing', started_at: new Date().toISOString() })
    .eq('id', jobId);

  const items = job.items as any[];
  const errors: Array<{ index: number; error: string }> = [];
  let createdPages = 0;
  let processedItems = 0;

  // Process in batches of 50
  const BATCH_SIZE = 50;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const pagesToUpsert: any[] = [];

    for (let j = 0; j < batch.length; j++) {
      const item = batch[j];
      const index = i + j;

      try {
        const parsed = parseItem(item);
        if (!parsed) {
          errors.push({ index, error: 'Could not parse URL or missing required fields' });
          continue;
        }

        const page = buildPageObject(parsed, job.generate_ai_content);
        pagesToUpsert.push(page);
      } catch (err) {
        errors.push({ index, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    // Upsert batch
    if (pagesToUpsert.length > 0) {
      const { data, error } = await supabase
        .from('seo_landing_pages')
        .upsert(pagesToUpsert, { onConflict: 'original_url_path', ignoreDuplicates: false })
        .select('id');

      if (error) {
        // Mark all items in batch as failed
        for (let k = 0; k < pagesToUpsert.length; k++) {
          errors.push({ index: i + k, error: error.message });
        }
      } else if (data) {
        createdPages += data.length;
      }
    }

    processedItems = Math.min(i + BATCH_SIZE, items.length);

    // Update progress every batch
    await supabase
      .from('seo_import_jobs')
      .update({
        processed_items: processedItems,
        created_pages: createdPages,
        failed_items: errors.length,
        errors: errors.slice(-100), // Keep last 100 errors
      })
      .eq('id', jobId);
  }

  // Mark job as completed
  await supabase
    .from('seo_import_jobs')
    .update({
      status: 'completed',
      processed_items: items.length,
      created_pages: createdPages,
      failed_items: errors.length,
      ai_pending_count: job.generate_ai_content ? createdPages : 0,
      errors: errors.slice(-100),
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

function parseItem(item: any): {
  position: string;
  position_slug: string;
  country: string;
  country_slug: string;
  state: string | null;
  state_slug: string | null;
  city: string | null;
  city_slug: string | null;
  original_url_path: string;
} | null {
  const manualOverrides = {
    position: item.position,
    position_slug: item.position_slug,
    country: item.country,
    country_slug: item.country_slug,
    state: item.state,
    state_slug: item.state_slug,
    city: item.city,
    city_slug: item.city_slug,
  };

  // If we have manual position and country, use those
  if (item.position && item.country) {
    const posSlug = item.position_slug || item.position.toLowerCase().replace(/\s+/g, '-');
    const countrySlug = item.country_slug || item.country.toLowerCase().replace(/\s+/g, '-');
    const stateSlug = item.state_slug || (item.state ? item.state.toLowerCase().replace(/\s+/g, '-') : null);
    const citySlug = item.city_slug || (item.city ? item.city.toLowerCase().replace(/\s+/g, '-') : null);

    let generatedPath = `hire-a-${posSlug}-${countrySlug}`;
    if (stateSlug) generatedPath += `/${stateSlug}`;
    if (citySlug) generatedPath += `/${citySlug}`;

    return {
      position: item.position,
      position_slug: posSlug,
      country: item.country,
      country_slug: countrySlug,
      state: item.state || null,
      state_slug: stateSlug,
      city: item.city || null,
      city_slug: citySlug,
      original_url_path: generatedPath,
    };
  }

  // Try to parse URL
  if (item.url) {
    try {
      const urlObj = new URL(item.url);
      const urlPath = urlObj.pathname.replace(/^\/|\/$/g, '');
      const parts = urlPath.split('/').filter((p: string) => p);

      if (parts.length === 0) return null;

      let positionSlug: string | null = null;
      let countrySlug: string | null = null;
      let stateSlug: string | null = null;
      let citySlug: string | null = null;

      const firstPart = parts[0];
      let match = firstPart.match(/^hire-a-(.+)-([a-z-]+)$/i);

      if (match) {
        positionSlug = match[1];
        countrySlug = match[2];
        stateSlug = parts[1] || null;
        citySlug = parts[2] || null;
      } else {
        match = firstPart.match(/^(.+)-([a-z-]+)$/i);
        if (match) {
          positionSlug = match[1];
          countrySlug = match[2];
          stateSlug = parts[1] || null;
          citySlug = parts[2] || null;
        }
      }

      // Apply manual overrides
      if (manualOverrides.position) positionSlug = manualOverrides.position_slug || manualOverrides.position.toLowerCase().replace(/\s+/g, '-');
      if (manualOverrides.country) countrySlug = manualOverrides.country_slug || manualOverrides.country.toLowerCase().replace(/\s+/g, '-');
      if (manualOverrides.state) stateSlug = manualOverrides.state_slug || manualOverrides.state.toLowerCase().replace(/\s+/g, '-');
      if (manualOverrides.city) citySlug = manualOverrides.city_slug || manualOverrides.city.toLowerCase().replace(/\s+/g, '-');

      if (!positionSlug || !countrySlug) return null;

      return {
        position: manualOverrides.position || slugToTitle(positionSlug),
        position_slug: positionSlug,
        country: manualOverrides.country || slugToTitle(countrySlug),
        country_slug: countrySlug,
        state: manualOverrides.state || (stateSlug ? slugToTitle(stateSlug) : null),
        state_slug: stateSlug,
        city: manualOverrides.city || (citySlug ? slugToTitle(citySlug) : null),
        city_slug: citySlug,
        original_url_path: urlPath,
      };
    } catch {
      return null;
    }
  }

  return null;
}

function slugToTitle(slug: string): string {
  const cleaned = slug.replace(/-\d+$/, '');
  return cleaned
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function buildPageObject(parsed: NonNullable<ReturnType<typeof parseItem>>, generateAi: boolean) {
  return {
    position: parsed.position,
    position_slug: parsed.position_slug,
    country: parsed.country,
    country_slug: parsed.country_slug,
    state: parsed.state,
    state_slug: parsed.state_slug,
    city: parsed.city,
    city_slug: parsed.city_slug,
    original_url_path: parsed.original_url_path,
    meta_title: `Hire a ${parsed.position} in ${parsed.city || parsed.state || parsed.country}`,
    meta_description: `Find vetted ${parsed.position} professionals in ${parsed.city || parsed.state || parsed.country}. Lighthouse Careers - 500+ satisfied clients, 300+ placements per year.`,
    hero_headline: `Hire a ${parsed.position} ${parsed.city || parsed.state || parsed.country}`,
    hero_subheadline: null,
    intro_content: null,
    benefits: [
      'Exclusive Talent Pool: Access to over 32,000 top-quality candidates across yachting and private household industries.',
      'Trusted by the Elite: Our clients include some of the world\'s most influential individuals and organizations.',
      'Success Fee Model: No placement, no fee – only pay when we deliver the perfect candidate',
      'Confidential & Discreet: Ensuring complete privacy and discretion for our high-profile, international clients.',
    ],
    form_heading: 'Ready to hire your next rare talent?',
    cta_text: 'Receive candidates today',
    is_active: true,
    ai_generation_status: generateAi ? 'pending' : 'none',
  };
}
