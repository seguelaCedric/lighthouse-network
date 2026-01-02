import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { HireLandingPage } from '@/components/seo/HireLandingPage'
import { cache } from 'react'

interface Props {
  params: Promise<{ slug: string[] }>
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

// Parse WordPress URL pattern: /hire-a-butler-australia/new-south-wale/sydney-2/
// Returns the original_url_path format for database lookup
function buildUrlPath(slugParts: string[]): string {
  return slugParts.join('/')
}

// ISR: Revalidate pages every hour (3600 seconds)
// This is critical for hundreds of thousands of pages - we can't pre-render all
export const revalidate = 3600

// Dynamic rendering - pages are generated on-demand and cached
export const dynamicParams = true

// For hundreds of thousands of pages, we DON'T use generateStaticParams
// Pages are rendered on first request and then cached via ISR
// Uncomment below only if you want to pre-render a subset (e.g., top 1000 pages)
/*
export async function generateStaticParams() {
  const supabase = await createClient()
  const { data: pages } = await supabase
    .from('seo_landing_pages')
    .select('original_url_path')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1000) // Only pre-render top 1000 pages

  return pages?.map(p => ({
    slug: p.original_url_path.split('/').filter(Boolean)
  })) ?? []
}
*/

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const urlPath = buildUrlPath(slug)
  const page = await getPage(urlPath)

  if (!page) {
    return {
      title: 'Page Not Found | Lighthouse Careers',
    }
  }

  return {
    title: page.meta_title,
    description: page.meta_description,
    alternates: {
      canonical: page.canonical_url || `https://lighthouse-careers.com/hire/${urlPath}/`,
    },
    openGraph: {
      title: page.meta_title,
      description: page.meta_description,
      type: 'website',
      url: `https://lighthouse-careers.com/hire/${urlPath}/`,
      siteName: 'Lighthouse Careers',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.meta_title,
      description: page.meta_description,
    },
  }
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  const urlPath = buildUrlPath(slug)
  const page = await getPage(urlPath)

  if (!page) {
    notFound()
  }

  return <HireLandingPage data={page} />
}
