import { createClient } from '@/lib/supabase/server';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CornerstonePage } from '@/components/seo/CornerstonePage';
import { PublicHeader } from '@/components/pricing/PublicHeader';
import { PublicFooter } from '@/components/pricing/PublicFooter';
import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import { cache } from 'react';

// Map position slugs to blog post target_position values
const SLUG_TO_BLOG_POSITION: Record<string, string> = {
  // Household Staff (legacy SEO slugs)
  'butler': 'Butler',
  'house-manager': 'House Manager',
  'pa': 'Personal Assistant',
  'private-chef': 'Private Chef',
  // Cornerstone slugs (match blog post target_position)
  'personal-assistant': 'Personal Assistant',
  'estate-manager': 'Estate Manager',
  'nanny': 'Nanny',
  'housekeeper': 'Housekeeper',
  'governess': 'Governess',
  // Yacht Crew
  'captain': 'Captain',
  'chief-stewardess': 'Chief Stewardess',
  'yacht-chef': 'Yacht Chef',
  'first-officer': 'First Officer',
  'chief-engineer': 'Chief Engineer',
  'bosun': 'Bosun',
  'deckhand': 'Deckhand',
  'stewardess': 'Stewardess',
  'second-engineer': 'Second Engineer',
  'eto': 'ETO',
  'second-stewardess': 'Second Stewardess',
};

interface Props {
  params: Promise<{ position: string }>;
}

export const revalidate = 3600;

// Cache cornerstone page lookup
const getCornerstonePage = cache(async (positionSlug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('seo_cornerstone_pages')
    .select('*')
    .eq('position_slug', positionSlug)
    .eq('is_active', true)
    .single();
  return data;
});

// Cache location pages lookup
const getLocationPages = cache(async (positionSlug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('seo_landing_pages')
    .select('id, original_url_path, city, state, country, hero_headline')
    .eq('position_slug', positionSlug)
    .eq('is_active', true)
    .order('country', { ascending: true })
    .order('city', { ascending: true })
    .limit(100);
  return data || [];
});

// Cache blog posts lookup
const getBlogPosts = cache(async (targetPosition: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, content_type')
    .eq('target_position', targetPosition)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(12);
  return data || [];
});

// Dynamic params - pages are generated on demand for any position slug
export const dynamicParams = true;

// Optional: Pre-generate popular positions for faster first load
export async function generateStaticParams() {
  // Return empty array - all pages generated on demand
  // This ensures cornerstone pages with any slug work
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { position } = await params;

  // Check for cornerstone page with custom meta
  const cornerstone = await getCornerstonePage(position);
  if (cornerstone) {
    return {
      title: cornerstone.meta_title,
      description: cornerstone.meta_description,
      openGraph: {
        title: cornerstone.meta_title,
        description: cornerstone.meta_description,
        type: 'website',
      },
    };
  }

  // Fallback to generic meta
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

  // First, check for a cornerstone page
  const cornerstone = await getCornerstonePage(position);

  // Get related data
  const blogPositionName = SLUG_TO_BLOG_POSITION[position];
  const [locationPages, blogPosts] = await Promise.all([
    getLocationPages(position),
    blogPositionName ? getBlogPosts(blogPositionName) : Promise.resolve([]),
  ]);

  // If cornerstone page exists, render the premium CornerstonePage component
  if (cornerstone) {
    return (
      <CornerstonePage
        data={cornerstone}
        locationPages={locationPages}
        blogPosts={blogPosts}
      />
    );
  }

  // Fallback: If no cornerstone but has location pages, render simple hub
  if (locationPages.length > 0) {
    const positionTitle = position
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    type PageType = (typeof locationPages)[number];
    const pagesByLocation = locationPages.reduce<Record<string, PageType[]>>((acc, page) => {
      const locationKey = [page.city, page.state, page.country]
        .filter(Boolean)
        .join(', ');
      if (!acc[locationKey]) acc[locationKey] = [];
      acc[locationKey].push(page);
      return acc;
    }, {});

    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />

        <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <header className="mb-12 text-center">
            <h1 className="font-serif text-4xl font-semibold text-navy-900 sm:text-5xl">
              Hire a {positionTitle}
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Find exceptional {positionTitle} professionals in {locationPages.length} locations worldwide
            </p>
          </header>

          <section className="mb-16">
            <h2 className="mb-8 font-serif text-2xl font-semibold text-navy-900">
              Available Locations
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(pagesByLocation).map(([location, pages]: [string, PageType[]]) => {
                const primaryPage = pages[0];
                return (
                  <Link
                    key={location}
                    href={`/hire/${primaryPage.original_url_path}`}
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

  // No cornerstone and no location pages - 404
  return notFound();
}
