import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import { HireLandingPage } from '@/components/seo/HireLandingPage'
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

  // Hub pages (single segment like /hire-a-butler/) are handled by hire-a-[position] route
  // This catch-all only handles specific landing pages with locations (e.g., /hire-a-butler/london/)
  if (catchAll.length === 1) {
    notFound() // Let the hire-a-[position] route handle this
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
