import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lighthouse-careers.com";

// Create a service client for server-side sitemap generation
function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(supabaseUrl, supabaseServiceKey);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient();

  // Fetch all public jobs for dynamic sitemap entries
  const { data: jobs } = await supabase
    .from("public_jobs")
    .select("id, published_at")
    .order("published_at", { ascending: false })
    .limit(500);

  // Fetch SEO landing pages
  const { data: seoPages } = await supabase
    .from("seo_landing_pages")
    .select("original_url_path, updated_at")
    .eq("is_active", true)
    .limit(1000);

  // Fetch published blog posts
  const { data: blogPosts } = await supabase
    .from("blog_posts")
    .select("slug, published_at, updated_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(500);

  // Get unique positions for hub pages
  const { data: positions } = await supabase
    .from("seo_landing_pages")
    .select("position_slug")
    .eq("is_active", true)
    .not("position_slug", "is", null);

  // Get unique locations for hub pages (city, state, country)
  const { data: locations } = await supabase
    .from("seo_landing_pages")
    .select("city_slug, state_slug, country_slug")
    .eq("is_active", true);

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/job-board`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/match`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/employer`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  // Dynamic job pages
  const jobPages: MetadataRoute.Sitemap = (jobs || []).map((job) => ({
    url: `${baseUrl}/job-board/${job.id}`,
    lastModified: job.published_at ? new Date(job.published_at) : new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // SEO landing pages
  const landingPages: MetadataRoute.Sitemap = (seoPages || []).map((page) => ({
    url: `${baseUrl}/${page.original_url_path}`,
    lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Blog posts
  const blogPages: MetadataRoute.Sitemap = (blogPosts || []).map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updated_at
      ? new Date(post.updated_at)
      : post.published_at
        ? new Date(post.published_at)
        : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Position hub pages
  const uniquePositions = new Set(
    (positions || []).map((p) => p.position_slug).filter(Boolean)
  );
  const positionHubPages: MetadataRoute.Sitemap = Array.from(uniquePositions).map(
    (positionSlug) => ({
      url: `${baseUrl}/hire-a-${positionSlug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })
  );

  // Location hub pages (from city, state, or country slugs)
  const uniqueLocations = new Set<string>();
  (locations || []).forEach((loc) => {
    if (loc.city_slug) uniqueLocations.add(loc.city_slug);
    if (loc.state_slug) uniqueLocations.add(loc.state_slug);
    if (loc.country_slug) uniqueLocations.add(loc.country_slug);
  });
  const locationHubPages: MetadataRoute.Sitemap = Array.from(uniqueLocations).map(
    (locationSlug) => ({
      url: `${baseUrl}/hire-in-${locationSlug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })
  );

  return [
    ...staticPages,
    ...jobPages,
    ...landingPages,
    ...blogPages,
    ...positionHubPages,
    ...locationHubPages,
  ];
}
