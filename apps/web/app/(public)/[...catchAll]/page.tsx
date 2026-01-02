import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next'
import { HireLandingPage } from '@/components/seo/HireLandingPage'
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
    return { title: 'Page Not Found | Lighthouse Careers' }
  }

  const urlPath = buildUrlPath(catchAll)
  const page = await getPage(urlPath)

  if (!page) {
    return { title: 'Page Not Found | Lighthouse Careers' }
  }

  return {
    title: page.meta_title,
    description: page.meta_description,
    alternates: {
      canonical: page.canonical_url || `https://lighthouse-careers.com/${urlPath}/`,
    },
    openGraph: {
      title: page.meta_title,
      description: page.meta_description,
      type: 'website',
      url: `https://lighthouse-careers.com/${urlPath}/`,
      siteName: 'Lighthouse Careers',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.meta_title,
      description: page.meta_description,
    },
  }
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

  return <HireLandingPage data={page} />
}
