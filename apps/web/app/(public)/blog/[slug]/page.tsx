import { createClient } from '@/lib/supabase/server';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicHeader } from '@/components/pricing/PublicHeader';
import { PublicFooter } from '@/components/pricing/PublicFooter';
import { InternalLinking } from '@/components/seo/InternalLinking';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
// Content is stored as Markdown or HTML - render as HTML for now

export const revalidate = 3600; // Revalidate every hour

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!post) {
    return {
      title: 'Post Not Found | Lighthouse Careers',
    };
  }

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      type: 'article',
      publishedTime: post.published_at || undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !post) {
    notFound();
  }

  // Fetch related landing pages if URLs are provided
  let relatedPages: any[] = [];
  if (post.related_landing_page_urls && post.related_landing_page_urls.length > 0) {
    const { data: pages } = await supabase
      .from('seo_landing_pages')
      .select('id, original_url_path, position, position_slug, city, state, country, hero_headline')
      .in('original_url_path', post.related_landing_page_urls)
      .eq('is_active', true)
      .limit(6);

    relatedPages = pages || [];
  }

  // Fetch content links for this post
  const { data: contentLinks } = await supabase
    .from('seo_content_links')
    .select('*')
    .eq('blog_post_id', post.id)
    .order('priority', { ascending: false })
    .limit(12);

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-2 text-gold-600 hover:text-gold-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        <header className="mb-8">
          <h1 className="font-serif text-4xl font-semibold text-navy-900 sm:text-5xl">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-4 text-xl text-gray-600">{post.excerpt}</p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            {post.published_at && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <time dateTime={post.published_at}>
                  {new Date(post.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </div>
            )}
            {post.target_audience && (
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span className="capitalize">For {post.target_audience}</span>
              </div>
            )}
            {post.target_position && (
              <span className="rounded-full bg-gold-100 px-3 py-1 text-gold-700">
                {post.target_position}
              </span>
            )}
            {post.target_location && (
              <span className="rounded-full bg-navy-100 px-3 py-1 text-navy-700">
                {post.target_location}
              </span>
            )}
          </div>
        </header>

        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Internal Linking Section */}
        {relatedPages.length > 0 && (
          <InternalLinking
            currentPage={{
              id: '',
              position: post.target_position || '',
              position_slug: post.target_position?.toLowerCase().replace(/\s+/g, '-') || '',
              city: null,
              state: null,
              country: post.target_location || '',
              country_slug: post.target_location?.toLowerCase().replace(/\s+/g, '-') || '',
            }}
            relatedPositions={relatedPages}
            relatedLocations={[]}
            contentLinks={contentLinks || []}
          />
        )}
      </article>

      <PublicFooter />
    </div>
  );
}

