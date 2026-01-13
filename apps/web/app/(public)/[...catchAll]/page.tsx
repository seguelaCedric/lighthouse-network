import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import { HireLandingPage } from '@/components/seo/HireLandingPage'
import { CornerstonePage } from '@/components/seo/CornerstonePage'
import { generateMetadata as genMeta } from '@/lib/seo/metadata'
import { cache } from 'react'
import { getLandingPageExperiments } from '@/lib/ab-testing/assignment.server'
import type { LandingPageExperiments } from '@/lib/ab-testing/types'

interface Props {
  params: Promise<{ catchAll: string[] }>
}

// Cache the page lookup for performance
const getPage = cache(async (urlPath: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('seo_landing_pages')
    .select('*')
    .eq('original_url_path', urlPath)
    .eq('is_active', true)
    .single()

  return data
})

// Cache cornerstone page lookup (for hub pages like /hire-a-captain)
const getCornerstonePage = cache(async (positionSlug: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('seo_cornerstone_pages')
    .select('*')
    .eq('position_slug', positionSlug)
    .eq('is_active', true)
    .single()
  return data
})

// Cache location pages lookup for cornerstone pages
const getLocationPages = cache(async (positionSlug: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('seo_landing_pages')
    .select('id, original_url_path, city, state, country, hero_headline')
    .eq('position_slug', positionSlug)
    .eq('is_active', true)
    .order('country', { ascending: true })
    .order('city', { ascending: true })
    .limit(100)
  return data || []
})

// Cache blog posts lookup for cornerstone pages
const getBlogPosts = cache(async (targetPosition: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, content_type')
    .eq('target_position', targetPosition)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(12)
  return data || []
})

// Map position slugs to blog post target_position values
const SLUG_TO_BLOG_POSITION: Record<string, string> = {
  'butler': 'Butler',
  'house-manager': 'House Manager',
  'pa': 'Personal Assistant',
  'private-chef': 'Private Chef',
  'personal-assistant': 'Personal Assistant',
  'estate-manager': 'Estate Manager',
  'nanny': 'Nanny',
  'housekeeper': 'Housekeeper',
  'governess': 'Governess',
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
}

// Related page type
interface RelatedPage {
  id: string;
  original_url_path: string;
  position: string;
  position_slug: string;
  city: string | null;
  state: string | null;
  country: string;
  hero_headline: string;
}

// Fetch related pages for internal linking
const getRelatedPages = cache(async (pageId: string) => {
  const supabase = await createClient()

  // Get related positions (same location, different position)
  const { data: relatedPositions } = await supabase
    .from('seo_page_relationships')
    .select(`
      related_page:seo_landing_pages!seo_page_relationships_related_page_id_fkey (
        id,
        original_url_path,
        position,
        position_slug,
        city,
        state,
        country,
        hero_headline
      )
    `)
    .eq('page_id', pageId)
    .eq('relationship_type', 'related_position')
    .order('priority', { ascending: false })
    .limit(6)

  // Get related locations (same position, different location)
  const { data: relatedLocations } = await supabase
    .from('seo_page_relationships')
    .select(`
      related_page:seo_landing_pages!seo_page_relationships_related_page_id_fkey (
        id,
        original_url_path,
        position,
        position_slug,
        city,
        state,
        country,
        hero_headline
      )
    `)
    .eq('page_id', pageId)
    .eq('relationship_type', 'same_position')
    .order('priority', { ascending: false })
    .limit(6)

  // Extract and flatten the related_page objects
  // Handle both array and object cases from Supabase joins
  const extractedPositions: RelatedPage[] = (relatedPositions || [])
    .map(r => r.related_page)
    .flat()
    .filter((p): p is RelatedPage => p !== null && typeof p === 'object' && 'id' in p)

  const extractedLocations: RelatedPage[] = (relatedLocations || [])
    .map(r => r.related_page)
    .flat()
    .filter((p): p is RelatedPage => p !== null && typeof p === 'object' && 'id' in p)

  return {
    relatedPositions: extractedPositions,
    relatedLocations: extractedLocations,
  }
})

// Fetch content links
const getContentLinks = cache(async (pageId: string) => {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('seo_content_links')
    .select('*')
    .eq('page_id', pageId)
    .order('priority', { ascending: false })
    .limit(12)

  return data || []
})

// Build URL path from segments
function buildUrlPath(slugParts: string[]): string {
  return slugParts.join('/')
}

// Check if this looks like a WordPress SEO page URL
function isHirePageUrl(firstSegment: string): boolean {
  return firstSegment.startsWith('hire-a-')
}

// ISR: Revalidate pages every hour
export const revalidate = 3600

// Dynamic rendering for on-demand page generation
export const dynamicParams = true

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { catchAll } = await params

  // Only handle hire-a-* URLs
  if (!catchAll[0] || !isHirePageUrl(catchAll[0])) {
    return genMeta({
      title: 'Page Not Found | Lighthouse Careers',
      noindex: true,
    })
  }

  // Handle cornerstone pages (single segment like /hire-a-captain/)
  if (catchAll.length === 1) {
    const positionSlug = catchAll[0].replace('hire-a-', '')
    const cornerstone = await getCornerstonePage(positionSlug)

    if (cornerstone) {
      return {
        title: cornerstone.meta_title,
        description: cornerstone.meta_description,
        openGraph: {
          title: cornerstone.meta_title,
          description: cornerstone.meta_description,
          type: 'website',
        },
      }
    }

    return genMeta({
      title: 'Page Not Found | Lighthouse Careers',
      noindex: true,
    })
  }

  const urlPath = buildUrlPath(catchAll)
  const page = await getPage(urlPath)

  if (!page) {
    return genMeta({
      title: 'Page Not Found | Lighthouse Careers',
      noindex: true,
    })
  }

  // Extract content snippet for enhanced description
  const contentSnippet = page.about_position
    ? page.about_position.replace(/<[^>]*>/g, '').substring(0, 200) + '...'
    : page.meta_description;

  // Build keywords meta
  const keywords = [
    ...(page.primary_keywords || []),
    ...(page.secondary_keywords || []),
    `hire ${page.position}`,
    `${page.position} ${page.city || page.state || page.country}`,
    `${page.position} recruitment`,
    `${page.position} placement`,
  ].filter(Boolean) as string[];

  return genMeta({
    title: page.meta_title,
    description: page.meta_description,
    keywords: keywords,
    canonical: page.canonical_url || `https://lighthouse-careers.com/${urlPath}/`,
    openGraph: {
      title: page.meta_title,
      description: contentSnippet,
      type: 'website',
      url: `https://lighthouse-careers.com/${urlPath}/`,
      images: [
        {
          url: `https://lighthouse-careers.com/images/og-hire-${page.position_slug}.jpg`,
          width: 1200,
          height: 630,
          alt: page.meta_title,
        },
      ],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.meta_title,
      description: contentSnippet,
      images: [`https://lighthouse-careers.com/images/og-hire-${page.position_slug}.jpg`],
    },
  })
}

export default async function CatchAllPage({ params }: Props) {
  const { catchAll } = await params

  // If it doesn't look like a hire page URL, 404
  if (!catchAll[0] || !isHirePageUrl(catchAll[0])) {
    notFound()
  }

  // Hub pages (single segment like /hire-a-captain/) - check for cornerstone page
  if (catchAll.length === 1) {
    const positionSlug = catchAll[0].replace('hire-a-', '')
    const cornerstone = await getCornerstonePage(positionSlug)

    if (cornerstone) {
      // Get related data for cornerstone page
      const blogPositionName = SLUG_TO_BLOG_POSITION[positionSlug]
      const [locationPages, blogPosts] = await Promise.all([
        getLocationPages(positionSlug),
        blogPositionName ? getBlogPosts(blogPositionName) : Promise.resolve([]),
      ])

      return (
        <CornerstonePage
          data={cornerstone}
          locationPages={locationPages}
          blogPosts={blogPosts}
        />
      )
    }

    // No cornerstone page found - 404
    notFound()
  }

  const urlPath = buildUrlPath(catchAll)
  const page = await getPage(urlPath)

  if (!page) {
    notFound()
  }

  // Get visitor ID for A/B testing (set by middleware)
  const cookieStore = await cookies()
  const visitorId = cookieStore.get('ab_visitor_id')?.value

  // Get request headers for user agent
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || undefined
  const pageUrl = `/${urlPath}`

  // Build location string for experiments
  const locationString = [page.city, page.state, page.country]
    .filter(Boolean)
    .join(', ')

  // Fetch related pages, content links, and experiments in parallel
  const [relatedPages, contentLinks, experiments] = await Promise.all([
    getRelatedPages(page.id),
    getContentLinks(page.id),
    visitorId
      ? getLandingPageExperiments(
          visitorId,
          'hire_landing',
          page.position,
          locationString,
          pageUrl,
          userAgent
        )
      : Promise.resolve({} as LandingPageExperiments),
  ])

  return (
    <HireLandingPage
      data={page}
      relatedPositions={relatedPages.relatedPositions}
      relatedLocations={relatedPages.relatedLocations}
      contentLinks={contentLinks}
      experiments={experiments}
    />
  )
}
