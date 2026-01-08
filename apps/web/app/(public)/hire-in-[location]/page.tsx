import { createClient } from '@/lib/supabase/server';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicHeader } from '@/components/pricing/PublicHeader';
import { PublicFooter } from '@/components/pricing/PublicFooter';
import Link from 'next/link';
import { Briefcase, ArrowRight } from 'lucide-react';

interface Props {
  params: Promise<{ location: string }>;
}

export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { location } = await params;
  const locationTitle = location
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `Hire Staff in ${locationTitle} | Lighthouse Careers`,
    description: `Find exceptional yacht crew and private household staff in ${locationTitle}. Browse all positions available in ${locationTitle}.`,
  };
}

export default async function LocationHubPage({ params }: Props) {
  const { location } = await params;
  const supabase = await createClient();

  // Try to match by city, state, or country slug
  const locationLower = location.toLowerCase();

  const { data: pages, error } = await supabase
    .from('seo_landing_pages')
    .select('*')
    .eq('is_active', true)
    .or(
      `city_slug.ilike.%${locationLower}%,state_slug.ilike.%${locationLower}%,country_slug.ilike.%${locationLower}%`
    )
    .order('position', { ascending: true })
    .order('city', { ascending: true });

  if (error) {
    console.error('Location hub fetch error:', error);
    return notFound();
  }

  if (!pages || pages.length === 0) {
    return notFound();
  }

  const locationTitle = location
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Group pages by position
  const pagesByPosition = pages.reduce((acc, page) => {
    if (!acc[page.position]) {
      acc[page.position] = [];
    }
    acc[page.position].push(page);
    return acc;
  }, {} as Record<string, typeof pages>);

  // Get related blog posts
  const { data: blogPosts } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('target_location', locationTitle)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(6);

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <header className="mb-12 text-center">
          <h1 className="font-serif text-4xl font-semibold text-navy-900 sm:text-5xl">
            Hire Staff in {locationTitle}
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Find exceptional professionals for {Object.keys(pagesByPosition).length} positions in{' '}
            {locationTitle}
          </p>
        </header>

        {/* Positions Grid */}
        <section className="mb-16">
          <h2 className="mb-8 font-serif text-2xl font-semibold text-navy-900">
            Available Positions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(pagesByPosition).map(([position, positionPages]) => {
              const primaryPage = positionPages[0];
              return (
                <Link
                  key={position}
                  href={`/${primaryPage.original_url_path}`}
                  className="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-gold-300 hover:shadow-lg"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-gold-600" />
                    <h3 className="font-semibold text-navy-900 group-hover:text-gold-600 transition-colors">
                      {position}
                    </h3>
                  </div>
                  <p className="mb-2 text-sm text-gray-600">
                    Hire a {position} in {locationTitle}
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

