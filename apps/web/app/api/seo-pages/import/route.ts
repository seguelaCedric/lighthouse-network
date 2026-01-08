import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Parse WordPress URL pattern into components
 * Supports multiple URL patterns:
 * - hire-a-[position]-[country]/[state]/[city]
 * - [position]-[country]/[state]/[city]
 * - [position]/[location]
 * - Manual override via body parameters
 */
function parseWordPressUrl(url: string, manualOverrides?: {
  position?: string;
  position_slug?: string;
  country?: string;
  country_slug?: string;
  state?: string;
  state_slug?: string;
  city?: string;
  city_slug?: string;
}): {
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
  try {
    // Extract path from full URL
    const urlObj = new URL(url);
    const urlPath = urlObj.pathname.replace(/^\/|\/$/g, '');
    const parts = urlPath.split('/').filter(p => p);

    if (parts.length === 0) {
      // If manual overrides provided, use them
      if (manualOverrides && manualOverrides.position && manualOverrides.country) {
        return {
          position: manualOverrides.position,
          position_slug: manualOverrides.position_slug || manualOverrides.position.toLowerCase().replace(/\s+/g, '-'),
          country: manualOverrides.country,
          country_slug: manualOverrides.country_slug || manualOverrides.country.toLowerCase().replace(/\s+/g, '-'),
          state: manualOverrides.state || null,
          state_slug: manualOverrides.state_slug || (manualOverrides.state ? manualOverrides.state.toLowerCase().replace(/\s+/g, '-') : null),
          city: manualOverrides.city || null,
          city_slug: manualOverrides.city_slug || (manualOverrides.city ? manualOverrides.city.toLowerCase().replace(/\s+/g, '-') : null),
          original_url_path: urlPath || `${manualOverrides.position_slug || manualOverrides.position.toLowerCase().replace(/\s+/g, '-')}-${manualOverrides.country_slug || manualOverrides.country.toLowerCase().replace(/\s+/g, '-')}`,
        };
      }
      return null;
    }

    let positionSlug: string | null = null;
    let countrySlug: string | null = null;
    let stateSlug: string | null = null;
    let citySlug: string | null = null;

    // Pattern 1: hire-a-[position]-[country]/[state]/[city]
    const firstPart = parts[0];
    let match = firstPart.match(/^hire-a-(.+)-([a-z-]+)$/i);
    
    if (match) {
      positionSlug = match[1];
      countrySlug = match[2];
      stateSlug = parts[1] || null;
      citySlug = parts[2] || null;
    } else {
      // Pattern 2: [position]-[country]/[state]/[city]
      match = firstPart.match(/^(.+)-([a-z-]+)$/i);
      if (match) {
        positionSlug = match[1];
        countrySlug = match[2];
        stateSlug = parts[1] || null;
        citySlug = parts[2] || null;
      } else {
        // Pattern 3: [position]/[location-parts]
        // Try to infer: if first part looks like a position, use it
        positionSlug = firstPart;
        // Remaining parts could be country/state/city
        if (parts.length >= 2) {
          countrySlug = parts[1];
        }
        if (parts.length >= 3) {
          stateSlug = parts[2];
        }
        if (parts.length >= 4) {
          citySlug = parts[3];
        }
      }
    }

    // Apply manual overrides if provided
    if (manualOverrides) {
      if (manualOverrides.position) positionSlug = manualOverrides.position_slug || manualOverrides.position.toLowerCase().replace(/\s+/g, '-');
      if (manualOverrides.country) countrySlug = manualOverrides.country_slug || manualOverrides.country.toLowerCase().replace(/\s+/g, '-');
      if (manualOverrides.state !== undefined) stateSlug = manualOverrides.state_slug || (manualOverrides.state ? manualOverrides.state.toLowerCase().replace(/\s+/g, '-') : null);
      if (manualOverrides.city !== undefined) citySlug = manualOverrides.city_slug || (manualOverrides.city ? manualOverrides.city.toLowerCase().replace(/\s+/g, '-') : null);
    }

    // If we still don't have position and country, and no manual overrides, return null
    if (!positionSlug || !countrySlug) {
      if (manualOverrides && manualOverrides.position && manualOverrides.country) {
        // Use manual overrides to construct
        return {
          position: manualOverrides.position,
          position_slug: manualOverrides.position_slug || manualOverrides.position.toLowerCase().replace(/\s+/g, '-'),
          country: manualOverrides.country,
          country_slug: manualOverrides.country_slug || manualOverrides.country.toLowerCase().replace(/\s+/g, '-'),
          state: manualOverrides.state || null,
          state_slug: manualOverrides.state_slug || (manualOverrides.state ? manualOverrides.state.toLowerCase().replace(/\s+/g, '-') : null),
          city: manualOverrides.city || null,
          city_slug: manualOverrides.city_slug || (manualOverrides.city ? manualOverrides.city.toLowerCase().replace(/\s+/g, '-') : null),
          original_url_path: urlPath,
        };
      }
      return null;
    }

    // Convert slugs to display names
    const position = slugToTitle(positionSlug);
    const country = slugToTitle(countrySlug);

    return {
      position: manualOverrides?.position || position,
      position_slug: positionSlug,
      country: manualOverrides?.country || country,
      country_slug: countrySlug,
      state: manualOverrides?.state !== undefined ? (manualOverrides.state || null) : (stateSlug ? slugToTitle(stateSlug) : null),
      state_slug: stateSlug,
      city: manualOverrides?.city !== undefined ? (manualOverrides.city || null) : (citySlug ? slugToTitle(citySlug) : null),
      city_slug: citySlug,
      original_url_path: urlPath,
    };
  } catch {
    // If URL parsing fails but manual overrides provided, use them
    if (manualOverrides && manualOverrides.position && manualOverrides.country) {
      try {
        const urlObj = new URL(url);
        const urlPath = urlObj.pathname.replace(/^\/|\/$/g, '');
        return {
          position: manualOverrides.position,
          position_slug: manualOverrides.position_slug || manualOverrides.position.toLowerCase().replace(/\s+/g, '-'),
          country: manualOverrides.country,
          country_slug: manualOverrides.country_slug || manualOverrides.country.toLowerCase().replace(/\s+/g, '-'),
          state: manualOverrides.state || null,
          state_slug: manualOverrides.state_slug || (manualOverrides.state ? manualOverrides.state.toLowerCase().replace(/\s+/g, '-') : null),
          city: manualOverrides.city || null,
          city_slug: manualOverrides.city_slug || (manualOverrides.city ? manualOverrides.city.toLowerCase().replace(/\s+/g, '-') : null),
          original_url_path: urlPath || `${manualOverrides.position_slug || manualOverrides.position.toLowerCase().replace(/\s+/g, '-')}-${manualOverrides.country_slug || manualOverrides.country.toLowerCase().replace(/\s+/g, '-')}`,
        };
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Convert slug to title case
 * "new-south-wale" -> "New South Wale"
 * "sydney-2" -> "Sydney"
 */
function slugToTitle(slug: string): string {
  // Remove trailing numbers (like sydney-2)
  const cleaned = slug.replace(/-\d+$/, '');

  return cleaned
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// POST - Import a single WordPress page
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      url, 
      meta_title, 
      meta_description, 
      hero_headline, 
      hero_subheadline, 
      intro_content, 
      benefits,
      // Manual overrides for URL parsing
      position,
      position_slug,
      country,
      country_slug,
      state,
      state_slug,
      city,
      city_slug,
      original_url_path,
      // AI generation option
      generate_ai_content,
    } = body;

    // Either URL or manual fields required
    if (!url && !(position && country)) {
      return NextResponse.json({ 
        error: 'Either URL or position + country are required',
        hint: 'Provide a URL to auto-parse, or manually enter position and country'
      }, { status: 400 });
    }

    // Manual overrides object
    const manualOverrides = {
      position,
      position_slug,
      country,
      country_slug,
      state,
      state_slug,
      city,
      city_slug,
    };

    // Parse URL (or use manual overrides)
    let parsed;
    if (url) {
      parsed = parseWordPressUrl(url, manualOverrides);
    } else {
      // Use manual overrides only
      parsed = parseWordPressUrl('', manualOverrides);
    }

    if (!parsed) {
      return NextResponse.json({ 
        error: 'Could not parse URL or missing required fields',
        hint: 'Please provide either a valid URL or manually enter position and country. Supported URL patterns: hire-a-[position]-[country]/[state]/[city], [position]-[country]/[state]/[city], or [position]/[location]'
      }, { status: 400 });
    }

    // Use provided original_url_path if given, otherwise use parsed
    if (original_url_path) {
      parsed.original_url_path = original_url_path;
    }

    // Build page object
    const page = {
      position: parsed.position,
      position_slug: parsed.position_slug,
      country: parsed.country,
      country_slug: parsed.country_slug,
      state: parsed.state,
      state_slug: parsed.state_slug,
      city: parsed.city,
      city_slug: parsed.city_slug,
      original_url_path: parsed.original_url_path,
      meta_title: meta_title || `Hire a ${parsed.position} in ${parsed.city || parsed.state || parsed.country}`,
      meta_description: meta_description || `Find vetted ${parsed.position} professionals in ${parsed.city || parsed.state || parsed.country}. Lighthouse Careers - 500+ satisfied clients, 300+ placements per year.`,
      hero_headline: hero_headline || `Hire a ${parsed.position} ${parsed.city || parsed.state || parsed.country}`,
      hero_subheadline: hero_subheadline || null,
      intro_content: intro_content || null,
      benefits: (benefits && Array.isArray(benefits) ? benefits : [
        'Exclusive Talent Pool: Access to over 32,000 top-quality candidates across yachting and private household industries.',
        'Trusted by the Elite: Our clients include some of the world\'s most influential individuals and organizations.',
        'Success Fee Model: No placement, no fee – only pay when we deliver the perfect candidate',
        'Confidential & Discreet: Ensuring complete privacy and discretion for our high-profile, international clients.',
      ]) as string[],
      form_heading: 'Ready to hire your next rare talent?',
      cta_text: 'Receive candidates today',
      is_active: true,
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from('seo_landing_pages')
      .upsert(page, {
        onConflict: 'original_url_path',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Import error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json({ 
        error: error.message,
        details: error.details || error.hint || 'Check server logs for more details'
      }, { status: 500 });
    }

    // Optionally generate AI content
    let generatedContent = null;
    if (generate_ai_content && data) {
      try {
        const { generateLandingPageContent } = await import('@lighthouse/ai');
        generatedContent = await generateLandingPageContent({
          position: data.position,
          country: data.country,
          state: data.state,
          city: data.city,
        });

        // Update page with generated content
        const { data: updatedPage, error: updateError } = await supabase
          .from('seo_landing_pages')
          .update({
            about_position: generatedContent.about_position,
            location_info: generatedContent.location_info,
            service_description: generatedContent.service_description,
            process_details: generatedContent.process_details,
            faq_content: generatedContent.faq_content,
            primary_keywords: generatedContent.primary_keywords,
            secondary_keywords: generatedContent.secondary_keywords,
          })
          .eq('id', data.id)
          .select()
          .single();

        if (!updateError && updatedPage) {
          return NextResponse.json({
            success: true,
            page: updatedPage,
            ai_generated: true,
          });
        }
      } catch (aiError) {
        console.error('AI generation error:', aiError);
        // Continue without AI content if generation fails
      }
    }

    return NextResponse.json({
      success: true,
      page: data,
      ai_generated: false,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import page' },
      { status: 500 }
    );
  }
}
