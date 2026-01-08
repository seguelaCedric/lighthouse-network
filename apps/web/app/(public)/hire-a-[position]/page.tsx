import { createClient } from '@/lib/supabase/server';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicHeader } from '@/components/pricing/PublicHeader';
import { PublicFooter } from '@/components/pricing/PublicFooter';
import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';

interface Props {
  params: Promise<{ position: string }>;
}

export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { position } = await params;
  const positionTitle = position
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `Hire a ${positionTitle} | Lighthouse Careers`,
    description: `Find exceptional ${positionTitle} professionals worldwide. Browse all locations where we provide ${positionTitle} placement services.`,
  };
}

export default async function PositionHubPage({ params }: Props) {
  const { position } = await params;
  const supabase = await createClient();

  // Find all active landing pages for this position
  const { data: pages, error } = await supabase
    .from('seo_landing_pages')
    .select('*')
    .eq('position_slug', position)
    .eq('is_active', true)
    .order('country', { ascending: true })
    .order('state', { ascending: true })
    .order('city', { ascending: true });

  if (error) {
    console.error('Position hub fetch error:', error);
    return notFound();
  }

  if (!pages || pages.length === 0) {
    return notFound();
  }

  const positionTitle = position
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Group pages by location
  type PageType = (typeof pages)[number];
  const pagesByLocation = pages.reduce<Record<string, PageType[]>>((acc, page) => {
    const locationKey = [page.city, page.state, page.country]
      .filter(Boolean)
      .join(', ');
    if (!acc[locationKey]) {
      acc[locationKey] = [];
    }
    acc[locationKey].push(page);
    return acc;
  }, {});

  // Get related blog posts
  const { data: blogPosts } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('target_position', position)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(6);

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <header className="mb-12 text-center">
          <h1 className="font-serif text-4xl font-semibold text-navy-900 sm:text-5xl">
            Hire a {positionTitle}
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Find exceptional {positionTitle} professionals in {pages.length} locations worldwide
          </p>
        </header>

        {/* Locations Grid */}
        <section className="mb-16">
          <h2 className="mb-8 font-serif text-2xl font-semibold text-navy-900">
            Available Locations
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(pagesByLocation).map(([location, locationPages]: [string, PageType[]]) => {
              const primaryPage = locationPages[0];
              return (
                <Link
                  key={location}
                  href={`/${primaryPage.original_url_path}`}
                  className="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-gold-300 hover:shadow-lg"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gold-600" />
                    <h3 className="font-semibold text-navy-900 group-hover:text-gold-600 transition-colors">
                      {location}
                    </h3>
                  </div>
                  <p className="mb-2 text-sm text-gray-600">
                    {positionTitle} in {location}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gold-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    View page
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Related Blog Posts */}
        {blogPosts && blogPosts.length > 0 && (
          <section>
            <h2 className="mb-8 font-serif text-2xl font-semibold text-navy-900">
              Related Articles
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {blogPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-gold-300 hover:shadow-lg"
                >
                  <h3 className="mb-2 font-semibold text-navy-900 group-hover:text-gold-600 transition-colors">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-gray-600 line-clamp-2">{post.excerpt}</p>
                  )}
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gold-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Read article
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}

