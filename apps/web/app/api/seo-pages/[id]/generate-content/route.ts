import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateLandingPageContent } from '@lighthouse/ai';

// POST - Generate AI content for a landing page
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch page data
    const { data: page, error: fetchError } = await supabase
      .from('seo_landing_pages')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Generate content
    console.log('Starting content generation for page:', page.id);
    console.log('Page data:', { position: page.position, country: page.country, state: page.state, city: page.city });
    
    const generatedContent = await generateLandingPageContent({
      position: page.position,
      country: page.country,
      state: page.state,
      city: page.city,
      existingContent: {
        about_position: page.about_position,
        location_info: page.location_info,
        service_description: page.service_description,
        process_details: page.process_details,
      },
    });
    
    console.log('Content generation completed successfully');

    // Return generated content (don't save automatically - let user review first)
    return NextResponse.json({
      success: true,
      content: generatedContent,
    });
  } catch (error) {
    console.error('Content generation error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        error: 'Failed to generate content',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
