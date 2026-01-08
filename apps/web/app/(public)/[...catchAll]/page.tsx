import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next'
import { HireLandingPage } from '@/components/seo/HireLandingPage'
import { generateMetadata as genMeta } from '@/lib/seo/metadata'
import { cache } from 'react'

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

  return {
    relatedPositions: relatedPositions?.map(r => r.related_page).filter(Boolean) || [],
    relatedLocations: relatedLocations?.map(r => r.related_page).filter(Boolean) || [],
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
  ].filter(Boolean).join(', ');

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
      siteName: 'Lighthouse Careers',
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

  const urlPath = buildUrlPath(catchAll)
  const page = await getPage(urlPath)

  if (!page) {
    notFound()
  }

  // Fetch related pages and content links in parallel
  const [relatedPages, contentLinks] = await Promise.all([
    getRelatedPages(page.id),
    getContentLinks(page.id),
  ])

  return (
    <HireLandingPage
      data={page}
      relatedPositions={relatedPages.relatedPositions}
      relatedLocations={relatedPages.relatedLocations}
      contentLinks={contentLinks}
    />
  )
}
