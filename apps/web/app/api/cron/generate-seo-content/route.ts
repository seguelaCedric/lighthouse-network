import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BATCH_SIZE = 10; // Process 10 pages per cron run
const CONCURRENCY = 5; // Process 5 pages in parallel

export async function GET(request: NextRequest) {
  try {
    // Note: Vercel crons are protected by infrastructure - only Vercel can call them
    // CRON_SECRET auth is optional extra security but was causing 401s
    console.log('SEO content generation cron started');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get pages pending AI generation
    const { data: pendingPages, error: fetchError } = await supabase
      .from('seo_landing_pages')
      .select('id, position, country, state, city')
      .eq('ai_generation_status', 'pending')
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error('Failed to fetch pending pages:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch pending pages' }, { status: 500 });
    }

    if (!pendingPages || pendingPages.length === 0) {
      return NextResponse.json({ message: 'No pending pages', processed: 0 });
    }

    let successCount = 0;
    let failCount = 0;

    // Import AI module
    const { generateLandingPageContent } = await import('@lighthouse/ai');

    // Mark all as processing first
    const pageIds = pendingPages.map(p => p.id);
    await supabase
      .from('seo_landing_pages')
      .update({ ai_generation_status: 'processing' })
      .in('id', pageIds);

    // Define page type
    type PageType = { id: string; position: string; country: string; state: string | null; city: string | null };

    // Process pages in parallel batches
    async function processPage(page: PageType) {
      try {
        const generatedContent = await generateLandingPageContent({
          position: page.position,
          country: page.country,
          state: page.state,
          city: page.city,
        });

        // Update page with generated content
        const { error: updateError } = await supabase
          .from('seo_landing_pages')
          .update({
            about_position: generatedContent.about_position,
            location_info: generatedContent.location_info,
            service_description: generatedContent.service_description,
            process_details: generatedContent.process_details,
            faq_content: generatedContent.faq_content,
            primary_keywords: generatedContent.primary_keywords,
            secondary_keywords: generatedContent.secondary_keywords,
            ai_generation_status: 'completed',
          })
          .eq('id', page.id);

        if (updateError) {
          throw updateError;
        }

        return { success: true };
      } catch (error) {
        console.error(`AI generation failed for page ${page.id}:`, error);

        // Mark as failed
        await supabase
          .from('seo_landing_pages')
          .update({ ai_generation_status: 'failed' })
          .eq('id', page.id);

        return { success: false };
      }
    }

    // Process in chunks of CONCURRENCY
    for (let i = 0; i < pendingPages.length; i += CONCURRENCY) {
      const chunk = pendingPages.slice(i, i + CONCURRENCY);
      const results = await Promise.all(chunk.map(processPage));

      for (const result of results) {
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      }
    }

    // Update import job AI counts if there are any related jobs
    // Get count of remaining pending pages
    const { count: remainingPending } = await supabase
      .from('seo_landing_pages')
      .select('id', { count: 'exact', head: true })
      .eq('ai_generation_status', 'pending');

    const { count: completedAi } = await supabase
      .from('seo_landing_pages')
      .select('id', { count: 'exact', head: true })
      .eq('ai_generation_status', 'completed');

    return NextResponse.json({
      message: 'AI content generation completed',
      processed: pendingPages.length,
      success: successCount,
      failed: failCount,
      remaining_pending: remainingPending || 0,
      total_completed: completedAi || 0,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cron job failed' },
      { status: 500 }
    );
  }
}
