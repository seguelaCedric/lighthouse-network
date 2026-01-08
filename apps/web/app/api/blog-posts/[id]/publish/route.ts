import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST - Publish blog post
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

    // Update status to published and set published_at
    const { data, error } = await supabase
      .from('blog_posts')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Blog post publish error:', error);
      return NextResponse.json({ error: 'Failed to publish blog post' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Blog post publish error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

